const byWeek = [
  {
    week: 1,
    phase: "Accumulation",
    start: "2026-05-11",
    monday: ["Work to 82%, then 3 x 2 @ 75%", "3 x 3", "5 x 5 @ 72-75%"],
    tuesday: ["Clean + Jerk x 7 sets", "3 x 3", "4 x 4 @ 70-75%"],
    wednesday: ["6 x 2", "5-6 x 2+1", "3-5 sets"],
    friday: ["Daily heavy to 85%", "Daily heavy to 85%", "3 x 3 @ 78-80%"],
  },
  {
    week: 2,
    phase: "Accumulation",
    start: "2026-05-18",
    monday: ["Work to 84%, then 4 x 2 @ 76-78%", "3 x 3", "5 x 4 @ 75-78%"],
    tuesday: ["2 Cleans + 1 Jerk x 6 sets", "3 x 3", "5 x 3 @ 75-78%"],
    wednesday: ["7 x 2", "5-6 x 2+1", "3-5 sets"],
    friday: ["Daily heavy to 86-88%", "Daily heavy to 86-88%", "4 x 3 @ 80-82%"],
  },
  {
    week: 3,
    phase: "Accumulation",
    start: "2026-05-25",
    monday: ["Work to 85%, then 3 x 2 @ 78-80%", "3 x 3", "5 x 3 @ 78-82%"],
    tuesday: ["Clean + Jerk x 6-7 sets", "3 x 3", "5 x 3 @ 78-80%"],
    wednesday: ["6 x 2", "5-6 x 2+1", "3-5 sets"],
    friday: ["Daily heavy to 88%", "Daily heavy to 88%", "4 x 2 @ 82-84%"],
  },
  {
    week: 4,
    phase: "Intensification",
    start: "2026-06-01",
    monday: ["6-8 singles", "3 x 2-3", "5 x 3 @ 82-85%"],
    tuesday: ["5-7 singles or 1+1 complexes", "3 x 2-3", "5 x 2 @ 80-83%"],
    wednesday: ["5-6 x 2", "5 x 1+1", "4-5 sets"],
    friday: ["Daily heavy single", "Daily heavy single", "3 x 2"],
  },
  {
    week: 5,
    phase: "Intensification",
    start: "2026-06-08",
    monday: ["6-8 singles", "3 x 2-3", "4 x 2 @ 85-88%"],
    tuesday: ["5-7 singles or 1+1 complexes", "3 x 2-3", "4 x 2 @ 83-86%"],
    wednesday: ["5-6 x 2", "5 x 1+1", "4-5 sets"],
    friday: ["Daily heavy single", "Daily heavy single", "3 x 2"],
  },
  {
    week: 6,
    phase: "Intensification",
    start: "2026-06-15",
    monday: ["6-8 singles", "3 x 2-3", "3 x 2 @ 87-90%"],
    tuesday: ["5-7 singles or 1+1 complexes", "3 x 2-3", "3 x 2 @ 85-88%"],
    wednesday: ["5-6 x 2", "5 x 1+1", "4-5 sets"],
    friday: ["Daily heavy single", "Daily heavy single", "3 x 2"],
  },
  {
    week: 7,
    phase: "Peak",
    start: "2026-06-22",
    monday: ["5-6 singles", "2 x 2", "3 x 2"],
    tuesday: ["4-5 singles", "2-3 x 2"],
    wednesday: ["4-5 x 1-2", "4 x 1+1"],
    friday: ["Daily heavy single", "Daily heavy single", "2 x 2"],
  },
  {
    week: 8,
    phase: "Peak",
    start: "2026-06-29",
    monday: ["5-6 singles", "2 x 2", "3 x 2"],
    tuesday: ["4-5 singles", "2-3 x 2"],
    wednesday: ["4-5 x 1-2", "4 x 1+1"],
    friday: ["Daily heavy single", "Daily heavy single", "2 x 2"],
  },
];

export const importedProgramMeta = {
  id: "default",
  name: "9-week weightlifting program",
  goal: "Nine-week Olympic lifting meet prep",
  scheduleMode: "fixed",
  status: "idle",
};

