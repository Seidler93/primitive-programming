import { defaultProgramAccess, localKey } from "../services/firebaseClient";

// Shared DB-layer helpers. These keep document shaping and localStorage keys consistent.

export function userProgramsLocalKey(userId) {
  return localKey(`user-programs:${userId}`);
}

export function communitiesLocalKey() {
  return localKey("communities");
}

export function userSocialLocalKey(userId) {
  return localKey(`social:${userId}`);
}

export function userNotificationsLocalKey(userId) {
  return localKey(`notifications:${userId}`);
}

export function userActiveProgramsLocalKey(userId) {
  return localKey(`active-programs:${userId}`);
}

export function normalizeCommunityId(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function communityFromData(id, data = {}) {
  const memberIds = Array.isArray(data.memberIds) ? data.memberIds.filter(Boolean) : [];
  return {
    ...data,
    id: data.id || id,
    name: data.name || "Community",
    memberIds,
    memberCount: Math.max(Number(data.memberCount) || 0, memberIds.length),
  };
}

export function communityPayload(payload = {}) {
  const memberIds = Array.isArray(payload.memberIds) ? [...new Set(payload.memberIds.filter(Boolean))] : [];
  return {
    ...payload,
    memberIds,
    memberCount: memberIds.length,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeFriend(friend = {}) {
  const userId = String(friend.userId || friend.uid || "").trim();
  const name = String(friend.name || friend.displayName || "").trim();
  const photoURL = String(friend.photoURL || "").trim();
  if (!userId || !name) return null;
  return { userId, name, photoURL };
}

export function normalizeNotification(notification = {}) {
  const id = String(notification.id || "").trim();
  const type = String(notification.type || "").trim();
  if (!id || !type) return null;
  return {
    id,
    type,
    title: String(notification.title || "").trim(),
    body: String(notification.body || "").trim(),
    status: String(notification.status || "unread").trim(),
    createdAt: notification.createdAt || new Date().toISOString(),
    readAt: notification.readAt || "",
    actorUserId: String(notification.actorUserId || "").trim(),
    actorName: String(notification.actorName || "").trim(),
    actorPhotoURL: String(notification.actorPhotoURL || "").trim(),
    targetId: String(notification.targetId || "").trim(),
  };
}

export function normalizeNotifications(notifications) {
  if (!Array.isArray(notifications)) return [];
  const byId = new Map();
  notifications.forEach((notification) => {
    const normalized = normalizeNotification(notification);
    if (normalized) byId.set(normalized.id, normalized);
  });
  return [...byId.values()].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
}

export function normalizeFriends(friends) {
  if (!Array.isArray(friends)) return [];
  const byId = new Map();
  friends.forEach((friend) => {
    const normalized = normalizeFriend(friend);
    if (normalized) byId.set(normalized.userId, normalized);
  });
  return [...byId.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function normalizeMessage(message = {}) {
  const userId = String(message.userId || "").trim();
  const text = String(message.message || "").trim();
  if (!userId || !text) return null;
  return {
    userId,
    message: text,
    sentAt: message.sentAt || new Date().toISOString(),
  };
}

export function normalizeConversation(conversation = {}) {
  const id = String(conversation.id || conversation.convoId || "").trim();
  const users = Array.isArray(conversation.users) ? [...new Set(conversation.users.filter(Boolean))] : [];
  if (!id || users.length < 2) return null;
  return {
    id,
    users,
    messages: Array.isArray(conversation.messages)
      ? conversation.messages.map(normalizeMessage).filter(Boolean)
      : [],
    readBy: conversation.readBy && typeof conversation.readBy === "object" && !Array.isArray(conversation.readBy)
      ? conversation.readBy
      : {},
    updatedAt: conversation.updatedAt || new Date().toISOString(),
  };
}

export function normalizeConversations(conversations) {
  if (!Array.isArray(conversations)) return [];
  const byId = new Map();
  conversations.forEach((conversation) => {
    const normalized = normalizeConversation(conversation);
    if (normalized) byId.set(normalized.id, normalized);
  });
  return [...byId.values()].sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function normalizeProgramAccess(programs) {
  const ids = Array.isArray(programs) ? programs : [];
  return [...new Set([...defaultProgramAccess, ...ids].filter(Boolean))];
}

export function normalizeActivePrograms(activePrograms) {
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
