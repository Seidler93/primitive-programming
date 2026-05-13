import React from "react";
import { Waves } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: Waves,
  label: "Swimming",
  fields: [
    { key: "distance", label: "Distance", placeholder: "Meters, yards, or laps" },
    { key: "duration", label: "Duration", placeholder: "Total time" },
    { key: "pace", label: "Pace", placeholder: "Avg pace" },
    { key: "location", label: "Location", options: ["Pool", "Open water"] },
  ],
};

export function SwimmingWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="swimming" />;
}
