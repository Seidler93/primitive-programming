import React, { useState } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, PencilLine, Save, TrendingUp, Trophy } from "lucide-react";
import { bodyMetricFields, maxFields } from "../app/config";
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
} from "../utils/appHelpers";

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

export function GoalsPage({ user, logs }) {
  const goals = loadUserGoals(user.uid);
  const bodyMetrics = loadBodyMetrics(user.uid);
  const maxes = loadUserMaxes(user.uid);
  const weightUnit = loadUserWeightUnit(user.uid);
  const activeGoals = goals.filter((goal) => !goal.archivedAt);
  const recentCompletedCount = completedWorkoutsLast30Days(logs);
  const weekStreak = weeklyWorkoutStreak(logs);

  function renderGoal(goal) {
    const latestMetric = goal.type === "metric" ? metricLatest(bodyMetrics, goal.metric) : null;
    const progress = goal.type === "metric"
      ? {
          ...(metricGoalProgress(goal, latestMetric?.[goal.metric]) || { percent: 0, complete: false }),
          label: `${latestMetric?.[goal.metric] || 0}/${goal.target}${bodyMetricUnit(bodyMetricFields.find((field) => field.key === goal.metric) || {}, weightUnit)}`,
        }
      : goalProgress(goal, logs, maxes, weightUnit);
    const liftLabel = maxFields.find((field) => field.key === goal.lift)?.label;
    const metricLabel = bodyMetricFields.find((field) => field.key === goal.metric)?.label;
    const bodyweightChart = goal.type === "metric" && goal.metric === "bodyweight"
      ? metricLineChart(bodyMetrics, goal.metric, goal.target)
      : null;
    return (
      <article className={progress.complete ? "goal-card complete" : "goal-card"} key={goal.id}>
        <div className="goal-card-heading">
          <div>
            <p className="eyebrow">{goal.type === "metric" ? metricLabel : goal.type === "max" ? liftLabel : "Workout consistency"}</p>
            <h4>{goal.title}</h4>
          </div>
          {progress.complete ? <CheckCircle2 size={20} /> : <TrendingUp size={20} />}
        </div>
        {bodyweightChart ? (
          <div className="bodyweight-chart" role="img" aria-label="Bodyweight progress over time">
            <svg viewBox="0 0 100 90" aria-hidden="true">
              <line className="chart-grid-line" x1="8" x2="92" y1="18" y2="18" />
              <line className="chart-grid-line" x1="8" x2="92" y1="47" y2="47" />
              <line className="chart-grid-line" x1="8" x2="92" y1="76" y2="76" />
              {bodyweightChart.targetY !== null && (
                <line className="chart-target-line" x1="8" x2="92" y1={bodyweightChart.targetY} y2={bodyweightChart.targetY} />
              )}
              {bodyweightChart.points.length > 1 && <polyline className="chart-progress-line" points={bodyweightChart.line} />}
              {bodyweightChart.points.map((point, index) => (
                <circle
                  className={index === bodyweightChart.points.length - 1 ? "chart-point latest" : "chart-point"}
                  cx={point.x}
                  cy={point.y}
                  key={`${point.date}-${index}`}
                  r={index === bodyweightChart.points.length - 1 ? 3.2 : 2.2}
                />
              ))}
            </svg>
            <div className="bodyweight-chart-labels">
              <span>{formatShortDate(bodyweightChart.first.date)}: {bodyweightChart.first.value}{weightUnit}</span>
              <strong>{bodyweightChart.latest.value}{weightUnit}</strong>
              <span>{formatShortDate(bodyweightChart.latest.date)}</span>
            </div>
          </div>
        ) : (
          <div className="progress-meter" aria-label={`${progress.percent}% complete`}>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        )}
        <dl className="program-stats">
          <div>
            <dt>Progress</dt>
            <dd>{progress.label}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{formatDate(goal.startDate)}</dd>
          </div>
        </dl>
      </article>
    );
  }

  return (
    <section className="profile-panel goals-panel">
      <div className="progress-header">
        <div className="profile-header">
          <span className="profile-avatar">
            <TrendingUp size={34} />
          </span>
          <div>
            <p className="eyebrow">Athlete progress</p>
            <h2>Progress</h2>
          </div>
        </div>
      </div>

      <div className="progress-snapshot-grid">
        <article className="progress-snapshot-card">
          <Dumbbell size={20} />
          <strong>{recentCompletedCount}</strong>
          <span>Workouts completed last 30 days</span>
        </article>
        <article className="progress-snapshot-card">
          <CalendarDays size={20} />
          <strong>{weekStreak}</strong>
          <span>Weekly workout streak</span>
          <p className="progress-card-note">Consecutive weeks with at least one workout</p>
        </article>
      </div>

      <div className="goal-section">
        <div className="program-section-title">
          <h3>Active Goal Progress</h3>
          <span>{activeGoals.length}</span>
        </div>
        {activeGoals.length ? (
          <div className="goal-card-grid">
            {activeGoals.map(renderGoal)}
          </div>
        ) : (
          <p className="empty-list-copy">No active goals yet.</p>
        )}
      </div>
    </section>
  );
}
