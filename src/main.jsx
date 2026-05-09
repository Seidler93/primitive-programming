import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Dumbbell,
  ArrowLeft,
  LogOut,
  Minus,
  PencilLine,
  Plus,
  Save,
  Settings,
  Trophy,
  UserRound,
  UsersRound,
} from "lucide-react";
import "./styles.css";
import packageInfo from "../package.json";
import { importedProgram } from "./programData";
import {
  hasFirebaseConfig,
  isTrainerUser,
  loadCustomWorkouts,
  loadPrograms,
  loadUserProfile,
  loadWorkoutLogs,
  login,
  loginDev,
  logout,
  observeAuth,
  saveProgram,
  saveCustomWorkout,
  saveWorkoutLog,
  saveUserProfile,
} from "./firebase";

const maxFields = [
  { key: "backSquat", label: "Squat" },
  { key: "bench", label: "Bench" },
  { key: "deadlift", label: "Deadlift" },
  { key: "cleanJerk", label: "Clean and Jerk" },
  { key: "snatch", label: "Snatch" },
  { key: "frontSquat", label: "Front Squat" },
];

const appVersion = packageInfo.version;

function workoutDraftKey(userId, date, workoutKey = "default") {
  return `primitive-programming:workout-draft:${userId}:${date}:${workoutKey}`;
}

function loadWorkoutDraft(userId, date, workoutKey = "default") {
  try {
    const raw = localStorage.getItem(workoutDraftKey(userId, date, workoutKey));
    if (raw) return JSON.parse(raw);
    const legacyRaw = workoutKey === "default" ? null : localStorage.getItem(`primitive-programming:workout-draft:${userId}:${date}`);
    return legacyRaw ? JSON.parse(legacyRaw) : {};
  } catch {
    return {};
  }
}

function saveWorkoutDraft(userId, date, workoutKey, draft) {
  localStorage.setItem(workoutDraftKey(userId, date, workoutKey), JSON.stringify(draft));
}

function workoutLogKey(date, workoutKey) {
  return workoutKey === "blank" ? `${date}:custom` : date;
}

function userMaxesKey(userId) {
  return `primitive-programming:maxes:${userId}`;
}

