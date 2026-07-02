export const weightliftingProgram = {
  "id": "default",
  "name": "9-week weightlifting program",
  "details": "Nine-week Olympic lifting meet prep",
  "scheduleMode": "fixed",
  "weeks": [
    {
      "week": 1,
      "phase": "Accumulation",
      "notes": "",
      "workouts": [
        {
          "id": "week-1-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Work to 82%, then 3x2. Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": null
                  },
                  "target": "work to"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": null
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": null
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": null
                  }
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 5,
                  "percentageRange": {
                    "min": 72,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 5,
                  "percentageRange": {
                    "min": 72,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 5,
                  "percentageRange": {
                    "min": 72,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 5,
                  "percentageRange": {
                    "min": 72,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 5,
                  "percentageRange": {
                    "min": 72,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-1-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 7 sets"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-1-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Fast, crisp, easy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Speed and footwork",
              "sets": [
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Tempo/pause optional",
              "sets": [
                {
                  "reps": "3-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-1-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": null
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": null
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Leave one rep in tank",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 2,
      "phase": "Accumulation",
      "notes": "",
      "workouts": [
        {
          "id": "week-2-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Work to 84%, then 4x2. Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 84,
                    "max": null
                  },
                  "target": "work to"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 76,
                    "max": 78
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 76,
                    "max": 78
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 76,
                    "max": 78
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 76,
                    "max": 78
                  }
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 4,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-2-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                },
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                },
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                },
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                },
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                },
                {
                  "reps": "2 Cleans + 1 Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "2 Cleans + 1 Jerk x 6 sets"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 75,
                    "max": 78
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-2-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Fast, crisp, easy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "7 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Speed and footwork",
              "sets": [
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Tempo/pause optional",
              "sets": [
                {
                  "reps": "3-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-2-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 86,
                    "max": 88
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 86,
                    "max": 88
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Leave one rep in tank",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 80,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 80,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 80,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 80,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 3,
      "phase": "Accumulation",
      "notes": "",
      "workouts": [
        {
          "id": "week-3-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": null
                  },
                  "target": "work to"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  }
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  }
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "snatch"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 82
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-3-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                },
                {
                  "reps": "Clean + Jerk",
                  "percentageRange": {
                    "min": 70,
                    "max": 80
                  },
                  "target": "Clean + Jerk x 6-7 sets"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 90,
                    "max": 105,
                    "of": "clean"
                  },
                  "target": "3 x 3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 78,
                    "max": 80
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-3-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Fast, crisp, easy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "6 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Speed and footwork",
              "sets": [
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                },
                {
                  "reps": "2+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5-6 x 2+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Tempo/pause optional",
              "sets": [
                {
                  "reps": "3-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-3-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 88,
                    "max": null
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Meet rhythm",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 88,
                    "max": null
                  },
                  "target": "daily heavy"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Leave one rep in tank",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 84
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 84
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 84
                  },
                  "target": "Moderate-heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 84
                  },
                  "target": "Moderate-heavy"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 4,
      "phase": "Intensification",
      "notes": "",
      "workouts": [
        {
          "id": "week-4-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 82,
                    "max": 85
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 82,
                    "max": 85
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 82,
                    "max": 85
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 82,
                    "max": 85
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 3,
                  "percentageRange": {
                    "min": 82,
                    "max": 85
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-4-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 83
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 83
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 83
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 83
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 83
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-4-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Recovery speed",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Sharp footwork",
              "sets": [
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Footwork and lockout",
              "sets": [
                {
                  "reps": "4-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-4-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 88,
                    "max": 90
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 88,
                    "max": 90
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Maintain strength",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 5,
      "phase": "Intensification",
      "notes": "",
      "workouts": [
        {
          "id": "week-5-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-5-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 83,
                    "max": 86
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 83,
                    "max": 86
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 83,
                    "max": 86
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 83,
                    "max": 86
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-5-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Recovery speed",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Sharp footwork",
              "sets": [
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Footwork and lockout",
              "sets": [
                {
                  "reps": "4-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-5-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": null
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": null
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Maintain strength",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 6,
      "phase": "Intensification",
      "notes": "",
      "workouts": [
        {
          "id": "week-6-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 82,
                    "max": 88
                  },
                  "target": "6-8 singles"
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 87,
                    "max": 90
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 87,
                    "max": 90
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 87,
                    "max": 90
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-6-tuesday-c-j-volume-front-squat",
          "day": "Tuesday",
          "focus": "C&J Volume + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Repeatable timing",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 78,
                    "max": 85
                  },
                  "target": "5-7 singles or 1+1 complexes"
                }
              ]
            },
            {
              "id": "clean-pull",
              "name": "Clean Pull",
              "note": "Same start as clean",
              "sets": [
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                },
                {
                  "reps": "2-3",
                  "percentageRange": {
                    "min": 100,
                    "max": 110
                  },
                  "target": "3 x 2-3"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Strong rack position",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 85,
                    "max": 88
                  },
                  "target": "Heavy"
                }
              ]
            }
          ]
        },
        {
          "id": "week-6-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Recovery speed",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 65,
                    "max": 72
                  },
                  "target": "5-6 x 2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Sharp footwork",
              "sets": [
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 75
                  },
                  "target": "5 x 1+1"
                }
              ]
            },
            {
              "id": "jerk-skill",
              "name": "Jerk Skill",
              "note": "Footwork and lockout",
              "sets": [
                {
                  "reps": "4-5 sets",
                  "target": "Light-moderate"
                }
              ]
            }
          ]
        },
        {
          "id": "week-6-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": 92
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Stop while sharp",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": 92
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Maintain strength",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 7,
      "phase": "Peak",
      "notes": "",
      "workouts": [
        {
          "id": "week-7-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 100,
                    "max": 105
                  },
                  "target": "2 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 100,
                    "max": 105
                  },
                  "target": "2 x 2"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                }
              ]
            }
          ]
        },
        {
          "id": "week-7-tuesday-c-j-sharpening-front-squat",
          "day": "Tuesday",
          "focus": "C&J Sharpening + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Jerk confidence",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Easy heavy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                }
              ]
            }
          ]
        },
        {
          "id": "week-7-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Very easy",
              "sets": [
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Very easy",
              "sets": [
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                }
              ]
            }
          ]
        },
        {
          "id": "week-7-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Near opener/second attempt feel",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": 92
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Near opener/second attempt feel",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 90,
                    "max": 92
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Do not create soreness",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": 82
                  },
                  "target": "2 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": 82
                  },
                  "target": "2 x 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 8,
      "phase": "Peak",
      "notes": "",
      "workouts": [
        {
          "id": "week-8-monday-heavy-snatch-back-squat",
          "day": "Monday",
          "focus": "Heavy Snatch + Back Squat",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Clean reps only",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "5-6 singles"
                }
              ]
            },
            {
              "id": "snatch-pull",
              "name": "Snatch Pull",
              "note": "Stay over bar; finish tall",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 100,
                    "max": 105
                  },
                  "target": "2 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 100,
                    "max": 105
                  },
                  "target": "2 x 2"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "No grinding",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 82,
                    "max": 87
                  },
                  "target": "3 x 2"
                }
              ]
            }
          ]
        },
        {
          "id": "week-8-tuesday-c-j-sharpening-front-squat",
          "day": "Tuesday",
          "focus": "C&J Sharpening + Front Squat",
          "exercises": [
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Jerk confidence",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 85,
                    "max": 90
                  },
                  "target": "4-5 singles"
                }
              ]
            },
            {
              "id": "front-squat",
              "name": "Front Squat",
              "note": "Easy heavy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 80,
                    "max": 85
                  },
                  "target": "2-3 x 2"
                }
              ]
            }
          ]
        },
        {
          "id": "week-8-wednesday-technical-speed",
          "day": "Wednesday",
          "focus": "Technical / Speed",
          "exercises": [
            {
              "id": "power-snatch",
              "name": "Power Snatch",
              "note": "Very easy",
              "sets": [
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                },
                {
                  "reps": "1-2",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4-5 x 1-2"
                }
              ]
            },
            {
              "id": "power-clean-power-jerk",
              "name": "Power Clean + Power Jerk",
              "note": "Very easy",
              "sets": [
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                },
                {
                  "reps": "1+1",
                  "percentageRange": {
                    "min": 65,
                    "max": 70
                  },
                  "target": "4 x 1+1"
                }
              ]
            }
          ]
        },
        {
          "id": "week-8-friday-competition-day",
          "day": "Friday",
          "focus": "Competition Day",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Near opener/second attempt feel",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 92,
                    "max": 93
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Near opener/second attempt feel",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 92,
                    "max": 93
                  },
                  "target": "daily heavy single"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Do not create soreness",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": 82
                  },
                  "target": "2 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 75,
                    "max": 82
                  },
                  "target": "2 x 2"
                }
              ]
            }
          ]
        }
      ]
    },
    {
      "week": 9,
      "phase": "Taper",
      "notes": "",
      "workouts": [
        {
          "id": "week-9-monday-sharp-easy",
          "day": "Monday",
          "focus": "Sharp + Easy",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "Speed and confidence",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "Speed and confidence",
              "sets": [
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                },
                {
                  "reps": 1,
                  "percentageRange": {
                    "min": 75,
                    "max": 80
                  },
                  "target": "3-4 singles"
                }
              ]
            },
            {
              "id": "back-squat",
              "name": "Back Squat",
              "note": "Easy",
              "sets": [
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "2 x 2"
                },
                {
                  "reps": 2,
                  "percentageRange": {
                    "min": 70,
                    "max": 75
                  },
                  "target": "2 x 2"
                }
              ]
            }
          ]
        },
        {
          "id": "week-9-tuesday-openers",
          "day": "Tuesday",
          "focus": "Openers",
          "exercises": [
            {
              "id": "snatch",
              "name": "Snatch",
              "note": "No misses",
              "sets": [
                {
                  "reps": 1,
                  "target": "opener"
                }
              ]
            },
            {
              "id": "clean-and-jerk",
              "name": "Clean & Jerk",
              "note": "No misses",
              "sets": [
                {
                  "reps": 1,
                  "target": "opener"
                }
              ]
            }
          ]
        },
        {
          "id": "week-9-wednesday-light-movement",
          "day": "Wednesday",
          "focus": "Light Movement",
          "exercises": [
            {
              "id": "technique-bar-work",
              "name": "Technique bar work",
              "note": "Feel good only",
              "sets": [
                {
                  "reps": "15-25 minutes",
                  "target": "Very light"
                }
              ]
            }
          ]
        },
        {
          "id": "week-9-friday-rest",
          "day": "Friday",
          "focus": "Rest",
          "exercises": [
            {
              "id": "rest-travel-mobility",
              "name": "Rest / Travel / Mobility",
              "note": "No fatigue",
              "sets": [
                {
                  "reps": "Optional easy mobility",
                  "target": "None"
                }
              ]
            }
          ]
        },
        {
          "id": "week-9-saturday-competition",
          "day": "Saturday",
          "focus": "Competition",
          "exercises": [
            {
              "id": "meet-day",
              "name": "Meet Day",
              "note": "Trust the prep",
              "sets": [
                {
                  "reps": "Execute attempts",
                  "target": "Competition"
                }
              ]
            }
          ]
        }
      ]
    }
  ]
};

