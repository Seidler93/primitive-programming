import { defaultProgramAccess, localKey } from "../services/firebaseClient";

// Shared DB-layer helpers. These keep document shaping and localStorage keys consistent.

export function userProgramsLocalKey(userId) {
  return localKey(`user-programs:${userId}`);
}

export function communitiesLocalKey() {
  return localKey("communities");
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
