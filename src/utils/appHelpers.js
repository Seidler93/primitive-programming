import { defaultBodyMetricSettings, defaultSelectedDate, flexibleScheduleMode, routeViews } from "../app/config";
import { defaultMenuButtonOrder } from "../app/menuRoutes";

export function formatTimer(totalSeconds) {
  const safeSeconds = Math.max(0, totalSeconds);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function workoutDraftKey(userId, date, workoutKey = "default") {
  return `primitive-programming:workout-draft:${userId}:${date}:${workoutKey}`;
}

export function loadWorkoutDraft(userId, date, workoutKey = "default") {
  try {
    const raw = localStorage.getItem(workoutDraftKey(userId, date, workoutKey));
    if (raw) return JSON.parse(raw);
    const legacyRaw = workoutKey === "default" ? null : localStorage.getItem(`primitive-programming:workout-draft:${userId}:${date}`);
    return legacyRaw ? JSON.parse(legacyRaw) : {};
  } catch {
    return {};
  }
}

export function saveWorkoutDraft(userId, date, workoutKey, draft) {
  localStorage.setItem(workoutDraftKey(userId, date, workoutKey), JSON.stringify(draft));
}

export function moveWorkoutDraft(userId, fromDate, fromWorkoutKey, toDate, toWorkoutKey) {
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

export function workoutScheduleOverridesKey(userId) {
  return `primitive-programming:workout-schedule-overrides:${userId}`;
}

export function loadWorkoutScheduleOverrides(userId) {
  try {
    return JSON.parse(localStorage.getItem(workoutScheduleOverridesKey(userId)) || "{}");
  } catch {
    return {};
  }
}

export function saveWorkoutScheduleOverrides(userId, overrides) {
  localStorage.setItem(workoutScheduleOverridesKey(userId), JSON.stringify(overrides));
}

export function workoutLogKey(date, workoutKey) {
  return workoutKey === "blank" ? `${date}:custom` : date;
}

export function userMaxesKey(userId) {
  return `primitive-programming:maxes:${userId}`;
}

export function loadUserMaxes(userId) {
  try {
    const raw = localStorage.getItem(userMaxesKey(userId));
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveUserMaxes(userId, maxes) {
  localStorage.setItem(userMaxesKey(userId), JSON.stringify(maxes));
}

export function userWeightUnitKey(userId) {
  return `primitive-programming:weight-unit:${userId}`;
}

export function loadUserWeightUnit(userId) {
  try {
    const stored = localStorage.getItem(userWeightUnitKey(userId));
    if (stored === "kg" || stored === "lb") return stored;
    const firstSavedUnit = Object.values(loadUserMaxes(userId)).find((max) => max?.unit === "kg" || max?.unit === "lb")?.unit;
    return firstSavedUnit || "kg";
  } catch {
    return "kg";
  }
}

export function saveUserWeightUnit(userId, unit) {
  localStorage.setItem(userWeightUnitKey(userId), unit === "lb" ? "lb" : "kg");
}

export function userDistanceUnitKey(userId) {
  return `primitive-programming:distance-unit:${userId}`;
}

export function loadUserDistanceUnit(userId) {
  try {
    const stored = localStorage.getItem(userDistanceUnitKey(userId));
    return stored === "mi" ? "mi" : "km";
  } catch {
    return "km";
  }
}

export function saveUserDistanceUnit(userId, unit) {
  localStorage.setItem(userDistanceUnitKey(userId), unit === "mi" ? "mi" : "km");
}

export function isDevUser(userId = "") {
  return String(userId).startsWith("dev-");
}

export function userGoalsKey(userId) {
  return `primitive-programming:goals:${userId}`;
}

export function loadUserGoals(userId) {
  try {
    return JSON.parse(localStorage.getItem(userGoalsKey(userId)) || "[]");
  } catch {
    return [];
  }
}

export function saveUserGoals(userId, goals) {
  localStorage.setItem(userGoalsKey(userId), JSON.stringify(goals));
}

export function bodyMetricsKey(userId) {
  return `primitive-programming:body-metrics:${userId}`;
}

export function loadBodyMetrics(userId) {
  try {
    return JSON.parse(localStorage.getItem(bodyMetricsKey(userId)) || "[]");
  } catch {
    return [];
  }
}

export function saveBodyMetrics(userId, entries) {
  localStorage.setItem(bodyMetricsKey(userId), JSON.stringify(entries));
}

export function bodyMetricSettingsKey(userId) {
  return `primitive-programming:body-metric-settings:${userId}`;
}

export function loadBodyMetricSettings(userId) {
  try {
    return { ...defaultBodyMetricSettings, ...JSON.parse(localStorage.getItem(bodyMetricSettingsKey(userId)) || "{}") };
  } catch {
    return defaultBodyMetricSettings;
  }
}

export function saveBodyMetricSettings(userId, settings) {
  localStorage.setItem(bodyMetricSettingsKey(userId), JSON.stringify(settings));
}

export function menuButtonPreferencesKey() {
  return "primitive-programming:menu-button-preferences";
}

export function normalizeMenuButtonPreferences(preferences = {}) {
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

export function loadMenuButtonPreferences() {
  try {
    return normalizeMenuButtonPreferences(JSON.parse(localStorage.getItem(menuButtonPreferencesKey()) || "{}"));
  } catch {
    return normalizeMenuButtonPreferences();
  }
}

export function saveMenuButtonPreferences(preferences) {
  localStorage.setItem(menuButtonPreferencesKey(), JSON.stringify(normalizeMenuButtonPreferences(preferences)));
}

export function readAppRoute() {
  if (typeof window === "undefined") {
    return { view: "client", selectedDate: defaultSelectedDate, selectedWorkoutKey: "" };
  }
  const params = new URLSearchParams(window.location.search);
  const requestedView = params.get("view");
  const view = requestedView === "goals"
    ? "progress"
    : requestedView === "stored-programs"
    ? "programs"
    : routeViews.has(requestedView) ? requestedView : "client";
  return {
    view,
    selectedDate: params.get("date") || defaultSelectedDate,
    selectedWorkoutKey: params.get("workout") || "",
  };
}

export function appRouteUrl({ view, selectedDate, selectedWorkoutKey }) {
  const params = new URLSearchParams();
  if (view && view !== "client") params.set("view", view);
  if ((view === "workout-list" || view === "workout") && selectedDate) params.set("date", selectedDate);
  if (view === "workout" && selectedWorkoutKey) params.set("workout", selectedWorkoutKey);
  const query = params.toString();
  return `${window.location.pathname}${query ? `?${query}` : ""}${window.location.hash}`;
}

export function mergeUserProfile(user, profile = {}) {
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

export function imageFileToDataUrl(file) {
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

export function dataUrlToBlob(dataUrl) {
  const [header, payload] = dataUrl.split(",");
  const mimeType = header.match(/data:(.*?);base64/)?.[1] || "image/jpeg";
  const binary = atob(payload || "");
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return new Blob([bytes], { type: mimeType });
}

export function formatDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  }).format(new Date(`${date}T12:00:00`));
}

export function shiftDate(date, offset) {
  const nextDate = new Date(`${date}T12:00:00`);
  nextDate.setDate(nextDate.getDate() + offset);
  return nextDate.toISOString().slice(0, 10);
}

export function daysBetweenDates(startDate, endDate) {
  const start = new Date(`${startDate}T12:00:00`);
  const end = new Date(`${endDate}T12:00:00`);
  return Math.round((end - start) / 86400000);
}

export function groupByDate(items) {
  return items.reduce((map, item) => {
    map[item.date] = [...(map[item.date] || []), item];
    return map;
  }, {});
}

export function workoutGroupKey(item) {
  return [
    item.programId || "default",
    item.date,
    item.week || "",
    item.phase || "",
    item.focus || "Workout",
  ].join("|");
}

export function groupWorkouts(items) {
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

export function workoutExerciseCount(group, logs = {}) {
  const programmedCount = group.items.filter((item) => !item.scheduledPlaceholder).length;
  const loggedCustomCount = logs[workoutLogKey(group.date, group.key)]?.customExercises?.filter((exercise) => exercise.section !== "warmup").length || 0;
  return Math.max(programmedCount, loggedCustomCount);
}

export function dateRange(startDate, endDate) {
  const range = [];
  for (const day = new Date(startDate); day <= endDate; day.setDate(day.getDate() + 1)) {
    range.push(day.toISOString().slice(0, 10));
  }
  return range;
}

export function startOfWeekMonday(date) {
  const day = new Date(date);
  const offset = (day.getDay() + 6) % 7;
  day.setDate(day.getDate() - offset);
  return day;
}

export function isDateInSameWeek(date, weekDate) {
  return startOfWeekMonday(`${date}T12:00:00`).toISOString().slice(0, 10) === startOfWeekMonday(`${weekDate}T12:00:00`).toISOString().slice(0, 10);
}

export function endOfWeekSunday(date) {
  const day = new Date(date);
  const offset = (7 - day.getDay()) % 7;
  day.setDate(day.getDate() + offset);
  return day;
}

export function monthLabel(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function calendarSections(workoutDates, todayValue = new Date(), minimumMonthCount = 3) {
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

export function inferMaxKey(exercise, text = "") {
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

export function percentages(item) {
  const text = `${item.prescription} ${item.intensity}`.replace(/–/g, "-");
  const matches = [...text.matchAll(/(\d{2,3})(?:-(\d{2,3}))?%/g)];
  return matches.map((match) => ({
    low: Number(match[1]),
    high: Number(match[2] || match[1]),
  }));
}

export function highNumber(value) {
  const numbers = `${value}`.match(/\d+/g);
  return numbers ? Number(numbers[numbers.length - 1]) : 1;
}

export function setRows(item) {
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

export function prescribedPreview(item, maxes, weightUnit) {
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

export function programSlug(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `program-${Date.now()}`;
}

export function progressSummary(workouts, logs) {
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

export function programDayGroups(workouts, programId) {
  return groupWorkouts(
    workouts
      .filter((item) => (item.programId || "default") === programId && item.date)
      .sort((a, b) => a.date.localeCompare(b.date) || String(a.focus || "").localeCompare(String(b.focus || ""))),
  );
}

export function programWeekNumber(program, date) {
  if (!program.startDate) return 1;
  return Math.max(1, Math.floor(daysBetweenDates(program.startDate, date) / 7) + 1);
}

export function workoutDateMapKey(workout, index = 0) {
  return workout.id || `${workout.programId || "default"}:${workout.week || "week"}:${workout.day || "day"}:${workout.exercise || "exercise"}:${index}`;
}

export function buildWorkoutDatesForProgram(programWorkouts, startDate) {
  if (!startDate || !programWorkouts.length) return {};
  const sortedWorkouts = [...programWorkouts]
    .filter((workout) => workout.date)
    .sort((a, b) => `${a.date}`.localeCompare(`${b.date}`));
  const firstWorkoutDate = sortedWorkouts[0]?.date;
  if (!firstWorkoutDate) return {};
  const offset = daysBetweenDates(firstWorkoutDate, startDate);
  return Object.fromEntries(sortedWorkouts.map((workout, index) => [
    workoutDateMapKey(workout, index),
    shiftDate(workout.date, offset),
  ]));
}

export function applyActiveProgramDates(workouts, programs) {
  const programAccess = new Map(programs.map((program) => [program.id, program.activeProgram]));
  const mappedDates = new Map();
  Object.values(workouts.reduce((groups, workout) => {
    const programId = workout.programId || "default";
    groups[programId] = [...(groups[programId] || []), workout];
    return groups;
  }, {})).forEach((group) => {
    group
      .filter((workout) => workout.date)
      .sort((a, b) => `${a.date}`.localeCompare(`${b.date}`))
      .forEach((workout, index) => {
        const activeProgram = programAccess.get(workout.programId || "default");
        const mappedDate = activeProgram?.scheduled && activeProgram.workoutDates?.[workoutDateMapKey(workout, index)];
        if (mappedDate) mappedDates.set(workout.id, mappedDate);
      });
  });
  return workouts.map((workout) => {
    const mappedDate = mappedDates.get(workout.id);
    if (!mappedDate) return workout;
    return {
      ...workout,
      sourceDate: workout.sourceDate || workout.date,
      date: mappedDate,
      day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${mappedDate}T12:00:00`)),
    };
  });
}

export function completedFlexibleProgramDaysThisWeek(logs, programId, date) {
  return Object.entries(logs).filter(([key, log]) => {
    if (!log?.completed || log.programId !== programId || log.scheduleMode !== flexibleScheduleMode) return false;
    const logDate = logDateFromKey(log.date || key);
    return logDate && isDateInSameWeek(logDate, date);
  }).length;
}

export function flexibleProgramWorkoutGroups(date, programs, workouts, logs) {
  return programs
    .filter((program) => program.status === "active" && program.scheduleMode === flexibleScheduleMode)
    .flatMap((program) => {
      const week = programWeekNumber(program, date);
      const weekGroups = programDayGroups(workouts, program.id)
        .filter((group) => Number(group.week) === week);
      if (!weekGroups.length) return [];

      const dayIndex = completedFlexibleProgramDaysThisWeek(logs, program.id, date);
      const sourceGroup = weekGroups[dayIndex];
      if (!sourceGroup) return [];

      const dayNumber = dayIndex + 1;
      const title = `Day ${dayNumber} of ${program.name}`;
      return [{
        ...sourceGroup,
        key: [
          program.id,
          date,
          `flex-week-${week}`,
          `day-${dayNumber}`,
          sourceGroup.focus || "Workout",
        ].join("|"),
        date,
        title,
        phase: sourceGroup.phase || program.name,
        week,
        programId: program.id,
        flexibleProgramDay: dayNumber,
        items: sourceGroup.items.map((item) => ({
          ...item,
          date,
          day: new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(new Date(`${date}T12:00:00`)),
          sourceDate: item.sourceDate || item.date,
          scheduleMode: flexibleScheduleMode,
        })),
      }];
    });
}

export function logDateFromKey(key) {
  const match = String(key).match(/^\d{4}-\d{2}-\d{2}/);
  return match ? match[0] : "";
}

export function completedWorkoutDates(logs) {
  return Object.entries(logs)
    .filter(([, log]) => log?.completed)
    .map(([key, log]) => logDateFromKey(log.date || key))
    .filter(Boolean)
    .sort();
}

export function completedWorkoutsLast30Days(logs, todayValue = new Date()) {
  const today = new Date(todayValue);
  today.setHours(12, 0, 0, 0);
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - 29);

  return completedWorkoutDates(logs).filter((date) => {
    const completedDate = new Date(`${date}T12:00:00`);
    return completedDate >= startDate && completedDate <= today;
  }).length;
}

export function weeklyWorkoutStreak(logs) {
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

export function programTimelineSummary(workouts, logs) {
  const dates = [...new Set(workouts.map((item) => item.date))].sort();
  const summary = progressSummary(workouts, logs);
  return {
    ...summary,
    firstDate: dates[0] || "",
    lastDate: dates.at(-1) || "",
  };
}

export function numericMax(maxes, key) {
  const max = maxes[key];
  return Number(max?.value ?? max ?? 0) || 0;
}

export function goalProgress(goal, logs, maxes, weightUnit) {
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

export function bodyMetricUnit(field, weightUnit) {
  return field.unitType === "weight" ? weightUnit : field.unit;
}

export function metricLatest(entries, key) {
  return [...entries].reverse().find((entry) => entry[key]) || null;
}

export function metricGoalProgress(metricGoal, currentValue) {
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

export function metricTrendPoints(entries, key) {
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

export function formatShortDate(date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
  }).format(new Date(`${String(date).slice(0, 10)}T12:00:00`));
}

export function metricLineChart(entries, key, targetValue) {
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

export function needsMaxes(workout) {
  return [...new Set(workout.flatMap((item) => {
    const needs = percentages(item).length > 0 || /opener/i.test(`${item.prescription} ${item.intensity}`);
    const key = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
    return needs && key ? [key] : [];
  }))];
}
