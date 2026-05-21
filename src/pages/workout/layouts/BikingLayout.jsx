import { Bike } from "lucide-react";

export const BikingLayout = {
  type: "biking",
  label: "Biking",
  icon: Bike,
  fields: [
    { key: "distance", label: "Distance" },
    { key: "duration", label: "Duration", kind: "time" },
    { key: "pace", label: "Pace", kind: "time" },
    { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Stationary"], defaultValue: "pavement" },
  ],
};
