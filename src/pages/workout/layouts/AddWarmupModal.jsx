import React from "react";
import { Plus } from "lucide-react";
import { ExerciseAutocomplete } from "../../../components/exercise/ExerciseAutocomplete";

export function AddWarmupModalLayout({
  newWarmupName,
  newWarmupTracksWeight,
  onClose,
  onNameChange,
  onPresetSelect,
  onSubmit,
  onTrackWeightsChange,
  warmupPresets,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-warmup-title">
        <div>
          <p className="eyebrow">Workout warm-up</p>
          <h2 id="add-warmup-title">Add warm-up</h2>
        </div>
        <div className="preset-grid">
          {warmupPresets.map((preset) => (
            <button className="preset-button" type="button" key={preset.id} onClick={() => onPresetSelect(preset)}>
              <strong>{preset.title}</strong>
              <span>{preset.exercises.join(" | ")}</span>
            </button>
          ))}
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            Custom warm-up exercise
            <ExerciseAutocomplete value={newWarmupName} onChange={onNameChange} id="new-warmup-name" placeholder="Banded shoulder prep, hip flow, empty bar work" />
          </label>
          <label className="checkbox-field">
            <input checked={newWarmupTracksWeight} onChange={(event) => onTrackWeightsChange(event.target.checked)} type="checkbox" />
            Track weights used
          </label>
          <button className="primary" type="submit">
            <Plus size={18} />
            Add custom warm-up
          </button>
          <button className="text-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
