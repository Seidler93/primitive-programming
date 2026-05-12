import { importedProgram, importedProgramMeta } from "../src/data/programData.js";

const projectId = process.env.FIREBASE_PROJECT_ID || "flexx-management-dashboard";
const accessToken = process.env.FIRESTORE_ACCESS_TOKEN;
const database = "(default)";

if (!accessToken) {
  throw new Error("Set FIRESTORE_ACCESS_TOKEN to a Google OAuth token with Firestore write access.");
}

function firestoreValue(value) {
  if (value === null || value === undefined) return { nullValue: null };
  if (Array.isArray(value)) return { arrayValue: { values: value.map(firestoreValue) } };
  if (typeof value === "boolean") return { booleanValue: value };
  if (typeof value === "number") return Number.isInteger(value) ? { integerValue: value } : { doubleValue: value };
  if (typeof value === "object") {
    return {
      mapValue: {
        fields: Object.fromEntries(Object.entries(value).map(([key, nestedValue]) => [key, firestoreValue(nestedValue)])),
      },
    };
  }
  return { stringValue: String(value) };
}

function firestoreFields(payload) {
  return Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, firestoreValue(value)]));
}

function documentName(path) {
  return `projects/${projectId}/databases/${database}/documents/${path}`;
}

const now = new Date().toISOString();
const programPayload = {
  ...importedProgramMeta,
  athleteEmail: "",
  description: "Nine-week Olympic lifting meet prep with snatch, clean and jerk, squats, pulls, taper, and meet-day prep.",
  createdAt: now,
  updatedAt: now,
};

const writes = [
  {
    update: {
      name: documentName(`programs/${importedProgramMeta.id}`),
      fields: firestoreFields(programPayload),
    },
  },
  ...importedProgram.map((workout) => ({
    update: {
      name: documentName(`programs/${importedProgramMeta.id}/workouts/${workout.id}`),
      fields: firestoreFields({
        ...workout,
        programId: importedProgramMeta.id,
        phase: workout.phase || importedProgramMeta.name,
        updatedAt: now,
      }),
    },
  })),
];

for (let index = 0; index < writes.length; index += 450) {
  const chunk = writes.slice(index, index + 450);
  const response = await fetch(`https://firestore.googleapis.com/v1/projects/${projectId}/databases/${database}/documents:batchWrite`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ writes: chunk }),
  });
  const result = await response.json();
  if (!response.ok) {
    throw new Error(JSON.stringify(result, null, 2));
  }
}

console.log(`Seeded ${importedProgramMeta.name} with ${importedProgram.length} workout rows.`);
