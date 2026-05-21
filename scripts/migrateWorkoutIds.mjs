const projectId = process.env.FIREBASE_PROJECT_ID || "flexx-management-dashboard";
const accessToken = process.env.FIRESTORE_ACCESS_TOKEN;
const database = "(default)";
const apply = process.argv.includes("--apply");

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

function firestoreValueToJs(value) {
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

function documentId(document) {
  return document.name.split("/").at(-1);
}

function createWorkoutId() {
  return globalThis.crypto?.randomUUID?.() || `workout-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function batchWrite(writes) {
  return firestoreRequest(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents:batchWrite`, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
}

const users = await listDocuments("users");
const migrations = [];

for (const userDoc of users) {
  const userId = documentId(userDoc);
  const workouts = await listDocuments(`users/${userId}/workouts`);
  workouts.forEach((workoutDoc) => {
    const oldId = documentId(workoutDoc);
    const nextId = createWorkoutId();
    const payload = {
      ...fieldsToJs(workoutDoc.fields),
      id: nextId,
      updatedAt: new Date().toISOString(),
    };
    delete payload[["lookup", "Key"].join("")];
    migrations.push({ userId, oldId, nextId, payload, oldName: workoutDoc.name });
  });
}

console.log(`${apply ? "Migrating" : "Dry run:"} ${migrations.length} workout document(s) across ${users.length} user(s).`);

if (!apply) {
  migrations.slice(0, 10).forEach((migration) => {
    console.log(`${migration.userId}: ${migration.oldId} -> ${migration.nextId}`);
  });
  if (migrations.length > 10) console.log(`...and ${migrations.length - 10} more.`);
  console.log("Run again with --apply to write changes.");
  process.exit(0);
}

for (let index = 0; index < migrations.length; index += 225) {
  const chunk = migrations.slice(index, index + 225);
  const writes = chunk.flatMap((migration) => [
    {
      update: {
        name: documentBase(`users/${migration.userId}/workouts/${migration.nextId}`),
        fields: jsToFields(migration.payload),
      },
    },
    {
      delete: migration.oldName,
    },
  ]);
  await batchWrite(writes);
  console.log(`Migrated ${Math.min(index + chunk.length, migrations.length)}/${migrations.length}.`);
}

console.log(`Done. Migrated ${migrations.length} workout document(s).`);
