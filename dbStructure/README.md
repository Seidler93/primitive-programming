# Database Structure Reference

This folder documents the intended Firestore shapes for user workout data.

Primary path:

```txt
users/{uid}/workouts/{workoutId}
```

Files:

- `custom-workouts.md`: intended shape for manually created workouts that are not tied to a program.
- `program-workouts.md`: intended extra fields for workouts that come from a program/template.
- `workout-type-fields.md`: workout-type-specific fields for strength, running, rowing, swimming, and similar workout layouts.
- `workout-examples.md`: one full saved document example for each currently supported workout type.
