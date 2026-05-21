import { weightliftingProgram } from "../src/data/programData.js";

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

const programPayload = {
  id: weightliftingProgram.id,
  name: weightliftingProgram.name,
  details: weightliftingProgram.details,
  scheduleMode: weightliftingProgram.scheduleMode,
  weeks: weightliftingProgram.weeks,
  updatedAt: new Date().toISOString(),
};

const updateMask = Object.keys(programPayload);

console.log(`${apply ? "Updating" : "Dry run:"} programs/default`);
console.log(JSON.stringify(programPayload, null, 2));
console.log("This updates only the programs/default document. The workouts subcollection is left unchanged.");

if (!apply) {
  console.log("Run again with --apply to write this structure to Firestore.");
  process.exit(0);
}

await firestoreRequest(`${restUrl("programs/default")}?${updateMask.map((field) => `updateMask.fieldPaths=${encodeURIComponent(field)}`).join("&")}`, {
  method: "PATCH",
  body: JSON.stringify({
    name: documentBase("programs/default"),
    fields: jsToFields(programPayload),
  }),
});

console.log("Done. programs/default was updated.");
