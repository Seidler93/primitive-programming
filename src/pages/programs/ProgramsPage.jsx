import React, { useEffect, useState } from "react";
import { CalendarDays, ChevronRight, ClipboardList, Eye, Minus } from "lucide-react";
import { defaultSelectedDate, flexibleScheduleMode } from "../../app/config";
import { deleteUserWorkout, loadAthletes, removeUserActiveProgram, saveUserActiveProgram } from "../../db";
import { applyActiveProgramDates, buildWorkoutDatesForProgram, formatDate, logDateFromKey, programDayGroups, progressSummary, workoutProgramId } from "../../utils/appHelpers";
import { ProgramWorkoutViewer } from "./ProgramWorkoutViewer";

export function ProgramsPage({ user, isTrainer, programs, programWorkouts, workouts, onProgramStarted }) {
  const [expandedProgramId, setExpandedProgramId] = useState("");
  const [activePanel, setActivePanel] = useState("");
  const [viewingProgram, setViewingProgram] = useState(null);
  const [programStartDate, setProgramStartDate] = useState(defaultSelectedDate);
  const [programScheduleMode, setProgramScheduleMode] = useState("fixed");
  const [athleteOptions, setAthleteOptions] = useState([]);
  const [assignAthleteId, setAssignAthleteId] = useState("");
  const [assignStartDate, setAssignStartDate] = useState(defaultSelectedDate);
  const [assignScheduleMode, setAssignScheduleMode] = useState("fixed");
  const [statusMessage, setStatusMessage] = useState("");
  const programOptions = programs;

  useEffect(() => {
    console.log("Stored programs page load", {
      programs,
      activePrograms: programs.filter((program) => program.activeProgram).map((program) => program.activeProgram),
    });
  }, [programs]);

  useEffect(() => {
    if (!isTrainer) return undefined;
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

  function programLengthLabel(program, programWorkouts) {
    const workoutGroups = programDayGroups(programWorkouts, program.id);
    const weeks = new Set(programWorkouts.map((item) => item.week).filter(Boolean));
    const workoutLabel = workoutGroups.length === 1 ? "1 workout" : `${workoutGroups.length} workouts`;
    return weeks.size > 1 ? `${weeks.size} weeks | ${workoutLabel}` : workoutLabel;
  }

  function openStartProgram(program) {
    setExpandedProgramId(program.id);
    setActivePanel(activePanel === "start" && expandedProgramId === program.id ? "" : "start");
    setProgramStartDate(program.activeProgram?.startDate || program.startDate || new Date().toISOString().slice(0, 10));
    setProgramScheduleMode(program.scheduleMode || (program.activeProgram?.scheduled === false ? flexibleScheduleMode : "fixed"));
    setStatusMessage("");
  }

  function openAssignProgram(program) {
    setExpandedProgramId(program.id);
    setActivePanel(activePanel === "assign" && expandedProgramId === program.id ? "" : "assign");
    setAssignStartDate(program.startDate || new Date().toISOString().slice(0, 10));
    setAssignScheduleMode(program.scheduleMode || "fixed");
    setAssignAthleteId((current) => current || athleteOptions[0]?.uid || "");
    setStatusMessage("");
  }

  function programWorkoutItems(program) {
    return programWorkouts
      .filter((item) => !item.scheduledPlaceholder && workoutProgramId(item) === program.id && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
  }

  function activeProgramPayload(program, selectedStartDate, selectedScheduleMode) {
    const nextProgramWorkouts = programWorkoutItems(program);
    const scheduled = selectedScheduleMode !== flexibleScheduleMode;
    return {
      id: program.id,
      status: "active",
      startDate: selectedStartDate,
      scheduled,
      currentWeek: 1,
      nextWorkoutIndex: 0,
      ...(scheduled ? { workoutDates: buildWorkoutDatesForProgram(nextProgramWorkouts, selectedStartDate) } : {}),
    };
  }

  async function removeCancelableProgramWorkouts(userId, program) {
    const programStartDate = program.activeProgram?.startDate || program.startDate;
    if (!userId || !program?.id || !programStartDate) return;

    const workoutIds = Object.entries(workouts)
      .filter(([workoutId, workout]) => {
        const workoutDate = workout?.date || logDateFromKey(workoutId);
        return workoutProgramId(workout) === program.id
          && workoutDate > programStartDate
          && workout?.status !== "in-progress";
      })
      .map(([workoutId]) => workoutId);

    for (const workoutId of workoutIds) {
      await deleteUserWorkout(userId, workoutId);
    }
  }

  async function startProgram(program, event) {
    event.preventDefault();
    if (!user?.uid || !program?.id || !programStartDate) return;

    const activeProgram = activeProgramPayload(program, programStartDate, programScheduleMode);
    await saveUserActiveProgram(user.uid, activeProgram);
    setStatusMessage(`${program.name} started.`);
    setActivePanel("");
    setProgramStartDate(defaultSelectedDate);
    setProgramScheduleMode("fixed");
    await onProgramStarted?.();
  }

  async function assignProgram(program, event) {
    event.preventDefault();
    if (!assignAthleteId || !program?.id || !assignStartDate) return;

    const activeProgram = activeProgramPayload(program, assignStartDate, assignScheduleMode);
    await saveUserActiveProgram(assignAthleteId, activeProgram);
    const athlete = athleteOptions.find((item) => item.uid === assignAthleteId);
    setStatusMessage(`${program.name} assigned to ${athlete?.displayName || athlete?.email || "athlete"}.`);
    setActivePanel("");
    setAssignStartDate(defaultSelectedDate);
    setAssignScheduleMode("fixed");
    await onProgramStarted?.();
  }

  async function quitProgram(program) {
    if (!user?.uid || !program?.id) return;
    await removeCancelableProgramWorkouts(user.uid, program);
    await removeUserActiveProgram(user.uid, program.id);
    setExpandedProgramId("");
    setActivePanel("");
    await onProgramStarted?.();
  }

  if (viewingProgram) {
    const viewingProgramWorkouts = programWorkouts.filter((item) => (
      !item.scheduledPlaceholder && workoutProgramId(item) === viewingProgram.id
    ));
    return (
      <ProgramWorkoutViewer
        program={viewingProgram}
        programWorkouts={viewingProgramWorkouts}
        workouts={workouts}
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
          const nextProgramWorkouts = programWorkouts.filter((item) => !item.scheduledPlaceholder && workoutProgramId(item) === program.id);
          const isActiveProgram = Boolean(program.activeProgram);
          const progressWorkouts = program.activeProgram?.scheduled
            ? applyActiveProgramDates(nextProgramWorkouts, [{ ...program, activeProgram: program.activeProgram }])
            : nextProgramWorkouts;
          const summary = progressSummary(progressWorkouts, workouts);
          const expanded = expandedProgramId === program.id;
          const toggleProgramCard = () => {
            setExpandedProgramId(expanded ? "" : program.id);
            setActivePanel("");
            setStatusMessage("");
          };
          return (
            <article
              className={`program-card clickable-program-card ${expanded ? "expanded" : ""}`}
              key={program.id}
              onClick={toggleProgramCard}
            >
              <button
                className="program-card-toggle"
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleProgramCard();
                }}
                aria-expanded={expanded}
              >
                <div>
                  <h4>{program.name}</h4>
                </div>
                <ChevronRight className="program-expand-icon" size={18} aria-hidden="true" />
              </button>
              {isActiveProgram ? (
                <>
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
                </>
              ) : (
                <dl className="program-stats program-library-stats">
                  <div>
                    <dt>Length</dt>
                    <dd>{programLengthLabel(program, nextProgramWorkouts)}</dd>
                  </div>
                </dl>
              )}
              {(program.description || program.goal || program.notes) && <p className="program-note">{program.description || program.goal || program.notes}</p>}
              {expanded && (
                <div className="program-expanded-actions" onClick={(event) => event.stopPropagation()}>
                  <button className="secondary" type="button" onClick={() => setViewingProgram(program)}>
                    <Eye size={17} />
                    View program
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
                  {isTrainer && (
                    <button className="secondary" type="button" onClick={() => openAssignProgram(program)}>
                      <CalendarDays size={17} />
                      Assign program
                    </button>
                  )}
                  {activePanel === "start" && (
                    <form className="program-inline-form" onSubmit={(event) => startProgram(program, event)}>
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
                      <button className="primary" type="submit" disabled={!programStartDate || !user?.uid}>
                        Confirm start
                      </button>
                    </form>
                  )}
                  {activePanel === "assign" && isTrainer && (
                    <form className="program-inline-form" onSubmit={(event) => assignProgram(program, event)}>
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
                      <button className="primary" type="submit" disabled={!assignAthleteId || !assignStartDate}>
                        Assign program
                      </button>
                    </form>
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
      {statusMessage && <p className="save-status">{statusMessage}</p>}
    </section>
  );
}
