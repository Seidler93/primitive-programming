import React, { useState } from "react";
import { ArrowLeft, CheckCircle2, Dumbbell, Plus } from "lucide-react";
import { importedProgramMeta } from "../../../data/programData";
import { formatDate, shiftDate, workoutExerciseCount } from "../../../utils/appHelpers";

export function DayView({ date, workoutGroups, logs, programs, onOpenWorkout, onAddWorkout, onChangeDate }) {
  const [showAddWorkoutOptions, setShowAddWorkoutOptions] = useState(false);
  const [selectedAddMode, setSelectedAddMode] = useState("new");
  const [isSchedulingWorkout, setIsSchedulingWorkout] = useState(false);
  const hasPlannedWorkout = workoutGroups.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = date > today;
  const workoutActionLabel = isFutureDate ? "Schedule workout" : "Create workout";
  const workoutActionCopy = isFutureDate ? "Schedule a new workout for this day" : "New, stored, or AI-generated workout";
  const programName = (programId) => {
    if (!programId || programId === "default") return importedProgramMeta.name;
    return programs.find((program) => program.id === programId)?.name || "Program";
  };
  const goToPreviousDay = () => onChangeDate(shiftDate(date, -1));
  const goToNextDay = () => onChangeDate(shiftDate(date, 1));

  return (
    <section className="workout-list-panel">
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
      <button className="add-workout-button" type="button" onClick={() => setShowAddWorkoutOptions(true)}>
        <Plus size={20} />
        <div>
          <h3>{workoutActionLabel}</h3>
          <span>{workoutActionCopy}</span>
        </div>
      </button>
      {hasPlannedWorkout ? (
        <div className="workout-card-list">
          {workoutGroups.map((group) => {
            const exerciseCount = workoutExerciseCount(group, logs);
            return (
              <button className="workout-card-button" type="button" key={group.key} onClick={() => onOpenWorkout(group.key)}>
                <div>
                  <p className="eyebrow">{programName(group.programId)}</p>
                  <h3>{group.title}</h3>
                  <span>{group.week ? `Week ${group.week}` : group.phase} | {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}</span>
                </div>
                {logs[date]?.completed ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No workouts are scheduled for this day.</p>
      )}
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
                <p>{isFutureDate ? "Schedule a blank workout for this day. You can add warm-ups, lifts, accessories, and cardio next." : "Create a blank workout for this day. You can add warm-ups, lifts, accessories, and cardio next."}</p>
                <button className="primary" type="button" disabled={isSchedulingWorkout} onClick={async () => {
                  try {
                    setIsSchedulingWorkout(true);
                    setShowAddWorkoutOptions(false);
                    await onAddWorkout();
                  } finally {
                    setIsSchedulingWorkout(false);
                  }
                }}>
                  <Plus size={18} />
                  {isFutureDate ? "Schedule blank workout" : "Start blank workout"}
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
