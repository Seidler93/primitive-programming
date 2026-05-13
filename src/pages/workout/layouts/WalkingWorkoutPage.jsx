import React from "react";
import { Footprints } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: Footprints,
  label: "Walking",
  fields: [
    { key: "distance", label: "Distance", placeholder: "Miles or km" },
    { key: "duration", label: "Duration", placeholder: "Walk time" },
    { key: "pace", label: "Pace", placeholder: "Avg pace" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
  ],
};

export function WalkingWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="walking" />;
}
