import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ArrowDown,
  CalendarDays,
  Bell,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  Clock,
  Dumbbell,
  ArrowLeft,
  ArrowUp,
  Eye,
  EyeOff,
  Flame,
  GripVertical,
  LogOut,
  Menu,
  MessageCircle,
  Minus,
  Newspaper,
  PersonStanding,
  PencilLine,
  Plus,
  Save,
  Settings,
  ShoppingBag,
  SlidersHorizontal,
  TrendingUp,
  Trophy,
  Utensils,
  UserRound,
  UsersRound,
} from "lucide-react";
import "./styles.css";
import packageInfo from "../package.json";
import { importedProgram } from "./programData";
import { exerciseSuggestions, similarExercises } from "./exerciseLibrary";
import {
  hasFirebaseConfig,
  isTrainerUser,
  loadCustomWorkouts,
  loadPrograms,
  loadUserMaxes as loadCloudUserMaxes,
  loadUserProfile,
  loadWorkoutLogs,
  login,
  loginDev,
  logout,
  observeAuth,
  saveProgram,
  saveCustomWorkout,
  saveUserMaxes as saveCloudUserMaxes,
  saveWorkoutLog,
  saveUserProfile,
  requestNotificationAccess,
  listenForForegroundMessages,
  uploadUserProfileImage,
} from "./firebase";
import { activateWaitingServiceWorker, registerAppServiceWorker } from "./pwa";

const maxFields = [
  { key: "backSquat", label: "Squat" },
  { key: "bench", label: "Bench" },
  { key: "deadlift", label: "Deadlift" },
  { key: "cleanJerk", label: "Clean and Jerk" },
  { key: "snatch", label: "Snatch" },
  { key: "frontSquat", label: "Front Squat" },
];

