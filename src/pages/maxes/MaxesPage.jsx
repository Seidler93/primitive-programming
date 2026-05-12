import React, { useState } from "react";
import { PencilLine, Save, Trophy } from "lucide-react";
import { bodyMetricFields, maxFields } from "../../app/config";
import {
  bodyMetricUnit,
  completedWorkoutsLast30Days,
  formatDate,
  formatShortDate,
  goalProgress,
  loadBodyMetrics,
  loadUserGoals,
  loadUserMaxes,
  loadUserWeightUnit,
  metricGoalProgress,
  metricLatest,
  metricLineChart,
  weeklyWorkoutStreak,
} from "../../utils/appHelpers";

export function MaxesPage({ user, onSaveMaxes }) {
  const [maxes, setMaxes] = useState(() => loadUserMaxes(user.uid));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saveError, setSaveError] = useState("");
  const weightUnit = loadUserWeightUnit(user.uid);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const savedMaxFields = maxFields.filter((field) => maxValue(field.key));

  function updateMax(key, value) {
    setSaved(false);
    setMaxes({ ...maxes, [key]: { value, unit: weightUnit } });
  }

  async function persistMaxes(event) {
    event.preventDefault();
    setSaving(true);
    setSaveError("");
    const result = await onSaveMaxes(user.uid, maxes);
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setSaveError(result?.local ? "Maxes saved on this device. Cloud sync did not complete." : "");
  }

  return (
    <section className="profile-panel maxes-panel">
      <div className="profile-header maxes-header">
        <div className="profile-header-main">
          <span className="profile-avatar">
            <Trophy size={34} />
          </span>
          <div>
            <p className="eyebrow">Profile maxes</p>
            <h2>Training max weights</h2>
          </div>
        </div>
        <button className={editing ? "icon-button active" : "icon-button"} type="button" onClick={() => setEditing(!editing)} aria-label={editing ? "View saved maxes" : "Edit maxes"} title={editing ? "View maxes" : "Edit maxes"}>
          <PencilLine size={17} />
        </button>
      </div>

      <div className="profile-block">
        <h3>Saved Maxes</h3>
        {savedMaxFields.length ? (
          <div className="profile-max-grid">
            {savedMaxFields.map((field) => (
              <div className="profile-max" key={field.key}>
                <span>{field.label}</span>
                <strong>{maxValue(field.key)}{weightUnit}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-list-copy">No maxes saved yet.</p>
        )}
        <div>
          {saved && <p className="save-status">Maxes saved.</p>}
          {saveError && <p className="form-error">{saveError}</p>}
        </div>
      </div>

      {editing && <form className="maxes-form" onSubmit={persistMaxes}>
        {maxFields.map((field) => (
          <label className="maxes-field" key={field.key}>
            {field.label}
            <span className="max-input-row">
              <input
                value={maxValue(field.key)}
                onChange={(event) => updateMax(field.key, event.target.value)}
                inputMode="decimal"
                placeholder={`Max (${weightUnit})`}
              />
            </span>
          </label>
        ))}
        <button className="primary" type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Save maxes"}
        </button>
        {saved && <p className="save-status">Maxes saved.</p>}
        {saveError && <p className="form-error">{saveError}</p>}
      </form>}
    </section>
  );
}
