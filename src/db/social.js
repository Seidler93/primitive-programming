import { collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, isDevUserId, readJson, withTimeout } from "../services/firebaseClient";
import { normalizeConversation, normalizeConversations, normalizeFriend, normalizeFriends, userSocialLocalKey } from "./helpers";

function socialFromData(data = {}) {
  return {
    friends: normalizeFriends(data.friends),
    conversations: normalizeConversations(data.conversations),
  };
}

function saveLocalSocial(userId, social) {
  localStorage.setItem(userSocialLocalKey(userId), JSON.stringify(socialFromData(social)));
}

function saveLocalConversations(userId, conversations) {
  const localSocial = socialFromData(readJson(localStorage.getItem(userSocialLocalKey(userId)), {}));
  saveLocalSocial(userId, {
    ...localSocial,
    conversations: normalizeConversations(conversations),
  });
}

async function loadRootSocial(userId) {
  if (!userId) return socialFromData();
  let social = socialFromData(readJson(localStorage.getItem(userSocialLocalKey(userId)), {}));

  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(getDoc(doc(db, "users", userId)), "Social request timed out.");
      if (snapshot.exists()) {
        social = socialFromData({
          ...social,
          ...snapshot.data(),
        });
        saveLocalSocial(userId, social);
      }
    } catch (error) {
      console.warn("Falling back to local social data.", error);
    }
  }

  return social;
}

async function saveRootSocial(userId, social) {
  const currentLocal = socialFromData(readJson(localStorage.getItem(userSocialLocalKey(userId)), {}));
  const payload = {
    friends: normalizeFriends(social.friends),
    updatedAt: new Date().toISOString(),
  };
  saveLocalSocial(userId, {
    ...currentLocal,
    ...payload,
  });

  if (db && !isDevUserId(userId)) {
    try {
      await setDoc(doc(db, "users", userId), payload, { merge: true });
      return { synced: true };
    } catch (error) {
      console.warn("Saved social data locally; cloud sync failed.", error);
      return { synced: false, local: true };
    }
  }

  return { synced: false, local: true };
}

export async function loadUserFriends(userId) {
  const social = await loadRootSocial(userId);
  return social.friends;
}

export async function addUserFriend(userId, friend) {
  const normalizedFriend = normalizeFriend(friend);
  if (!userId || !normalizedFriend) throw new Error("Friend name and user ID are required.");

  const social = await loadRootSocial(userId);
  const friends = normalizeFriends([...social.friends, normalizedFriend]);
  const result = await saveRootSocial(userId, {
    ...social,
    friends,
  });

  return {
    ...result,
    friend: normalizedFriend,
    friends,
  };
}

function normalizeSearchableUser(userId, data = {}) {
  const displayName = String(data.displayName || data.profileName || data.name || "").trim();
  const email = String(data.email || "").trim().toLowerCase();
  const photoURL = String(data.photoURL || "").trim();
  if (!userId || !displayName) return null;
  return {
    userId,
    name: displayName,
    photoURL,
    searchText: `${displayName.toLowerCase()} ${email}`,
  };
}

export async function searchFriendUsers(query, currentUserId) {
  const searchTerm = String(query || "").trim().toLowerCase();
  if (searchTerm.length < 2) return [];

  if (db) {
    try {
      const snapshot = await withTimeout(getDocs(collection(db, "users")), "User search request timed out.");
      const matches = snapshot.docs
        .map((userDoc) => normalizeSearchableUser(userDoc.id, userDoc.data()))
        .filter((item) => item && item.userId !== currentUserId && item.searchText.includes(searchTerm))
        .slice(0, 12);
      const enrichedMatches = await withTimeout(Promise.all(matches.map(async (match) => {
        if (match.photoURL) return match;
        const profileSnapshot = await getDoc(doc(db, "users", match.userId, "profile", "details"));
        const profileData = profileSnapshot.exists() ? profileSnapshot.data() : {};
        return {
          ...match,
          name: profileData.displayName || match.name,
          photoURL: profileData.photoURL || match.photoURL,
        };
      })), "User profile search request timed out.");

      return enrichedMatches
        .map(({ searchText, ...safeUser }) => safeUser);
    } catch (error) {
      console.warn("User search failed.", error);
    }
  }

  return [];
}