const appVersion = packageInfo.version;
const defaultSelectedDate = "2026-05-11";
const routeViews = new Set(["client", "workout-list", "workout", "profile", "edit-profile", "maxes", "goals", "progress", "food-log", "stretches", "warmup-cooldown", "settings", "settings-account", "settings-preferences", "settings-metrics", "settings-updates", "store", "community", "messages", "news", "stored-programs", "stored-workouts", "programs", "athletes"]);
const bodyMetricFields = [
  { key: "bodyweight", label: "Bodyweight", unit: "lb", unitType: "weight" },
  { key: "bodyFat", label: "Body fat", unit: "%" },
  { key: "muscleMass", label: "Muscle mass", unit: "lb", unitType: "weight" },
];
const defaultBodyMetricSettings = Object.fromEntries(bodyMetricFields.map((field) => [
  field.key,
  { enabled: true, mode: "static" },
]));
const warmupPresets = [
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
const settingsSections = [
  { id: "account", title: "Account", eyebrow: "Device and login", icon: Settings },
  { id: "preferences", title: "Preferences", eyebrow: "Notifications and units", icon: SlidersHorizontal },
  { id: "metrics", title: "Metrics", eyebrow: "Profile data display", icon: TrendingUp },
  { id: "updates", title: "What's new", eyebrow: "Version and releases", icon: Bell },
];
const menuButtonItems = [
  { id: "home", view: "client", label: "Home", icon: CalendarDays },
  { id: "profile", view: "profile", label: "Profile", icon: UserRound },
  { id: "store", view: "store", label: "Store", icon: ShoppingBag },
  { id: "community", view: "community", label: "Community", icon: UsersRound },
  { id: "messages", view: "messages", label: "Messages", icon: MessageCircle },
  { id: "news", view: "news", label: "News", icon: Newspaper },
  { id: "stored-programs", view: "stored-programs", label: "Programs", icon: ClipboardList },
  { id: "stored-workouts", view: "stored-workouts", label: "Workouts", icon: Dumbbell },
  { id: "food-log", view: "food-log", label: "Food Log", icon: Utensils },
  { id: "stretches", view: "stretches", label: "Stretches", icon: PersonStanding },
  { id: "warmup-cooldown", view: "warmup-cooldown", label: "Warm Up / Cooldown", icon: Flame },
  { id: "maxes", view: "maxes", label: "Maxes", icon: Trophy },
  { id: "progress", view: "progress", label: "Progress", icon: TrendingUp, hideForTrainer: true },
  { id: "programs", view: "programs", label: "Program Builder", icon: ClipboardList, trainerOnly: true },
  { id: "athletes", view: "athletes", label: "Athletes", icon: UsersRound, trainerOnly: true },
  { id: "settings", view: "settings", label: "Settings", icon: Settings },
];
const defaultMenuButtonOrder = menuButtonItems.map((item) => item.id);
const menuButtonItemMap = Object.fromEntries(menuButtonItems.map((item) => [item.id, item]));
const storePrograms = [
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

function formatTimer(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

function normalizeExerciseSuggestion(value) {
  return value.includes(" - ") ? value.split(" - ").at(-1) : value;
}

function ExerciseAutocomplete({ value, onChange, placeholder, id }) {
  return (
    <>
      <input
        value={value}
        onChange={(event) => onChange(normalizeExerciseSuggestion(event.target.value))}
        list={id}
        placeholder={placeholder}
      />
      <datalist id={id}>
        {exerciseSuggestions.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
    </>
  );
}

function SimilarExerciseButtons({ exerciseName, onSelect }) {
  const suggestions = similarExercises(exerciseName, 5);
  if (!suggestions.length) return null;

  return (
    <div className="similar-exercise-list">
      {suggestions.map((name) => (
        <button className="similar-exercise-button" type="button" key={name} onClick={() => onSelect(name)}>
          {name}
        </button>
      ))}
    </div>
  );
}

function workoutDraftKey(userId, date, workoutKey = "default") {
  return `primitive-programming:workout-draft:${userId}:${date}:${workoutKey}`;
}

function loadWorkoutDraft(userId, date, workoutKey = "default") {
  try {
    const raw = localStorage.getItem(workoutDraftKey(userId, date, workoutKey));
    if (raw) return JSON.parse(raw);
    const legacyRaw = workoutKey === "default" ? null : localStorage.getItem(`primitive-programming:workout-draft:${userId}:${date}`);
    return legacyRaw ? JSON.parse(legacyRaw) : {};
  } catch {
    return {};
  }
}

function saveWorkoutDraft(userId, date, workoutKey, draft) {
  localStorage.setItem(workoutDraftKey(userId, date, workoutKey), JSON.stringify(draft));
}

function moveWorkoutDraft(userId, fromDate, fromWorkoutKey, toDate, toWorkoutKey) {
  try {
    const fromKey = workoutDraftKey(userId, fromDate, fromWorkoutKey);
    const draft = localStorage.getItem(fromKey);
    if (!draft) return;
    localStorage.setItem(workoutDraftKey(userId, toDate, toWorkoutKey), draft);
    localStorage.removeItem(fromKey);
  } catch {
    // Draft moves are a local convenience; scheduling should still succeed without them.
  }
}

function workoutScheduleOverridesKey(userId) {
  return `primitive-programming:workout-schedule-overrides:${userId}`;
}

function loadWorkoutScheduleOverrides(userId) {
  try {
    return JSON.parse(localStorage.getItem(workoutScheduleOverridesKey(userId)) || "{}");
  } catch {
    return {};
  }
}

function saveWorkoutScheduleOverrides(userId, overrides) {
  localStorage.setItem(workoutScheduleOverridesKey(userId), JSON.stringify(overrides));
}

function workoutLogKey(date, workoutKey) {
  return workoutKey === "blank" ? `${date}:custom` : date;
}

function userMaxesKey(userId) {
  return `primitive-programming:maxes:${userId}`;
}

function loadUserMaxes(userId) {
  try {
    const raw = localStorage.getItem(userMaxesKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveUserMaxes(userId, maxes) {
  localStorage.setItem(userMaxesKey(userId), JSON.stringify(maxes));
}

async function syncUserMaxes(userId, maxes) {
  saveUserMaxes(userId, maxes);
  return saveCloudUserMaxes(userId, maxes);
}

function userWeightUnitKey(userId) {
  return `primitive-programming:weight-unit:${userId}`;
}

function loadUserWeightUnit(userId) {
  try {
    const stored = localStorage.getItem(userWeightUnitKey(userId));
    if (stored === "kg" || stored === "lb") return stored;
    const firstSavedUnit = Object.values(loadUserMaxes(userId)).find((max) => max?.unit === "kg" || max?.unit === "lb")?.unit;
    return firstSavedUnit || "kg";
  } catch {
    return "kg";
  }
}

function saveUserWeightUnit(userId, unit) {
  localStorage.setItem(userWeightUnitKey(userId), unit === "lb" ? "lb" : "kg");
}

function userDistanceUnitKey(userId) {
  return `primitive-programming:distance-unit:${userId}`;
}

function loadUserDistanceUnit(userId) {
  try {
    const stored = localStorage.getItem(userDistanceUnitKey(userId));
    return stored === "mi" ? "mi" : "km";
  } catch {
    return "km";
  }
}

function saveUserDistanceUnit(userId, unit) {
  localStorage.setItem(userDistanceUnitKey(userId), unit === "mi" ? "mi" : "km");
}

function isDevUser(userId = "") {
  return String(userId).startsWith("dev-");
}

function userGoalsKey(userId) {
  return `primitive-programming:goals:${userId}`;
}

function loadUserGoals(userId) {
  try {
    return JSON.parse(localStorage.getItem(userGoalsKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function saveUserGoals(userId, goals) {
  localStorage.setItem(userGoalsKey(userId), JSON.stringify(goals));
}

function bodyMetricsKey(userId) {
  return `primitive-programming:body-metrics:${userId}`;
}

function loadBodyMetrics(userId) {
  try {
    return JSON.parse(localStorage.getItem(bodyMetricsKey(userId)) || "[]");
  } catch {
    return [];
  }
}

function saveBodyMetrics(userId, entries) {
  localStorage.setItem(bodyMetricsKey(userId), JSON.stringify(entries));
}

function bodyMetricSettingsKey(userId) {
  return `primitive-programming:body-metric-settings:${userId}`;
}

function loadBodyMetricSettings(userId) {
  try {
    return { ...defaultBodyMetricSettings, ...JSON.parse(localStorage.getItem(bodyMetricSettingsKey(userId)) || "{}") };
  } catch {
    return defaultBodyMetricSettings;
  }
}

function saveBodyMetricSettings(userId, settings) {
  localStorage.setItem(bodyMetricSettingsKey(userId), JSON.stringify(settings));
}

function menuButtonPreferencesKey() {
  return "primitive-programming:menu-button-preferences";
}

function normalizeMenuButtonPreferences(preferences = {}) {
  const savedOrder = Array.isArray(preferences.order) ? preferences.order : [];
  const knownIds = new Set(defaultMenuButtonOrder);
  const order = [
    ...savedOrder.filter((id) => knownIds.has(id)),
    ...defaultMenuButtonOrder.filter((id) => !savedOrder.includes(id)),
  ];
  const hidden = Array.isArray(preferences.hidden)
    ? preferences.hidden.filter((id) => knownIds.has(id))
    : [];

  return { order, hidden };
}

function loadMenuButtonPreferences() {
  try {
    return normalizeMenuButtonPreferences(JSON.parse(localStorage.getItem(menuButtonPreferencesKey()) || "{}"));
  } catch {
    return normalizeMenuButtonPreferences();
  }
}

function saveMenuButtonPreferences(preferences) {
  localStorage.setItem(menuButtonPreferencesKey(), JSON.stringify(normalizeMenuButtonPreferences(preferences)));
}

function readAppRoute() {
  if (typeof window === "undefined") {
    return { view: "client", selectedDate: defaultSelectedDate, selectedWorkoutKey: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  const view = requestedView === "goals" ? "progress" : routeViews.has(requestedView) ? requestedView : "client";
  return {
    view,
    selectedDate: params.get("date") || defaultSelectedDate,
    selectedWorkoutKey: params.get("workout") || "",
  };
}

function appRouteUrl({ view, selectedDate, selectedWorkoutKey }) {
  const params = new URLSearchParams();
  if (view && view !== "client") params.set("view", view);
  if ((view === "workout-list" || view === "workout") && selectedDate) params.set("date", selectedDate);
  if (view === "workout" && selectedWorkoutKey) params.set("workout", selectedWorkoutKey);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
}

function mergeUserProfile(user, profile = {}) {
  if (!user?.uid) return user;
  return {
    ...user,
    ...profile,
    uid: user.uid,
    email: profile.email || user.email || "",
    displayName: profile.displayName || user.displayName || "",
    photoURL: profile.photoURL || user.photoURL || "",
  };
}

function imageFileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const size = 512;
        const scale = Math.min(size / image.width, size / image.height, 1);
        const width = Math.max(1, Math.round(image.width * scale));
        const height = Math.max(1, Math.round(image.height * scale));
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.86));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

function shiftDate(date, offset) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
}

function daysBetweenDates(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return Math.round((end - start) / 86400000);
}

function groupByDate(items) {
  return items.reduce((map, item) => {
    map[item.date] = [...(map[item.date] || []), item];
    return map;
  }, {});
}

function workoutGroupKey(item) {
  return [
    item.programId || "default",
    item.date,
    item.week || "",
    item.phase || "",
    item.focus || "Workout",
  ].join("|");
}

function groupWorkouts(items) {
  return Object.values(items.reduce((map, item) => {
    const key = workoutGroupKey(item);
    if (!map[key]) {
      map[key] = {
        key,
        date: item.date,
        title: item.focus || "Workout",
        phase: item.phase || "Program",
        week: item.week,
        programId: item.programId || "default",
        items: [],
      };
    }
    map[key].items.push(item);
    return map;
  }, {}));
}

function dateRange(startDate, endDate) {
  const range = [];
  for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    range.push(day.toISOString().slice(0, 10));
  }
  return range;
}

function startOfWeekMonday(date) {
  const day = new Date(date);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

function endOfWeekSunday(date) {
  const day = new Date(date);
  const offset = (7 - day.getDay()) % 7;
  day.setDate(day.getDate() + offset);
  return day;
}

function monthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

function calendarSections(workoutDates, todayValue = new Date(), minimumMonthCount = 3) {
  const today = new Date(todayValue);
  const startMonth = new Date(today.getFullYear(), today.getMonth(), 1, 12);
  const latestWorkout = workoutDates
    .map((date) => new Date(`${date}T12:00:00`))
    .filter((date) => date >= startMonth)
    .sort((a, b) => b - a)[0];
  const minimumEndMonth = new Date(startMonth);
  minimumEndMonth.setMonth(minimumEndMonth.getMonth() + Math.max(1, minimumMonthCount) - 1);
  const endMonth = latestWorkout && latestWorkout > minimumEndMonth ? latestWorkout : minimumEndMonth;
  const sections = [];

  for (
    const month = new Date(startMonth);
    month <= endMonth;
    month.setMonth(month.getMonth() + 1)
  ) {
    const monthStart = new Date(month.getFullYear(), month.getMonth(), 1, 12);
    const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0, 12);
    sections.push({
      key: `${monthStart.getFullYear()}-${monthStart.getMonth()}`,
      label: monthLabel(monthStart),
      month: monthStart.getMonth(),
      dates: dateRange(startOfWeekMonday(monthStart), endOfWeekSunday(monthEnd)),
    });
  }

  return sections;
}

function inferMaxKey(exercise, text = "") {
  const value = `${exercise} ${text}`.toLowerCase();
  if (value.includes("front squat")) return "frontSquat";
  if (value.includes("back squat")) return "backSquat";
  if (value.includes("squat")) return "backSquat";
  if (value.includes("bench")) return "bench";
  if (value.includes("deadlift")) return "deadlift";
  if (value.includes("clean") || value.includes("jerk")) return "cleanJerk";
  if (value.includes("snatch")) return "snatch";
  return "";
}

function percentages(item) {
  const text = `${item.prescription} ${item.intensity}`.replace(/–/g, "-");
  const matches = [...text.matchAll(/(\d{2,3})(?:-(\d{2,3}))?%/g)];
  return matches.map((match) => ({
    low: Number(match[1]),
    high: Number(match[2] || match[1]),
  }));
}

function highNumber(value) {
  const numbers = `${value}`.match(/\d+/g);
  return numbers ? Number(numbers[numbers.length - 1]) : 1;
}

function setRows(item) {
  const text = item.prescription.replace(/–/g, "-");
  const setsByReps = [...text.matchAll(/(\d+(?:-\d+)?)\s*x\s*(\d+(?:-\d+)?(?:\+\d+)*)/gi)].at(-1);
  if (setsByReps) {
    const count = Math.min(highNumber(setsByReps[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: setsByReps[2],
    }));
  }

  const setsOnly = /x\s*(\d+(?:-\d+)?)\s*sets?/i.exec(text);
  if (setsOnly) {
    const count = Math.min(highNumber(setsOnly[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: "set",
    }));
  }

  const singles = /(\d+(?:-\d+)?)\s*singles?/i.exec(text);
  if (singles) {
    const count = Math.min(highNumber(singles[1]), 12);
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:${index + 1}`,
      reps: "1",
    }));
  }

  return [{ key: `${item.id}:1`, reps: /single/i.test(text) ? "1" : item.prescription }];
}

function prescribedPreview(item, maxes, weightUnit) {
  const maxKey = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
  const max = Number(maxes[maxKey]?.value ?? maxes[maxKey]);
  const percents = percentages(item);
  if (!maxKey || !max || percents.length === 0) return "";
  const unit = weightUnit || maxes[maxKey]?.unit || "";
  return percents
    .slice(0, 2)
    .map(({ low, high }) => {
      const lowWeight = Math.round((max * low) / 100);
      const highWeight = Math.round((max * high) / 100);
      return low === high ? `${low}%: ${lowWeight}${unit}` : `${low}-${high}%: ${lowWeight}-${highWeight}${unit}`;
    })
    .join(" | ");
}

function programSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `program-${Date.now()}`;
}

function progressSummary(workouts, logs) {
  const dates = [...new Set(workouts.map((item) => item.date))].sort();
  const completed = dates.filter((date) => logs[date]?.completed).length;
  const nextDate = dates.find((date) => !logs[date]?.completed);
  return {
    total: dates.length,
    completed,
    percent: dates.length ? Math.round((completed / dates.length) * 100) : 0,
    nextDate,
  };
}

function logDateFromKey(key) {
  const match = String(key).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

function completedWorkoutDates(logs) {
  return Object.entries(logs)
    .filter(([, log]) => log?.completed)
    .map(([key, log]) => logDateFromKey(log.date || key))
    .filter(Boolean)
    .sort();
}

function completedWorkoutsLast30Days(logs, todayValue = new Date()) {
  const today = new Date(todayValue);
  today.setHours(12, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);

  return completedWorkoutDates(logs).filter((date) => {
    const completedDate = new Date(`${date}T12:00:00`);
    return completedDate >= startDate && completedDate <= today;
  }).length;
}

function weeklyWorkoutStreak(logs) {
  const completedWeeks = new Set(completedWorkoutDates(logs).map((date) => startOfWeekMonday(`${date}T12:00:00`).toISOString().slice(0, 10)));
  if (!completedWeeks.size) return 0;

  let streak = 0;
  let weekStart = new Date(`${[...completedWeeks].sort().at(-1)}T12:00:00`);
  while (completedWeeks.has(weekStart.toISOString().slice(0, 10))) {
    streak += 1;
    weekStart.setDate(weekStart.getDate() - 7);
  }
  return streak;
}

function programTimelineSummary(workouts, logs) {
  const dates = [...new Set(workouts.map((item) => item.date))].sort();
  const summary = progressSummary(workouts, logs);
  return {
    ...summary,
    firstDate: dates[0] || "",
    lastDate: dates.at(-1) || "",
  };
}

function numericMax(maxes, key) {
  const max = maxes[key];
  return Number(max?.value ?? max ?? 0) || 0;
}

function goalProgress(goal, logs, maxes, weightUnit) {
  const target = Math.max(1, Number(goal.target) || 1);
  let current = 0;
  let label = "";

  if (goal.type === "metric") {
    const entries = loadBodyMetrics(goal.userId || "");
    const latest = entries.at(-1);
    current = Number(latest?.[goal.metric] || 0);
    label = `${current || 0}/${target}${goal.unit || ""}`;
  } else if (goal.type === "max") {
    current = numericMax(maxes, goal.lift);
    const unit = weightUnit || maxes[goal.lift]?.unit || goal.unit || "kg";
    label = `${current || 0}/${target}${unit}`;
  } else {
    current = Object.values(logs).filter((log) => {
      if (!log.completed) return false;
      if (!goal.startDate) return true;
      return !log.updatedAt || log.updatedAt.slice(0, 10) >= goal.startDate;
    }).length;
    label = `${current}/${target} workouts`;
  }

  return {
    current,
    label,
    percent: Math.min(100, Math.round((current / target) * 100)),
    complete: current >= target,
  };
}

function bodyMetricUnit(field, weightUnit) {
  return field.unitType === "weight" ? weightUnit : field.unit;
}

function metricLatest(entries, key) {
  return [...entries].reverse().find((entry) => entry[key]) || null;
}

function metricGoalProgress(metricGoal, currentValue) {
  if (!metricGoal) return null;
  const target = Number(metricGoal.target) || 0;
  const current = Number(currentValue) || 0;
  if (!target) return null;
  const start = Number(metricGoal.startValue || 0);
  const totalDelta = target - start;
  const currentDelta = current - start;
  const percent = totalDelta === 0 ? (current >= target ? 100 : 0) : Math.round(Math.min(100, Math.max(0, (currentDelta / totalDelta) * 100)));
  const complete = totalDelta >= 0 ? current >= target : current <= target;
  return { percent, complete };
}

function metricTrendPoints(entries, key) {
  const values = entries.map((entry) => Number(entry[key])).filter((value) => Number.isFinite(value) && value > 0).slice(-8);
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values.map((value, index) => {
    const x = values.length === 1 ? 50 : (index / (values.length - 1)) * 100;
    const y = 42 - ((value - min) / span) * 34;
    return `${x},${y}`;
  }).join(" ");
}

function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${String(date).slice(0, 10)}T12:00:00`));
}

function metricLineChart(entries, key, targetValue) {
  const values = entries
    .map((entry) => ({
      date: String(entry.date || "").slice(0, 10),
      value: Number(entry[key]),
    }))
    .filter((entry) => entry.date && Number.isFinite(entry.value) && entry.value > 0)
    .sort((a, b) => a.date.localeCompare(b.date));

  if (!values.length) return null;

  const target = Number(targetValue);
  const scaleValues = Number.isFinite(target) && target > 0
    ? [...values.map((entry) => entry.value), target]
    : values.map((entry) => entry.value);
  const min = Math.min(...scaleValues);
  const max = Math.max(...scaleValues);
  const span = max - min || 1;
  const pointFor = (entry, index) => {
    const x = values.length === 1 ? 50 : 8 + (index / (values.length - 1)) * 84;
    const y = 76 - ((entry.value - min) / span) * 58;
    return { ...entry, x, y };
  };
  const points = values.map(pointFor);
  const targetY = Number.isFinite(target) && target > 0
    ? 76 - ((target - min) / span) * 58
    : null;

  return {
    points,
    line: points.map((point) => `${point.x},${point.y}`).join(" "),
    targetY,
    first: values[0],
    latest: values.at(-1),
  };
}

function needsMaxes(workout) {
  return [...new Set(workout.flatMap((item) => {
    const needs = percentages(item).length > 0 || /opener/i.test(`${item.prescription} ${item.intensity}`);
    const key = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
    return needs && key ? [key] : [];
  }))];
}

function AuthCard({ onAuthed }) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password, mode);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    }
  }

  async function devLogin(role) {
    setError("");
    const user = await loginDev(role);
    onAuthed(user);
  }

  return (
    <main className="auth-shell">
      <section className="auth-panel">
        <div className="brand-lockup">
          <span className="brand-mark"><Dumbbell size={24} /></span>
          <div>
            <p>Primitive Programming</p>
            <h1>Training logs for lifters and coaches.</h1>
          </div>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label>
            Email
            <input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required />
          </label>
          <label>
            Password
            <input value={password} onChange={(event) => setPassword(event.target.value)} type="password" minLength={6} required />
          </label>
          {error && <p className="error">{error}</p>}
          <button className="primary" type="submit">
            <UserRound size={18} />
            {mode === "login" ? "Log in" : "Create account"}
          </button>
        </form>
        <button className="text-button" type="button" onClick={() => setMode(mode === "login" ? "signup" : "login")}>
          {mode === "login" ? "Need an account?" : "Already have an account?"}
        </button>
        <div className="dev-login-row" aria-label="Development login options">
          <button className="secondary" type="button" onClick={() => devLogin("athlete")}>
            Dev Athlete
          </button>
          <button className="secondary" type="button" onClick={() => devLogin("coach")}>
            Dev Coach
          </button>
        </div>
        {!hasFirebaseConfig && <p className="demo-note">Demo mode is active until Firebase env vars are added.</p>}
      </section>
    </main>
  );
}

function CalendarStrip({ sections, selectedDate, onSelectDate, logs, workoutsByDate, onShowMoreMonths }) {
  return (
    <section className="calendar-band" aria-label="Workout calendar">
      <div className="month-stack">
        {sections.map((section) => (
          <div className="calendar-month" key={section.key}>
            <h3>{section.label}</h3>
            <div className="date-grid">
              {section.dates.map((date) => {
                const isOutsideMonth = new Date(`${date}T12:00:00`).getMonth() !== section.month;
                return (
                  <button
                    className={`date-tile ${workoutsByDate[date] ? "" : "empty"} ${logs[date]?.completed ? "completed" : ""} ${isOutsideMonth ? "outside-month" : ""} ${selectedDate === date && !isOutsideMonth ? "selected" : ""}`}
                    key={`${section.key}-${date}`}
                    onClick={() => onSelectDate(date)}
                    type="button"
                  >
                    <span>{formatDate(date).slice(0, 3)}</span>
                    <strong>{new Date(`${date}T12:00:00`).getDate()}</strong>
                    {logs[date]?.completed && <CheckCircle2 className="complete-day-icon" size={16} />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <button className="secondary calendar-more-button" type="button" onClick={onShowMoreMonths}>
        Show more months
      </button>
    </section>
  );
}

function WorkoutListView({ date, workoutGroups, logs, programs, onOpenWorkout, onAddWorkout, onChangeDate }) {
  const [showAddWorkoutOptions, setShowAddWorkoutOptions] = useState(false);
  const [selectedAddMode, setSelectedAddMode] = useState("new");
  const hasPlannedWorkout = workoutGroups.length > 0;
  const programName = (programId) => {
    if (!programId || programId === "default") return "Default Program";
    return programs.find((program) => program.id === programId)?.name || "Program";
  };
  const goToPreviousDay = () => onChangeDate(shiftDate(date, -1));
  const goToNextDay = () => onChangeDate(shiftDate(date, 1));

  return (
    <section className="workout-list-panel">
      <div className="section-heading workout-list-heading">
        <button className="icon-button" type="button" onClick={goToPreviousDay} aria-label="Previous day" title="Previous day">
          <ArrowLeft size={18} />
        </button>
        <div>
          <p className="eyebrow">Swipe for nearby days</p>
          <h2>{formatDate(date)}</h2>
        </div>
        <button className="icon-button next-day-button" type="button" onClick={goToNextDay} aria-label="Next day" title="Next day">
          <ArrowLeft size={18} />
        </button>
      </div>
      <button className="add-workout-button" type="button" onClick={() => setShowAddWorkoutOptions(true)}>
        <Plus size={20} />
        <div>
          <h3>Create workout</h3>
          <span>New, stored, or AI-generated workout</span>
        </div>
      </button>
      {hasPlannedWorkout ? (
        <div className="workout-card-list">
          {workoutGroups.map((group) => (
            <button className="workout-card-button" type="button" key={group.key} onClick={() => onOpenWorkout(group.key)}>
              <div>
                <p className="eyebrow">{programName(group.programId)}</p>
                <h3>{group.title}</h3>
                <span>{group.week ? `Week ${group.week}` : group.phase} | {group.items.length} exercises</span>
              </div>
              {logs[date]?.completed ? <CheckCircle2 size={20} /> : <Dumbbell size={20} />}
            </button>
          ))}
        </div>
      ) : (
        <p className="empty-list-copy">No workouts are scheduled for this day.</p>
      )}
      {showAddWorkoutOptions && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-workout-title">
            <div>
              <p className="eyebrow">{formatDate(date)}</p>
              <h2 id="add-workout-title">Add workout</h2>
            </div>
            <div className="choice-list" role="tablist" aria-label="Workout add options">
              <button className={selectedAddMode === "new" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("new")}>
                <strong>New workout</strong>
                <span>Start blank and add exercises yourself.</span>
              </button>
              <button className={selectedAddMode === "stored" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("stored")}>
                <strong>Stored workout</strong>
                <span>Reuse saved templates once the library is ready.</span>
              </button>
              <button className={selectedAddMode === "ai" ? "choice-button active" : "choice-button"} type="button" onClick={() => setSelectedAddMode("ai")}>
                <strong>Generate workout</strong>
                <span>AI with guard rails for readiness, volume, and maxes.</span>
              </button>
            </div>
            {selectedAddMode === "new" ? (
              <div className="option-panel">
                <p>Create a blank workout for this day. You can add warm-ups, lifts, accessories, and cardio next.</p>
                <button className="primary" type="button" onClick={() => {
                  setShowAddWorkoutOptions(false);
                  onAddWorkout();
                }}>
                  <Plus size={18} />
                  Start blank workout
                </button>
              </div>
            ) : selectedAddMode === "stored" ? (
              <div className="option-panel">
                <p>Stored workout templates will live here. For now, this is the place-holder path for saved workouts.</p>
                <button className="secondary" type="button" disabled>
                  Stored workouts coming soon
                </button>
              </div>
            ) : (
              <div className="option-panel">
                <p>Generation will use guard rails like available maxes, recent completed volume, movement balance, and coach limits before inserting anything.</p>
                <textarea rows={3} placeholder="Example: light lower body day, 45 minutes, no maxing" />
                <button className="secondary" type="button" disabled>
                  Generate workout coming soon
                </button>
              </div>
            )}
            <button className="text-button" type="button" onClick={() => setShowAddWorkoutOptions(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
}

function WorkoutView({ workout, workoutKey, date, user, logs, setLogs, onDone, onSaveStatus, onMoveWorkout }) {
  const logKey = workoutLogKey(date, workoutKey);
  const existing = logs[logKey] || {};
  const initialDraft = loadWorkoutDraft(user.uid, date, workoutKey);
  const savedMaxes = loadUserMaxes(user.uid);
  const [hydratedDraftFor, setHydratedDraftFor] = useState(`${user.uid}:${date}:${workoutKey}`);
  const isBlankWorkout = workout.length === 0;
  const [started, setStarted] = useState(initialDraft.started || isBlankWorkout);
  const [maxes, setMaxes] = useState(initialDraft.maxes || existing.maxes || savedMaxes);
  const [loads, setLoads] = useState(initialDraft.loads || existing.loads || {});
  const [notes, setNotes] = useState(initialDraft.notes ?? existing.notes ?? "");
  const [warmupSetCounts, setWarmupSetCounts] = useState(initialDraft.warmupSetCounts || existing.warmupSetCounts || {});
  const [programmedSetCounts, setProgrammedSetCounts] = useState(initialDraft.programmedSetCounts || existing.programmedSetCounts || {});
  const [exerciseOverrides, setExerciseOverrides] = useState(initialDraft.exerciseOverrides || existing.exerciseOverrides || {});
  const [customExercises, setCustomExercises] = useState(initialDraft.customExercises || existing.customExercises || []);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddCardio, setShowAddCardio] = useState(false);
  const [newCardioName, setNewCardioName] = useState("");
  const [newCardioTracksWeight, setNewCardioTracksWeight] = useState(false);
  const [showAddWarmup, setShowAddWarmup] = useState(false);
  const [newWarmupName, setNewWarmupName] = useState("");
  const [newWarmupTracksWeight, setNewWarmupTracksWeight] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseTracksWeight, setNewExerciseTracksWeight] = useState(true);
  const [openExerciseMenu, setOpenExerciseMenu] = useState("");
  const [collapsedExercises, setCollapsedExercises] = useState({});
  const [showMoveWorkout, setShowMoveWorkout] = useState(false);
  const [moveWorkoutDate, setMoveWorkoutDate] = useState(date);
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const weightUnit = loadUserWeightUnit(user.uid);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxValue(key)));
  const workoutPhase = workout[0]?.phase || "Custom workout";
  const workoutTitle = workout[0] ? `${workout[0].focus} - Week ${workout[0].week}` : "Create workout";

  useEffect(() => {
    const draft = loadWorkoutDraft(user.uid, date, workoutKey);
    setStarted(draft.started || workout.length === 0);
    setMaxes(draft.maxes || existing.maxes || loadUserMaxes(user.uid));
    setLoads(draft.loads || existing.loads || {});
    setNotes(draft.notes ?? existing.notes ?? "");
    setWarmupSetCounts(draft.warmupSetCounts || existing.warmupSetCounts || {});
    setProgrammedSetCounts(draft.programmedSetCounts || existing.programmedSetCounts || {});
    setExerciseOverrides(draft.exerciseOverrides || existing.exerciseOverrides || {});
    setCustomExercises(draft.customExercises || existing.customExercises || []);
    setShowAddExercise(false);
    setShowAddCardio(false);
    setNewCardioName("");
    setNewCardioTracksWeight(false);
    setShowAddWarmup(false);
    setNewWarmupName("");
    setNewWarmupTracksWeight(false);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setOpenExerciseMenu("");
    setCollapsedExercises({});
    setShowMoveWorkout(false);
    setMoveWorkoutDate(date);
    setHydratedDraftFor(`${user.uid}:${date}:${workoutKey}`);
  }, [date, user.uid, workout.length, workoutKey]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}:${workoutKey}`) return;
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises });
    saveUserMaxes(user.uid, maxes);
  }, [customExercises, date, exerciseOverrides, hydratedDraftFor, loads, maxes, notes, programmedSetCounts, started, user.uid, warmupSetCounts, workoutKey]);

  async function persist(payload = {}, stateOverrides = {}) {
    const nextState = {
      maxes,
      loads,
      notes,
      warmupSetCounts,
      programmedSetCounts,
      exerciseOverrides,
      customExercises,
      ...stateOverrides,
    };
    const next = { ...existing, ...nextState, ...payload, updatedAt: new Date().toISOString() };
    setLogs({ ...logs, [logKey]: next });
    const result = await saveWorkoutLog(user.uid, logKey, next);
    onSaveStatus?.(result);
  }

  async function finishWorkout(payload = {}) {
    await persist(payload);
    onDone();
  }

  function addCustomExercise(event) {
    event.preventDefault();
    const name = newExerciseName.trim();
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      {
        id: `session-${Date.now()}`,
        name,
        trackWeights: newExerciseTracksWeight,
        sets: [{ id: `${Date.now()}-1`, reps: "", weight: "", done: false }],
      },
    ];
    setCustomExercises(nextExercises);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setShowAddExercise(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function addCardioExercise(event) {
    event.preventDefault();
    const name = newCardioName.trim();
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      customExercisePayload({ name, trackWeights: newCardioTracksWeight, section: "cardio", reps: "Time" }),
    ];
    setCustomExercises(nextExercises);
    setNewCardioName("");
    setNewCardioTracksWeight(false);
    setShowAddCardio(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function customExercisePayload({ name, trackWeights = true, section = "accessory", reps = "" }) {
    const createdAt = Date.now();
    return {
      id: `session-${createdAt}-${Math.random().toString(16).slice(2)}`,
      name,
      section,
      trackWeights,
      sets: [{ id: `${createdAt}-1`, reps, weight: "", done: false }],
    };
  }

  function addWarmupExercise(event) {
    event.preventDefault();
    const name = newWarmupName.trim();
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      customExercisePayload({ name, trackWeights: newWarmupTracksWeight, section: "warmup", reps: "Prep" }),
    ];
    setCustomExercises(nextExercises);
    setNewWarmupName("");
    setNewWarmupTracksWeight(false);
    setShowAddWarmup(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function addWarmupPreset(preset) {
    const nextExercises = [
      ...customExercises,
      ...preset.exercises.map((name) => customExercisePayload({ name, trackWeights: false, section: "warmup", reps: "Prep" })),
    ];
    setCustomExercises(nextExercises);
    setShowAddWarmup(false);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function updateCustomExercise(exerciseId, updater) {
    const nextExercises = customExercises.map((exercise) => (
      exercise.id === exerciseId ? updater(exercise) : exercise
    ));
    setCustomExercises(nextExercises);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
  }

  function updateCustomSet(exerciseId, setId, patch) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.map((set) => (set.id === setId ? { ...set, ...patch } : set)),
    }));
  }

  function exerciseMenuId(type, id) {
    return `${type}:${id}`;
  }

  function exerciseCollapseId(type, id) {
    return `${type}:${id}`;
  }

  function toggleExerciseCollapse(id) {
    setCollapsedExercises((current) => ({ ...current, [id]: !current[id] }));
  }

  function programmedSetSummary(item) {
    const reps = programmedRows(item).map((set) => loads[`${set.key}:reps`] ?? set.reps);
    return reps.length ? reps.join(", ") : "No sets";
  }

  function customSetSummary(exercise) {
    const reps = exercise.sets.map((set) => set.reps || "set");
    return reps.length ? reps.join(", ") : "No sets";
  }

  function isProgrammedExerciseComplete(item) {
    const programmedComplete = programmedRows(item).every((set) => Boolean(loads[`${set.key}:done`]));
    const warmups = warmupRows(item);
    const warmupsComplete = warmups.length === 0 || warmups.every((set) => Boolean(loads[`${set.key}:done`]));
    return programmedRows(item).length > 0 && programmedComplete && warmupsComplete;
  }

  function isCustomExerciseComplete(exercise) {
    return exercise.sets.length > 0 && exercise.sets.every((set) => Boolean(set.done));
  }

  function programmedExercise(item) {
    return {
      ...item,
      ...(exerciseOverrides[item.id] || {}),
    };
  }

  function persistExerciseOverrides(nextOverrides) {
    setExerciseOverrides(nextOverrides);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides: nextOverrides, customExercises });
    void persist({}, { exerciseOverrides: nextOverrides });
  }

  function updateProgrammedExercise(item, patch) {
    const current = exerciseOverrides[item.id] || {};
    const nextOverrides = {
      ...exerciseOverrides,
      [item.id]: { ...current, ...patch },
    };
    persistExerciseOverrides(nextOverrides);
  }

  function updateCustomExerciseField(exerciseId, patch) {
    const nextExercises = customExercises.map((exercise) => (
      exercise.id === exerciseId ? { ...exercise, ...patch } : exercise
    ));
    setCustomExercises(nextExercises);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function removeCustomExercise(exerciseId) {
    const nextExercises = customExercises.filter((exercise) => exercise.id !== exerciseId);
    setCustomExercises(nextExercises);
    setOpenExerciseMenu("");
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
  }

  function addCustomSet(exerciseId) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: [
        ...exercise.sets,
        { id: `${Date.now()}-${exercise.sets.length + 1}`, reps: exercise.sets.at(-1)?.reps || "", weight: "", done: false },
      ],
    }));
  }

  function removeCustomSet(exerciseId) {
    updateCustomExercise(exerciseId, (exercise) => ({
      ...exercise,
      sets: exercise.sets.length > 1 ? exercise.sets.slice(0, -1) : exercise.sets,
    }));
  }

  function programmedRows(item) {
    const rows = setRows(item);
    const count = Math.max(rows.length, programmedSetCounts[item.id] || rows.length);
    const lastReps = rows.at(-1)?.reps || item.prescription;
    return Array.from({ length: count }, (_, index) => rows[index] || {
      key: `${item.id}:${index + 1}`,
      reps: lastReps,
    });
  }

  function warmupRows(item) {
    const count = warmupSetCounts[item.id] || 0;
    return Array.from({ length: count }, (_, index) => ({
      key: `${item.id}:warmup:${index + 1}`,
      repsKey: `${item.id}:warmup:${index + 1}:reps`,
      label: `Warm-up ${index + 1}`,
    }));
  }

  function addWarmupSet(item) {
    const nextCounts = {
      ...warmupSetCounts,
      [item.id]: (warmupSetCounts[item.id] || 0) + 1,
    };
    setWarmupSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts: nextCounts, programmedSetCounts, customExercises });
    void persist({}, { warmupSetCounts: nextCounts });
  }

  function removeWarmupSet(item) {
    const currentCount = warmupSetCounts[item.id] || 0;
    if (currentCount <= 0) return;
    const nextCounts = { ...warmupSetCounts, [item.id]: currentCount - 1 };
    if (nextCounts[item.id] <= 0) delete nextCounts[item.id];
    const removedSetKey = `${item.id}:warmup:${currentCount}`;
    const nextLoads = { ...loads };
    delete nextLoads[removedSetKey];
    delete nextLoads[`${removedSetKey}:done`];
    delete nextLoads[`${removedSetKey}:reps`];
    setWarmupSetCounts(nextCounts);
    setLoads(nextLoads);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads: nextLoads, notes, warmupSetCounts: nextCounts, programmedSetCounts, customExercises });
    void persist({}, { loads: nextLoads, warmupSetCounts: nextCounts });
  }

  function addProgrammedSet(item) {
    const nextCounts = {
      ...programmedSetCounts,
      [item.id]: programmedRows(item).length + 1,
    };
    setProgrammedSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, programmedSetCounts: nextCounts, customExercises });
    void persist({}, { programmedSetCounts: nextCounts });
  }

  function removeProgrammedSet(item) {
    const baseCount = setRows(item).length;
    const currentCount = programmedRows(item).length;
    if (currentCount <= baseCount) return;
    const nextCounts = { ...programmedSetCounts, [item.id]: currentCount - 1 };
    if (nextCounts[item.id] <= baseCount) delete nextCounts[item.id];
    setProgrammedSetCounts(nextCounts);
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, programmedSetCounts: nextCounts, customExercises });
    void persist({}, { programmedSetCounts: nextCounts });
  }

  async function moveWorkout(event) {
    event.preventDefault();
    if (!moveWorkoutDate || moveWorkoutDate === date) {
      setShowMoveWorkout(false);
      return;
    }
    await onMoveWorkout?.(moveWorkoutDate);
    setShowMoveWorkout(false);
  }

  const moveWorkoutButton = (
    <button className="icon-button" type="button" onClick={() => setShowMoveWorkout(true)} aria-label="Change workout day" title="Change workout day">
      <PencilLine size={18} />
    </button>
  );

  return (
    <section className="workout-panel">
      {!started ? (
        <div className="start-panel">
          <div className="workout-title-row">
            <div>
              <p className="eyebrow">{formatDate(date)} | {workoutPhase}</p>
              <h2>{workoutTitle}</h2>
            </div>
            {workoutKey !== "blank" && moveWorkoutButton}
          </div>
          {requiredMaxes.length > 0 && (
            <div className="max-grid">
              {requiredMaxes.map((key) => {
                const field = maxFields.find((item) => item.key === key);
                return (
                  <label key={key}>
                    {field.label} max
                    <span className="max-input-row">
                      <input
                        value={maxValue(key)}
                        onChange={(event) => setMaxes({ ...maxes, [key]: { value: event.target.value, unit: weightUnit } })}
                        inputMode="decimal"
                        placeholder={`Max (${weightUnit})`}
                      />
                    </span>
                  </label>
                );
              })}
            </div>
          )}
          <button
            className="primary"
            type="button"
            disabled={missingMaxes.length > 0}
            onClick={() => {
              setStarted(true);
              saveWorkoutDraft(user.uid, date, workoutKey, { started: true, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises });
            }}
          >
            <Dumbbell size={18} />
            Start workout
          </button>
        </div>
      ) : (
        <>
          <div className="workout-title-row">
            <div>
              <p className="eyebrow">{formatDate(date)} | {workoutPhase}</p>
              <h2>{workoutTitle}</h2>
            </div>
            <div className="workout-title-actions">
              {workoutKey !== "blank" && moveWorkoutButton}
              <button className="icon-button" type="button" onClick={() => finishWorkout({ completed: true })} aria-label="Mark complete" title="Mark complete">
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>
          <div className="exercise-table">
            <div className="table-head">
              <span>Exercise</span>
              <span>Sets</span>
            </div>
            <div className="workout-warmup-row">
              <button className="secondary" type="button" onClick={() => setShowAddWarmup(true)}>
                <Plus size={18} />
                Add warm-up
              </button>
            </div>
            {isBlankWorkout && customExercises.length === 0 && (
              <p className="empty-list-copy">No exercises yet. Add the first exercise below.</p>
            )}
            {customExercises.filter((exercise) => exercise.section === "warmup").map((exercise) => (
              <div className={`exercise-row custom-exercise-row warmup-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Warm-up | Track weights" : "Warm-up | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this warm-up for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-edit-${exercise.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <SimilarExerciseButtons exerciseName={exercise.name} onSelect={(value) => updateCustomExerciseField(exercise.id, { name: value })} />
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove warm-up
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
                  {exercise.sets.map((set) => (
                    <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                      <input
                        value={set.reps}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Reps"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          onBlur={() => persist()}
                          placeholder="Weight"
                        />
                      )}
                      <input
                        checked={set.done}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addCustomSet(exercise.id)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSet(exercise.id)} disabled={exercise.sets.length <= 1}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                  </div>
                </div>}
              </div>
            ))}
            {workout.map((item) => {
              const displayItem = programmedExercise(item);
              const menuId = exerciseMenuId("programmed", item.id);
              const collapseId = exerciseCollapseId("programmed", item.id);
              return (
              <div className={`exercise-row ${collapsedExercises[collapseId] ? "collapsed" : ""} ${collapsedExercises[collapseId] && isProgrammedExerciseComplete(item) ? "exercise-complete" : ""}`} key={item.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(collapseId)} role="button" tabIndex={0}>
                  <div>
                    <strong>{displayItem.exercise}</strong>
                    <small>{displayItem.intensity || "No intensity"} | {displayItem.notes || "No notes"}</small>
                    <span className="collapsed-set-summary">{programmedSetSummary(item)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === menuId ? "" : menuId);
                    }} aria-label={`Edit ${displayItem.exercise}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === menuId && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this programmed lift for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={displayItem.exercise} onChange={(value) => updateProgrammedExercise(item, { exercise: value })} id={`exercise-sub-${item.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <SimilarExerciseButtons exerciseName={displayItem.exercise} onSelect={(value) => updateProgrammedExercise(item, { exercise: value })} />
                        <label>
                          Prescription
                          <input value={displayItem.prescription} onChange={(event) => updateProgrammedExercise(item, { prescription: event.target.value })} />
                        </label>
                        <label>
                          Intensity
                          <input value={displayItem.intensity || ""} onChange={(event) => updateProgrammedExercise(item, { intensity: event.target.value })} />
                        </label>
                        <label className="checkbox-field">
                          <input
                            checked={displayItem.trackWeights !== false}
                            onChange={(event) => updateProgrammedExercise(item, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[collapseId] && <div className="set-list">
                  <p>{displayItem.prescription}</p>
                  <div className="warmup-control-row">
                    <span>Warm-up sets</span>
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addWarmupSet(item)}>
                        <Plus size={16} />
                        Add
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeWarmupSet(item)} disabled={(warmupSetCounts[item.id] || 0) <= 0}>
                        <Minus size={16} />
                        Remove
                      </button>
                    </div>
                  </div>
                  {warmupRows(item).map((set) => (
                    <label className="set-row warmup-set-row tracked-set-row" key={set.key}>
                      <input
                        value={loads[set.repsKey] || ""}
                        onChange={(event) => setLoads({ ...loads, [set.repsKey]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder={set.label}
                      />
                      <input
                        value={loads[set.key] || ""}
                        onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Weight"
                      />
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  {programmedRows(item).map((set) => (
                    <label className={displayItem.trackWeights === false ? "set-row check-set-row" : "set-row tracked-set-row"} key={set.key}>
                      <input
                        value={loads[`${set.key}:reps`] ?? set.reps}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:reps`]: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Reps"
                      />
                      {displayItem.trackWeights !== false && (
                        <input
                          value={loads[set.key] ?? (set.key.endsWith(":1") ? loads[item.id] || "" : "")}
                          onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                          onBlur={() => persist()}
                          placeholder={prescribedPreview(displayItem, maxes, weightUnit) || "Actual"}
                        />
                      )}
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addProgrammedSet(item)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeProgrammedSet(item)} disabled={programmedRows(item).length <= setRows(item).length}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                  </div>
                </div>}
              </div>
              );
            })}
            {customExercises.filter((exercise) => exercise.section !== "warmup" && exercise.section !== "cardio").map((exercise) => (
              <div className={`exercise-row custom-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Session exercise | Track weights" : "Session exercise | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit exercise">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change exercise</strong>
                          <span>Replaces this added exercise for this session.</span>
                        </div>
                        <label>
                          New exercise
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-sub-${exercise.id}`} placeholder="Type RDL, squat, clean..." />
                        </label>
                        <SimilarExerciseButtons exerciseName={exercise.name} onSelect={(value) => updateCustomExerciseField(exercise.id, { name: value })} />
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track weights used
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove exercise
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
                  {exercise.sets.map((set) => (
                    <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                      <input
                        value={set.reps}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Reps"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          onBlur={() => persist()}
                          placeholder="Weight"
                        />
                      )}
                      <input
                        checked={set.done}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addCustomSet(exercise.id)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSet(exercise.id)} disabled={exercise.sets.length <= 1}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                  </div>
                </div>}
              </div>
            ))}
            <div className="add-exercise-row">
              <button className="secondary" type="button" onClick={() => setShowAddExercise(true)}>
                <Plus size={18} />
                Add exercise
              </button>
            </div>
            {customExercises.filter((exercise) => exercise.section === "cardio").map((exercise) => (
              <div className={`exercise-row custom-exercise-row cardio-exercise-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
                <div className="exercise-info" onClick={() => toggleExerciseCollapse(exerciseCollapseId("custom", exercise.id))} role="button" tabIndex={0}>
                  <div>
                    <strong>{exercise.name}</strong>
                    <small>{exercise.trackWeights ? "Cardio | Track numbers" : "Cardio | Completion only"}</small>
                    <span className="collapsed-set-summary">{customSetSummary(exercise)}</span>
                  </div>
                  <div className="exercise-edit-wrap">
                    <button className="icon-button exercise-edit-button" type="button" onClick={(event) => {
                      event.stopPropagation();
                      setOpenExerciseMenu(openExerciseMenu === exerciseMenuId("custom", exercise.id) ? "" : exerciseMenuId("custom", exercise.id));
                    }} aria-label={`Edit ${exercise.name}`} title="Edit cardio">
                      <PencilLine size={16} />
                    </button>
                    {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                      <div className="exercise-edit-menu">
                        <div className="exercise-edit-menu-header">
                          <strong>Change cardio</strong>
                          <span>Replaces this cardio piece for this session.</span>
                        </div>
                        <label>
                          New cardio
                          <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`exercise-cardio-${exercise.id}`} />
                        </label>
                        <SimilarExerciseButtons exerciseName={exercise.name} onSelect={(value) => updateCustomExerciseField(exercise.id, { name: value })} />
                        <label className="checkbox-field">
                          <input
                            checked={exercise.trackWeights}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { trackWeights: event.target.checked })}
                            type="checkbox"
                          />
                          Track numbers
                        </label>
                        <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                          Remove cardio
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && <div className="set-list">
                  {exercise.sets.map((set) => (
                    <label className={`set-row ${exercise.trackWeights ? "tracked-set-row" : "check-set-row"}`} key={set.id}>
                      <input
                        value={set.reps}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { reps: event.target.value })}
                        onBlur={() => persist()}
                        placeholder="Time / distance / rounds"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          onBlur={() => persist()}
                          placeholder="Score"
                        />
                      )}
                      <input
                        checked={set.done}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
                        onBlur={() => persist()}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  <div className="set-action-row">
                    <div className="set-action-group">
                      <button className="quiet-button" type="button" onClick={() => addCustomSet(exercise.id)}>
                        <Plus size={16} />
                        Add set
                      </button>
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSet(exercise.id)} disabled={exercise.sets.length <= 1}>
                        <Minus size={16} />
                        Remove set
                      </button>
                    </div>
                  </div>
                </div>}
              </div>
            ))}
            <div className="add-exercise-row cardio-add-row">
              <button className="secondary" type="button" onClick={() => setShowAddCardio(true)}>
                <Plus size={18} />
                Add cardio
              </button>
            </div>
          </div>
          <label className="notes-field">
            Session notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist()} rows={3} />
          </label>
          <button className="secondary" type="button" onClick={() => finishWorkout()}>
            <Save size={18} />
            Save workout
          </button>
          {showAddExercise && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-exercise-title">
                <div>
                  <p className="eyebrow">Session exercise</p>
                  <h2 id="add-exercise-title">Add exercise</h2>
                </div>
                <form className="modal-form" onSubmit={addCustomExercise}>
                  <label>
                    Exercise name
                    <ExerciseAutocomplete value={newExerciseName} onChange={setNewExerciseName} id="new-exercise-name" placeholder="Accessory, abs, RDL, extra pulls" />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newExerciseTracksWeight}
                      onChange={(event) => setNewExerciseTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track weights used
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add exercise
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddExercise(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {showAddCardio && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-cardio-title">
                <div>
                  <p className="eyebrow">Workout cardio</p>
                  <h2 id="add-cardio-title">Add cardio</h2>
                </div>
                <form className="modal-form" onSubmit={addCardioExercise}>
                  <label>
                    Cardio name
                    <ExerciseAutocomplete value={newCardioName} onChange={setNewCardioName} id="new-cardio-name" placeholder="Bike finisher, easy jog, metcon placeholder" />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newCardioTracksWeight}
                      onChange={(event) => setNewCardioTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track score / distance
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add cardio
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddCardio(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
          {showAddWarmup && (
            <div className="modal-backdrop" role="presentation">
              <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="add-warmup-title">
                <div>
                  <p className="eyebrow">Workout warm-up</p>
                  <h2 id="add-warmup-title">Add warm-up</h2>
                </div>
                <div className="preset-grid">
                  {warmupPresets.map((preset) => (
                    <button className="preset-button" type="button" key={preset.id} onClick={() => addWarmupPreset(preset)}>
                      <strong>{preset.title}</strong>
                      <span>{preset.exercises.join(" | ")}</span>
                    </button>
                  ))}
                </div>
                <form className="modal-form" onSubmit={addWarmupExercise}>
                  <label>
                    Custom warm-up exercise
                    <ExerciseAutocomplete value={newWarmupName} onChange={setNewWarmupName} id="new-warmup-name" placeholder="Banded shoulder prep, hip flow, empty bar work" />
                  </label>
                  <label className="checkbox-field">
                    <input
                      checked={newWarmupTracksWeight}
                      onChange={(event) => setNewWarmupTracksWeight(event.target.checked)}
                      type="checkbox"
                    />
                    Track weights used
                  </label>
                  <button className="primary" type="submit">
                    <Plus size={18} />
                    Add custom warm-up
                  </button>
                  <button className="text-button" type="button" onClick={() => setShowAddWarmup(false)}>
                    Cancel
                  </button>
                </form>
              </div>
            </div>
          )}
        </>
      )}
      {showMoveWorkout && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel move-workout-form" role="dialog" aria-modal="true" aria-labelledby="move-workout-title" onSubmit={moveWorkout}>
            <div>
              <p className="eyebrow">{formatDate(date)}</p>
              <h2 id="move-workout-title">Change workout day</h2>
            </div>
            <label>
              New date
              <input type="date" value={moveWorkoutDate} onChange={(event) => setMoveWorkoutDate(event.target.value)} />
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowMoveWorkout(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!moveWorkoutDate || moveWorkoutDate === date}>
                Move workout
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function ProgramsPage({ programs, workouts, logs, onProgramCreated, onWorkoutCreated }) {
  const [programName, setProgramName] = useState("");
  const [athleteEmail, setAthleteEmail] = useState("dev-athlete@primitive.local");
  const [startDate, setStartDate] = useState("2026-05-11");
  const [programGoal, setProgramGoal] = useState("");
  const [programNotes, setProgramNotes] = useState("");
  const [workoutProgramId, setWorkoutProgramId] = useState("default");
  const [date, setDate] = useState("2026-05-11");
  const [focus, setFocus] = useState("");
  const [exercise, setExercise] = useState("");
  const [prescription, setPrescription] = useState("");
  const [intensity, setIntensity] = useState("");
  const [notes, setNotes] = useState("");
  const [openProgramMenu, setOpenProgramMenu] = useState("");
  const [startingProgram, setStartingProgram] = useState(null);
  const [programStartDate, setProgramStartDate] = useState(defaultSelectedDate);
  const savedDefaultProgram = programs.find((program) => program.id === "default");
  const defaultProgram = {
    id: "default",
    name: "Default Program",
    athleteEmail: "dev-athlete@primitive.local",
    status: "idle",
    ...savedDefaultProgram,
  };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const createdProgramIds = new Set(programs.map((program) => program.id));
  const visiblePrograms = programOptions.filter((program) => program.id === "default" || createdProgramIds.has(program.id));
  const currentWorkoutProgram = programOptions.find((program) => program.id === workoutProgramId) || defaultProgram;

  async function createProgram(event) {
    event.preventDefault();
    const program = {
      id: programSlug(programName),
      name: programName,
      athleteEmail,
      startDate,
      goal: programGoal,
      notes: programNotes,
      createdAt: new Date().toISOString(),
    };
    const savedProgram = await saveProgram(program);
    setWorkoutProgramId(savedProgram.id);
    setProgramName("");
    setProgramGoal("");
    setProgramNotes("");
    onProgramCreated();
  }

  async function createWorkout(event) {
    event.preventDefault();
    const workout = {
      date,
      focus,
      exercise,
      prescription,
      intensity,
      notes,
      programId: workoutProgramId || "default",
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`)),
      phase: currentWorkoutProgram.name,
      week: "Custom",
    };
    await saveCustomWorkout(workoutProgramId || "default", workout);
    setExercise("");
    setPrescription("");
    setIntensity("");
    setNotes("");
    onWorkoutCreated();
  }

  async function updateProgramStatus(program, status) {
    const savedProgram = {
      ...program,
      status,
      statusUpdatedAt: new Date().toISOString(),
    };
    await saveProgram(savedProgram);
    setOpenProgramMenu("");
    onProgramCreated();
  }

  function openStartProgram(program) {
    setStartingProgram(program);
    setProgramStartDate(program.startDate || new Date().toISOString().slice(0, 10));
    setOpenProgramMenu("");
  }

  async function startProgram(event) {
    event.preventDefault();
    if (!startingProgram || !programStartDate) return;

    const savedProgram = {
      ...startingProgram,
      startDate: programStartDate,
      status: "active",
      statusUpdatedAt: new Date().toISOString(),
    };
    const programWorkouts = workouts
      .filter((item) => (item.programId || "default") === startingProgram.id && item.date)
      .sort((a, b) => a.date.localeCompare(b.date));
    const firstWorkoutDate = programWorkouts[0]?.date;

    await saveProgram(savedProgram);

    if (startingProgram.id !== "default" && firstWorkoutDate && firstWorkoutDate !== programStartDate) {
      const offset = daysBetweenDates(firstWorkoutDate, programStartDate);
      await Promise.all(programWorkouts.map((workout) => {
        const nextDate = shiftDate(workout.date, offset);
        return saveCustomWorkout(startingProgram.id, {
          ...workout,
          date: nextDate,
          day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${nextDate}T12:00:00`)),
        });
      }));
    }

    setStartingProgram(null);
    setProgramStartDate(defaultSelectedDate);
    onProgramCreated();
  }

  function programStatusLabel(status) {
    if (status === "active") return "Started";
    if (status === "paused") return "Paused";
    if (status === "quit") return "Quit";
    return "Not started";
  }

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <ClipboardList size={20} />
        <h2>Programs</h2>
      </div>

      <div className="programs-layout">
        <div className="program-section">
          <div className="program-section-title">
            <h3>Created Programs</h3>
            <span>{visiblePrograms.length}</span>
          </div>
          <div className="program-card-grid">
            {visiblePrograms.map((program) => {
              const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
              const summary = progressSummary(programWorkouts, logs);
              return (
                <article className="program-card" key={program.id}>
                  <div className="program-card-header">
                    <div>
                      <p className="eyebrow">{program.athleteEmail || "No athlete assigned"}</p>
                      <h4>{program.name}</h4>
                    </div>
                    <div className="program-actions">
                      <button
                        className="icon-button program-menu-button"
                        type="button"
                        onClick={() => setOpenProgramMenu(openProgramMenu === program.id ? "" : program.id)}
                        aria-expanded={openProgramMenu === program.id}
                        aria-label={`Open ${program.name} actions`}
                        title="Program actions"
                      >
                        <Menu size={17} />
                      </button>
                      {openProgramMenu === program.id && (
                        <div className="program-action-menu" role="menu">
                          <button type="button" role="menuitem" onClick={() => openStartProgram(program)}>
                            Start program
                          </button>
                          <button type="button" role="menuitem" onClick={() => updateProgramStatus(program, "paused")}>
                            Pause program
                          </button>
                          <button type="button" role="menuitem" onClick={() => updateProgramStatus(program, "quit")}>
                            Quit program
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className={`program-status program-status-${program.status || "idle"}`}>{programStatusLabel(program.status)}</p>
                  <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                    <span style={{ width: `${summary.percent}%` }} />
                  </div>
                  <dl className="program-stats">
                    <div>
                      <dt>Complete</dt>
                      <dd>{summary.completed}/{summary.total}</dd>
                    </div>
                    <div>
                      <dt>Next</dt>
                      <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                    </div>
                  </dl>
                  {program.goal && <p className="program-note">{program.goal}</p>}
                </article>
              );
            })}
          </div>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Athlete Progress</h3>
          </div>
          <div className="progress-list">
            {visiblePrograms.map((program) => {
              const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
              const summary = progressSummary(programWorkouts, logs);
              return (
                <div className="progress-row" key={program.id}>
                  <div>
                    <strong>{program.athleteEmail || "Unassigned athlete"}</strong>
                    <span>{program.name}</span>
                  </div>
                  <b>{summary.percent}%</b>
                </div>
              );
            })}
          </div>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Create Program</h3>
          </div>
          <form onSubmit={createProgram} className="creator-form">
            <label>
              Program name
              <input value={programName} onChange={(event) => setProgramName(event.target.value)} placeholder="Summer Strength Block" required />
            </label>
            <label>
              Athlete email
              <input value={athleteEmail} onChange={(event) => setAthleteEmail(event.target.value)} type="email" />
            </label>
            <label>
              Start date
              <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
            </label>
            <label>
              Goal
              <input value={programGoal} onChange={(event) => setProgramGoal(event.target.value)} placeholder="Build volume before max-out week" />
            </label>
            <label className="wide">
              Coach notes
              <textarea value={programNotes} onChange={(event) => setProgramNotes(event.target.value)} rows={3} />
            </label>
            <button className="primary" type="submit">
              <Plus size={18} />
              Create program
            </button>
          </form>
        </div>

        <div className="program-section">
          <div className="program-section-title">
            <h3>Create Workout</h3>
          </div>
          <form onSubmit={createWorkout} className="creator-form">
            <label>
              Program
              <select value={workoutProgramId} onChange={(event) => setWorkoutProgramId(event.target.value)}>
                {programOptions.map((program) => (
                  <option key={program.id} value={program.id}>{program.name}</option>
                ))}
              </select>
            </label>
            <label>
              Date
              <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
            </label>
            <label>
              Workout name
              <input value={focus} onChange={(event) => setFocus(event.target.value)} placeholder="Heavy Snatch + Back Squat" required />
            </label>
            <label>
              Exercise
              <input value={exercise} onChange={(event) => setExercise(event.target.value)} placeholder="Snatch" required />
            </label>
            <label>
              Reps / prescription
              <input value={prescription} onChange={(event) => setPrescription(event.target.value)} placeholder="4 x 2 @ 80%" required />
            </label>
            <label>
              Intensity
              <input value={intensity} onChange={(event) => setIntensity(event.target.value)} placeholder="75-85%" />
            </label>
            <label className="wide">
              Coach notes
              <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
            </label>
            <button className="primary" type="submit">
              <Plus size={18} />
              Add workout exercise
            </button>
          </form>
        </div>
      </div>
      {startingProgram && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form start-program-form" onSubmit={startProgram} role="dialog" aria-modal="true" aria-labelledby="start-program-title">
            <div>
              <p className="eyebrow">Start program</p>
              <h2 id="start-program-title">{startingProgram.name}</h2>
            </div>
            <label>
              Start date
              <input type="date" value={programStartDate} onChange={(event) => setProgramStartDate(event.target.value)} required />
            </label>
            <p className="modal-helper-copy">
              {startingProgram.id === "default"
                ? "The program status will use this date."
                : "Program workouts will move so the first scheduled workout starts on this date."}
            </p>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setStartingProgram(null)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!programStartDate}>
                Start program
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

function StorePage() {
  return (
    <section className="programs-panel store-panel">
      <div className="section-heading">
        <ShoppingBag size={20} />
        <h2>Store</h2>
      </div>

      <div className="store-grid">
        {storePrograms.map((program) => (
          <article className="store-card" key={program.id}>
            <div>
              <p className="eyebrow">{program.eyebrow}</p>
              <h3>{program.name}</h3>
            </div>
            <p>{program.description}</p>
            <div className="store-card-footer">
              <strong>{program.price}</strong>
              <button className="primary" type="button">
                <ShoppingBag size={17} />
                Buy program
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

function CommunityPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <UsersRound size={20} />
        <h2>Community</h2>
      </div>
      <p className="empty-list-copy">Community features will live here.</p>
    </section>
  );
}

function MessagesPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <MessageCircle size={20} />
        <h2>Messages</h2>
      </div>
      <p className="empty-list-copy">Messages will live here.</p>
    </section>
  );
}

function NewsPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Newspaper size={20} />
        <h2>News</h2>
      </div>
      <p className="empty-list-copy">News updates will live here.</p>
    </section>
  );
}

function FoodLogPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Utensils size={20} />
        <h2>Food Log</h2>
      </div>
      <p className="empty-list-copy">Food logging will live here.</p>
    </section>
  );
}

function StretchesPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <PersonStanding size={20} />
        <h2>Stretches</h2>
      </div>
      <p className="empty-list-copy">Stretch routines will live here.</p>
    </section>
  );
}

function WarmupCooldownPage() {
  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Flame size={20} />
        <h2>Warm Up / Cooldown</h2>
      </div>
      <p className="empty-list-copy">Warm-up and cooldown flows will live here.</p>
    </section>
  );
}

function StoredProgramsPage({ programs, workouts, logs }) {
  const programOptions = programs;

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <ClipboardList size={20} />
        <h2>Programs</h2>
      </div>

      {programOptions.length ? (
        <div className="program-card-grid">
          {programOptions.map((program) => {
          const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
          const summary = progressSummary(programWorkouts, logs);
          return (
            <article className="program-card" key={program.id}>
              <div>
                <p className="eyebrow">{programWorkouts.length} saved workout{programWorkouts.length === 1 ? "" : "s"}</p>
                <h4>{program.name}</h4>
              </div>
              <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                <span style={{ width: `${summary.percent}%` }} />
              </div>
              <dl className="program-stats">
                <div>
                  <dt>Complete</dt>
                  <dd>{summary.completed}/{summary.total}</dd>
                </div>
                <div>
                  <dt>Next</dt>
                  <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                </div>
              </dl>
              {program.goal && <p className="program-note">{program.goal}</p>}
            </article>
          );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No saved programs yet.</p>
      )}
    </section>
  );
}

function StoredWorkoutsPage({ workouts, logs, programs, onOpenWorkout }) {
  const programOptions = [{ id: "default", name: "Default Program" }, ...programs.filter((program) => program.id !== "default")];
  const sortedWorkouts = groupWorkouts(workouts).sort((a, b) => `${a.date || ""}`.localeCompare(`${b.date || ""}`));

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <Dumbbell size={20} />
        <h2>Workouts</h2>
      </div>

      {sortedWorkouts.length ? (
        <div className="stored-workout-list">
          {sortedWorkouts.map((workout) => {
            const programName = programOptions.find((program) => program.id === (workout.programId || "default"))?.name || "Default Program";
            const logKey = workoutLogKey(workout.date, workout.key);
            const completed = Boolean(logs[logKey]?.completed || logs[workout.date]?.completed);
            return (
              <button className="stored-workout-card" key={workout.key} type="button" onClick={() => workout.date && onOpenWorkout(workout.date, workout.key)}>
                <div>
                  <p className="eyebrow">{workout.date ? formatDate(workout.date) : "Unscheduled"} | {programName}</p>
                  <h3>{workout.title}</h3>
                  <span>{workout.items.length} exercise{workout.items.length === 1 ? "" : "s"} | {workout.week ? `Week ${workout.week}` : workout.phase}</span>
                </div>
                {completed ? <CheckCircle2 size={20} /> : <ChevronRight size={20} />}
              </button>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No stored workouts yet.</p>
      )}
    </section>
  );
}

function AthletesPage({ programs, workouts, logs }) {
  const defaultProgram = { id: "default", name: "Default Program", athleteEmail: "dev-athlete@primitive.local" };
  const programOptions = [defaultProgram, ...programs.filter((program) => program.id !== "default")];
  const athletes = Array.from(
    programOptions.reduce((map, program) => {
      const email = program.athleteEmail || "Unassigned athlete";
      const current = map.get(email) || { email, programs: [], workouts: [] };
      const programWorkouts = workouts.filter((item) => (item.programId || "default") === program.id);
      current.programs.push(program);
      current.workouts.push(...programWorkouts);
      map.set(email, current);
      return map;
    }, new Map()).values(),
  ).sort((a, b) => a.email.localeCompare(b.email));

  return (
    <section className="programs-panel">
      <div className="section-heading">
        <UsersRound size={20} />
        <h2>Athletes</h2>
      </div>

      {athletes.length ? (
        <div className="program-card-grid">
          {athletes.map((athlete) => {
            const summary = progressSummary(athlete.workouts, logs);
            return (
              <article className="program-card" key={athlete.email}>
                <div>
                  <p className="eyebrow">{athlete.programs.length} program{athlete.programs.length === 1 ? "" : "s"}</p>
                  <h4>{athlete.email}</h4>
                </div>
                <div className="progress-meter" aria-label={`${summary.percent}% complete`}>
                  <span style={{ width: `${summary.percent}%` }} />
                </div>
                <dl className="program-stats">
                  <div>
                    <dt>Complete</dt>
                    <dd>{summary.completed}/{summary.total}</dd>
                  </div>
                  <div>
                    <dt>Next</dt>
                    <dd>{summary.nextDate ? formatDate(summary.nextDate) : "All caught up"}</dd>
                  </div>
                </dl>
                <p className="program-note">{athlete.programs.map((program) => program.name).join(", ")}</p>
              </article>
            );
          })}
        </div>
      ) : (
        <p className="empty-list-copy">No athletes assigned yet.</p>
      )}
    </section>
  );
}

function ProfileAvatar({ user, iconSize = 34 }) {
  return (
    <span className="profile-avatar">
      {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={iconSize} />}
    </span>
  );
}

function ProfilePage({ user, isTrainer, logs, onOpenEdit }) {
  const maxes = loadUserMaxes(user.uid);
  const completedCount = Object.values(logs).filter((log) => log.completed).length;
  const lastUpdated = Object.values(logs)
    .map((log) => log.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return (
    <section className="profile-panel">
      <div className="profile-header">
        <ProfileAvatar user={user} />
        <div>
          <p className="eyebrow">{isTrainer ? "Coach profile" : "Athlete profile"}</p>
          <h2>{user.displayName || user.email || "Profile"}</h2>
        </div>
      </div>

      <div className="profile-grid">
        <div className="profile-block">
          <h3>Account</h3>
          <dl className="profile-list">
            <div>
              <dt>Email</dt>
              <dd>{user.email || "No email on file"}</dd>
            </div>
            <div>
              <dt>Role</dt>
              <dd>{isTrainer ? "Coach" : "Athlete"}</dd>
            </div>
            <div>
              <dt>User ID</dt>
              <dd>{user.uid}</dd>
            </div>
          </dl>
        </div>

        <div className="profile-block">
          <h3>Training</h3>
          <dl className="profile-list">
            <div>
              <dt>Completed workouts</dt>
              <dd>{completedCount}</dd>
            </div>
            <div>
              <dt>Logged sessions</dt>
              <dd>{Object.keys(logs).length}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{lastUpdated ? new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(lastUpdated)) : "Not logged yet"}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="profile-block">
        <h3>Saved Maxes</h3>
        <div className="profile-max-grid">
          {maxFields.map((field) => {
            const max = maxes[field.key];
            const value = max?.value ?? max ?? "";
            const unit = max?.unit || "";
            return (
              <div className="profile-max" key={field.key}>
                <span>{field.label}</span>
                <strong>{value ? `${value}${unit}` : "-"}</strong>
              </div>
            );
          })}
        </div>
      </div>

      <div className="profile-actions profile-actions-bottom">
        <button className="primary" type="button" onClick={onOpenEdit}>
          <PencilLine size={18} />
          Edit
        </button>
      </div>
    </section>
  );
}

function ProfileEditPage({ user, onProfileSaved }) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [email, setEmail] = useState(user.email || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState("");

  async function handlePictureUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImageError("");
    setSaved(false);
    setUploadingImage(true);
    try {
      const fallbackDataUrl = await imageFileToDataUrl(file);
      const uploadedUrl = await uploadUserProfileImage(user.uid, file, fallbackDataUrl);
      setPhotoURL(uploadedUrl);
      const savedProfile = await saveUserProfile(user.uid, { photoURL: uploadedUrl });
      onProfileSaved(savedProfile);
      setSaved(true);
    } catch {
      setImageError("Could not upload that picture.");
    } finally {
      setUploadingImage(false);
    }
  }

  async function persistProfile(event) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setImageError("");
    const profile = {
      displayName: displayName.trim(),
      email: email.trim(),
      photoURL: photoURL.trim(),
    };
    try {
      const savedProfile = await saveUserProfile(user.uid, profile);
      onProfileSaved(savedProfile);
      setSaved(true);
    } catch {
      setImageError("Could not save your profile picture.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <ProfileAvatar user={{ ...user, photoURL }} />
        <div>
          <p className="eyebrow">Profile details</p>
          <h2>Edit profile</h2>
        </div>
      </div>

      <form className="profile-edit-form" onSubmit={persistProfile}>
        <label>
          Name
          <input value={displayName} onChange={(event) => { setSaved(false); setDisplayName(event.target.value); }} placeholder="Your name" />
        </label>
        <label>
          Email
          <input value={email} onChange={(event) => { setSaved(false); setEmail(event.target.value); }} type="email" placeholder="you@example.com" />
        </label>
        <div className="wide profile-upload-field">
          <span>Profile picture</span>
          <label className={uploadingImage || saving ? "upload-picture-button disabled" : "upload-picture-button"}>
            <Plus size={18} />
            {uploadingImage ? "Uploading..." : photoURL ? "Change photo" : "Upload photo"}
            <input type="file" accept="image/*" onChange={handlePictureUpload} disabled={uploadingImage || saving} />
          </label>
        </div>
        <button className="primary" type="submit" disabled={saving || uploadingImage}>
          <Save size={18} />
          {uploadingImage ? "Uploading..." : saving ? "Saving..." : "Save profile"}
        </button>
        {saved && <p className="save-status">Profile saved.</p>}
        {imageError && <p className="form-error">{imageError}</p>}
      </form>
    </section>
  );
}

function ProfileSetupModal({ user, onComplete }) {
  const initialUnit = loadUserWeightUnit(user.uid);
  const initialHeight = String(user.height || "");
  const initialHeightInches = user.heightUnit === "in" ? Number(initialHeight) || 0 : 0;
  const [measurementSystem, setMeasurementSystem] = useState(initialUnit === "lb" ? "imperial" : "metric");
  const [gender, setGender] = useState(user.gender || "");
  const [heightCm, setHeightCm] = useState(user.heightUnit === "cm" ? initialHeight : "");
  const [heightFeet, setHeightFeet] = useState(user.heightFeet || (initialHeightInches ? String(Math.floor(initialHeightInches / 12)) : ""));
  const [heightInches, setHeightInches] = useState(user.heightInches || (initialHeightInches ? String(initialHeightInches % 12) : ""));
  const [weight, setWeight] = useState(user.bodyweight || "");
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || "");
  const [trainingGoal, setTrainingGoal] = useState(user.trainingGoal || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const heightUnit = measurementSystem === "imperial" ? "in" : "cm";
  const weightUnit = measurementSystem === "imperial" ? "lb" : "kg";

  async function finishSetup(event) {
    event.preventDefault();
    setSaving(true);
    setError("");
    const imperialHeightEntered = heightFeet.trim() || heightInches.trim();
    const heightValue = measurementSystem === "imperial"
      ? imperialHeightEntered
        ? String((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0))
        : ""
      : heightCm.trim();
    const profile = {
      profileSetupCompleted: true,
      profileSetupCompletedAt: new Date().toISOString(),
      measurementSystem,
      gender,
      height: heightValue,
      heightUnit,
      heightFeet: measurementSystem === "imperial" ? heightFeet.trim() : "",
      heightInches: measurementSystem === "imperial" ? heightInches.trim() : "",
      bodyweight: weight.trim(),
      bodyweightUnit: weightUnit,
      experienceLevel,
      trainingGoal: trainingGoal.trim(),
    };
    try {
      saveUserWeightUnit(user.uid, weightUnit);
      if (weight.trim()) {
        const entries = loadBodyMetrics(user.uid);
        saveBodyMetrics(user.uid, [
          ...entries,
          {
            id: `setup-${Date.now()}`,
            date: new Date().toISOString(),
            bodyweight: Number(weight) || "",
            bodyFat: "",
            muscleMass: "",
          },
        ]);
      }
      const savedProfile = await saveUserProfile(user.uid, profile);
      onComplete(savedProfile);
    } catch {
      setError("Could not save setup details.");
      setSaving(false);
    }
  }

  async function skipSetup() {
    setSaving(true);
    setError("");
    try {
      const savedProfile = await saveUserProfile(user.uid, {
        profileSetupCompleted: true,
        profileSetupSkippedAt: new Date().toISOString(),
      });
      onComplete(savedProfile);
    } catch {
      setError("Could not skip setup right now.");
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal-panel setup-modal-panel" role="dialog" aria-modal="true" aria-labelledby="profile-setup-title">
        <div>
          <p className="eyebrow">Profile setup</p>
          <h2 id="profile-setup-title">Finish setting up your profile</h2>
        </div>
        <form className="modal-form setup-form" onSubmit={finishSetup}>
          <label>
            Metric preference
            <select value={measurementSystem} onChange={(event) => setMeasurementSystem(event.target.value)}>
              <option value="metric">Metric (kg, cm)</option>
              <option value="imperial">Imperial (lb, in)</option>
            </select>
          </label>
          <label>
            Gender
            <select value={gender} onChange={(event) => setGender(event.target.value)}>
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="nonbinary">Non-binary</option>
              <option value="self-described">Self-described</option>
            </select>
          </label>
          <label>
            Height
            {measurementSystem === "imperial" ? (
              <div className="height-imperial-inputs">
                <span className="unit-input">
                  <input value={heightFeet} onChange={(event) => setHeightFeet(event.target.value)} inputMode="numeric" placeholder="5" aria-label="Height feet" />
                  <small>ft</small>
                </span>
                <span className="unit-input">
                  <input value={heightInches} onChange={(event) => setHeightInches(event.target.value)} inputMode="decimal" placeholder="10" aria-label="Height inches" />
                  <small>in</small>
                </span>
              </div>
            ) : (
              <input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" placeholder={heightUnit} />
            )}
          </label>
          <label>
            Weight
            <input value={weight} onChange={(event) => setWeight(event.target.value)} inputMode="decimal" placeholder={weightUnit} />
          </label>
          <label>
            Training experience
            <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
              <option value="">Optional</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </label>
          <label>
            Main goal
            <input value={trainingGoal} onChange={(event) => setTrainingGoal(event.target.value)} placeholder="Strength, weightlifting, conditioning..." />
          </label>
          <button className="primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save preferences"}
          </button>
          <button className="text-button setup-skip-button" type="button" onClick={skipSetup} disabled={saving}>
            Skip for now
          </button>
          {error && <p className="form-error">{error}</p>}
        </form>
      </div>
    </div>
  );
}

function SettingsPage({ onOpenSection }) {
  const [showRedeemCode, setShowRedeemCode] = useState(false);
  const [redeemCode, setRedeemCode] = useState("");
  const [redeemMessage, setRedeemMessage] = useState("");

  function redeemAccessCode(event) {
    event.preventDefault();
    const code = redeemCode.trim();
    if (!code) return;
    setRedeemMessage("Code redemption will be available soon.");
  }

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <Settings size={34} />
        </span>
        <div>
          <p className="eyebrow">Profile settings</p>
          <h2>Settings</h2>
        </div>
      </div>

      <div className="settings-option-list" aria-label="Settings options">
        {settingsSections.map((section) => {
          const SectionIcon = section.icon;
          return (
            <button className="settings-option" type="button" key={section.id} onClick={() => onOpenSection(section.id)}>
              <span className="settings-option-icon">
                <SectionIcon size={19} />
              </span>
              <span>
                <strong>{section.title}</strong>
                <small>{section.eyebrow}</small>
              </span>
              <ChevronRight size={18} />
            </button>
          );
        })}
      </div>

      <button className="secondary redeem-code-button" type="button" onClick={() => {
        setRedeemMessage("");
        setShowRedeemCode(true);
      }}>
        <Plus size={18} />
        Redeem code
      </button>

      <p className="app-version">Version {appVersion}</p>

      {showRedeemCode && (
        <div className="modal-backdrop" role="presentation">
          <form className="modal-panel modal-form" role="dialog" aria-modal="true" aria-labelledby="redeem-code-title" onSubmit={redeemAccessCode}>
            <div>
              <p className="eyebrow">Program access</p>
              <h2 id="redeem-code-title">Redeem code</h2>
            </div>
            <label>
              Access code
              <input value={redeemCode} onChange={(event) => {
                setRedeemCode(event.target.value.toUpperCase());
                setRedeemMessage("");
              }} placeholder="ENTER CODE" autoCapitalize="characters" />
            </label>
            <div className="modal-action-row">
              <button className="secondary" type="button" onClick={() => setShowRedeemCode(false)}>
                Cancel
              </button>
              <button className="primary" type="submit" disabled={!redeemCode.trim()}>
                Redeem
              </button>
            </div>
            {redeemMessage && <p className="save-status">{redeemMessage}</p>}
          </form>
        </div>
      )}
    </section>
  );
}

function SettingsSectionPage({ section, user, serviceWorkerRegistration, updateRegistration, onApplyUpdate, onLogout, onBack, onProfileSaved }) {
  const [bodyMetricSettings, setBodyMetricSettings] = useState(() => loadBodyMetricSettings(user.uid));
  const [weightUnit, setWeightUnit] = useState(() => loadUserWeightUnit(user.uid));
  const [distanceUnit, setDistanceUnit] = useState(() => loadUserDistanceUnit(user.uid));
  const [measurementSystem, setMeasurementSystem] = useState(user.measurementSystem || (loadUserWeightUnit(user.uid) === "lb" ? "imperial" : "metric"));
  const initialHeight = String(user.height || "");
  const initialHeightInches = user.heightUnit === "in" ? Number(initialHeight) || 0 : 0;
  const [heightCm, setHeightCm] = useState(user.heightUnit === "cm" ? initialHeight : "");
  const [heightFeet, setHeightFeet] = useState(user.heightFeet || (initialHeightInches ? String(Math.floor(initialHeightInches / 12)) : ""));
  const [heightInches, setHeightInches] = useState(user.heightInches || (initialHeightInches ? String(initialHeightInches % 12) : ""));
  const [bodyweight, setBodyweight] = useState(user.bodyweight || "");
  const [gender, setGender] = useState(user.gender || "");
  const [experienceLevel, setExperienceLevel] = useState(user.experienceLevel || "");
  const [trainingGoal, setTrainingGoal] = useState(user.trainingGoal || "");
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [notificationState, setNotificationState] = useState(() => {
    if (!("Notification" in window)) return { status: "unsupported", message: "This browser does not support notifications." };
    return { status: Notification.permission, message: Notification.permission === "granted" ? "Notifications are allowed on this device." : "Notifications are off on this device." };
  });
  const [savingNotifications, setSavingNotifications] = useState(false);
  const releaseNotes = [
    {
      title: "PWA install and updates",
      body: "Added the app manifest, icon, service worker registration, offline shell caching, and an update prompt when a new version is ready.",
    },
    {
      title: "Push notification foundation",
      body: "Added Firebase Cloud Messaging setup for foreground messages, background notifications, locked-phone delivery, notification click handling, and device token saving.",
    },
    {
      title: "Settings improvements",
      body: "Added notification controls, program history, app version visibility, and this release breakdown in one place.",
    },
    {
      title: "Coach and workout flow",
      body: "Kept the recent coach program tools, athlete progress views, profile updates, and workout logging refinements in the live build.",
    },
  ];

  async function enableNotifications() {
    setSavingNotifications(true);
    try {
      const result = await requestNotificationAccess(user.uid, serviceWorkerRegistration);
      setNotificationState(result);
    } catch (error) {
      setNotificationState({ status: "error", message: error.message || "Could not enable notifications." });
    } finally {
      setSavingNotifications(false);
    }
  }

  function updateBodyMetricSetting(key, patch) {
    const nextSettings = {
      ...bodyMetricSettings,
      [key]: { ...bodyMetricSettings[key], ...patch },
    };
    setBodyMetricSettings(nextSettings);
    saveBodyMetricSettings(user.uid, nextSettings);
  }

  function updateWeightUnit(unit) {
    setWeightUnit(unit);
    saveUserWeightUnit(user.uid, unit);
  }

  function updateDistanceUnit(unit) {
    setDistanceUnit(unit);
    saveUserDistanceUnit(user.uid, unit);
  }

  async function savePhysicalProfile(event) {
    event.preventDefault();
    setProfileSaving(true);
    setProfileSaved(false);
    setProfileError("");
    const nextWeightUnit = measurementSystem === "imperial" ? "lb" : "kg";
    const nextHeightUnit = measurementSystem === "imperial" ? "in" : "cm";
    const imperialHeightEntered = heightFeet.trim() || heightInches.trim();
    const heightValue = measurementSystem === "imperial"
      ? imperialHeightEntered
        ? String((Number(heightFeet) || 0) * 12 + (Number(heightInches) || 0))
        : ""
      : heightCm.trim();
    const profile = {
      profileSetupCompleted: true,
      measurementSystem,
      gender,
      height: heightValue,
      heightUnit: nextHeightUnit,
      heightFeet: measurementSystem === "imperial" ? heightFeet.trim() : "",
      heightInches: measurementSystem === "imperial" ? heightInches.trim() : "",
      bodyweight: bodyweight.trim(),
      bodyweightUnit: nextWeightUnit,
      experienceLevel,
      trainingGoal: trainingGoal.trim(),
    };
    try {
      saveUserWeightUnit(user.uid, nextWeightUnit);
      setWeightUnit(nextWeightUnit);
      if (bodyweight.trim()) {
        const entries = loadBodyMetrics(user.uid);
        saveBodyMetrics(user.uid, [
          ...entries,
          {
            id: `profile-${Date.now()}`,
            date: new Date().toISOString(),
            bodyweight: Number(bodyweight) || "",
            bodyFat: "",
            muscleMass: "",
          },
        ]);
      }
      const savedProfile = await saveUserProfile(user.uid, profile);
      onProfileSaved?.(savedProfile);
      setProfileSaved(true);
    } catch {
      setProfileError("Could not save profile settings.");
    } finally {
      setProfileSaving(false);
    }
  }

  const sectionConfig = settingsSections.find((item) => item.id === section) || settingsSections[0];
  const SectionIcon = sectionConfig.icon;

  return (
    <section className="profile-panel settings-panel">
      <div className="profile-header">
        <span className="profile-avatar">
          <SectionIcon size={34} />
        </span>
        <div>
          <p className="eyebrow">Settings</p>
          <h2>{sectionConfig.title}</h2>
        </div>
      </div>

      <button className="text-button settings-section-back" type="button" onClick={onBack}>
        <ArrowLeft size={17} />
        Settings
      </button>

      {section === "preferences" ? (
        <div className="settings-preferences">
          <div className="settings-block preference-settings-row">
            <div>
              <p className="eyebrow">Device</p>
              <h3>Notifications</h3>
              <p>{notificationState.message}</p>
            </div>
            <button className="secondary" type="button" onClick={enableNotifications} disabled={savingNotifications || notificationState.status === "granted"}>
              <Bell size={18} />
              {savingNotifications ? "Enabling..." : notificationState.status === "granted" ? "Enabled" : "Enable notifications"}
            </button>
          </div>
          <div className="settings-block preference-settings-row">
            <div>
              <p className="eyebrow">Weight unit</p>
              <h3>Training weights</h3>
              <p>Used for maxes, goals, workout loads, and bodyweight metrics.</p>
            </div>
            <select value={weightUnit} onChange={(event) => updateWeightUnit(event.target.value)} aria-label="Weight unit">
              <option value="kg">kg</option>
              <option value="lb">lb</option>
            </select>
          </div>
          <div className="settings-block preference-settings-row">
            <div>
              <p className="eyebrow">Distance unit</p>
              <h3>Running and conditioning</h3>
              <p>Used anywhere distance-based work is shown or logged.</p>
            </div>
            <select value={distanceUnit} onChange={(event) => updateDistanceUnit(event.target.value)} aria-label="Distance unit">
              <option value="km">km</option>
              <option value="mi">mi</option>
            </select>
          </div>
        </div>
      ) : section === "metrics" ? (
        <div className="settings-metrics">
          {bodyMetricFields.map((field) => {
            const setting = bodyMetricSettings[field.key] || defaultBodyMetricSettings[field.key];
            return (
              <div className="settings-block metric-settings-row" key={field.key}>
                <label className="checkbox-field">
                  <input
                    checked={setting.enabled}
                    onChange={(event) => updateBodyMetricSetting(field.key, { enabled: event.target.checked })}
                    type="checkbox"
                  />
                  {field.label}
                </label>
                <select
                  value={setting.mode}
                  onChange={(event) => updateBodyMetricSetting(field.key, { mode: event.target.value })}
                  aria-label={`${field.label} display mode`}
                  disabled={!setting.enabled}
                >
                  <option value="static">Static value</option>
                  <option value="goal">Compare to goal</option>
                </select>
              </div>
            );
          })}
        </div>
      ) : section === "updates" ? (
        <div className="settings-updates">
          <div className="whats-new-card">
            <div>
              <p className="eyebrow">Version {appVersion}</p>
              <h3>What's new</h3>
            </div>
            <div className="release-note-list">
              {releaseNotes.map((note) => (
                <article className="release-note" key={note.title}>
                  <strong>{note.title}</strong>
                  <p>{note.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div className="settings-actions">
          <form className="profile-settings-form" onSubmit={savePhysicalProfile}>
            <div className="settings-block-heading">
              <p className="eyebrow">Profile</p>
              <h3>Body details</h3>
              <p>Metric preference, height, and weight used for goals and body metrics.</p>
            </div>
            <label>
              Metric preference
              <select value={measurementSystem} onChange={(event) => setMeasurementSystem(event.target.value)}>
                <option value="metric">Metric (kg, cm)</option>
                <option value="imperial">Imperial (lb, in)</option>
              </select>
            </label>
            <label>
              Gender
              <select value={gender} onChange={(event) => setGender(event.target.value)}>
                <option value="">Prefer not to say</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="nonbinary">Non-binary</option>
                <option value="self-described">Self-described</option>
              </select>
            </label>
            <label>
              Height
              {measurementSystem === "imperial" ? (
                <div className="height-imperial-inputs">
                  <span className="unit-input">
                    <input value={heightFeet} onChange={(event) => setHeightFeet(event.target.value)} inputMode="numeric" placeholder="5" aria-label="Height feet" />
                    <small>ft</small>
                  </span>
                  <span className="unit-input">
                    <input value={heightInches} onChange={(event) => setHeightInches(event.target.value)} inputMode="decimal" placeholder="10" aria-label="Height inches" />
                    <small>in</small>
                  </span>
                </div>
              ) : (
                <input value={heightCm} onChange={(event) => setHeightCm(event.target.value)} inputMode="decimal" placeholder="cm" />
              )}
            </label>
            <label>
              Weight
              <input value={bodyweight} onChange={(event) => setBodyweight(event.target.value)} inputMode="decimal" placeholder={measurementSystem === "imperial" ? "lb" : "kg"} />
            </label>
            <label>
              Training experience
              <select value={experienceLevel} onChange={(event) => setExperienceLevel(event.target.value)}>
                <option value="">Optional</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>
              Main goal
              <input value={trainingGoal} onChange={(event) => setTrainingGoal(event.target.value)} placeholder="Strength, weightlifting, conditioning..." />
            </label>
            <button className="primary" type="submit" disabled={profileSaving}>
              <Save size={18} />
              {profileSaving ? "Saving..." : "Save preferences"}
            </button>
            {profileSaved && <p className="save-status">Profile settings saved.</p>}
            {profileError && <p className="form-error">{profileError}</p>}
          </form>
          {updateRegistration && (
            <div className="settings-block">
              <div>
                <p className="eyebrow">App update</p>
                <h3>New version ready</h3>
                <p>Restart the app to load the newest installed version.</p>
              </div>
              <button className="primary" type="button" onClick={onApplyUpdate}>
                Update now
              </button>
            </div>
          )}
          <button className="secondary" type="button" onClick={onLogout}>
            <LogOut size={18} />
            Log out
          </button>
        </div>
      )}

      <p className="app-version">Version {appVersion}</p>
    </section>
  );
}

function MaxesPage({ user }) {
  const [maxes, setMaxes] = useState(() => loadUserMaxes(user.uid));
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const weightUnit = loadUserWeightUnit(user.uid);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const savedMaxFields = maxFields.filter((field) => maxValue(field.key));

  function updateMax(key, value) {
    setSaved(false);
    setMaxes({ ...maxes, [key]: { value, unit: weightUnit } });
  }

  async function persistMaxes(event) {
    event.preventDefault();
    setSaving(true);
    await syncUserMaxes(user.uid, maxes);
    setSaving(false);
    setSaved(true);
    setEditing(false);
  }

  return (
    <section className="profile-panel maxes-panel">
      <div className="profile-header maxes-header">
        <div className="profile-header-main">
          <span className="profile-avatar">
            <Trophy size={34} />
          </span>
          <div>
            <p className="eyebrow">Profile maxes</p>
            <h2>Training max weights</h2>
          </div>
        </div>
        <button className={editing ? "icon-button active" : "icon-button"} type="button" onClick={() => setEditing(!editing)} aria-label={editing ? "View saved maxes" : "Edit maxes"} title={editing ? "View maxes" : "Edit maxes"}>
          <PencilLine size={17} />
        </button>
      </div>

      <div className="profile-block">
        <h3>Saved Maxes</h3>
        {savedMaxFields.length ? (
          <div className="profile-max-grid">
            {savedMaxFields.map((field) => (
              <div className="profile-max" key={field.key}>
                <span>{field.label}</span>
                <strong>{maxValue(field.key)}{weightUnit}</strong>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-list-copy">No maxes saved yet.</p>
        )}
        <div>
          {saved && <p className="save-status">Maxes saved.</p>}
        </div>
      </div>

      {editing && <form className="maxes-form" onSubmit={persistMaxes}>
        {maxFields.map((field) => (
          <label className="maxes-field" key={field.key}>
            {field.label}
            <span className="max-input-row">
              <input
                value={maxValue(field.key)}
                onChange={(event) => updateMax(field.key, event.target.value)}
                inputMode="decimal"
                placeholder={`Max (${weightUnit})`}
              />
            </span>
          </label>
        ))}
        <button className="primary" type="submit" disabled={saving}>
          <Save size={18} />
          {saving ? "Saving..." : "Save maxes"}
        </button>
        {saved && <p className="save-status">Maxes saved.</p>}
      </form>}
    </section>
  );
}

function GoalsPage({ user, logs }) {
  const goals = loadUserGoals(user.uid);
  const bodyMetrics = loadBodyMetrics(user.uid);
  const maxes = loadUserMaxes(user.uid);
  const weightUnit = loadUserWeightUnit(user.uid);
  const activeGoals = goals.filter((goal) => !goal.archivedAt);
  const recentCompletedCount = completedWorkoutsLast30Days(logs);
  const weekStreak = weeklyWorkoutStreak(logs);

  function renderGoal(goal) {
    const latestMetric = goal.type === "metric" ? metricLatest(bodyMetrics, goal.metric) : null;
    const progress = goal.type === "metric"
      ? {
          ...(metricGoalProgress(goal, latestMetric?.[goal.metric]) || { percent: 0, complete: false }),
          label: `${latestMetric?.[goal.metric] || 0}/${goal.target}${bodyMetricUnit(bodyMetricFields.find((field) => field.key === goal.metric) || {}, weightUnit)}`,
        }
      : goalProgress(goal, logs, maxes, weightUnit);
    const liftLabel = maxFields.find((field) => field.key === goal.lift)?.label;
    const metricLabel = bodyMetricFields.find((field) => field.key === goal.metric)?.label;
    const bodyweightChart = goal.type === "metric" && goal.metric === "bodyweight"
      ? metricLineChart(bodyMetrics, goal.metric, goal.target)
      : null;
    return (
      <article className={progress.complete ? "goal-card complete" : "goal-card"} key={goal.id}>
        <div className="goal-card-heading">
          <div>
            <p className="eyebrow">{goal.type === "metric" ? metricLabel : goal.type === "max" ? liftLabel : "Workout consistency"}</p>
            <h4>{goal.title}</h4>
          </div>
          {progress.complete ? <CheckCircle2 size={20} /> : <TrendingUp size={20} />}
        </div>
        {bodyweightChart ? (
          <div className="bodyweight-chart" role="img" aria-label="Bodyweight progress over time">
            <svg viewBox="0 0 100 90" aria-hidden="true">
              <line className="chart-grid-line" x1="8" x2="92" y1="18" y2="18" />
              <line className="chart-grid-line" x1="8" x2="92" y1="47" y2="47" />
              <line className="chart-grid-line" x1="8" x2="92" y1="76" y2="76" />
              {bodyweightChart.targetY !== null && (
                <line className="chart-target-line" x1="8" x2="92" y1={bodyweightChart.targetY} y2={bodyweightChart.targetY} />
              )}
              {bodyweightChart.points.length > 1 && <polyline className="chart-progress-line" points={bodyweightChart.line} />}
              {bodyweightChart.points.map((point, index) => (
                <circle
                  className={index === bodyweightChart.points.length - 1 ? "chart-point latest" : "chart-point"}
                  cx={point.x}
                  cy={point.y}
                  key={`${point.date}-${index}`}
                  r={index === bodyweightChart.points.length - 1 ? 3.2 : 2.2}
                />
              ))}
            </svg>
            <div className="bodyweight-chart-labels">
              <span>{formatShortDate(bodyweightChart.first.date)}: {bodyweightChart.first.value}{weightUnit}</span>
              <strong>{bodyweightChart.latest.value}{weightUnit}</strong>
              <span>{formatShortDate(bodyweightChart.latest.date)}</span>
            </div>
          </div>
        ) : (
          <div className="progress-meter" aria-label={`${progress.percent}% complete`}>
            <span style={{ width: `${progress.percent}%` }} />
          </div>
        )}
        <dl className="program-stats">
          <div>
            <dt>Progress</dt>
            <dd>{progress.label}</dd>
          </div>
          <div>
            <dt>Started</dt>
            <dd>{formatDate(goal.startDate)}</dd>
          </div>
        </dl>
      </article>
    );
  }

  return (
    <section className="profile-panel goals-panel">
      <div className="progress-header">
        <div className="profile-header">
          <span className="profile-avatar">
            <TrendingUp size={34} />
          </span>
          <div>
            <p className="eyebrow">Athlete progress</p>
            <h2>Progress</h2>
          </div>
        </div>
      </div>

      <div className="progress-snapshot-grid">
        <article className="progress-snapshot-card">
          <Dumbbell size={20} />
          <strong>{recentCompletedCount}</strong>
          <span>Workouts completed last 30 days</span>
        </article>
        <article className="progress-snapshot-card">
          <CalendarDays size={20} />
          <strong>{weekStreak}</strong>
          <span>Weekly workout streak</span>
          <p className="progress-card-note">Consecutive weeks with at least one workout</p>
        </article>
      </div>

      <div className="goal-section">
        <div className="program-section-title">
          <h3>Active Goal Progress</h3>
          <span>{activeGoals.length}</span>
        </div>
        {activeGoals.length ? (
          <div className="goal-card-grid">
            {activeGoals.map(renderGoal)}
          </div>
        ) : (
          <p className="empty-list-copy">No active goals yet.</p>
        )}
      </div>
    </section>
  );
}

function App() {
  const initialRoute = useMemo(() => readAppRoute(), []);
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [isTrainer, setIsTrainer] = useState(false);
  const [logs, setLogs] = useState({});
  const [athleteProgressLogs, setAthleteProgressLogs] = useState({});
  const [customWorkouts, setCustomWorkouts] = useState([]);
  const [programs, setPrograms] = useState([]);
  const [programWorkouts, setProgramWorkouts] = useState([]);
  const [workoutScheduleOverrides, setWorkoutScheduleOverrides] = useState({});
  const [selectedDate, setSelectedDate] = useState(initialRoute.selectedDate);
  const [selectedWorkoutKey, setSelectedWorkoutKey] = useState(initialRoute.selectedWorkoutKey);
  const [view, setView] = useState(initialRoute.view);
  const [daySwipeStart, setDaySwipeStart] = useState(null);
  const [serviceWorkerRegistration, setServiceWorkerRegistration] = useState(null);
  const [updateRegistration, setUpdateRegistration] = useState(null);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [menuEditMode, setMenuEditMode] = useState(false);
  const [menuPressHandled, setMenuPressHandled] = useState(false);
  const [menuButtonPreferences, setMenuButtonPreferences] = useState(loadMenuButtonPreferences);
  const [showProfileSetup, setShowProfileSetup] = useState(false);
  const [visibleCalendarMonths, setVisibleCalendarMonths] = useState(3);
  const [timerMode, setTimerMode] = useState("countup");
  const [countdownSeconds, setCountdownSeconds] = useState(180);
  const [intervalWorkSeconds, setIntervalWorkSeconds] = useState(60);
  const [intervalRestSeconds, setIntervalRestSeconds] = useState(30);
  const [intervalPhase, setIntervalPhase] = useState("work");
  const [intervalRounds, setIntervalRounds] = useState(5);
  const [intervalCurrentRound, setIntervalCurrentRound] = useState(1);
  const [intervalEndless, setIntervalEndless] = useState(true);
  const [showTimerSettings, setShowTimerSettings] = useState(false);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [timerPressHandled, setTimerPressHandled] = useState(false);
  const [lastTimerTap, setLastTimerTap] = useState(0);
  const [timerStartedAt, setTimerStartedAt] = useState(null);
  const [timerBankedSeconds, setTimerBankedSeconds] = useState(0);
  const [timerNow, setTimerNow] = useState(Date.now());
  const routeWritePending = useRef(false);
  const menuLongPressTimer = useRef(null);
  const timerRunning = Boolean(timerStartedAt);
  const timerElapsedSeconds = timerBankedSeconds + (timerRunning ? Math.floor((timerNow - timerStartedAt) / 1000) : 0);
  const activeIntervalSeconds = intervalPhase === "work" ? intervalWorkSeconds : intervalRestSeconds;
  const timerSeconds = timerMode === "countup" ? timerElapsedSeconds : Math.max(0, (timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds) - timerElapsedSeconds);
  const timerLabel = timerMode === "interval" ? `${intervalPhase === "work" ? "W" : "R"}${intervalEndless ? "" : intervalCurrentRound} ${formatTimer(timerSeconds)}` : formatTimer(timerSeconds);
  const countdownMinutes = Math.floor(countdownSeconds / 60);
  const countdownRemainderSeconds = countdownSeconds % 60;

  async function hydrateUser(nextUser) {
    if (!nextUser) {
      setUser(null);
      setShowProfileSetup(false);
      setLogs({});
      setAthleteProgressLogs({});
      setIsTrainer(false);
      setCustomWorkouts([]);
      setPrograms([]);
      setProgramWorkouts([]);
      setWorkoutScheduleOverrides({});
      return;
    }

    const [profile, cloudMaxes] = await Promise.all([
      loadUserProfile(nextUser.uid),
      loadCloudUserMaxes(nextUser.uid),
    ]);
    saveUserMaxes(nextUser.uid, cloudMaxes);
    const profiledUser = mergeUserProfile(nextUser, profile);
    setUser(profiledUser);
    setShowProfileSetup(profile.profileSetupCompleted !== true);

    const [nextLogs, nextTrainer, nextCustomWorkouts] = await Promise.all([
      loadWorkoutLogs(nextUser.uid),
      isTrainerUser(nextUser),
      loadCustomWorkouts("default"),
    ]);
    const nextPrograms = nextTrainer || isDevUser(nextUser.uid) ? await loadPrograms() : [];

    setLogs(nextLogs);
    setIsTrainer(nextTrainer);
    setAthleteProgressLogs(nextTrainer ? await loadWorkoutLogs("dev-athlete") : nextLogs);
    setCustomWorkouts(nextCustomWorkouts);
    setPrograms(nextPrograms);
    setWorkoutScheduleOverrides(loadWorkoutScheduleOverrides(nextUser.uid));
    const programWorkoutLists = await Promise.all(nextPrograms.map((program) => loadCustomWorkouts(program.id)));
    setProgramWorkouts(programWorkoutLists.flat());
  }

  async function refreshCustomWorkouts() {
    const [nextDefaultWorkouts, nextPrograms] = await Promise.all([
      loadCustomWorkouts("default"),
      loadPrograms(),
    ]);
    const programWorkoutLists = await Promise.all(nextPrograms.map((program) => loadCustomWorkouts(program.id)));
    setCustomWorkouts(nextDefaultWorkouts);
    setPrograms(nextPrograms);
    setProgramWorkouts(programWorkoutLists.flat());
  }

  useEffect(() => {
    return observeAuth((nextUser) => {
      setUser(mergeUserProfile(nextUser));
      setChecking(false);
      hydrateUser(nextUser);
    });
  }, []);

  useEffect(() => {
    function applyBrowserRoute() {
      const nextRoute = readAppRoute();
      routeWritePending.current = true;
      setSelectedDate(nextRoute.selectedDate);
      setSelectedWorkoutKey(nextRoute.selectedWorkoutKey);
      setView(nextRoute.view);
      setShowNavMenu(false);
    }

    window.addEventListener("popstate", applyBrowserRoute);
    return () => window.removeEventListener("popstate", applyBrowserRoute);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (routeWritePending.current) {
      routeWritePending.current = false;
      return;
    }
    const nextUrl = appRouteUrl({ view, selectedDate, selectedWorkoutKey });
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (nextUrl !== currentUrl) {
      window.history.pushState({}, "", nextUrl);
    }
  }, [selectedDate, selectedWorkoutKey, view]);

  useEffect(() => {
    registerAppServiceWorker(setUpdateRegistration)
      .then(setServiceWorkerRegistration)
      .catch((error) => console.warn("Service worker registration failed.", error));
  }, []);

  useEffect(() => {
    function updateOnlineStatus() {
      setIsOnline(navigator.onLine);
    }

    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);
    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
    };
  }, []);

  useEffect(() => {
    saveMenuButtonPreferences(menuButtonPreferences);
  }, [menuButtonPreferences]);

  useEffect(() => () => {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
  }, []);

  useEffect(() => {
    if (!user) return undefined;
    let unsubscribe = () => {};
    let active = true;

    listenForForegroundMessages((payload) => {
      const title = payload.notification?.title || payload.data?.title || "Primitive Programming";
      const body = payload.notification?.body || payload.data?.body || "New training update received.";
      setNotificationMessage(`${title}: ${body}`);
      window.setTimeout(() => setNotificationMessage(""), 5000);
    }).then((nextUnsubscribe) => {
      if (active) unsubscribe = nextUnsubscribe;
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [user]);

  useEffect(() => {
    if (!timerRunning) return undefined;
    const intervalId = window.setInterval(() => setTimerNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, [timerRunning]);

  useEffect(() => {
    if (!timerRunning || timerMode === "countup") return;
    const targetSeconds = timerMode === "countdown" ? countdownSeconds : activeIntervalSeconds;
    if (timerElapsedSeconds < targetSeconds) return;

    if (timerMode === "interval") {
      if (intervalPhase === "work") {
        setIntervalPhase("rest");
      } else {
        const nextRound = intervalCurrentRound + 1;
        if (!intervalEndless && nextRound > intervalRounds) {
          setIntervalPhase("work");
          setIntervalCurrentRound(1);
        } else {
          setIntervalPhase("work");
          setIntervalCurrentRound(nextRound);
        }
      }
    }
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }, [activeIntervalSeconds, countdownSeconds, intervalCurrentRound, intervalEndless, intervalPhase, intervalRounds, timerElapsedSeconds, timerMode, timerRunning]);

  const starterProgramWorkouts = useMemo(() => (
    isDevUser(user?.uid)
      ? importedProgram.map((item) => (
        workoutScheduleOverrides[item.id] ? { ...item, date: workoutScheduleOverrides[item.id] } : item
      ))
      : []
  ), [user?.uid, workoutScheduleOverrides]);
  const savedWorkouts = useMemo(() => [...customWorkouts, ...programWorkouts], [customWorkouts, programWorkouts]);
  const allWorkouts = useMemo(() => [...starterProgramWorkouts, ...savedWorkouts], [savedWorkouts, starterProgramWorkouts]);
  const workoutsByDate = useMemo(() => groupByDate(allWorkouts), [allWorkouts]);
  const programLedWorkoutDates = useMemo(() => (
    [...starterProgramWorkouts, ...programWorkouts]
      .map((item) => item.date)
      .filter(Boolean)
      .sort()
  ), [programWorkouts, starterProgramWorkouts]);
  const calendarMonths = useMemo(() => calendarSections(programLedWorkoutDates, new Date(), visibleCalendarMonths), [programLedWorkoutDates, visibleCalendarMonths]);
  const dates = useMemo(() => calendarMonths.flatMap((section) => section.dates), [calendarMonths]);
  const selectedWorkoutGroups = useMemo(() => groupWorkouts(workoutsByDate[selectedDate] || []), [selectedDate, workoutsByDate]);
  const selectedWorkout = selectedWorkoutKey === "blank"
    ? []
    : selectedWorkoutGroups.find((group) => group.key === selectedWorkoutKey)?.items || selectedWorkoutGroups[0]?.items || [];
  const activeWorkoutKey = selectedWorkoutKey || selectedWorkoutGroups[0]?.key || "blank";
  const activeWorkoutGroup = selectedWorkoutKey === "blank"
    ? null
    : selectedWorkoutGroups.find((group) => group.key === activeWorkoutKey) || selectedWorkoutGroups[0] || null;
  const today = new Date().toISOString().slice(0, 10);
  const todayTarget = workoutsByDate[today] ? today : dates.find((date) => date >= today) || dates[0] || today;
  const orderedMenuButtons = useMemo(() => {
    const normalized = normalizeMenuButtonPreferences(menuButtonPreferences);
    const hiddenIds = new Set(normalized.hidden);
    const applicableItems = normalized.order
      .map((id) => menuButtonItemMap[id])
      .filter(Boolean)
      .filter((item) => {
        if (item.trainerOnly && !isTrainer) return false;
        if (item.hideForTrainer && isTrainer) return false;
        return true;
      });
    const visibleItems = applicableItems.filter((item) => !hiddenIds.has(item.id));
    if (!menuEditMode) return visibleItems.length ? visibleItems : [menuButtonItemMap.settings];
    return applicableItems;
  }, [isTrainer, menuButtonPreferences, menuEditMode]);
  const hiddenMenuButtonIds = useMemo(() => new Set(normalizeMenuButtonPreferences(menuButtonPreferences).hidden), [menuButtonPreferences]);

  function openWorkoutList(date) {
    setSelectedDate(date);
    setSelectedWorkoutKey("");
    setView("workout-list");
  }

  function startDaySwipe(event) {
    if (view !== "workout-list" || event.pointerType === "mouse") return;
    if (event.target.closest(".top-nav, .modal-backdrop, .modal-panel")) return;
    setDaySwipeStart({ x: event.clientX, y: event.clientY });
  }

  function finishDaySwipe(event) {
    if (view !== "workout-list" || !daySwipeStart || event.pointerType === "mouse") return;
    const deltaX = event.clientX - daySwipeStart.x;
    const deltaY = event.clientY - daySwipeStart.y;
    setDaySwipeStart(null);
    if (Math.abs(deltaX) < 54 || Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return;
    openWorkoutList(shiftDate(selectedDate, deltaX < 0 ? 1 : -1));
  }

  function openWorkout(key) {
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openStoredWorkout(date, key) {
    setSelectedDate(date);
    setSelectedWorkoutKey(key);
    setView("workout");
  }

  function openBlankWorkout() {
    setSelectedWorkoutKey("blank");
    setView("workout");
  }

  function handleProfileSaved(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
  }

  function handleProfileSetupComplete(profile) {
    setUser((currentUser) => ({ ...currentUser, ...profile }));
    setShowProfileSetup(false);
  }

  async function handleLogout() {
    await logout();
    setView("client");
    setUser(null);
    setShowProfileSetup(false);
    setLogs({});
    setAthleteProgressLogs({});
    setIsTrainer(false);
    setCustomWorkouts([]);
    setPrograms([]);
    setProgramWorkouts([]);
    setWorkoutScheduleOverrides({});
    setChecking(false);
  }

  async function moveSelectedWorkout(nextDate) {
    if (!user || !activeWorkoutGroup || !nextDate || nextDate === selectedDate) return;
    const movedItems = activeWorkoutGroup.items.map((item) => ({
      ...item,
      date: nextDate,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${nextDate}T12:00:00`)),
    }));
    const movedIds = new Set(movedItems.map((item) => item.id));
    const nextWorkoutKey = workoutGroupKey(movedItems[0]);
    const nextOverrides = { ...workoutScheduleOverrides };

    movedItems.forEach((item) => {
      if (String(item.id || "").startsWith("mock-")) {
        nextOverrides[item.id] = nextDate;
      }
    });

    setWorkoutScheduleOverrides(nextOverrides);
    saveWorkoutScheduleOverrides(user.uid, nextOverrides);

    if (customWorkouts.some((item) => movedIds.has(item.id))) {
      setCustomWorkouts((current) => current.map((item) => (
        movedIds.has(item.id) ? movedItems.find((movedItem) => movedItem.id === item.id) || item : item
      )));
    }

    if (programWorkouts.some((item) => movedIds.has(item.id))) {
      setProgramWorkouts((current) => current.map((item) => (
        movedIds.has(item.id) ? movedItems.find((movedItem) => movedItem.id === item.id) || item : item
      )));
    }

    await Promise.all(movedItems
      .filter((item) => !String(item.id || "").startsWith("mock-"))
      .map((item) => saveCustomWorkout(item.programId || "default", item)));

    moveWorkoutDraft(user.uid, selectedDate, activeWorkoutKey, nextDate, nextWorkoutKey);
    setSelectedDate(nextDate);
    setSelectedWorkoutKey(nextWorkoutKey);
    setView("workout");
    handleWorkoutSaveStatus({ synced: false, local: true });
  }

  function applyAppUpdate() {
    activateWaitingServiceWorker(updateRegistration);
  }

  function resetTimer() {
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setTimerNow(Date.now());
    if (timerMode === "interval") {
      setIntervalPhase("work");
      setIntervalCurrentRound(1);
    }
  }

  function toggleTimer() {
    if (timerRunning) {
      setTimerBankedSeconds(timerElapsedSeconds);
      setTimerStartedAt(null);
      return;
    }
    setTimerStartedAt(Date.now());
    setTimerNow(Date.now());
  }

  function startTimerPress() {
    setTimerPressHandled(false);
    const timeoutId = window.setTimeout(() => {
      setTimerPressHandled(true);
      setShowTimerSettings(true);
    }, 550);
    setLongPressTimer(timeoutId);
  }

  function endTimerPress() {
    if (longPressTimer) window.clearTimeout(longPressTimer);
    setLongPressTimer(null);
  }

  function handleTimerClick() {
    if (timerPressHandled) {
      setTimerPressHandled(false);
      return;
    }
    const now = Date.now();
    if (now - lastTimerTap < 320) {
      setLastTimerTap(0);
      resetTimer();
      return;
    }
    setLastTimerTap(now);
    toggleTimer();
  }

  function changeTimerMode(mode) {
    setTimerMode(mode);
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
    setIntervalPhase("work");
    setIntervalCurrentRound(1);
  }

  function updateCountdownPart(part, value) {
    const numericValue = Math.max(0, Number(value) || 0);
    const nextMinutes = part === "minutes" ? numericValue : countdownMinutes;
    const nextSeconds = part === "seconds" ? Math.min(59, numericValue) : countdownRemainderSeconds;
    setCountdownSeconds(Math.max(1, (nextMinutes * 60) + nextSeconds));
    setTimerStartedAt(null);
    setTimerBankedSeconds(0);
  }

  function startMenuButtonPress() {
    if (menuEditMode) return;
    setMenuPressHandled(false);
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = window.setTimeout(() => {
      setMenuPressHandled(true);
      setMenuEditMode(true);
    }, 600);
  }

  function endMenuButtonPress() {
    if (menuLongPressTimer.current) window.clearTimeout(menuLongPressTimer.current);
    menuLongPressTimer.current = null;
  }

  function handleMenuButtonClick(item) {
    if (menuPressHandled) {
      setMenuPressHandled(false);
      return;
    }
    if (menuEditMode) return;
    openMenuView(item.view);
  }

  function moveMenuButton(itemId, targetItemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const currentIndex = nextPreferences.order.indexOf(itemId);
      const nextIndex = nextPreferences.order.indexOf(targetItemId);
      if (currentIndex < 0 || nextIndex < 0 || nextIndex >= nextPreferences.order.length) return nextPreferences;
      const nextOrder = [...nextPreferences.order];
      [nextOrder[currentIndex], nextOrder[nextIndex]] = [nextOrder[nextIndex], nextOrder[currentIndex]];
      return { ...nextPreferences, order: nextOrder };
    });
  }

  function toggleMenuButtonHidden(itemId) {
    setMenuButtonPreferences((current) => {
      const nextPreferences = normalizeMenuButtonPreferences(current);
      const hidden = new Set(nextPreferences.hidden);
      if (hidden.has(itemId)) {
        hidden.delete(itemId);
      } else {
        hidden.add(itemId);
      }
      return { ...nextPreferences, hidden: [...hidden] };
    });
  }

  function resetMenuButtons() {
    setMenuButtonPreferences(normalizeMenuButtonPreferences());
  }

  function openMenuView(nextView) {
    setView(nextView);
    setShowNavMenu(false);
    setMenuEditMode(false);
  }

  function handleWorkoutSaveStatus(result) {
    if (result?.synced) {
      setSaveMessage("Workout synced.");
    } else {
      setSaveMessage("Workout saved on this device.");
    }
    window.setTimeout(() => setSaveMessage(""), 3200);
  }

  if (checking) return <main className="loading">Loading...</main>;
  if (!user) return <AuthCard onAuthed={hydrateUser} />;

  return (
    <main
      className={view === "workout-list" ? "app-shell day-swipe-shell" : "app-shell"}
      onPointerDown={startDaySwipe}
      onPointerUp={finishDaySwipe}
      onPointerCancel={() => setDaySwipeStart(null)}
    >
      <nav className="top-nav">
        <button className="nav-button nav-icon menu-button" type="button" onClick={() => setShowNavMenu(true)} aria-label="Open menu" title="Menu">
          <Menu size={19} />
        </button>
        <button className="nav-brand" type="button" onClick={() => setView("client")} aria-label="Go to home" title="Home">
          <Dumbbell size={22} />
          <span>Primitive</span>
        </button>
        <div className="nav-actions">
          <button
            className={timerRunning ? "nav-button timer-button active" : "nav-button timer-button"}
            onClick={handleTimerClick}
            onPointerDown={startTimerPress}
            onPointerUp={endTimerPress}
            onPointerCancel={endTimerPress}
            onPointerLeave={endTimerPress}
            type="button"
            aria-label={timerRunning ? `Stop timer at ${timerLabel}` : `Start timer at ${timerLabel}`}
            title="Tap start/stop, double tap reset, long press settings"
          >
            <Clock size={17} />
            <span>{timerLabel}</span>
          </button>
          {isTrainer && (
            <>
              <button
                className={view === "athletes" ? "nav-button nav-icon active" : "nav-button nav-icon"}
                onClick={() => setView(view === "athletes" ? "client" : "athletes")}
                type="button"
                aria-label="View all athletes"
                title="Athletes"
              >
                <UsersRound size={17} />
              </button>
              <button
                className={view === "programs" ? "nav-button nav-icon active" : "nav-button nav-icon"}
                onClick={() => setView(view === "programs" ? "client" : "programs")}
                type="button"
                aria-label="Open programs"
                title="Programs"
              >
                <ClipboardList size={17} />
              </button>
            </>
          )}
          <button className="nav-profile-button" type="button" onClick={() => setView("profile")} aria-label="Open profile" title="Profile">
            {user.photoURL ? <img src={user.photoURL} alt="" /> : <UserRound size={18} />}
          </button>
        </div>
      </nav>

      {showNavMenu && (
        <div
          className="nav-menu-backdrop"
          role="presentation"
          onPointerDown={(event) => event.stopPropagation()}
          onPointerUp={(event) => event.stopPropagation()}
          onPointerCancel={(event) => event.stopPropagation()}
          onClick={() => {
            setShowNavMenu(false);
            setMenuEditMode(false);
          }}
        >
          <div className="nav-menu-panel" role="dialog" aria-modal="true" aria-label="Main menu" onClick={(event) => event.stopPropagation()}>
            <div className="nav-menu-header">
              <Dumbbell size={22} />
              <strong>Primitive</strong>
              {menuEditMode && (
                <div className="nav-menu-edit-actions">
                  <button type="button" onClick={resetMenuButtons}>Reset</button>
                  <button type="button" onClick={() => setMenuEditMode(false)}>Done</button>
                </div>
              )}
            </div>
            {orderedMenuButtons.map((item, index) => {
              const Icon = item.icon;
              const isHidden = hiddenMenuButtonIds.has(item.id);
              const previousItem = orderedMenuButtons[index - 1];
              const nextItem = orderedMenuButtons[index + 1];
              return (
                <div className={isHidden ? "menu-edit-row hidden" : "menu-edit-row"} key={item.id}>
                  <button
                    className="menu-link"
                    type="button"
                    onClick={() => handleMenuButtonClick(item)}
                    onPointerDown={startMenuButtonPress}
                    onPointerUp={endMenuButtonPress}
                    onPointerCancel={endMenuButtonPress}
                    onPointerLeave={endMenuButtonPress}
                    aria-disabled={menuEditMode}
                    title={menuEditMode ? "Editing menu" : "Long press to edit menu"}
                  >
                    {menuEditMode && <GripVertical className="menu-drag-icon" size={16} />}
                    <Icon size={18} />
                    <span>{item.label}</span>
                  </button>
                  {menuEditMode && (
                    <div className="menu-edit-controls" aria-label={`${item.label} menu controls`}>
                      <button type="button" onClick={() => previousItem && moveMenuButton(item.id, previousItem.id)} disabled={!previousItem} aria-label={`Move ${item.label} up`}>
                        <ArrowUp size={15} />
                      </button>
                      <button type="button" onClick={() => nextItem && moveMenuButton(item.id, nextItem.id)} disabled={!nextItem} aria-label={`Move ${item.label} down`}>
                        <ArrowDown size={15} />
                      </button>
                      <button type="button" onClick={() => toggleMenuButtonHidden(item.id)} aria-label={isHidden ? `Show ${item.label}` : `Hide ${item.label}`}>
                        {isHidden ? <Eye size={15} /> : <EyeOff size={15} />}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {showProfileSetup && (
        <ProfileSetupModal user={user} onComplete={handleProfileSetupComplete} />
      )}

      {showTimerSettings && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal-panel" role="dialog" aria-modal="true" aria-labelledby="timer-settings-title">
            <div>
              <p className="eyebrow">Timer</p>
              <h2 id="timer-settings-title">Timer settings</h2>
            </div>
            <div className="timer-mode-grid">
              <button className={timerMode === "countup" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countup")}>
                <strong>Count up</strong>
                <span>Tap to start from zero and stop whenever.</span>
              </button>
              <button className={timerMode === "countdown" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("countdown")}>
                <strong>Countdown</strong>
                <span>Runs to zero, then stops.</span>
              </button>
              <button className={timerMode === "interval" ? "choice-button active" : "choice-button"} type="button" onClick={() => changeTimerMode("interval")}>
                <strong>Intervals</strong>
                <span>Alternates work/rest each time it finishes.</span>
              </button>
            </div>
            {timerMode === "countdown" && (
              <div className="timer-settings-grid">
                <label>
                  Minutes
                  <input value={countdownMinutes} onChange={(event) => updateCountdownPart("minutes", event.target.value)} inputMode="numeric" />
                </label>
                <label>
                  Seconds
                  <input value={countdownRemainderSeconds} onChange={(event) => updateCountdownPart("seconds", event.target.value)} inputMode="numeric" />
                </label>
              </div>
            )}
            {timerMode === "interval" && (
              <>
                <div className="timer-settings-grid">
                  <label>
                    Work seconds
                    <input value={intervalWorkSeconds} onChange={(event) => setIntervalWorkSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
                  </label>
                  <label>
                    Rest seconds
                    <input value={intervalRestSeconds} onChange={(event) => setIntervalRestSeconds(Math.max(1, Number(event.target.value) || 1))} inputMode="numeric" />
                  </label>
                </div>
                <label className="checkbox-field">
                  <input
                    checked={intervalEndless}
                    onChange={(event) => {
                      setIntervalEndless(event.target.checked);
                      setIntervalCurrentRound(1);
                      setTimerStartedAt(null);
                      setTimerBankedSeconds(0);
                    }}
                    type="checkbox"
                  />
                  Endless intervals
                </label>
                {!intervalEndless && (
                  <label>
                    Rounds
                    <input value={intervalRounds} onChange={(event) => {
                      setIntervalRounds(Math.max(1, Number(event.target.value) || 1));
                      setIntervalCurrentRound(1);
                      setTimerStartedAt(null);
                      setTimerBankedSeconds(0);
                    }} inputMode="numeric" />
                  </label>
                )}
              </>
            )}
            <div className="timer-settings-actions">
              <button className="secondary" type="button" onClick={resetTimer}>
                Reset timer
              </button>
              <button className="primary" type="button" onClick={() => setShowTimerSettings(false)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {view === "profile" ? (
        <ProfilePage user={user} isTrainer={isTrainer} logs={logs} onOpenEdit={() => setView("edit-profile")} onOpenMaxes={() => setView("maxes")} onOpenGoals={() => setView("progress")} onOpenSettings={() => setView("settings")} />
      ) : view === "edit-profile" ? (
        <ProfileEditPage user={user} onProfileSaved={handleProfileSaved} />
      ) : view === "maxes" ? (
        <MaxesPage user={user} />
      ) : view === "progress" ? (
        <GoalsPage user={user} logs={logs} />
      ) : view === "settings" ? (
        <SettingsPage onOpenSection={(section) => setView(`settings-${section}`)} />
      ) : view.startsWith("settings-") ? (
        <SettingsSectionPage
          section={view.replace("settings-", "")}
          user={user}
          serviceWorkerRegistration={serviceWorkerRegistration}
          updateRegistration={updateRegistration}
          onApplyUpdate={applyAppUpdate}
          onLogout={handleLogout}
          onBack={() => setView("settings")}
          onProfileSaved={handleProfileSaved}
        />
      ) : view === "store" ? (
        <StorePage />
      ) : view === "community" ? (
        <CommunityPage />
      ) : view === "messages" ? (
        <MessagesPage />
      ) : view === "news" ? (
        <NewsPage />
      ) : view === "food-log" ? (
        <FoodLogPage />
      ) : view === "stretches" ? (
        <StretchesPage />
      ) : view === "warmup-cooldown" ? (
        <WarmupCooldownPage />
      ) : view === "stored-programs" ? (
        <StoredProgramsPage programs={programs} workouts={savedWorkouts} logs={logs} />
      ) : view === "stored-workouts" ? (
        <StoredWorkoutsPage programs={programs} workouts={savedWorkouts} logs={logs} onOpenWorkout={openStoredWorkout} />
      ) : view === "programs" ? (
        <ProgramsPage
          programs={programs}
          workouts={allWorkouts}
          logs={athleteProgressLogs}
          onProgramCreated={refreshCustomWorkouts}
          onWorkoutCreated={refreshCustomWorkouts}
        />
      ) : view === "athletes" ? (
        <AthletesPage programs={programs} workouts={allWorkouts} logs={athleteProgressLogs} />
      ) : view === "workout-list" ? (
        <WorkoutListView date={selectedDate} workoutGroups={selectedWorkoutGroups} logs={logs} programs={programs} onOpenWorkout={openWorkout} onAddWorkout={openBlankWorkout} onChangeDate={openWorkoutList} />
      ) : view === "workout" ? (
        <WorkoutView workout={selectedWorkout} workoutKey={activeWorkoutKey} date={selectedDate} user={user} logs={logs} setLogs={setLogs} onDone={() => setView("client")} onSaveStatus={handleWorkoutSaveStatus} onMoveWorkout={moveSelectedWorkout} />
      ) : (
        <>
          <div className="today-row">
            <button className="primary" type="button" onClick={() => openWorkoutList(todayTarget)}>
              View today's workout
            </button>
          </div>
          <CalendarStrip
            sections={calendarMonths}
            selectedDate={selectedDate}
            onSelectDate={openWorkoutList}
            logs={logs}
            workoutsByDate={workoutsByDate}
            onShowMoreMonths={() => setVisibleCalendarMonths((count) => count + 3)}
          />
        </>
      )}
      {!isOnline && <div className="connection-banner" role="status">Offline. Workout changes save on this device.</div>}
      {saveMessage && <div className="sync-toast" role="status">{saveMessage}</div>}
      {notificationMessage && <div className="notification-toast" role="status">{notificationMessage}</div>}
    </main>
  );
}

createRoot(document.getElementById("root")).render(<App />);
