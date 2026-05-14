import React from "react";
import { CalendarStrip } from "./CalendarStrip";

export function HomePage({
  calendarMonths,
  workouts,
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
        workouts={workouts}
        workoutsByDate={workoutsByDate}
        onShowMoreMonths={onShowMoreMonths}
      />
    </>
  );
}
