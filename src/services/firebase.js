import { initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  orderBy,
  query,
  setDoc,
} from "firebase/firestore";
import {
  getMessaging,
  getToken,
  isSupported as isMessagingSupported,
  onMessage,
} from "firebase/messaging";
import {
  getDownloadURL,
  getStorage,
  ref as storageRef,
  uploadBytes,
} from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};
const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;

export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId,
);

const app = hasFirebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth = app ? getAuth(app) : null;
export const db = app ? getFirestore(app) : null;
export const storage = app ? getStorage(app) : null;
export const hasPushConfig = Boolean(hasFirebaseConfig && vapidKey);

const localKey = (key) => `primitive-programming:${key}`;
const isDevUserId = (userId = "") => userId.startsWith("dev-");
const readTimeoutMs = 3500;
const defaultProgramAccess = [];
const flexibleProgramScheduleMode = "unknown-days";

function withTimeout(promise, message) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(message)), readTimeoutMs);
    }),
  ]);
}

async function messagingClient() {
  if (!app || !hasFirebaseConfig) return null;
  const supported = await isMessagingSupported();
  return supported ? getMessaging(app) : null;
}

function tokenId(token) {
  return encodeURIComponent(token);
}

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

async function loadLegacyWorkoutLogs(userId) {
  const localLogs = readJson(localStorage.getItem(localKey(`logs:${userId}`)), {});
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDocs(collection(db, "users", userId, "logs")),
        "Legacy workout logs request timed out.",
      );
      return {
        ...localLogs,
        ...Object.fromEntries(snapshot.docs.map((item) => [item.id, item.data()])),
      };
    } catch (error) {
      console.warn("Could not read legacy workout logs.", error);
    }
  }
  return localLogs;
}

