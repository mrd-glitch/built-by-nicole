/* Phase A fixture data. Shapes mirror the Supabase schema in PLAN.md so the
   Phase B swap is a data-layer change, not a UI rewrite. */

export type ClientStatus = "active" | "paused" | "archived";

export interface Profile {
  id: string;
  fullName: string;
  firstName: string;
  email: string;
  timezone: string;
  status: ClientStatus;
  showMacros: boolean;
  showCalories: boolean;
  foodJournalEnabled: boolean;
  startWeightLbs: number;
  goalWeightLbs: number;
}

export interface Exercise {
  id: string;
  name: string;
  youtubeUrl: string | null;
  cue: string | null;
}

export interface BlockExercise {
  exerciseId: string;
  sets: number;
  repRange: string;
  targetWeightLbs: number | null;
  optional: boolean;
  optionalNote?: string;
}

export interface DayBlock {
  id: string;
  label: string; // "1)", "2) Superset"
  exercises: BlockExercise[]; // >1 = superset
  restNote?: string;
}

export interface ProgramDay {
  id: string;
  week: number;
  day: number;
  title: string;
  blocks: DayBlock[];
}

export interface ProgramVersion {
  id: string;
  programName: string; // "September 2026: 3x/week"
  days: ProgramDay[];
}

export interface SetEntry {
  dayId: string;
  exerciseId: string;
  setIndex: number;
  reps: number;
  weightLbs: number;
  loggedAt: string;
}

export interface MealItem {
  name: string;
  portion: string;
  protein?: number;
  carbs?: number;
  fats?: number;
  calories?: number;
}

export interface Meal {
  id: string;
  name: string;
  note?: string;
  items: MealItem[];
}

export interface MealPlanVersion {
  id: string;
  name: string;
  intro?: string;
  meals: Meal[];
  pdfName?: string;
}

export interface Checkin {
  id: string;
  isoWeek: string; // "2026-W34"
  weekLabel: string;
  submittedAt: string;
  dryWeightLbs: number;
  mealRating: number;
  mealNote: string;
  fitnessRating: number;
  fitnessNote: string;
  comments: string;
  proud?: string;
  excited?: string;
  photos: { pose: "front" | "side" | "back" }[];
}

export interface Message {
  id: string;
  from: "client" | "coach";
  body: string;
  at: string;
}

export interface Application {
  id: string;
  name: string;
  email: string;
  submittedAt: string;
  status: "new" | "approved" | "declined";
  goal: string;
  experience: string;
  daysPerWeek: number;
  equipment: string;
  injuries: string;
  nutritionHabits: string;
  lifestyle: string;
  snapshot: {
    goalType: string;
    suggestedSplit: string;
    frequency: string;
    platesTarget: string;
    redFlags: string[];
  };
}

/* ---------------- Demo client ---------------- */

export const demoClient: Profile = {
  id: "c-demo",
  fullName: "Sarah Mitchell",
  firstName: "Sarah",
  email: "sarah@example.com",
  timezone: "America/Edmonton",
  status: "active",
  showMacros: true,
  showCalories: false,
  foodJournalEnabled: true,
  startWeightLbs: 177,
  goalWeightLbs: 155,
};

export const exercises: Exercise[] = [
  { id: "ex-broad-jump", name: "Broad Jump", youtubeUrl: "https://www.youtube-nocookie.com/embed/96w1KDN_nGU", cue: "Land soft, stick it for two seconds." },
  { id: "ex-deadlift", name: "Deadlift Cluster Set", youtubeUrl: "https://www.youtube-nocookie.com/embed/op9kVnSso6Q", cue: "Brace before every pull. Rest 20s between mini-sets." },
  { id: "ex-hip-flexor", name: "Kneeling Hip Flexor Pulse with Pause", youtubeUrl: null, cue: "Squeeze the back glute the whole time." },
  { id: "ex-goblet-squat", name: "Goblet Squat", youtubeUrl: "https://www.youtube-nocookie.com/embed/MeIiIdhvXT4", cue: "Elbows inside the knees at the bottom." },
  { id: "ex-db-row", name: "Single Arm Dumbbell Row", youtubeUrl: "https://www.youtube-nocookie.com/embed/pYcpY20QaE8", cue: "Pull to the hip, not the armpit." },
  { id: "ex-pushup", name: "Push-Up (elevate if needed)", youtubeUrl: null, cue: "Body in one line. Elevate hands before you shorten range." },
];