const templates = {
  monday: {
    offset: 0,
    day: "Monday",
    focus: "Heavy Snatch + Back Squat",
    exercises: ["Snatch", "Snatch Pull", "Back Squat"],
    notes: ["Clean reps only", "Stay over bar; finish tall", "No grinding"],
    intensity: (week) =>
      week < 4 ? ["75-85%", "90-105% of snatch", "Moderate-heavy"]
        : week < 7 ? ["82-88%", "100-110%", "Heavy"]
          : ["85-90%", "100-105%", "82-87%"],
  },
  tuesday: {
    offset: 1,
    day: "Tuesday",
    focus: (week) => (week < 7 ? "C&J Volume + Front Squat" : "C&J Sharpening + Front Squat"),
    exercises: (week) => (week < 7 ? ["Clean & Jerk", "Clean Pull", "Front Squat"] : ["Clean & Jerk", "Front Squat"]),
    notes: (week) => (week < 7 ? ["Repeatable timing", "Same start as clean", "Strong rack position"] : ["Jerk confidence", "Easy heavy"]),
    intensity: (week) =>
      week < 4 ? ["70-80%", "90-105% of clean", "Moderate-heavy"]
        : week < 7 ? ["78-85%", "100-110%", "Heavy"]
          : ["85-90%", "80-85%"],
  },
  wednesday: {
    offset: 2,
    day: "Wednesday",
    focus: "Technical / Speed",
    exercises: (week) => (week < 7 ? ["Power Snatch", "Power Clean + Power Jerk", "Jerk Skill"] : ["Power Snatch", "Power Clean + Power Jerk"]),
    notes: (week) => (week < 4 ? ["Fast, crisp, easy", "Speed and footwork", "Tempo/pause optional"] : week < 7 ? ["Recovery speed", "Sharp footwork", "Footwork and lockout"] : ["Very easy", "Very easy"]),
    intensity: (week) => (week < 7 ? ["65-72%", "65-75%", "Light-moderate"] : ["65-70%", "65-70%"]),
  },
  friday: {
    offset: 4,
    day: "Friday",
    focus: "Competition Day",
    exercises: ["Snatch", "Clean & Jerk", "Back Squat"],
    notes: (week) => (week < 4 ? ["Meet rhythm", "Meet rhythm", "Leave one rep in tank"] : week < 7 ? ["Stop while sharp", "Stop while sharp", "Maintain strength"] : ["Near opener/second attempt feel", "Near opener/second attempt feel", "Do not create soreness"]),
    intensity: (week) => {
      if (week < 4) return ["80-88%", "80-88%", "Moderate-heavy"];
      if (week === 4) return ["88-90%", "88-90%", "82-87%"];
      if (week === 5) return ["90%", "90%", "82-87%"];
      if (week === 6) return ["90-92%", "90-92%", "82-87%"];
      if (week === 7) return ["90-92%", "90-92%", "75-82%"];
      return ["92-93% if sharp", "92-93% if sharp", "75-82%"];
    },
  },
};

function addDays(date, days) {
  const next = new Date(`${date}T00:00:00`);
  next.setDate(next.getDate() + days);
  return next.toISOString().slice(0, 10);
}

function items(value, week) {
  return typeof value === "function" ? value(week) : value;
}

export const importedProgram = byWeek.flatMap((week) =>
  Object.entries(templates).flatMap(([key, template]) => {
    const exercises = items(template.exercises, week.week);
    return exercises.map((exercise, index) => ({
      id: `mock-${week.week}-${key}-${index}`,
      week: week.week,
      date: addDays(week.start, template.offset),
      phase: week.phase,
      day: template.day,
      focus: items(template.focus, week.week),
      exercise,
      prescription: week[key][index],
      intensity: items(template.intensity, week.week)[index],
      notes: items(template.notes, week.week)[index],
    }));
  }),
).concat([
  { id: "mock-9-mon-0", week: 9, date: "2026-07-06", phase: "Taper", day: "Monday", focus: "Sharp + Easy", exercise: "Snatch", prescription: "3-4 singles", intensity: "75-80%", notes: "Speed and confidence" },
  { id: "mock-9-mon-1", week: 9, date: "2026-07-06", phase: "Taper", day: "Monday", focus: "Sharp + Easy", exercise: "Clean & Jerk", prescription: "3-4 singles", intensity: "75-80%", notes: "Speed and confidence" },
  { id: "mock-9-mon-2", week: 9, date: "2026-07-06", phase: "Taper", day: "Monday", focus: "Sharp + Easy", exercise: "Back Squat", prescription: "2 x 2", intensity: "70-75%", notes: "Easy" },
  { id: "mock-9-tue-0", week: 9, date: "2026-07-07", phase: "Taper", day: "Tuesday", focus: "Openers", exercise: "Snatch", prescription: "Work to opener", intensity: "Opener", notes: "No misses" },
  { id: "mock-9-tue-1", week: 9, date: "2026-07-07", phase: "Taper", day: "Tuesday", focus: "Openers", exercise: "Clean & Jerk", prescription: "Work to opener", intensity: "Opener", notes: "No misses" },
  { id: "mock-9-wed-0", week: 9, date: "2026-07-08", phase: "Taper", day: "Wednesday", focus: "Light Movement", exercise: "Technique bar work", prescription: "15-25 minutes", intensity: "Very light", notes: "Feel good only" },
  { id: "mock-9-fri-0", week: 9, date: "2026-07-10", phase: "Taper", day: "Friday", focus: "Rest", exercise: "Rest / Travel / Mobility", prescription: "Optional easy mobility", intensity: "None", notes: "No fatigue" },
  { id: "mock-9-sat-0", week: 9, date: "2026-07-11", phase: "Taper", day: "Saturday", focus: "Competition", exercise: "Meet Day", prescription: "Execute attempts", intensity: "Competition", notes: "Trust the prep" },
]);
