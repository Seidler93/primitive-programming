import React from "react";
import { UsersRound } from "lucide-react";
import { importedProgramMeta } from "../../data/programData";
import { formatDate, progressSummary } from "../../utils/appHelpers";

export function AthletesPage({ programs, workouts, logs }) {
  const defaultProgram = { ...importedProgramMeta, athleteEmail: "dev-athlete@primitive.local" };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const athletes = Array.from(
    programOptions.reduce((map, program) => {
      const email = program.athleteEmail || "Unassigned athlete";
      const current = map.get(email) || { email, programs: [], workouts: [] };
      const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
      current.programs.push(program);
      current.workouts.push(...programWorkouts);
      map.set(email, current);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => a.email.localeCompare(b.email));

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <UsersRound size={20} />
        <h2>Athletes</h2>
      </div>

      {athletes.length ? (
        <div className="program-card-grid">
          {athletes.map((athlete) => {
            const summary = progressSummary(athlete.workouts, logs);
            return (
              <article className="program-card" key={athlete.email}>
                <div>
                  <p className="eyebrow">{athlete.programs.length} program{athlete.programs.length === 1 ? "" : "s"}</p>
                  <h4>{athlete.email}</h4>
                </div>
                <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                  <span style={{ width: `${summary.percent}%` }} />
                </div>
                <dl className="program-stats">
                  <div>
                    <dt>Complete</dt>
                    <dd>{summary.completed}/{summary.total}</dd>
                  </div>
                  <div>
                    <dt>Next</dt>
                    <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                  </div>
                </dl>
                <p className="program-note">{athlete.programs.map((program) => program.name).join(", ")}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No athletes assigned yet.</p>
      )}
    </section>
  );
}
