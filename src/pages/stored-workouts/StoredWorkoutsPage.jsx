import React from "react";
import { CheckCircle2, ChevronRight, Dumbbell } from "lucide-react";
import { importedProgramMeta } from "../../data/programData";
import { formatDate, workoutLogKey } from "../../utils/appHelpers";

export function StoredWorkoutsPage({ user, workouts, logs, programs, onOpenWorkout }) {
  const [activeTab, setActiveTab] = useState("upcoming");
  const [visibleHistoryCount, setVisibleHistoryCount] = useState(10);
  const programOptions = [{ ...importedProgramMeta }, ...programs.filter((program) => program.id !== "default")];
  const today = new Date().toISOString().slice(0, 10);
  const upcomingWorkouts = groupWorkouts(workouts)
    .filter((workout) => workout.date && workout.date >= today)
    .sort((a, b) => `${a.date || ""}`.localeCompare(`${b.date || ""}`));
  const savedWorkouts = Array.isArray(user?.workoutTemplates) ? user.workoutTemplates.slice(0, 10) : [];
  const historyWorkouts = Object.entries(logs)
    .filter(([, workout]) => workout?.completed || workout?.status === "completed")
    .map(([id, workout]) => ({ id, ...workout }))
    .sort((a, b) => `${b.completedAt || b.updatedAt || b.date || ""}`.localeCompare(`${a.completedAt || a.updatedAt || a.date || ""}`));
  const visibleHistory = historyWorkouts.slice(0, visibleHistoryCount);
  const tabs = [
    { id: "upcoming", label: "Upcoming", count: upcomingWorkouts.length },
    { id: "saved", label: "Saved", count: savedWorkouts.length },
    { id: "history", label: "History", count: historyWorkouts.length },
  ];

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Dumbbell size={20} />
        <h2>Workouts</h2>
      </div>

      <div className="workout-tabs" role="tablist" aria-label="Workout views">
        {tabs.map((tab) => (
          <button
            className={activeTab === tab.id ? "workout-tab active" : "workout-tab"}
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            role="tab"
            type="button"
            aria-selected={activeTab === tab.id}
          >
            {tab.label}
            <span>{tab.count}</span>
          </button>
        ))}
      </div>

      {activeTab === "upcoming" && (upcomingWorkouts.length ? (
        <div className="stored-workout-list">
          {upcomingWorkouts.map((workout) => {
            const programName = programOptions.find((program) => program.id === (workout.programId || "default"))?.name || importedProgramMeta.name;
            const logKey = workoutLogKey(workout.date, workout.key);
            const completed = Boolean(logs[logKey]?.completed || logs[workout.date]?.completed);
            return (
              <button className="stored-workout-card" key={workout.key} type="button" onClick={() => workout.date && onOpenWorkout(workout.date, workout.key)}>
                <div>
                  <p className="eyebrow">{workout.date ? formatDate(workout.date) : "Unscheduled"} | {programName}</p>
                  <h3>{workout.title}</h3>
                  <span>{workout.items.length} exercise{workout.items.length === 1 ? "" : "s"} | {workout.week ? `Week ${workout.week}` : workout.phase}</span>
                </div>
                {completed ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No upcoming workouts yet.</p>
      ))}

      {activeTab === "saved" && (savedWorkouts.length ? (
        <div className="stored-workout-list">
          {savedWorkouts.map((workout) => (
            <article className="stored-workout-card" key={workout.id}>
              <div>
                <p className="eyebrow">Saved workout</p>
                <h3>{workout.name || workout.title || "Saved workout"}</h3>
                <span>{workout.exercises?.length || 0} exercise{workout.exercises?.length === 1 ? "" : "s"}</span>
              </div>
              <Dumbbell size={20} />
            </article>
          ))}
        </div>
      ) : (
        <p className="empty-list-copy">No saved workouts yet.</p>
      ))}

      {activeTab === "history" && (visibleHistory.length ? (
        <>
          <div className="stored-workout-list">
            {visibleHistory.map((workout) => (
              <button className="stored-workout-card" key={workout.id} type="button" onClick={() => workout.date && onOpenWorkout(workout.date, workout.id)}>
                <div>
                  <p className="eyebrow">{workout.date ? formatDate(workout.date) : "Completed"} | Completed</p>
                  <h3>{workout.workoutFocus || workout.title || "Completed workout"}</h3>
                  <span>{workout.notes || "Workout record"}</span>
                </div>
                <CheckCircle2 size={20} />
              </button>
            ))}
          </div>
          {visibleHistory.length < historyWorkouts.length && (
            <button className="secondary load-more-button" type="button" onClick={() => setVisibleHistoryCount((count) => count + 10)}>
              Load more
            </button>
          )}
        </>
      ) : (
        <p className="empty-list-copy">No completed workouts yet.</p>
      ))}
    </section>
  );
}
