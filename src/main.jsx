import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  Bell,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dumbbell,
  ArrowLeft,
  LogOut,
  Menu,
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
import { exerciseSuggestions } from "./exerciseLibrary";
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
  requestNotificationAccess,
  listenForForegroundMessages,
} from "./firebase";
import { activateWaitingServiceWorker, registerAppServiceWorker } from "./pwa";

const maxFields = [
  { key: "backSquat", label: "Squat" },
  { key: "bench", label: "Bench" },
  { key: "deadlift", label: "Deadlift" },
  { key: "cleanJerk", label: "Clean and Jerk" },
  { key: "snatch", label: "Snatch" },
  { key: "frontSquat", label: "Front Squat" },
];

const appVersion = packageInfo.version;
const warmupPresets = [
  {
    id: "full-body",
    title: "Full body",
    exercises: ["Bike or row easy", "World's greatest stretch", "Empty bar complex"],
  },
  {
    id: "lower-body",
    title: "Lower body",
    exercises: ["Hip airplanes", "Goblet squat hold", "Empty bar squat"],
  },
  {
    id: "upper-body",
    title: "Upper body",
    exercises: ["Band pull-aparts", "Scap push-ups", "Empty bar press"],
  },
];

function formatTimer(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeExerciseSuggestion(value) {
  return value.includes(" - ") ? value.split(" - ").at(-1) : value;
}

function ExerciseAutocomplete({ value, onChange, placeholder, id }) {
  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(normalizeExerciseSuggestion(event.target.value))}
        list={id}
        placeholder={placeholder}
      />
      <datalist id={id}>
        {exerciseSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

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

function shiftDate(date, offset) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
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

function programTimelineSummary(workouts, logs) {
  const dates = [...new Set(workouts.map((item) => item.date))].sort();
  const summary = progressSummary(workouts, logs);
  return {
    ...summary,
    firstDate: dates[0] || "",
    lastDate: dates.at(-1) || "",
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
                    className={`date-tile ${workoutsByDate[date] ? "" : "empty"} ${logs[date]?.completed ? "completed" : ""} ${isOutsideMonth ? "outside-month" : ""} ${selectedDate === date && !isOutsideMonth ? "selected" : ""}`}
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

function WorkoutListView({ date, workoutGroups, logs, programs, onOpenWorkout, onAddWorkout, onChangeDate }) {
  const [swipeStart, setSwipeStart] = useState(null);
  const [showAddWorkoutOptions, setShowAddWorkoutOptions] = useState(false);
  const [selectedAddMode, setSelectedAddMode] = useState("new");
  const hasPlannedWorkout = workoutGroups.length > 0;
  const programName = (programId) => {
    if (!programId || programId === "default") return "Default Program";
    return programs.find((program) => program.id === programId)?.name || "Program";
  };
  const goToPreviousDay = () => onChangeDate(shiftDate(date, -1));
  const goToNextDay = () => onChangeDate(shiftDate(date, 1));

  function startSwipe(event) {
    if (event.pointerType === "mouse") return;
    setSwipeStart({ x: event.clientX, y: event.clientY });
  }

  function finishSwipe(event) {
    if (!swipeStart || event.pointerType === "mouse") return;
    const deltaX = event.clientX - swipeStart.x;
    const deltaY = event.clientY - swipeStart.y;
    setSwipeStart(null);
    if (Math.abs(deltaX) < 54 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    if (deltaX < 0) goToNextDay();
    else goToPreviousDay();
  }

  return (
    <section className="workout-list-panel" onPointerDown={startSwipe} onPointerUp={finishSwipe} onPointerCancel={() => setSwipeStart(null)}>
      <div className="section-heading workout-list-heading">
        <button className="icon-button" type="button" onClick={goToPreviousDay} aria-label="Previous day" title="Previous day">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="eyebrow">Swipe for nearby days</p>
          <h2>{formatDate(date)}</h2>
        </div>
        <button className="icon-button next-day-button" type="button" onClick={goToNextDay} aria-label="Next day" title="Next day">
          <ArrowLeft size={18} />
        </button>
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
      <button className="add-workout-button" type="button" onClick={() => setShowAddWorkoutOptions(true)}>
        <Plus size={20} />
        <div>
          <h3>Add workout</h3>
          <span>New, stored, or AI-generated workout</span>
        </div>
      </button>
      {showAddWorkoutOptions && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-workout-title">
            <div>
              <p className="eyebrow">{formatDate(date)}</p>
              <h2 id="add-workout-title">Add workout</h2>
            </div>
            <div className="choice-list" role="tablist" aria-label="Workout add options">
              <button className={selectedAddMode === "new" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("new")}>
                <strong>New workout</strong>
                <span>Start blank and add exercises yourself.</span>
              </button>
              <button className={selectedAddMode === "stored" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("stored")}>
                <strong>Stored workout</strong>
                <span>Reuse saved templates once the library is ready.</span>
              </button>
              <button className={selectedAddMode === "ai" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("ai")}>
                <strong>Generate workout</strong>
                <span>AI with guard rails for readiness, volume, and maxes.</span>
              </button>
            </div>
            {selectedAddMode === "new" ? (
              <div className="option-panel">
                <p>Create a blank workout for this day. You can add warm-ups, lifts, accessories, and cardio next.</p>
                <button className="primary" type="button" onClick={() => {
                  setShowAddWorkoutOptions(false);
                  onAddWorkout();
                }}>
                  <Plus size={18} />
                  Start blank workout
                </button>
              </div>
            ) : selectedAddMode === "stored" ? (
              <div className="option-panel">
                <p>Stored workout templates will live here. For now, this is the place-holder path for saved workouts.</p>
                <button className="secondary" type="button" disabled>
                  Stored workouts coming soon
                </button>
              </div>
            ) : (
              <div className="option-panel">
                <p>Generation will use guard rails like available maxes, recent completed volume, movement balance, and coach limits before inserting anything.</p>
                <textarea rows={3} placeholder="Example: light lower body day, 45 minutes, no maxing" />
                <button className="secondary" type="button" disabled>
                  Generate workout coming soon
                </button>
              </div>
            )}
            <button className="text-button" type="button" onClick={() => setShowAddWorkoutOptions(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
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
  const [warmupSetCounts, setWarmupSetCounts] = useState(initialDraft.warmupSetCounts || existing.warmupSetCounts || {});
  const [programmedSetCounts, setProgrammedSetCounts] = useState(initialDraft.programmedSetCounts || existing.programmedSetCounts || {});
  const [exerciseOverrides, setExerciseOverrides] = useState(initialDraft.exerciseOverrides || existing.exerciseOverrides || {});
  const [customExercises, setCustomExercises] = useState(initialDraft.customExercises || existing.customExercises || []);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddCardio, setShowAddCardio] = useState(false);
  const [newCardioName, setNewCardioName] = useState("");
  const [newCardioTracksWeight, setNewCardioTracksWeight] = useState(false);
  const [showAddWarmup, setShowAddWarmup] = useState(false);
  const [newWarmupName, setNewWarmupName] = useState("");
  const [newWarmupTracksWeight, setNewWarmupTracksWeight] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseTracksWeight, setNewExerciseTracksWeight] = useState(true);
  const [openExerciseMenu, setOpenExerciseMenu] = useState("");
  const [collapsedExercises, setCollapsedExercises] = useState({});
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
    setWarmupSetCounts(draft.warmupSetCounts || existing.warmupSetCounts || {});
    setProgrammedSetCounts(draft.programmedSetCounts || existing.programmedSetCounts || {});
    setExerciseOverrides(draft.exerciseOverrides || existing.exerciseOverrides || {});
    setCustomExercises(draft.customExercises || existing.customExercises || []);
    setShowAddExercise(false);
    setShowAddCardio(false);
    setNewCardioName("");
    setNewCardioTracksWeight(false);
    setShowAddWarmup(false);
    setNewWarmupName("");
    setNewWarmupTracksWeight(false);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setOpenExerciseMenu("");
    setCollapsedExercises({});
    setHydratedDraftFor(`${user.uid}:${date}:${workoutKey}`);
  }, [date, user.uid, workout.length, workoutKey]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}:${workoutKey}`) return;
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises });
    saveUserMaxes(user.uid, maxes);
  }, [customExercises, date, exerciseOverrides, hydratedDraftFor, loads, maxes, notes, programmedSetCounts, started, user.uid, warmupSetCounts, workoutKey]);

  async function persist(payload = {}, stateOverrides = {}) {
    const nextState = {
      maxes,
      loads,
      notes,
      warmupSetCounts,
      programmedSetCounts,
      exerciseOverrides,
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

  function addCardioExercise(event) {
    event.preventDefault();
    const name = newCardioName.trim();
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      customExercisePayload({ name, trackWeights: newCardioTracksWeight, section: "cardio", reps: "Time" }),
    ];
    setCustomExercises(nextExercises);
    setNewCardioName("");
    setNewCardioTracksWeight(false);
    setShowAddCardio(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function customExercisePayload({ name, trackWeights = true, section = "accessory", reps = "" }) {
    const createdAt = Date.now();
    return {
      id: `session-${createdAt}-${Math.random().toString(16).slice(2)}`,
      name,
      section,
      trackWeights,
      sets: [{ id: `${createdAt}-1`, reps, weight: "", done: false }],
    };
  }

  function addWarmupExercise(event) {
    event.preventDefault();
    const name = newWarmupName.trim();
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      customExercisePayload({ name, trackWeights: newWarmupTracksWeight, section: "warmup", reps: "Prep" }),
    ];
    setCustomExercises(nextExercises);
    setNewWarmupName("");
    setNewWarmupTracksWeight(false);
    setShowAddWarmup(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function addWarmupPreset(preset) {
    const nextExercises = [
      ...customExercises,
      ...preset.exercises.map((name) => customExercisePayload({ name, trackWeights: false, section: "warmup", reps: "Prep" })),
    ];
    setCustomExercises(nextExercises);
    setShowAddWarmup(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
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

  function exerciseMenuId(type, id) {
    return `${type}:${id}`;
  }

  function exerciseCollapseId(type, id) {
    return `${type}:${id}`;
  }

  function toggleExerciseCollapse(id) {
    setCollapsedExercises((current) => ({ ...current, [id]: !current[id] }));
  }

  function programmedSetSummary(item) {
    const reps = programmedRows(item).map((set) => loads[`${set.key}:reps`] ?? set.reps);
    return reps.length ? reps.join(", ") : "No sets";
  }

  function customSetSummary(exercise) {
    const reps = exercise.sets.map((set) => set.reps || "set");
    return reps.length ? reps.join(", ") : "No sets";
  }

  function isProgrammedExerciseComplete(item) {
    const programmedComplete = programmedRows(item).every((set) => Boolean(loads[`${set.key}:done`]));
    const warmups = warmupRows(item);
    const warmupsComplete = warmups.length === 0 || warmups.every((set) => Boolean(loads[`${set.key}:done`]));
    return programmedRows(item).length > 0 && programmedComplete && warmupsComplete;
  }

  function isCustomExerciseComplete(exercise) {
    return exercise.sets.length > 0 && exercise.sets.every((set) => Boolean(set.done));
  }

  function programmedExercise(item) {
    return {
      ...item,
      ...(exerciseOverrides[item.id] || {}),
    };
  }

  function persistExerciseOverrides(nextOverrides) {
    setExerciseOverrides(nextOverrides);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides: nextOverrides, customExercises });
    void persist({}, { exerciseOverrides: nextOverrides });
  }

  function updateProgrammedExercise(item, patch) {
    const current = exerciseOverrides[item.id] || {};
    const nextOverrides = {
      ...exerciseOverrides,
      [item.id]: { ...current, ...patch },
    };
    persistExerciseOverrides(nextOverrides);
  }

  function updateCustomExerciseField(exerciseId, patch) {
    const nextExercises = customExercises.map((exercise) => (
      exercise.id === exerciseId ? { ...exercise, ...patch } : exercise
    ));
    setCustomExercises(nextExercises);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function removeCustomExercise(exerciseId) {
    const nextExercises = customExercises.filter((exercise) => exercise.id !== exerciseId);
    setCustomExercises(nextExercises);
    setOpenExerciseMenu("");
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
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

  function warmupRows(item) {
    const count = warmupSetCounts[item.id] || 0;
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:warmup:${index + 1}`,
      repsKey: `${item.id}:warmup:${index + 1}:reps`,
      label: `Warm-up ${index + 1}`,
    }));
  }

  function addWarmupSet(item) {
    const nextCounts = {
      ...warmupSetCounts,
      [item.id]: (warmupSetCounts[item.id] || 0) + 1,
    };
    setWarmupSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts: nextCounts, programmedSetCounts, customExercises });
    void persist({}, { warmupSetCounts: nextCounts });
  }

  function removeWarmupSet(item) {
    const currentCount = warmupSetCounts[item.id] || 0;
    if (currentCount <= 0) return;
    const nextCounts = { ...warmupSetCounts, [item.id]: currentCount - 1 };
    if (nextCounts[item.id] <= 0) delete nextCounts[item.id];
    const removedSetKey = `${item.id}:warmup:${currentCount}`;
    const nextLoads = { ...loads };
    delete nextLoads[removedSetKey];
    delete nextLoads[`${removedSetKey}:done`];
    delete nextLoads[`${removedSetKey}:reps`];
    setWarmupSetCounts(nextCounts);
    setLoads(nextLoads);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads: nextLoads, notes, warmupSetCounts: nextCounts, programmedSetCounts, customExercises });
    void persist({}, { loads: nextLoads, warmupSetCounts: nextCounts });
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
              saveWorkoutDraft(user.uid, date, workoutKey, { started: true, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises });
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
            <div className="workout-warmup-row">
              <button className="secondary" type="button" onClick={() => setShowAddWarmup(true)}>
                <Plus size={18} />
                Add warm-up
              </button>
            </div>
            {isBlankWorkout && customExercises.length === 0 && (
              <p className="empty-list-copy">No exercises yet. Add the first exercise below.</p>
            )}
            {customExercises.filter((exercise) => exercise.section === "warmup").map((exercise) => (
              <div className={`exercise-row custom-exercise-row warmup-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Warm-up | Track weights" : "Warm-up | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this warm-up for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-edit-${exercise.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove warm-up
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
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
                  </div>
                </div>}
              </div>
            ))}
            {workout.map((item) => {
              const displayItem = programmedExercise(item);
              const menuId = exerciseMenuId("programmed", item.id);
              const collapseId = exerciseCollapseId("programmed", item.id);
              return (
              <div className={`exercise-row ${collapsedExercises[collapseId] ? "collapsed" : ""} ${collapsedExercises[collapseId] && isProgrammedExerciseComplete(item) ? "exercise-complete" : ""}`} key={item.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(collapseId)} role="button" tabIndex={0}>
                  <div>
                    <strong>{displayItem.exercise}</strong>
                    <small>{displayItem.intensity || "No intensity"} | {displayItem.notes || "No notes"}</small>
                    <span className="collapsed-set-summary">{programmedSetSummary(item)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === menuId ? "" : menuId);
                    }} aria-label={`Edit ${displayItem.exercise}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === menuId && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this programmed lift for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={displayItem.exercise} onChange={(value) => updateProgrammedExercise(item, { exercise: value })} id={`exercise-sub-${item.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <label>
                          Prescription
                          <input value={displayItem.prescription} onChange={(event) => updateProgrammedExercise(item, { prescription: event.target.value })} />
                        </label>
                        <label>
                          Intensity
                          <input value={displayItem.intensity || ""} onChange={(event) => updateProgrammedExercise(item, { intensity: event.target.value })} />
                        </label>
                        <label className="checkbox-field">
                          <input
                            checked={displayItem.trackWeights !== false}
                            onChange={(event) => updateProgrammedExercise(item, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[collapseId] && <div className="set-list">
                  <p>{displayItem.prescription}</p>
                  <div className="warmup-control-row">
                    <span>Warm-up sets</span>
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addWarmupSet(item)}>
                        <Plus size={16} />
                        Add
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeWarmupSet(item)} disabled={(warmupSetCounts[item.id] || 0) <= 0}>
                        <Minus size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                  {warmupRows(item).map((set) => (
                    <label className="set-row warmup-set-row tracked-set-row" key={set.key}>
                      <input
                        value={loads[set.repsKey] || ""}
                        onChange={(event) => setLoads({ ...loads, [set.repsKey]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder={set.label}
                      />
                      <input
                        value={loads[set.key] || ""}
                        onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Weight"
                      />
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  {programmedRows(item).map((set) => (
                    <label className={displayItem.trackWeights === false ? "set-row check-set-row" : "set-row tracked-set-row"} key={set.key}>
                      <input
                        value={loads[`${set.key}:reps`] ?? set.reps}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:reps`]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Reps"
                      />
                      {displayItem.trackWeights !== false && (
                        <input
                          value={loads[set.key] ?? (set.key.endsWith(":1") ? loads[item.id] || "" : "")}
                          onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                          onBlur={() => persist()}
                          placeholder={prescribedPreview(displayItem, maxes) || "Actual"}
                        />
                      )}
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
                </div>}
              </div>
              );
            })}
            {customExercises.filter((exercise) => exercise.section !== "warmup" && exercise.section !== "cardio").map((exercise) => (
              <div className={`exercise-row custom-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Session exercise | Track weights" : "Session exercise | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this added exercise for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-sub-${exercise.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove exercise
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
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
                  </div>
                </div>}
              </div>
            ))}
            <div className="add-exercise-row">
              <button className="secondary" type="button" onClick={() => setShowAddExercise(true)}>
                <Plus size={18} />
                Add exercise
              </button>
            </div>
            {customExercises.filter((exercise) => exercise.section === "cardio").map((exercise) => (
              <div className={`exercise-row custom-exercise-row cardio-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Cardio | Track numbers" : "Cardio | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit cardio">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change cardio</strong>
                          <span>Replaces this cardio piece for this session.</span>
                        </div>
                        <label>
                          New cardio
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-cardio-${exercise.id}`} />
                        </label>
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track numbers
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove cardio
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
                  {exercise.sets.map((set) => (
                    <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                      <input
                        value={set.reps}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Time / distance / rounds"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          onBlur={() => persist()}
                          placeholder="Score"
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
                  </div>
                </div>}
              </div>
            ))}
            <div className="add-exercise-row cardio-add-row">
              <button className="secondary" type="button" onClick={() => setShowAddCardio(true)}>
                <Plus size={18} />
                Add cardio
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
                    <ExerciseAutocomplete value={newExerciseName} onChange={setNewExerciseName} id="new-exercise-name" placeholder="Accessory, abs, RDL, extra pulls" />
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
          {showAddCardio && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-cardio-title">
                <div>
                  <p className="eyebrow">Workout cardio</p>
                  <h2 id="add-cardio-title">Add cardio</h2>
                </div>
                <form className="modal-form" onSubmit={addCardioExercise}>
                  <label>
                    Cardio name
                    <ExerciseAutocomplete value={newCardioName} onChange={setNewCardioName} id="new-cardio-name" placeholder="Bike finisher, easy jog, metcon placeholder" />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newCardioTracksWeight}
                      onChange={(event) => setNewCardioTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track score / distance
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add cardio
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddCardio(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {showAddWarmup && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-warmup-title">
                <div>
                  <p className="eyebrow">Workout warm-up</p>
                  <h2 id="add-warmup-title">Add warm-up</h2>
                </div>
                <div className="preset-grid">
                  {warmupPresets.map((preset) => (
                    <button className="preset-button" type="button" key={preset.id} onClick={() => addWarmupPreset(preset)}>
                      <strong>{preset.title}</strong>
                      <span>{preset.exercises.join(" | ")}</span>
                    </button>
                  ))}
                </div>
                <form className="modal-form" onSubmit={addWarmupExercise}>
                  <label>
                    Custom warm-up exercise
                    <ExerciseAutocomplete value={newWarmupName} onChange={setNewWarmupName} id="new-warmup-name" placeholder="Banded shoulder prep, hip flow, empty bar work" />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newWarmupTracksWeight}
                      onChange={(event) => setNewWarmupTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track weights used
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add custom warm-up
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddWarmup(false)}>
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

function SettingsPage({ user, programs, workouts, logs, serviceWorkerRegistration, updateRegistration, onApplyUpdate, onLogout }) {
  const [activeTab, setActiveTab] = useState("account");
  const [notificationState, setNotificationState] = useState(() => {
    if (!("Notification" in window)) return { status: "unsupported", message: "This browser does not support notifications." };
    return { status: Notification.permission, message: Notification.permission === "granted" ? "Notifications are allowed on this device." : "Notifications are off on this device." };
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const userEmail = (user.email || "").toLowerCase();
  const defaultProgram = { id: "default", name: "Default Program", athleteEmail: "dev-athlete@primitive.local" };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const athletePrograms = programOptions
    .filter((program) => (program.athleteEmail || "").toLowerCase() === userEmail)
    .map((program) => {
      const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
      const summary = programTimelineSummary(programWorkouts, logs);
      const isCurrent = summary.nextDate || (summary.lastDate && summary.lastDate >= new Date().toISOString().slice(0, 10));
      return { ...program, workouts: programWorkouts, summary, status: isCurrent ? "Current" : "Past" };
    })
    .sort((a, b) => (b.summary.lastDate || b.startDate || "").localeCompare(a.summary.lastDate || a.startDate || ""));
  const currentPrograms = athletePrograms.filter((program) => program.status === "Current");
  const pastPrograms = athletePrograms.filter((program) => program.status === "Past");
  const releaseNotes = [
    {
      title: "PWA install and updates",
      body: "Added the app manifest, icon, service worker registration, offline shell caching, and an update prompt when a new version is ready.",
    },
    {
      title: "Push notification foundation",
      body: "Added Firebase Cloud Messaging setup for foreground messages, background notifications, locked-phone delivery, notification click handling, and device token saving.",
    },
    {
      title: "Settings improvements",
      body: "Added notification controls, program history, app version visibility, and this release breakdown in one place.",
    },
    {
      title: "Coach and workout flow",
      body: "Kept the recent coach program tools, athlete progress views, profile updates, and workout logging refinements in the live build.",
    },
  ];

  function renderProgramCard(program) {
    const { summary } = program;
    return (
      <article className="program-card" key={program.id}>
        <div>
          <p className="eyebrow">{program.status}</p>
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
            <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All done"}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{summary.firstDate ? formatDate(summary.firstDate) : "Not scheduled"}</dd>
          </div>
          <div>
            <dt>Last</dt>
            <dd>{summary.lastDate ? formatDate(summary.lastDate) : "Not scheduled"}</dd>
          </div>
        </dl>
        {program.goal && <p className="program-note">{program.goal}</p>}
      </article>
    );
  }

  async function enableNotifications() {
    setSavingNotifications(true);
    try {
      const result = await requestNotificationAccess(user.uid, serviceWorkerRegistration);
      setNotificationState(result);
    } catch (error) {
      setNotificationState({ status: "error", message: error.message || "Could not enable notifications." });
    } finally {
      setSavingNotifications(false);
    }
  }

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

      <div className="settings-tabs" role="tablist" aria-label="Settings sections">
        <button className={activeTab === "account" ? "settings-tab active" : "settings-tab"} type="button" onClick={() => setActiveTab("account")} role="tab" aria-selected={activeTab === "account"}>
          <Settings size={17} />
          Account
        </button>
        <button className={activeTab === "programs" ? "settings-tab active" : "settings-tab"} type="button" onClick={() => setActiveTab("programs")} role="tab" aria-selected={activeTab === "programs"}>
          <ClipboardList size={17} />
          Programs
        </button>
        <button className={activeTab === "updates" ? "settings-tab active" : "settings-tab"} type="button" onClick={() => setActiveTab("updates")} role="tab" aria-selected={activeTab === "updates"}>
          <Bell size={17} />
          What's new
        </button>
      </div>

      {activeTab === "programs" ? (
        <div className="settings-programs" role="tabpanel">
          <div className="program-section">
            <div className="program-section-title">
              <h3>Current Programs</h3>
              <span>{currentPrograms.length}</span>
            </div>
            {currentPrograms.length ? (
              <div className="program-card-grid">
                {currentPrograms.map(renderProgramCard)}
              </div>
            ) : (
              <p className="empty-list-copy">No current programs assigned.</p>
            )}
          </div>

          <div className="program-section">
            <div className="program-section-title">
              <h3>Past Programs</h3>
              <span>{pastPrograms.length}</span>
            </div>
            {pastPrograms.length ? (
              <div className="program-card-grid">
                {pastPrograms.map(renderProgramCard)}
              </div>
            ) : (
              <p className="empty-list-copy">No past programs yet.</p>
            )}
          </div>
        </div>
      ) : activeTab === "updates" ? (
        <div className="settings-updates" role="tabpanel">
          <div className="whats-new-card">
            <div>
              <p className="eyebrow">Version {appVersion}</p>
              <h3>What's new</h3>
            </div>
            <div className="release-note-list">
              {releaseNotes.map((note) => (
                <article className="release-note" key={note.title}>
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-actions" role="tabpanel">
          <div className="settings-block">
            <div>
              <p className="eyebrow">Device</p>
              <h3>Notifications</h3>
              <p>{notificationState.message}</p>
            </div>
            <button className="secondary" type="button" onClick={enableNotifications} disabled={savingNotifications || notificationState.status === "granted"}>
              <Bell size={18} />
              {savingNotifications ? "Enabling..." : notificationState.status === "granted" ? "Enabled" : "Enable notifications"}
            </button>
          </div>
          {updateRegistration && (
            <div className="settings-block">
              <div>
                <p className="eyebrow">App update</p>
                <h3>New version ready</h3>
                <p>Restart the app to load the newest installed version.</p>
              </div>
              <button className="primary" type="button" onClick={onApplyUpdate}>
                Update now
              </button>
            </div>
          )}
          <button className="secondary" type="button" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      )}

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
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [timerMode, setTimerMode] = useState("countup");
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [intervalWorkSeconds, setIntervalWorkSeconds] = useState(60);
  const [intervalRestSeconds, setIntervalRestSeconds] = useState(30);
  const [intervalPhase, setIntervalPhase] = useState("work");
  const [intervalRounds, setIntervalRounds] = useState(5);
  const [intervalCurrentRound, setIntervalCurrentRound] = useState(1);
  const [intervalEndless, setIntervalEndless] = useState(true);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [timerPressHandled, setTimerPressHandled] = useState(false);
  const [lastTimerTap, setLastTimerTap] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerBankedSeconds, setTimerBankedSeconds] = useState(0);
  const [timerNow, setTimerNow] = useState(Date.now());
  const timerRunning = Boolean(timerStartedAt);
  const timerElapsedSeconds = timerBankedSeconds + (timerRunning ? Math.floor((timerNow - timerStartedAt) / 1000) : 0);
  const activeIntervalSeconds = intervalPhase === "work" ? intervalWorkSeconds : intervalRestSeconds;
  const timerSeconds = timerMode === "countup" ? timerElapsedSeconds : Math.max(0, (timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds) - timerElapsedSeconds);
  const timerLabel = timerMode === "interval" ? `${intervalPhase === "work" ? "W" : "R"}${intervalEndless ? "" : intervalCurrentRound} ${formatTimer(timerSeconds)}` : formatTimer(timerSeconds);
  const countdownMinutes = Math.floor(countdownSeconds / 60);
  const countdownRemainderSeconds = countdownSeconds % 60;

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

  useEffect(() => {
    registerAppServiceWorker(setUpdateRegistration)
      .then(setServiceWorkerRegistration)
      .catch((error) => console.warn("Service worker registration failed.", error));
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let unsubscribe = () => {};
    let active = true;

    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Primitive Programming";
      const body = payload.notification?.body || payload.data?.body || "New training update received.";
      setNotificationMessage(`${title}: ${body}`);
      window.setTimeout(() => setNotificationMessage(""), 5000);
    }).then((nextUnsubscribe) => {
      if (active) unsubscribe = nextUnsubscribe;
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerMode === "countup") return;
    const targetSeconds = timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds;
    if (timerElapsedSeconds < targetSeconds) return;

    if (timerMode === "interval") {
      if (intervalPhase === "work") {
        setIntervalPhase("rest");
      } else {
        const nextRound = intervalCurrentRound + 1;
        if (!intervalEndless && nextRound > intervalRounds) {
          setIntervalPhase("work");
          setIntervalCurrentRound(1);
        } else {
          setIntervalPhase("work");
          setIntervalCurrentRound(nextRound);
        }
      }
    }
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }, [activeIntervalSeconds, countdownSeconds, intervalCurrentRound, intervalEndless, intervalPhase, intervalRounds, timerElapsedSeconds, timerMode, timerRunning]);

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

  function applyAppUpdate() {
    activateWaitingServiceWorker(updateRegistration);
  }

  function resetTimer() {
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setTimerNow(Date.now());
    if (timerMode === "interval") {
      setIntervalPhase("work");
      setIntervalCurrentRound(1);
    }
  }

  function toggleTimer() {
    if (timerRunning) {
      setTimerBankedSeconds(timerElapsedSeconds);
      setTimerStartedAt(null);
      return;
    }
    setTimerStartedAt(Date.now());
    setTimerNow(Date.now());
  }

  function startTimerPress() {
    setTimerPressHandled(false);
    const timeoutId = window.setTimeout(() => {
      setTimerPressHandled(true);
      setShowTimerSettings(true);
    }, 550);
    setLongPressTimer(timeoutId);
  }

  function endTimerPress() {
    if (longPressTimer) window.clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }

  function handleTimerClick() {
    if (timerPressHandled) {
      setTimerPressHandled(false);
      return;
    }
    const now = Date.now();
    if (now - lastTimerTap < 320) {
      setLastTimerTap(0);
      resetTimer();
      return;
    }
    setLastTimerTap(now);
    toggleTimer();
  }

  function changeTimerMode(mode) {
    setTimerMode(mode);
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setIntervalPhase("work");
    setIntervalCurrentRound(1);
  }

  function updateCountdownPart(part, value) {
    const numericValue = Math.max(0, Number(value) || 0);
    const nextMinutes = part === "minutes" ? numericValue : countdownMinutes;
    const nextSeconds = part === "seconds" ? Math.min(59, numericValue) : countdownRemainderSeconds;
    setCountdownSeconds(Math.max(1, (nextMinutes * 60) + nextSeconds));
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }

  function openMenuView(nextView) {
    setView(nextView);
    setShowNavMenu(false);
  }

  if (checking) return <main className="loading">Loading...</main>;
  if (!user) return <AuthCard onAuthed={hydrateUser} />;

  return (
    <main className="app-shell">
      <nav className="top-nav">
        <button className="nav-button nav-icon menu-button" type="button" onClick={() => setShowNavMenu(true)} aria-label="Open menu" title="Menu">
          <Menu size={19} />
        </button>
        <div className="nav-brand">
          <Dumbbell size={22} />
          <span>Primitive</span>
        </div>
        <div className="nav-actions">
          <button
            className={timerRunning ? "nav-button timer-button active" : "nav-button timer-button"}
            onClick={handleTimerClick}
            onPointerDown={startTimerPress}
            onPointerUp={endTimerPress}
            onPointerCancel={endTimerPress}
            onPointerLeave={endTimerPress}
            type="button"
            aria-label={timerRunning ? `Stop timer at ${timerLabel}` : `Start timer at ${timerLabel}`}
            title="Tap start/stop, double tap reset, long press settings"
          >
            <Clock size={17} />
            <span>{timerLabel}</span>
          </button>
          {view !== "client" && (
            <button className="nav-button" onClick={() => setView("client")} type="button">
              <ArrowLeft size={17} />
              Back
            </button>
          )}
          {isTrainer && (
            <>
              <button
                className={view === "athletes" ? "nav-button nav-icon active" : "nav-button nav-icon"}
                onClick={() => setView(view === "athletes" ? "client" : "athletes")}
                type="button"
                aria-label="View all athletes"
                title="Athletes"
              >
                <UsersRound size={17} />
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

      {showNavMenu && (
        <div className="nav-menu-backdrop" role="presentation" onClick={() => setShowNavMenu(false)}>
          <div className="nav-menu-panel" role="dialog" aria-modal="true" aria-label="Main menu" onClick={(event) => event.stopPropagation()}>
            <div className="nav-menu-header">
              <Dumbbell size={22} />
              <strong>Primitive</strong>
            </div>
            <button className="menu-link" type="button" onClick={() => openMenuView("client")}>
              <CalendarDays size={18} />
              Home
            </button>
            <button className="menu-link" type="button" onClick={() => openMenuView("profile")}>
              <UserRound size={18} />
              Profile
            </button>
            <button className="menu-link" type="button" onClick={() => openMenuView("settings")}>
              <Settings size={18} />
              Settings
            </button>
            <button className="menu-link" type="button" onClick={() => openMenuView("maxes")}>
              <Trophy size={18} />
              Maxes
            </button>
            {isTrainer && (
              <>
                <button className="menu-link" type="button" onClick={() => openMenuView("programs")}>
                  <ClipboardList size={18} />
                  Programs
                </button>
                <button className="menu-link" type="button" onClick={() => openMenuView("athletes")}>
                  <UsersRound size={18} />
                  Athletes
                </button>
              </>
            )}
            <button className="text-button menu-close-button" type="button" onClick={() => setShowNavMenu(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {showTimerSettings && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="timer-settings-title">
            <div>
              <p className="eyebrow">Timer</p>
              <h2 id="timer-settings-title">Timer settings</h2>
            </div>
            <div className="timer-mode-grid">
              <button className={timerMode === "countup" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countup")}>
                <strong>Count up</strong>
                <span>Tap to start from zero and stop whenever.</span>
              </button>
              <button className={timerMode === "countdown" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countdown")}>
                <strong>Countdown</strong>
                <span>Runs to zero, then stops.</span>
              </button>
              <button className={timerMode === "interval" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("interval")}>
                <strong>Intervals</strong>
                <span>Alternates work/rest each time it finishes.</span>
              </button>
            </div>
            {timerMode === "countdown" && (
              <div className="timer-settings-grid">
                <label>
                  Minutes
                  <input value={countdownMinutes} onChange={(event) => updateCountdownPart("minutes", event.target.value)} inputMode="numeric" />
                </label>
                <label>
                  Seconds
                  <input value={countdownRemainderSeconds} onChange={(event) => updateCountdownPart("seconds", event.target.value)} inputMode="numeric" />
                </label>
              </div>
            )}
            {timerMode === "interval" && (
              <>
                <div className="timer-settings-grid">
                  <label>
                    Work seconds
                    <input value={intervalWorkSeconds} onChange={(event) => setIntervalWorkSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
                  </label>
                  <label>
                    Rest seconds
                    <input value={intervalRestSeconds} onChange={(event) => setIntervalRestSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
                  </label>
                </div>
                <label className="checkbox-field">
                  <input
                    checked={intervalEndless}
                    onChange={(event) => {
                      setIntervalEndless(event.target.checked);
                      setIntervalCurrentRound(1);
                      setTimerStartedAt(null);
                      setTimerBankedSeconds(0);
                    }}
                    type="checkbox"
                  />
                  Endless intervals
                </label>
                {!intervalEndless && (
                  <label>
                    Rounds
                    <input value={intervalRounds} onChange={(event) => {
                      setIntervalRounds(Math.max(1, Number(event.target.value) || 1));
                      setIntervalCurrentRound(1);
                      setTimerStartedAt(null);
                      setTimerBankedSeconds(0);
                    }} inputMode="numeric" />
                  </label>
                )}
              </>
            )}
            <div className="timer-settings-actions">
              <button className="secondary" type="button" onClick={resetTimer}>
                Reset timer
              </button>
              <button className="primary" type="button" onClick={() => setShowTimerSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "profile" ? (
        <ProfilePage user={user} isTrainer={isTrainer} logs={logs} onOpenEdit={() => setView("edit-profile")} onOpenMaxes={() => setView("maxes")} onOpenSettings={() => setView("settings")} />
      ) : view === "edit-profile" ? (
        <ProfileEditPage user={user} onProfileSaved={handleProfileSaved} />
      ) : view === "maxes" ? (
        <MaxesPage user={user} />
      ) : view === "settings" ? (
        <SettingsPage
          user={user}
          programs={programs}
          workouts={[...importedProgram, ...customWorkouts, ...programWorkouts]}
          logs={logs}
          serviceWorkerRegistration={serviceWorkerRegistration}
          updateRegistration={updateRegistration}
          onApplyUpdate={applyAppUpdate}
          onLogout={handleLogout}
        />
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
        <WorkoutListView date={selectedDate} workoutGroups={selectedWorkoutGroups} logs={logs} programs={programs} onOpenWorkout={openWorkout} onAddWorkout={openBlankWorkout} onChangeDate={openWorkoutList} />
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
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
