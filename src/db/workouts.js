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

  const localWorkouts = readJson(localStorage.getItem(localKey(`workouts:${userId}`)), {});
  return { ...localWorkouts, ...workouts };
}

export async function saveUserWorkout(userId, workoutId, payload) {
  const workouts = await loadUserWorkouts(userId);
  const nextPayload = workoutRecordPayload({ ...(workouts[workoutId] || {}), ...payload });
  workouts[workoutId] = nextPayload;
  localStorage.setItem(localKey(`workouts:${userId}`), JSON.stringify(workouts));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "workouts", workoutId), nextPayload, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved user workout locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

export async function deleteUserWorkout(userId, workoutId) {
  const workouts = await loadUserWorkouts(userId);
  delete workouts[workoutId];
  localStorage.setItem(localKey(`workouts:${userId}`), JSON.stringify(workouts));

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
