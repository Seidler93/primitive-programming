import React, { useState } from "react";
import { Bike, Bot, Dumbbell, Footprints, Save, ShipWheel, Volleyball, Waves } from "lucide-react";
import { formatDate } from "../../utils/appHelpers";

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

export function WorkoutAddModal({ date, onAddWorkout, onClose }) {
  const [selectedWorkoutType, setSelectedWorkoutType] = useState("strength");
  const [isSchedulingWorkout, setIsSchedulingWorkout] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const isFutureDate = date > today;

  return (
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
          setIsSchedulingWorkout(true);
          onClose();
          await onAddWorkout(selectedWorkoutType);
        }}>
          {isFutureDate ? "Schedule workout" : "Start workout"}
        </button>
        <button className="text-button" type="button" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