function loadUserMaxes(userId) {
  try {
    const raw = localStorage.getItem(userMaxesKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserMaxes(userId, maxes) {
  localStorage.setItem(userMaxesKey(userId), JSON.stringify(maxes));
}

function mergeUserProfile(user, profile = {}) {
  if (!user?.uid) return user;
  return {
    ...user,
    uid: user.uid,
    email: profile.email || user.email || "",
    displayName: profile.displayName || user.displayName || "",
    photoURL: profile.photoURL || user.photoURL || "",
  };
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 512;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function groupByDate(items) {
  return items.reduce((map, item) => {
    map[item.date] = [...(map[item.date] || []), item];
    return map;
  }, {});
}

function workoutGroupKey(item) {
  return [
    item.programId || "default",
    item.date,
    item.week || "",
    item.phase || "",
    item.focus || "Workout",
  ].join("|");
}

function groupWorkouts(items) {
  return Object.values(items.reduce((map, item) => {
    const key = workoutGroupKey(item);
    if (!map[key]) {
      map[key] = {
        key,
        date: item.date,
        title: item.focus || "Workout",
        phase: item.phase || "Program",
        week: item.week,
        programId: item.programId || "default",
        items: [],
      };
    }
    map[key].items.push(item);
    return map;
  }, {}));
}

function dateRange(startDate, endDate) {
  const range = [];
  for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    range.push(day.toISOString().slice(0, 10));
  }
  return range;
}

function startOfWeekMonday(date) {
  const day = new Date(date);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

function endOfWeekSunday(date) {
  const day = new Date(date);
  const offset = (7 - day.getDay()) % 7;
  day.setDate(day.getDate() + offset);
  return day;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function calendarSections(workoutDates, todayValue = new Date()) {
  const today = new Date(todayValue);
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const latestWorkout = workoutDates
    .map((date) => new Date(`${date}T12:00:00`))
    .filter((date) => date >= startMonth)
    .sort((a, b) => b - a)[0];
  const endMonth = latestWorkout || startMonth;
  const sections = [];

  for (
    const month = new Date(startMonth);
    month <= endMonth;
    month.setMonth(month.getMonth() + 1)
  ) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
    sections.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthLabel(monthStart),
      month: monthStart.getMonth(),
      dates: dateRange(startOfWeekMonday(monthStart), endOfWeekSunday(monthEnd)),
    });
  }

  return sections;
}

function inferMaxKey(exercise, text = "") {
  const value = `${exercise} ${text}`.toLowerCase();
  if (value.includes("front squat")) return "frontSquat";
  if (value.includes("back squat")) return "backSquat";
  if (value.includes("squat")) return "backSquat";
  if (value.includes("bench")) return "bench";
  if (value.includes("deadlift")) return "deadlift";
  if (value.includes("clean") || value.includes("jerk")) return "cleanJerk";
  if (value.includes("snatch")) return "snatch";
  return "";
}

function percentages(item) {
  const text = `${item.prescription} ${item.intensity}`.replace(/–/g, "-");
  const matches = [...text.matchAll(/(\d{2,3})(?:-(\d{2,3}))?%/g)];
  return matches.map((match) => ({
    low: Number(match[1]),
    high: Number(match[2] || match[1]),
  }));
}

function highNumber(value) {
  const numbers = `${value}`.match(/\d+/g);
  return numbers ? Number(numbers[numbers.length - 1]) : 1;
}

function setRows(item) {
  const text = item.prescription.replace(/–/g, "-");
  const setsByReps = [...text.matchAll(/(\d+(?:-\d+)?)\s*x\s*(\d+(?:-\d+)?(?:\+\d+)*)/gi)].at(-1);
  if (setsByReps) {
    const count = Math.min(highNumber(setsByReps[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: setsByReps[2],
    }));
  }

  const setsOnly = /x\s*(\d+(?:-\d+)?)\s*sets?/i.exec(text);
  if (setsOnly) {
    const count = Math.min(highNumber(setsOnly[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: "set",
    }));
  }

  const singles = /(\d+(?:-\d+)?)\s*singles?/i.exec(text);
  if (singles) {
    const count = Math.min(highNumber(singles[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: "1",
    }));
  }

  return [{ key: `${item.id}:1`, reps: /single/i.test(text) ? "1" : item.prescription }];
}

function prescribedPreview(item, maxes) {
  const maxKey = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
  const max = Number(maxes[maxKey]?.value ?? maxes[maxKey]);
  const percents = percentages(item);
  if (!maxKey || !max || percents.length === 0) return "";
  const unit = maxes[maxKey]?.unit || "";
  return percents
    .slice(0, 2)
    .map(({ low, high }) => {
      const lowWeight = Math.round((max * low) / 100);
      const highWeight = Math.round((max * high) / 100);
      return low === high ? `${low}%: ${lowWeight}${unit}` : `${low}-${high}%: ${lowWeight}-${highWeight}${unit}`;
    })
    .join(" | ");
}

function programSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `program-${Date.now()}`;
}

function progressSummary(workouts, logs) {
  const dates = [...new Set(workouts.map((item) => item.date))].sort();
  const completed = dates.filter((date) => logs[date]?.completed).length;
  const nextDate = dates.find((date) => !logs[date]?.completed);
  return {
    total: dates.length,
    completed,
    percent: dates.length ? Math.round((completed / dates.length) * 100) : 0,
    nextDate,
  };
}

function needsMaxes(workout) {
  return [...new Set(workout.flatMap((item) => {
    const needs = percentages(item).length > 0 || /opener/i.test(`${item.prescription} ${item.intensity}`);
    const key = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
    return needs && key ? [key] : [];
  }))];
}

function AuthCard({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password, mode);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function devLogin(role) {
    setError("");
    const user = await loginDev(role);
    onAuthed(user);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-mark"><Dumbbell size={24} /></span>
          <div>
            <p>Primitive Programming</p>
            <h1>Training logs for lifters and coaches.</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            <UserRound size={18} />
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
        <div className="dev-login-row" aria-label="Development login options">
          <button className="secondary" type="button" onClick={() => devLogin("athlete")}>
            Dev Athlete
          </button>
          <button className="secondary" type="button" onClick={() => devLogin("coach")}>
            Dev Coach
          </button>
        </div>
        {!hasFirebaseConfig && <p className="demo-note">Demo mode is active until Firebase env vars are added.</p>}
      </section>
    </main>
  );
}

function CalendarStrip({ sections, selectedDate, onSelectDate, logs, workoutsByDate }) {
  return (
    <section className="calendar-band" aria-label="Workout calendar">
      <div className="section-heading">
        <CalendarDays size={20} />
        <h2>Calendar</h2>
      </div>
      <div className="month-stack">
        {sections.map((section) => (
          <div className="calendar-month" key={section.key}>
            <h3>{section.label}</h3>
            <div className="date-grid">
              {section.dates.map((date) => {
                const isOutsideMonth = new Date(`${date}T12:00:00`).getMonth() !== section.month;
                return (
                  <button
                    className={`date-tile ${workoutsByDate[date] ? "" : "empty"} ${isOutsideMonth ? "outside-month" : ""} ${selectedDate === date && !isOutsideMonth ? "selected" : ""}`}
                    key={`${section.key}-${date}`}
                    onClick={() => onSelectDate(date)}
                    type="button"
                  >
                    <span>{formatDate(date).slice(0, 3)}</span>
                    <strong>{new Date(`${date}T12:00:00`).getDate()}</strong>
                    {logs[date]?.completed && <CheckCircle2 className="complete-day-icon" size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WorkoutListView({ date, workoutGroups, logs, programs, onOpenWorkout, onAddWorkout }) {
  const hasPlannedWorkout = workoutGroups.length > 0;
  const programName = (programId) => {
    if (!programId || programId === "default") return "Default Program";
    return programs.find((program) => program.id === programId)?.name || "Program";
  };

  return (
    <section className="workout-list-panel">
      <div className="section-heading">
        <CalendarDays size={20} />
        <h2>{formatDate(date)}</h2>
      </div>
      {hasPlannedWorkout ? (
        <div className="workout-card-list">
          {workoutGroups.map((group) => (
            <button className="workout-card-button" type="button" key={group.key} onClick={() => onOpenWorkout(group.key)}>
              <div>
                <p className="eyebrow">{programName(group.programId)}</p>
                <h3>{group.title}</h3>
                <span>{group.week ? `Week ${group.week}` : group.phase} | {group.items.length} exercises</span>
              </div>
              {logs[date]?.completed ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-list-copy">No workouts are scheduled for this day.</p>
      )}
      <button className="add-workout-button" type="button" onClick={onAddWorkout}>
        <Plus size={20} />
        <div>
          <h3>Add workout</h3>
          <span>Create your own workout for this day</span>
        </div>
      </button>
    </section>
  );
}

function WorkoutView({ workout, workoutKey, date, user, logs, setLogs, onDone }) {
  const logKey = workoutLogKey(date, workoutKey);
  const existing = logs[logKey] || {};
  const initialDraft = loadWorkoutDraft(user.uid, date, workoutKey);
  const savedMaxes = loadUserMaxes(user.uid);
  const [hydratedDraftFor, setHydratedDraftFor] = useState(`${user.uid}:${date}:${workoutKey}`);
  const isBlankWorkout = workout.length === 0;
  const [started, setStarted] = useState(initialDraft.started || isBlankWorkout);
  const [maxes, setMaxes] = useState(initialDraft.maxes || existing.maxes || savedMaxes);
  const [loads, setLoads] = useState(initialDraft.loads || existing.loads || {});
  const [notes, setNotes] = useState(initialDraft.notes ?? existing.notes ?? "");
  const [programmedSetCounts, setProgrammedSetCounts] = useState(initialDraft.programmedSetCounts || existing.programmedSetCounts || {});
  const [customExercises, setCustomExercises] = useState(initialDraft.customExercises || existing.customExercises || []);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseTracksWeight, setNewExerciseTracksWeight] = useState(true);
  const [editingExerciseId, setEditingExerciseId] = useState("");
  const [editExerciseName, setEditExerciseName] = useState("");
  const [editExerciseTracksWeight, setEditExerciseTracksWeight] = useState(true);
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const maxUnit = (key) => maxes[key]?.unit || "kg";
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxValue(key)));
  const workoutPhase = workout[0]?.phase || "Custom workout";
  const workoutTitle = workout[0] ? `${workout[0].focus} - Week ${workout[0].week}` : "Create workout";

  useEffect(() => {
    const draft = loadWorkoutDraft(user.uid, date, workoutKey);
    setStarted(draft.started || workout.length === 0);
    setMaxes(draft.maxes || existing.maxes || loadUserMaxes(user.uid));
    setLoads(draft.loads || existing.loads || {});
    setNotes(draft.notes ?? existing.notes ?? "");
    setProgrammedSetCounts(draft.programmedSetCounts || existing.programmedSetCounts || {});
    setCustomExercises(draft.customExercises || existing.customExercises || []);
    setShowAddExercise(false);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setEditingExerciseId("");
    setEditExerciseName("");
    setEditExerciseTracksWeight(true);
    setHydratedDraftFor(`${user.uid}:${date}:${workoutKey}`);
  }, [date, user.uid, workout.length, workoutKey]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}:${workoutKey}`) return;
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, programmedSetCounts, customExercises });
    saveUserMaxes(user.uid, maxes);
  }, [customExercises, date, hydratedDraftFor, loads, maxes, notes, programmedSetCounts, started, user.uid, workoutKey]);

  async function persist(payload = {}, stateOverrides = {}) {
    const nextState = {
      maxes,
      loads,
      notes,
      programmedSetCounts,
      customExercises,
      ...stateOverrides,
    };
    const next = { ...existing, ...nextState, ...payload, updatedAt: new Date().toISOString() };
    setLogs({ ...logs, [logKey]: next });
    await saveWorkoutLog(user.uid, logKey, next);
  }

  async function finishWorkout(payload = {}) {
    await persist(payload);
    onDone();
  }

  function addCustomExercise(event) {
    event.preventDefault();
    const name = newExerciseName.trim();
    if (!name) return;
    setCustomExercises([
      ...customExercises,
      {
        id: `session-${Date.now()}`,
        name,
        trackWeights: newExerciseTracksWeight,
        sets: [{ id: `${Date.now()}-1`, reps: "", weight: "", done: false }],
      },
    ]);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setShowAddExercise(false);
  }

  function updateCustomExercise(exerciseId, updater) {
    setCustomExercises(customExercises.map((exercise) => (
      exercise.id === exerciseId ? updater(exercise) : exercise
    )));
  }

  function updateCustomSet(exerciseId, setId, patch) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    }));
  }

  function addCustomSet(exerciseId) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: [
        ...exercise.sets,
        { id: `${Date.now()}-${exercise.sets.length + 1}`, reps: exercise.sets.at(-1)?.reps || "", weight: "", done: false },
      ],
    }));
  }

  function removeCustomSet(exerciseId) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.length > 1 ? exercise.sets.slice(0, -1) : exercise.sets,
    }));
  }

  function programmedRows(item) {
    const rows = setRows(item);
    const count = Math.max(rows.length, programmedSetCounts[item.id] || rows.length);
    const lastReps = rows.at(-1)?.reps || item.prescription;
    return Array.from({ length: count }, (_, index) => rows[index] || {
      key: `${item.id}:${index + 1}`,
      reps: lastReps,
    });
  }

  function addProgrammedSet(item) {
    const nextCounts = {
      ...programmedSetCounts,
      [item.id]: programmedRows(item).length + 1,
    };
    setProgrammedSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, programmedSetCounts: nextCounts, customExercises });
    void persist({}, { programmedSetCounts: nextCounts });
  }

  function removeProgrammedSet(item) {
    const baseCount = setRows(item).length;
    const currentCount = programmedRows(item).length;
    if (currentCount <= baseCount) return;
    const nextCounts = { ...programmedSetCounts, [item.id]: currentCount - 1 };
    if (nextCounts[item.id] <= baseCount) delete nextCounts[item.id];
    setProgrammedSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, programmedSetCounts: nextCounts, customExercises });
    void persist({}, { programmedSetCounts: nextCounts });
  }

  function openEditExercise(exercise) {
    setEditingExerciseId(exercise.id);
    setEditExerciseName(exercise.name);
    setEditExerciseTracksWeight(exercise.trackWeights);
  }

  function saveEditedExercise(event) {
    event.preventDefault();
    const name = editExerciseName.trim();
    if (!name) return;
    updateCustomExercise(editingExerciseId, (exercise) => ({
      ...exercise,
      name,
      trackWeights: editExerciseTracksWeight,
    }));
    setEditingExerciseId("");
  }

  function removeEditedExercise() {
    setCustomExercises(customExercises.filter((exercise) => exercise.id !== editingExerciseId));
    setEditingExerciseId("");
  }

  return (
    <section className="workout-panel">
      {!started ? (
        <div className="start-panel">
          <div>
            <p className="eyebrow">{formatDate(date)} | {workoutPhase}</p>
            <h2>{workoutTitle}</h2>
          </div>
          {requiredMaxes.length > 0 && (
            <div className="max-grid">
              {requiredMaxes.map((key) => {
                const field = maxFields.find((item) => item.key === key);
                return (
                  <label key={key}>
                    {field.label} max
                    <span className="max-input-row">
                      <input
                        value={maxValue(key)}
                        onChange={(event) => setMaxes({ ...maxes, [key]: { value: event.target.value, unit: maxUnit(key) } })}
                        inputMode="decimal"
                        placeholder="Max"
                      />
                      <select
                        value={maxUnit(key)}
                        onChange={(event) => setMaxes({ ...maxes, [key]: { value: maxValue(key), unit: event.target.value } })}
                        aria-label={`${field.label} unit`}
                      >
                        <option value="kg">kg</option>
                        <option value="lb">lb</option>
                      </select>
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <button
            className="primary"
            type="button"
            disabled={missingMaxes.length > 0}
            onClick={() => {
              setStarted(true);
              saveWorkoutDraft(user.uid, date, workoutKey, { started: true, maxes, loads, notes, programmedSetCounts, customExercises });
            }}
          >
            <Dumbbell size={18} />
            Start workout
          </button>
        </div>
      ) : (
        <>
          <div className="workout-title-row">
            <div>
              <p className="eyebrow">{formatDate(date)} | {workoutPhase}</p>
              <h2>{workoutTitle}</h2>
            </div>
            <button className="icon-button" type="button" onClick={() => finishWorkout({ completed: true })} aria-label="Mark complete" title="Mark complete">
              <CheckCircle2 size={20} />
            </button>
          </div>
          <div className="exercise-table">
            <div className="table-head">
              <span>Exercise</span>
              <span>Sets</span>
            </div>
            {isBlankWorkout && customExercises.length === 0 && (
              <p className="empty-list-copy">No exercises yet. Add the first exercise below.</p>
            )}
            {workout.map((item) => (
              <div className="exercise-row" key={item.id}>
                <div>
                  <strong>{item.exercise}</strong>
                  <small>{item.intensity} | {item.notes}</small>
                </div>
                <div className="set-list">
                  <p>{item.prescription}</p>
                  {programmedRows(item).map((set) => (
                    <label className="set-row tracked-set-row" key={set.key}>
                      <span>{set.reps}</span>
                      <input
                        value={loads[set.key] ?? (set.key.endsWith(":1") ? loads[item.id] || "" : "")}
                        onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder={prescribedPreview(item, maxes) || "Actual"}
                      />
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addProgrammedSet(item)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeProgrammedSet(item)} disabled={programmedRows(item).length <= setRows(item).length}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {customExercises.map((exercise) => (
              <div className="exercise-row custom-exercise-row" key={exercise.id}>
                <div>
                  <strong>{exercise.name}</strong>
                  <small>{exercise.trackWeights ? "Session exercise | Track weights" : "Session exercise | Completion only"}</small>
                </div>
                <div className="set-list">
                  {exercise.sets.map((set) => (
                    <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                      <input
                        value={set.reps}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Reps"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          onBlur={() => persist()}
                          placeholder="Weight"
                        />
                      )}
                      <input
                        checked={set.done}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addCustomSet(exercise.id)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSet(exercise.id)} disabled={exercise.sets.length <= 1}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                    <button className="icon-button quiet-icon-button" type="button" onClick={() => openEditExercise(exercise)} aria-label={`Edit ${exercise.name}`} title="Edit exercise">
                      <PencilLine size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            <div className="add-exercise-row">
              <button className="secondary" type="button" onClick={() => setShowAddExercise(true)}>
                <Plus size={18} />
                Add exercise
              </button>
            </div>
          </div>
          <label className="notes-field">
            Session notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist()} rows={3} />
          </label>
          <button className="secondary" type="button" onClick={() => finishWorkout()}>
            <Save size={18} />
            Save workout
          </button>
          {showAddExercise && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-exercise-title">
                <div>
                  <p className="eyebrow">Session exercise</p>
                  <h2 id="add-exercise-title">Add exercise</h2>
                </div>
                <form className="modal-form" onSubmit={addCustomExercise}>
                  <label>
                    Exercise name
                    <input
                      value={newExerciseName}
                      onChange={(event) => setNewExerciseName(event.target.value)}
                      placeholder="Accessory, abs, extra pulls"
                      required
                    />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newExerciseTracksWeight}
                      onChange={(event) => setNewExerciseTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track weights used
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add exercise
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddExercise(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {editingExerciseId && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="edit-exercise-title">
                <div>
                  <p className="eyebrow">Session exercise</p>
                  <h2 id="edit-exercise-title">Edit exercise</h2>
                </div>
                <form className="modal-form" onSubmit={saveEditedExercise}>
                  <label>
                    Exercise name
                    <input
                      value={editExerciseName}
                      onChange={(event) => setEditExerciseName(event.target.value)}
                      required
                    />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={editExerciseTracksWeight}
                      onChange={(event) => setEditExerciseTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track weights used
                  </label>
                  <button className="primary" type="submit">
                    <Save size={18} />
                    Save changes
                  </button>
                  <button className="danger-button" type="button" onClick={removeEditedExercise}>
                    Remove exercise
                  </button>
                  <button className="text-button" type="button" onClick={() => setEditingExerciseId("")}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function ProgramsPage({ programs, workouts, logs, onProgramCreated, onWorkoutCreated }) {
  const [programName, setProgramName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("dev-athlete@primitive.local");
  const [startDate, setStartDate] = useState("2026-05-11");
  const [programGoal, setProgramGoal] = useState("");
  const [programNotes, setProgramNotes] = useState("");
  const [workoutProgramId, setWorkoutProgramId] = useState("default");
  const [date, setDate] = useState("2026-05-11");
  const [focus, setFocus] = useState("");
  const [exercise, setExercise] = useState("");
  const [prescription, setPrescription] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const defaultProgram = { id: "default", name: "Default Program", athleteEmail: "dev-athlete@primitive.local" };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const createdProgramIds = new Set(programs.map((program) => program.id));
  const visiblePrograms = programOptions.filter((program) => program.id === "default" || createdProgramIds.has(program.id));
  const currentWorkoutProgram = programOptions.find((program) => program.id === workoutProgramId) || defaultProgram;

  async function createProgram(event) {
    event.preventDefault();
    const program = {
      id: programSlug(programName),
      name: programName,
      athleteEmail,
      startDate,
      goal: programGoal,
      notes: programNotes,
      createdAt: new Date().toISOString(),
    };
    const savedProgram = await saveProgram(program);
    setWorkoutProgramId(savedProgram.id);
    setProgramName("");
    setProgramGoal("");
    setProgramNotes("");
    onProgramCreated();
  }

  async function createWorkout(event) {
    event.preventDefault();
    const workout = {
      date,
      focus,
      exercise,
      prescription,
      intensity,
      notes,
      programId: workoutProgramId || "default",
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`)),
      phase: currentWorkoutProgram.name,
      week: "Custom",
    };
    await saveCustomWorkout(workoutProgramId || "default", workout);
    setExercise("");
    setPrescription("");
    setIntensity("");
    setNotes("");
    onWorkoutCreated();
  }

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <ClipboardList size={20} />
        <h2>Programs</h2>
      </div>

      <div className="programs-layout">
        <div className="program-section">
          <div className="program-section-title">
            <h3>Created Programs</h3>
            <span>{visiblePrograms.length}</span>
          </div>
          <div className="program-card-grid">
            {visiblePrograms.map((program) => {
              const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
              const summary = progressSummary(programWorkouts, logs);
              return (
                <article className="program-card" key={program.id}>
                  <div>
                    <p className="eyebrow">{program.athleteEmail || "No athlete assigned"}</p>
                    <h4>{program.name}</h4>
                  </div>
                  <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                    <span style={{ width: `${summary.percent}%` }} />
                  </div>
                  <dl className="program-stats">
                    <div>
                      <dt>Complete</dt>
                      <dd>{summary.completed}/{summary.total}</dd>
                    </div>
                    <div>
                      <dt>Next</dt>
                      <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                    </div>
                  </dl>
                  {program.goal && <p className="program-note">{program.goal}</p>}
                </article>
              );
            })}
          </div>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Athlete Progress</h3>
          </div>
          <div className="progress-list">
            {visiblePrograms.map((program) => {
              const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
              const summary = progressSummary(programWorkouts, logs);
              return (
                <div className="progress-row" key={program.id}>
                  <div>
                    <strong>{program.athleteEmail || "Unassigned athlete"}</strong>
                    <span>{program.name}</span>
                  </div>
                  <b>{summary.percent}%</b>
                </div>
              );
            })}
          </div>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Create Program</h3>
          </div>
          <form onSubmit={createProgram} className="creator-form">
            <label>
              Program name
              <input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Summer Strength Block" required />
            </label>
            <label>
              Athlete email
              <input value={athleteEmail} onChange={(event) => setAthleteEmail(event.target.value)} type="email" />
            </label>
            <label>
              Start date
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label>
              Goal
              <input value={programGoal} onChange={(event) => setProgramGoal(event.target.value)} placeholder="Build volume before max-out week" />
            </label>
            <label className="wide">
              Coach notes
              <textarea value={programNotes} onChange={(event) => setProgramNotes(event.target.value)} rows={3} />
            </label>
            <button className="primary" type="submit">
              <Plus size={18} />
              Create program
            </button>
          </form>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Create Workout</h3>
          </div>
          <form onSubmit={createWorkout} className="creator-form">
            <label>
              Program
              <select value={workoutProgramId} onChange={(event) => setWorkoutProgramId(event.target.value)}>
                {programOptions.map((program) => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Workout name
              <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="Heavy Snatch + Back Squat" required />
            </label>
            <label>
              Exercise
              <input value={exercise} onChange={(event) => setExercise(event.target.value)} placeholder="Snatch" required />
            </label>
            <label>
              Reps / prescription
              <input value={prescription} onChange={(event) => setPrescription(event.target.value)} placeholder="4 x 2 @ 80%" required />
            </label>
            <label>
              Intensity
              <input value={intensity} onChange={(event) => setIntensity(event.target.value)} placeholder="75-85%" />
            </label>
            <label className="wide">
              Coach notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
            <button className="primary" type="submit">
              <Plus size={18} />
              Add workout exercise
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

function AthletesPage({ programs, workouts, logs }) {
  const defaultProgram = { id: "default", name: "Default Program", athleteEmail: "dev-athlete@primitive.local" };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const athletes = Array.from(
    programOptions.reduce((map, program) => {
      const email = program.athleteEmail || "Unassigned athlete";
      const current = map.get(email) || { email, programs: [], workouts: [] };
      const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
      current.programs.push(program);
      current.workouts.push(...programWorkouts);
      map.set(email, current);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => a.email.localeCompare(b.email));

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <UsersRound size={20} />
        <h2>Athletes</h2>
      </div>

      {athletes.length ? (
        <div className="program-card-grid">
          {athletes.map((athlete) => {
            const summary = progressSummary(athlete.workouts, logs);
            return (
              <article className="program-card" key={athlete.email}>
                <div>
                  <p className="eyebrow">{athlete.programs.length} program{athlete.programs.length === 1 ? "" : "s"}</p>
                  <h4>{athlete.email}</h4>
                </div>
                <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                  <span style={{ width: `${summary.percent}%` }} />
                </div>
                <dl className="program-stats">
                  <div>
                    <dt>Complete</dt>
                    <dd>{summary.completed}/{summary.total}</dd>
                  </div>
                  <div>
                    <dt>Next</dt>
                    <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                  </div>
                </dl>
                <p className="program-note">{athlete.programs.map((program) => program.name).join(", ")}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No athletes assigned yet.</p>
      )}
    </section>
  );
}

function ProfileAvatar({ user, iconSize = 34 }) {
  return (
    <span className="profile-avatar">
      {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={iconSize} />}
    </span>
  );
}

function ProfilePage({ user, isTrainer, logs, onOpenEdit, onOpenMaxes, onOpenSettings }) {
  const maxes = loadUserMaxes(user.uid);
  const completedCount = Object.values(logs).filter((log) => log.completed).length;
  const lastUpdated = Object.values(logs)
    .map((log) => log.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <section className="profile-panel">
      <div className="profile-header">
        <ProfileAvatar user={user} />
        <div>
          <p className="eyebrow">{isTrainer ? "Coach profile" : "Athlete profile"}</p>
          <h2>{user.displayName || user.email || "Profile"}</h2>
        </div>
      </div>

      <div className="profile-actions">
        <button className="primary" type="button" onClick={onOpenEdit}>
          <PencilLine size={18} />
          Edit
        </button>
        <button className="primary" type="button" onClick={onOpenMaxes}>
          <Trophy size={18} />
          Maxes
        </button>
        <button className="secondary" type="button" onClick={onOpenSettings}>
          <Settings size={18} />
          Settings
        </button>
      </div>

      <div className="profile-grid">
        <div className="profile-block">
          <h3>Account</h3>
          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email || "No email on file"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{isTrainer ? "Coach" : "Athlete"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{user.uid}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-block">
          <h3>Training</h3>
          <dl className="profile-list">
            <div>
              <dt>Completed workouts</dt>
              <dd>{completedCount}</dd>
            </div>
            <div>
              <dt>Logged sessions</dt>
              <dd>{Object.keys(logs).length}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{lastUpdated ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated)) : "Not logged yet"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="profile-block">
        <h3>Saved Maxes</h3>
        <div className="profile-max-grid">
          {maxFields.map((field) => {
            const max = maxes[field.key];
            const value = max?.value ?? max ?? "";
            const unit = max?.unit || "";
            return (
              <div className="profile-max" key={field.key}>
                <span>{field.label}</span>
                <strong>{value ? `${value}${unit}` : "-"}</strong>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function ProfileEditPage({ user, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageError, setImageError] = useState("");

  async function handlePictureUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    setSaved(false);
    try {
      setPhotoURL(await imageFileToDataUrl(file));
    } catch {
      setImageError("Could not read that picture.");
    }
  }

  async function persistProfile(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setImageError("");
    const profile = {
      displayName: displayName.trim(),
      email: email.trim(),
      photoURL: photoURL.trim(),
    };
    try {
      const savedProfile = await saveUserProfile(user.uid, profile);
      onProfileSaved(savedProfile);
      setSaved(true);
    } catch {
      setImageError("Could not save your profile picture.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <ProfileAvatar user={{ ...user, photoURL }} />
        <div>
          <p className="eyebrow">Profile details</p>
          <h2>Edit profile</h2>
        </div>
      </div>

      <form className="profile-edit-form" onSubmit={persistProfile}>
        <label>
          Name
          <input value={displayName} onChange={(event) => { setSaved(false); setDisplayName(event.target.value); }} placeholder="Your name" />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => { setSaved(false); setEmail(event.target.value); }} type="email" placeholder="you@example.com" />
        </label>
        <label className="wide">
          Profile picture URL
          <input value={photoURL} onChange={(event) => { setSaved(false); setPhotoURL(event.target.value); }} placeholder="https://..." />
        </label>
        <label className="wide">
          Upload profile picture
          <input type="file" accept="image/*" onChange={handlePictureUpload} />
        </label>
        <button className="primary" type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Save profile"}
        </button>
        {saved && <p className="save-status">Profile saved.</p>}
        {imageError && <p className="form-error">{imageError}</p>}
      </form>
    </section>
  );
}

function SettingsPage({ onLogout }) {
  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <Settings size={34} />
        </span>
        <div>
          <p className="eyebrow">Profile settings</p>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="settings-actions">
        <button className="secondary" type="button" onClick={onLogout}>
          <LogOut size={18} />
          Log out
        </button>
      </div>

      <p className="app-version">Version {appVersion}</p>
    </section>
  );
}

function MaxesPage({ user }) {
  const [maxes, setMaxes] = useState(() => loadUserMaxes(user.uid));
  const [saved, setSaved] = useState(false);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const maxUnit = (key) => maxes[key]?.unit || "kg";

  function updateMax(key, value, unit = maxUnit(key)) {
    setSaved(false);
    setMaxes({ ...maxes, [key]: { value, unit } });
  }

  function persistMaxes(event) {
    event.preventDefault();
    saveUserMaxes(user.uid, maxes);
    setSaved(true);
  }

  return (
    <section className="profile-panel maxes-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <Trophy size={34} />
        </span>
        <div>
          <p className="eyebrow">Profile maxes</p>
          <h2>Training max weights</h2>
        </div>
      </div>

      <form className="maxes-form" onSubmit={persistMaxes}>
        {maxFields.map((field) => (
          <label className="maxes-field" key={field.key}>
            {field.label}
            <span className="max-input-row">
              <input
                value={maxValue(field.key)}
                onChange={(event) => updateMax(field.key, event.target.value)}
                inputMode="decimal"
                placeholder="Max"
              />
              <select
                value={maxUnit(field.key)}
                onChange={(event) => updateMax(field.key, maxValue(field.key), event.target.value)}
                aria-label={`${field.label} unit`}
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </span>
          </label>
        ))}
        <button className="primary" type="submit">
          <Save size={18} />
          Save maxes
        </button>
        {saved && <p className="save-status">Maxes saved.</p>}
      </form>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [logs, setLogs] = useState({});
  const [athleteProgressLogs, setAthleteProgressLogs] = useState({});
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programWorkouts, setProgramWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2026-05-11");
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState("");
  const [view, setView] = useState("client");

  async function hydrateUser(nextUser) {
    if (!nextUser) {
      setUser(null);
      setLogs({});
      setAthleteProgressLogs({});
      setIsTrainer(false);
      setCustomWorkouts([]);
      setPrograms([]);
      setProgramWorkouts([]);
      return;
    }

    const profile = await loadUserProfile(nextUser.uid);
    const profiledUser = mergeUserProfile(nextUser, profile);
    setUser(profiledUser);

    const [nextLogs, nextTrainer, nextCustomWorkouts, nextPrograms] = await Promise.all([
      loadWorkoutLogs(nextUser.uid),
      isTrainerUser(nextUser),
      loadCustomWorkouts("default"),
      loadPrograms(),
    ]);

    setLogs(nextLogs);
    setIsTrainer(nextTrainer);
    setAthleteProgressLogs(nextTrainer ? await loadWorkoutLogs("dev-athlete") : nextLogs);
    setCustomWorkouts(nextCustomWorkouts);
    setPrograms(nextPrograms);
    const programWorkoutLists = await Promise.all(nextPrograms.map((program) => loadCustomWorkouts(program.id)));
    setProgramWorkouts(programWorkoutLists.flat());
  }

  async function refreshCustomWorkouts() {
    const [nextDefaultWorkouts, nextPrograms] = await Promise.all([
      loadCustomWorkouts("default"),
      loadPrograms(),
    ]);
    const programWorkoutLists = await Promise.all(nextPrograms.map((program) => loadCustomWorkouts(program.id)));
    setCustomWorkouts(nextDefaultWorkouts);
    setPrograms(nextPrograms);
    setProgramWorkouts(programWorkoutLists.flat());
  }

  useEffect(() => {
    return observeAuth((nextUser) => {
      setUser(mergeUserProfile(nextUser));
      setChecking(false);
      hydrateUser(nextUser);
    });
  }, []);

  const allWorkouts = useMemo(() => [...importedProgram, ...customWorkouts, ...programWorkouts], [customWorkouts, programWorkouts]);
  const workoutsByDate = useMemo(() => groupByDate(allWorkouts), [allWorkouts]);
  const workoutDates = useMemo(() => Object.keys(workoutsByDate).sort(), [workoutsByDate]);
  const calendarMonths = useMemo(() => calendarSections(workoutDates), [workoutDates]);
  const dates = useMemo(() => calendarMonths.flatMap((section) => section.dates), [calendarMonths]);
  const selectedWorkoutGroups = useMemo(() => groupWorkouts(workoutsByDate[selectedDate] || []), [selectedDate, workoutsByDate]);
  const selectedWorkout = selectedWorkoutKey === "blank"
    ? []
    : selectedWorkoutGroups.find((group) => group.key === selectedWorkoutKey)?.items || selectedWorkoutGroups[0]?.items || [];
  const activeWorkoutKey = selectedWorkoutKey || selectedWorkoutGroups[0]?.key || "blank";
  const today = new Date().toISOString().slice(0, 10);
  const todayTarget = workoutsByDate[today] ? today : dates.find((date) => date >= today) || dates[0];

  function openWorkoutList(date) {
    setSelectedDate(date);
    setSelectedWorkoutKey("");
    setView("workout-list");
  }

  function openWorkout(key) {
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openBlankWorkout() {
    setSelectedWorkoutKey("blank");
    setView("workout");
  }

  function handleProfileSaved(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
  }

  async function handleLogout() {
    await logout();
    setView("client");
    setUser(null);
    setLogs({});
    setAthleteProgressLogs({});
    setIsTrainer(false);
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setChecking(false);
  }

  if (checking) return <main className="loading">Loading...</main>;
  if (!user) return <AuthCard onAuthed={hydrateUser} />;

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <div className="nav-brand">
          <Dumbbell size={22} />
          <span>Primitive Programming</span>
        </div>
        <div className="nav-actions">
          {view !== "client" && (
            <button className="nav-button" onClick={() => setView("client")} type="button">
              <ArrowLeft size={17} />
              Back
            </button>
          )}
          {isTrainer && (
            <>
              <button
                className={view === "athletes" ? "nav-button active" : "nav-button"}
                onClick={() => setView(view === "athletes" ? "client" : "athletes")}
                type="button"
                title="View all athletes"
              >
                <UsersRound size={17} />
                Athletes
              </button>
              <button
                className={view === "programs" ? "nav-button nav-icon active" : "nav-button nav-icon"}
                onClick={() => setView(view === "programs" ? "client" : "programs")}
                type="button"
                aria-label="Open programs"
                title="Programs"
              >
                <ClipboardList size={17} />
              </button>
            </>
          )}
          <button className={view === "profile" ? "nav-button nav-icon active" : "nav-button nav-icon"} onClick={() => setView("profile")} type="button" aria-label="Open profile" title="Profile">
            <UserRound size={17} />
          </button>
        </div>
      </nav>

      {view === "profile" ? (
        <ProfilePage user={user} isTrainer={isTrainer} logs={logs} onOpenEdit={() => setView("edit-profile")} onOpenMaxes={() => setView("maxes")} onOpenSettings={() => setView("settings")} />
      ) : view === "edit-profile" ? (
        <ProfileEditPage user={user} onProfileSaved={handleProfileSaved} />
      ) : view === "maxes" ? (
        <MaxesPage user={user} />
      ) : view === "settings" ? (
        <SettingsPage onLogout={handleLogout} />
      ) : view === "programs" ? (
        <ProgramsPage
          programs={programs}
          workouts={[...importedProgram, ...customWorkouts, ...programWorkouts]}
          logs={athleteProgressLogs}
          onProgramCreated={refreshCustomWorkouts}
          onWorkoutCreated={refreshCustomWorkouts}
        />
      ) : view === "athletes" ? (
        <AthletesPage programs={programs} workouts={[...importedProgram, ...customWorkouts, ...programWorkouts]} logs={athleteProgressLogs} />
      ) : view === "workout-list" ? (
        <WorkoutListView date={selectedDate} workoutGroups={selectedWorkoutGroups} logs={logs} programs={programs} onOpenWorkout={openWorkout} onAddWorkout={openBlankWorkout} />
      ) : view === "workout" ? (
        <WorkoutView workout={selectedWorkout} workoutKey={activeWorkoutKey} date={selectedDate} user={user} logs={logs} setLogs={setLogs} onDone={() => setView("client")} />
      ) : (
        <>
          <div className="today-row">
            <button className="primary" type="button" onClick={() => openWorkoutList(todayTarget)}>
              <CalendarDays size={18} />
              View today's workout
            </button>
          </div>
          <CalendarStrip sections={calendarMonths} selectedDate={selectedDate} onSelectDate={openWorkoutList} logs={logs} workoutsByDate={workoutsByDate} />
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
