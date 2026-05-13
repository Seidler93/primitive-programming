import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Dumbbell, Minus, PencilLine, Plus, Save } from "lucide-react";
import { flexibleScheduleMode, maxFields, warmupPresets } from "../../app/config";
import { ExerciseAutocomplete, SimilarExerciseButtons } from "../../components/exercise/ExerciseAutocomplete";
import { saveUserWorkout } from "../../services/firebase";
import { metricWorkoutPages } from "./layouts";
import {
  formatDate,
  loadUserDistanceUnit,
  loadUserMaxes,
  loadUserWeightUnit,
  loadWorkoutDraft,
  needsMaxes,
  prescribedPreview,
  saveWorkoutDraft,
  setRows,
  workoutLogKey,
} from "../../utils/appHelpers";

export function WorkoutPage({ workout, workoutKey, date, user, logs, setLogs, onDone, onSaveStatus, onSaveMaxes }) {
  const logKey = workoutLogKey(date, workoutKey);
  const existing = logs[logKey] || {};
  const initialDraft = loadWorkoutDraft(user.uid, date, workoutKey);
  const savedMaxes = loadUserMaxes(user.uid);
  const mergedMaxes = (sessionMaxes = {}) => ({ ...savedMaxes, ...(sessionMaxes || {}) });
  const [hydratedDraftFor, setHydratedDraftFor] = useState(`${user.uid}:${date}:${workoutKey}`);
  const isBlankWorkout = workout.length === 0;
  const [started, setStarted] = useState(initialDraft.started || isBlankWorkout);
  const [maxes, setMaxes] = useState(mergedMaxes(initialDraft.maxes || existing.maxes));
  const [loads, setLoads] = useState(initialDraft.loads || existing.loads || {});
  const [notes, setNotes] = useState(initialDraft.notes ?? existing.notes ?? "");
  const [warmupSetCounts, setWarmupSetCounts] = useState(initialDraft.warmupSetCounts || existing.warmupSetCounts || {});
  const [programmedSetCounts, setProgrammedSetCounts] = useState(initialDraft.programmedSetCounts || existing.programmedSetCounts || {});
  const [exerciseOverrides, setExerciseOverrides] = useState(initialDraft.exerciseOverrides || existing.exerciseOverrides || {});
  const [customExercises, setCustomExercises] = useState(initialDraft.customExercises || existing.customExercises || []);
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
  const requiredMaxes = useMemo(() => needsMaxes(workout), [workout]);
  const weightUnit = loadUserWeightUnit(user.uid);
  const distanceUnit = loadUserDistanceUnit(user.uid);
  const maxValue = (key) => maxes[key]?.value ?? maxes[key] ?? "";
  const missingMaxes = requiredMaxes.filter((key) => !Number(maxValue(key)));
  const workoutPhase = workout[0]?.phase || "Custom workout";
  const workoutTitle = workout[0]
    ? workout[0].workoutType && workout[0].workoutType !== "strength"
      ? workout[0].focus
      : `${workout[0].focus} - Week ${workout[0].week}`
    : workoutKey === "blank" ? "Create workout" : "Scheduled Workout";
  const isFutureWorkout = date > new Date().toISOString().slice(0, 10);
  const finishButtonLabel = "Save workout";
  const workoutType = workout[0]?.workoutType || "strength";
  const MetricWorkoutPage = metricWorkoutPages[workoutType] || null;
  const metricWorkoutTitle = workout[0]?.focus || workoutTitle;
  const cardioTypeOptions = [
    { value: "metcon", label: "Metcon" },
    { value: "hiit", label: "HIIT" },
    { value: "running", label: "Running" },
    { value: "swimming", label: "Swimming" },
    { value: "biking", label: "Biking" },
    { value: "rowing", label: "Rowing" },
    { value: "walking", label: "Walking" },
    { value: "sport", label: "Sport" },
  ];
  const cardioMetricLayouts = {
    running: [
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration", kind: "time" },
      { key: "pace", label: "Pace", kind: "time" },
      { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
    ],
    swimming: [
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration", kind: "time" },
      { key: "pace", label: "Pace", kind: "time" },
      { key: "location", label: "Location", options: ["Pool", "Open water"] },
    ],
    biking: [
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration", kind: "time" },
      { key: "pace", label: "Pace", kind: "time" },
      { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Stationary"], defaultValue: "pavement" },
    ],
    rowing: [
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration", kind: "time" },
      { key: "pace", label: "Pace", kind: "time" },
    ],
    walking: [
      { key: "distance", label: "Distance" },
      { key: "duration", label: "Duration", kind: "time" },
      { key: "pace", label: "Pace", kind: "time" },
      { key: "surface", label: "Surface", options: ["Pavement", "Trail", "Treadmill"], defaultValue: "pavement" },
    ],
  };
  const isMetricCardioType = (type) => Boolean(cardioMetricLayouts[type]);
  const cardioTypeLabel = (type) => cardioTypeOptions.find((option) => option.value === type)?.label || "Cardio";
  const cardioTextRows = (value = "") => Math.max(
    4,
    String(value || "").split("\n").reduce((rows, line) => rows + Math.max(1, Math.ceil(line.length / 44)), 0),
  );

  useEffect(() => {
    const draft = loadWorkoutDraft(user.uid, date, workoutKey);
    setStarted(draft.started || workout.length === 0);
    const nextSavedMaxes = loadUserMaxes(user.uid);
    setMaxes({ ...nextSavedMaxes, ...(draft.maxes || existing.maxes || {}) });
    setLoads(draft.loads || existing.loads || {});
    setNotes(draft.notes ?? existing.notes ?? "");
    setWarmupSetCounts(draft.warmupSetCounts || existing.warmupSetCounts || {});
    setProgrammedSetCounts(draft.programmedSetCounts || existing.programmedSetCounts || {});
    setExerciseOverrides(draft.exerciseOverrides || existing.exerciseOverrides || {});
    setCustomExercises(draft.customExercises || existing.customExercises || []);
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
    setHydratedDraftFor(`${user.uid}:${date}:${workoutKey}`);
  }, [date, user.uid, workout.length, workoutKey]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}:${workoutKey}`) return;
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises });
  }, [customExercises, date, exerciseOverrides, hydratedDraftFor, loads, maxes, notes, programmedSetCounts, started, user.uid, warmupSetCounts, workoutKey]);

  useEffect(() => {
    if (hydratedDraftFor !== `${user.uid}:${date}:${workoutKey}` || !requiredMaxes.length) return;
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
  }, [date, hydratedDraftFor, maxes, requiredMaxes, user.uid, weightUnit, workoutKey]);

  async function persist(payload = {}, stateOverrides = {}) {
    const workoutMeta = workout[0] ? {
      date,
      programId: workout[0].programId || "default",
      programWeek: workout[0].week,
      workoutFocus: workout[0].focus,
      sourceDate: workout[0].sourceDate || workout[0].date,
      scheduleMode: workout[0].scheduleMode,
    } : { date };
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
    const next = { ...existing, ...workoutMeta, ...nextState, ...payload, updatedAt: new Date().toISOString() };
    setLogs({ ...logs, [logKey]: next });
    const result = await saveUserWorkout(user.uid, logKey, next);
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
    saveWorkoutDraft(user.uid, date, workoutKey, { started, maxes, loads, notes, warmupSetCounts, programmedSetCounts, exerciseOverrides, customExercises: nextExercises });
    void persist({}, { customExercises: nextExercises });
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
    void persist();
  }

  function updateNewCardioDetails(patch) {
    setNewCardioDetails((current) => ({ ...current, ...patch }));
  }

  function renderCardioMetricFields(type, details, onChange, idPrefix) {
    const fields = cardioMetricLayouts[type] || [];
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

  const metricWarmups = (
    <>
      {customExercises.filter((exercise) => exercise.section === "warmup").map((exercise) => (
        <div className={`exercise-row custom-exercise-row warmup-exercise-row typed-warmup-row ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] ? "collapsed" : ""} ${collapsedExercises[exerciseCollapseId("custom", exercise.id)] && isCustomExerciseComplete(exercise) ? "exercise-complete" : ""}`} key={exercise.id}>
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
              }} aria-label={`Edit ${exercise.name}`} title="Edit warm-up">
                <PencilLine size={16} />
              </button>
              {openExerciseMenu === exerciseMenuId("custom", exercise.id) && (
                <div className="exercise-edit-menu">
                  <div className="exercise-edit-menu-header">
                    <strong>Change warm-up</strong>
                    <span>Replaces this warm-up for this session.</span>
                  </div>
                  <label>
                    New warm-up
                    <ExerciseAutocomplete value={exercise.name} onChange={(value) => updateCustomExerciseField(exercise.id, { name: value })} id={`typed-warmup-edit-${exercise.id}`} placeholder="Mobility, drills, easy prep" />
                  </label>
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
                      Remove warm-up
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
                  onBlur={() => persist()}
                  placeholder="Prep"
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
                <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSetOrExercise(exercise)}>
                  <Minus size={16} />
                  {exercise.sets.length <= 1 ? "Remove warm-up" : "Remove set"}
                </button>
              </div>
            </div>
          </div>}
        </div>
      ))}
    </>
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
              <button className="icon-button" type="button" onClick={() => finishWorkout({ completed: true })} aria-label="Mark complete" title="Mark complete">
                <CheckCircle2 size={20} />
              </button>
            </div>
          </div>
          {MetricWorkoutPage ? (
            <MetricWorkoutPage
              finishButtonLabel={finishButtonLabel}
              distanceUnit={distanceUnit}
              isFutureWorkout={isFutureWorkout}
              loads={loads}
              notes={notes}
              onAddWarmup={() => setShowAddWarmup(true)}
              onCompleteWorkout={finishWorkout}
              onFinishWorkout={finishWorkout}
              onPersist={persist}
              setLoads={setLoads}
              setNotes={setNotes}
              title={metricWorkoutTitle}
              warmups={metricWarmups}
            />
          ) : (
            <>
          <button className="secondary" type="button" onClick={() => setShowAddWarmup(true)}>
            <Plus size={18} />
            Add warm-up
          </button>
          <div className="exercise-table">
            <div className="table-head">
              <span>Exercise</span>
              <span>Sets</span>
            </div>
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
                        <div className="exercise-edit-action-row">
                          <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomExercise(exercise.id)}>
                            Remove warm-up
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
                      <button className="quiet-button danger-text-button" type="button" onClick={() => removeCustomSetOrExercise(exercise)}>
                        <Minus size={16} />
                        {exercise.sets.length <= 1 ? "Remove warm-up" : "Remove set"}
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
                    <div className="cardio-metric-fields">
                      {renderCardioMetricFields(exercise.cardioType, exercise.cardioDetails || {}, (patch) => updateCustomCardioDetails(exercise, patch), `cardio-${exercise.id}`)}
                    </div>
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
                          onBlur={() => persist()}
                          placeholder="Time, rounds, reps, distance..."
                        />
                      </label>
                    </div>
                  )
                )}
              </div>
            ))}
            
          </div>
          <button className="secondary" type="button" onClick={() => setShowAddCardio(true)}>
            <Plus size={18} />
            Add cardio
          </button>
          <label className="notes-field">
            Session notes
            <textarea value={notes} onChange={(event) => setNotes(event.target.value)} onBlur={() => persist()} rows={3} />
          </label>
          <button className="secondary" type="button" onClick={() => finishWorkout({})}>
            <Save size={18} />
            {finishButtonLabel}
          </button>
          <button className="primary" type="button" onClick={() => finishWorkout({ completed: true })}>
            <CheckCircle2 size={18} />
            Complete workout
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
                    Type
                    <select value={newCardioType} onChange={(event) => {
                      setNewCardioType(event.target.value);
                      setNewCardioDetails({});
                    }}>
                      {cardioTypeOptions.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Title
                    <input value={newCardioName} onChange={(event) => setNewCardioName(event.target.value)} id="new-cardio-name" placeholder={cardioTypeLabel(newCardioType)} />
                  </label>
                  {isMetricCardioType(newCardioType) ? (
                    <div className="cardio-metric-fields">
                      {renderCardioMetricFields(newCardioType, newCardioDetails, updateNewCardioDetails, "new-cardio")}
                    </div>
                  ) : (
                    <>
                      <label>
                        Workout
                        <textarea
                          value={newCardioDetails.workout || ""}
                          onChange={(event) => updateNewCardioDetails({ workout: event.target.value })}
                          rows={cardioTextRows(newCardioDetails.workout)}
                          placeholder="Type the workout here"
                        />
                      </label>
                    </>
                  )}
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
        </>
      )}
    </section>
  );
}
