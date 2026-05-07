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
      const snapshot = await getDocs(collection(db, "users", userId, "logs"));
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

export async function loadCustomWorkouts(programId = "default") {
  if (db) {
    try {
      const q = query(collection(db, "programs", programId, "workouts"), orderBy("date"));
      const snapshot = await getDocs(q);
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
  const trainerDoc = await getDoc(doc(db, "trainers", user.uid));
  return trainerDoc.exists();
}
