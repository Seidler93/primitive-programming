import { createUserWithEmailAndPassword, fetchSignInMethodsForEmail, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { getToken, onMessage } from "firebase/messaging";
import { getDownloadURL, ref as storageRef, uploadBytes } from "firebase/storage";
import { ensureUserDocument, saveNotificationToken } from "../db";
import { auth, hasPushConfig, isDevUserId, localKey, messagingClient, storage, vapidKey } from "./firebaseClient";

export * from "./firebaseClient";
export * from "../db";

export function observeAuth(callback) {
  localStorage.removeItem(localKey("devUser"));
  if (auth) return onAuthStateChanged(auth, callback);
  const stored = JSON.parse(localStorage.getItem(localKey("demoUser")) || "null");
  callback(stored);
  return () => {};
}

export async function login(email, password, mode = "login") {
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (auth) {
    if (mode === "signup") {
      const existingMethods = await fetchSignInMethodsForEmail(auth, normalizedEmail);
      if (existingMethods.length) {
        throw new Error("An account already exists for this email. Log in instead.");
      }
    }
    const fn = mode === "signup" ? createUserWithEmailAndPassword : signInWithEmailAndPassword;
    const result = await fn(auth, normalizedEmail, password);
    if (mode === "signup") {
      await ensureUserDocument(result.user, { role: "athlete" });
    }
    return result.user;
  }

  const user = { uid: normalizedEmail, email: normalizedEmail, role: "athlete" };
  localStorage.setItem(localKey("demoUser"), JSON.stringify(user));
  if (mode === "signup") {
    await ensureUserDocument(user, { role: "athlete" });
  }
  return user;
}

export async function logout() {
  localStorage.removeItem(localKey("devUser"));
  if (auth) return signOut(auth);
  localStorage.removeItem(localKey("demoUser"));
}

export async function uploadUserProfileImage(userId, file, fallbackDataUrl) {
  if (!file) throw new Error("No profile image selected.");

  if (storage && !isDevUserId(userId)) {
    const extension = file.name?.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
    const path = `users/${userId}/profile/profile-image-${Date.now()}.${extension}`;
    const imageRef = storageRef(storage, path);
    await uploadBytes(imageRef, file, {
      contentType: file.type || "image/jpeg",
      customMetadata: {
        userId,
        uploadedAt: new Date().toISOString(),
      },
    });
    return getDownloadURL(imageRef);
  }

  return fallbackDataUrl;
}

export async function requestNotificationAccess(userId, serviceWorkerRegistration) {
  if (!("Notification" in window)) {
    return { status: "unsupported", message: "This browser does not support notifications." };
  }
  if (!("serviceWorker" in navigator)) {
    return { status: "unsupported", message: "This browser does not support service workers." };
  }
  if (!hasPushConfig) {
    return { status: "missing-config", message: "Add VITE_FIREBASE_VAPID_KEY to enable push tokens." };
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    return { status: permission, message: "Notifications were not enabled." };
  }

  const messaging = await messagingClient();
  if (!messaging) {
    return { status: "unsupported", message: "Firebase Messaging is not supported in this browser." };
  }

  const registration = serviceWorkerRegistration || await navigator.serviceWorker.ready;
  const token = await getToken(messaging, {
    vapidKey,
    serviceWorkerRegistration: registration,
  });
  await saveNotificationToken(userId, token);
  return { status: "granted", token, message: "Notifications are ready on this device." };
}

export async function listenForForegroundMessages(callback) {
  const messaging = await messagingClient();
  if (!messaging) return () => {};
  return onMessage(messaging, callback);
}
