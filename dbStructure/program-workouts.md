# Program Workouts

Program workouts are workouts generated from a program or template. They can use the same workout-type content fields as custom workouts, but they also keep enough root metadata to trace back to the program.

Firestore path:

```txt
users/{uid}/workouts/{workoutId}
```

Recommended `workoutId`:

```txt
YYYY-MM-DD
```

## Shared Root Fields

| Field | Meaning |
|---|---|
| `date` | The date the workout happened or is scheduled for, formatted as `YYYY-MM-DD`. |
| `workoutType` | The layout/category used to render the workout, such as `strength`, `running`, `rowing`, `swimming`, `cycling`, or `mobility`. |
| `completed` | Whether the whole workout is completed. |
| `completedAt` | Timestamp for when the whole workout was completed. This can be `null` or omitted until completion. |

## Program-Only Root Fields

| Field | Meaning |
|---|---|
| `programId` | The id of the program this workout belongs to. |
| `programWeek` | The week number/value from the program workout. |
| `week` | Display/program week value, often the same source as `programWeek`. |
| `workoutFocus` | The main programmed workout focus/title. |
| `focus` | The focus/title used for grouping or display. |

## Example

```js
{
  date: "2026-05-14",
  workoutType: "strength",
  completed: false,
  completedAt: null,

  programId: "hybrid-base",
  programWeek: 3,
  week: 3,
  workoutFocus: "Upper Strength",
  focus: "Upper Strength",

  warmup: [
    {
      name: "Shoulder Mobility",
      notes: "5 minutes"
    }
  ],

  exercises: [
    {
      id: "bench-press",
      name: "Bench Press",
      sets: [
        {
          reps: 8,
          weight: 135,
          weightUnit: "lb",
          completed: false
        }
      ]
    }
  ]
}
```

