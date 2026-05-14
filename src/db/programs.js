import { collection, doc, getDocs, orderBy, query, setDoc } from "firebase/firestore";
import { db, flexibleProgramScheduleMode, localKey, withTimeout } from "../services/firebaseClient";
import { loadUserActivePrograms, saveUserActiveProgram } from "./activePrograms";
import { grantUserProgramAccess, loadUserProgramIds } from "./users";

// Program documents live in `programs`; workout templates live under `programs/{programId}/workouts`.

export async function loadPrograms() {
  if (db) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db, "programs")), "Programs request timed out.");
      return snapshot.docs
        .map((item) => ({ id: item.id, ...item.data() }))
        .filter((item) => item.name);
    } catch (error) {
      console.warn("Falling back to local programs.", error);
    }
  }
  return JSON.parse(localStorage.getItem(localKey("programs")) || "[]");
}

export async function loadProgramsForUser(user) {
  const programs = await loadPrograms();
  if (!user?.uid) return [];
  const [programIdList, activeProgramList] = await Promise.all([
    loadUserProgramIds(user.uid),
    loadUserActivePrograms(user.uid),
  ]);
  const programIds = new Set(programIdList);
  const activePrograms = new Map(activeProgramList.map((program) => [program.id, program]));
  const userEmail = user.email?.toLowerCase() || "";
  const accessiblePrograms = programs.filter((program) => {
    const athleteEmail = program.athleteEmail?.toLowerCase() || "";
    return programIds.has(program.id) || (userEmail && athleteEmail === userEmail);
  });
  const backfillProgramIds = accessiblePrograms
    .map((program) => program.id)
    .filter((programId) => !programIds.has(programId));
  await Promise.all(backfillProgramIds.map((programId) => grantUserProgramAccess(user.uid, programId)));

  const activeBackfills = accessiblePrograms
    .filter((program) => program.status === "active" && !activePrograms.has(program.id))
    .map((program) => ({
      id: program.id,
      startDate: program.startDate || "",
      scheduled: program.scheduleMode !== flexibleProgramScheduleMode,
      currentWeek: 1,
      nextWorkoutIndex: 0,
    }));
  await Promise.all(activeBackfills.map((program) => saveUserActiveProgram(user.uid, program)));
  activeBackfills.forEach((program) => activePrograms.set(program.id, program));

  return accessiblePrograms.map((program) => {
    const activeProgram = activePrograms.get(program.id);
    if (!activeProgram) return program;
    return {
      ...program,
      activeProgram,
      status: "active",
      startDate: activeProgram.startDate || program.startDate,
      scheduleMode: activeProgram.scheduled ? "fixed" : flexibleProgramScheduleMode,
    };
  });
}

export async function saveProgram(program) {
  const id = program.id || program.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || `program-${Date.now()}`;
  const payload = { ...program, id };
  if (db) {
    try {
      await setDoc(doc(db, "programs", id), payload, { merge: true });
      return payload;
    } catch (error) {
      console.warn("Falling back to local programs.", error);
    }
  }
  const programs = await loadPrograms();
  const next = [...programs.filter((item) => item.id !== id), payload];
  localStorage.setItem(localKey("programs"), JSON.stringify(next));
  return payload;
}

export async function loadCustomWorkouts(programId = "default") {
  if (db) {
    try {
      const q = query(collection(db, "programs", programId, "workouts"), orderBy("date"));
      const snapshot = await withTimeout(getDocs(q), "Custom workouts request timed out.");
      return snapshot.docs.map((item) => ({ id: item.id, ...item.data() }));
    } catch (error) {
      console.warn("Falling back to local custom workouts.", error);
    }
  }
  return JSON.parse(localStorage.getItem(localKey(`custom:${programId}`)) || "[]");
}

export async function saveCustomWorkout(programId, workout) {
  const id = workout.id || `${workout.date}-${Date.now()}`;
  if (db) {
    try {
      return await setDoc(doc(db, "programs", programId, "workouts", id), { ...workout, id });
    } catch (error) {
      console.warn("Falling back to local custom workouts.", error);
    }
  }
  const workouts = await loadCustomWorkouts(programId);
  const next = [...workouts.filter((item) => item.id !== id), { ...workout, id }];
  localStorage.setItem(localKey(`custom:${programId}`), JSON.stringify(next));
}
