import React from "react";
import { ShipWheel } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: ShipWheel,
  label: "Rowing",
  fields: [
    { key: "distance", label: "Distance", placeholder: "Meters or km" },
    { key: "duration", label: "Duration", placeholder: "Total time" },
    { key: "pace", label: "Pace", placeholder: "Avg split or pace" },
  ],
};

export function RowingWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="rowing" />;
}
