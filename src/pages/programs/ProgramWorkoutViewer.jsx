import React from "react";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { formatDate, groupWorkouts, isWorkoutCompleted, progressSummary } from "../../utils/appHelpers";

export function ProgramWorkoutViewer({ program, programWorkouts, workouts, onBack }) {
  const workoutGroups = groupWorkouts(
    [...programWorkouts]
      .filter((item) => item.date)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.focus || "").localeCompare(String(b.focus || ""))),
  );
  const summary = progressSummary(programWorkouts, workouts);
  const isActiveProgram = Boolean(program.activeProgram);

  return (
    <section className="programs-panel program-workout-view">
      <div className="section-heading program-workout-heading">
        <button className="icon-button" type="button" onClick={onBack} aria-label="Back to programs" title="Back to programs">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="eyebrow">Program workouts</p>
          <h2>{program.name}</h2>
        </div>
      </div>

      {isActiveProgram ? (
        <div className="program-workout-summary program-workout-progress-summary">
          <div>
            <span>Progress</span>
            <strong>{summary.completed}/{summary.total} workouts complete</strong>
            <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
              <span style={{ width: `${summary.percent}%` }} />
            </div>
          </div>
        </div>
      ) : (
        <div className="program-workout-summary program-workout-library-summary">
          <div>
            <span>Workouts</span>
            <strong>{summary.total}</strong>
          </div>
        </div>
      )}

      {workoutGroups.length ? (
        <div className="program-workout-list">
          {workoutGroups.map((group, index) => {
            const completed = isWorkoutCompleted(workouts[group.date]);
            return (
              <article className={`program-workout-card ${completed ? "completed" : ""}`} key={group.key}>
                <div className="program-workout-card-header">
                  <div>
                    <p className="eyebrow">Workout {index + 1} | {formatDate(group.date)}</p>
                    <h3>{group.title}</h3>
                  </div>
                  {completed && <CheckCircle2 size={20} aria-label="Completed" />}
                </div>
                <div className="program-workout-exercises">
                  {group.items.map((item, itemIndex) => (
                    <div className="program-workout-exercise" key={item.id || `${group.key}-${itemIndex}`}>
                      <strong>{item.exercise || "Exercise"}</strong>
                      <span>{item.prescription || "No prescription yet"}</span>
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No workouts have been added to this program yet.</p>
      )}
    </section>
  );
}
