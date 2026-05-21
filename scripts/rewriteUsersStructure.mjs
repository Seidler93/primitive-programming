const projectId = process.env.FIREBASE_PROJECT_ID || "flexx-management-dashboard";
const accessToken = process.env.FIRESTORE_ACCESS_TOKEN;
const database = "(default)";
const apply = process.argv.includes("--apply");

if (!accessToken) {
  throw new Error("Set FIRESTORE_ACCESS_TOKEN to a Google OAuth token with Firestore write access.");
}

const rootFieldsToKeep = [
  "uid",
  "email",
  "displayName",
  "photoURL",
  "role",
  "profile",
  "metrics",
  "activePrograms",
  "programs",
  "friends",
  "settings",
  "createdAt",
  "updatedAt",
];

function documentBase(path = "") {
  const suffix = path ? `/${path}` : "";
  return `projects/${projectId}/databases/${database}/documents${suffix}`;
}

function restUrl(path = "") {
  return `https://firestore.googleapis.com/v1/${documentBase(path)}`;
}

async function firestoreRequest(url, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(JSON.stringify(result, null, 2));
  }
  return result;
}

async function getDocument(path) {
  try {
    return await firestoreRequest(restUrl(path));
  } catch (error) {
    if (String(error.message).includes("NOT_FOUND")) return null;
    throw error;
  }
}

async function listDocuments(path) {
  const documents = [];
  let pageToken = "";
  do {
    const url = new URL(restUrl(path));
    url.searchParams.set("pageSize", "300");
    if (pageToken) url.searchParams.set("pageToken", pageToken);
    const result = await firestoreRequest(url);
    documents.push(...(result.documents || []));
    pageToken = result.nextPageToken || "";
  } while (pageToken);
  return documents;
}

function firestoreValueToJs(value) {
  if (!value || typeof value !== "object") return undefined;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("stringValue" in value) return value.stringValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(firestoreValueToJs);
  if ("mapValue" in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields || {}).map(([key, nestedValue]) => [key, firestoreValueToJs(nestedValue)]),
    );
  }
  return undefined;
}

function jsToFirestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(jsToFirestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, jsToFirestoreValue(nestedValue)])),
      },
    };
  }
  return { stringValue: String(value) };
}

function fieldsToJs(fields = {}) {
  return Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, firestoreValueToJs(value)]));
}

function jsToFields(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, jsToFirestoreValue(value)]));
}

function writeDocument(path, payload, mergeFields = Object.keys(payload)) {
  return {
    update: {
      name: documentBase(path),
      fields: jsToFields(payload),
    },
    updateMask: {
      fieldPaths: mergeFields,
    },
  };
}

function documentId(document) {
  return document.name.split("/").at(-1);
}

function normalizePreferences(preferences = {}) {
  return {
    weightUnit: preferences.weightUnit === "lb" ? "lb" : "kg",
    distanceUnit: preferences.distanceUnit === "mi" ? "mi" : "km",
  };
}