export const currentProgram: ProgramVersion = {
  id: "pv-1",
  programName: "September 2026: 2x/week",
  days: [1, 2, 3, 4].map((n) => ({
    id: `day-${n}`,
    week: n <= 2 ? 1 : 2,
    day: n % 2 === 1 ? 1 : 2,
    title: "Full Body",
    blocks: [
      {
        id: `b-${n}-1`,
        label: "1) Power (optional)",
        exercises: [
          { exerciseId: "ex-broad-jump", sets: 3, repRange: "4-5", targetWeightLbs: null, optional: true, optionalNote: "For athletic performance. Swap or skip if needed." },
        ],
      },
      {
        id: `b-${n}-2`,
        label: "2) Superset",
        restNote: "Rest 90s after each round",
        exercises: [
          { exerciseId: "ex-deadlift", sets: 3, repRange: "2-2-2", targetWeightLbs: 135, optional: false },
          { exerciseId: "ex-hip-flexor", sets: 3, repRange: "10-12/leg", targetWeightLbs: null, optional: false },
        ],
      },
      {
        id: `b-${n}-3`,
        label: "3) Superset",
        restNote: "Rest 60s after each round",
        exercises: [
          { exerciseId: "ex-goblet-squat", sets: 3, repRange: "8-10", targetWeightLbs: 40, optional: false },
          { exerciseId: "ex-db-row", sets: 3, repRange: "10-12/side", targetWeightLbs: 30, optional: false },
        ],
      },
      {
        id: `b-${n}-4`,
        label: "4) Finisher",
        exercises: [
          { exerciseId: "ex-pushup", sets: 2, repRange: "AMRAP", targetWeightLbs: null, optional: false },
        ],
      },
    ],
  })),
};

export const lastEntries: SetEntry[] = [
  { dayId: "day-1", exerciseId: "ex-deadlift", setIndex: 0, reps: 6, weightLbs: 130, loggedAt: "2026-08-20" },
  { dayId: "day-1", exerciseId: "ex-goblet-squat", setIndex: 0, reps: 10, weightLbs: 35, loggedAt: "2026-08-20" },
  { dayId: "day-1", exerciseId: "ex-db-row", setIndex: 0, reps: 12, weightLbs: 27.5, loggedAt: "2026-08-20" },
];

export const personalBests: Record<string, string> = {
  "ex-deadlift": "135 lbs",
  "ex-goblet-squat": "40 lbs",
  "ex-db-row": "30 lbs",
};

export const mealPlan: MealPlanVersion = {
  id: "mp-1",
  name: "September Plan: 3 plates, 2 snacks",
  intro:
    "Build each plate: palm of protein, fist of carbs, two fists of veg, thumb of fats. Eat slow, stop at satisfied.",
  pdfName: "September-Recipes.pdf",
  meals: [
    {
      id: "m-1",
      name: "Plate 1 (morning)",
      items: [
        { name: "Eggs + egg whites", portion: "2 eggs + 1 cup whites", protein: 32, carbs: 2, fats: 12 },
        { name: "Oats with berries", portion: "1/2 cup dry", protein: 5, carbs: 32, fats: 3 },
      ],
    },
    {
      id: "m-2",
      name: "Plate 2 (midday)",
      items: [
        { name: "Chicken breast", portion: "5 oz", protein: 38, carbs: 0, fats: 5 },
        { name: "Rice + mixed veg", portion: "1 cup cooked + 2 cups", protein: 6, carbs: 48, fats: 2 },
      ],
    },
    {
      id: "m-3",
      name: "Plate 3 (evening)",
      note: "Protein first if you're short on time.",
      items: [
        { name: "Lean ground beef", portion: "5 oz", protein: 35, carbs: 0, fats: 14 },
        { name: "Potatoes + salad", portion: "1 fist + big bowl", protein: 4, carbs: 38, fats: 8 },
      ],
    },
    {
      id: "m-4",
      name: "Snack 1",
      items: [{ name: "Greek yogurt + fruit", portion: "3/4 cup + 1 piece", protein: 18, carbs: 24, fats: 2 }],
    },
    {
      id: "m-5",
      name: "Snack 2",
      items: [{ name: "Protein shake", portion: "1 scoop in water", protein: 25, carbs: 3, fats: 2 }],
    },
  ],
};

export const checkins: Checkin[] = [
  {
    id: "ci-3",
    isoWeek: "2026-W34",
    weekLabel: "Week of Aug 17",
    submittedAt: "2026-08-23",
    dryWeightLbs: 173.8,
    mealRating: 4,
    mealNote: "Stuck to plates all week. Saturday birthday party got loose.",
    fitnessRating: 5,
    fitnessNote: "Both workouts done. Deadlift felt strong.",
    comments: "Sleep was rough Tuesday. Otherwise good week.",
    proud: "Said no to the office donuts twice.",
    excited: "Trying 140 on deadlift.",
    photos: [{ pose: "front" }, { pose: "side" }, { pose: "back" }],
  },
  {
    id: "ci-2",
    isoWeek: "2026-W33",
    weekLabel: "Week of Aug 10",
    submittedAt: "2026-08-16",
    dryWeightLbs: 175.2,
    mealRating: 3,
    mealNote: "Missed snack 2 most days, dinner portions crept up.",
    fitnessRating: 4,
    fitnessNote: "One workout cut short, kids were sick.",
    comments: "Water intake way better this week.",
    photos: [{ pose: "front" }, { pose: "side" }, { pose: "back" }],
  },
  {
    id: "ci-1",
    isoWeek: "2026-W32",
    weekLabel: "Week of Aug 3",
    submittedAt: "2026-08-09",
    dryWeightLbs: 176.5,
    mealRating: 4,
    mealNote: "Solid week. Prepped Sunday and it showed.",
    fitnessRating: 5,
    fitnessNote: "All sessions done.",
    comments: "",
    photos: [{ pose: "front" }, { pose: "side" }, { pose: "back" }],
  },
];

