const commonTags = {
  hinge: ["posterior chain", "hamstrings"],
  squat: ["legs", "knee bend"],
  pull: ["posterior chain", "olympic accessory"],
  olympic: ["weightlifting", "power"],
  press: ["upper body", "strength"],
  upper: ["upper body", "pulling"],
  "single-leg": ["legs", "balance"],
  glutes: ["posterior chain", "accessory"],
  core: ["trunk", "accessory"],
  cardio: ["conditioning"],
};

function exercise(entry) {
  return {
    aliases: [],
    equipment: [],
    tags: commonTags[entry.category] || [],
    ...entry,
  };
}

export const exerciseLibrary = [
  exercise({ name: "Romanian Deadlift", aliases: ["rdl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Barbell Romanian Deadlift", aliases: ["barbell rdl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Dumbbell Romanian Deadlift", aliases: ["db rdl", "dumbbell rdl"], category: "hinge", equipment: ["dumbbells"] }),
  exercise({ name: "Kettlebell Romanian Deadlift", aliases: ["kb rdl"], category: "hinge", equipment: ["kettlebell"] }),
  exercise({ name: "Single Leg Romanian Deadlift", aliases: ["single leg rdl", "sl rdl"], category: "hinge", equipment: ["dumbbells"] }),
  exercise({ name: "B-Stance Romanian Deadlift", aliases: ["b stance rdl", "kickstand rdl"], category: "hinge", equipment: ["barbell", "dumbbells"] }),
  exercise({ name: "Snatch Grip Romanian Deadlift", aliases: ["snatch grip rdl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Tempo Romanian Deadlift", aliases: ["tempo rdl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Deficit Romanian Deadlift", aliases: ["deficit rdl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Good Morning", aliases: ["gm"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Back Extension", aliases: ["hyperextension"], category: "hinge", equipment: ["machine"] }),
  exercise({ name: "Back Squat", aliases: ["squat"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Front Squat", aliases: ["fs"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Pause Back Squat", aliases: ["paused squat"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Tempo Back Squat", aliases: ["tempo squat"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Overhead Squat", aliases: ["ohs"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Goblet Squat", aliases: ["kb squat"], category: "squat", equipment: ["dumbbell", "kettlebell"] }),
  exercise({ name: "Box Squat", aliases: ["squat to box"], category: "squat", equipment: ["barbell"] }),
  exercise({ name: "Deadlift", aliases: ["dl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Trap Bar Deadlift", aliases: ["hex bar deadlift"], category: "hinge", equipment: ["trap bar"] }),
  exercise({ name: "Sumo Deadlift", aliases: ["sumo dl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Clean Deadlift", aliases: ["clean dl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Snatch Deadlift", aliases: ["snatch dl"], category: "hinge", equipment: ["barbell"] }),
  exercise({ name: "Clean Pull", aliases: ["clean high pull"], category: "pull", equipment: ["barbell"] }),
  exercise({ name: "Snatch Pull", aliases: ["snatch high pull"], category: "pull", equipment: ["barbell"] }),
  exercise({ name: "Clean High Pull", aliases: [], category: "pull", equipment: ["barbell"] }),
  exercise({ name: "Snatch High Pull", aliases: [], category: "pull", equipment: ["barbell"] }),
  exercise({ name: "Snatch", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Power Snatch", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Hang Snatch", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Block Snatch", aliases: [], category: "olympic", equipment: ["barbell", "blocks"] }),
  exercise({ name: "Muscle Snatch", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Clean and Jerk", aliases: ["c&j", "cj"], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Clean", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Power Clean", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Hang Clean", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Block Clean", aliases: [], category: "olympic", equipment: ["barbell", "blocks"] }),
  exercise({ name: "Jerk", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Split Jerk", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Push Jerk", aliases: [], category: "olympic", equipment: ["barbell"] }),
  exercise({ name: "Push Press", aliases: [], category: "press", equipment: ["barbell"] }),
  exercise({ name: "Strict Press", aliases: ["ohp"], category: "press", equipment: ["barbell"] }),
  exercise({ name: "Bench Press", aliases: ["bench"], category: "press", equipment: ["barbell"] }),
  exercise({ name: "Close Grip Bench Press", aliases: ["cgbp"], category: "press", equipment: ["barbell"] }),
  exercise({ name: "Dumbbell Bench Press", aliases: ["db bench"], category: "press", equipment: ["dumbbells"] }),
  exercise({ name: "Dumbbell Shoulder Press", aliases: ["db press"], category: "press", equipment: ["dumbbells"] }),
  exercise({ name: "Pull-Up", aliases: ["pullup"], category: "upper", equipment: ["pull-up bar"] }),
  exercise({ name: "Chin-Up", aliases: ["chinup"], category: "upper", equipment: ["pull-up bar"] }),
  exercise({ name: "Lat Pulldown", aliases: ["pulldown"], category: "upper", equipment: ["cable"] }),
  exercise({ name: "Bent Over Row", aliases: ["barbell row"], category: "upper", equipment: ["barbell"] }),
  exercise({ name: "Dumbbell Row", aliases: ["db row"], category: "upper", equipment: ["dumbbell"] }),
  exercise({ name: "Chest Supported Row", aliases: ["seal row"], category: "upper", equipment: ["dumbbells", "machine"] }),
  exercise({ name: "Walking Lunge", aliases: ["lunges"], category: "single-leg", equipment: ["bodyweight", "dumbbells"] }),
  exercise({ name: "Bulgarian Split Squat", aliases: ["bss"], category: "single-leg", equipment: ["bodyweight", "dumbbells"] }),
  exercise({ name: "Step-Up", aliases: ["step up"], category: "single-leg", equipment: ["box", "dumbbells"] }),
  exercise({ name: "Reverse Lunge", aliases: [], category: "single-leg", equipment: ["bodyweight", "dumbbells"] }),
  exercise({ name: "Hip Thrust", aliases: [], category: "glutes", equipment: ["barbell"] }),
  exercise({ name: "Glute Bridge", aliases: [], category: "glutes", equipment: ["bodyweight", "barbell"] }),
  exercise({ name: "Lateral Band Walk", aliases: ["band walks"], category: "glutes", equipment: ["band"] }),
  exercise({ name: "Plank", aliases: [], category: "core", equipment: ["bodyweight"] }),
  exercise({ name: "Side Plank", aliases: [], category: "core", equipment: ["bodyweight"] }),
  exercise({ name: "Hanging Leg Raise", aliases: ["hlr"], category: "core", equipment: ["pull-up bar"] }),
  exercise({ name: "Dead Bug", aliases: [], category: "core", equipment: ["bodyweight"] }),
  exercise({ name: "Pallof Press", aliases: [], category: "core", equipment: ["cable", "band"] }),
  exercise({ name: "Bike", aliases: ["air bike", "assault bike"], category: "cardio", equipment: ["bike"] }),
  exercise({ name: "Row", aliases: ["rower", "erg"], category: "cardio", equipment: ["rower"] }),
  exercise({ name: "Run", aliases: ["jog"], category: "cardio", equipment: ["bodyweight"] }),
  exercise({ name: "Ski Erg", aliases: ["skierg"], category: "cardio", equipment: ["ski erg"] }),
  exercise({ name: "Burpee", aliases: ["burpees"], category: "cardio", equipment: ["bodyweight"] }),
  exercise({ name: "Sled Push", aliases: ["prowler push"], category: "cardio", equipment: ["sled"] }),
];

export const exerciseSuggestions = [...new Set(exerciseLibrary.flatMap((exercise) => [
  exercise.name,
  ...exercise.aliases.map((alias) => `${alias.toUpperCase()} - ${exercise.name}`),
]))].sort();

export function similarExercises(name, limit = 8) {
  const query = name.toLowerCase();
  const match = exerciseLibrary.find((exercise) => (
    exercise.name.toLowerCase() === query || exercise.aliases.some((alias) => alias.toLowerCase() === query)
  ));
  if (!match) return [];

  return exerciseLibrary
    .filter((exercise) => exercise.name !== match.name)
    .map((exercise) => {
      const categoryScore = exercise.category === match.category ? 4 : 0;
      const tagScore = exercise.tags.filter((tag) => match.tags.includes(tag)).length;
      const equipmentScore = exercise.equipment.filter((item) => match.equipment.includes(item)).length;
      return { exercise, score: categoryScore + tagScore + equipmentScore };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.exercise.name.localeCompare(b.exercise.name))
    .slice(0, limit)
    .map((item) => item.exercise.name);
}
