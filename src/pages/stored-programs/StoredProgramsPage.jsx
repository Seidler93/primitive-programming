import React, { useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Eye, Minus } from "lucide-react";
import { defaultSelectedDate, flexibleScheduleMode } from "../../app/config";
import { removeUserActiveProgram, saveUserActiveProgram } from "../../services/firebase";
import { buildWorkoutDatesForProgram, formatDate, progressSummary } from "../../utils/appHelpers";
import { ProgramWorkoutViewer } from "../programs/ProgramsPage";

export function StoredProgramsPage({ user, programs, workouts, logs, onProgramStarted }) {
  const [expandedProgramId, setExpandedProgramId] = useState("");
  const [viewingProgram, setViewingProgram] = useState(null);
  const [startingProgram, setStartingProgram] = useState(null);
  const [programStartDate, setProgramStartDate] = useState(defaultSelectedDate);
  const [programScheduleMode, setProgramScheduleMode] = useState("fixed");
  const programOptions = programs;

  function openStartProgram(program) {
    setStartingProgram(program);
    setProgramStartDate(program.startDate || new Date().toISOString().slice(0, 10));
    setProgramScheduleMode(program.scheduleMode || "fixed");
    setExpandedProgramId("");
  }

  async function startProgram(event) {
    event.preventDefault();
    if (!user?.uid || !startingProgram || !programStartDate) return;

    const programWorkouts = workouts
      .filter((item) => (item.programId || "default") === startingProgram.id && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    const scheduled = programScheduleMode !== flexibleScheduleMode;
    await saveUserActiveProgram(user.uid, {
      id: startingProgram.id,
      startDate: programStartDate,
      scheduled,
      currentWeek: 1,
      nextWorkoutIndex: 0,
      ...(scheduled ? { workoutDates: buildWorkoutDatesForProgram(programWorkouts, programStartDate) } : {}),
    });
    setStartingProgram(null);
    setProgramStartDate(defaultSelectedDate);
    setProgramScheduleMode("fixed");
    await onProgramStarted?.();
  }

  async function quitProgram(program) {
    if (!user?.uid || !program?.id) return;
    await removeUserActiveProgram(user.uid, program.id);
    setExpandedProgramId("");
    await onProgramStarted?.();
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

      {programOptions.length ? (
        <div className="program-card-grid">
          {programOptions.map((program) => {
          const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
          const summary = progressSummary(programWorkouts, logs);
          const isActiveProgram = Boolean(program.activeProgram);
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
                  <p className="eyebrow">{programWorkouts.length} saved workout{programWorkouts.length === 1 ? "" : "s"}</p>
                  <h4>{program.name}</h4>
                </div>
                <ChevronRight className="program-expand-icon" size={18} aria-hidden="true" />
              </button>
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
              {expanded && (
                <div className="program-expanded-actions">
                  <button className="secondary" type="button" onClick={() => setViewingProgram(program)}>
                    <Eye size={17} />
                    View workout
                  </button>
                  {isActiveProgram ? (
                    <button className="secondary danger-text-button" type="button" onClick={() => quitProgram(program)}>
                      <Minus size={17} />
                      Quit program
                    </button>
                  ) : (
                    <button className="secondary" type="button" onClick={() => openStartProgram(program)}>
                      <CalendarDays size={17} />
                      Start program
                    </button>
                  )}
                </div>
              )}
            </article>
          );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No saved programs yet.</p>
      )}
      {startingProgram && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form start-program-form" onSubmit={startProgram} role="dialog" aria-modal="true" aria-labelledby="stored-start-program-title">
            <div>
              <p className="eyebrow">Start program</p>
              <h2 id="stored-start-program-title">{startingProgram.name}</h2>
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
                <span>Pick training days week to week and show the next program day.</span>
              </button>
            </div>
            <p className="modal-helper-copy">
              {programScheduleMode === flexibleScheduleMode
                ? "Each calendar week advances by completed program days, so your next selected day shows the next workout."
                : "Program workouts will move so the first scheduled workout starts on this date."}
            </p>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setStartingProgram(null)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!programStartDate || !user?.uid}>
                Confirm start
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
