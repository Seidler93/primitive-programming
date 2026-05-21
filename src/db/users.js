import { arrayUnion, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, defaultProgramAccess, hasFirebaseConfig, localKey, readJson, withTimeout } from "../services/firebaseClient";
import { normalizeActivePrograms, normalizeConversations, normalizeFriends, normalizeProgramAccess, userProgramsLocalKey } from "./helpers";

// Root user document and user access helpers.

export async function ensureUserDocument(user, defaults = {}) {
  if (!user?.uid) return {};
  const localProfile = readJson(localStorage.getItem(localKey(`profile:${user.uid}`)), {});
  const localProgramIds = normalizeProgramAccess(readJson(localStorage.getItem(userProgramsLocalKey(user.uid)), []));
  localStorage.setItem(userProgramsLocalKey(user.uid), JSON.stringify(localProgramIds));
  const role = defaults.role || user.role || localProfile.role || "athlete";
  let rootData = {};

  if (db) {
    const payload = {
      uid: user.uid,
      email: user.email || "",
      displayName: user.displayName || "",
      photoURL: user.photoURL || localProfile.photoURL || "",
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
        payload.friends = [];
        payload.conversations = [];
        payload.notifications = [];
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
    friends: normalizeFriends(rootData.friends),
    conversations: normalizeConversations(rootData.conversations),
  };
}

export async function loadUserProgramIds(userId) {
  if (db) {
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

  if (db) {
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

export async function isTrainerUser(user) {
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

