import { arrayUnion, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, isDevUserId, localKey, readJson, tokenId } from "../services/firebaseClient";
import { normalizeConversation, normalizeNotifications, userNotificationsLocalKey } from "./helpers";

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

function saveLocalNotifications(userId, notifications) {
  localStorage.setItem(userNotificationsLocalKey(userId), JSON.stringify(normalizeNotifications(notifications)));
}

export async function loadUserNotifications(userId) {
  if (!userId) return [];
  let notifications = normalizeNotifications(readJson(localStorage.getItem(userNotificationsLocalKey(userId)), []));

  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await getDoc(doc(db, "users", userId));
      notifications = normalizeNotifications(snapshot.exists() ? snapshot.data().notifications : notifications);
      saveLocalNotifications(userId, notifications);
    } catch (error) {
      console.warn("Falling back to local notifications.", error);
    }
  }

  return notifications;
}

export async function saveUserNotifications(userId, notifications) {
  const payload = {
    notifications: normalizeNotifications(notifications),
    updatedAt: new Date().toISOString(),
  };
  saveLocalNotifications(userId, payload.notifications);

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), payload, { merge: true });
      return { notifications: payload.notifications, synced: true };
    } catch (error) {
      console.warn("Saved notifications locally; cloud sync failed.", error);
      return { notifications: payload.notifications, synced: false, local: true };
    }
  }

  return { notifications: payload.notifications, synced: false, local: true };
}

export async function addUserNotification(userId, notification) {
  const now = new Date().toISOString();
  const payload = {
    id: notification.id || `${notification.type || "notification"}:${Date.now()}`,
    status: "unread",
    createdAt: now,
    ...notification,
  };
  const localNotifications = await loadUserNotifications(userId);
  saveLocalNotifications(userId, normalizeNotifications([payload, ...localNotifications]));

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), {
        notifications: arrayUnion(payload),
        updatedAt: now,
      }, { merge: true });
      return { notification: payload, synced: true };
    } catch (error) {
      console.warn("Saved notification locally; cloud sync failed.", error);
      return { notification: payload, synced: false, local: true };
    }
  }

  return { notification: payload, synced: false, local: true };
}

export async function dismissUserNotification(userId, notificationId) {
  const notifications = await loadUserNotifications(userId);
  const nextNotifications = notifications.filter((notification) => notification.id !== notificationId);
  return saveUserNotifications(userId, nextNotifications);
}

async function loadConversationNotifications(userId) {
  if (!userId) return [];
  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await getDocs(collection(db, "users", userId, "conversations"));
      return snapshot.docs
        .map((conversationDoc) => normalizeConversation({ id: conversationDoc.id, ...conversationDoc.data() }))
        .filter(Boolean);
    } catch (error) {
      console.warn("Could not load conversation notifications.", error);
    }
  }
  return [];
}

function unreadMessagesForUser(conversation, userId) {
  const readAt = conversation.readBy?.[userId] || "";
  return conversation.messages.filter((message) => (
    message.userId !== userId
    && (!readAt || String(message.sentAt).localeCompare(String(readAt)) > 0)
  )).length;
}

export async function loadAppNotificationSummary(userId) {
  const [notifications, conversations] = await Promise.all([
    loadUserNotifications(userId),
    loadConversationNotifications(userId),
  ]);
  const unreadNotifications = notifications.filter((notification) => notification.status !== "read");
  const counts = unreadNotifications.reduce((totals, notification) => {
    const bucket = notification.type === "friend-invite" ? "friends" : notification.type === "community" ? "community" : notification.type;
    totals[bucket] = (totals[bucket] || 0) + 1;
    return totals;
  }, {});
  counts.messages = conversations.reduce((total, conversation) => total + unreadMessagesForUser(conversation, userId), counts.messages || 0);
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  return { counts, notifications, total };
}
