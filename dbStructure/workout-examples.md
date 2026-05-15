# Workout Examples

These examples show one saved workout document for each workout type the frontend currently supports.

Firestore path:

```txt
users/{uid}/workouts/{workoutId}
```

## Strength

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
  ],

  notes: ""
}
```

## Running

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

## Rowing

```js
{
  date: "2026-05-14",
  workoutType: "rowing",
  completed: false,
  completedAt: null,

  loads: {
    "typed:rowing:distance": "2",
    "typed:rowing:distanceUnit": "km",
    "typed:rowing:duration:min": "8",
    "typed:rowing:duration:sec": "30",
    "typed:rowing:pace:min": "2",
    "typed:rowing:pace:sec": "7"
  },

  notes: ""
}
```

## Swimming

```js
{
  date: "2026-05-14",
  workoutType: "swimming",
  completed: false,
  completedAt: null,

  loads: {
    "typed:swimming:distance": "1",
    "typed:swimming:distanceUnit": "km",
    "typed:swimming:duration:min": "24",
    "typed:swimming:duration:sec": "0",
    "typed:swimming:pace:min": "2",
    "typed:swimming:pace:sec": "24",
    "typed:swimming:location": "pool"
  },

  notes: ""
}
```

## Biking

```js
{
  date: "2026-05-14",
  workoutType: "biking",
  completed: false,
  completedAt: null,

  loads: {
    "typed:biking:distance": "12",
    "typed:biking:distanceUnit": "mi",
    "typed:biking:duration:min": "45",
    "typed:biking:duration:sec": "0",
    "typed:biking:pace:min": "3",
    "typed:biking:pace:sec": "45",
    "typed:biking:surface": "pavement"
  },

  notes: ""
}
```

## Walking

```js
{
  date: "2026-05-14",
  workoutType: "walking",
  completed: false,
  completedAt: null,

  loads: {
    "typed:walking:distance": "2",
    "typed:walking:distanceUnit": "mi",
    "typed:walking:duration:min": "35",
    "typed:walking:duration:sec": "0",
    "typed:walking:pace:min": "17",
    "typed:walking:pace:sec": "30",
    "typed:walking:surface": "trail"
  },

  notes: ""
}
```

## Sport

```js
{
  date: "2026-05-14",
  workoutType: "sport",
  completed: false,
  completedAt: null,

  loads: {
    "typed:sport:duration:min": "60",
    "typed:sport:duration:sec": "0"
  },

  notes: "Pickup basketball"
}
```
