const projectId = process.env.FIREBASE_PROJECT_ID || "flexx-management-dashboard";
const accessToken = process.env.FIRESTORE_ACCESS_TOKEN;
const database = "(default)";
const apply = process.argv.includes("--apply");

if (!accessToken) {
  throw new Error("Set FIRESTORE_ACCESS_TOKEN to a Google OAuth token with Firestore write access.");
}

function argValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : "";
}

const requestedUserId = argValue("--user-id");
const requestedEmail = argValue("--email").toLowerCase();
const requestedName = (argValue("--name") || "stef").toLowerCase();

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

function documentId(document) {
  return document.name.split("/").at(-1);
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
        fields: Object.fromEntries(
          Object.entries(value).map(([key, nestedValue]) => [key, jsToFirestoreValue(nestedValue)]),
        ),
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

function writeDocument(path, payload) {
  return {
    update: {
      name: documentBase(path),
      fields: jsToFields(payload),
    },
    updateMask: {
      fieldPaths: Object.keys(payload),
    },
  };
}

async function batchWrite(writes) {
  return firestoreRequest(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents:batchWrite`, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
}

function workoutGroupKey(item = {}) {
  return [
    item.programId === null ? null : item.programId || "default",
    item.date || "",
    item.week || "",
    item.phase || "",
    item.focus || "Workout",
  ].join("|");
}

function inferStatus(workout = {}) {
  if (workout.status) return workout.status;
  if (workout.completed === true) return "completed";
  if (workout.started === true) return "in_progress";
  return "scheduled";
}

function normalizeProgramId(value) {
  return value === undefined ? null : value;
}

function normalizeItems(workout = {}) {
  if (Array.isArray(workout.items) && workout.items.length) {
    return workout.items.map((item) => ({
      ...item,
      programId: normalizeProgramId(item.programId ?? workout.programId),
      date: item.date || workout.date || "",
      workoutType: item.workoutType || workout.workoutType || "strength",
    }));
  }

  if (workout.exercise || workout.focus || workout.workoutType) {
    return [{
      id: workout.itemId || workout.sourceWorkoutId || workout.id || `item-${Date.now()}`,
      date: workout.date || "",
      programId: normalizeProgramId(workout.programId),
      week: workout.week || workout.programWeek || "",
      phase: workout.phase || workout.workoutFocus || workout.title || "Workout",
      focus: workout.focus || workout.workoutFocus || workout.title || "Workout",
      exercise: workout.exercise || "",
      prescription: workout.prescription || "",
      notes: workout.notes || "",
      sets: Array.isArray(workout.sets) ? workout.sets : [],
      sourceDate: workout.sourceDate || workout.date || "",
      workoutType: workout.workoutType || "strength",
      scheduledPlaceholder: workout.scheduledPlaceholder === true,
    }];
  }

  return [];
}

function normalizeWorkoutDocument(docId, workout = {}) {
  const status = inferStatus(workout);
  const items = normalizeItems(workout);
  const firstItem = items[0] || {};
  const date = workout.date || firstItem.date || docId.match(/^\d{4}-\d{2}-\d{2}/)?.[0] || "";
  const programId = normalizeProgramId(workout.programId ?? firstItem.programId);
  const workoutKey = workout.workoutKey || (items.length ? workoutGroupKey({ ...firstItem, date }) : docId);
  const title = workout.title || workout.workoutFocus || workout.focus || firstItem.focus || "Workout";

  const normalized = {
    ...workout,
    id: workout.id || docId,
    date,
    workoutKey,
    title,
    status,
    started: workout.started === true || status === "in_progress" || status === "completed",
    completedAt: status === "completed" ? workout.completedAt || workout.updatedAt || new Date().toISOString() : null,
    programId,
    programWeek: workout.programWeek || workout.week || firstItem.week || "",
    workoutType: workout.workoutType || firstItem.workoutType || "strength",
    week: workout.week || firstItem.week || "",
    sourceDate: workout.sourceDate || firstItem.sourceDate || date,
    items,
    loads: workout.loads || {},
    notes: workout.notes || "",
    customExercises: Array.isArray(workout.customExercises) ? workout.customExercises : [],
    warmupSetCounts: workout.warmupSetCounts || {},
    programmedSetCounts: workout.programmedSetCounts || {},
    exerciseOverrides: workout.exerciseOverrides || {},
    updatedAt: new Date().toISOString(),
  };

  delete normalized.completed;
  delete normalized.maxes;
  delete normalized.intensity;
  delete normalized[["lookup", "Key"].join("")];
  return normalized;
}

function summarizeWorkout(workout = {}) {
  return {
    id: workout.id,
    date: workout.date,
    title: workout.title,
    status: workout.status,
    programId: workout.programId,
    workoutKey: workout.workoutKey,
    itemCount: workout.items?.length || 0,
    customExerciseCount: workout.customExercises?.length || 0,
  };
}

async function resolveUser() {
  if (requestedUserId) {
    return { userId: requestedUserId, userData: {} };
  }

  const users = await listDocuments("users");
  const matches = users
    .map((doc) => ({ userId: documentId(doc), userData: fieldsToJs(doc.fields) }))
    .filter(({ userData }) => {
      const email = String(userData.email || "").toLowerCase();
      const name = String(userData.displayName || userData.profile?.displayName || "").toLowerCase();
      if (requestedEmail) return email === requestedEmail || email.includes(requestedEmail);
      return name.includes(requestedName) || email.includes(requestedName);
    });

  if (matches.length !== 1) {
    console.log(`Found ${matches.length} matching user(s).`);
    matches.forEach(({ userId, userData }) => {
      console.log(`${userId}: ${userData.displayName || "(no name)"} <${userData.email || "no email"}>`);
    });
    throw new Error("Pass --user-id, or narrow --email/--name to exactly one user.");
  }

  return matches[0];
}

const { userId, userData } = await resolveUser();
const workoutDocs = await listDocuments(`users/${userId}/workouts`);
const rewrites = workoutDocs.map((doc) => {
  const docId = documentId(doc);
  const before = fieldsToJs(doc.fields);
  const after = normalizeWorkoutDocument(docId, before);
  return {
    docId,
    before,
    after,
    write: writeDocument(`users/${userId}/workouts/${after.id}`, after),
  };
});

console.log(`${apply ? "Updating" : "Dry run:"} workouts for ${userData.displayName || userId} (${userId}).`);
console.log(`Found ${rewrites.length} workout document(s).`);
rewrites.forEach(({ docId, before, after }) => {
  console.log(`\n${docId}`);
  console.log("Before:", JSON.stringify(summarizeWorkout(before), null, 2));
  console.log("After: ", JSON.stringify(summarizeWorkout(after), null, 2));
});

if (!apply) {
  console.log("\nRun again with --apply to update this user's workouts subcollection.");
  process.exit(0);
}

for (let index = 0; index < rewrites.length; index += 450) {
  const chunk = rewrites.slice(index, index + 450);
  await batchWrite(chunk.map((rewrite) => rewrite.write));
  console.log(`Applied ${Math.min(index + chunk.length, rewrites.length)}/${rewrites.length} workout update(s).`);
}

console.log("Done. User workouts were normalized.");
