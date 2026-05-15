# Custom Workouts

Custom workouts are individual workouts created directly on a day. They should not carry program metadata unless they are intentionally linked to a program.

Firestore path:

```txt
users/{uid}/workouts/{workoutId}
```

Recommended `workoutId`:

```txt
YYYY-MM-DD:custom
```

## Root Fields

| Field | Meaning |
|---|---|
| `date` | The date the workout happened or is scheduled for, formatted as `YYYY-MM-DD`. |
| `workoutType` | The layout/category used to render the workout, such as `strength`, `running`, `rowing`, `swimming`, `biking`, `walking`, `sport`, or `mobility`. |
| `completed` | Whether the whole workout is completed. |
| `completedAt` | Timestamp for when the whole workout was completed. This can be `null` or omitted until completion. |
| `loads` | Logged workout values. For non-strength workouts, this is where the current frontend saves typed fields like distance, duration, pace, and surface. |
| `notes` | Optional session notes. |

## Strength Example

```js
{
  date: "2026-05-14",
  workoutType: "strength",
  completed: false,
  completedAt: null,

  warmup: [
    {
      name: "Band Pull Aparts",
      notes: "2 easy sets"
    }
  ],

  exercises: [
    {
      id: "bench-press",
      name: "Bench Press",
      notes: "",
      sets: [
        {
          reps: 8,
          weight: 135,
          weightUnit: "lb",
          completed: true
        },
        {
          reps: 8,
          weight: 145,
          weightUnit: "lb",
          completed: false
        }
      ]
    }
  ]
}
```

## Running Example

```js
{
  date: "2026-05-14",
  workoutType: "running",
  completed: false,
  completedAt: null,

  loads: {
    "typed:running:distance": "3",
    "typed:running:distanceUnit": "mi",
    "typed:running:duration:min": "27",
    "typed:running:duration:sec": "0",
    "typed:running:pace:min": "9",
    "typed:running:pace:sec": "0",
    "typed:running:surface": "pavement"
  },

  notes: ""
}
```

## Important Rule

For custom workouts, avoid storing program-only fields like `programId`, `programWeek`, `week`, `focus`, and `workoutFocus`.
