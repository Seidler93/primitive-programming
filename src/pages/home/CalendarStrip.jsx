import React from "react";
import { CheckCircle2 } from "lucide-react";
import { formatDate, isWorkoutCompleted } from "../../utils/appHelpers";

export function CalendarStrip({ sections, selectedDate, onSelectDate, workouts, workoutsByDate, onShowMoreMonths }) {
  return (
    <section className="calendar-band" aria-label="Workout calendar">
      <div className="month-stack">
        {sections.map((section) => (
          <div className="calendar-month" key={section.key}>
            <h3>{section.label}</h3>
            <div className="date-grid">
              {section.dates.map((date) => {
                const isOutsideMonth = new Date(`${date}T12:00:00`).getMonth() !== section.month;
                const isCompleted = isWorkoutCompleted(workouts[date]);
                return (
                  <button
                    className={`date-tile ${workoutsByDate[date] ? "" : "empty"} ${isCompleted ? "completed" : ""} ${isOutsideMonth ? "outside-month" : ""} ${selectedDate === date && !isOutsideMonth ? "selected" : ""}`}
                    key={`${section.key}-${date}`}
                    onClick={() => onSelectDate(date)}
                    type="button"
                  >
                    <span>{formatDate(date).slice(0, 3)}</span>
                    <strong>{new Date(`${date}T12:00:00`).getDate()}</strong>
                    {isCompleted && <CheckCircle2 className="complete-day-icon" size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button className="secondary calendar-more-button" type="button" onClick={onShowMoreMonths}>
        Show more months
      </button>
    </section>
  );
}
