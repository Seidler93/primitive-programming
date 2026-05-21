import React from "react";
import { Plus } from "lucide-react";

export function AddCardioModalLayout({
  cardioTextRows,
  cardioTypeLabel,
  cardioTypeOptions,
  isMetricCardioType,
  newCardioDetails,
  newCardioName,
  newCardioType,
  onClose,
  onDetailsChange,
  onNameChange,
  onSubmit,
  onTypeChange,
  renderCardioMetricFields,
}) {
  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-cardio-title">
        <div>
          <p className="eyebrow">Workout cardio</p>
          <h2 id="add-cardio-title">Add cardio</h2>
        </div>
        <form className="modal-form" onSubmit={onSubmit}>
          <label>
            Type
            <select value={newCardioType} onChange={(event) => onTypeChange(event.target.value)}>
              {cardioTypeOptions.map((option) => (
                <option value={option.value} key={option.value}>{option.label}</option>
              ))}
            </select>
          </label>
          <label>
            Title
            <input value={newCardioName} onChange={(event) => onNameChange(event.target.value)} id="new-cardio-name" placeholder={cardioTypeLabel(newCardioType)} />
          </label>
          {isMetricCardioType(newCardioType) ? (
            <div className="cardio-metric-fields">
              {renderCardioMetricFields(newCardioType, newCardioDetails, onDetailsChange, "new-cardio")}
            </div>
          ) : (
            <label>
              Workout
              <textarea
                value={newCardioDetails.workout || ""}
                onChange={(event) => onDetailsChange({ workout: event.target.value })}
                rows={cardioTextRows(newCardioDetails.workout)}
                placeholder="Type the workout here"
              />
            </label>
          )}
          <button className="primary" type="submit">
            <Plus size={18} />
            Add cardio
          </button>
          <button className="text-button" type="button" onClick={onClose}>
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
}
