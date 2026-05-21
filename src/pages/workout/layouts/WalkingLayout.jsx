import { Footprints } from "lucide-react";

export const WalkingLayout = {
  type: "walking",
  label: "Walking",
  icon: Footprints,
  fields: [
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration", kind: "time" },
    { key: "pace", label: "Pace", kind: "time" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
  ],
};