export async function loadUserConversations(userId) {
  if (!userId) return [];
  const localSocial = socialFromData(readJson(localStorage.getItem(userSocialLocalKey(userId)), {}));
  let conversations = localSocial.conversations;

  if (db && !isDevUserId(userId)) {
    try {
      const snapshot = await withTimeout(
        getDocs(collection(db, "users", userId, "conversations")),
        "Conversations request timed out.",
      );
      const remoteConversations = snapshot.docs.map((conversationDoc) =>
        normalizeConversation({
          id: conversationDoc.id,
          ...conversationDoc.data(),
        }),
      ).filter(Boolean);
      if (remoteConversations.length) {
        conversations = normalizeConversations(remoteConversations);
        saveLocalConversations(userId, conversations);
      } else {
        const userSnapshot = await withTimeout(getDoc(doc(db, "users", userId)), "User social request timed out.");
        const legacyConversations = normalizeConversations(userSnapshot.exists() ? userSnapshot.data().conversations : []);
        if (legacyConversations.length) {
          await Promise.all(legacyConversations.map((conversation) => saveConversationForUsers(conversation)));
          conversations = legacyConversations;
        }
      }
    } catch (error) {
      console.warn("Falling back to local conversations.", error);
    }
  }

  return conversations;
}

async function saveConversationForUsers(conversation) {
  const normalizedConversation = normalizeConversation(conversation);
  if (!normalizedConversation) throw new Error("Conversation is missing required fields.");
  const payload = {
    ...normalizedConversation,
    updatedAt: new Date().toISOString(),
  };

  payload.users.forEach((participantUserId) => {
    const localSocial = socialFromData(readJson(localStorage.getItem(userSocialLocalKey(participantUserId)), {}));
    saveLocalSocial(participantUserId, {
      ...localSocial,
      conversations: normalizeConversations([
        ...localSocial.conversations.filter((item) => item.id !== payload.id),
        payload,
      ]),
    });
  });

  if (db) {
    const cloudWrites = payload.users
      .filter((participantUserId) => !isDevUserId(participantUserId))
      .map((participantUserId) =>
        setDoc(doc(db, "users", participantUserId, "conversations", payload.id), payload, { merge: true }),
      );
    if (cloudWrites.length) {
      await withTimeout(Promise.all(cloudWrites), "Conversation sync timed out.");
      return { conversation: payload, synced: true };
    }
  }

  return { conversation: payload, synced: false, local: true };
}

export async function ensureConversation(userId, friendUserId) {
  if (!userId || !friendUserId) throw new Error("A conversation needs two users.");
  const users = [...new Set([userId, friendUserId].filter(Boolean))].sort();
  const id = users.join(":");
  const conversations = await loadUserConversations(userId);
  const existing = conversations.find((conversation) => conversation.id === id);
  if (existing) return { conversation: existing, synced: true };

  const conversation = normalizeConversation({
    id,
    users,
    messages: [],
    updatedAt: new Date().toISOString(),
  });
  return saveConversationForUsers(conversation);
}

export async function sendConversationMessage(userId, conversationId, message) {
  const text = String(message || "").trim();
  if (!userId || !conversationId || !text) throw new Error("Message text is required.");

  const conversations = await loadUserConversations(userId);
  const conversation = conversations.find((item) => item.id === conversationId);
  if (!conversation) {
    throw new Error("Conversation not found.");
  }

  const nextConversation = normalizeConversation({
    ...conversation,
    messages: [
      ...conversation.messages,
      {
        userId,
        message: text,
        sentAt: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  });
  const result = await saveConversationForUsers(nextConversation);
  const nextConversations = normalizeConversations([
    ...conversations.filter((item) => item.id !== conversationId),
    result.conversation,
  ]);

  return {
    ...result,
    conversations: nextConversations,
  };
}
