import React from "react";
import { CalendarStrip } from "../../components/workout/WorkoutViews";

export function HomePage({
  calendarMonths,
  logs,
  onOpenWorkoutList,
  onShowMoreMonths,
  selectedDate,
  todayTarget,
  workoutsByDate,
}) {
  return (
    <>
      <div className="today-row">
        <button className="primary" type="button" onClick={() => onOpenWorkoutList(todayTarget)}>
          View today's workout
        </button>
      </div>
      <CalendarStrip
        sections={calendarMonths}
        selectedDate={selectedDate}
        onSelectDate={onOpenWorkoutList}
        logs={logs}
        workoutsByDate={workoutsByDate}
        onShowMoreMonths={onShowMoreMonths}
      />
    </>
  );
}
