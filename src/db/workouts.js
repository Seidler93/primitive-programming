import { collection, deleteDoc, doc, getDocs, orderBy, query, setDoc, where } from "firebase/firestore";
import { db, localKey, readJson, withTimeout } from "../services/firebaseClient";

// User workouts live in Firestore at `users/{uid}/workouts/{workoutId}`.
// The same workouts are also cached in localStorage so the app can keep working offline.

function workoutRecordFromData(id, data = {}) {
  // Turn a Firestore workout document into the shape the app expects.
  // If an older record only has `completed`, this also fills in a matching `status`.
  const status = data.status || (data.completed ? "completed" : data.started ? "in_progress" : "scheduled");
  const { completed, ...rest } = data;
  return {
    ...rest,
    id: data.id || id,
    status,
  };
}

function createWorkoutId() {
  // New workout documents should not use the date as their Firestore ID.
  // Prefer UUIDs when available, with a timestamp fallback for older browsers.
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function workoutRecordPayload(payload = {}, existingWorkoutId = "") {
  // Normalize a workout before saving it.
  // This keeps IDs, `status`, `completedAt`, and `updatedAt` consistent.
  const isCompleted = payload.completed === true || payload.status === "completed";
  const cleanPayload = { ...payload };
  delete cleanPayload[["lookup", "Key"].join("")];
  delete cleanPayload.completed;
  return {
    ...cleanPayload,
    id: existingWorkoutId || createWorkoutId(),
    status: isCompleted ? "completed" : payload.status || (payload.started ? "in_progress" : "scheduled"),
    completedAt: isCompleted ? payload.completedAt || new Date().toISOString() : payload.completedAt || null,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
}

function userWorkoutsLocalKey(userId) {
  // localStorage key for the user's cached workout map.
  return localKey(`workouts:${userId}`);
}

function pendingWorkoutSyncLocalKey(userId) {
  // localStorage key for workouts that saved locally but still need Firestore sync.
  return localKey(`pending-workout-sync:${userId}`);
}

function loadLocalUserWorkouts(userId) {
  // Read the local workout cache.
  // This returns one object keyed by workoutId, not separate localStorage rows.
  return readJson(localStorage.getItem(userWorkoutsLocalKey(userId)), {});
}

function saveLocalUserWorkouts(userId, workouts) {
  // Replace the local workout cache with the newest workout map.
  localStorage.setItem(userWorkoutsLocalKey(userId), JSON.stringify(workouts));
}

function loadPendingWorkoutSync(userId) {
  // Read workouts that still need to be retried against Firestore.
  return readJson(localStorage.getItem(pendingWorkoutSyncLocalKey(userId)), {});
}

function savePendingWorkoutSync(userId, pendingWorkouts) {
  // Save the retry queue after adding, removing, or syncing pending workouts.
  localStorage.setItem(pendingWorkoutSyncLocalKey(userId), JSON.stringify(pendingWorkouts));
}

function queuePendingWorkoutSync(userId, workoutId, payload) {
  // Add one workout to the retry queue.
  // This is used when Firestore is unavailable or rejects the save.
  const pendingWorkouts = loadPendingWorkoutSync(userId);
  pendingWorkouts[workoutId] = payload;
  savePendingWorkoutSync(userId, pendingWorkouts);
}

function workoutFallsInRange(workout, dateRange = {}) {
  if (!dateRange.startDate && !dateRange.endDate) return true;
  const workoutDate = String(workout?.date || "").slice(0, 10);
  if (!workoutDate) return false;
  if (dateRange.startDate && workoutDate < dateRange.startDate) return false;
  if (dateRange.endDate && workoutDate > dateRange.endDate) return false;
  return true;
}

function userWorkoutsQuery(userId, dateRange = {}) {
  const userWorkouts = collection(db, "users", userId, "workouts");
  if (!dateRange.startDate && !dateRange.endDate) return userWorkouts;
  const constraints = [];
  if (dateRange.startDate) constraints.push(where("date", ">=", dateRange.startDate));
  if (dateRange.endDate) constraints.push(where("date", "<=", dateRange.endDate));
  constraints.push(orderBy("date"));
  return query(userWorkouts, ...constraints);
}

export async function loadUserWorkouts(userId, dateRange = {}) {
  // Load workouts from Firestore when available, then merge them with local cached workouts.
  // Firestore wins on key conflicts because it is spread after localStorage in the return value.
  let workouts = {};
  if (db) {
    try {
      const snapshot = await withTimeout(
        getDocs(userWorkoutsQuery(userId, dateRange)),
        "User workouts request timed out.",
      );
      workouts = Object.fromEntries(snapshot.docs.map((item) => {
        const workout = workoutRecordFromData(item.id, item.data());
        return [workout.date || item.id, workout];
      }));
    } catch (error) {
      console.warn("Falling back to local user workouts.", error);
    }
  }

  // Keep local-only workouts visible too, such as workouts saved while offline.
  const localWorkouts = Object.fromEntries(
    Object.entries(loadLocalUserWorkouts(userId)).filter(([, workout]) => workoutFallsInRange(workout, dateRange)),
  );
  return { ...localWorkouts, ...workouts };
}

export async function saveUserWorkout(userId, workoutId, payload) {
  // First save/update this workout in localStorage so the UI has an immediate offline copy.
  const workouts = loadLocalUserWorkouts(userId);
  // Merge with the existing local workout, then normalize the record before saving.
  const existingWorkout = workouts[workoutId] || {};
  const nextPayload = workoutRecordPayload({ ...existingWorkout, ...payload }, existingWorkout.id);
  const firestoreWorkoutId = nextPayload.id;
  workouts[workoutId] = nextPayload;
  saveLocalUserWorkouts(userId, workouts);

  if (db) {
    try {
      // Upsert only this one workout document in Firestore.
      // This does not delete or replace the user's whole workouts collection.
      await setDoc(doc(db, "users", userId, "workouts", firestoreWorkoutId), nextPayload, { merge: true });
      // If this workout was waiting to sync, remove it from the retry queue.
      const pendingWorkouts = loadPendingWorkoutSync(userId);
      if (pendingWorkouts[workoutId]) {
        delete pendingWorkouts[workoutId];
        savePendingWorkoutSync(userId, pendingWorkouts);
      }
      return { synced: true };
    } catch (error) {
      // Keep the local save and retry this exact workout later.
      console.warn("Saved user workout locally; cloud sync failed.", error);
      queuePendingWorkoutSync(userId, workoutId, nextPayload);
      return { synced: false, local: true, pendingSync: true };
    }
  }

  // If Firebase is not configured/available, keep the local save and queue a retry.
  queuePendingWorkoutSync(userId, workoutId, nextPayload);
  return { synced: false, local: true, pendingSync: true };
}

export async function syncPendingUserWorkouts(userId) {
  // Retry any workouts that previously saved locally but failed to sync to Firestore.
  if (!db) return { synced: 0, remaining: Object.keys(loadPendingWorkoutSync(userId)).length };
  const pendingWorkouts = loadPendingWorkoutSync(userId);
  const remaining = { ...pendingWorkouts };
  let synced = 0;

  await Promise.all(Object.entries(pendingWorkouts).map(async ([workoutId, payload]) => {
    try {
      // Each pending workout is written as its own document.
      const nextPayload = workoutRecordPayload(payload, payload.id);
      await setDoc(doc(db, "users", userId, "workouts", nextPayload.id), nextPayload, { merge: true });
      delete remaining[workoutId];
      synced += 1;
    } catch (error) {
      console.warn("Could not sync pending workout.", error);
    }
  }));

  // Keep only the workouts that still failed, so the next retry does less work.
  savePendingWorkoutSync(userId, remaining);
  return { synced, remaining: Object.keys(remaining).length };
}

export async function deleteUserWorkout(userId, workoutId) {
  // Remove the workout from the local cache first.
  const workouts = await loadUserWorkouts(userId);
  const firestoreWorkoutId = workouts[workoutId]?.id || workoutId;
  delete workouts[workoutId];
  saveLocalUserWorkouts(userId, workouts);

  if (db) {
    try {
      // Delete only this one workout document from Firestore.
      await deleteDoc(doc(db, "users", userId, "workouts", firestoreWorkoutId));
      return { synced: true };
    } catch (error) {
      // The workout is gone locally, but cloud delete did not complete.
      console.warn("Deleted user workout locally; cloud delete failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