function normalizeArray(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function normalizeNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeMetricEntry(value, fallbackUnit, fallbackDate) {
  const source = normalizeObject(value);
  const metricValue = normalizeNumber(source.value ?? value);
  if (metricValue === null) return null;
  return {
    unit: source.unit || fallbackUnit,
    value: metricValue,
    date: source.date || source.updatedAt || fallbackDate,
  };
}

function normalizeMetricTrack(value, fallbackUnit, fallbackDate) {
  const source = normalizeObject(value);
  const current = normalizeMetricEntry(source.current || source, fallbackUnit, fallbackDate);
  if (!current) return null;
  return { current };
}

function metricFromProfile(profile, keys, fallbackUnit, fallbackDate) {
  const matchedKey = keys.find((key) => profile[key] !== undefined && profile[key] !== "");
  if (!matchedKey) return null;
  return normalizeMetricTrack({ value: profile[matchedKey] }, fallbackUnit, fallbackDate);
}

function buildMetrics(rootData, profile, maxes, preferences, fallbackDate) {
  const existingMetrics = normalizeObject(rootData.metrics);
  const existingBody = normalizeObject(existingMetrics.body);
  const existingLifts = normalizeObject(existingMetrics.lifts);
  const weightUnit = preferences.weightUnit || "kg";
  const lifts = {};

  Object.entries({ ...existingLifts, ...maxes }).forEach(([key, value]) => {
    const liftMetric = normalizeMetricTrack(value, normalizeObject(value).unit || weightUnit, fallbackDate);
    if (liftMetric) lifts[key] = liftMetric;
  });

  const metrics = {
    ...existingMetrics,
    body: existingBody,
    cardio: normalizeObject(existingMetrics.cardio),
    lifts,
  };

  const bodyweight = normalizeMetricTrack(existingBody.bodyweight || existingMetrics.bodyweight, weightUnit, fallbackDate)
    || metricFromProfile(profile, ["bodyweight", "bodyWeight", "weight"], weightUnit, fallbackDate);
  const bodyfat = normalizeMetricTrack(existingBody.bodyfat || existingMetrics.bodyfat, "percentage", fallbackDate)
    || metricFromProfile(profile, ["bodyfat", "bodyFat", "bodyFatPercentage"], "percentage", fallbackDate);
  const muscleMass = normalizeMetricTrack(existingBody.muscleMass || existingMetrics.muscleMass, weightUnit, fallbackDate)
    || metricFromProfile(profile, ["muscleMass"], weightUnit, fallbackDate);

  if (bodyweight) metrics.body.bodyweight = bodyweight;
  if (bodyfat) metrics.body.bodyfat = bodyfat;
  if (muscleMass) metrics.body.muscleMass = muscleMass;
  delete metrics.bodyweight;
  delete metrics.bodyfat;
  delete metrics.muscleMass;

  return metrics;
}

function normalizeExerciseStat(stat = {}) {
  const source = normalizeObject(stat);
  const exerciseId = String(source.exerciseId || source.id || "").trim();
  if (!exerciseId) return null;
  const normalized = {
    exerciseId,
    weight: normalizeNumber(source.weight),
    unit: source.unit || "",
    reps: normalizeNumber(source.reps),
    workoutId: source.workoutId || "",
    updatedAt: source.updatedAt || source.date || new Date().toISOString(),
  };
  return Object.fromEntries(Object.entries(normalized).filter(([, value]) => value !== null && value !== ""));
}

function buildExerciseStatWrites(userId, rootData) {
  return normalizeArray(rootData.exerciseStats)
    .map(normalizeExerciseStat)
    .filter(Boolean)
    .map((stat) => writeDocument(`users/${userId}/exerciseStats/${stat.exerciseId}`, stat));
}

function removeMetricProfileFields(profile) {
  const next = { ...profile };
  [
    "bodyweight",
    "bodyWeight",
    "weight",
    "bodyfat",
    "bodyFat",
    "bodyFatPercentage",
    "muscleMass",
  ].forEach((field) => {
    delete next[field];
  });
  return next;
}

function buildUpdatedUserStructure(userId, rootData, profileDetails, maxesDoc, preferencesDoc) {
  const now = new Date().toISOString();
  const profileWithMetricFields = {
    ...normalizeObject(rootData.profile),
    ...normalizeObject(profileDetails),
  };
  const preferences = normalizePreferences({
    ...normalizeObject(rootData.preferences),
    ...normalizeObject(preferencesDoc),
  });
  const maxes = normalizeObject(rootData.maxes || maxesDoc.maxes);
  const metrics = buildMetrics(rootData, profileWithMetricFields, maxes, preferences, rootData.updatedAt || now);
  const profile = removeMetricProfileFields(profileWithMetricFields);

  return {
    uid: rootData.uid || userId,
    email: rootData.email || profile.email || "",
    displayName: rootData.displayName || profile.displayName || "",
    photoURL: rootData.photoURL || profile.photoURL || "",
    role: rootData.role || profile.role || "athlete",
    profile,
    metrics,
    activePrograms: normalizeArray(rootData.activePrograms),
    programs: normalizeArray(rootData.programs),
    friends: normalizeArray(rootData.friends),
    settings: {
      ...(normalizeObject(rootData.settings)),
      preferences,
    },
    createdAt: rootData.createdAt || now,
    updatedAt: now,
  };
}

async function loadUserPieces(userDoc) {
  const userId = documentId(userDoc);
  const [profileDetailsDoc, maxesDoc, preferencesDoc] = await Promise.all([
    getDocument(`users/${userId}/profile/details`),
    getDocument(`users/${userId}/profile/maxes`),
    getDocument(`users/${userId}/profile/preferences`),
  ]);

  return {
    userId,
    rootData: fieldsToJs(userDoc.fields),
    profileDetails: fieldsToJs(profileDetailsDoc?.fields),
    maxesDoc: fieldsToJs(maxesDoc?.fields),
    preferencesDoc: fieldsToJs(preferencesDoc?.fields),
  };
}

export async function rewriteUserWithUpdatedStructure(userDoc) {
  const { userId, rootData, profileDetails, maxesDoc, preferencesDoc } = await loadUserPieces(userDoc);
  const payload = buildUpdatedUserStructure(userId, rootData, profileDetails, maxesDoc, preferencesDoc);
  const existingRootFields = Object.keys(rootData);
  const updateMask = [...new Set([...rootFieldsToKeep, ...existingRootFields])];
  const userWrite = writeDocument(`users/${userId}`, payload, updateMask);
  const exerciseStatWrites = buildExerciseStatWrites(userId, rootData);

  return {
    userId,
    payload,
    exerciseStats: exerciseStatWrites.map((write) => fieldsToJs(write.update.fields)),
    writes: [userWrite, ...exerciseStatWrites],
  };
}

async function batchWrite(writes) {
  return firestoreRequest(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents:batchWrite`, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
}

const userDocs = await listDocuments("users");
const rewrites = await Promise.all(userDocs.map(rewriteUserWithUpdatedStructure));

console.log(`${apply ? "Rewriting" : "Dry run:"} ${rewrites.length} user document(s).`);

if (!apply) {
  rewrites.forEach(({ userId, payload, exerciseStats }) => {
    console.log(`\nUpdated user shape for ${userId}:`);
    console.log(JSON.stringify(payload, null, 2));
    if (exerciseStats.length) {
      console.log(`Exercise stats subcollection writes for ${userId}:`);
      console.log(JSON.stringify(exerciseStats, null, 2));
    }
  });
  console.log("Run again with --apply to write the updated user structure.");
  process.exit(0);
}

const writes = rewrites.flatMap((rewrite) => rewrite.writes);

for (let index = 0; index < writes.length; index += 450) {
  const chunk = writes.slice(index, index + 450);
  await batchWrite(chunk);
  console.log(`Applied ${Math.min(index + chunk.length, writes.length)}/${writes.length} write(s).`);
}

console.log(`Done. Rewritten ${rewrites.length} user document(s) with ${writes.length} total write(s).`);