export const messages: Message[] = [
  { id: "msg-1", from: "coach", body: "Saw your check-in. That birthday party doesn't erase the week. Look at the weight trend, it's moving.", at: "Sun 2:14 PM" },
  { id: "msg-2", from: "client", body: "Thank you!! I was beating myself up about it honestly", at: "Sun 3:02 PM" },
  { id: "msg-3", from: "coach", body: "One meal is one meal. This week: same plan, and let's get you 140 on that deadlift.", at: "Sun 3:10 PM" },
];

/* ---------------- Admin fixtures ---------------- */

export const clients: (Profile & { lastCheckin: string; streak: number; unread: number })[] = [
  { ...demoClient, lastCheckin: "Aug 23", streak: 3, unread: 1 },
  {
    id: "c-2", fullName: "Jessica Braun", firstName: "Jessica", email: "jess@example.com",
    timezone: "America/Edmonton", status: "active", showMacros: false, showCalories: false,
    foodJournalEnabled: false, startWeightLbs: 162, goalWeightLbs: 148,
    lastCheckin: "Aug 23", streak: 7, unread: 0,
  },
  {
    id: "c-3", fullName: "Amanda Torres", firstName: "Amanda", email: "amanda@example.com",
    timezone: "America/Edmonton", status: "paused", showMacros: true, showCalories: true,
    foodJournalEnabled: true, startWeightLbs: 190, goalWeightLbs: 165,
    lastCheckin: "Aug 9", streak: 0, unread: 0,
  },
];

export const applications: Application[] = [
  {
    id: "app-1",
    name: "Rachel Kim",
    email: "rachel@example.com",
    submittedAt: "Aug 27",
    status: "new",
    goal: "Lose body fat",
    experience: "Beginner, some classes years ago",
    daysPerWeek: 3,
    equipment: "Dumbbells at home, gym membership",
    injuries: "Right knee gets cranky on stairs",
    nutritionHabits: "Skips breakfast, snacks after kids' bedtime",
    lifestyle: "Two kids under 6, works full time, sleeps ~6h",
    snapshot: {
      goalType: "Fat loss",
      suggestedSplit: "Full body",
      frequency: "3x/week",
      platesTarget: "3 plates, 1 snack",
      redFlags: ["Knee: avoid deep loaded flexion week 1-4", "Low sleep: watch recovery"],
    },
  },
  {
    id: "app-2",
    name: "Dana Whitfield",
    email: "dana@example.com",
    submittedAt: "Aug 25",
    status: "new",
    goal: "Post-partum rebuild",
    experience: "Was consistent pre-baby",
    daysPerWeek: 2,
    equipment: "Home: bands, one kettlebell",
    injuries: "None, cleared at 12 weeks",
    nutritionHabits: "Breastfeeding, big hunger swings",
    lifestyle: "4-month-old, unpredictable naps",
    snapshot: {
      goalType: "Rebuild",
      suggestedSplit: "Full body, short sessions",
      frequency: "2x/week",
      platesTarget: "3 plates, 2 snacks",
      redFlags: ["Post-partum: core/floor progression first", "Breastfeeding: no deficit push"],
    },
  },
];

export const notificationFeed = [
  { id: "n-1", kind: "checkin" as const, who: "Sarah Mitchell", what: "Weekly check-in submitted", when: "Sun 9:41 AM", clientId: "c-demo" },
  { id: "n-2", kind: "message" as const, who: "Sarah Mitchell", what: "“Thank you!! I was beating myself up about it honestly”", when: "Sun 3:02 PM", clientId: "c-demo" },
  { id: "n-3", kind: "application" as const, who: "Rachel Kim", what: "New application: Lose body fat, 3x/week", when: "Thu 8:15 PM", clientId: null },
  { id: "n-4", kind: "checkin" as const, who: "Jessica Braun", what: "Weekly check-in submitted", when: "Sun 8:02 AM", clientId: "c-2" },
];

export const foodLog = [
  { id: "fl-1", meal: "Plate 1", note: "Eggs + oats", time: "7:42 AM", hasPhoto: true },
  { id: "fl-2", meal: "Snack 1", note: "Yogurt bowl", time: "10:15 AM", hasPhoto: true },
  { id: "fl-3", meal: "Plate 2", note: "Chicken + rice", time: "12:50 PM", hasPhoto: true },
];
