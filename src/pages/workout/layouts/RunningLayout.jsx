import { Footprints } from "lucide-react";

export const RunningLayout = {
  type: "running",
  label: "Running",
  icon: Footprints,
  fields: [
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration", kind: "time" },
    { key: "pace", label: "Pace", kind: "time" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
  ],
};
