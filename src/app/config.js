import {
  Bell,
  Settings,
  SlidersHorizontal,
  TrendingUp,
} from "lucide-react";
import packageInfo from "../../package.json";

export const maxFields = [
  { key: "backSquat", label: "Squat" },
  { key: "bench", label: "Bench" },
  { key: "deadlift", label: "Deadlift" },
  { key: "cleanJerk", label: "Clean and Jerk" },
  { key: "snatch", label: "Snatch" },
  { key: "frontSquat", label: "Front Squat" },
];

export const appVersion = packageInfo.version;
export const defaultSelectedDate = "2026-05-11";
export const flexibleScheduleMode = "unknown-days";
export const routeViews = new Set(["client", "workout-list", "workout", "profile", "edit-profile", "maxes", "goals", "progress", "food-log", "stretches", "warmup-cooldown", "settings", "settings-account", "settings-preferences", "settings-metrics", "settings-updates", "store", "community", "messages", "news", "stored-programs", "stored-workouts", "programs", "athletes"]);

export const bodyMetricFields = [
  { key: "bodyweight", label: "Bodyweight", unit: "lb", unitType: "weight" },
  { key: "bodyFat", label: "Body fat", unit: "%" },
  { key: "muscleMass", label: "Muscle mass", unit: "lb", unitType: "weight" },
];

export const defaultBodyMetricSettings = Object.fromEntries(bodyMetricFields.map((field) => [
  field.key,
  { enabled: true, mode: "static" },
]));

export const warmupPresets = [
  {
    id: "full-body",
    title: "Full body",
    exercises: ["Bike or row easy", "World's greatest stretch", "Empty bar complex"],
  },
  {
    id: "lower-body",
    title: "Lower body",
    exercises: ["Hip airplanes", "Goblet squat hold", "Empty bar squat"],
  },
  {
    id: "upper-body",
    title: "Upper body",
    exercises: ["Band pull-aparts", "Scap push-ups", "Empty bar press"],
  },
];

export const settingsSections = [
  { id: "account", title: "Account", eyebrow: "Device and login", icon: Settings },
  { id: "preferences", title: "Preferences", eyebrow: "Notifications and units", icon: SlidersHorizontal },
  { id: "metrics", title: "Metrics", eyebrow: "Profile data display", icon: TrendingUp },
  { id: "updates", title: "What's new", eyebrow: "Version and releases", icon: Bell },
];

export const storePrograms = [
  {
    id: "strength-base",
    name: "Strength Base",
    eyebrow: "8 week program",
    price: "$49",
    description: "Build squat, press, and pull volume with structured strength days.",
  },
  {
    id: "olympic-primer",
    name: "Olympic Primer",
    eyebrow: "6 week program",
    price: "$39",
    description: "Technique-first snatch and clean and jerk work with focused accessories.",
  },
  {
    id: "complete-training",
    name: "Complete Training",
    eyebrow: "12 week program",
    price: "$79",
    description: "Full training calendar with strength, weightlifting, conditioning, and warm-ups.",
  },
];
