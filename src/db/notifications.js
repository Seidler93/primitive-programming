import { doc, setDoc } from "firebase/firestore";
import { db, isDevUserId, localKey, tokenId } from "../services/firebaseClient";

// Notification tokens are saved per user/device.

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
