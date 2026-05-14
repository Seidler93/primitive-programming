import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging, isSupported as isMessagingSupported } from "firebase/messaging";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
export const hasFirebaseConfig = Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId);

export const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const hasPushConfig = Boolean(hasFirebaseConfig && vapidKey);

export const readTimeoutMs = 3500;
export const defaultProgramAccess = [];
export const flexibleProgramScheduleMode = "unknown-days";

export const localKey = (key) => `primitive-programming:${key}`;
export const isDevUserId = (userId = "") => userId.startsWith("dev-");

export function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), readTimeoutMs);
    }),
  ]);
}

export function readJson(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

export async function messagingClient() {
  if (!app || !hasFirebaseConfig) return null;
  const supported = await isMessagingSupported();
  return supported ? getMessaging(app) : null;
}

export function tokenId(token) {
  return encodeURIComponent(token);
}
