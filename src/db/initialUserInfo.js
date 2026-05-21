import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebaseClient";

export async function getInitialUserInfo(userId, fields = []) {
  if (!db || !userId) return null;

  const snapshot = await getDoc(doc(db, "users", userId));
  if (!snapshot.exists()) return null;

  const data = snapshot.data();
  if (!Array.isArray(fields) || !fields.length) {
    return { uid: userId, ...data };
  }

  return fields.reduce((result, field) => {
    result[field] = data[field] ?? null;
    return result;
  }, {});
}

export async function getUserFields(userId, fields = []) {
  return getInitialUserInfo(userId, fields);
}
