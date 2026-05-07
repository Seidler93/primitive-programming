import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;

const localKey = (key) => `primitive-programming:${key}`;
const isDevUserId = (userId = "") => userId.startsWith("dev-");
const readTimeoutMs = 3500;

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), readTimeoutMs);
    }),
  ]);
}

function devUser(role) {
  return {
    uid: `dev-${role}`,
    email: `dev-${role}@primitive.local`,
    displayName: role === "coach" ? "Dev Coach" : "Dev Athlete",
  };
}

export function observeAuth(callback) {
  const storedDevUser = JSON.parse(localStorage.getItem(localKey("devUser")) || "null");
  if (storedDevUser) {
    callback(storedDevUser);
    return () => {};
  }
  if (auth) return onAuthStateChanged(auth, callback);
  const stored = JSON.parse(localStorage.getItem(localKey("demoUser")) || "null");
  callback(stored);
  return () => {};
}

export async function loginDev(role) {
  const user = devUser(role);
  localStorage.setItem(localKey("devUser"), JSON.stringify(user));
  return user;
}

export async function login(email, password, mode = "login") {
  if (auth) {
    const fn = mode === "signup" ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
    const result = await fn(auth, email, password);
    return result.user;
  }
  const user = { uid: email.toLowerCase(), email };
  localStorage.setItem(localKey("demoUser"), JSON.stringify(user));
  return user;
}

export async function logout() {
  localStorage.removeItem(localKey("devUser"));
  if (auth) return signOut(auth);
  localStorage.removeItem(localKey("demoUser"));
}

export async function loadWorkoutLogs(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDocs(collection(db, "users", userId, "logs")),
        "Workout logs request timed out.",
      );
      return Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()]));
    } catch (error) {
      console.warn("Falling back to local workout logs.", error);
    }
  }
  return JSON.parse(localStorage.getItem(localKey(`logs:${userId}`)) || "{}");
}

export async function saveWorkoutLog(userId, date, payload) {
  if (db && !isDevUserId(userId)) return setDoc(doc(db, "users", userId, "logs", date), payload, { merge: true });
  const logs = await loadWorkoutLogs(userId);
  logs[date] = { ...(logs[date] || {}), ...payload };
  localStorage.setItem(localKey(`logs:${userId}`), JSON.stringify(logs));
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
  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "profile", "details"), payload, { merge: true });
      return payload;
    } catch (error) {
      console.warn("Falling back to local user profile.", error);
    }
  }
  localStorage.setItem(localKey(`profile:${userId}`), JSON.stringify(payload));
  return payload;
}

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

export async function isTrainerUser(user) {
  if (user?.uid === "dev-coach") return true;
  if (user?.uid === "dev-athlete") return false;
  if (!hasFirebaseConfig) return true;
  const configuredEmail = import.meta.env.VITE_TRAINER_EMAIL;
  if (configuredEmail && user?.email?.toLowerCase() === configuredEmail.toLowerCase()) return true;
  if (!db || !user?.uid) return false;
  try {
    const trainerDoc = await withTimeout(getDoc(doc(db, "trainers", user.uid)), "Trainer lookup timed out.");
    return trainerDoc.exists();
  } catch (error) {
    console.warn("Falling back to athlete role.", error);
    return false;
  }
}