async function deleteLegacyWorkoutLogs(userId, ids) {
  localStorage.removeItem(localKey(`logs:${userId}`));
  if (db && !isDevUserId(userId)) {
    await Promise.all(ids.map(async (id) => {
      try {
        await deleteDoc(doc(db, "users", userId, "logs", id));
      } catch (error) {
        console.warn("Could not delete legacy workout log.", error);
      }
    }));
  }
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
  workouts = { ...localWorkouts, ...workouts };

  const legacyLogs = await loadLegacyWorkoutLogs(userId);
  const legacyIds = Object.keys(legacyLogs);
  if (legacyIds.length) {
    const migrated = Object.fromEntries(legacyIds.map((id) => [id, workoutRecordFromData(id, legacyLogs[id])]));
    workouts = { ...migrated, ...workouts };
    localStorage.setItem(localKey(`workouts:${userId}`), JSON.stringify(workouts));
    if (db && !isDevUserId(userId)) {
      await Promise.all(Object.entries(migrated).map(([id, workout]) => (
        setDoc(doc(db, "users", userId, "workouts", id), workoutRecordPayload(workout), { merge: true })
      )));
    }
    await deleteLegacyWorkoutLogs(userId, legacyIds);
  }

  return workouts;
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

function userProgramsLocalKey(userId) {
  return localKey(`user-programs:${userId}`);
}

function readJson(value, fallback) {
  try {
    return JSON.parse(value || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function communitiesLocalKey() {
  return localKey("communities");
}

function normalizeCommunityId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function communityFromData(id, data = {}) {
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds.filter(Boolean) : [];
  return {
    ...data,
    id: data.id || id,
    name: data.name || "Community",
    memberIds,
    memberCount: Math.max(Number(data.memberCount) || 0, memberIds.length),
  };
}

function communityPayload(payload = {}) {
  const memberIds = Array.isArray(payload.memberIds) ? [...new Set(payload.memberIds.filter(Boolean))] : [];
  return {
    ...payload,
    memberIds,
    memberCount: memberIds.length,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeProgramAccess(programs) {
  const ids = Array.isArray(programs) ? programs : [];
  return [...new Set([...defaultProgramAccess, ...ids].filter(Boolean))];
}

function normalizeActivePrograms(activePrograms) {
  if (!Array.isArray(activePrograms)) return [];
  const byId = new Map();
  activePrograms.forEach((program) => {
    const id = program?.id || program?.programId;
    if (!id) return;
    const normalized = {
      id,
      startDate: program.startDate || "",
      scheduled: program.scheduled !== false,
    };
    if (program.workoutDates && typeof program.workoutDates === "object" && !Array.isArray(program.workoutDates)) {
      normalized.workoutDates = program.workoutDates;
    }
    if (program.currentWeek !== undefined) {
      normalized.currentWeek = Math.max(1, Number(program.currentWeek) || 1);
    }
    if (program.nextWorkoutIndex !== undefined) {
      normalized.nextWorkoutIndex = Math.max(0, Number(program.nextWorkoutIndex) || 0);
    }
    byId.set(id, normalized);
  });
  return [...byId.values()];
}

export async function ensureUserDocument(user, defaults = {}) {
  if (!user?.uid) return {};
  const localProfile = readJson(localStorage.getItem(localKey(`profile:${user.uid}`)), {});
  const localProgramIds = normalizeProgramAccess(readJson(localStorage.getItem(userProgramsLocalKey(user.uid)), []));
  localStorage.setItem(userProgramsLocalKey(user.uid), JSON.stringify(localProgramIds));
  const role = defaults.role || user.role || localProfile.role || "athlete";
  let rootData = {};

  if (db && !isDevUserId(user.uid)) {
    const email = String(user.email || "").trim().toLowerCase();
    const payload = {
      uid: user.uid,
      email,
      emailLower: email,
      displayName: user.displayName || "",
      role,
      updatedAt: new Date().toISOString(),
    };
    try {
      const snapshot = await getDoc(doc(db, "users", user.uid));
      rootData = snapshot.exists() ? snapshot.data() : {};
      if (!snapshot.exists()) {
        payload.programs = [];
        payload.activePrograms = [];
        payload.workoutTemplates = [];
        payload.createdAt = new Date().toISOString();
      }
      await setDoc(doc(db, "users", user.uid), payload, { merge: true });
    } catch (error) {
      console.warn("Could not ensure user document.", error);
    }
  }

  return {
    ...localProfile,
    ...rootData,
    role: rootData.role || role,
    programs: normalizeProgramAccess(rootData.programs || localProgramIds),
    activePrograms: normalizeActivePrograms(rootData.activePrograms),
    workoutTemplates: Array.isArray(rootData.workoutTemplates) ? rootData.workoutTemplates.slice(0, 10) : [],
  };
}

export async function loadUserProgramIds(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "users", userId)), "User programs request timed out.");
      if (snapshot.exists()) {
        return normalizeProgramAccess(snapshot.data().programs);
      }
    } catch (error) {
      console.warn("Falling back to local user programs.", error);
    }
  }
  try {
    return normalizeProgramAccess(readJson(localStorage.getItem(userProgramsLocalKey(userId)), []));
  } catch {
    return defaultProgramAccess;
  }
}

export async function grantUserProgramAccess(userId, programId) {
  if (!userId || !programId) return { synced: false };
  const localProgramIds = normalizeProgramAccess(readJson(localStorage.getItem(userProgramsLocalKey(userId)), []));
  const nextProgramIds = normalizeProgramAccess([...localProgramIds, programId]);
  localStorage.setItem(userProgramsLocalKey(userId), JSON.stringify(nextProgramIds));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), {
        programs: arrayUnion(programId),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved user program access locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

export async function loadUserCommunities(userId) {
  if (!userId) return [];
  let communities = [];

  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db, "communities")), "Communities request timed out.");
      communities = snapshot.docs
        .map((item) => communityFromData(item.id, item.data()))
        .filter((community) => community.memberIds.includes(userId));
    } catch (error) {
      console.warn("Falling back to local communities.", error);
    }
  }

  const localCommunities = readJson(localStorage.getItem(communitiesLocalKey()), []);
  const merged = new Map(localCommunities.map((community) => [community.id, communityFromData(community.id, community)]));
  communities.forEach((community) => merged.set(community.id, community));
  return [...merged.values()]
    .filter((community) => community.memberIds.includes(userId))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCommunity(userId, name) {
  const trimmedName = String(name || "").trim();
  if (!userId || !trimmedName) throw new Error("Community name is required.");
  const id = normalizeCommunityId(trimmedName) || `community-${Date.now()}`;
  const existing = readJson(localStorage.getItem(communitiesLocalKey()), []);
  const payload = communityPayload({
    id,
    name: trimmedName,
    ownerId: userId,
    memberIds: [userId],
    createdAt: new Date().toISOString(),
  });

  localStorage.setItem(communitiesLocalKey(), JSON.stringify([
    ...existing.filter((community) => community.id !== id),
    payload,
  ]));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "communities", id), payload, { merge: true });
      await setDoc(doc(db, "users", userId), {
        communities: arrayUnion(id),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { community: payload, synced: true };
    } catch (error) {
      console.warn("Saved community locally; cloud sync failed.", error);
      return { community: payload, synced: false, local: true };
    }
  }

  return { community: payload, synced: false, local: true };
}

