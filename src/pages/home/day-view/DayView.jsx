import React, { useState } from "react";
import { ArrowLeft, Bike, Bot, CalendarDays, CheckCircle2, Dumbbell, Footprints, Play, Plus, Save, ShipWheel, Trash2, Volleyball, Waves } from "lucide-react";
import { importedProgramMeta } from "../../../data/programData";
import { formatDate, loadWorkoutDraft, shiftDate, workoutExerciseCount, workoutLogKey } from "../../../utils/appHelpers";

const workoutTypeOptions = [
  { id: "strength", label: "Strength workout", icon: Dumbbell },
  { id: "running", label: "Running", icon: Footprints },
  { id: "swimming", label: "Swimming", icon: Waves },
  { id: "biking", label: "Biking", icon: Bike },
  { id: "rowing", label: "Rowing", icon: ShipWheel },
  { id: "walking", label: "Walking", icon: Footprints },
  { id: "sport", label: "Sport", icon: Volleyball },
];

const workoutSourceOptions = [
  { id: "saved", label: "Saved workout", copy: "Reuse one of your saved workout templates.", disabled: true, icon: Save },
  { id: "generated", label: "Generate workout", copy: "Build a workout from goals, maxes, and recent training.", disabled: true, icon: Bot },
];

export function DayView({ date, user, workoutGroups, workouts, programs, onOpenWorkout, onAddWorkout, onChangeDate, onMoveWorkout, onDeleteWorkout }) {
  const [showAddWorkoutOptions, setShowAddWorkoutOptions] = useState(false);
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("strength");
  const [isSchedulingWorkout, setIsSchedulingWorkout] = useState(false);
  const [expandedWorkoutKey, setExpandedWorkoutKey] = useState("");
  const [moveWorkoutKey, setMoveWorkoutKey] = useState("");
  const [moveDate, setMoveDate] = useState(date);
  const [isMovingWorkout, setIsMovingWorkout] = useState(false);
  const [isDeletingWorkout, setIsDeletingWorkout] = useState(false);
  const hasPlannedWorkout = workoutGroups.length > 0;
  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = date > today;
  const workoutActionLabel = isFutureDate ? "Schedule workout" : "Create workout";
  const workoutActionCopy = isFutureDate ? "Schedule a new workout for this day" : "New, stored, or AI-generated workout";
  const programName = (programId) => {
    if (!programId || programId === "default") return importedProgramMeta.name;
    return programs.find((program) => program.id === programId)?.name || "Program";
  };
  const hasCompletedSet = (workoutState = {}) => {
    const hasCheckedProgrammedSet = Object.entries(workoutState.loads || {}).some(([key, value]) => (
      key.endsWith(":done") && value === true
    ));
    const hasCheckedCustomSet = (workoutState.customExercises || []).some((exercise) => (
      (exercise.sets || []).some((set) => set.done === true)
    ));
    return hasCheckedProgrammedSet || hasCheckedCustomSet;
  };
  const workoutStarted = (group) => {
    const workout = workouts[workoutLogKey(group.date, group.key)] || {};
    const draft = user?.uid ? loadWorkoutDraft(user.uid, group.date, group.key) : {};
    return Boolean(workout.completed) || workout.status === "completed" || hasCompletedSet(workout) || hasCompletedSet(draft);
  };
  const goToPreviousDay = () => onChangeDate(shiftDate(date, -1));
  const goToNextDay = () => onChangeDate(shiftDate(date, 1));
  const openMovePanel = (group) => {
    setMoveWorkoutKey(group.key);
    setMoveDate(group.date);
  };
  const submitMoveWorkout = async (event) => {
    event.preventDefault();
    if (!moveWorkoutKey || !moveDate) return;
    try {
      setIsMovingWorkout(true);
      await onMoveWorkout(moveWorkoutKey, moveDate);
      setMoveWorkoutKey("");
      setExpandedWorkoutKey("");
    } finally {
      setIsMovingWorkout(false);
    }
  };
  const deleteWorkout = async (group) => {
    if (!window.confirm("Delete this workout from your schedule?")) return;
    try {
      setIsDeletingWorkout(true);
      await onDeleteWorkout(group.key);
      setExpandedWorkoutKey("");
    } finally {
      setIsDeletingWorkout(false);
    }
  };

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
            const exerciseCount = workoutExerciseCount(group, workouts);
            const isExpanded = expandedWorkoutKey === group.key;
            const isStarted = workoutStarted(group);
            return (
              <div className={isExpanded ? "workout-card expanded" : "workout-card"} key={group.key}>
                <button className="workout-card-button" type="button" onClick={() => setExpandedWorkoutKey(isExpanded ? "" : group.key)}>
                  <div>
                    <p className="eyebrow">{programName(group.programId)}</p>
                    <h3>{group.title}</h3>
                    <span>{group.week ? `Week ${group.week}` : group.phase} | {exerciseCount} exercise{exerciseCount === 1 ? "" : "s"}</span>
                  </div>
                  {workouts[workoutLogKey(group.date, group.key)]?.completed ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
                </button>
                {isExpanded && (
                  <div className="workout-card-actions">
                    <button className="primary" type="button" onClick={() => onOpenWorkout(group.key, { start: true })}>
                      <Play size={18} />
                      {isStarted ? "Resume workout" : "Start workout"}
                    </button>
                    <button className="secondary" type="button" onClick={() => openMovePanel(group)}>
                      <CalendarDays size={18} />
                      Move workout
                    </button>
                    <button className="danger-button" type="button" disabled={isDeletingWorkout} onClick={() => deleteWorkout(group)}>
                      <Trash2 size={18} />
                      Delete workout
                    </button>
                  </div>
                )}
                {moveWorkoutKey === group.key && (
                  <form className="workout-move-inline-form" onSubmit={submitMoveWorkout}>
                    <label>
                      Move to
                      <input value={moveDate} onChange={(event) => setMoveDate(event.target.value)} type="date" required />
                    </label>
                    <div className="modal-action-row">
                      <button className="text-button" type="button" onClick={() => setMoveWorkoutKey("")}>
                        Cancel
                      </button>
                      <button className="primary" type="submit" disabled={isMovingWorkout}>
                        Move
                      </button>
                    </div>
                  </form>
                )}
                </div>
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
              {workoutTypeOptions.map((option) => (
                <button className={selectedWorkoutType === option.id ? "choice-button workout-type-choice active" : "choice-button workout-type-choice"} type="button" key={option.id} onClick={() => setSelectedWorkoutType(option.id)}>
                  <option.icon size={18} />
                  <strong>{option.label}</strong>
                </button>
              ))}
              {workoutSourceOptions.map((option) => (
                <button className="choice-button" type="button" key={option.id} disabled={option.disabled}>
                  <option.icon size={18} />
                  <strong>{option.label}</strong>
                  <span>{option.copy}</span>
                </button>
              ))}
            </div>
            <button className="primary" type="button" disabled={isSchedulingWorkout} onClick={async () => {
              try {
                setIsSchedulingWorkout(true);
                setShowAddWorkoutOptions(false);
                await onAddWorkout(selectedWorkoutType);
              } finally {
                setIsSchedulingWorkout(false);
              }
            }}>
              {isFutureDate ? "Schedule workout" : "Start workout"}
            </button>
            <button className="text-button" type="button" onClick={() => setShowAddWorkoutOptions(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
