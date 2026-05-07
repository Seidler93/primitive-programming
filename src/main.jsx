import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
  ArrowLeft,
  LogOut,
  PencilLine,
  Plus,
  Save,
  UserRound,
} from "lucide-react";
import "./styles.css";
import { importedProgram } from "./programData";
import {
  hasFirebaseConfig,
  isTrainerUser,
  loadCustomWorkouts,
  loadWorkoutLogs,
  login,
  loginDev,
  logout,
  observeAuth,
  saveCustomWorkout,
  saveWorkoutLog,
} from "./firebase";

const maxFields = [
  { key: "snatch", label: "Snatch" },
  { key: "cleanJerk", label: "Clean & Jerk" },
  { key: "backSquat", label: "Back Squat" },
  { key: "frontSquat", label: "Front Squat" },
];

function workoutDraftKey(userId, date) {
  return `primitive-programming:workout-draft:${userId}:${date}`;
}

function loadWorkoutDraft(userId, date) {
  try {
    const raw = localStorage.getItem(workoutDraftKey(userId, date));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveWorkoutDraft(userId, date, draft) {
  localStorage.setItem(workoutDraftKey(userId, date), JSON.stringify(draft));
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

function WorkoutView({ workout, date, user, logs, setLogs, onDone }) {
  const existing = logs[date] || {};
  const initialDraft = loadWorkoutDraft(user.uid, date);
  const savedMaxes = loadUserMaxes(user.uid);
  const [hydratedDraftFor, setHydratedDraftFor] = useState(`${user.uid}:${date}`);
  const [started, setStarted] = useState(initialDraft.started || false);
  const [maxes, setMaxes] = useState(initialDraft.maxes || existing.maxes || savedMaxes);
  const [loads, setLoads] = useState(initialDraft.loads || existing.loads || {});
  const [notes, setNotes] = useState(initialDraft.notes ?? existing.notes ?? "");
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const maxUnit = (key) => maxes[key]?.unit || "kg";
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxValue(key)));
  const workoutTitle = workout[0] ? `${workout[0].focus} - Week ${workout[0].week}` : "No workout";

  useEffect(() => {
    const draft = loadWorkoutDraft(user.uid, date);
    setStarted(draft.started || false);
    setMaxes(draft.maxes || existing.maxes || loadUserMaxes(user.uid));
    setLoads(draft.loads || existing.loads || {});
    setNotes(draft.notes ?? existing.notes ?? "");
    setHydratedDraftFor(`${user.uid}:${date}`);
  }, [date, user.uid]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}`) return;
    saveWorkoutDraft(user.uid, date, { started, maxes, loads, notes });
    saveUserMaxes(user.uid, maxes);
  }, [date, hydratedDraftFor, loads, maxes, notes, started, user.uid]);

  async function persist(payload = {}) {
    const next = { ...existing, maxes, loads, notes, ...payload, updatedAt: new Date().toISOString() };
    setLogs({ ...logs, [date]: next });
    await saveWorkoutLog(user.uid, date, next);
  }

  async function finishWorkout(payload = {}) {
    await persist(payload);
    onDone();
  }

  if (!workout.length) {
    return <section className="empty-state">No workout is scheduled for {formatDate(date)}.</section>;
  }

  return (
    <section className="workout-panel">
      {!started ? (
        <div className="start-panel">
          <div>
            <p className="eyebrow">{formatDate(date)} | {workout[0].phase}</p>
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
              saveWorkoutDraft(user.uid, date, { started: true, maxes, loads, notes });
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
              <p className="eyebrow">{formatDate(date)} | {workout[0].phase}</p>
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
            {workout.map((item) => (
              <div className="exercise-row" key={item.id}>
                <div>
                  <strong>{item.exercise}</strong>
                  <small>{item.intensity} | {item.notes}</small>
                </div>
                <div className="set-list">
                  <p>{item.prescription}</p>
                  {setRows(item).map((set) => (
                    <label className="set-row" key={set.key}>
                      <span>{set.reps}</span>
                      <input
                        value={loads[set.key] ?? (set.key.endsWith(":1") ? loads[item.id] || "" : "")}
                        onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder={prescribedPreview(item, maxes) || "Actual"}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <label className="notes-field">
            Session notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist()} rows={3} />
          </label>
          <button className="secondary" type="button" onClick={() => finishWorkout()}>
            <Save size={18} />
            Save workout
          </button>
        </>
      )}
    </section>
  );
}

function TrainerCreator({ onCreated }) {
  const [date, setDate] = useState("2026-05-11");
  const [focus, setFocus] = useState("");
  const [exercise, setExercise] = useState("");
  const [prescription, setPrescription] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [clientEmail, setClientEmail] = useState("default");

  async function submit(event) {
    event.preventDefault();
    const workout = {
      date,
      focus,
      exercise,
      prescription,
      intensity,
      notes,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`)),
      phase: "Custom",
      week: "Custom",
    };
    await saveCustomWorkout(clientEmail || "default", workout);
    setExercise("");
    setPrescription("");
    setIntensity("");
    setNotes("");
    onCreated();
  }

  return (
    <section className="creator-panel">
      <div className="section-heading">
        <PencilLine size={20} />
        <h2>Workout Creator</h2>
      </div>
      <form onSubmit={submit} className="creator-form">
        <label>
          Client program id or email
          <input value={clientEmail} onChange={(event) => setClientEmail(event.target.value)} />
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
          Add exercise
        </button>
      </form>
    </section>
  );
}

