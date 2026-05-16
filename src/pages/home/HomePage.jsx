import React from "react";
import { CalendarStrip } from "./CalendarStrip";

export function HomePage({
  calendarMonths,
  isLoadingWorkouts,
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
        <button className="primary" type="button" onClick={() => onOpenWorkoutList(todayTarget)} disabled={isLoadingWorkouts}>
          {isLoadingWorkouts ? "Loading workouts" : "View today's workout"}
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
