import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, isDevUserId, localKey, withTimeout } from "../services/firebaseClient";

// Profile documents live under `users/{uid}/profile`.

function normalizeUserPreferences(preferences = {}) {
  return {
    weightUnit: preferences.weightUnit === "lb" ? "lb" : "kg",
    distanceUnit: preferences.distanceUnit === "mi" ? "mi" : "km",
  };
}

export async function loadUserProfile(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDoc(doc(db, "users", userId, "profile", "details")),
        "User profile request timed out.",
      );
      return snapshot.exists() ? snapshot.data() : {};
    } catch (error) {
      console.warn("Falling back to local user profile.", error);
    }
  }
  try {
    return JSON.parse(localStorage.getItem(localKey(`profile:${userId}`)) || "{}");
  } catch {
    return {};
  }
}

export async function saveUserProfile(userId, profile) {
  const payload = { ...profile, updatedAt: new Date().toISOString() };
  const localProfile = JSON.parse(localStorage.getItem(localKey(`profile:${userId}`)) || "{}");
  const nextLocalProfile = { ...localProfile, ...payload };
  localStorage.setItem(localKey(`profile:${userId}`), JSON.stringify(nextLocalProfile));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "profile", "details"), payload, { merge: true });
      return nextLocalProfile;
    } catch (error) {
      console.warn("Falling back to local user profile.", error);
    }
  }

  return nextLocalProfile;
}

export async function loadUserMaxes(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDoc(doc(db, "users", userId, "profile", "maxes")),
        "User maxes request timed out.",
      );
      if (snapshot.exists()) {
        const data = snapshot.data();
        return data.maxes || {};
      }
    } catch (error) {
      console.warn("Falling back to local user maxes.", error);
    }
  }
  try {
    return JSON.parse(localStorage.getItem(localKey(`maxes:${userId}`)) || "{}");
  } catch {
    return {};
  }
}

export async function saveUserMaxes(userId, maxes) {
  const payload = { maxes, updatedAt: new Date().toISOString() };
  localStorage.setItem(localKey(`maxes:${userId}`), JSON.stringify(maxes));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "profile", "maxes"), payload, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved user maxes locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

export async function loadUserPreferences(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDoc(doc(db, "users", userId, "profile", "preferences")),
        "User preferences request timed out.",
      );
      if (snapshot.exists()) {
        return normalizeUserPreferences(snapshot.data());
      }
    } catch (error) {
      console.warn("Falling back to local user preferences.", error);
    }
  }

  try {
    return normalizeUserPreferences(JSON.parse(localStorage.getItem(localKey(`preferences:${userId}`)) || "{}"));
  } catch {
    return normalizeUserPreferences();
  }
}

export async function saveUserPreferences(userId, preferences) {
  const normalizedPreferences = normalizeUserPreferences(preferences);
  const payload = { ...normalizedPreferences, updatedAt: new Date().toISOString() };
  localStorage.setItem(localKey(`preferences:${userId}`), JSON.stringify(normalizedPreferences));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "profile", "preferences"), payload, { merge: true });
      return { synced: true, preferences: normalizedPreferences };
    } catch (error) {
      console.warn("Saved user preferences locally; cloud sync failed.", error);
      return { synced: false, local: true, preferences: normalizedPreferences };
    }
  }

  return { synced: false, local: true, preferences: normalizedPreferences };
}
