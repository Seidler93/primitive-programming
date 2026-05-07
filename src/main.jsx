import React, { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  CalendarDays,
  CheckCircle2,
  Dumbbell,
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

function prescribedPreview(item, maxes) {
  const maxKey = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
  const max = Number(maxes[maxKey]);
  const percents = percentages(item);
  if (!maxKey || !max || percents.length === 0) return "";
  return percents
    .slice(0, 2)
    .map(({ low, high }) => {
      const lowWeight = Math.round((max * low) / 100);
      const highWeight = Math.round((max * high) / 100);
      return low === high ? `${low}%: ${lowWeight}` : `${low}-${high}%: ${lowWeight}-${highWeight}`;
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
        {!hasFirebaseConfig && <p className="demo-note">Demo mode is active until Firebase env vars are added.</p>}
      </section>
    </main>
  );
}

function CalendarStrip({ dates, selectedDate, setSelectedDate, logs }) {
  return (
    <section className="calendar-band" aria-label="Workout calendar">
      <div className="section-heading">
        <CalendarDays size={20} />
        <h2>Calendar</h2>
      </div>
      <div className="date-grid">
        {dates.map((date) => (
          <button
            className={`date-tile ${selectedDate === date ? "selected" : ""}`}
            key={date}
            onClick={() => setSelectedDate(date)}
            type="button"
          >
            <span>{formatDate(date).split(",")[0]}</span>
            <strong>{new Date(`${date}T12:00:00`).getDate()}</strong>
            {logs[date]?.completed && <CheckCircle2 size={16} />}
          </button>
        ))}
      </div>
    </section>
  );
}

function WorkoutView({ workout, date, user, logs, setLogs }) {
  const existing = logs[date] || {};
  const [started, setStarted] = useState(false);
  const [maxes, setMaxes] = useState(existing.maxes || {});
  const [loads, setLoads] = useState(existing.loads || {});
  const [notes, setNotes] = useState(existing.notes || "");
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxes[key]));
  const workoutTitle = workout[0] ? `${workout[0].focus} - Week ${workout[0].week}` : "No workout";

  useEffect(() => {
    setStarted(false);
    setMaxes(existing.maxes || {});
    setLoads(existing.loads || {});
    setNotes(existing.notes || "");
  }, [date]);

  async function persist(payload = {}) {
    const next = { ...existing, maxes, loads, notes, ...payload, updatedAt: new Date().toISOString() };
    setLogs({ ...logs, [date]: next });
    await saveWorkoutLog(user.uid, date, next);
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
                    <input
                      value={maxes[key] || ""}
                      onChange={(event) => setMaxes({ ...maxes, [key]: event.target.value })}
                      inputMode="decimal"
                      placeholder="kg or lb"
                    />
                  </label>
                );
              })}
            </div>
          )}
          <button className="primary" type="button" disabled={missingMaxes.length > 0} onClick={() => setStarted(true)}>
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
            <button className="icon-button" type="button" onClick={() => persist({ completed: true })} aria-label="Mark complete" title="Mark complete">
              <CheckCircle2 size={20} />
            </button>
          </div>
          <div className="exercise-table">
            <div className="table-head">
              <span>Exercise</span>
              <span>Reps</span>
              <span>Weight</span>
            </div>
            {workout.map((item) => (
              <div className="exercise-row" key={item.id}>
                <div>
                  <strong>{item.exercise}</strong>
                  <small>{item.intensity} | {item.notes}</small>
                </div>
                <span>{item.prescription}</span>
                <input
                  value={loads[item.id] || ""}
                  onChange={(event) => setLoads({ ...loads, [item.id]: event.target.value })}
                  onBlur={() => persist()}
                  placeholder={prescribedPreview(item, maxes) || "Actual"}
                />
              </div>
            ))}
          </div>
          <label className="notes-field">
            Session notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist()} rows={3} />
          </label>
          <button className="secondary" type="button" onClick={() => persist()}>
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
  const dates = useMemo(() => Object.keys(workoutsByDate).sort(), [workoutsByDate]);
  const selectedWorkout = workoutsByDate[selectedDate] || [];
  const today = new Date().toISOString().slice(0, 10);
  const todayTarget = workoutsByDate[today] ? today : dates.find((date) => date >= today) || dates[0];

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
      ) : (
        <>
          <CalendarStrip dates={dates} selectedDate={selectedDate} setSelectedDate={setSelectedDate} logs={logs} />
          <div className="today-row">
            <button className="primary" type="button" onClick={() => setSelectedDate(todayTarget)}>
              <CalendarDays size={18} />
              View today's workout
            </button>
          </div>
          <WorkoutView workout={selectedWorkout} date={selectedDate} user={user} logs={logs} setLogs={setLogs} />
        </>
      )}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
