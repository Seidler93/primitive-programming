import React, { useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Dumbbell, Plus, Save, TrendingUp } from "lucide-react";
import { bodyMetricFields, maxFields } from "../../app/config";
import { loadUserProgress, saveUserProgress } from "../../db";
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
  saveBodyMetrics,
  saveUserMaxes,
  weeklyWorkoutStreak,
} from "../../utils/appHelpers";

function localDateValue() {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
}

export function GoalsPage({ user, workouts, onSaveMaxes }) {
  const goals = loadUserGoals(user.uid);
  const [bodyMetrics, setBodyMetrics] = useState(() => loadBodyMetrics(user.uid));
  const [maxes, setMaxes] = useState(() => loadUserMaxes(user.uid));
  const [progress, setProgress] = useState({ maxes: [], bodyMetrics: [] });
  const [showAddProgress, setShowAddProgress] = useState(false);
  const [progressType, setProgressType] = useState("max");
  const [progressKey, setProgressKey] = useState(maxFields[0]?.key || "");
  const [progressValue, setProgressValue] = useState("");
  const [progressDate, setProgressDate] = useState(localDateValue);
  const [progressSaving, setProgressSaving] = useState(false);
  const [progressSaved, setProgressSaved] = useState(false);
  const weightUnit = loadUserWeightUnit(user.uid);
  const activeGoals = goals.filter((goal) => !goal.archivedAt);
  const recentCompletedCount = completedWorkoutsLast30Days(workouts);
  const weekStreak = weeklyWorkoutStreak(workouts);
  const progressOptions = progressType === "max" ? maxFields : bodyMetricFields;
  const selectedProgressField = progressOptions.find((field) => field.key === progressKey) || progressOptions[0];
  const selectedProgressUnit = progressType === "max" ? weightUnit : bodyMetricUnit(selectedProgressField || {}, weightUnit);
  const recentProgress = useMemo(() => [
    ...progress.maxes.map((entry) => ({ ...entry, section: "Max" })),
    ...progress.bodyMetrics.map((entry) => ({ ...entry, section: "Body metric" })),
  ].sort((a, b) => new Date(b.timestamp || b.date) - new Date(a.timestamp || a.date)).slice(0, 8), [progress]);

  useEffect(() => {
    let active = true;
    loadUserProgress(user.uid).then((savedProgress) => {
      if (active) setProgress(savedProgress);
    });
    return () => {
      active = false;
    };
  }, [user.uid]);

  function updateProgressType(nextType) {
    setProgressType(nextType);
    setProgressKey(nextType === "max" ? maxFields[0]?.key || "" : bodyMetricFields[0]?.key || "");
    setProgressValue("");
    setProgressSaved(false);
  }

  async function addProgressEntry(event) {
    event.preventDefault();
    if (!selectedProgressField || !progressValue.trim()) return;
    setProgressSaving(true);
    setProgressSaved(false);
    const now = new Date().toISOString();
    const entry = {
      id: `${progressType}-${progressKey}-${Date.now()}`,
      key: progressKey,
      label: selectedProgressField.label,
      value: progressValue.trim(),
      unit: selectedProgressUnit,
      date: progressDate,
      timestamp: now,
    };
    const nextProgress = progressType === "max"
      ? { ...progress, maxes: [...progress.maxes, entry] }
      : { ...progress, bodyMetrics: [...progress.bodyMetrics, entry] };

    try {
      if (progressType === "max") {
        const nextMaxes = { ...maxes, [progressKey]: { value: entry.value, unit: selectedProgressUnit } };
        saveUserMaxes(user.uid, nextMaxes);
        await onSaveMaxes?.(user.uid, nextMaxes);
        setMaxes(nextMaxes);
      } else {
        const nextBodyMetric = {
          id: entry.id,
          date: new Date(`${progressDate}T12:00:00`).toISOString(),
          bodyweight: "",
          bodyFat: "",
          muscleMass: "",
          [progressKey]: Number(entry.value) || entry.value,
        };
        const nextBodyMetrics = [...bodyMetrics, nextBodyMetric];
        saveBodyMetrics(user.uid, nextBodyMetrics);
        setBodyMetrics(nextBodyMetrics);
      }
      await saveUserProgress(user.uid, nextProgress);
      setProgress(nextProgress);
      setProgressValue("");
      setProgressDate(localDateValue());
      setShowAddProgress(false);
      setProgressSaved(true);
    } finally {
      setProgressSaving(false);
    }
  }

  function renderGoal(goal) {
    const latestMetric = goal.type === "metric" ? metricLatest(bodyMetrics, goal.metric) : null;
    const progress = goal.type === "metric"
      ? {
          ...(metricGoalProgress(goal, latestMetric?.[goal.metric]) || { percent: 0, complete: false }),
          label: `${latestMetric?.[goal.metric] || 0}/${goal.target}${bodyMetricUnit(bodyMetricFields.find((field) => field.key === goal.metric) || {}, weightUnit)}`,
        }
      : goalProgress(goal, workouts, maxes, weightUnit);
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
        <button className="primary" type="button" onClick={() => {
          setProgressSaved(false);
          setShowAddProgress(true);
        }}>
          <Plus size={18} />
          Add progress
        </button>
      </div>
      {progressSaved && <p className="save-status">Progress added.</p>}

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
          <h3>Recent Progress</h3>
          <span>{recentProgress.length}</span>
        </div>
        {recentProgress.length ? (
          <div className="progress-entry-list">
            {recentProgress.map((entry) => (
              <article className="progress-entry-card" key={entry.id}>
                <div>
                  <p className="eyebrow">{entry.section}</p>
                  <h4>{entry.label}</h4>
                </div>
                <div>
                  <strong>{entry.value}{entry.unit}</strong>
                  <span>{formatDate(entry.date)}</span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <p className="empty-list-copy">No progress entries logged yet.</p>
        )}
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
      {showAddProgress && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form" role="dialog" aria-modal="true" aria-labelledby="add-progress-title" onSubmit={addProgressEntry}>
            <div>
              <p className="eyebrow">Progress log</p>
              <h2 id="add-progress-title">Add progress</h2>
            </div>
            <div className="segmented-control" aria-label="Progress type">
              <button className={progressType === "max" ? "active" : ""} type="button" onClick={() => updateProgressType("max")}>
                Max
              </button>
              <button className={progressType === "bodyMetric" ? "active" : ""} type="button" onClick={() => updateProgressType("bodyMetric")}>
                Body metric
              </button>
            </div>
            <label>
              What changed?
              <select value={progressKey} onChange={(event) => {
                setProgressKey(event.target.value);
                setProgressSaved(false);
              }}>
                {progressOptions.map((field) => (
                  <option value={field.key} key={field.key}>{field.label}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input value={progressDate} onChange={(event) => setProgressDate(event.target.value)} type="date" required />
            </label>
            <label>
              Value
              <span className="unit-input">
                <input value={progressValue} onChange={(event) => setProgressValue(event.target.value)} inputMode="decimal" placeholder={selectedProgressUnit || "Value"} required />
                {selectedProgressUnit && <small>{selectedProgressUnit}</small>}
              </span>
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowAddProgress(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={progressSaving || !progressValue.trim()}>
                <Save size={18} />
                {progressSaving ? "Saving..." : "Save progress"}
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
