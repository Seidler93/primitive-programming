import { collection, deleteDoc, doc, getDocs, setDoc } from "firebase/firestore";
import { db, isDevUserId, localKey, readJson, withTimeout } from "../services/firebaseClient";

// Workouts live at `users/{uid}/workouts/{workoutId}`.

function workoutRecordFromData(id, data = {}) {
  const status = data.status || (data.completed ? "completed" : "scheduled");
  return {
    ...data,
    id: data.id || id,
    status,
    completed: status === "completed" || data.completed === true,
  };
}

function workoutRecordPayload(payload = {}) {
  const completed = payload.completed === true || payload.status === "completed";
  return {
    ...payload,
    status: completed ? "completed" : payload.status || "scheduled",
    completed,
    completedAt: completed ? payload.completedAt || new Date().toISOString() : payload.completedAt || null,
    updatedAt: payload.updatedAt || new Date().toISOString(),
  };
}

function userWorkoutsLocalKey(userId) {
  return localKey(`workouts:${userId}`);
}

function pendingWorkoutSyncLocalKey(userId) {
  return localKey(`pending-workout-sync:${userId}`);
}

function loadLocalUserWorkouts(userId) {
  return readJson(localStorage.getItem(userWorkoutsLocalKey(userId)), {});
}

function saveLocalUserWorkouts(userId, workouts) {
  localStorage.setItem(userWorkoutsLocalKey(userId), JSON.stringify(workouts));
}

function loadPendingWorkoutSync(userId) {
  return readJson(localStorage.getItem(pendingWorkoutSyncLocalKey(userId)), {});
}

function savePendingWorkoutSync(userId, pendingWorkouts) {
  localStorage.setItem(pendingWorkoutSyncLocalKey(userId), JSON.stringify(pendingWorkouts));
}

function queuePendingWorkoutSync(userId, workoutId, payload) {
  const pendingWorkouts = loadPendingWorkoutSync(userId);
  pendingWorkouts[workoutId] = payload;
  savePendingWorkoutSync(userId, pendingWorkouts);
}

export async function loadUserWorkouts(userId) {
  let workouts = {};
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDocs(collection(db, "users", userId, "workouts")),
        "User workouts request timed out.",
      );
      workouts = Object.fromEntries(snapshot.docs.map((item) => [item.id, workoutRecordFromData(item.id, item.data())]));
    } catch (error) {
      console.warn("Falling back to local user workouts.", error);
    }
  }

  const localWorkouts = loadLocalUserWorkouts(userId);
  return { ...localWorkouts, ...workouts };
}

export async function saveUserWorkout(userId, workoutId, payload) {
  const workouts = loadLocalUserWorkouts(userId);
  const nextPayload = workoutRecordPayload({ ...(workouts[workoutId] || {}), ...payload });
  workouts[workoutId] = nextPayload;
  saveLocalUserWorkouts(userId, workouts);

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "workouts", workoutId), nextPayload, { merge: true });
      const pendingWorkouts = loadPendingWorkoutSync(userId);
      if (pendingWorkouts[workoutId]) {
        delete pendingWorkouts[workoutId];
        savePendingWorkoutSync(userId, pendingWorkouts);
      }
      return { synced: true };
    } catch (error) {
      console.warn("Saved user workout locally; cloud sync failed.", error);
      queuePendingWorkoutSync(userId, workoutId, nextPayload);
      return { synced: false, local: true, pendingSync: true };
    }
  }

  queuePendingWorkoutSync(userId, workoutId, nextPayload);
  return { synced: false, local: true, pendingSync: true };
}

export async function syncPendingUserWorkouts(userId) {
  if (!db || isDevUserId(userId)) return { synced: 0, remaining: Object.keys(loadPendingWorkoutSync(userId)).length };
  const pendingWorkouts = loadPendingWorkoutSync(userId);
  const remaining = { ...pendingWorkouts };
  let synced = 0;

  await Promise.all(Object.entries(pendingWorkouts).map(async ([workoutId, payload]) => {
    try {
      await setDoc(doc(db, "users", userId, "workouts", workoutId), payload, { merge: true });
      delete remaining[workoutId];
      synced += 1;
    } catch (error) {
      console.warn("Could not sync pending workout.", error);
    }
  }));

  savePendingWorkoutSync(userId, remaining);
  return { synced, remaining: Object.keys(remaining).length };
}

export async function deleteUserWorkout(userId, workoutId) {
  const workouts = await loadUserWorkouts(userId);
  delete workouts[workoutId];
  saveLocalUserWorkouts(userId, workouts);

  if (db && !isDevUserId(userId)) {
    try {
      await deleteDoc(doc(db, "users", userId, "workouts", workoutId));
      return { synced: true };
    } catch (error) {
      console.warn("Deleted user workout locally; cloud delete failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}
