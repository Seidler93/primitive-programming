import { ShipWheel } from "lucide-react";

export const RowingLayout = {
  type: "rowing",
  label: "Rowing",
  icon: ShipWheel,
  fields: [
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration", kind: "time" },
    { key: "pace", label: "Pace", kind: "time" },
  ],
};
