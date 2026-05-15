# Workout Type Fields

Every workout should use `workoutType` to decide which frontend component/layout renders the workout. The root fields stay small, and the workout body changes based on the type.

## Always Available

| Field | Meaning |
|---|---|
| `date` | The date the workout happened or is scheduled for. |
| `workoutType` | The workout layout/type. |
| `completed` | Overall workout completion status. |
| `completedAt` | Timestamp for overall workout completion. |
| `loads` | Logged workout values. Metric workout pages currently save their typed fields here. |
| `notes` | Optional session notes. |

## Strength

| Field | Meaning |
|---|---|
| `warmup` | Warmup movements, prep notes, or activation work. |
| `exercises` | Strength exercises in the workout. |
| `exercises[].id` | Stable exercise id. |
| `exercises[].name` | Exercise name displayed to the user. |
| `exercises[].notes` | Optional exercise-level notes. |
| `exercises[].sets` | Set-by-set prescription and tracking. |
| `exercises[].sets[].reps` | Target or completed reps. |
| `exercises[].sets[].weight` | Target or completed weight. |
| `exercises[].sets[].weightUnit` | Unit for weight, such as `lb` or `kg`. |
| `exercises[].sets[].completed` | Whether that specific set is completed. |

## Running

| Field | Meaning |
|---|---|
| `distance` | Total run distance. |
| `distanceUnit` | Unit for distance, currently `mi` or `km`. |
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |
| `paceMin` | Pace minutes. |
| `paceSec` | Pace seconds. |
| `surface` | Surface type, currently `pavement`, `trail`, or `treadmill`. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `distance` | `loads["typed:running:distance"]` |
| `distanceUnit` | `loads["typed:running:distanceUnit"]` |
| `durationMin` | `loads["typed:running:duration:min"]` |
| `durationSec` | `loads["typed:running:duration:sec"]` |
| `paceMin` | `loads["typed:running:pace:min"]` |
| `paceSec` | `loads["typed:running:pace:sec"]` |
| `surface` | `loads["typed:running:surface"]` |

## Rowing

| Field | Meaning |
|---|---|
| `distance` | Total rowing distance. |
| `distanceUnit` | Unit for distance, currently `mi` or `km`. |
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |
| `paceMin` | Pace/split minutes. |
| `paceSec` | Pace/split seconds. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `distance` | `loads["typed:rowing:distance"]` |
| `distanceUnit` | `loads["typed:rowing:distanceUnit"]` |
| `durationMin` | `loads["typed:rowing:duration:min"]` |
| `durationSec` | `loads["typed:rowing:duration:sec"]` |
| `paceMin` | `loads["typed:rowing:pace:min"]` |
| `paceSec` | `loads["typed:rowing:pace:sec"]` |

## Swimming

| Field | Meaning |
|---|---|
| `distance` | Total swim distance. |
| `distanceUnit` | Unit for distance, currently `mi` or `km`. |
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |
| `paceMin` | Pace minutes. |
| `paceSec` | Pace seconds. |
| `location` | Swim location, currently `pool` or `open water`. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `distance` | `loads["typed:swimming:distance"]` |
| `distanceUnit` | `loads["typed:swimming:distanceUnit"]` |
| `durationMin` | `loads["typed:swimming:duration:min"]` |
| `durationSec` | `loads["typed:swimming:duration:sec"]` |
| `paceMin` | `loads["typed:swimming:pace:min"]` |
| `paceSec` | `loads["typed:swimming:pace:sec"]` |
| `location` | `loads["typed:swimming:location"]` |

## Biking

| Field | Meaning |
|---|---|
| `distance` | Total bike distance. |
| `distanceUnit` | Unit for distance, currently `mi` or `km`. |
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |
| `paceMin` | Pace/speed minutes. |
| `paceSec` | Pace/speed seconds. |
| `surface` | Surface type, currently `pavement`, `trail`, or `stationary`. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `distance` | `loads["typed:biking:distance"]` |
| `distanceUnit` | `loads["typed:biking:distanceUnit"]` |
| `durationMin` | `loads["typed:biking:duration:min"]` |
| `durationSec` | `loads["typed:biking:duration:sec"]` |
| `paceMin` | `loads["typed:biking:pace:min"]` |
| `paceSec` | `loads["typed:biking:pace:sec"]` |
| `surface` | `loads["typed:biking:surface"]` |

## Walking

| Field | Meaning |
|---|---|
| `distance` | Total walk distance. |
| `distanceUnit` | Unit for distance, currently `mi` or `km`. |
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |
| `paceMin` | Pace minutes. |
| `paceSec` | Pace seconds. |
| `surface` | Surface type, currently `pavement`, `trail`, or `treadmill`. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `distance` | `loads["typed:walking:distance"]` |
| `distanceUnit` | `loads["typed:walking:distanceUnit"]` |
| `durationMin` | `loads["typed:walking:duration:min"]` |
| `durationSec` | `loads["typed:walking:duration:sec"]` |
| `paceMin` | `loads["typed:walking:pace:min"]` |
| `paceSec` | `loads["typed:walking:pace:sec"]` |
| `surface` | `loads["typed:walking:surface"]` |

## Sport

| Field | Meaning |
|---|---|
| `durationMin` | Duration minutes. |
| `durationSec` | Duration seconds. |

Current frontend save keys in `loads`:

| Field | Saved key |
|---|---|
| `durationMin` | `loads["typed:sport:duration:min"]` |
| `durationSec` | `loads["typed:sport:duration:sec"]` |

## Other Types

Other workout types should follow the same pattern:

- Keep shared root fields small.
- Store typed fields from metric layouts in `loads` using `typed:{workoutType}:{field}` keys.
- For more detailed future layouts, put repeated type-specific data under clear collections like `segments`, `sets`, `exercises`, or `drills`.
- Track completion at the smallest useful unit, then also track overall workout completion at the root.
