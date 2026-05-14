import { arrayUnion, collection, doc, getDoc, getDocs, setDoc } from "firebase/firestore";
import { db, isDevUserId, readJson, withTimeout } from "../services/firebaseClient";
import { communitiesLocalKey, communityFromData, communityPayload, normalizeCommunityId } from "./helpers";

// Community documents live in the top-level `communities` collection.

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
