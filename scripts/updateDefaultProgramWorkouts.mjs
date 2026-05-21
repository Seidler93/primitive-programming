import { weightliftingProgram } from "../src/data/programData.js";

const projectId = process.env.FIREBASE_PROJECT_ID || "flexx-management-dashboard";
const accessToken = process.env.FIRESTORE_ACCESS_TOKEN;
const database = "(default)";
const apply = process.argv.includes("--apply");
const deleteStale = process.argv.includes("--delete-stale");

if (!accessToken) {
  throw new Error("Set FIRESTORE_ACCESS_TOKEN to a Google OAuth token with Firestore write access.");
}

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

function jsToFields(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, jsToFirestoreValue(value)]));
}

function stripSetTarget(exercise) {
  return {
    ...exercise,
    sets: (exercise.sets || []).map((set) => {
      const { target, ...cleanSet } = set;
      return cleanSet;
    }),
  };
}

function workoutPayloads(program) {
  const now = new Date().toISOString();
  return program.weeks.flatMap((week) => (
    week.workouts.map((workout) => ({
      id: workout.id,
      programId: program.id,
      week: week.week,
      phase: week.phase,
      weekNotes: week.notes || "",
      day: workout.day,
      focus: workout.focus,
      exercises: (workout.exercises || []).map(stripSetTarget),
      updatedAt: now,
    }))
  ));
}

function writeDocument(path, payload) {
  const fieldPaths = Object.keys(payload);
  return {
    update: {
      name: documentBase(path),
      fields: jsToFields(payload),
    },
    updateMask: {
      fieldPaths,
    },
  };
}

function deleteDocument(path) {
  return {
    delete: documentBase(path),
  };
}

async function batchWrite(writes) {
  return firestoreRequest(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents:batchWrite`, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
}

const workouts = workoutPayloads(weightliftingProgram);
const workoutIds = new Set(workouts.map((workout) => workout.id));
const existingDocs = await listDocuments("programs/default/workouts");
const staleDocIds = existingDocs.map(documentId).filter((id) => !workoutIds.has(id));
const writes = [
  ...workouts.map((workout) => writeDocument(`programs/default/workouts/${workout.id}`, workout)),
  ...(deleteStale ? staleDocIds.map((id) => deleteDocument(`programs/default/workouts/${id}`)) : []),
];

console.log(`${apply ? "Updating" : "Dry run:"} programs/default/workouts`);
console.log(`Prepared ${workouts.length} workout document write(s).`);
console.log(`Found ${existingDocs.length} existing workout document(s).`);
console.log(deleteStale
  ? `Will delete ${staleDocIds.length} stale document(s).`
  : `Will keep ${staleDocIds.length} stale document(s). Add --delete-stale with --apply to remove them.`);
console.log(JSON.stringify(workouts.slice(0, 3), null, 2));

if (!apply) {
  console.log("Run again with --apply to write the workout subcollection.");
  console.log("Optional: add --delete-stale to delete old workout docs that are not in programData.js.");
  process.exit(0);
}

for (let index = 0; index < writes.length; index += 450) {
  const chunk = writes.slice(index, index + 450);
  await batchWrite(chunk);
  console.log(`Applied ${Math.min(index + chunk.length, writes.length)}/${writes.length} write(s).`);
}

console.log("Done. programs/default/workouts was updated.");
