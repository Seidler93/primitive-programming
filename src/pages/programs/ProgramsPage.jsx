import React, { useEffect, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Eye, Plus, UsersRound } from "lucide-react";
import { importedProgramMeta } from "../../data/programData";
import { defaultSelectedDate, flexibleScheduleMode } from "../../app/config";
import { loadAthletes, loadUserActivePrograms, saveCustomWorkout, saveProgram, saveUserActiveProgram } from "../../services/firebase";
import { buildWorkoutDatesForProgram, formatDate, programDayGroups, programSlug, progressSummary } from "../../utils/appHelpers";

export function ProgramsPage({ user, isTrainer, programs, workouts, logs, selectedDate, onProgramCreated, onWorkoutCreated }) {
  const [programName, setProgramName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("dev-athlete@primitive.local");
  const [startDate, setStartDate] = useState(selectedDate || defaultSelectedDate);
  const [programGoal, setProgramGoal] = useState("");
  const [programNotes, setProgramNotes] = useState("");
  const [workoutProgramId, setWorkoutProgramId] = useState("default");
  const [date, setDate] = useState(selectedDate || defaultSelectedDate);
  const [focus, setFocus] = useState("");
  const [exercise, setExercise] = useState("");
  const [prescription, setPrescription] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [expandedProgramId, setExpandedProgramId] = useState("");
  const [viewingProgram, setViewingProgram] = useState(null);
  const [startingProgram, setStartingProgram] = useState(null);
  const [assigningProgram, setAssigningProgram] = useState(null);
  const [athleteOptions, setAthleteOptions] = useState([]);
  const [assignAthleteId, setAssignAthleteId] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(defaultSelectedDate);
  const [assignScheduleMode, setAssignScheduleMode] = useState("fixed");
  const [assignmentMessage, setAssignmentMessage] = useState("");
  const [programStartDate, setProgramStartDate] = useState(defaultSelectedDate);
  const [programScheduleMode, setProgramScheduleMode] = useState("fixed");
  const [ownActivePrograms, setOwnActivePrograms] = useState([]);
  const savedDefaultProgram = programs.find((program) => program.id === "default");
  const defaultProgram = {
    ...importedProgramMeta,
    athleteEmail: "dev-athlete@primitive.local",
    ...savedDefaultProgram,
  };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const createdProgramIds = new Set(programs.map((program) => program.id));
  const visiblePrograms = programOptions.filter((program) => program.id === "default" || createdProgramIds.has(program.id));
  const currentWorkoutProgram = programOptions.find((program) => program.id === workoutProgramId) || defaultProgram;

  useEffect(() => {
    if (selectedDate) {
      setDate(selectedDate);
      setStartDate((current) => current || selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!isTrainer) return;
    let active = true;
    loadAthletes().then((athletes) => {
      if (!active) return;
      setAthleteOptions(athletes);
      setAssignAthleteId((current) => current || athletes[0]?.uid || "");
    });
    return () => {
      active = false;
    };
  }, [isTrainer]);

  useEffect(() => {
    if (!user?.uid) {
      setOwnActivePrograms([]);
      return undefined;
    }
    let active = true;
    loadUserActivePrograms(user.uid).then((activePrograms) => {
      if (active) setOwnActivePrograms(activePrograms);
    });
    return () => {
      active = false;
    };
  }, [user?.uid, programs]);

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
    const scheduledDate = date || selectedDate || defaultSelectedDate;
    const workout = {
      date: scheduledDate,
      focus,
      exercise,
      prescription,
      intensity,
      notes,
      programId: workoutProgramId || "default",
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${scheduledDate}T12:00:00`)),
      phase: currentWorkoutProgram.name,
      week: "Custom",
    };
    await saveCustomWorkout(workoutProgramId || "default", workout);
    setExercise("");
    setPrescription("");
    setIntensity("");
    setNotes("");
    await onWorkoutCreated(scheduledDate);
  }

  async function updateProgramStatus(program, status) {
    const savedProgram = {
      ...program,
      status,
      statusUpdatedAt: new Date().toISOString(),
    };
    await saveProgram(savedProgram);
    setExpandedProgramId("");
    onProgramCreated();
  }

  function openStartProgram(program) {
    setStartingProgram(program);
    setProgramStartDate(program.startDate || new Date().toISOString().slice(0, 10));
    setProgramScheduleMode(program.scheduleMode || "fixed");
    setExpandedProgramId("");
  }

  function openAssignProgram(program) {
    setAssigningProgram(program);
    setAssignStartDate(program.startDate || new Date().toISOString().slice(0, 10));
    setAssignScheduleMode(program.scheduleMode || "fixed");
    setAssignmentMessage("");
    setAssignAthleteId((current) => current || athleteOptions[0]?.uid || "");
    setExpandedProgramId("");
  }

  async function startProgram(event) {
    event.preventDefault();
    if (!startingProgram || !programStartDate) return;

    const savedProgram = {
      ...startingProgram,
      startDate: programStartDate,
      scheduleMode: programScheduleMode,
      status: "active",
      statusUpdatedAt: new Date().toISOString(),
    };
    const programWorkouts = workouts
      .filter((item) => (item.programId || "default") === startingProgram.id && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    const scheduled = programScheduleMode !== flexibleScheduleMode;
    const activeProgram = {
      id: startingProgram.id,
      startDate: programStartDate,
      scheduled,
      currentWeek: 1,
      nextWorkoutIndex: 0,
      ...(scheduled ? { workoutDates: buildWorkoutDatesForProgram(programWorkouts, programStartDate) } : {}),
    };

    await saveProgram(savedProgram);
    if (user?.uid) {
      await saveUserActiveProgram(user.uid, activeProgram);
      setOwnActivePrograms((current) => [
        ...current.filter((item) => item.id !== activeProgram.id),
        activeProgram,
      ]);
    }

    setStartingProgram(null);
    setProgramStartDate(defaultSelectedDate);
    setProgramScheduleMode("fixed");
    onProgramCreated();
  }

  async function assignProgram(event) {
    event.preventDefault();
    if (!assigningProgram || !assignAthleteId || !assignStartDate) return;

    const programWorkouts = workouts
      .filter((item) => (item.programId || "default") === assigningProgram.id && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    const scheduled = assignScheduleMode !== flexibleScheduleMode;
    await saveUserActiveProgram(assignAthleteId, {
      id: assigningProgram.id,
      startDate: assignStartDate,
      scheduled,
      currentWeek: 1,
      nextWorkoutIndex: 0,
      ...(scheduled ? { workoutDates: buildWorkoutDatesForProgram(programWorkouts, assignStartDate) } : {}),
    });
    const athlete = athleteOptions.find((item) => item.uid === assignAthleteId);
    setAssignmentMessage(`${assigningProgram.name} assigned to ${athlete?.displayName || athlete?.email || "athlete"}.`);
    setAssigningProgram(null);
    onProgramCreated();
  }

  function programStatusLabel(status) {
    if (status === "active") return "Started";
    if (status === "paused") return "Paused";
    if (status === "quit") return "Quit";
    return "Not started";
  }

  if (viewingProgram) {
    return (
      <ProgramWorkoutViewer
        program={viewingProgram}
        workouts={workouts.filter((item) => (item.programId || "default") === viewingProgram.id)}
        logs={logs}
        onBack={() => setViewingProgram(null)}
      />
    );
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
              const ownActiveProgram = ownActivePrograms.find((item) => item.id === program.id) || program.activeProgram;
              const ownProgressWorkouts = ownActiveProgram?.scheduled
                ? applyActiveProgramDates(programWorkouts, [{ ...program, activeProgram: ownActiveProgram }])
                : programWorkouts;
              const ownSummary = ownActiveProgram ? progressSummary(ownProgressWorkouts, logs) : null;
              const expanded = expandedProgramId === program.id;
              return (
                <article className={`program-card ${expanded ? "expanded" : ""}`} key={program.id}>
                  <button
                    className="program-card-toggle"
                    type="button"
                    onClick={() => setExpandedProgramId(expanded ? "" : program.id)}
                    aria-expanded={expanded}
                  >
                    <div>
                      <p className="eyebrow">{program.athleteEmail || "No athlete assigned"}</p>
                      <h4>{program.name}</h4>
                    </div>
                    <ChevronRight className="program-expand-icon" size={18} aria-hidden="true" />
                  </button>
                  <p className={`program-status program-status-${program.status || "idle"}`}>{programStatusLabel(program.status)}</p>
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
                  {ownSummary && (
                    <div className="program-own-progress" aria-label={`Your progress is ${ownSummary.percent}% complete`}>
                      <div>
                        <span>Your progress</span>
                        <strong>{ownSummary.completed}/{ownSummary.total} workouts</strong>
                      </div>
                      <div className="progress-meter">
                        <span style={{ width: `${ownSummary.percent}%` }} />
                      </div>
                    </div>
                  )}
                  {program.goal && <p className="program-note">{program.goal}</p>}
                  {expanded && (
                    <div className="program-expanded-actions">
                      <button className="secondary" type="button" onClick={() => setViewingProgram(program)}>
                        <Eye size={17} />
                        View workout
                      </button>
                      <button className="secondary" type="button" onClick={() => openStartProgram(program)}>
                        <CalendarDays size={17} />
                        Start program
                      </button>
                      {isTrainer && (
                        <button className="secondary" type="button" onClick={() => openAssignProgram(program)}>
                          <UsersRound size={17} />
                          Assign program
                        </button>
                      )}
                    </div>
                  )}
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
      {assignmentMessage && <p className="save-status">{assignmentMessage}</p>}
      {startingProgram && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form start-program-form" onSubmit={startProgram} role="dialog" aria-modal="true" aria-labelledby="start-program-title">
            <div>
              <p className="eyebrow">Start program</p>
              <h2 id="start-program-title">{startingProgram.name}</h2>
            </div>
            <label>
              Start date
              <input type="date" value={programStartDate} onChange={(event) => setProgramStartDate(event.target.value)} required />
            </label>
            <div className="choice-list" role="radiogroup" aria-label="Program scheduling">
              <button className={programScheduleMode === "fixed" ? "choice-button active" : "choice-button"} type="button" onClick={() => setProgramScheduleMode("fixed")}>
                <strong>Known workout days</strong>
                <span>Keep workouts on the programmed calendar days.</span>
              </button>
              <button className={programScheduleMode === flexibleScheduleMode ? "choice-button active" : "choice-button"} type="button" onClick={() => setProgramScheduleMode(flexibleScheduleMode)}>
                <strong>Unknown workout days</strong>
                <span>When you pick a day, show the next program day for that week.</span>
              </button>
            </div>
            <p className="modal-helper-copy">
              {programScheduleMode === flexibleScheduleMode
                ? "Each calendar week advances by completed program days, so the next selected day shows the next workout."
                : startingProgram.id === "default"
                ? "The program status will use this date."
                : "Program workouts will move so the first scheduled workout starts on this date."}
            </p>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setStartingProgram(null)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!programStartDate}>
                Confirm start
              </button>
            </div>
          </form>
        </div>
      )}
      {assigningProgram && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form start-program-form" onSubmit={assignProgram} role="dialog" aria-modal="true" aria-labelledby="assign-program-title">
            <div>
              <p className="eyebrow">Assign program</p>
              <h2 id="assign-program-title">{assigningProgram.name}</h2>
            </div>
            <label>
              Athlete
              <select value={assignAthleteId} onChange={(event) => setAssignAthleteId(event.target.value)} required>
                {athleteOptions.map((athlete) => (
                  <option key={athlete.uid} value={athlete.uid}>
                    {athlete.displayName || athlete.email || athlete.uid}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start date
              <input type="date" value={assignStartDate} onChange={(event) => setAssignStartDate(event.target.value)} required />
            </label>
            <div className="choice-list" role="radiogroup" aria-label="Program scheduling">
              <button className={assignScheduleMode === "fixed" ? "choice-button active" : "choice-button"} type="button" onClick={() => setAssignScheduleMode("fixed")}>
                <strong>Known workout days</strong>
                <span>Keep workouts on the programmed calendar days.</span>
              </button>
              <button className={assignScheduleMode === flexibleScheduleMode ? "choice-button active" : "choice-button"} type="button" onClick={() => setAssignScheduleMode(flexibleScheduleMode)}>
                <strong>Unknown workout days</strong>
                <span>The athlete chooses workout days week to week.</span>
              </button>
            </div>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setAssigningProgram(null)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!assignAthleteId || !assignStartDate}>
                Assign program
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

export function ProgramWorkoutViewer({ program, workouts, logs, onBack }) {
  const workoutGroups = groupWorkouts(
    [...workouts]
      .filter((item) => item.date)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.focus || "").localeCompare(String(b.focus || ""))),
  );
  const summary = progressSummary(workouts, logs);

  return (
    <section className="programs-panel program-workout-view">
      <div className="section-heading program-workout-heading">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to programs" title="Back to programs">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">Program workouts</p>
          <h2>{program.name}</h2>
        </div>
      </div>

      <div className="program-workout-summary">
        <div>
          <span>Workouts</span>
          <strong>{summary.total}</strong>
        </div>
        <div>
          <span>Complete</span>
          <strong>{summary.completed}</strong>
        </div>
        <div>
          <span>Next</span>
          <strong>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</strong>
        </div>
      </div>

      {workoutGroups.length ? (
        <div className="program-workout-list">
          {workoutGroups.map((group, index) => {
            const completed = Boolean(logs[group.date]?.completed);
            return (
              <article className={`program-workout-card ${completed ? "completed" : ""}`} key={group.key}>
                <div className="program-workout-card-header">
                  <div>
                    <p className="eyebrow">Workout {index + 1} | {formatDate(group.date)}</p>
                    <h3>{group.title}</h3>
                  </div>
                  {completed && <CheckCircle2 size={20} aria-label="Completed" />}
                </div>
                <div className="program-workout-exercises">
                  {group.items.map((item, itemIndex) => (
                    <div className="program-workout-exercise" key={item.id || `${group.key}-${itemIndex}`}>
                      <strong>{item.exercise || "Exercise"}</strong>
                      <span>{[item.prescription, item.intensity].filter(Boolean).join(" | ") || "No prescription yet"}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No workouts have been added to this program yet.</p>
      )}
    </section>
  );
}
