import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Dumbbell, Minus, PencilLine, Plus, Save } from "lucide-react";
import { flexibleScheduleMode, maxFields, warmupPresets } from "../../app/config";
import { ExerciseAutocomplete, SimilarExerciseButtons } from "../../components/exercise/ExerciseAutocomplete";
import { saveUserWorkout } from "../../db";
import { AddCardioModalLayout, AddExerciseModalLayout, AddWarmupModalLayout, WarmupLayout, workoutTypeLayouts } from "./layouts";
import {formatDate, inferMaxKey, isWorkoutCompleted, loadUserDistanceUnit, loadUserMaxes, loadUserWeightUnit, needsMaxes, prescribedPreview, setPercentageLabel, setRows, workoutLogKey, workoutProgramId } from "../../utils/appHelpers";

export function WorkoutPage({ workout, workoutKey, date, user, workouts, setWorkouts, onDone, onSaveStatus, onSaveMaxes }) {
  const logKey = workoutLogKey(date, workoutKey);
  const existing = workouts[logKey] || {};
  const savedMaxes = loadUserMaxes(user.uid);
  const mergedMaxes = (sessionMaxes = {}) => ({ ...savedMaxes, ...(sessionMaxes || {}) });
  const isBlankWorkout = workout.length === 0;
  const [maxes, setMaxes] = useState(() => user.maxes || {});
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [showAddCardio, setShowAddCardio] = useState(false);
  const [newCardioName, setNewCardioName] = useState("");
  const [newCardioType, setNewCardioType] = useState("metcon");
  const [newCardioDetails, setNewCardioDetails] = useState({});
  const [showAddWarmup, setShowAddWarmup] = useState(false);
  const [newWarmupName, setNewWarmupName] = useState("");
  const [newWarmupTracksWeight, setNewWarmupTracksWeight] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [newExerciseTracksWeight, setNewExerciseTracksWeight] = useState(true);
  const [openExerciseMenu, setOpenExerciseMenu] = useState("");
  const [collapsedExercises, setCollapsedExercises] = useState({});
  const [started, setStarted] = useState(Boolean(existing.started));
  const [loads, setLoads] = useState(existing.loads || {});
  const [notes, setNotes] = useState(existing.notes || "");
  const [customExercises, setCustomExercises] = useState(existing.customExercises || []);
  const [warmupSetCounts, setWarmupSetCounts] = useState(existing.warmupSetCounts || {});
  const [programmedSetCounts, setProgrammedSetCounts] = useState(existing.programmedSetCounts || {});
  const [exerciseOverrides, setExerciseOverrides] = useState(existing.exerciseOverrides || {});
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const weightUnit = loadUserWeightUnit(user.uid);
  const distanceUnit = loadUserDistanceUnit(user.uid);
  const maxValue = (key) => maxes?.[key]?.value ?? maxes?.[key] ?? "";
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxValue(key)));
  const workoutTitle = workout[0]
    ? workout[0].workoutType && workout[0].workoutType !== "strength"
      ? workout[0].focus
      : `${workout[0].focus} - Week ${workout[0].week}`
    : workoutKey === "blank" ? "Create workout" : "Scheduled Workout";
  const isFutureWorkout = date > new Date().toISOString().slice(0, 10);
  const hasUnfinishedWorkout = !isFutureWorkout && existing.started && !isWorkoutCompleted(existing);
  const finishButtonLabel = "Save";
  const workoutType = workout[0]?.workoutType || "strength";
  const metricWorkoutTitle = workout[0]?.focus || workoutTitle;
  const isStrengthWorkout = workoutType === "strength";
  const workoutTypeLayout = workoutTypeLayouts[workoutType] || workoutTypeLayouts.strength;
  const cardioTypeOptions = [
    { value: "metcon", label: "Metcon" },
    { value: "hiit", label: "HIIT" },
    ...Object.values(workoutTypeLayouts)
      .filter((layout) => layout.type !== "strength")
      .map((layout) => ({ value: layout.type, label: layout.label })),
  ];

  const isMetricCardioType = (type) => Boolean(workoutTypeLayouts[type]?.fields?.length);
  const cardioTypeLabel = (type) => workoutTypeLayouts[type]?.label || cardioTypeOptions.find((option) => option.value === type)?.label || "Cardio";
  const cardioTextRows = (value = "") => Math.max(
    4,
    String(value || "").split("\n").reduce((rows, line) => rows + Math.max(1, Math.ceil(line.length / 44)), 0),
  );

  function workoutMeta() {
    return workout[0] ? {
      date,
      programId: workoutProgramId(workout[0]),
      programWeek: workout[0].week,
      workoutType: workout[0].workoutType,
      week: workout[0].week,
      sourceDate: workout[0].sourceDate || workout[0].date,
    } : { date };
  }

  function workoutDraftState(overrides = {}) {
    return {
      started,
      maxes,
      loads,
      notes,
      customExercises,
      warmupSetCounts,
      programmedSetCounts,
      exerciseOverrides,
      ...overrides,
    };
  }

  useEffect(() => {
    // console.log(maxes);
    const nextExisting = workouts[workoutLogKey(date, workoutKey)] || {};
    setMaxes(mergedMaxes(nextExisting.maxes));
    setStarted(Boolean(nextExisting.started));
    setLoads(nextExisting.loads || {});
    setNotes(nextExisting.notes || "");
    setCustomExercises(nextExisting.customExercises || []);
    setWarmupSetCounts(nextExisting.warmupSetCounts || {});
    setProgrammedSetCounts(nextExisting.programmedSetCounts || {});
    setExerciseOverrides(nextExisting.exerciseOverrides || {});
    setShowAddExercise(false);
    setShowAddCardio(false);
    setNewCardioName("");
    setNewCardioType("metcon");
    setNewCardioDetails({});
    setShowAddWarmup(false);
    setNewWarmupName("");
    setNewWarmupTracksWeight(false);
    setNewExerciseName("");
    setNewExerciseTracksWeight(true);
    setOpenExerciseMenu("");
    setCollapsedExercises({});
  }, [date, user.uid, workout.length, workoutKey]);

  useEffect(() => {
    if (!started && !existing.started) return;
    const draft = {
      ...existing,
      ...workoutMeta(),
      ...workoutDraftState(),
      status: isWorkoutCompleted(existing) ? "completed" : "in_progress",
      updatedAt: new Date().toISOString(),
    };
    setWorkouts((current) => {
      const currentWorkout = current[logKey] || {};
      const next = { ...currentWorkout, ...draft };
      if (JSON.stringify(currentWorkout) === JSON.stringify(next)) return current;
      return { ...current, [logKey]: next };
    });
  }, [
    customExercises,
    date,
    exerciseOverrides,
    loads,
    logKey,
    maxes,
    notes,
    programmedSetCounts,
    started,
    warmupSetCounts,
    workoutKey,
  ]);

  useEffect(() => {
    const nextSavedMaxes = loadUserMaxes(user.uid);
    let changed = false;
    requiredMaxes.forEach((key) => {
      const value = maxValue(key);
      if (!Number(value)) return;
      const previousValue = nextSavedMaxes[key]?.value ?? nextSavedMaxes[key] ?? "";
      if (String(previousValue) === String(value) && nextSavedMaxes[key]?.unit === weightUnit) return;
      nextSavedMaxes[key] = { value, unit: weightUnit };
      changed = true;
    });
    if (changed) {
      void onSaveMaxes(user.uid, nextSavedMaxes);
    }
  }, [date, maxes, requiredMaxes, user.uid, weightUnit, workoutKey]);

  async function persist(payload = {}, stateOverrides = {}, statusContext) {
    const payloadCompletesWorkout = payload.status === "completed";
    const payloadClearsCompletion = ["scheduled", "in_progress", "deleted", "moved"].includes(payload.status);
    const nextState = workoutDraftState(stateOverrides);
    const completed = payloadCompletesWorkout || (isWorkoutCompleted(existing) && !payloadClearsCompletion);
    const statusPayload = completed ? {
      completedAt: payload.completedAt || existing.completedAt || new Date().toISOString(),
      status: "completed",
    } : {
      completedAt: null,
      status: payload.status || "in_progress",
    };
    const next = { ...existing, ...workoutMeta(), ...nextState, ...payload, ...statusPayload, updatedAt: new Date().toISOString() };
    delete next.completed;
    setWorkouts((current) => {
      const currentWorkout = current[logKey];
      const shouldPreserveCompleted = isWorkoutCompleted(currentWorkout) && !payloadClearsCompletion;
      return {
        ...current,
        [logKey]: shouldPreserveCompleted ? {
          ...next,
          completedAt: currentWorkout.completedAt || next.completedAt || new Date().toISOString(),
          status: "completed",
        } : next,
      };
    });
    const result = await saveUserWorkout(user.uid, logKey, next);
    onSaveStatus?.(result, statusContext);
    return result;
  }

  async function finishWorkout(payload = {}) {
    await persist(payload, {}, { action: payload.status === "completed" ? "completed" : "saved" });
    onDone?.();
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
  }

  function addCardioExercise(event) {
    event.preventDefault();
    const name = newCardioName.trim() || cardioTypeLabel(newCardioType);
    if (!name) return;
    const nextExercises = [
      ...customExercises,
      customExercisePayload({ name, cardioType: newCardioType, cardioDetails: newCardioDetails, trackWeights: true, section: "cardio", reps: "Score" }),
    ];
    setCustomExercises(nextExercises);
    setNewCardioName("");
    setNewCardioType("metcon");
    setNewCardioDetails({});
    setShowAddCardio(false);
  }

  function customExercisePayload({ name, cardioType = "", cardioDetails = {}, trackWeights = true, section = "accessory", reps = "" }) {
    const createdAt = Date.now();
    return {
      id: `session-${createdAt}-${Math.random().toString(16).slice(2)}`,
      name,
      cardioType,
      cardioDetails,
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
  }

  function addWarmupPreset(preset) {
    const nextExercises = [
      ...customExercises,
      ...preset.exercises.map((name) => customExercisePayload({ name, trackWeights: false, section: "warmup", reps: "Prep" })),
    ];
    setCustomExercises(nextExercises);
    setShowAddWarmup(false);
  }

  function updateCustomExercise(exerciseId, updater) {
    const nextExercises = customExercises.map((exercise) => (
      exercise.id === exerciseId ? updater(exercise) : exercise
    ));
    setCustomExercises(nextExercises);
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
    if (exercise.section === "cardio" && !isMetricCardioType(exercise.cardioType)) {
      return Boolean(String(exercise.cardioDetails?.score || "").trim());
    }
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
  }

  function updateCustomCardioDetails(exercise, patch) {
    updateCustomExerciseField(exercise.id, {
      cardioDetails: {
        ...(exercise.cardioDetails || {}),
        ...patch,
      },
    });
  }

  function saveExerciseEdit() {
    setOpenExerciseMenu("");
  }

  function updateNewCardioDetails(patch) {
    setNewCardioDetails((current) => ({ ...current, ...patch }));
  }

  function renderCardioMetricFields(type, details, onChange, idPrefix) {
    const fields = workoutTypeLayouts[type]?.fields || [];
    return fields.map((field) => {
      const value = details[field.key] ?? field.defaultValue ?? "";
      if (field.options) {
        return (
          <label key={field.key}>
            {field.label}
            <select value={value} onChange={(event) => onChange({ [field.key]: event.target.value })}>
              <option value="">Select</option>
              {field.options.map((option) => (
                <option value={option.toLowerCase()} key={option}>{option}</option>
              ))}
            </select>
          </label>
        );
      }
      if (field.key === "distance") {
        return (
          <label key={field.key}>
            {field.label}
            <div className="typed-distance-control">
              <input value={details.distance || ""} onChange={(event) => onChange({ distance: event.target.value })} inputMode="decimal" placeholder={distanceUnit === "mi" ? "Miles" : "Kilometers"} />
              <select value={details.distanceUnit || distanceUnit} onChange={(event) => onChange({ distanceUnit: event.target.value })} aria-label={`${field.label} unit`}>
                <option value="mi">mi</option>
                <option value="km">km</option>
              </select>
            </div>
          </label>
        );
      }
      if (field.kind === "time") {
        return (
          <label key={field.key}>
            {field.label}
            <div className="typed-time-control">
              <input value={details[`${field.key}Min`] || ""} onChange={(event) => onChange({ [`${field.key}Min`]: event.target.value })} inputMode="numeric" placeholder="Min" aria-label={`${field.label} minutes`} />
              <input value={details[`${field.key}Sec`] || ""} onChange={(event) => onChange({ [`${field.key}Sec`]: event.target.value })} inputMode="numeric" placeholder="Sec" aria-label={`${field.label} seconds`} />
            </div>
          </label>
        );
      }
      return (
        <label key={field.key}>
          {field.label}
          <input id={`${idPrefix}-${field.key}`} value={value} onChange={(event) => onChange({ [field.key]: event.target.value })} />
        </label>
      );
    });
  }

  function renderWorkoutTypeCard(type, title, details, onChange, idPrefix) {
    const layout = workoutTypeLayouts[type] || workoutTypeLayout;
    const fields = layout.fields || [];
    const Icon = layout.icon || Dumbbell;
    const label = layout.label || cardioTypeLabel(type);

    return (
      <div className={`typed-workout-layout typed-workout-${type}`}>
        <div className="typed-workout-heading">
          <Icon size={24} />
          <div>
            <p className="eyebrow">{label}</p>
            <h3>{title}</h3>
          </div>
        </div>
        {fields.length ? (
          <div className="typed-workout-grid">
            {renderCardioMetricFields(type, details, onChange, idPrefix)}
          </div>
        ) : (
          <label className="notes-field">
            Session details
            <textarea value={details.workout || ""} onChange={(event) => onChange({ workout: event.target.value })} rows={3} />
          </label>
        )}
      </div>
    );
  }

  function metricDetailsForWorkout(type) {
    const fields = workoutTypeLayouts[type]?.fields || [];
    return fields.reduce((details, field) => {
      if (field.key === "distance") {
        details.distance = loads[`typed:${type}:distance`] || "";
        details.distanceUnit = loads[`typed:${type}:distanceUnit`] || distanceUnit;
      } else if (field.kind === "time") {
        details[`${field.key}Min`] = loads[`typed:${type}:${field.key}:min`] || "";
        details[`${field.key}Sec`] = loads[`typed:${type}:${field.key}:sec`] || "";
      } else {
        details[field.key] = loads[`typed:${type}:${field.key}`] || field.defaultValue || "";
      }
      return details;
    }, {});
  }

  function updateWorkoutTypeDetails(type, patch) {
    setLoads((current) => {
      const next = { ...current };
      Object.entries(patch).forEach(([key, value]) => {
        if (key === "distance") {
          next[`typed:${type}:distance`] = value;
        } else if (key === "distanceUnit") {
          next[`typed:${type}:distanceUnit`] = value;
        } else if (key.endsWith("Min")) {
          next[`typed:${type}:${key.slice(0, -3)}:min`] = value;
        } else if (key.endsWith("Sec")) {
          next[`typed:${type}:${key.slice(0, -3)}:sec`] = value;
        } else {
          next[`typed:${type}:${key}`] = value;
        }
      });
      return next;
    });
  }

  function removeCustomExercise(exerciseId) {
    const nextExercises = customExercises.filter((exercise) => exercise.id !== exerciseId);
    setCustomExercises(nextExercises);
    setOpenExerciseMenu("");
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

  function removeCustomSetOrExercise(exercise) {
    if (exercise.sets.length <= 1) {
      removeCustomExercise(exercise.id);
      return;
    }
    removeCustomSet(exercise.id);
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

  function programmedWeightPlaceholder(item, set) {
    const percentageLabel = setPercentageLabel(set.percentageRange);
    if (!percentageLabel || !set.percentageRange) {
      return set.target || prescribedPreview(item, maxes, weightUnit) || "Actual";
    }

    const maxKey = inferMaxKey(item.exercise, `${item.prescription} ${item.intensity}`);
    const max = Number(maxes?.[maxKey]?.value ?? maxes?.[maxKey]);
    if (!maxKey || !max) return percentageLabel;

    const low = Number(set.percentageRange.min);
    const high = Number(set.percentageRange.max || set.percentageRange.min);
    if (!Number.isFinite(low) || !Number.isFinite(high)) return percentageLabel;

    const unit = weightUnit || maxes?.[maxKey]?.unit || "";
    const lowWeight = Math.round((max * low) / 100);
    const highWeight = Math.round((max * high) / 100);
    const weightLabel = low === high ? `${lowWeight}${unit}` : `${lowWeight}-${highWeight}${unit}`;
    return `${percentageLabel} · ${weightLabel}`;
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
  }

  function addProgrammedSet(item) {
    const nextCounts = {
      ...programmedSetCounts,
      [item.id]: programmedRows(item).length + 1,
    };
    setProgrammedSetCounts(nextCounts);
  }

  function removeProgrammedSet(item) {
    const baseCount = setRows(item).length;
    const currentCount = programmedRows(item).length;
    if (currentCount <= baseCount) return;
    const nextCounts = { ...programmedSetCounts, [item.id]: currentCount - 1 };
    if (nextCounts[item.id] <= baseCount) delete nextCounts[item.id];
    setProgrammedSetCounts(nextCounts);
  }

  const warmups = customExercises.filter((exercise) => exercise.section === "warmup");
  const warmupLayoutProps = {
    addCustomSet,
    collapsedExercises,
    customSetSummary,
    exerciseCollapseId,
    exerciseMenuId,
    isCustomExerciseComplete,
    onToggleCollapse: toggleExerciseCollapse,
    onToggleMenu: (menuId) => setOpenExerciseMenu(openExerciseMenu === menuId ? "" : menuId),
    openExerciseMenu,
    removeCustomExercise,
    removeCustomSetOrExercise,
    saveExerciseEdit,
    updateCustomExerciseField,
    updateCustomSet,
    warmups,
  };

  const metricWarmups = <WarmupLayout {...warmupLayoutProps} typed />;

  return (
    <section className="workout-panel">
      {!started ? (
        <div className="start-panel">
          <div className="workout-title-row">
            <div>
              <p className="eyebrow">{formatDate(date)}</p>
              <h2>{workoutTitle}</h2>
            </div>
          </div>
          {missingMaxes.length > 0 && (
            <div className="max-grid">
              {missingMaxes.map((key) => {
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
            }}
          >
            <Dumbbell size={18} />
            {hasUnfinishedWorkout ? "Resume workout" : "Start workout"}
          </button>
        </div>
      ) : (
        <>
          <div className="workout-title-row">
            <div>
              <p className="eyebrow">{formatDate(date)}</p>
              <h2>{workoutTitle}</h2>
            </div>
            <div className="workout-title-actions">
              <button className="icon-button" type="button" onClick={() => finishWorkout({ status: "completed" })} aria-label="Mark complete" title="Mark complete">
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>
          <div className="workout-add-section-action">
            <button className="secondary" type="button" onClick={() => setShowAddWarmup(true)}>
              <Plus size={18} />
              Add warm-up
            </button>
          </div>
          {!isStrengthWorkout && (
            <>
              {renderWorkoutTypeCard(
                workoutType,
                metricWorkoutTitle,
                metricDetailsForWorkout(workoutType),
                (patch) => updateWorkoutTypeDetails(workoutType, patch),
                `workout-${workoutType}`,
              )}
              {metricWarmups}
              <label className="notes-field">
                Session notes
                <textarea value={notes} onChange={(event) => setNotes(event.target.value)} rows={3} />
              </label>
              <button className="secondary" type="button" onClick={() => finishWorkout({ status: "in_progress" })}>
                <Save size={18} />
                {finishButtonLabel}
              </button>
              <button className="primary" type="button" onClick={() => finishWorkout({ status: "completed" })}>
                <CheckCircle2 size={18} />
                Complete
              </button>
            </>
          )}
          {isStrengthWorkout && (
            <>
          <div className="exercise-table">
            <div className="table-head">
              <span>Exercise</span>
              <span>Sets</span>
            </div>
            <WarmupLayout {...warmupLayoutProps} />
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
                        placeholder={set.label}
                      />
                      <input
                        value={loads[set.key] || ""}
                        onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                        placeholder="Weight"
                      />
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
                        type="checkbox"
                      />
                    </label>
                  ))}
                  {programmedRows(item).map((set) => (
                    <label className={displayItem.trackWeights === false ? "set-row check-set-row" : "set-row tracked-set-row"} key={set.key}>
                      <input
                        value={loads[`${set.key}:reps`] ?? set.reps}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:reps`]: event.target.value })}
                        placeholder="Reps"
                      />
                      {displayItem.trackWeights !== false && (
                        <input
                          value={loads[set.key] ?? (set.key.endsWith(":1") ? loads[item.id] || "" : "")}
                          onChange={(event) => setLoads({ ...loads, [set.key]: event.target.value })}
                          placeholder={programmedWeightPlaceholder(displayItem, set)}
                        />
                      )}
                      <input
                        checked={Boolean(loads[`${set.key}:done`])}
                        onChange={(event) => setLoads({ ...loads, [`${set.key}:done`]: event.target.checked })}
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
                        <div className="exercise-edit-action-row">
                          <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                            Remove exercise
                          </button>
                          <button className="quiet-button" type="button" onClick={saveExerciseEdit}>
                            <Save size={16} />
                            Save
                          </button>
                        </div>
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
                        placeholder="Reps"
                      />
                      {exercise.trackWeights && (
                        <input
                          value={set.weight}
                          onChange={(event) => updateCustomSet(exercise.id, set.id, { weight: event.target.value })}
                          placeholder="Weight"
                        />
                      )}
                      <input
                        checked={set.done}
                        onChange={(event) => updateCustomSet(exercise.id, set.id, { done: event.target.checked })}
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
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSetOrExercise(exercise)}>
                        <Minus size={16} />
                        {exercise.sets.length <= 1 ? "Remove exercise" : "Remove set"}
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
                    <small>{cardioTypeLabel(exercise.cardioType)} | Track score</small>
                    <span className="collapsed-set-summary">{isMetricCardioType(exercise.cardioType) ? "Distance, duration, pace" : exercise.cardioDetails?.workout || "Workout details"}</span>
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
                        <label>
                          Type
                          <select
                            value={exercise.cardioType || "metcon"}
                            onChange={(event) => updateCustomExerciseField(exercise.id, { cardioType: event.target.value, cardioDetails: {} })}
                          >
                            {cardioTypeOptions.map((option) => (
                              <option value={option.value} key={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </label>
                        {!isMetricCardioType(exercise.cardioType) && (
                          <>
                            <SimilarExerciseButtons exerciseName={exercise.name} onSelect={(value) => updateCustomExerciseField(exercise.id, { name: value })} />
                            <label>
                              Workout
                              <textarea
                                value={exercise.cardioDetails?.workout || ""}
                                onChange={(event) => updateCustomCardioDetails(exercise, { workout: event.target.value })}
                                rows={cardioTextRows(exercise.cardioDetails?.workout)}
                                placeholder="Type the workout here"
                              />
                            </label>
                          </>
                        )}
                        <div className="exercise-edit-action-row">
                          <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                            Remove cardio
                          </button>
                          <button className="quiet-button" type="button" onClick={saveExerciseEdit}>
                            <Save size={16} />
                            Save
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {!collapsedExercises[exerciseCollapseId("custom", exercise.id)] && (
                  isMetricCardioType(exercise.cardioType) ? (
                    renderWorkoutTypeCard(
                      exercise.cardioType,
                      exercise.name,
                      exercise.cardioDetails || {},
                      (patch) => updateCustomCardioDetails(exercise, patch),
                      `cardio-${exercise.id}`,
                    )
                  ) : (
                    <div className="cardio-text-fields">
                      <div className="cardio-workout-display">
                        <span>Workout</span>
                        <p>{exercise.cardioDetails?.workout || "No workout details added."}</p>
                      </div>
                      <label>
                        Score
                        <input
                          value={exercise.cardioDetails?.score || ""}
                          onChange={(event) => updateCustomCardioDetails(exercise, { score: event.target.value })}
                          placeholder="Time, rounds, reps, distance..."
                        />
                      </label>
                    </div>
                  )
                )}
              </div>
            ))}
            
          </div>
          <div className="workout-bottom-actions">
            <button className="secondary workout-add-section-button" type="button" onClick={() => setShowAddCardio(true)}>
              <Plus size={18} />
              Add cardio
            </button>
            <div className="workout-save-actions">
              <button className="secondary" type="button" onClick={() => finishWorkout({ status: "in_progress" })}>
                <Save size={18} />
                {finishButtonLabel}
              </button>
              <button className="primary" type="button" onClick={() => finishWorkout({ status: "completed" })}>
                <CheckCircle2 size={18} />
                Complete
              </button>
            </div>
          </div>
          </>
          )}
          {showAddExercise && (
            <AddExerciseModalLayout
              newExerciseName={newExerciseName}
              newExerciseTracksWeight={newExerciseTracksWeight}
              onClose={() => setShowAddExercise(false)}
              onNameChange={setNewExerciseName}
              onSubmit={addCustomExercise}
              onTrackWeightsChange={setNewExerciseTracksWeight}
            />
          )}
          {showAddCardio && (
            <AddCardioModalLayout
              cardioTextRows={cardioTextRows}
              cardioTypeLabel={cardioTypeLabel}
              cardioTypeOptions={cardioTypeOptions}
              isMetricCardioType={isMetricCardioType}
              newCardioDetails={newCardioDetails}
              newCardioName={newCardioName}
              newCardioType={newCardioType}
              onClose={() => setShowAddCardio(false)}
              onDetailsChange={updateNewCardioDetails}
              onNameChange={setNewCardioName}
              onSubmit={addCardioExercise}
              onTypeChange={(type) => {
                setNewCardioType(type);
                setNewCardioDetails({});
              }}
              renderCardioMetricFields={renderCardioMetricFields}
            />
          )}
          {showAddWarmup && (
            <AddWarmupModalLayout
              newWarmupName={newWarmupName}
              newWarmupTracksWeight={newWarmupTracksWeight}
              onClose={() => setShowAddWarmup(false)}
              onNameChange={setNewWarmupName}
              onPresetSelect={addWarmupPreset}
              onSubmit={addWarmupExercise}
              onTrackWeightsChange={setNewWarmupTracksWeight}
              warmupPresets={warmupPresets}
            />
          )}
        </>
      )}
    </section>
  );
}

