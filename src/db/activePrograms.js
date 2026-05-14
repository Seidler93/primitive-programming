import { arrayUnion, doc, getDoc, setDoc } from "firebase/firestore";
import { db, isDevUserId, readJson, withTimeout } from "../services/firebaseClient";
import { normalizeActivePrograms, userActiveProgramsLocalKey } from "./helpers";

// Active programs are stored on the root user document.

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
