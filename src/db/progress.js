import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, localKey, withTimeout } from "../services/firebaseClient";

// Goal/progress preferences live on the root user document.

function normalizeProgress(progress = {}) {
  return {
    maxes: Array.isArray(progress?.maxes) ? progress.maxes : [],
    bodyMetrics: Array.isArray(progress?.bodyMetrics) ? progress.bodyMetrics : [],
  };
}

export async function loadUserProgress(userId) {
  if (db) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "users", userId)), "User progress request timed out.");
      if (snapshot.exists()) {
        return normalizeProgress(snapshot.data().progress);
      }
    } catch (error) {
      console.warn("Falling back to local user progress.", error);
    }
  }
  try {
    return normalizeProgress(JSON.parse(localStorage.getItem(localKey(`progress:${userId}`)) || "{}"));
  } catch {
    return normalizeProgress();
  }
}

export async function saveUserProgress(userId, progress) {
  const normalizedProgress = normalizeProgress(progress);
  localStorage.setItem(localKey(`progress:${userId}`), JSON.stringify(normalizedProgress));

  if (db) {
    try {
      await setDoc(doc(db, "users", userId), {
        progress: normalizedProgress,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved user progress locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

