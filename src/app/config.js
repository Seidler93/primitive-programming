import {
  Bell,
  CalendarDays,
  ClipboardList,
  Dumbbell,
  Flame,
  MessageCircle,
  Newspaper,
  PersonStanding,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  Utensils,
  UserRound,
  UsersRound,
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

export const menuButtonItems = [
  { id: "home", view: "client", label: "Home", icon: CalendarDays },
  { id: "profile", view: "profile", label: "Profile", icon: UserRound },
  { id: "store", view: "store", label: "Store", icon: ShoppingBag },
  { id: "community", view: "community", label: "Communities", icon: UsersRound },
  { id: "messages", view: "messages", label: "Messages", icon: MessageCircle },
  { id: "news", view: "news", label: "News", icon: Newspaper },
  { id: "stored-programs", view: "stored-programs", label: "Programs", icon: ClipboardList },
  { id: "stored-workouts", view: "stored-workouts", label: "Workouts", icon: Dumbbell },
  { id: "food-log", view: "food-log", label: "Food Log", icon: Utensils },
  { id: "stretches", view: "stretches", label: "Stretches", icon: PersonStanding },
  { id: "warmup-cooldown", view: "warmup-cooldown", label: "Warm Up / Cooldown", icon: Flame },
  { id: "maxes", view: "maxes", label: "Maxes", icon: Trophy },
  { id: "progress", view: "progress", label: "Progress", icon: TrendingUp, hideForTrainer: true },
  { id: "programs", view: "programs", label: "Program Builder", icon: ClipboardList, trainerOnly: true, hideOnMobile: true },
  { id: "athletes", view: "athletes", label: "Athletes", icon: UsersRound, trainerOnly: true },
  { id: "settings", view: "settings", label: "Settings", icon: Settings },
];

export const defaultMenuButtonOrder = menuButtonItems.map((item) => item.id);
export const menuButtonItemMap = Object.fromEntries(menuButtonItems.map((item) => [item.id, item]));

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
