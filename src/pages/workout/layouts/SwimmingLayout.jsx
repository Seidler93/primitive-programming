import { Waves } from "lucide-react";

export const SwimmingLayout = {
  type: "swimming",
  label: "Swimming",
  icon: Waves,
  fields: [
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration", kind: "time" },
    { key: "pace", label: "Pace", kind: "time" },
    { key: "location", label: "Location", options: ["Pool", "Open water"] },
  ],
};