export async function joinCommunity(userId, communityCode) {
  const id = normalizeCommunityId(communityCode);
  if (!userId || !id) throw new Error("Community code is required.");
  const localCommunities = readJson(localStorage.getItem(communitiesLocalKey()), []);
  let community = localCommunities.find((item) => item.id === id);

  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "communities", id)), "Community lookup timed out.");
      if (!snapshot.exists()) throw new Error("Community not found.");
      community = communityFromData(snapshot.id, snapshot.data());
      await setDoc(doc(db, "communities", id), {
        memberIds: arrayUnion(userId),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      await setDoc(doc(db, "users", userId), {
        communities: arrayUnion(id),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return {
        community: communityFromData(id, { ...community, memberIds: [...community.memberIds, userId] }),
        synced: true,
      };
    } catch (error) {
      console.warn("Could not join community in the cloud.", error);
      if (!community) throw error;
    }
  }

  if (!community) throw new Error("Community not found.");
  const nextCommunity = communityPayload({
    ...community,
    memberIds: [...new Set([...(community.memberIds || []), userId])],
  });
  localStorage.setItem(communitiesLocalKey(), JSON.stringify([
    ...localCommunities.filter((item) => item.id !== id),
    nextCommunity,
  ]));
  return { community: nextCommunity, synced: false, local: true };
}

function userActiveProgramsLocalKey(userId) {
  return localKey(`active-programs:${userId}`);
}

export async function loadUserActivePrograms(userId) {
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "users", userId)), "User active programs request timed out.");
      if (snapshot.exists()) {
        return normalizeActivePrograms(snapshot.data().activePrograms);
      }
    } catch (error) {
      console.warn("Falling back to local active programs.", error);
    }
  }
  return normalizeActivePrograms(readJson(localStorage.getItem(userActiveProgramsLocalKey(userId)), []));
}

export async function saveUserActiveProgram(userId, activeProgram) {
  if (!userId || !activeProgram?.id) return { synced: false };
  const current = await loadUserActivePrograms(userId);
  const next = normalizeActivePrograms([
    ...current.filter((program) => program.id !== activeProgram.id),
    activeProgram,
  ]);
  localStorage.setItem(userActiveProgramsLocalKey(userId), JSON.stringify(next));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), {
        activePrograms: next,
        programs: arrayUnion(activeProgram.id),
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved active program locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

export async function removeUserActiveProgram(userId, programId) {
  if (!userId || !programId) return { synced: false };
  const current = await loadUserActivePrograms(userId);
  const next = normalizeActivePrograms(current.filter((program) => program.id !== programId));
  localStorage.setItem(userActiveProgramsLocalKey(userId), JSON.stringify(next));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), {
        activePrograms: next,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Removed active program locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
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

export async function saveNotificationToken(userId, token) {
  const payload = {
    token,
    userAgent: navigator.userAgent,
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(localKey(`push-token:${userId}`), JSON.stringify(payload));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId, "notificationTokens", tokenId(token)), payload, { merge: true });
    } catch (error) {
      console.warn("Falling back to local notification token storage.", error);
    }
  }
  return payload;
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
  return onMessage(messaging, (payload = {}) => {
    callback(payload || {});
  });
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

export async function loadAthletes() {
  if (db) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db, "users")), "Athletes request timed out.");
      return snapshot.docs
        .map((item) => ({ uid: item.id, ...item.data() }))
        .filter((item) => item.role !== "coach" && item.role !== "trainer");
    } catch (error) {
      console.warn("Falling back to local athletes.", error);
    }
  }
  return [];
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

export async function isTrainerUser(user) {
  if (user?.uid === "dev-coach") return true;
  if (user?.uid === "dev-athlete") return false;
  if (user?.role === "athlete") return false;
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
