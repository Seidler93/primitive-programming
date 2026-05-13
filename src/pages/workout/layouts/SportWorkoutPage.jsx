import React from "react";
import { Volleyball } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: Volleyball,
  label: "Sport",
  fields: [
    { key: "duration", label: "Duration", placeholder: "Practice or game time" },
  ],
};

export function SportWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="sport" />;
}