export const importedProgramMeta = {
  id: weightliftingProgram.id,
  name: weightliftingProgram.name,
  details: weightliftingProgram.details,
  scheduleMode: weightliftingProgram.scheduleMode,
};

const workoutDayOffsets = {
  Monday: 0,
  Tuesday: 1,
  Wednesday: 2,
  Thursday: 3,
  Friday: 4,
  Saturday: 5,
  Sunday: 6,
};

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function templateWorkoutDate(week, workout) {
  return addDays("2026-05-11", ((week.week || 1) - 1) * 7 + (workoutDayOffsets[workout.day] || 0));
}

function setPercentageLabel(percentageRange) {
  if (!percentageRange) return "";
  const high = percentageRange.max ? `-${percentageRange.max}` : "";
  const of = percentageRange.of ? ` of ${percentageRange.of}` : "";
  return `${percentageRange.min}${high}%${of}`;
}

function exercisePrescription(exercise) {
  const sets = exercise.sets || [];
  if (!sets.length) return "";
  const reps = sets[0]?.reps || "set";
  return `${sets.length} x ${reps}`;
}

export const importedProgram = weightliftingProgram.weeks.flatMap((week) => (
  week.workouts.flatMap((workout) => (
    workout.exercises.map((exercise) => ({
      id: exercise.id,
      week: week.week,
      date: templateWorkoutDate(week, workout),
      phase: week.phase,
      day: workout.day,
      focus: workout.focus,
      exercise: exercise.name,
      prescription: exercisePrescription(exercise),
      notes: exercise.note || "",
      sets: exercise.sets || [],
    }))
  ))
));