function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [logs, setLogs] = useState({});
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [selectedDate, setSelectedDate] = useState("2026-05-11");
  const [view, setView] = useState("client");

  async function hydrateUser(nextUser) {
    setUser(nextUser);
    if (nextUser) {
      setLogs(await loadWorkoutLogs(nextUser.uid));
      setIsTrainer(await isTrainerUser(nextUser));
      await refreshCustomWorkouts();
    }
  }

  async function refreshCustomWorkouts() {
    setCustomWorkouts(await loadCustomWorkouts("default"));
  }

  useEffect(() => {
    return observeAuth(async (nextUser) => {
      await hydrateUser(nextUser);
      setChecking(false);
    });
  }, []);

  const allWorkouts = useMemo(() => [...importedProgram, ...customWorkouts], [customWorkouts]);
  const workoutsByDate = useMemo(() => groupByDate(allWorkouts), [allWorkouts]);
  const workoutDates = useMemo(() => Object.keys(workoutsByDate).sort(), [workoutsByDate]);
  const calendarMonths = useMemo(() => calendarSections(workoutDates), [workoutDates]);
  const dates = useMemo(() => calendarMonths.flatMap((section) => section.dates), [calendarMonths]);
  const selectedWorkout = workoutsByDate[selectedDate] || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayTarget = workoutsByDate[today] ? today : dates.find((date) => date >= today) || dates[0];

  function openWorkout(date) {
    setSelectedDate(date);
    setView("workout");
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
          {view === "workout" && (
            <button className="nav-button" onClick={() => setView("client")} type="button">
              <ArrowLeft size={17} />
              Back
            </button>
          )}
          {isTrainer && (
            <button className={view === "trainer" ? "nav-button active" : "nav-button"} onClick={() => setView(view === "trainer" ? "client" : "trainer")} type="button">
              <PencilLine size={17} />
              Creator
            </button>
          )}
          <button className="nav-button" onClick={logout} type="button">
            <LogOut size={17} />
            Log out
          </button>
        </div>
      </nav>

      {view === "trainer" ? (
        <TrainerCreator onCreated={refreshCustomWorkouts} />
      ) : view === "workout" ? (
        <WorkoutView workout={selectedWorkout} date={selectedDate} user={user} logs={logs} setLogs={setLogs} onDone={() => setView("client")} />
      ) : (
        <>
          <div className="today-row">
            <button className="primary" type="button" onClick={() => openWorkout(todayTarget)}>
              <CalendarDays size={18} />
              View today's workout
            </button>
          </div>
          <CalendarStrip sections={calendarMonths} selectedDate={selectedDate} onSelectDate={openWorkout} logs={logs} workoutsByDate={workoutsByDate} />
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
