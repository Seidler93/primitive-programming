import React from "react";
import { CheckCircle2, Plus, Save } from "lucide-react";

export function MetricWorkoutPage({
  distanceUnit = "km",
  finishButtonLabel,
  isFutureWorkout,
  layout,
  loads,
  notes,
  onAddWarmup,
  onCompleteWorkout,
  onFinishWorkout,  setLoads,
  setNotes,
  title,
  warmups,
  workoutType,
}) {
  const Icon = layout.icon;
  const typedValue = (field) => loads[`typed:${workoutType}:${field.key}`] || field.defaultValue || "";
  const typedDistanceUnit = (field) => loads[`typed:${workoutType}:${field.key}Unit`] || distanceUnit || "km";
  const typedTimeValue = (field, part) => loads[`typed:${workoutType}:${field.key}:${part}`] || "";
  const setTypedValue = (key, value) => {
    setLoads({ ...loads, [`typed:${workoutType}:${key}`]: value });
  };
  const setTypedDistance = (field, patch) => {
    setLoads({
      ...loads,
      [`typed:${workoutType}:${field.key}`]: patch.value ?? typedValue(field),
      [`typed:${workoutType}:${field.key}Unit`]: patch.unit ?? typedDistanceUnit(field),
    });
  };
  const setTypedTime = (field, part, value) => {
    setLoads({
      ...loads,
      [`typed:${workoutType}:${field.key}:${part}`]: value,
    });
  };

  return (
    <>
      <button className="secondary" type="button" onClick={onAddWarmup}>
        <Plus size={18} />
        Add warm-up
      </button>
      <div className={`typed-workout-layout typed-workout-${workoutType}`}>
        <div className="typed-workout-heading">
          <Icon size={24} />
          <div>
            <p className="eyebrow">{layout.label}</p>
            <h3>{title}</h3>
          </div>
        </div>
        <div className="typed-workout-grid">
          {layout.fields.map((field) => (
            <label key={field.key}>
              {field.label}
              {field.options ? (
                <select
                  value={typedValue(field)}
                  onChange={(event) => setTypedValue(field.key, event.target.value)}
                >
                  <option value="">Select</option>
                  {field.options.map((option) => (
                    <option value={option.toLowerCase()} key={option}>{option}</option>
                  ))}
                </select>
              ) : field.key === "distance" ? (
                <div className="typed-distance-control">
                  <input
                    value={typedValue(field)}
                    onChange={(event) => setTypedDistance(field, { value: event.target.value })}
                    placeholder={typedDistanceUnit(field) === "mi" ? "Miles" : "Kilometers"}
                    inputMode="decimal"
                  />
                  <select
                    value={typedDistanceUnit(field)}
                    onChange={(event) => setTypedDistance(field, { unit: event.target.value })}
                    aria-label={`${field.label} unit`}
                  >
                    <option value="mi">mi</option>
                    <option value="km">km</option>
                  </select>
                </div>
              ) : field.key === "duration" || field.key === "pace" ? (
                <div className="typed-time-control">
                  <input
                    value={typedTimeValue(field, "min")}
                    onChange={(event) => setTypedTime(field, "min", event.target.value)}
                    placeholder="Min"
                    inputMode="numeric"
                  />
                  <input
                    value={typedTimeValue(field, "sec")}
                    onChange={(event) => setTypedTime(field, "sec", event.target.value)}
                    placeholder="Sec"
                    inputMode="numeric"
                  />
                </div>
              ) : (
                <input
                  value={typedValue(field)}
                  onChange={(event) => setTypedValue(field.key, event.target.value)}
                  placeholder={field.placeholder}
                />
              )}
            </label>
          ))}
        </div>
      </div>
      {warmups}
      <label className="notes-field">
        Session notes
        <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
      </label>
      <button className="secondary" type="button" onClick={() => onFinishWorkout({})}>
        <Save size={18} />
        {finishButtonLabel}
      </button>
      <button className="primary" type="button" onClick={() => onCompleteWorkout({ completed: true })}>
        <CheckCircle2 size={18} />
        Complete
      </button>
    </>
  );
}

