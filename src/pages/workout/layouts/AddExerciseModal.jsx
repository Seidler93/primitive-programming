import React from "react";
import { Plus } from "lucide-react";
import { ExerciseAutocomplete } from "../../../components/exercise/ExerciseAutocomplete";

export function AddExerciseModalLayout({
  newExerciseName,
  newExerciseTracksWeight,
  onClose,
  onNameChange,
  onSubmit,
  onTrackWeightsChange,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-exercise-title">
        <div>
          <p className="eyebrow">Session exercise</p>
          <h2 id="add-exercise-title">Add exercise</h2>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            Exercise name
            <ExerciseAutocomplete value={newExerciseName} onChange={onNameChange} id="new-exercise-name" placeholder="Accessory, abs, RDL, extra pulls" />
          </label>
          <label className="checkbox-field">
            <input checked={newExerciseTracksWeight} onChange={(event) => onTrackWeightsChange(event.target.checked)} type="checkbox" />
            Track weights used
          </label>
          <button className="primary" type="submit">
            <Plus size={18} />
            Add exercise
          </button>
          <button className="text-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
