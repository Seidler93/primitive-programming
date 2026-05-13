import React from "react";
import { Footprints } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: Footprints,
  label: "Running",
  fields: [
    { key: "distance", label: "Distance", placeholder: "Miles or km" },
    { key: "duration", label: "Duration", placeholder: "Total time" },
    { key: "pace", label: "Pace", placeholder: "Avg pace" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
  ],
};

export function RunningWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="running" />;
}
