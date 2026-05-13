import React from "react";
import { Bike } from "lucide-react";
import { MetricWorkoutPage } from "./MetricWorkoutPage";

const layout = {
  icon: Bike,
  label: "Biking",
  fields: [
    { key: "distance", label: "Distance", placeholder: "Miles or km" },
    { key: "duration", label: "Duration", placeholder: "Ride time" },
    { key: "pace", label: "Pace", placeholder: "Avg speed or pace" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Stationary"], defaultValue: "pavement" },
  ],
};

export function BikingWorkoutPage(props) {
  return <MetricWorkoutPage {...props} layout={layout} workoutType="biking" />;
}
