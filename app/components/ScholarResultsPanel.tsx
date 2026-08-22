"use client";

import { useEffect, useMemo, useState } from "react";
import {
  authorizedTeachers,
  firebaseConfig,
  isAuthorizedTeacherEmail,
  rosterTeacherEmailForEmail,
  teacherLabelForEmail,
} from "../firebase-config";

type FirebaseUser = {
  email: string | null;
};

type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
};

type FirestoreDocSnapshot = {
  data: () => Record<string, unknown> | undefined;
  id: string;
};

type FirestoreQuerySnapshot = {
  docs: FirestoreDocSnapshot[];
};

type FirestoreDocRef = {
  collection: (name: string) => FirestoreCollectionRef;
  delete: () => Promise<void>;
  get: () => Promise<FirestoreDocSnapshot>;
  set: (data: Record<string, unknown>, options?: { merge: boolean }) => Promise<void>;
};

type FirestoreCollectionRef = {
  add: (data: Record<string, unknown>) => Promise<{ id: string }>;
  doc: (id: string) => FirestoreDocRef;
  get: () => Promise<FirestoreQuerySnapshot>;
  where: (fieldPath: string, opStr: "==", value: unknown) => FirestoreCollectionRef;
};

type FirestoreDb = {
  collection: (name: string) => FirestoreCollectionRef;
};

type FirebaseCompat = {
  apps: unknown[];
  auth: () => FirebaseAuth;
  firestore: (() => FirestoreDb) & {
    FieldValue: {
      serverTimestamp: () => unknown;
    };
  };
  initializeApp: (config: typeof firebaseConfig) => unknown;
};

declare global {
  interface Window {
    firebase?: FirebaseCompat;
  }
}

type Scholar = {
  id: string;
  firstName: string;
  firstNameKey: string;
  includeInReports: boolean;
  lastName: string;
  lastNameKey: string;
  teacherEmail: string;
};

type MissedQuestion = {
  category?: string;
  correctAnswer?: string;
  gameId?: string;
  gameTitle?: string;
  incorrectSelections?: string[];
  levelName?: string;
  questionIndex?: number;
  word?: string;
};

type CategoryScore = {
  correct: number;
  missed: number;
  skipped: number;
  total: number;
};

type ResultSubmission = {
  id: string;
  attempts: number;
  categoryScores?: Record<string, CategoryScore>;
  completedAt: unknown;
  correctAnswer?: string;
  gameId: string;
  gameTitle: string;
  incorrectSelections: unknown[];
  incorrectSelection?: string;
  learningLocation?: string;
  levelId?: string;
  levelIndex?: number;
  levelName?: string;
  masteredLevel?: boolean;
  masteryCount?: number;
  masteryEarned?: boolean;
  masteryTarget?: number;
  mode: string;
  missedCount: number;
  missedQuestions: MissedQuestion[];
  questionResponses?: unknown[];
  questionIndex?: number;
  scholarDisplayName?: string;
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId?: string;
  score: number;
  soundSafariComplete?: boolean;
  teacherEmail: string;
  totalQuestions: number;
  responseTimesMs?: number[];
  word?: string;
};

type ProgressSubmission = {
  id: string;
  categoryScores?: Record<string, CategoryScore>;
  currentQuestionIndex: number;
  currentQuestionLabel: string;
  currentWord: string;
  gameId: string;
  gameTitle: string;
  incorrectSelections: unknown[];
  learningLocation?: string;
  levelId?: string;
  levelIndex?: number;
  levelName?: string;
  missedCount: number;
  missedQuestions: MissedQuestion[];
  mode: string;
  percentComplete: number;
  questionResponses?: unknown[];
  questionsCompleted: number;
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId?: string;
  score: number;
  sessionId: string;
  status: string;
  teacherEmail: string;
  totalQuestions: number;
  responseTimesMs?: number[];
  updatedAt: unknown;
};

type GameLevelControl = {
  commandId: string;
  lockedLevelIndexes: number[];
  masteryCounts: number[];
  masteryOverrideLevelIndexes: number[];
  restartLevelIndex: number;
  unlockedLevelIndexes: number[];
};

type ScholarControl = {
  action: string;
  commandId: string;
  gameControls?: Record<string, GameLevelControl>;
  lockedLevelIndexes: number[];
  masteryCounts: number[];
  masteryOverrideLevelIndexes: number[];
  restartLevelIndex: number;
  scholarFirstNameKey: string;
  unlockedLevelIndexes: number[];
};

type PreassessmentControl = {
  action: "normal" | "retake" | "waived";
  commandId: string;
  gameId: string;
  scholarFirstNameKey: string;
  teacherEmail: string;
  updatedAt: unknown;
};
type MatchStatus = {
  label: string;
  scholar?: Scholar;
  tone: "ambiguous" | "matched" | "unmatched";
};
type ActivityWindow = "all" | "today" | "week";
type DashboardSubject = "none" | "skills" | "listening" | "math";
type DashboardFocus = "mostWrong" | "repeatMisses" | "unfinished" | "name";
type DataReportView = "students" | "skills" | "listening" | "math";
type StudentDashboardSummary = {
  id: string;
  label: string;
  scholarId?: string;
  sessions: number;
  tone: MatchStatus["tone"];
  topIssue: string;
  topIssueCount: number;
  unfinishedCount: number;
  repeatWrongCount: number;
  wrongCount: number;
};
type SmallGroupNeedSummary = {
  count: number;
  key: string;
  label: string;
  searchTerms: string[];
  studentCount: number;
  students: string[];
};
type SkillsDataReportId =
  | "letter-sounds"
  | "digraphs"
  | "math-starting-point"
  | "number-recognition"
  | "counting-quantities";
type SkillsDataReportSubject = "skills" | "math";
type SkillsDataSortMode = "name" | "mastered" | "needs" | "close";
type SkillsDataFocusMode =
  | "all"
  | "needs-review"
  | "mastered"
  | "unassessed"
  | "hide-mastered"
  | "student-100"
  | "student-below-100"
  | "student-close-100"
  | "targets-with-needs"
  | "targets-100";
type SkillsDataStatus = "mastered" | "needs-review" | "unassessed";
type SkillsDataEvidence = {
  attempts: string[];
  correct: boolean;
  date: Date | null;
  gameId: string;
  levelName: string;
  mode: string;
  prompt: string;
  recordId: string;
  reportId: SkillsDataReportId;
  selected: string;
  skill: string;
  source: string;
  target: string;
  timestampMs: number;
};
type SkillsDataOverride = {
  createdAt: unknown;
  id: string;
  note: string;
  reportId: SkillsDataReportId;
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId: string;
  status: Exclude<SkillsDataStatus, "unassessed">;
  target: string;
  teacherEmail: string;
  updatedAt: unknown;
  updatedBy: string;
};
type SkillsDataCell = {
  evidence: SkillsDataEvidence[];
  latest?: SkillsDataEvidence;
  status: SkillsDataStatus;
  target: string;
};
type SkillsDataRow = {
  cells: SkillsDataCell[];
  evidenceCount: number;
  masteredCount: number;
  needsReviewCount: number;
  scholar: Scholar;
  unassessedCount: number;
};
type SkillsDataTargetSummary = {
  masteredCount: number;
  needsReviewCount: number;
  target: string;
  totalCount: number;
  unassessedCount: number;
};
type CurriculumRecommendation = {
  id: string;
  subject: string;
  subjectLabel: string;
  unitOrModule: string;
  lessonNumber: string;
  lessonTitle: string;
  priorityStandard: string;
  iCanStatement: string;
  objective: string;
  parentSummary: string;
  matchDetails?: {
    matchType: string;
    need: string;
    reason: string;
  }[];
  matchedNeeds: string[];
  score: number;
  reason: string;
  url: string;
};
type CurriculumNeedCandidate = {
  count: number;
  key: string;
  need: string;
  scholars: string[];
  searchTerms: string[];
  source: string;
};
type CurriculumRecommendationResponse = {
  count?: number;
  needs?: string[];
  recommendations?: CurriculumRecommendation[];
};
type CurriculumRecommendationStatus = "idle" | "loading" | "success" | "error";
type SmallGroupLessonSource = {
  fileName: string;
  text: string;
};

const SCHOLAR_COLLECTION = "gameHubScholars";
const RESULT_COLLECTION = "gameHubResultSubmissions";
const PROGRESS_COLLECTION = "gameHubProgressSubmissions";
const PREASSESSMENT_STATUS_COLLECTION = "gameHubPreassessmentStatus";
const PREASSESSMENT_CONTROL_COLLECTION = "gameHubPreassessmentControls";
const SCHOLAR_CONTROL_COLLECTION = "gameHubScholarControls";
const SKILLS_DATA_OVERRIDE_COLLECTION = "gameHubSkillsDataOverrides";
const GAME_COLLECTION = "gameHubGameDefinitions";
const MATH_PREASSESSMENT_GAME_ID = "math-starting-point-quest";
const MATH_PREASSESSMENT_STATUS_ID_PREFIX = "math-starting-point-quest-";
const SKILLS_PREASSESSMENT_GAME_ID = "skills-starting-point";
const SKILLS_PREASSESSMENT_STATUS_ID_PREFIX = "skills-starting-point-";
const LETTER_SEARCH_SAFARI_GAME_ID = "letter-search-safari";
const NUMBER_SEARCH_SAFARI_GAME_ID = "number-search-safari";
const HUB_CLASS_URL = "https://first-grade-news-hub-mrdavis.web.app/";
const HUB_CURRICULUM_RECOMMENDATION_URL =
  "https://us-central1-first-grade-news-hub.cloudfunctions.net/recommendCurriculumLessons";
const PREASSESSMENTS = {
  [MATH_PREASSESSMENT_GAME_ID]: {
    gameId: MATH_PREASSESSMENT_GAME_ID,
    label: "Math Starting Point Quest",
    statusIdPrefix: MATH_PREASSESSMENT_STATUS_ID_PREFIX,
    subject: "math",
  },
  [SKILLS_PREASSESSMENT_GAME_ID]: {
    gameId: SKILLS_PREASSESSMENT_GAME_ID,
    label: "Skills Starting Point",
    statusIdPrefix: SKILLS_PREASSESSMENT_STATUS_ID_PREFIX,
    subject: "skills",
  },
} as const;
const MATH_STARTING_POINT_CATEGORIES = [
  "Representing Addition",
  "Representing Subtraction",
  "Addition Fluency Within 5",
  "Subtraction Fluency Within 5",
];
const LETTER_SOUND_TARGETS = [
  "m",
  "a",
  "t",
  "d",
  "o",
  "c",
  "g",
  "i",
  "n",
  "h",
  "s",
  "f",
  "v",
  "z",
  "p",
  "e",
  "b",
  "l",
  "r",
  "u",
  "w",
  "j",
  "y",
  "x",
  "k",
  "q",
];
const DIGRAPH_TARGETS = ["sh", "ch", "th", "wh", "ph", "ng", "ck"];
const NUMBER_TARGETS = Array.from({ length: 20 }, (_, index) => String(index + 1));
const SKILLS_DATA_REPORTS: {
  id: SkillsDataReportId;
  label: string;
  subject: SkillsDataReportSubject;
  targets: string[];
}[] = [
  {
    id: "letter-sounds",
    label: "Letter Sounds",
    subject: "skills",
    targets: LETTER_SOUND_TARGETS,
  },
  {
    id: "digraphs",
    label: "Digraphs",
    subject: "skills",
    targets: DIGRAPH_TARGETS,
  },
  {
    id: "math-starting-point",
    label: "Math Starting Point",
    subject: "math",
    targets: MATH_STARTING_POINT_CATEGORIES,
  },
  {
    id: "number-recognition",
    label: "Number Recognition",
    subject: "math",
    targets: NUMBER_TARGETS,
  },
  {
    id: "counting-quantities",
    label: "Counting Quantities",
    subject: "math",
    targets: NUMBER_TARGETS,
  },
];
const GAME_LABELS: Record<string, string> = {
  "ckla-unit-1-word-builder-blast": "CKLA Unit 1 - Full Practice",
  "ckla-unit-2-long-vowel-quest": "CKLA Unit 2 - Long Vowel Quest",
  "letter-search-safari": "Letter Search Safari",
  "math-starting-point-quest": "Math Starting Point Quest",
  "number-search-safari": "Number Search Safari",
  "skills-starting-point": "Skills Starting Point",
  "unit1-zone1-sound-safari": "CKLA Unit 1 - Sound Safari",
  "unit1-zone2-team-trail": "CKLA Unit 1 - Team Trail",
  "unit1-zone3-word-workshop": "CKLA Unit 1 - Word Workshop",
  "unit1-zone4-word-village": "CKLA Unit 1 - Word Village",
  "unit1-zone5-story-summit": "CKLA Unit 1 - Story Summit",
  "ckla-listening-learning-unit-1": "CKLA Listening & Learning - Unit 1",
  "ckla-listening-learning-unit-2": "CKLA Listening & Learning - Unit 2",
  "ckla-listening-learning-unit-3": "CKLA Listening & Learning - Unit 3",
  "ckla-listening-learning-unit-4": "CKLA Listening & Learning - Unit 4",
  "ckla-listening-learning-unit-5": "CKLA Listening & Learning - Unit 5",
  "ckla-listening-learning-unit-6": "CKLA Listening & Learning - Unit 6",
  "ckla-listening-learning-unit-7": "CKLA Listening & Learning - Unit 7",
  "ckla-listening-learning-unit-8": "CKLA Listening & Learning - Unit 8",
  "ckla-listening-learning-unit-9": "CKLA Listening & Learning - Unit 9",
  "ckla-listening-learning-unit-10": "CKLA Listening & Learning - Unit 10",
  "ckla-listening-learning-unit-11": "CKLA Listening & Learning - Unit 11",
  "eureka-math-module-1": "Eureka Math - Module 1",
  "eureka-math-module-2": "Eureka Math - Module 2",
  "eureka-math-module-3": "Eureka Math - Module 3",
  "eureka-math-module-4": "Eureka Math - Module 4",
  "eureka-math-module-5": "Eureka Math - Module 5",
  "eureka-math-module-6": "Eureka Math - Module 6",
};
const SOUND_SAFARI_LEVELS = [
  { id: "level-1", name: "Back-to-School Basecamp", totalQuestions: 12 },
  { id: "level-2", name: "Code Trail", totalQuestions: 15 },
  { id: "level-3", name: "Digraph Crossing", totalQuestions: 15 },
  { id: "level-4", name: "Spelling Ridge", totalQuestions: 15 },
  { id: "level-5", name: "Sentence Springs", totalQuestions: 15 },
  { id: "level-6", name: "Unit 1 Summit", totalQuestions: 20 },
];
type ManagedLevel = {
  detail?: string;
  id: string;
  lessonRange?: string;
  name: string;
};

type ManagedGame = {
  gameId: string;
  levels: ManagedLevel[];
  title: string;
};

const MANAGED_GAMES: ManagedGame[] = [
  {
    gameId: "skills-starting-point",
    title: "Skills Starting Point",
    levels: [
      {id: "reading-starting-point", name: "Reading Starting Point"},
    ],
  },
  {
    gameId: LETTER_SEARCH_SAFARI_GAME_ID,
    title: "Letter Search Safari",
    levels: [
      {id: "lowercase-letter-identification", name: "Lowercase Letter Identification"},
      {id: "capital-letter-identification", name: "Capital Letter Identification"},
      {id: "digraph-search", name: "Digraph Search"},
    ],
  },
  {
    gameId: "unit1-zone1-sound-safari",
    title: "CKLA Unit 1 - Sound Safari",
    levels: SOUND_SAFARI_LEVELS,
  },
  {
    gameId: "ckla-unit-2-long-vowel-quest",
    title: "CKLA Unit 2 - Long Vowel Quest",
    levels: [
      {id: "level-1", name: "Sound Safari"},
      {id: "level-2", name: "Team Trail"},
      {id: "level-3", name: "Word Workshop"},
      {id: "level-4", name: "Word Village"},
      {id: "level-5", name: "Story Summit"},
    ],
  },
  {
    gameId: "ckla-unit-3-skills-quest",
    title: "CKLA Unit 3 - Skills Adventure",
    levels: [{id: "level-1", name: "Unit 3 Level 1"}],
  },
  {
    gameId: "ckla-unit-4-skills-quest",
    title: "CKLA Unit 4 - Skills Adventure",
    levels: [{id: "level-1", name: "Unit 4 Level 1"}],
  },
  {
    gameId: "ckla-unit-5-skills-quest",
    title: "CKLA Unit 5 - Skills Adventure",
    levels: [{id: "level-1", name: "Unit 5 Level 1"}],
  },
  {
    gameId: "ckla-unit-6-skills-quest",
    title: "CKLA Unit 6 - Skills Adventure",
    levels: [{id: "level-1", name: "Unit 6 Level 1"}],
  },
  {
    gameId: "ckla-unit-7-skills-quest",
    title: "CKLA Unit 7 - Skills Adventure",
    levels: [{id: "level-1", name: "Unit 7 Level 1"}],
  },
  {
    gameId: "ckla-listening-learning-unit-1",
    title: "CKLA Listening & Learning - Unit 1",
    levels: [
      {id: "level-1", name: "Unit 1 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-2",
    title: "CKLA Listening & Learning - Unit 2",
    levels: [
      {id: "level-1", name: "Unit 2 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-3",
    title: "CKLA Listening & Learning - Unit 3",
    levels: [
      {id: "level-1", name: "Unit 3 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-4",
    title: "CKLA Listening & Learning - Unit 4",
    levels: [
      {id: "level-1", name: "Unit 4 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-5",
    title: "CKLA Listening & Learning - Unit 5",
    levels: [
      {id: "level-1", name: "Unit 5 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-6",
    title: "CKLA Listening & Learning - Unit 6",
    levels: [
      {id: "level-1", name: "Unit 6 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-7",
    title: "CKLA Listening & Learning - Unit 7",
    levels: [
      {id: "level-1", name: "Unit 7 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-8",
    title: "CKLA Listening & Learning - Unit 8",
    levels: [
      {id: "level-1", name: "Unit 8 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-9",
    title: "CKLA Listening & Learning - Unit 9",
    levels: [
      {id: "level-1", name: "Unit 9 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-10",
    title: "CKLA Listening & Learning - Unit 10",
    levels: [
      {id: "level-1", name: "Unit 10 Level 1"},
    ],
  },
  {
    gameId: "ckla-listening-learning-unit-11",
    title: "CKLA Listening & Learning - Unit 11",
    levels: [
      {id: "level-1", name: "Unit 11 Level 1"},
    ],
  },
  {
    gameId: "math-starting-point-quest",
    title: "Math Starting Point Quest",
    levels: [
      {id: "starting-point", name: "Starting Point Quest"},
    ],
  },
  {
    gameId: NUMBER_SEARCH_SAFARI_GAME_ID,
    title: "Number Search Safari",
    levels: [
      {id: "number-search", name: "Number Search"},
      {id: "dot-counting", name: "Dot Counting"},
    ],
  },
  {
    gameId: "eureka-math-module-1",
    title: "Eureka Math - Module 1",
    levels: [
      {id: "level-1", name: "Module 1 Level 1"},
    ],
  },
  {
    gameId: "eureka-math-module-2",
    title: "Eureka Math - Module 2",
    levels: [
      {id: "level-1", name: "Module 2 Level 1"},
    ],
  },
  {
    gameId: "eureka-math-module-3",
    title: "Eureka Math - Module 3",
    levels: [
      {id: "level-1", name: "Module 3 Level 1"},
    ],
  },
  {
    gameId: "eureka-math-module-4",
    title: "Eureka Math - Module 4",
    levels: [
      {id: "level-1", name: "Module 4 Level 1"},
    ],
  },
  {
    gameId: "eureka-math-module-5",
    title: "Eureka Math - Module 5",
    levels: [
      {id: "level-1", name: "Module 5 Level 1"},
    ],
  },
  {
    gameId: "eureka-math-module-6",
    title: "Eureka Math - Module 6",
    levels: [
      {id: "level-1", name: "Module 6 Level 1"},
    ],
  },
];
const SOUND_SAFARI_MASTERY_TARGET = 3;
const SOUND_SAFARI_MASTERY_PERCENT = 80;
const FIREBASE_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js",
];

let firebasePromise: Promise<{ auth: FirebaseAuth; db: FirestoreDb; firebase: FirebaseCompat }> | null = null;

function firebaseFeatureReady(src: string) {
  if (!window.firebase) {
    return false;
  }

  if (src.includes("firebase-auth")) {
    return typeof window.firebase.auth === "function";
  }

  if (src.includes("firebase-firestore")) {
    return typeof window.firebase.firestore === "function";
  }

  return true;
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === "true" || existing.dataset.ready === "true" || firebaseFeatureReady(src)) {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.dataset.firebaseDashboard = "true";
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
    document.head.append(script);
  });
}

async function loadFirebase() {
  if (!firebasePromise) {
    firebasePromise = Promise.all(FIREBASE_SCRIPTS.map(loadScript)).then(() => {
      const firebase = window.firebase;

      if (!firebase) {
        throw new Error("Firebase did not load. Check your connection and try again.");
      }

      if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }

      return {
        auth: firebase.auth(),
        db: firebase.firestore(),
        firebase,
      };
    });
  }

  return firebasePromise;
}

function normalizeNameKey(name: string) {
  return name
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 30);
}

function initialsForScholar(scholar: Pick<Scholar, "firstName" | "lastName">) {
  return `${scholar.firstName.trim().charAt(0)}${scholar.lastName.trim().charAt(0)}`.toUpperCase();
}

function isTestScholar(scholar: Pick<Scholar, "firstNameKey" | "lastNameKey">) {
  return (
    scholar.firstNameKey === "jane" && scholar.lastNameKey === "doe"
  ) || (
    scholar.firstNameKey === "doe" && scholar.lastNameKey === "jane"
  );
}

function scholarIncludedInReports(scholar: Scholar) {
  return !isTestScholar(scholar) || scholar.includeInReports;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function learningLocationLabel(value?: string) {
  if (value === "home") {
    return "Home";
  }

  if (value === "school") {
    return "School";
  }

  return "";
}

function mapCategoryScores(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const scores: Record<string, CategoryScore> = {};

  Object.entries(value as Record<string, unknown>).forEach(([category, rawScore]) => {
    if (!rawScore || typeof rawScore !== "object" || Array.isArray(rawScore)) {
      return;
    }

    const data = rawScore as Record<string, unknown>;
    scores[category] = {
      correct: asNumber(data.correct),
      missed: asNumber(data.missed),
      skipped: asNumber(data.skipped),
      total: asNumber(data.total),
    };
  });

  return Object.keys(scores).length ? scores : undefined;
}

function formatDate(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }

  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function toDateInputValue(value: unknown) {
  const date = formatDate(value);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfSchoolWeek(date: Date) {
  const start = startOfLocalDay(date);
  const day = start.getDay();
  const daysSinceMonday = day === 0 ? 6 : day - 1;
  start.setDate(start.getDate() - daysSinceMonday);
  return start;
}

function isWithinActivityWindow(value: unknown, activityWindow: ActivityWindow) {
  if (activityWindow === "all") {
    return true;
  }

  const date = formatDate(value);

  if (!date) {
    return false;
  }

  const todayStart = startOfLocalDay(new Date());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  if (activityWindow === "today") {
    return date >= todayStart && date < tomorrowStart;
  }

  const weekStart = startOfSchoolWeek(new Date());
  const nextWeekStart = new Date(weekStart);
  nextWeekStart.setDate(nextWeekStart.getDate() + 7);
  return date >= weekStart && date < nextWeekStart;
}

function lessonRangeIncludes(rangeText: string | undefined, lessonNumber: number) {
  if (!Number.isFinite(lessonNumber) || lessonNumber < 1) {
    return false;
  }

  const normalized = (rangeText ?? "")
    .toLowerCase()
    .replace(/[–—]/g, "-")
    .replace(/\bthrough\b/g, "-")
    .replace(/\bthru\b/g, "-")
    .replace(/\bto\b/g, "-");

  if (!normalized.trim()) {
    return false;
  }

  const rangePattern = /(\d+)\s*-\s*(\d+)/g;
  let match: RegExpExecArray | null;

  while ((match = rangePattern.exec(normalized)) !== null) {
    const start = Number(match[1]);
    const end = Number(match[2]);
    const low = Math.min(start, end);
    const high = Math.max(start, end);

    if (lessonNumber >= low && lessonNumber <= high) {
      return true;
    }
  }

  const numberPattern = /\d+/g;

  while ((match = numberPattern.exec(normalized)) !== null) {
    if (Number(match[0]) === lessonNumber) {
      return true;
    }
  }

  return false;
}

function levelMatchesLesson(level: ManagedLevel, lessonNumber: number) {
  return lessonRangeIncludes(level.lessonRange, lessonNumber);
}

function recordMatchesLevel(
  record: ResultSubmission | ProgressSubmission,
  game: ManagedGame,
  levelIndex: number,
) {
  const level = game.levels[levelIndex];

  if (!level || record.gameId !== game.gameId) {
    return false;
  }

  return (
    record.levelIndex === levelIndex
    || record.levelId === level.id
    || record.levelName === level.name
  );
}

function recordMatchesLesson(
  record: ResultSubmission | ProgressSubmission,
  game: ManagedGame | undefined,
  matchedLevelIndexes: number[],
) {
  if (!game || !matchedLevelIndexes.length) {
    return false;
  }

  return matchedLevelIndexes.some((levelIndex) =>
    recordMatchesLevel(record, game, levelIndex),
  );
}

function mergeGameLevelsFromContent(
  game: ManagedGame,
  content: unknown,
): ManagedGame {
  const rawContent =
    content && typeof content === "object" && !Array.isArray(content)
      ? content as Record<string, unknown>
      : {};
  const rawLevels = Array.isArray(rawContent.levels)
    ? rawContent.levels
    : [];

  if (!rawLevels.length) {
    return game;
  }

  return {
    ...game,
    levels: rawLevels.map((rawLevel, index) => {
      const fallback = game.levels[index];
      const data =
        rawLevel && typeof rawLevel === "object" && !Array.isArray(rawLevel)
          ? rawLevel as Record<string, unknown>
          : {};

      return {
        detail: asText(data.detail) || fallback?.detail || "",
        id: asText(data.id) || fallback?.id || `level-${index + 1}`,
        lessonRange: asText(data.lessonRange).trim(),
        name: asText(data.name) || fallback?.name || `Level ${index + 1}`,
      };
    }),
  };
}

function hasLessonRangeMetadata(game: ManagedGame) {
  return game.levels.some((level) => Boolean(level.lessonRange?.trim()));
}

async function loadStaticGameMetadata(game: ManagedGame) {
  try {
    const response = await fetch(`/games/editable-content/${game.gameId}.json`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return game;
    }

    const data = await response.json() as Record<string, unknown>;
    return mergeGameLevelsFromContent(game, data.content);
  } catch {
    return game;
  }
}

async function loadManagedGameMetadata(db: FirestoreDb) {
  return Promise.all(
    MANAGED_GAMES.map(async (game) => {
      let nextGame = game;

      try {
        const parentSnapshot = await db
          .collection(GAME_COLLECTION)
          .doc(game.gameId)
          .get();
        const parent = parentSnapshot.data() ?? {};
        const versionId =
          asText(parent.draftVersion).trim()
          || asText(parent.publishedVersion).trim();

        if (versionId) {
          const versionSnapshot = await db
            .collection(GAME_COLLECTION)
            .doc(game.gameId)
            .collection("versions")
            .doc(versionId)
            .get();
          const version = versionSnapshot.data() ?? {};
          nextGame = mergeGameLevelsFromContent(game, version.content);
        }
      } catch {
        nextGame = game;
      }

      return hasLessonRangeMetadata(nextGame)
        ? nextGame
        : await loadStaticGameMetadata(nextGame);
    }),
  );
}

function mapScholar(doc: FirestoreDocSnapshot): Scholar {
  const data = doc.data() ?? {};
  const scholar = {
    id: doc.id,
    firstName: asText(data.firstName),
    firstNameKey: asText(data.firstNameKey),
    includeInReports: Boolean(data.includeInReports),
    lastName: asText(data.lastName),
    lastNameKey: asText(data.lastNameKey),
    teacherEmail: asText(data.teacherEmail),
  };

  return {
    ...scholar,
    includeInReports: typeof data.includeInReports === "boolean"
      ? Boolean(data.includeInReports)
      : !isTestScholar(scholar),
  };
}

function mapResult(doc: FirestoreDocSnapshot): ResultSubmission {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    attempts: asNumber(data.attempts),
    categoryScores: mapCategoryScores(data.categoryScores),
    completedAt: data.completedAt,
    correctAnswer: asText(data.correctAnswer),
    gameId: asText(data.gameId),
    gameTitle: asText(data.gameTitle),
    incorrectSelections: asArray(data.incorrectSelections),
    incorrectSelection: asText(data.incorrectSelection),
    learningLocation: asText(data.learningLocation),
    levelId: asText(data.levelId),
    levelIndex: asNumber(data.levelIndex),
    levelName: asText(data.levelName),
    masteredLevel: Boolean(data.masteredLevel),
    masteryCount: asNumber(data.masteryCount),
    masteryEarned: Boolean(data.masteryEarned),
    masteryTarget: asNumber(data.masteryTarget),
    mode: asText(data.mode) || "individual-complete",
    missedCount: asNumber(data.missedCount),
    missedQuestions: asArray(data.missedQuestions) as MissedQuestion[],
    questionResponses: asArray(data.questionResponses),
    questionIndex: asNumber(data.questionIndex),
    scholarDisplayName: asText(data.scholarDisplayName),
    scholarFirstName: asText(data.scholarFirstName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    score: asNumber(data.score),
    soundSafariComplete: Boolean(data.soundSafariComplete),
    teacherEmail: asText(data.teacherEmail),
    totalQuestions: asNumber(data.totalQuestions),
    responseTimesMs: asArray(data.responseTimesMs).map(asNumber),
    word: asText(data.word),
  };
}

function mapProgress(doc: FirestoreDocSnapshot): ProgressSubmission {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    categoryScores: mapCategoryScores(data.categoryScores),
    currentQuestionIndex: asNumber(data.currentQuestionIndex),
    currentQuestionLabel: asText(data.currentQuestionLabel),
    currentWord: asText(data.currentWord),
    gameId: asText(data.gameId),
    gameTitle: asText(data.gameTitle),
    incorrectSelections: asArray(data.incorrectSelections),
    learningLocation: asText(data.learningLocation),
    levelId: asText(data.levelId),
    levelIndex: asNumber(data.levelIndex),
    levelName: asText(data.levelName),
    missedCount: asNumber(data.missedCount),
    missedQuestions: asArray(data.missedQuestions) as MissedQuestion[],
    mode: asText(data.mode) || "session-progress",
    percentComplete: asNumber(data.percentComplete),
    questionResponses: asArray(data.questionResponses),
    questionsCompleted: asNumber(data.questionsCompleted),
    scholarFirstName: asText(data.scholarFirstName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    score: asNumber(data.score),
    sessionId: asText(data.sessionId),
    status: asText(data.status),
    teacherEmail: asText(data.teacherEmail),
    totalQuestions: asNumber(data.totalQuestions),
    responseTimesMs: asArray(data.responseTimesMs).map(asNumber),
    updatedAt: data.updatedAt,
  };
}

function mapGameLevelControl(value: unknown, levelCount: number): GameLevelControl | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const data = value as Record<string, unknown>;
  return {
    commandId: asText(data.commandId),
    lockedLevelIndexes: asArray(data.lockedLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < levelCount),
    masteryCounts: asArray(data.masteryCounts).map(asNumber).slice(0, levelCount),
    masteryOverrideLevelIndexes: asArray(data.masteryOverrideLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < levelCount),
    restartLevelIndex: asNumber(data.restartLevelIndex),
    unlockedLevelIndexes: asArray(data.unlockedLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < levelCount),
  };
}

function mapScholarControl(doc: FirestoreDocSnapshot): ScholarControl {
  const data = doc.data() ?? {};
  const rawGameControls =
    data.gameControls && typeof data.gameControls === "object" && !Array.isArray(data.gameControls)
      ? data.gameControls as Record<string, unknown>
      : {};
  const gameControls: Record<string, GameLevelControl> = {};

  MANAGED_GAMES.forEach((game) => {
    const control = mapGameLevelControl(rawGameControls[game.gameId], game.levels.length);
    if (control) {
      gameControls[game.gameId] = control;
    }
  });

  return {
    action: asText(data.action),
    commandId: asText(data.commandId),
    gameControls: Object.keys(gameControls).length ? gameControls : undefined,
    lockedLevelIndexes: asArray(data.lockedLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < SOUND_SAFARI_LEVELS.length),
    masteryCounts: asArray(data.masteryCounts).map(asNumber).slice(0, SOUND_SAFARI_LEVELS.length),
    masteryOverrideLevelIndexes: asArray(data.masteryOverrideLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < SOUND_SAFARI_LEVELS.length),
    restartLevelIndex: asNumber(data.restartLevelIndex),
    scholarFirstNameKey: asText(data.scholarFirstNameKey) || doc.id,
    unlockedLevelIndexes: asArray(data.unlockedLevelIndexes).map(asNumber).filter((index) => index >= 0 && index < SOUND_SAFARI_LEVELS.length),
  };
}

function preassessmentConfigForGameId(gameId: string) {
  return PREASSESSMENTS[gameId as keyof typeof PREASSESSMENTS]
    ?? null;
}

function preassessmentGameIdForControlId(controlId: string) {
  if (controlId.startsWith(SKILLS_PREASSESSMENT_STATUS_ID_PREFIX)) {
    return SKILLS_PREASSESSMENT_GAME_ID;
  }

  return MATH_PREASSESSMENT_GAME_ID;
}

function skillsDataReportId(value: unknown): SkillsDataReportId {
  if (
    value === "digraphs"
    || value === "number-recognition"
    || value === "counting-quantities"
  ) {
    return value;
  }

  return "letter-sounds";
}

function skillsDataOverrideStatus(value: unknown): Exclude<SkillsDataStatus, "unassessed"> {
  return value === "needs-review" ? "needs-review" : "mastered";
}

function skillsDataOverrideDocId(scholarId: string, reportId: SkillsDataReportId, target: string) {
  return `${reportId}-${scholarId}-${target}`
    .replace(/[^A-Za-z0-9_-]/g, "-")
    .slice(0, 150);
}

function mapPreassessmentControl(doc: FirestoreDocSnapshot): PreassessmentControl {
  const data = doc.data() ?? {};
  const rawAction = asText(data.action);
  const action: PreassessmentControl["action"] =
    rawAction === "retake" || rawAction === "waived" ? rawAction : "normal";
  const gameId = preassessmentGameIdForControlId(doc.id);
  const config =
    preassessmentConfigForGameId(gameId)
    ?? PREASSESSMENTS[MATH_PREASSESSMENT_GAME_ID];

  return {
    action,
    commandId: asText(data.commandId),
    gameId,
    scholarFirstNameKey:
      asText(data.scholarFirstNameKey)
      || doc.id.replace(config.statusIdPrefix, ""),
    teacherEmail: asText(data.teacherEmail),
    updatedAt: data.updatedAt,
  };
}

function mapSkillsDataOverride(doc: FirestoreDocSnapshot): SkillsDataOverride {
  const data = doc.data() ?? {};
  const reportId = skillsDataReportId(data.reportId);

  return {
    createdAt: data.createdAt,
    id: doc.id,
    note: asText(data.note),
    reportId,
    scholarFirstName: asText(data.scholarFirstName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    status: skillsDataOverrideStatus(data.status),
    target: normalizeDataAtGlanceTarget(data.target, reportId),
    teacherEmail: asText(data.teacherEmail),
    updatedAt: data.updatedAt,
    updatedBy: asText(data.updatedBy),
  };
}

function matchResult(result: ResultSubmission | ProgressSubmission, scholars: Scholar[]): MatchStatus {
  if (result.scholarId) {
    const scholar = scholars.find((nextScholar) => nextScholar.id === result.scholarId);

    if (scholar) {
      return { label: `${scholar.firstName} ${scholar.lastName}`, scholar, tone: "matched" };
    }
  }

  if (result.mode === "whole-class-miss" && "scholarDisplayName" in result && result.scholarDisplayName) {
    const initials = result.scholarDisplayName.replace(/-[0-9]+$/, "");
    const resultTeacherEmail = rosterScopedTeacherEmail(result.teacherEmail);
    const matches = scholars.filter((scholar) => {
      const teacherMatches = resultTeacherEmail === "unassigned" || scholar.teacherEmail === resultTeacherEmail;
      return teacherMatches && initialsForScholar(scholar) === initials;
    });

    if (matches.length === 1) {
      return { label: `${matches[0].firstName} ${matches[0].lastName}`, scholar: matches[0], tone: "matched" };
    }

    if (matches.length > 1) {
      return { label: "Duplicate initials", tone: "ambiguous" };
    }
  }

  const matches = scholars.filter((scholar) => scholar.firstNameKey === result.scholarFirstNameKey);

  if (matches.length === 1) {
    return { label: `${matches[0].firstName} ${matches[0].lastName}`, scholar: matches[0], tone: "matched" };
  }

  if (matches.length > 1) {
    return { label: "Needs a private class code", tone: "ambiguous" };
  }

  return { label: "No roster match yet", tone: "unmatched" };
}

function recordBelongsToScholar(
  record: ResultSubmission | ProgressSubmission,
  scholar: Scholar,
) {
  return (
    Boolean(record.scholarId) && record.scholarId === scholar.id
  ) || (
    Boolean(record.scholarFirstNameKey) && record.scholarFirstNameKey === scholar.firstNameKey
  );
}

function formatMissedText(word = "", incorrect = "", correct = "") {
  const target = word || correct || "Question";
  const chosen = incorrect || "incorrect answer";

  if (word && correct && word.toLowerCase() === correct.toLowerCase()) {
    return `${target}: chose ${chosen}.`;
  }

  return `${target}: chose ${chosen}; correct answer ${correct || "not recorded"}.`;
}

function formatMissedContext(missed?: MissedQuestion) {
  if (!missed) {
    return "";
  }

  const parts = [missed.levelName, missed.category].filter(Boolean);
  return parts.length ? `${parts.join(" - ")}: ` : "";
}

function categoryScoreEntries(record: ResultSubmission | ProgressSubmission) {
  const scores = record.categoryScores;

  if (!scores) {
    return [];
  }

  return Object.entries(scores).sort(([categoryA], [categoryB]) => {
    const indexA = MATH_STARTING_POINT_CATEGORIES.indexOf(categoryA);
    const indexB = MATH_STARTING_POINT_CATEGORIES.indexOf(categoryB);

    return (indexA < 0 ? 99 : indexA) - (indexB < 0 ? 99 : indexB)
      || categoryA.localeCompare(categoryB);
  });
}

function categoryScoresReportHtml(record: ResultSubmission | ProgressSubmission) {
  const entries = categoryScoreEntries(record);

  if (!entries.length) {
    return "";
  }

  return `
    <h4>Starting Point Categories</h4>
    <ul>
      ${entries.map(([category, score]) => `
        <li>
          ${escapeReportHtml(category)}:
          ${score.correct}/${score.total} demonstrated
          ${score.skipped ? `, ${score.skipped} skipped` : ""}
        </li>
      `).join("")}
    </ul>
  `;
}

function CategoryScoreList({
  record,
}: {
  record: ResultSubmission | ProgressSubmission;
}) {
  const entries = categoryScoreEntries(record);

  if (!entries.length) {
    return null;
  }

  return (
    <div className="category-score-list">
      <strong>Starting Point Categories</strong>
      <div>
        {entries.map(([category, score]) => (
          <span key={category}>
            {category}: {score.correct}/{score.total}
            {score.skipped ? ` - ${score.skipped} skipped` : ""}
          </span>
        ))}
      </div>
    </div>
  );
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function visualSearchAttemptRows(record: ResultSubmission | ProgressSubmission) {
  if (
    record.gameId !== LETTER_SEARCH_SAFARI_GAME_ID
    && record.gameId !== NUMBER_SEARCH_SAFARI_GAME_ID
  ) {
    return [];
  }

  return (record.questionResponses ?? [])
    .map((rawResponse, index) => {
      const response = asRecord(rawResponse);
      if (!response) {
        return null;
      }

      const attempts = asArray(response.attempts)
        .map((rawAttempt) => {
          const attempt = asRecord(rawAttempt);
          if (!attempt) {
            return null;
          }

          const selected = asText(attempt.selected);
          if (!selected) {
            return null;
          }

          return {
            correct: Boolean(attempt.correct),
            selected,
          };
        })
        .filter((attempt): attempt is { correct: boolean; selected: string } => Boolean(attempt));
      const target =
        asText(response.target)
        || asText(response.word)
        || `Target ${index + 1}`;

      return {
        attempts,
        firstAttemptCorrect: Boolean(response.firstAttemptCorrect),
        target,
      };
    })
    .filter((row): row is { attempts: { correct: boolean; selected: string }[]; firstAttemptCorrect: boolean; target: string } => Boolean(row));
}

function VisualSearchAttemptList({
  record,
}: {
  record: ResultSubmission | ProgressSubmission;
}) {
  const rows = visualSearchAttemptRows(record);

  if (!rows.length) {
    return null;
  }

  return (
    <div className="missed-list">
      <strong>Target attempts</strong>
      {rows.map((row, index) => (
        <p key={`${record.id}-visual-search-${index}`}>
          {row.target}: {row.attempts.length
            ? row.attempts.map((attempt) => `${attempt.selected}${attempt.correct ? " correct" : " miss"}`).join(" -> ")
            : "No taps recorded"}
          {row.firstAttemptCorrect ? " (first tap correct)" : " (first tap missed)"}
        </p>
      ))}
    </div>
  );
}

function isSkillsDataSourceGameId(gameId: string) {
  return gameId === SKILLS_PREASSESSMENT_GAME_ID
    || gameId === LETTER_SEARCH_SAFARI_GAME_ID
    || gameId === MATH_PREASSESSMENT_GAME_ID
    || gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    || gameId.startsWith("unit1-zone")
    || /^ckla-unit-[3-7]-skills-quest$/.test(gameId);
}

function evidenceDateFrom(value: unknown) {
  const formatted = formatDate(value);

  if (formatted) {
    return formatted;
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function recordEvidenceDate(record: ResultSubmission | ProgressSubmission) {
  return "updatedAt" in record
    ? evidenceDateFrom(record.updatedAt)
    : evidenceDateFrom(record.completedAt);
}

function normalizeSkillTarget(value: unknown) {
  const raw = asText(value).trim().toLowerCase();

  if (!raw) {
    return "";
  }

  const slashSound = raw.match(/^\/([a-z]{1,3})\/$/);

  if (slashSound) {
    return slashSound[1];
  }

  const namedTarget = raw.match(/^(?:letter|sound|target|pattern)\s+([a-z]{1,3})$/);

  if (namedTarget) {
    return namedTarget[1];
  }

  const cleaned = raw
    .replace(/^letter\s+/, "")
    .replace(/^sound\s+/, "")
    .replace(/^pattern\s+/, "")
    .replace(/[^a-z]/g, "");

  return cleaned.length >= 1 && cleaned.length <= 3 ? cleaned : "";
}

function normalizeNumberTarget(value: unknown) {
  const raw = asText(value).trim();
  const directNumber = Number(raw);

  if (Number.isInteger(directNumber) && directNumber >= 1 && directNumber <= 20) {
    return String(directNumber);
  }

  const namedNumber = raw.match(/\b([1-9]|1[0-9]|20)\b/);

  if (namedNumber) {
    return String(Number(namedNumber[1]));
  }

  return "";
}

function normalizeMathStartingPointTarget(value: unknown) {
  const raw = asText(value)
    .trim()
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, " ");

  if (!raw) {
    return "";
  }

  return MATH_STARTING_POINT_CATEGORIES.find((category) => {
    const normalizedCategory = category
      .toLowerCase()
      .replace(/&/g, "and")
      .replace(/[^a-z0-9]+/g, " ");
    return raw === normalizedCategory
      || raw.includes(normalizedCategory)
      || normalizedCategory.includes(raw);
  }) ?? "";
}

function normalizeDataAtGlanceTarget(value: unknown, reportId: SkillsDataReportId) {
  if (reportId === "math-starting-point") {
    return normalizeMathStartingPointTarget(value);
  }

  return reportId === "number-recognition" || reportId === "counting-quantities"
    ? normalizeNumberTarget(value)
    : normalizeSkillTarget(value);
}

function recognizedNumberTarget(...values: unknown[]) {
  for (const value of values) {
    const target = normalizeNumberTarget(value);
    if (target) {
      return target;
    }
  }

  return "";
}

function reportIdForSkillTarget(target: string): SkillsDataReportId {
  return DIGRAPH_TARGETS.includes(target) ? "digraphs" : "letter-sounds";
}

function reportIdForNumberSearchResponse(response: Record<string, unknown>) {
  const context = [
    response.levelId,
    response.levelName,
    response.category,
    response.skill,
  ].map((value) => asText(value).toLowerCase()).join(" ");

  if (/dot|count|quantity/.test(context)) {
    return "counting-quantities";
  }

  if (/number/.test(context)) {
    return "number-recognition";
  }

  return "" as "";
}

function recognizedSkillsDataTarget(...values: unknown[]) {
  const validTargets = new Set([...LETTER_SOUND_TARGETS, ...DIGRAPH_TARGETS]);

  for (const value of values) {
    const target = normalizeSkillTarget(value);
    if (validTargets.has(target)) {
      return target;
    }
  }

  return "";
}

function booleanOrNull(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function firstTextValue(...values: unknown[]) {
  for (const value of values) {
    const next = asText(value).trim();
    if (next) {
      return next;
    }
  }

  return "";
}

function questionResponseEvidence(
  record: ResultSubmission | ProgressSubmission,
  rawResponse: unknown,
): SkillsDataEvidence | null {
  const response = asRecord(rawResponse);

  if (!response) {
    return null;
  }

  const attempts = asArray(response.attempts)
    .map(asRecord)
    .filter((attempt): attempt is Record<string, unknown> => Boolean(attempt));
  const firstAttempt = attempts[0];
  const numberReportId = record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    ? reportIdForNumberSearchResponse(response)
    : "";
  const target = record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    ? recognizedNumberTarget(
        response.target,
        response.answer,
        response.correctAnswer,
        response.word,
        response.display,
      )
    : recognizedSkillsDataTarget(
        response.target,
        response.letter,
        response.sound,
        response.answer,
        response.correctAnswer,
        response.word,
        response.display,
      );

  if (!target || (record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID && !numberReportId)) {
    return null;
  }

  const reportId: SkillsDataReportId = numberReportId || reportIdForSkillTarget(target);

  const selected = firstTextValue(
    firstAttempt?.selected,
    response.selected,
    response.selectedAnswer,
    response.incorrectSelection,
    asArray(response.incorrectSelections)[0],
  );
  const firstAttemptCorrect =
    booleanOrNull(response.firstAttemptCorrect)
    ?? booleanOrNull(firstAttempt?.correct);
  const explicitCorrect =
    firstAttemptCorrect
    ?? booleanOrNull(response.correct)
    ?? booleanOrNull(response.eventuallyCorrect)
    ?? booleanOrNull(response.eventualSuccess);
  const correct = explicitCorrect
    ?? (selected ? normalizeDataAtGlanceTarget(selected, reportId) === target : false);
  const date =
    evidenceDateFrom(firstAttempt?.timestamp)
    || evidenceDateFrom(response.timestamp)
    || recordEvidenceDate(record);
  const attemptLabels = attempts
    .map((attempt) => {
      const attemptSelected = asText(attempt.selected).trim();
      if (!attemptSelected) {
        return "";
      }
      return `${attemptSelected} ${Boolean(attempt.correct) ? "correct" : "miss"}`;
    })
    .filter(Boolean);

  return {
    attempts: attemptLabels,
    correct,
    date,
    gameId: record.gameId,
    levelName: record.levelName ?? "",
    mode: record.mode,
    prompt: firstTextValue(response.prompt, response.promptText, response.currentQuestionLabel),
    recordId: record.id,
    reportId,
    selected,
    skill: firstTextValue(response.skill, response.category),
    source: gameTitleFor(record.gameId, record.gameTitle),
    target,
    timestampMs: date?.getTime() ?? 0,
  };
}

function missedQuestionEvidence(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
): SkillsDataEvidence | null {
  const numberReportId = record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    ? reportIdForNumberSearchResponse({
        category: missed.category,
        levelName: missed.levelName || record.levelName,
      })
    : "";
  const target = record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    ? recognizedNumberTarget(
        missed.correctAnswer,
        missed.word,
        "correctAnswer" in record ? record.correctAnswer : "",
        "word" in record ? record.word : "",
      )
    : recognizedSkillsDataTarget(
        missed.correctAnswer,
        missed.word,
        "correctAnswer" in record ? record.correctAnswer : "",
        "word" in record ? record.word : "",
      );

  if (!target || (record.gameId === NUMBER_SEARCH_SAFARI_GAME_ID && !numberReportId)) {
    return null;
  }

  const reportId: SkillsDataReportId = numberReportId || reportIdForSkillTarget(target);

  const selected = firstTextValue(
    missed.incorrectSelections?.[0],
    "incorrectSelection" in record ? record.incorrectSelection : "",
    asArray(record.incorrectSelections)[0],
  );
  const date = recordEvidenceDate(record);

  return {
    attempts: selected ? [`${selected} miss`] : [],
    correct: false,
    date,
    gameId: record.gameId,
    levelName: missed.levelName || record.levelName || "",
    mode: record.mode,
    prompt: "",
    recordId: record.id,
    reportId,
    selected,
    skill: missed.category ?? "",
    source: gameTitleFor(record.gameId, record.gameTitle),
    target,
    timestampMs: date?.getTime() ?? 0,
  };
}

function mathStartingPointCategoryEvidenceForRecord(
  record: ResultSubmission | ProgressSubmission,
) {
  const date = recordEvidenceDate(record);
  const evidence: SkillsDataEvidence[] = [];

  Object.entries(record.categoryScores ?? {}).forEach(([category, score]) => {
    const target = normalizeMathStartingPointTarget(category);

    if (!target || score.total <= 0) {
      return;
    }

    const correct = score.missed <= 0
      && score.skipped <= 0
      && score.correct >= score.total;

    evidence.push({
      attempts: [`${score.correct}/${score.total} correct${score.missed || score.skipped ? `, ${score.missed + score.skipped} needs review` : ""}`],
      correct,
      date,
      gameId: record.gameId,
      levelName: record.levelName ?? "",
      mode: record.mode,
      prompt: `${target}: ${score.correct}/${score.total} correct`,
      recordId: record.id,
      reportId: "math-starting-point",
      selected: correct ? "Category mastered" : "Category needs review",
      skill: category,
      source: gameTitleFor(record.gameId, record.gameTitle),
      target,
      timestampMs: date?.getTime() ?? 0,
    });
  });

  if (evidence.length) {
    return evidence;
  }

  record.missedQuestions.forEach((missed) => {
    const target = normalizeMathStartingPointTarget(missed.category);

    if (!target) {
      return;
    }

    evidence.push({
      attempts: missed.incorrectSelections?.length
        ? missed.incorrectSelections.map((selection) => `${selection} miss`)
        : ["Missed question"],
      correct: false,
      date,
      gameId: record.gameId,
      levelName: missed.levelName || record.levelName || "",
      mode: record.mode,
      prompt: missed.word || missed.correctAnswer || "",
      recordId: record.id,
      reportId: "math-starting-point",
      selected: firstTextValue(missed.incorrectSelections?.[0], "Needs review"),
      skill: missed.category ?? "",
      source: gameTitleFor(record.gameId, record.gameTitle),
      target,
      timestampMs: date?.getTime() ?? 0,
    });
  });

  return evidence;
}

function skillsDataEvidenceForRecord(record: ResultSubmission | ProgressSubmission) {
  if (!isSkillsDataSourceGameId(record.gameId)) {
    return [];
  }

  if (record.gameId === MATH_PREASSESSMENT_GAME_ID) {
    return mathStartingPointCategoryEvidenceForRecord(record);
  }

  const responseEvidence = (record.questionResponses ?? [])
    .map((response) => questionResponseEvidence(record, response))
    .filter((evidence): evidence is SkillsDataEvidence => Boolean(evidence));

  if (responseEvidence.length) {
    return responseEvidence;
  }

  const missedEvidence = record.missedQuestions
    .map((missed) => missedQuestionEvidence(record, missed))
    .filter((evidence): evidence is SkillsDataEvidence => Boolean(evidence));

  if (missedEvidence.length) {
    return missedEvidence;
  }

  return [];
}

function buildSkillsDataRows(
  reportId: SkillsDataReportId,
  reportTargets: string[],
  scholars: Scholar[],
  results: ResultSubmission[],
  progressRecords: ProgressSubmission[],
  overrides: SkillsDataOverride[],
  sortMode: SkillsDataSortMode,
) {
  const targetSet = new Set(reportTargets);
  const evidenceByScholar = new Map<string, Map<string, SkillsDataEvidence[]>>();
  const records = [
    ...results,
    ...progressRecords.filter((progress) => progress.status !== "completed"),
  ];

  records.forEach((record) => {
    const match = matchResult(record, scholars);

    if (!match.scholar) {
      return;
    }

    const scholarEvidence = evidenceByScholar.get(match.scholar.id) ?? new Map<string, SkillsDataEvidence[]>();

    skillsDataEvidenceForRecord(record).forEach((evidence) => {
      if (evidence.reportId !== reportId || !targetSet.has(evidence.target)) {
        return;
      }

      const targetEvidence = scholarEvidence.get(evidence.target) ?? [];
      targetEvidence.push(evidence);
      scholarEvidence.set(evidence.target, targetEvidence);
    });

    if (scholarEvidence.size) {
      evidenceByScholar.set(match.scholar.id, scholarEvidence);
    }
  });

  overrides.forEach((override) => {
    if (override.reportId !== reportId || !targetSet.has(override.target)) {
      return;
    }

    const scholar = scholars.find((nextScholar) =>
      nextScholar.id === override.scholarId
      || (
        nextScholar.firstNameKey === override.scholarFirstNameKey
        && (
          !override.teacherEmail
          || rosterScopedTeacherEmail(override.teacherEmail) === rosterScopedTeacherEmail(nextScholar.teacherEmail)
        )
      ),
    );

    if (!scholar) {
      return;
    }

    const date = evidenceDateFrom(override.updatedAt) || evidenceDateFrom(override.createdAt);
    const scholarEvidence = evidenceByScholar.get(scholar.id) ?? new Map<string, SkillsDataEvidence[]>();
    const targetEvidence = scholarEvidence.get(override.target) ?? [];

    targetEvidence.push({
      attempts: [],
      correct: override.status === "mastered",
      date,
      gameId: "teacher-observation",
      levelName: "",
      mode: "teacher-observation",
      prompt: override.note,
      recordId: override.id,
      reportId: override.reportId,
      selected: override.status === "mastered" ? "Teacher marked mastered" : "Teacher marked needs review",
      skill: SKILLS_DATA_REPORTS.find((report) => report.id === override.reportId)?.label ?? "Skills data",
      source: "Teacher observation",
      target: override.target,
      timestampMs: date?.getTime() ?? 0,
    });
    scholarEvidence.set(override.target, targetEvidence);
    evidenceByScholar.set(scholar.id, scholarEvidence);
  });

  const rows = scholars.map((scholar) => {
    const scholarEvidence = evidenceByScholar.get(scholar.id) ?? new Map<string, SkillsDataEvidence[]>();
    const cells = reportTargets.map((target) => {
      const evidence = [...(scholarEvidence.get(target) ?? [])]
        .sort((a, b) => b.timestampMs - a.timestampMs);
      const latest = evidence[0];
      const status: SkillsDataStatus = latest
        ? latest.correct
          ? "mastered"
          : "needs-review"
        : "unassessed";

      return {
        evidence,
        latest,
        status,
        target,
      };
    });

    return {
      cells,
      evidenceCount: cells.reduce((total, cell) => total + cell.evidence.length, 0),
      masteredCount: cells.filter((cell) => cell.status === "mastered").length,
      needsReviewCount: cells.filter((cell) => cell.status === "needs-review").length,
      unassessedCount: cells.filter((cell) => cell.status === "unassessed").length,
      scholar,
    };
  });

  return rows.sort((a, b) => {
    if (sortMode === "mastered") {
      return b.masteredCount - a.masteredCount
        || a.needsReviewCount - b.needsReviewCount
        || a.scholar.firstName.localeCompare(b.scholar.firstName);
    }

    if (sortMode === "needs") {
      return b.needsReviewCount - a.needsReviewCount
        || a.masteredCount - b.masteredCount
        || a.scholar.firstName.localeCompare(b.scholar.firstName);
    }

    if (sortMode === "close") {
      const aComplete = a.masteredCount >= reportTargets.length;
      const bComplete = b.masteredCount >= reportTargets.length;
      return Number(aComplete) - Number(bComplete)
        || b.masteredCount - a.masteredCount
        || a.needsReviewCount - b.needsReviewCount
        || a.scholar.firstName.localeCompare(b.scholar.firstName);
    }

    return a.scholar.firstName.localeCompare(b.scholar.firstName)
      || a.scholar.lastName.localeCompare(b.scholar.lastName);
  });
}

function skillsDataTargetSummaries(rows: SkillsDataRow[], targets: string[]) {
  return targets.map((target) => {
    const cells = rows
      .map((row) => row.cells.find((cell) => cell.target === target))
      .filter((cell): cell is SkillsDataCell => Boolean(cell));

    return {
      masteredCount: cells.filter((cell) => cell.status === "mastered").length,
      needsReviewCount: cells.filter((cell) => cell.status === "needs-review").length,
      target,
      totalCount: cells.length,
      unassessedCount: cells.filter((cell) => cell.status === "unassessed").length,
    };
  });
}

function skillsDataTargetIsVisible(
  summary: SkillsDataTargetSummary,
  focusMode: SkillsDataFocusMode,
) {
  if (focusMode === "needs-review" || focusMode === "targets-with-needs") {
    return summary.needsReviewCount > 0;
  }

  if (focusMode === "mastered") {
    return summary.masteredCount > 0;
  }

  if (focusMode === "unassessed") {
    return summary.unassessedCount > 0;
  }

  if (focusMode === "hide-mastered" || focusMode === "student-below-100" || focusMode === "student-close-100") {
    return summary.masteredCount < summary.totalCount;
  }

  if (focusMode === "targets-100") {
    return summary.totalCount > 0 && summary.masteredCount === summary.totalCount;
  }

  return true;
}

function skillsDataRowIsVisible(
  row: SkillsDataRow,
  visibleTargetSet: Set<string>,
  focusMode: SkillsDataFocusMode,
  targetCount: number,
) {
  const visibleCells = row.cells.filter((cell) => visibleTargetSet.has(cell.target));

  if (!visibleCells.length) {
    return false;
  }

  if (focusMode === "needs-review" || focusMode === "targets-with-needs") {
    return visibleCells.some((cell) => cell.status === "needs-review");
  }

  if (focusMode === "mastered") {
    return visibleCells.some((cell) => cell.status === "mastered");
  }

  if (focusMode === "unassessed") {
    return visibleCells.some((cell) => cell.status === "unassessed");
  }

  if (focusMode === "hide-mastered") {
    return visibleCells.some((cell) => cell.status !== "mastered");
  }

  if (focusMode === "student-100") {
    return row.masteredCount >= targetCount;
  }

  if (focusMode === "student-below-100") {
    return row.masteredCount < targetCount;
  }

  if (focusMode === "student-close-100") {
    const closeThreshold = Math.max(1, Math.ceil(targetCount * 0.8));
    return row.masteredCount >= closeThreshold && row.masteredCount < targetCount;
  }

  return true;
}

function skillsDataCellIsMuted(cell: SkillsDataCell, focusMode: SkillsDataFocusMode) {
  if (focusMode === "needs-review" || focusMode === "targets-with-needs") {
    return cell.status !== "needs-review";
  }

  if (focusMode === "mastered") {
    return cell.status !== "mastered";
  }

  if (focusMode === "unassessed") {
    return cell.status !== "unassessed";
  }

  if (focusMode === "hide-mastered") {
    return cell.status === "mastered";
  }

  return false;
}

function missedQuestionKey(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
) {
  return [
    record.gameId,
    missed.levelName || record.levelName || "",
    missed.category || "",
    missed.questionIndex ?? ("questionIndex" in record ? record.questionIndex : undefined) ?? "",
    missed.word || ("word" in record ? record.word : "") || "",
    missed.correctAnswer || ("correctAnswer" in record ? record.correctAnswer : "") || "",
  ].join("|");
}

function missedQuestionLabel(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
) {
  const game = gameTitleFor(record.gameId, record.gameTitle);
  const level = missed.levelName || record.levelName || "";
  const skill = missed.category || "";
  const target =
    missed.word
    || missed.correctAnswer
    || ("word" in record ? record.word : "")
    || ("currentWord" in record ? record.currentWord : "")
    || (missed.questionIndex || ("questionIndex" in record ? record.questionIndex : undefined)
      ? `Question ${missed.questionIndex ?? ("questionIndex" in record ? record.questionIndex : undefined)}`
      : "Question");
  const parts = [game, level, skill, target].filter(Boolean);

  return parts.join(" - ");
}

function smallGroupNeedKey(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
) {
  return [
    record.gameId,
    missed.levelName || record.levelName || "",
    missed.category || "Needs practice",
  ].join("|");
}

function smallGroupNeedLabel(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
) {
  const level = normalizeCurriculumNeedText(missed.levelName || record.levelName || "");
  const skill = normalizeCurriculumNeedText(missed.category || "");
  const target = normalizeCurriculumNeedText(
    missed.word
    || missed.correctAnswer
    || ("word" in record ? record.word : "")
    || ("currentWord" in record ? record.currentWord : ""),
  );

  if (target && /^[a-z]$/i.test(target) && /lowercase/i.test(level)) {
    return `Lowercase ${target.toLowerCase()} identification`;
  }

  if (target && /^[a-z]$/i.test(target) && /uppercase/i.test(level)) {
    return `Uppercase ${target.toUpperCase()} identification`;
  }

  if (target && skill && normalizeCurriculumNeedKey(target) !== normalizeCurriculumNeedKey(skill)) {
    return `${target} - ${skill}`;
  }

  if (level && skill && normalizeCurriculumNeedKey(level).includes(normalizeCurriculumNeedKey(skill))) {
    return level;
  }

  return skill || level || target || "Needs practice";
}

function smallGroupNeedSearchTerms(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
) {
  return [
    smallGroupNeedLabel(record, missed),
    missed.category,
    missed.levelName || record.levelName,
    missed.word,
    missed.correctAnswer,
    "word" in record ? record.word : "",
    "currentWord" in record ? record.currentWord : "",
    gameTitleFor(record.gameId, record.gameTitle),
  ].filter(Boolean);
}

function recordMissCount(record: ResultSubmission | ProgressSubmission) {
  if (record.missedQuestions.length) {
    return record.missedQuestions.reduce(
      (total, missed) =>
        total + Math.max(1, missed.incorrectSelections?.length ?? 0),
      0,
    );
  }

  return Math.max(
    record.missedCount,
    Array.isArray(record.incorrectSelections)
      ? record.incorrectSelections.length
      : 0,
  );
}

function recordLooksUnfinished(progress: ProgressSubmission) {
  return progress.status !== "completed";
}

function gameTitleFor(gameId: string, fallback = "") {
  return GAME_LABELS[gameId] || fallback || gameId;
}

function gameSubjectForGameId(gameId: string): DashboardSubject {
  if (
    gameId === MATH_PREASSESSMENT_GAME_ID
    || gameId === NUMBER_SEARCH_SAFARI_GAME_ID
    || gameId.startsWith("eureka-math-")
  ) {
    return "math";
  }

  if (gameId.startsWith("ckla-listening-learning-")) {
    return "listening";
  }

  return "skills";
}

function normalizeCurriculumNeedText(value: unknown) {
  return String(value ?? "")
    .replace(/[`"“”]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function normalizeCurriculumNeedKey(value: unknown) {
  return normalizeCurriculumNeedText(value).toLowerCase();
}

function addCurriculumNeed(needs: string[], value: unknown) {
  const need = normalizeCurriculumNeedText(value);
  if (!need) return;
  const key = normalizeCurriculumNeedKey(need);
  if (needs.some((existing) => existing.toLowerCase() === key)) return;
  needs.push(need);
}

function addCurriculumNeedCandidate(
  candidates: Map<string, CurriculumNeedCandidate>,
  value: unknown,
  options: {
    count?: number;
    scholars?: string[];
    searchTerms?: unknown[];
    source: string;
  },
) {
  const need = normalizeCurriculumNeedText(value);
  const key = normalizeCurriculumNeedKey(need);

  if (!key) {
    return;
  }

  const existing = candidates.get(key) ?? {
    count: 0,
    key,
    need,
    scholars: [],
    searchTerms: [],
    source: "",
  };
  const sources = new Set(existing.source.split(", ").filter(Boolean));
  sources.add(options.source);
  const scholars = new Set(existing.scholars);
  const searchTerms = new Set(existing.searchTerms);

  options.scholars?.forEach((scholar) => {
    const name = normalizeCurriculumNeedText(scholar);
    if (name) scholars.add(name);
  });
  [need, ...(options.searchTerms ?? [])].forEach((term) => {
    const normalized = normalizeCurriculumNeedText(term);
    if (normalized) searchTerms.add(normalized);
  });

  candidates.set(key, {
    count: existing.count + Math.max(1, options.count ?? 1),
    key,
    need: existing.need,
    scholars: Array.from(scholars).sort((a, b) => a.localeCompare(b)),
    searchTerms: Array.from(searchTerms),
    source: Array.from(sources).join(", "),
  });
}

function curriculumNeedsFromRecord(record: ResultSubmission | ProgressSubmission) {
  const needs: string[] = [];

  record.missedQuestions.forEach((missed) => {
    addCurriculumNeed(needs, missed.category);
    addCurriculumNeed(needs, missed.word);
    addCurriculumNeed(needs, missed.correctAnswer);
    missed.incorrectSelections?.forEach((selection) => addCurriculumNeed(needs, selection));
  });

  Object.entries(record.categoryScores ?? {}).forEach(([category, score]) => {
    if (score.missed > 0 || score.skipped > 0) {
      addCurriculumNeed(needs, category);
    }
  });

  if ("currentWord" in record) addCurriculumNeed(needs, record.currentWord);
  if ("word" in record) addCurriculumNeed(needs, record.word);
  if ("correctAnswer" in record) addCurriculumNeed(needs, record.correctAnswer);

  return needs;
}

function curriculumSubjectForReportView(view: DataReportView): "skills" | "listening" | "math" {
  if (view === "math") return "math";
  if (view === "listening") return "listening";
  return "skills";
}

function curriculumRecommendationLessonLabel(recommendation: CurriculumRecommendation) {
  const lessonNumber = recommendation.lessonNumber
    ? `Lesson ${recommendation.lessonNumber.replace(/^lesson\s*#?\s*/i, "")}`
    : "";

  return [
    recommendation.subjectLabel,
    recommendation.unitOrModule,
    lessonNumber,
  ].filter(Boolean).join(" - ");
}

function recommendationMatchesNeedCandidate(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const terms = [candidate.need, ...candidate.searchTerms]
    .map(normalizeCurriculumNeedKey)
    .filter(Boolean);
  const matchedNeeds = recommendation.matchedNeeds
    .map(normalizeCurriculumNeedKey)
    .filter(Boolean);

  return matchedNeeds.some((matchedNeed) =>
    terms.some((term) =>
      matchedNeed === term
      || matchedNeed.includes(term)
      || term.includes(matchedNeed),
    ),
  );
}

function curriculumNeedScholarCount(candidate: CurriculumNeedCandidate) {
  return candidate.scholars.length || candidate.count;
}

function curriculumGroupReason(candidate: CurriculumNeedCandidate) {
  const scholarCount = curriculumNeedScholarCount(candidate);
  const evidenceLabel = `${candidate.count} evidence point${candidate.count === 1 ? "" : "s"}`;
  const scholarLabel = `${scholarCount} scholar${scholarCount === 1 ? "" : "s"}`;
  return `${candidate.source || "Game and assessment data"} found ${evidenceLabel} connected to ${scholarLabel}.`;
}

function curriculumRecommendationDetailsForCandidate(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const terms = [candidate.need, ...candidate.searchTerms]
    .map(normalizeCurriculumNeedKey)
    .filter(Boolean);

  return (recommendation.matchDetails ?? []).filter((detail) => {
    const detailNeed = normalizeCurriculumNeedKey(detail.need);
    return terms.some((term) =>
      detailNeed === term
      || detailNeed.includes(term)
      || term.includes(detailNeed),
    );
  });
}

function curriculumRecommendationMatchLabel(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const detail = curriculumRecommendationDetailsForCandidate(recommendation, candidate)[0];

  if (detail?.matchType === "direct") return "Direct lesson skill";
  if (detail?.matchType === "standard") return "Priority standard match";
  if (detail?.matchType === "lesson") return "Lesson title match";
  if (detail?.matchType === "related") return "Related lesson focus";
  if (detail?.matchType === "source") return "Source text match";
  return recommendation.matchedNeeds.length ? "Curriculum match" : "Suggested lesson";
}

function curriculumRecommendationReason(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const detail = curriculumRecommendationDetailsForCandidate(recommendation, candidate)[0];

  if (detail?.reason) return detail.reason;
  if (recommendation.reason) return recommendation.reason;
  if (recommendation.matchedNeeds.length) {
    return `Matched ${recommendation.matchedNeeds.slice(0, 4).join(", ")} in the saved Hub lesson.`;
  }
  return `Suggested for ${candidate.need} based on the current data view.`;
}

function isStrongSmallGroupLessonMatch(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
  index: number,
) {
  const detail = curriculumRecommendationDetailsForCandidate(recommendation, candidate)[0];
  return index === 0
    || recommendation.score >= 56
    || ["direct", "standard"].includes(detail?.matchType || "");
}

function curriculumGroupUploadUrl(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const params = new URLSearchParams();
  params.set("teacherTool", "curriculum");
  params.set("uploadNeed", candidate.need);
  params.set("groupNeed", candidate.need);
  params.set("groupSubject", subject);
  params.set("groupSource", candidate.source);
  if (candidate.scholars.length) params.set("groupScholars", candidate.scholars.join("|"));
  if (candidate.searchTerms.length) params.set("groupTerms", candidate.searchTerms.slice(0, 12).join("|"));
  return `${HUB_CLASS_URL}?${params.toString()}`;
}

function curriculumFamilyPracticeTips(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const need = candidate.need.toLowerCase();

  if (subject === "math") {
    return {
      lookFor: "Your child can explain the math idea with objects, drawings, words, or numbers.",
      steps: [
        `Use small objects at home to practice ${candidate.need}.`,
        "Ask your child to tell a quick math story, act it out, draw it, and say what the numbers mean.",
        "Keep the numbers small at first. If it feels easy, ask your child to explain the answer in a full sentence.",
      ],
      prompt: "Tell a math story, show it with objects or a drawing, and explain how you know.",
    };
  }

  if (subject === "listening") {
    return {
      lookFor: "Your child can talk about the story or topic using details from what they heard.",
      steps: [
        `Read or listen to a short story together and focus on ${candidate.need}.`,
        "Pause to ask who, what, where, when, why, and how questions.",
        "Have your child answer in a complete sentence and use one important word from the lesson or story.",
      ],
      prompt: "Tell me the most important part and one detail that helped you know.",
    };
  }

  if (need.includes("segment") || need.includes("blend")) {
    return {
      lookFor: "Your child can hear each sound in a word and put the sounds back together.",
      steps: [
        "Say a short word slowly and have your child tap one finger for each sound.",
        "Then have your child blend the sounds back together to say the whole word.",
        "Try 5 words, then stop while it still feels successful.",
      ],
      prompt: "Tap the sounds, blend the word, then say the word in a sentence.",
    };
  }

  if (need.includes("ch") || need.includes("sh") || need.includes("th") || need.includes("digraph")) {
    return {
      lookFor: "Your child can notice the two-letter sound, say it, read it in words, and write it.",
      steps: [
        `Look for ${candidate.need} in books, signs, or words around the house.`,
        "Have your child underline the sound, say the sound, then read the whole word.",
        "Ask your child to write 3 words with that sound and read them back to you.",
      ],
      prompt: "Find the sound, say the sound, read the word, and write one more word like it.",
    };
  }

  if (need.includes("vowel") || need.includes("letter") || need.length <= 3) {
    return {
      lookFor: "Your child can connect the letter or spelling to the sound and use it in a word.",
      steps: [
        `Practice the sound or spelling: ${candidate.need}.`,
        "Say the sound, find it in a word, read the word, then write the word.",
        "Mix in 2 words your child already knows so the practice feels confident.",
      ],
      prompt: "Say the sound, read the word, write the word, and use it in a sentence.",
    };
  }

  return {
    lookFor: "Your child can explain and practice the skill without guessing.",
    steps: [
      `Practice ${candidate.need} for 5 to 10 minutes.`,
      "Ask your child to show the skill, explain their thinking, and try one more example.",
      "Keep it short and positive. A little correct practice is better than a long frustrating session.",
    ],
    prompt: "Show me how you know, then try one more.",
  };
}

function rosterScopedTeacherEmail(email: string) {
  return rosterTeacherEmailForEmail(email) || email;
}

function resultModeLabel(mode: string) {
  if (mode === "whole-class-miss") {
    return "Whole Class";
  }

  if (mode === "practice-complete") {
    return "Practice";
  }

  return "Complete";
}

function progressStatusLabel(status: string) {
  if (status === "left-early") {
    return "Left before finishing";
  }

  if (status === "completed") {
    return "Completed";
  }

  if (status === "started") {
    return "Started";
  }

  return "In progress";
}

function skillsDataStatusLabel(status: SkillsDataStatus) {
  if (status === "mastered") {
    return "Mastered";
  }

  if (status === "needs-review") {
    return "Needs review";
  }

  return "No evidence";
}

function escapeReportHtml(value: unknown) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return replacements[character] ?? character;
  });
}

function resultPercent(result: ResultSubmission) {
  return result.totalQuestions
    ? Math.round((result.score / result.totalQuestions) * 100)
    : 0;
}

function soundSafariStatuses(results: ResultSubmission[]) {
  let previousMastered = true;

  return SOUND_SAFARI_LEVELS.map((level) => {
    const levelResults = results.filter(
      (result) =>
        result.gameId === "unit1-zone1-sound-safari"
        && (result.levelId === level.id || result.levelName === level.name),
    );
    const successfulResults = levelResults.filter(
      (result) =>
        result.masteryEarned
        || resultPercent(result) >= SOUND_SAFARI_MASTERY_PERCENT,
    );
    const masteryCount = Math.min(
      SOUND_SAFARI_MASTERY_TARGET,
      Math.max(
        ...successfulResults.map((result) => result.masteryCount ?? 0),
        successfulResults.length,
        0,
      ),
    );
    const mastered = masteryCount >= SOUND_SAFARI_MASTERY_TARGET;
    const locked = !previousMastered;
    previousMastered = previousMastered && mastered;

    return {
      attemptsLeft: Math.max(0, SOUND_SAFARI_MASTERY_TARGET - masteryCount),
      level,
      locked,
      mastered,
      masteryCount,
      totalAttempts: levelResults.length,
      wrongCount: levelResults.reduce(
        (total, result) => total + result.missedQuestions.length,
        0,
      ),
    };
  });
}
function managedGameStatuses(
  results: ResultSubmission[],
  game: ManagedGame,
) {
  let previousMastered = true;

  return game.levels.map((level, index) => {
    const levelResults = results.filter(
      (result) =>
        result.gameId === game.gameId
        && (
          result.levelId === level.id
          || result.levelName === level.name
          || result.levelIndex === index
        ),
    );
    const successfulResults = levelResults.filter(
      (result) =>
        result.masteryEarned
        || resultPercent(result) >= SOUND_SAFARI_MASTERY_PERCENT,
    );
    const masteryCount = Math.min(
      SOUND_SAFARI_MASTERY_TARGET,
      Math.max(
        ...successfulResults.map((result) => result.masteryCount ?? 0),
        successfulResults.length,
        0,
      ),
    );
    const mastered = masteryCount >= SOUND_SAFARI_MASTERY_TARGET;
    const locked = !previousMastered;

    previousMastered = previousMastered && mastered;

    return {
      attemptsLeft: Math.max(
        0,
        SOUND_SAFARI_MASTERY_TARGET - masteryCount,
      ),
      level,
      locked,
      mastered,
      masteryCount,
      totalAttempts: levelResults.length,
      wrongCount: levelResults.reduce(
        (total, result) =>
          total + result.missedQuestions.length,
        0,
      ),
    };
  });
}
export function ScholarResultsPanel({ onClose }: { onClose: () => void }) {
  const [activityWindow, setActivityWindow] =
    useState<ActivityWindow>("all");
  const [curriculumRecommendationError, setCurriculumRecommendationError] = useState("");
  const [curriculumRecommendationNeeds, setCurriculumRecommendationNeeds] =
    useState<string[]>([]);
  const [curriculumRecommendationStatus, setCurriculumRecommendationStatus] =
    useState<CurriculumRecommendationStatus>("idle");
  const [curriculumRecommendations, setCurriculumRecommendations] =
    useState<CurriculumRecommendation[]>([]);
  const [dashboardFocus, setDashboardFocus] =
    useState<DashboardFocus>("mostWrong");
  const [dashboardSubject, setDashboardSubject] =
    useState<DashboardSubject>("none");
  const [dataReportView, setDataReportView] =
    useState<DataReportView>("students");
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastName, setLastName] = useState("");
  const [levelControlOpen, setLevelControlOpen] = useState(false);
  const [lessonLookupGameId, setLessonLookupGameId] = useState(
    "eureka-math-module-1",
  );
  const [lessonLookupNumber, setLessonLookupNumber] = useState("");
  const [managedGames, setManagedGames] =
    useState<ManagedGame[]>(MANAGED_GAMES);
  const [progressRecords, setProgressRecords] =
    useState<ProgressSubmission[]>([]);
  const [preassessmentControls, setPreassessmentControls] =
    useState<PreassessmentControl[]>([]);
  const [results, setResults] = useState<ResultSubmission[]>([]);
  const [scholarFilter, setScholarFilter] = useState("all");
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [scholarControls, setScholarControls] =
    useState<ScholarControl[]>([]);
  const [smallGroupLessonSources, setSmallGroupLessonSources] =
    useState<Record<string, SmallGroupLessonSource>>({});
  const [skillsDataEditNote, setSkillsDataEditNote] = useState("");
  const [skillsDataEditStatus, setSkillsDataEditStatus] =
    useState<SkillsDataStatus>("unassessed");
  const [skillsDataOverrides, setSkillsDataOverrides] =
    useState<SkillsDataOverride[]>([]);
  const [skillsDataReportId, setSkillsDataReportId] =
    useState<SkillsDataReportId>("letter-sounds");
  const [skillsDataFocusMode, setSkillsDataFocusMode] =
    useState<SkillsDataFocusMode>("all");
  const [skillsDataSortMode, setSkillsDataSortMode] =
    useState<SkillsDataSortMode>("name");
  const [isSavingSkillsDataEdit, setIsSavingSkillsDataEdit] = useState(false);
  const [selectedSkillsDataCellKey, setSelectedSkillsDataCellKey] = useState("");
  const [selectedSkillsDataScholarId, setSelectedSkillsDataScholarId] = useState("");
  const [selectedScholarId, setSelectedScholarId] = useState("");
  const [selectedSmallGroupNeedKey, setSelectedSmallGroupNeedKey] = useState("");
  const [selectedManagedGameId, setSelectedManagedGameId] = useState(
    "unit1-zone1-sound-safari",
  );
  const [selectedTargetLevelIndex, setSelectedTargetLevelIndex] =
    useState(0);
  const [selectedTargetQuestionNumber, setSelectedTargetQuestionNumber] =
    useState(1);
  const [status, setStatus] = useState("");
  const [teacherAccount, setTeacherAccount] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");
  const rosterAddTeacherEmail = useMemo(() => {
    if (authorizedTeachers.some((teacher) => teacher.email === teacherFilter)) {
      return teacherFilter;
    }

    return rosterTeacherEmailForEmail(teacherAccount);
  }, [teacherAccount, teacherFilter]);

  const loadDashboardData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { auth, db } = await loadFirebase();
      const user =
        auth.currentUser ??
        (await new Promise<FirebaseUser | null>((resolve) => {
          const unsubscribe = auth.onAuthStateChanged((nextUser) => {
            unsubscribe();
            resolve(nextUser);
          });
        }));

      const signedInEmail = user?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to view scholar results.");
      }

      setTeacherAccount(signedInEmail);
      setTeacherFilter((currentFilter) =>
        currentFilter === "all"
          ? rosterTeacherEmailForEmail(signedInEmail) || signedInEmail
          : currentFilter,
      );

      const [
        scholarSnapshot,
        resultSnapshot,
        progressSnapshot,
        controlSnapshot,
        preassessmentControlSnapshot,
        skillsDataOverrideSnapshot,
        nextManagedGames,
      ] = await Promise.all([
        db.collection(SCHOLAR_COLLECTION).get(),
        db.collection(RESULT_COLLECTION).get(),
        db.collection(PROGRESS_COLLECTION).get(),
        db.collection(SCHOLAR_CONTROL_COLLECTION).get(),
        db.collection(PREASSESSMENT_CONTROL_COLLECTION).get(),
        db.collection(SKILLS_DATA_OVERRIDE_COLLECTION).get(),
        loadManagedGameMetadata(db),
      ]);

      const nextScholars = scholarSnapshot.docs
        .map(mapScholar)
        .sort((a, b) =>
          `${teacherLabelForEmail(a.teacherEmail)} ${a.firstName} ${a.lastName}`.localeCompare(
            `${teacherLabelForEmail(b.teacherEmail)} ${b.firstName} ${b.lastName}`,
          ),
        );

      setScholars(nextScholars);
      setScholarControls(controlSnapshot.docs.map(mapScholarControl));
      setPreassessmentControls(
        preassessmentControlSnapshot.docs.map(mapPreassessmentControl),
      );
      setSkillsDataOverrides(
        skillsDataOverrideSnapshot.docs
          .map(mapSkillsDataOverride)
          .filter((override) => Boolean(override.target)),
      );
      setManagedGames(nextManagedGames);
      setResults(
        resultSnapshot.docs
          .map(mapResult)
          .sort((a, b) => {
            const dateA = formatDate(a.completedAt)?.getTime() ?? 0;
            const dateB = formatDate(b.completedAt)?.getTime() ?? 0;
            return dateB - dateA;
          }),
      );
      setProgressRecords(
        progressSnapshot.docs
          .map(mapProgress)
          .sort((a, b) => {
            const dateA = formatDate(a.updatedAt)?.getTime() ?? 0;
            const dateB = formatDate(b.updatedAt)?.getTime() ?? 0;
            return dateB - dateA;
          }),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Scholar results could not load.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadDashboardData();
  }, []);

  const duplicateFirstNames = useMemo(() => {
    const counts = new Map<string, number>();

    scholars.forEach((scholar) => {
      const key = `${scholar.teacherEmail}:${scholar.firstNameKey}`;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });

    return scholars
      .filter((scholar) => (counts.get(`${scholar.teacherEmail}:${scholar.firstNameKey}`) ?? 0) > 1)
      .map((scholar) => `${scholar.firstName} (${teacherLabelForEmail(scholar.teacherEmail)})`)
      .filter((name, index, list) => list.indexOf(name) === index);
  }, [scholars]);

  const gameOptions = useMemo(() => {
    const options = new Map<string, string>();

    results.forEach((result) => {
      options.set(result.gameId, gameTitleFor(result.gameId, result.gameTitle));
    });
    progressRecords.forEach((progress) => {
      options.set(progress.gameId, gameTitleFor(progress.gameId, progress.gameTitle));
    });

    return Array.from(options.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [progressRecords, results]);

  const selectedLessonLookupGame = useMemo(
    () => managedGames.find((game) => game.gameId === lessonLookupGameId),
    [lessonLookupGameId, managedGames],
  );
  const lessonLookupValue = Number(lessonLookupNumber);
  const lessonLookupActive =
    Number.isFinite(lessonLookupValue) && lessonLookupValue > 0;
  const lessonMatchedLevelIndexes = useMemo(() => {
    if (!selectedLessonLookupGame || !lessonLookupActive) {
      return [];
    }

    return selectedLessonLookupGame.levels
      .map((level, index) =>
        levelMatchesLesson(level, lessonLookupValue) ? index : -1,
      )
      .filter((index) => index >= 0);
  }, [lessonLookupActive, lessonLookupValue, selectedLessonLookupGame]);
  const lessonMatchedLevels = lessonMatchedLevelIndexes.map(
    (levelIndex) => selectedLessonLookupGame?.levels[levelIndex],
  ).filter((level): level is ManagedLevel => Boolean(level));

  const visibleScholars = useMemo(() => {
    if (teacherFilter === "all") {
      return scholars;
    }

    return scholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
  }, [scholars, teacherFilter]);
  const reportScholars = useMemo(
    () => visibleScholars.filter(scholarIncludedInReports),
    [visibleScholars],
  );
  const hiddenReportScholars = useMemo(
    () => visibleScholars.filter((scholar) => !scholarIncludedInReports(scholar)),
    [visibleScholars],
  );

  const reportSubject: DashboardSubject =
    dataReportView === "skills" || dataReportView === "listening" || dataReportView === "math"
      ? dataReportView
      : "none";
  const effectiveDashboardSubject =
    reportSubject === "none" ? dashboardSubject : reportSubject;
  const activeReportLabel =
    dataReportView === "skills"
      ? "CKLA Skills"
      : dataReportView === "listening"
        ? "Listening & Learning"
        : dataReportView === "math"
          ? "Math"
          : "Students";
  const curriculumRecommendationSubject = curriculumSubjectForReportView(dataReportView);

  const visibleSkillsDataReports = useMemo(() => {
    const subject: SkillsDataReportSubject = dataReportView === "math" ? "math" : "skills";
    return SKILLS_DATA_REPORTS.filter((report) => report.subject === subject);
  }, [dataReportView]);
  const selectedSkillsDataReport =
    visibleSkillsDataReports.find((report) => report.id === skillsDataReportId)
    ?? visibleSkillsDataReports[0]
    ?? SKILLS_DATA_REPORTS[0];
  const skillsDataRows = useMemo(
    () => buildSkillsDataRows(
      selectedSkillsDataReport.id,
      selectedSkillsDataReport.targets,
      reportScholars,
      results,
      progressRecords,
      skillsDataOverrides,
      skillsDataSortMode,
    ),
    [
      progressRecords,
      results,
      selectedSkillsDataReport,
      skillsDataOverrides,
      skillsDataSortMode,
      reportScholars,
    ],
  );
  const skillsDataTargetSummaryRows = useMemo(
    () => skillsDataTargetSummaries(skillsDataRows, selectedSkillsDataReport.targets),
    [selectedSkillsDataReport.targets, skillsDataRows],
  );
  const visibleSkillsDataTargets = useMemo(
    () => {
      const filteredTargets = skillsDataTargetSummaryRows
        .filter((summary) => skillsDataTargetIsVisible(summary, skillsDataFocusMode))
        .map((summary) => summary.target);

      return filteredTargets.length ? filteredTargets : selectedSkillsDataReport.targets;
    },
    [
      selectedSkillsDataReport.targets,
      skillsDataFocusMode,
      skillsDataTargetSummaryRows,
    ],
  );
  const visibleSkillsDataTargetSet = useMemo(
    () => new Set(visibleSkillsDataTargets),
    [visibleSkillsDataTargets],
  );
  const visibleSkillsDataRows = useMemo(
    () => skillsDataRows.filter((row) =>
      skillsDataRowIsVisible(
        row,
        visibleSkillsDataTargetSet,
        skillsDataFocusMode,
        selectedSkillsDataReport.targets.length,
      ),
    ),
    [
      selectedSkillsDataReport.targets.length,
      skillsDataFocusMode,
      skillsDataRows,
      visibleSkillsDataTargetSet,
    ],
  );
  const skillsDataAt100ScholarCount = skillsDataRows.filter((row) =>
    row.masteredCount >= selectedSkillsDataReport.targets.length,
  ).length;
  const skillsDataCloseScholarCount = skillsDataRows.filter((row) => {
    const closeThreshold = Math.max(1, Math.ceil(selectedSkillsDataReport.targets.length * 0.8));
    return row.masteredCount >= closeThreshold
      && row.masteredCount < selectedSkillsDataReport.targets.length;
  }).length;
  const skillsDataTargetsWithNeedsCount =
    skillsDataTargetSummaryRows.filter((summary) => summary.needsReviewCount > 0).length;
  const skillsDataTargetsAt100Count = skillsDataTargetSummaryRows.filter((summary) =>
    summary.totalCount > 0 && summary.masteredCount === summary.totalCount,
  ).length;
  const skillsDataMostNeedsRow = [...skillsDataRows].sort((a, b) =>
    b.needsReviewCount - a.needsReviewCount
    || a.scholar.firstName.localeCompare(b.scholar.firstName),
  )[0];
  const selectedSkillsDataCell = useMemo(() => {
    if (!selectedSkillsDataCellKey) {
      return null;
    }

    const [scholarId, target] = selectedSkillsDataCellKey.split("|");
    const row = skillsDataRows.find((nextRow) => nextRow.scholar.id === scholarId);
    const cell = row?.cells.find((nextCell) => nextCell.target === target);

    return row && cell ? { cell, row } : null;
  }, [selectedSkillsDataCellKey, skillsDataRows]);
  const selectedSkillsDataOverride = useMemo(() => {
    if (!selectedSkillsDataCell) {
      return null;
    }

    return skillsDataOverrides.find((override) =>
      override.reportId === selectedSkillsDataReport.id
      && override.target === selectedSkillsDataCell.cell.target
      && (
        override.scholarId === selectedSkillsDataCell.row.scholar.id
        || override.scholarFirstNameKey === selectedSkillsDataCell.row.scholar.firstNameKey
      ),
    ) ?? null;
  }, [selectedSkillsDataCell, selectedSkillsDataReport.id, skillsDataOverrides]);
  const selectedSkillsDataScholarRow = useMemo(
    () => skillsDataRows.find((row) => row.scholar.id === selectedSkillsDataScholarId) ?? null,
    [selectedSkillsDataScholarId, skillsDataRows],
  );
  const skillsDataManualEvidenceCount = skillsDataOverrides.filter((override) =>
    override.reportId === selectedSkillsDataReport.id
    && reportScholars.some((scholar) =>
      scholar.id === override.scholarId
      || scholar.firstNameKey === override.scholarFirstNameKey,
    ),
  ).length;

  useEffect(() => {
    if (!selectedSkillsDataCell) {
      return;
    }

    setSkillsDataEditStatus(selectedSkillsDataOverride?.status ?? selectedSkillsDataCell.cell.status);
    setSkillsDataEditNote(selectedSkillsDataOverride?.note ?? "");
  }, [selectedSkillsDataCell, selectedSkillsDataOverride]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      if (hiddenReportScholars.some((scholar) => recordBelongsToScholar(result, scholar))) {
        return false;
      }

      const teacherScopedScholars =
        teacherFilter === "all"
          ? reportScholars
          : reportScholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
      const match = matchResult(result, teacherScopedScholars);

      if (teacherFilter !== "all") {
        const resultTeacherEmail = rosterScopedTeacherEmail(result.teacherEmail);

        if (resultTeacherEmail !== "unassigned" && resultTeacherEmail !== teacherFilter) {
          return false;
        }

        if (result.teacherEmail === "unassigned" && !match.scholar) {
          return false;
        }
      }

      if (scholarFilter !== "all" && match.scholar?.id !== scholarFilter) {
        return false;
      }

      if (effectiveDashboardSubject !== "none" && gameSubjectForGameId(result.gameId) !== effectiveDashboardSubject) {
        return false;
      }

      if (lessonLookupActive) {
        if (!recordMatchesLesson(
          result,
          selectedLessonLookupGame,
          lessonMatchedLevelIndexes,
        )) {
          return false;
        }
      } else if (gameFilter !== "all" && result.gameId !== gameFilter) {
        return false;
      }

      if (!isWithinActivityWindow(result.completedAt, activityWindow)) {
        return false;
      }

      if (dateFilter && toDateInputValue(result.completedAt) !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [
    activityWindow,
    effectiveDashboardSubject,
    dateFilter,
    gameFilter,
    hiddenReportScholars,
    lessonLookupActive,
    lessonMatchedLevelIndexes,
    results,
    scholarFilter,
    reportScholars,
    selectedLessonLookupGame,
    teacherFilter,
  ]);

  const filteredProgress = useMemo(() => {
    return progressRecords.filter((progress) => {
      if (progress.status === "completed") {
        return false;
      }

      if (hiddenReportScholars.some((scholar) => recordBelongsToScholar(progress, scholar))) {
        return false;
      }

      const teacherScopedScholars =
        teacherFilter === "all"
          ? reportScholars
          : reportScholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
      const match = matchResult(progress, teacherScopedScholars);

      if (teacherFilter !== "all") {
        const progressTeacherEmail = rosterScopedTeacherEmail(progress.teacherEmail);

        if (progressTeacherEmail !== "unassigned" && progressTeacherEmail !== teacherFilter) {
          return false;
        }

        if (progress.teacherEmail === "unassigned" && !match.scholar) {
          return false;
        }
      }

      if (scholarFilter !== "all" && match.scholar?.id !== scholarFilter) {
        return false;
      }

      if (effectiveDashboardSubject !== "none" && gameSubjectForGameId(progress.gameId) !== effectiveDashboardSubject) {
        return false;
      }

      if (lessonLookupActive) {
        if (!recordMatchesLesson(
          progress,
          selectedLessonLookupGame,
          lessonMatchedLevelIndexes,
        )) {
          return false;
        }
      } else if (gameFilter !== "all" && progress.gameId !== gameFilter) {
        return false;
      }

      if (!isWithinActivityWindow(progress.updatedAt, activityWindow)) {
        return false;
      }

      if (dateFilter && toDateInputValue(progress.updatedAt) !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [
    activityWindow,
    effectiveDashboardSubject,
    dateFilter,
    gameFilter,
    hiddenReportScholars,
    lessonLookupActive,
    lessonMatchedLevelIndexes,
    progressRecords,
    scholarFilter,
    reportScholars,
    selectedLessonLookupGame,
    teacherFilter,
  ]);

  const selectedScholar = useMemo(
    () => scholars.find((scholar) => scholar.id === selectedScholarId) ?? null,
    [scholars, selectedScholarId],
  );

  const resultsForScholar = (scholar: Scholar) =>
    results.filter((result) => matchResult(result, [scholar]).scholar?.id === scholar.id);

  const selectedManagedGame =
    managedGames.find(
      (game) => game.gameId === selectedManagedGameId,
    ) ?? managedGames[0] ?? MANAGED_GAMES[0];
  const selectedPreassessmentConfig =
    preassessmentConfigForGameId(selectedManagedGame.gameId);
  const selectedGameIsPreassessment =
    Boolean(selectedPreassessmentConfig);

  const selectedScholarResults = useMemo(
    () =>
      selectedScholar
        ? resultsForScholar(selectedScholar).filter(
            (result) => result.gameId === selectedManagedGame.gameId,
          )
        : [],
    [results, selectedManagedGame.gameId, selectedScholar],
  );

  const selectedScholarProgress = useMemo(
    () =>
      selectedScholar
        ? progressRecords.filter(
            (progress) =>
              progress.status !== "completed"
              && progress.gameId === selectedManagedGame.gameId
              && matchResult(progress, [selectedScholar]).scholar?.id === selectedScholar.id,
          )
        : [],
    [progressRecords, selectedManagedGame.gameId, selectedScholar],
  );

  const selectedScholarControl = selectedScholar
    ? scholarControls.find((control) => control.scholarFirstNameKey === selectedScholar.firstNameKey)
    : undefined;
  const selectedPreassessmentControl = selectedScholar
    ? preassessmentControls.find(
        (control) =>
          control.gameId === selectedManagedGame.gameId
          && control.scholarFirstNameKey === selectedScholar.firstNameKey,
      )
    : undefined;

  const selectedSoundSafariStatuses = useMemo(() => {
    const statuses = managedGameStatuses(
      selectedScholarResults,
      selectedManagedGame,
    );
    const savedGameControl =
      selectedScholarControl?.gameControls?.[
        selectedManagedGame.gameId
      ];
    const legacyUnitOneControl =
      selectedManagedGame.gameId === "unit1-zone1-sound-safari"
        ? selectedScholarControl
        : undefined;
    const activeControl = savedGameControl ?? legacyUnitOneControl;
    let previousMastered = true;

    return statuses.map((nextStatus, index) => {
      const hasMasteryOverride =
        activeControl?.masteryOverrideLevelIndexes.includes(index)
        ?? false;
      const masteryCount = hasMasteryOverride
        ? activeControl?.masteryCounts[index] ?? 0
        : nextStatus.masteryCount;
      const mastered =
        masteryCount >= SOUND_SAFARI_MASTERY_TARGET;
      const teacherUnlocked =
        activeControl?.unlockedLevelIndexes.includes(index) ?? false;
      const teacherLocked =
        activeControl?.lockedLevelIndexes.includes(index) ?? false;
      const locked =
        teacherLocked
        || (index !== 0 && !teacherUnlocked && !previousMastered);

      previousMastered = mastered;

      return {
        ...nextStatus,
        attemptsLeft: Math.max(
          0,
          SOUND_SAFARI_MASTERY_TARGET - masteryCount,
        ),
        locked,
        mastered,
        masteryCount,
      };
    });
  }, [
    selectedManagedGame,
    selectedScholarControl,
    selectedScholarResults,
  ]);
  const dashboardDateActive =
    activityWindow !== "all" || Boolean(dateFilter);
  const dashboardScopeActive =
    effectiveDashboardSubject !== "none" || gameFilter !== "all";
  const dashboardActive =
    lessonLookupActive || (dashboardDateActive && dashboardScopeActive);
  const dashboardResults = dashboardActive ? filteredResults : [];
  const dashboardProgress = dashboardActive ? filteredProgress : [];
  const dashboardStudentSummaries = useMemo(() => {
    const summaries = new Map<
      string,
      StudentDashboardSummary & {
        issueCounts: Map<string, number>;
        missedCounts: Map<string, number>;
        mostRecentMs: number;
      }
    >();

    const ensureSummary = (
      record: ResultSubmission | ProgressSubmission,
    ) => {
      const match = matchResult(record, reportScholars);
      const id =
        match.scholar?.id
        || `${match.tone}:${match.label}:${record.scholarFirstNameKey}`;
      const existing = summaries.get(id);

      if (existing) {
        return existing;
      }

      const summary = {
        id,
        issueCounts: new Map<string, number>(),
        label: match.label,
        missedCounts: new Map<string, number>(),
        mostRecentMs: 0,
        scholarId: match.scholar?.id,
        sessions: 0,
        tone: match.tone,
        topIssue: "",
        topIssueCount: 0,
        unfinishedCount: 0,
        repeatWrongCount: 0,
        wrongCount: 0,
      };

      summaries.set(id, summary);
      return summary;
    };

    const addRecord = (
      record: ResultSubmission | ProgressSubmission,
      dateValue: unknown,
    ) => {
      const summary = ensureSummary(record);
      const recordDate = formatDate(dateValue);
      const missCount = recordMissCount(record);

      summary.sessions += 1;
      summary.wrongCount += missCount;
      summary.mostRecentMs = Math.max(
        summary.mostRecentMs,
        recordDate?.getTime() ?? 0,
      );

      record.missedQuestions.forEach((missed) => {
        const key = missedQuestionKey(record, missed);
        const label = missedQuestionLabel(record, missed);
        const repeats = Math.max(1, missed.incorrectSelections?.length ?? 0);
        summary.missedCounts.set(
          key,
          (summary.missedCounts.get(key) ?? 0) + repeats,
        );
        summary.issueCounts.set(
          label,
          (summary.issueCounts.get(label) ?? 0) + repeats,
        );
      });

      if (!record.missedQuestions.length && missCount > 0) {
        const label =
          "currentQuestionLabel" in record && record.currentQuestionLabel
            ? `${gameTitleFor(record.gameId, record.gameTitle)} - ${record.currentQuestionLabel}`
            : `${gameTitleFor(record.gameId, record.gameTitle)} - Needs review`;
        summary.issueCounts.set(
          label,
          (summary.issueCounts.get(label) ?? 0) + missCount,
        );
        summary.missedCounts.set(
          label,
          (summary.missedCounts.get(label) ?? 0) + missCount,
        );
      }

      if ("status" in record && recordLooksUnfinished(record)) {
        summary.unfinishedCount += 1;
      }
    };

    dashboardResults.forEach((result) => addRecord(result, result.completedAt));
    dashboardProgress.forEach((progress) => addRecord(progress, progress.updatedAt));

    const sorted = Array.from(summaries.values()).map((summary) => {
      const topIssueEntry = Array.from(summary.issueCounts.entries())
        .sort((a, b) => b[1] - a[1])[0];
      const repeatWrongCount = Math.max(
        0,
        ...Array.from(summary.missedCounts.values()),
      );

      return {
        id: summary.id,
        label: summary.label,
        scholarId: summary.scholarId,
        sessions: summary.sessions,
        tone: summary.tone,
        topIssue: topIssueEntry?.[0] ?? "No specific question recorded",
        topIssueCount: topIssueEntry?.[1] ?? 0,
        unfinishedCount: summary.unfinishedCount,
        repeatWrongCount,
        wrongCount: summary.wrongCount,
      };
    });

    return sorted.sort((a, b) => {
      if (dashboardFocus === "repeatMisses") {
        return b.repeatWrongCount - a.repeatWrongCount
          || b.wrongCount - a.wrongCount
          || a.label.localeCompare(b.label);
      }

      if (dashboardFocus === "unfinished") {
        return b.unfinishedCount - a.unfinishedCount
          || b.wrongCount - a.wrongCount
          || a.label.localeCompare(b.label);
      }

      if (dashboardFocus === "name") {
        return a.label.localeCompare(b.label);
      }

      return b.wrongCount - a.wrongCount
        || b.repeatWrongCount - a.repeatWrongCount
        || a.label.localeCompare(b.label);
    });
  }, [
    dashboardFocus,
    dashboardProgress,
    dashboardResults,
    reportScholars,
  ]);
  const dashboardStruggles = useMemo(() => {
    const summaries = new Map<
      string,
      { count: number; label: string; searchTerms: Set<string>; students: Map<string, string> }
    >();

    const addRecord = (record: ResultSubmission | ProgressSubmission) => {
      const match = matchResult(record, reportScholars);
      const studentKey =
        match.scholar?.id
        || `${match.tone}:${match.label}:${record.scholarFirstNameKey}`;

      record.missedQuestions.forEach((missed) => {
        const key = smallGroupNeedKey(record, missed);
        const existing = summaries.get(key) ?? {
          count: 0,
          label: smallGroupNeedLabel(record, missed),
          searchTerms: new Set<string>(),
          students: new Map<string, string>(),
        };

        existing.count += Math.max(1, missed.incorrectSelections?.length ?? 0);
        smallGroupNeedSearchTerms(record, missed).forEach((term) => {
          const cleanTerm = normalizeCurriculumNeedText(term);
          if (cleanTerm) existing.searchTerms.add(cleanTerm);
        });
        existing.students.set(studentKey, match.label);
        summaries.set(key, existing);
      });
    };

    dashboardResults.forEach(addRecord);
    dashboardProgress.forEach(addRecord);

    return Array.from(summaries.entries())
      .map(([key, value]) => ({
        count: value.count,
        key,
        label: value.label,
        searchTerms: Array.from(value.searchTerms),
        studentCount: value.students.size,
        students: Array.from(value.students.values()).sort((a, b) => a.localeCompare(b)),
      } satisfies SmallGroupNeedSummary))
      .sort((a, b) => b.studentCount - a.studentCount || b.count - a.count)
      .slice(0, 4);
  }, [dashboardProgress, dashboardResults, reportScholars]);
  const dashboardWrongTotal = dashboardStudentSummaries.reduce(
    (total, summary) => total + summary.wrongCount,
    0,
  );
  const dashboardRepeatFlags = dashboardStudentSummaries.filter(
    (summary) => summary.repeatWrongCount >= 3,
  ).length;
  const dashboardUnfinishedTotal = dashboardStudentSummaries.reduce(
    (total, summary) => total + summary.unfinishedCount,
    0,
  );
  const recentResults = dashboardResults.slice(0, 8);
  const recentProgress = dashboardProgress.slice(0, 8);
  const selectedSkillsDataScholarResults = useMemo(() => {
    if (!selectedSkillsDataScholarRow) {
      return [];
    }

    return results
      .filter((result) =>
        gameSubjectForGameId(result.gameId) === curriculumRecommendationSubject
        && matchResult(result, [selectedSkillsDataScholarRow.scholar]).scholar?.id === selectedSkillsDataScholarRow.scholar.id,
      )
      .slice(0, 8);
  }, [curriculumRecommendationSubject, results, selectedSkillsDataScholarRow]);
  const selectedSkillsDataScholarProgress = useMemo(() => {
    if (!selectedSkillsDataScholarRow) {
      return [];
    }

    return progressRecords
      .filter((progress) =>
        progress.status !== "completed"
        && gameSubjectForGameId(progress.gameId) === curriculumRecommendationSubject
        && matchResult(progress, [selectedSkillsDataScholarRow.scholar]).scholar?.id === selectedSkillsDataScholarRow.scholar.id,
      )
      .slice(0, 5);
  }, [curriculumRecommendationSubject, progressRecords, selectedSkillsDataScholarRow]);
  const curriculumNeedCandidates = useMemo(() => {
    const candidates = new Map<string, CurriculumNeedCandidate>();

    if (dataReportView === "skills" || dataReportView === "math") {
      skillsDataTargetSummaryRows
        .filter((summary) => summary.needsReviewCount > 0)
        .sort((a, b) => b.needsReviewCount - a.needsReviewCount || a.target.localeCompare(b.target))
        .slice(0, 10)
        .forEach((summary) => {
          const scholarsForTarget = skillsDataRows
            .filter((row) =>
              row.cells.some((cell) =>
                cell.target === summary.target && cell.status === "needs-review",
              ),
            )
            .map((row) => `${row.scholar.firstName} ${row.scholar.lastName}`);

          addCurriculumNeedCandidate(candidates, summary.target, {
            count: summary.needsReviewCount,
            scholars: scholarsForTarget,
            searchTerms: [summary.target, `${selectedSkillsDataReport.label} ${summary.target}`],
            source: "Data at a Glance chart",
          });
        });
    }

    dashboardStruggles.forEach((struggle) => {
      addCurriculumNeedCandidate(candidates, struggle.label, {
        count: struggle.count,
        scholars: struggle.students,
        searchTerms: struggle.searchTerms,
        source: "Small-Group Needs",
      });
    });
    dashboardResults.forEach((result) => {
      const match = matchResult(result, reportScholars);
      curriculumNeedsFromRecord(result).forEach((need) => {
        addCurriculumNeedCandidate(candidates, need, {
          count: 1,
          scholars: [match.label],
          source: "Game and assessment results",
        });
      });
    });
    dashboardProgress.forEach((progress) => {
      const match = matchResult(progress, reportScholars);
      curriculumNeedsFromRecord(progress).forEach((need) => {
        addCurriculumNeedCandidate(candidates, need, {
          count: 1,
          scholars: [match.label],
          source: "Game and assessment results",
        });
      });
    });

    return Array.from(candidates.values())
      .sort((a, b) =>
        b.scholars.length - a.scholars.length
        || b.count - a.count
        || a.need.localeCompare(b.need),
      )
      .slice(0, 14);
  }, [
    dashboardProgress,
    dashboardResults,
    dashboardStruggles,
    dataReportView,
    selectedSkillsDataReport.label,
    skillsDataRows,
    skillsDataTargetSummaryRows,
    reportScholars,
  ]);
  const curriculumRecommendationGroups = useMemo(() => {
    return curriculumNeedCandidates.map((candidate) => ({
      candidate,
      recommendations: curriculumRecommendations
        .filter((recommendation) => recommendationMatchesNeedCandidate(recommendation, candidate))
        .slice(0, 4),
    }));
  }, [curriculumNeedCandidates, curriculumRecommendations]);
  const selectedSmallGroupNeed =
    curriculumNeedCandidates.find((need) => need.key === selectedSmallGroupNeedKey)
    ?? null;
  const selectedSmallGroupRecommendations = selectedSmallGroupNeed
    ? curriculumRecommendations
        .filter((recommendation) => recommendationMatchesNeedCandidate(recommendation, selectedSmallGroupNeed))
        .slice(0, 4)
    : [];

  const fetchCurriculumRecommendations = async () => {
    const needs = Array.from(new Set(
      curriculumNeedCandidates
        .flatMap((candidate) => [candidate.need, ...candidate.searchTerms])
        .map(normalizeCurriculumNeedText)
        .filter(Boolean),
    )).slice(0, 24);

    if (!needs.length) {
      setCurriculumRecommendations([]);
      setCurriculumRecommendationNeeds([]);
      setCurriculumRecommendationError("Choose Today, This Week, or a Data at a Glance report with needs first.");
      setCurriculumRecommendationStatus("error");
      return;
    }

    setCurriculumRecommendationStatus("loading");
    setCurriculumRecommendationError("");

    try {
      const response = await fetch(HUB_CURRICULUM_RECOMMENDATION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          limit: 8,
          needs,
          subject: curriculumRecommendationSubject,
        }),
      });

      if (!response.ok) {
        throw new Error("The Hub could not search curriculum lessons yet.");
      }

      const data = (await response.json()) as CurriculumRecommendationResponse;
      setCurriculumRecommendations(data.recommendations ?? []);
      setCurriculumRecommendationNeeds(data.needs?.length ? data.needs : needs);
      setCurriculumRecommendationStatus("success");
    } catch (nextError) {
      setCurriculumRecommendations([]);
      setCurriculumRecommendationError(
        nextError instanceof Error
          ? nextError.message
          : "Curriculum recommendations could not load yet.",
      );
      setCurriculumRecommendationStatus("error");
    }
  };

  const updateSmallGroupLessonSource = (
    recommendationId: string,
    nextSource: Partial<SmallGroupLessonSource>,
  ) => {
    setSmallGroupLessonSources((currentSources) => {
      const currentSource = currentSources[recommendationId] ?? { fileName: "", text: "" };
      return {
        ...currentSources,
        [recommendationId]: {
          ...currentSource,
          ...nextSource,
        },
      };
    });
  };

  const attachSmallGroupLessonSourceFile = async (
    recommendation: CurriculumRecommendation,
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    updateSmallGroupLessonSource(recommendation.id, {
      fileName: file.name,
    });

    if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
      const text = await file.text();
      updateSmallGroupLessonSource(recommendation.id, {
        fileName: file.name,
        text,
      });
      setStatus(`Attached ${file.name} for ${recommendation.lessonTitle || "this lesson"}.`);
      return;
    }

    setStatus(`Attached ${file.name}. Paste the key lesson steps or activity notes in the source box before printing.`);
  };

  const openDataReportView = (view: DataReportView) => {
    setDataReportView(view);
    setGameFilter("all");
    setLessonLookupNumber("");
    setScholarFilter("all");
    setSelectedSmallGroupNeedKey("");
    setSelectedSkillsDataCellKey("");
    setSelectedSkillsDataScholarId("");
    setSkillsDataFocusMode("all");
    setCurriculumRecommendations([]);
    setCurriculumRecommendationNeeds([]);
    setCurriculumRecommendationError("");
    setCurriculumRecommendationStatus("idle");

    if (view === "math") {
      setSkillsDataReportId("math-starting-point");
    } else if (view === "skills") {
      setSkillsDataReportId("letter-sounds");
    }

    if (view === "students") {
      setDashboardSubject("none");
      return;
    }

    setDashboardSubject("none");
    if (activityWindow === "all" && !dateFilter) {
      setActivityWindow("week");
    }
  };

  const addScholar = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setStatus("");

    const cleanFirstName = firstName.trim();
    const cleanLastName = lastName.trim();
    const firstNameKey = normalizeNameKey(cleanFirstName);
    const lastNameKey = normalizeNameKey(cleanLastName);

    if (!firstNameKey || !lastNameKey) {
      setError("Add both a first and last name.");
      return;
    }

    setIsAdding(true);

    try {
      const { auth, db, firebase } = await loadFirebase();

      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to add scholars.");
      }

      if (!isAuthorizedTeacherEmail(rosterAddTeacherEmail)) {
        throw new Error("Choose Mr. Davis or Ms. Vest before adding a scholar.");
      }

      await db.collection(SCHOLAR_COLLECTION).add({
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        firstName: cleanFirstName,
        firstNameKey,
        lastName: cleanLastName,
        lastNameKey,
        teacherEmail: rosterAddTeacherEmail,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setFirstName("");
      setLastName("");
      setTeacherFilter(rosterAddTeacherEmail);
      setStatus(`${cleanFirstName} was added to ${teacherLabelForEmail(rosterAddTeacherEmail)} roster.`);
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The scholar could not be added.");
    } finally {
      setIsAdding(false);
    }
  };

  const deleteScholar = async (scholar: Scholar) => {
    setError("");
    setStatus("");

    try {
      const { auth, db } = await loadFirebase();

      if (!isAuthorizedTeacherEmail(auth.currentUser?.email)) {
        throw new Error("Sign in with an authorized teacher Google account to delete scholars.");
      }

      await db.collection(SCHOLAR_COLLECTION).doc(scholar.id).delete();
      setStatus(`${scholar.firstName} ${scholar.lastName} was removed from ${teacherLabelForEmail(scholar.teacherEmail)} roster.`);
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The scholar could not be deleted.");
    }
  };

  const toggleTestScholarReportVisibility = async (scholar: Scholar) => {
    if (!isTestScholar(scholar)) {
      return;
    }

    const nextInclude = !scholar.includeInReports;
    setError("");
    setStatus("");

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to edit test-student data visibility.");
      }

      await db.collection(SCHOLAR_COLLECTION).doc(scholar.id).set({
        includeInReports: nextInclude,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      setScholars((currentScholars) =>
        currentScholars.map((currentScholar) =>
          currentScholar.id === scholar.id
            ? { ...currentScholar, includeInReports: nextInclude }
            : currentScholar,
        ),
      );
      setStatus(`${scholar.firstName} ${scholar.lastName} is now ${nextInclude ? "included in" : "hidden from"} charts, reports, and small-group suggestions.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Test-student data visibility could not be changed.");
    }
  };

  const deleteResult = async (result: ResultSubmission) => {
    setError("");
    setStatus("");

    try {
      const { auth, db } = await loadFirebase();

      if (!isAuthorizedTeacherEmail(auth.currentUser?.email)) {
        throw new Error("Sign in with an authorized teacher Google account to delete results.");
      }

      await db.collection(RESULT_COLLECTION).doc(result.id).delete();
      setStatus("The selected result was deleted.");
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The result could not be deleted.");
    }
  };

  const deleteProgress = async (progress: ProgressSubmission) => {
    setError("");
    setStatus("");

    try {
      const { auth, db } = await loadFirebase();

      if (!isAuthorizedTeacherEmail(auth.currentUser?.email)) {
        throw new Error("Sign in with an authorized teacher Google account to delete progress records.");
      }

      await db.collection(PROGRESS_COLLECTION).doc(progress.id).delete();
      setStatus("The selected unfinished session was deleted.");
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The unfinished session could not be deleted.");
    }
  };

  const saveSkillsDataEdit = async () => {
    if (!selectedSkillsDataCell) {
      return;
    }

    const { cell, row } = selectedSkillsDataCell;
    const docId = skillsDataOverrideDocId(row.scholar.id, selectedSkillsDataReport.id, cell.target);

    setError("");
    setStatus("");
    setIsSavingSkillsDataEdit(true);

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to edit skills data.");
      }

      if (skillsDataEditStatus === "unassessed") {
        await db.collection(SKILLS_DATA_OVERRIDE_COLLECTION).doc(docId).delete();
        setStatus(`Manual note cleared for ${row.scholar.firstName}: ${cell.target}.`);
      } else {
        const serverTime = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection(SKILLS_DATA_OVERRIDE_COLLECTION).doc(docId).set({
          createdAt: serverTime,
          note: skillsDataEditNote.trim(),
          reportId: selectedSkillsDataReport.id,
          scholarFirstName: row.scholar.firstName,
          scholarFirstNameKey: row.scholar.firstNameKey,
          scholarId: row.scholar.id,
          status: skillsDataEditStatus,
          target: cell.target,
          teacherEmail: row.scholar.teacherEmail,
          updatedAt: serverTime,
          updatedBy: signedInEmail,
        }, { merge: true });
        setStatus(`Manual observation saved for ${row.scholar.firstName}: ${cell.target}.`);
      }

      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Skills data could not be edited.");
    } finally {
      setIsSavingSkillsDataEdit(false);
    }
  };

  const skillsTargetSnapshotHtmlForScholar = (scholar: Scholar) =>
    SKILLS_DATA_REPORTS.map((report) => {
      const row = buildSkillsDataRows(
        report.id,
        report.targets,
        [scholar],
        results,
        progressRecords,
        skillsDataOverrides,
        "name",
      )[0];

      if (!row) {
        return "";
      }

      return `
        <h3>${escapeReportHtml(report.label)}</h3>
        <table class="skills-table">
          <thead>
            <tr>${report.targets.map((target) => `<th>${escapeReportHtml(target)}</th>`).join("")}<th>Total</th></tr>
          </thead>
          <tbody>
            <tr>
              ${row.cells.map((cell) => `<td class="${cell.status}">${cell.status === "mastered" ? "M" : cell.status === "needs-review" ? "!" : ""}</td>`).join("")}
              <td>${row.masteredCount}</td>
            </tr>
          </tbody>
        </table>
      `;
    }).join("");

  const printSkillsDataReport = () => {
    const reportWindow = window.open("", "_blank");
    const headerCells = visibleSkillsDataTargets
      .map((target) => `<th>${escapeReportHtml(target)}</th>`)
      .join("");
    const rowsHtml = visibleSkillsDataRows.map((row) => `
      <tr>
        <th>${escapeReportHtml(row.scholar.firstName)} ${escapeReportHtml(row.scholar.lastName)}</th>
        ${visibleSkillsDataTargets.map((target) => row.cells.find((cell) => cell.target === target)).map((cell) => cell ? `
          <td class="${cell.status}">
            ${cell.status === "mastered" ? "M" : cell.status === "needs-review" ? "!" : ""}
          </td>
        ` : "<td></td>").join("")}
        <td>${row.masteredCount}</td>
      </tr>
    `).join("");

    if (!reportWindow) {
      window.print();
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(selectedSkillsDataReport.label)} Data at a Glance</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:24px;color:#222}
          h1{margin:0 0 4px;font-size:24px}
          p{margin:0 0 16px;color:#555;font-size:13px}
          table{border-collapse:collapse;font-size:12px}
          th,td{border:1px solid #222;min-width:24px;height:24px;padding:3px;text-align:center}
          thead th{background:#f6f0df}
          tbody th{background:#fff;text-align:left;min-width:120px}
          td.mastered{background:#29d955}
          td.needs-review{background:#f24d42}
          td.unassessed{background:#f7f7f7}
          @media print{body{margin:10mm} table{page-break-inside:auto} tr{page-break-inside:avoid}}
        </style>
      </head>
      <body>
        <h1>${escapeReportHtml(selectedSkillsDataReport.label)} Data at a Glance</h1>
        <p>${escapeReportHtml(teacherFilter === "all" ? "All rosters" : teacherLabelForEmail(teacherFilter))} - ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr><th>Scholar</th>${headerCells}<th>Total</th></tr>
          </thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const printStudentOverviewReport = (scholar: Scholar) => {
    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      window.print();
      return;
    }

    const scholarResults = resultsForScholar(scholar);
    const scholarProgress = progressRecords.filter(
      (progress) =>
        progress.status !== "completed"
        && matchResult(progress, [scholar]).scholar?.id === scholar.id,
    );
    const resultDateMs = (result: ResultSubmission) =>
      formatDate(result.completedAt)?.getTime() ?? 0;
    const topNeedsForResults = (subjectResults: ResultSubmission[]) => {
      const counts = new Map<string, number>();

      subjectResults.forEach((result) => {
        result.missedQuestions.forEach((missed, index) => {
          const label =
            missed.category
            || missed.word
            || missed.correctAnswer
            || `${result.levelName || "Question"} ${missed.questionIndex ?? index + 1}`;
          counts.set(label, (counts.get(label) ?? 0) + 1);
        });
      });

      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
        .slice(0, 3)
        .map(([label, count]) => count > 1 ? `${label} (${count})` : label);
    };
    const resultSections: [DashboardSubject, string][] = [
      ["skills", "CKLA Skills"],
      ["listening", "Listening & Learning"],
      ["math", "Math"],
    ];
    const subjectSummaryRowsHtml = resultSections.map(([subject, label]) => {
      const subjectResults = scholarResults
        .filter((result) => gameSubjectForGameId(result.gameId) === subject)
        .sort((a, b) => resultDateMs(b) - resultDateMs(a));

      if (!subjectResults.length) {
        return `
          <tr>
            <td>${escapeReportHtml(label)}</td>
            <td>No saved results yet.</td>
            <td>-</td>
            <td>-</td>
          </tr>
        `;
      }

      const latest = subjectResults[0];
      const latestDate = formatDate(latest.completedAt);
      const latestLocation = learningLocationLabel(latest.learningLocation);
      const averagePercent = Math.round(
        subjectResults.reduce((sum, result) => (
          sum + (result.totalQuestions ? result.score / result.totalQuestions * 100 : 0)
        ), 0) / subjectResults.length,
      );
      const topNeeds = topNeedsForResults(subjectResults);
      const latestSummary = [
        gameTitleFor(latest.gameId, latest.gameTitle),
        latest.levelName,
        `Score ${latest.score}/${latest.totalQuestions}`,
        latestDate?.toLocaleDateString(),
        latestLocation,
      ].filter(Boolean).join(" - ");

      return `
        <tr>
          <td>${escapeReportHtml(label)}</td>
          <td>${escapeReportHtml(latestSummary)}</td>
          <td>${escapeReportHtml(`${subjectResults.length} result${subjectResults.length === 1 ? "" : "s"}; average ${averagePercent}%`)}</td>
          <td>${escapeReportHtml(topNeeds.length ? topNeeds.join(", ") : "No repeated needs saved")}</td>
        </tr>
      `;
    }).join("");
    const unfinishedHtml = scholarProgress.length
      ? `<table>
          <thead><tr><th>Game</th><th>Paused At</th><th>Last Updated</th></tr></thead>
          <tbody>${scholarProgress.slice(0, 5).map((progress) => {
          const updatedAt = formatDate(progress.updatedAt);
          const location = learningLocationLabel(progress.learningLocation);
          return `
            <tr>
              <td>${escapeReportHtml(gameTitleFor(progress.gameId, progress.gameTitle))}</td>
              <td>${escapeReportHtml(`${progress.levelName || "Game"} - question ${progress.currentQuestionIndex}/${progress.totalQuestions}`)}</td>
              <td>${escapeReportHtml(`${updatedAt ? updatedAt.toLocaleDateString() : "Date pending"}${location ? ` - ${location}` : ""}`)}</td>
            </tr>
          `;
        }).join("")}</tbody>
        </table>
        ${scholarProgress.length > 5 ? `<p>${escapeReportHtml(`${scholarProgress.length - 5} more unfinished session${scholarProgress.length - 5 === 1 ? "" : "s"} not shown.`)}</p>` : ""}`
      : "<p>No unfinished sessions.</p>";
    const skillsSnapshotHtml = skillsTargetSnapshotHtmlForScholar(scholar);

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(scholar.firstName)} ${escapeReportHtml(scholar.lastName)} Student Report</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:28px;color:#222}
          h1{margin:0 0 4px;font-size:28px}
          h2{margin:22px 0 8px;font-size:18px}
          h3{margin:14px 0 6px;font-size:15px}
          p,li,td,th{font-size:13px;line-height:1.4}
          table{width:100%;border-collapse:collapse;margin:8px 0 16px}
          th,td{border:1px solid #ccc;padding:7px;text-align:left;vertical-align:top}
          th{background:#fff0c8}
          .report-section{break-inside:avoid}
          .intro{max-width:760px;color:#555}
          .legend{display:flex;gap:14px;margin:4px 0 10px;color:#555;font-size:12px}
          .skills-table th,.skills-table td{min-width:23px;height:23px;padding:3px;text-align:center}
          .mastered{background:#29d955}
          .needs-review{background:#f24d42;color:#fff}
          .unassessed{background:#f7f7f7}
          @media print{body{margin:10mm}.report-section{break-inside:avoid}}
        </style>
      </head>
      <body>
        <h1>${escapeReportHtml(scholar.firstName)} ${escapeReportHtml(scholar.lastName)}</h1>
        <p>${escapeReportHtml(teacherLabelForEmail(scholar.teacherEmail))} - Printed ${escapeReportHtml(new Date().toLocaleDateString())}</p>
        <p class="intro">This overview summarizes saved learning-game and assessment data. It is designed for conferences and parent sharing; detailed teacher records remain in Data and Reports.</p>
        <section class="report-section">
          <h2>Subject Summary</h2>
          <table>
            <thead>
              <tr><th>Subject</th><th>Recent Result</th><th>Overall</th><th>Focus</th></tr>
            </thead>
            <tbody>${subjectSummaryRowsHtml}</tbody>
          </table>
        </section>
        <section class="report-section">
          <h2>Target Snapshot</h2>
          <div class="legend"><span>Green M = learned</span><span>Red ! = needs practice</span><span>Blank = not enough data yet</span></div>
          ${skillsSnapshotHtml || "<p>No skills target evidence yet.</p>"}
        </section>
        <section class="report-section">
          <h2>Started But Not Finished</h2>
          ${unfinishedHtml}
        </section>
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const setPreassessmentControl = async (
    scholar: Scholar,
    action: PreassessmentControl["action"],
  ) => {
    const config = selectedPreassessmentConfig;
    if (!config) {
      return;
    }

    const actionLabel =
      action === "retake"
        ? `Require ${scholar.firstName} to retake ${config.label}? Their completed result will stay in the report.`
        : action === "waived"
          ? `Waive ${config.label} for ${scholar.firstName}? They will be allowed into their games without taking it.`
          : `Cancel the current ${config.label} retake or waiver for ${scholar.firstName}?`;

    if (!window.confirm(actionLabel)) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to change assessment access.");
      }

      const commandId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await db
        .collection(PREASSESSMENT_CONTROL_COLLECTION)
        .doc(`${config.statusIdPrefix}${scholar.firstNameKey}`)
        .set({
          action,
          commandId,
          scholarFirstNameKey: scholar.firstNameKey,
          teacherEmail: signedInEmail,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        });

      setStatus(
        action === "retake"
          ? `${scholar.firstName} will take ${config.label} again.`
          : action === "waived"
            ? `${scholar.firstName} was waived from ${config.label}.`
            : `The special assessment requirement was canceled for ${scholar.firstName}.`,
      );
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Assessment access could not be changed.");
    }
  };

  const restorePreassessmentCompletion = async (scholar: Scholar) => {
    const config = selectedPreassessmentConfig;
    if (!config) {
      return;
    }

    const latestResult = results.find(
      (result) =>
        result.gameId === config.gameId
        && matchResult(result, [scholar]).scholar?.id === scholar.id,
    );

    if (!latestResult) {
      setError(`No completed ${config.label} result was found for ${scholar.firstName}. Use Waive Assessment instead.`);
      return;
    }

    if (!window.confirm(`Restore completed ${config.label} access for ${scholar.firstName} from their saved result?`)) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to restore assessment access.");
      }

      const statusId = `${config.statusIdPrefix}${scholar.firstNameKey}`;
      const commandId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      await Promise.all([
        db.collection(PREASSESSMENT_STATUS_COLLECTION).doc(statusId).set({
          completedAt: firebase.firestore.FieldValue.serverTimestamp(),
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          gameId: config.gameId,
          scholarFirstName: scholar.firstName,
          scholarFirstNameKey: scholar.firstNameKey,
          score: Math.max(0, Math.min(latestResult.score, latestResult.totalQuestions || 20)),
          subject: config.subject,
          totalQuestions: Math.max(1, latestResult.totalQuestions || 20),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true }),
        db.collection(PREASSESSMENT_CONTROL_COLLECTION).doc(statusId).set({
          action: "normal",
          commandId,
          scholarFirstNameKey: scholar.firstNameKey,
          teacherEmail: signedInEmail,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }),
      ]);

      setStatus(`Completed assessment access was restored for ${scholar.firstName}.`);
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Completed assessment access could not be restored.");
    }
  };

  const updateSelectedLevel = async (scholar: Scholar, levelAction: "master" | "relock" | "restart" | "send" | "unlock" | "unmaster") => {
    const targetLevel = selectedManagedGame.levels[selectedTargetLevelIndex];
    if (!targetLevel) return;

    const actionLabel =
      levelAction === "master"
        ? `mark ${targetLevel.name} mastered`
        : levelAction === "unmaster"
          ? `remove mastery from ${targetLevel.name}`
          : levelAction === "unlock"
            ? `unlock ${targetLevel.name}`
            : levelAction === "relock"
              ? `relock ${targetLevel.name}`
              : levelAction === "send"
                ? `send ${scholar.firstName} to ${targetLevel.name}, Question ${selectedTargetQuestionNumber}`
                : `restart ${targetLevel.name} at Question 1`;
    if (!window.confirm(`${actionLabel.charAt(0).toUpperCase()}${actionLabel.slice(1)} for ${scholar.firstName}? Previous results will remain in the teacher report.`)) {
      return;
    }

    setError("");
    setStatus("");

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher account first.");
      }

      const targetQuestionIndex =
        levelAction === "restart"
          ? 0
          : Math.max(
              0,
              Math.floor(selectedTargetQuestionNumber) - 1,
            );
      const commandId =
        levelAction === "restart" || levelAction === "send"
          ? `${Date.now()}-q${targetQuestionIndex}-${Math.random().toString(36).slice(2, 10)}`
          : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const existingControl = scholarControls.find((control) => control.scholarFirstNameKey === scholar.firstNameKey);
      const existingGameControl =
        existingControl?.gameControls?.[selectedManagedGame.gameId]
        ?? (selectedManagedGame.gameId === "unit1-zone1-sound-safari" ? existingControl : undefined);
      const unlockedLevels = new Set(existingGameControl?.unlockedLevelIndexes ?? []);
      const lockedLevels = new Set(existingGameControl?.lockedLevelIndexes ?? []);
      const masteryOverrides = new Set(existingGameControl?.masteryOverrideLevelIndexes ?? []);
      const masteryCounts = selectedManagedGame.levels.map((_, index) => selectedSoundSafariStatuses[index]?.masteryCount ?? 0);

      if (levelAction === "unlock" || levelAction === "master") {
        unlockedLevels.add(selectedTargetLevelIndex);
        lockedLevels.delete(selectedTargetLevelIndex);
      }
      if (levelAction === "relock") {
        lockedLevels.add(selectedTargetLevelIndex);
        unlockedLevels.delete(selectedTargetLevelIndex);
      }
      if (levelAction === "master" || levelAction === "unmaster") {
        masteryOverrides.add(selectedTargetLevelIndex);
        masteryCounts[selectedTargetLevelIndex] = levelAction === "master" ? SOUND_SAFARI_MASTERY_TARGET : 0;
      }

      const unlockedLevelIndexes = Array.from(unlockedLevels).sort((a, b) => a - b);
      const lockedLevelIndexes = Array.from(lockedLevels).sort((a, b) => a - b);
      const masteryOverrideLevelIndexes = Array.from(masteryOverrides).sort((a, b) => a - b);
      const restartLevelIndex = levelAction === "restart" || levelAction === "send" ? selectedTargetLevelIndex : -1;
      const nextGameControl: GameLevelControl = {
        commandId,
        lockedLevelIndexes,
        masteryCounts,
        masteryOverrideLevelIndexes,
        restartLevelIndex,
        unlockedLevelIndexes,
      };
      const gameControls = {
        ...(existingControl?.gameControls ?? {}),
        [selectedManagedGame.gameId]: nextGameControl,
      };
      const legacyUnitOneControl =
        selectedManagedGame.gameId === "unit1-zone1-sound-safari"
          ? nextGameControl
          : {
              commandId: existingControl?.commandId ?? "",
              lockedLevelIndexes: existingControl?.lockedLevelIndexes ?? [],
              masteryCounts: existingControl?.masteryCounts ?? SOUND_SAFARI_LEVELS.map(() => 0),
              masteryOverrideLevelIndexes: existingControl?.masteryOverrideLevelIndexes ?? [],
              restartLevelIndex: existingControl?.restartLevelIndex ?? -1,
              unlockedLevelIndexes: existingControl?.unlockedLevelIndexes ?? [],
            };

      await db.collection(SCHOLAR_CONTROL_COLLECTION).doc(scholar.firstNameKey).set({
        action: "manage-game-levels",
        commandId,
        gameControls,
        lockedLevelIndexes: legacyUnitOneControl.lockedLevelIndexes,
        masteryCounts: legacyUnitOneControl.masteryCounts,
        masteryOverrideLevelIndexes: legacyUnitOneControl.masteryOverrideLevelIndexes,
        restartLevelIndex: legacyUnitOneControl.restartLevelIndex,
        scholarFirstName: scholar.firstName,
        scholarFirstNameKey: scholar.firstNameKey,
        teacherEmail: signedInEmail,
        unlockedLevelIndexes: legacyUnitOneControl.unlockedLevelIndexes,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setScholarControls((current) => [
        ...current.filter((control) => control.scholarFirstNameKey !== scholar.firstNameKey),
        {
          action: "manage-game-levels",
          commandId,
          gameControls,
          lockedLevelIndexes: legacyUnitOneControl.lockedLevelIndexes,
          masteryCounts: legacyUnitOneControl.masteryCounts,
          masteryOverrideLevelIndexes: legacyUnitOneControl.masteryOverrideLevelIndexes,
          restartLevelIndex: legacyUnitOneControl.restartLevelIndex,
          scholarFirstNameKey: scholar.firstNameKey,
          unlockedLevelIndexes: legacyUnitOneControl.unlockedLevelIndexes,
        },
      ]);

      const successMessage =
        levelAction === "send"
          ? `${scholar.firstName} was sent to ${targetLevel.name}, Question ${selectedTargetQuestionNumber}.`
          : `${targetLevel.name} was ${levelAction === "master" ? "marked mastered" : levelAction === "unmaster" ? "set to 0 of 3" : levelAction === "unlock" ? "unlocked" : levelAction === "relock" ? "relocked" : "restarted at Question 1"} for ${scholar.firstName}.`;
      setStatus(successMessage);
      setLevelControlOpen(false);
      window.alert(successMessage);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The selected level could not be assigned.");
    }
  };
  const printSelectedScholarReport = () => {
    if (!selectedScholar) {
      return;
    }

    const reportWindow = window.open("", "_blank");

    if (!reportWindow) {
      window.print();
      return;
    }

    const progressHtml = selectedSoundSafariStatuses
      .map(
        (status) => `
          <tr>
            <td>${escapeReportHtml(status.level.name)}</td>
            <td>${selectedGameIsPreassessment ? `${status.totalAttempts} attempt${status.totalAttempts === 1 ? "" : "s"}` : status.locked ? "Locked" : status.mastered ? "3/3 Mastered" : `${status.masteryCount}/3`}</td>
            <td>${selectedGameIsPreassessment ? "Assessment" : status.attemptsLeft}</td>
            <td>${status.totalAttempts}</td>
            <td>${status.wrongCount}</td>
          </tr>
        `,
      )
      .join("");

    const unfinishedHtml = selectedScholarProgress.length
      ? selectedScholarProgress
          .map((progress) => {
            const updatedAt = formatDate(progress.updatedAt);
            const practiceHtml = progress.missedQuestions.length
              ? `<strong>Needs practice so far</strong><ul>${progress.missedQuestions.map((missed, index) => `<li>${escapeReportHtml(formatMissedContext(missed))}${escapeReportHtml(formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer))}</li>`).join("")}</ul>`
              : "No missed questions recorded so far.";
            return `
              <li>
                <strong>${escapeReportHtml(gameTitleFor(progress.gameId, progress.gameTitle))}</strong><br>
                ${escapeReportHtml(progress.levelName || "Game")} - reached question ${progress.currentQuestionIndex}/${progress.totalQuestions}<br>
                ${escapeReportHtml(updatedAt ? updatedAt.toLocaleString() : "Date pending")}<br>
                Last seen: ${escapeReportHtml(progress.currentWord || "Question")} - ${escapeReportHtml(progress.currentQuestionLabel)}<br>
                ${categoryScoresReportHtml(progress)}
                ${practiceHtml}
              </li>
            `;
          })
          .join("")
      : "<li>No unfinished sessions.</li>";

    const resultsHtml = selectedScholarResults.length
      ? selectedScholarResults
          .map((result) => {
            const completedAt = formatDate(result.completedAt);
            const missedHtml = result.missedQuestions.length
              ? result.missedQuestions
                  .map(
                    (missed, index) => `
                      <li>
                        ${escapeReportHtml(formatMissedContext(missed))}
                        ${escapeReportHtml(
                          formatMissedText(
                            missed.word || `Question ${missed.questionIndex ?? index + 1}`,
                            missed.incorrectSelections?.join(", "),
                            missed.correctAnswer,
                          ),
                        )}
                      </li>
                    `,
                  )
                  .join("")
              : "<li>No missed questions recorded.</li>";

            return `
              <section class="result-card">
                <h3>${escapeReportHtml(gameTitleFor(result.gameId, result.gameTitle))}</h3>
                <p>${escapeReportHtml(`${completedAt ? completedAt.toLocaleString() : "Date pending"}${learningLocationLabel(result.learningLocation) ? ` - ${learningLocationLabel(result.learningLocation)}` : ""}`)}</p>
                <p>${escapeReportHtml(result.levelName ? `${result.levelName} - ` : "")}Score ${result.score}/${result.totalQuestions} - Attempts ${result.attempts}${result.masteryTarget && !preassessmentConfigForGameId(result.gameId) ? ` - Mastery ${result.masteryCount ?? 0}/${result.masteryTarget}` : ""}</p>
                ${categoryScoresReportHtml(result)}
                <h4>Missed</h4>
                <ul>${missedHtml}</ul>
              </section>
            `;
          })
          .join("")
      : "<p>No saved results yet.</p>";
    const currentUnitSkillsSnapshotHtml = isSkillsDataSourceGameId(selectedManagedGame.gameId)
      ? skillsTargetSnapshotHtmlForScholar(selectedScholar)
      : "";

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(selectedScholar.firstName)} ${escapeReportHtml(selectedScholar.lastName)} Results</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:32px;color:#222}
          h1{margin:0 0 4px;font-size:28px}
          h2{margin:26px 0 10px;font-size:20px}
          h3{margin:0 0 8px;font-size:17px}
          h4{margin:12px 0 6px;font-size:14px}
          p,li,td,th{font-size:14px;line-height:1.4}
          table{width:100%;border-collapse:collapse;margin:10px 0 20px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#fff0c8}
          .legend{display:flex;gap:14px;margin:4px 0 10px;color:#555;font-size:12px}
          .result-card{break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:14px;margin:0 0 14px}
          .skills-table{table-layout:fixed}
          .skills-table th,.skills-table td{min-width:18px;height:21px;padding:3px;text-align:center;font-size:11px}
          .mastered{background:#29d955}
          .needs-review{background:#f24d42;color:#fff}
          .unassessed{background:#f7f7f7}
          @media print{.mastered,.needs-review,.unassessed{print-color-adjust:exact;-webkit-print-color-adjust:exact}.result-card{break-inside:avoid}}
        </style>
      </head>
      <body>
        <h1>${escapeReportHtml(selectedScholar.firstName)} ${escapeReportHtml(selectedScholar.lastName)}</h1>
        <p>${escapeReportHtml(teacherLabelForEmail(selectedScholar.teacherEmail))}</p>
        <h2>${escapeReportHtml(selectedManagedGame.title)} Progress</h2>
        <table>
          <thead>
            <tr><th>Level</th><th>Mastery</th><th>Left</th><th>Attempts</th><th>Missed</th></tr>
          </thead>
          <tbody>${progressHtml}</tbody>
        </table>
        ${currentUnitSkillsSnapshotHtml ? `
          <h2>Target Snapshot</h2>
          <div class="legend"><span>Green M = learned</span><span>Red ! = needs practice</span><span>Blank = not enough data yet</span></div>
          ${currentUnitSkillsSnapshotHtml}
        ` : ""}
        <h2>Started But Not Finished</h2>
        <ul>${unfinishedHtml}</ul>
        <h2>Saved Results</h2>
        ${resultsHtml}
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const printCurriculumGroupPlan = (
    candidate: CurriculumNeedCandidate,
    recommendations: CurriculumRecommendation[],
    lessonSource?: SmallGroupLessonSource,
  ) => {
    const reportWindow = window.open("", "_blank");
    const sourceText = lessonSource?.text.trim() ?? "";
    const sourceTitle = lessonSource?.fileName.trim() ?? "";
    const scholarItems = candidate.scholars.length
      ? candidate.scholars.map((scholar) => `<li>${escapeReportHtml(scholar)}</li>`).join("")
      : "<li>No roster names were attached to this need yet.</li>";
    const recommendationsHtml = recommendations.length
      ? recommendations.map((recommendation) => `
        <article class="lesson-card">
          <p class="match">${escapeReportHtml(curriculumRecommendationMatchLabel(recommendation, candidate))}</p>
          <h2>${escapeReportHtml(curriculumRecommendationLessonLabel(recommendation))}</h2>
          <h3>${escapeReportHtml(recommendation.lessonTitle || "Saved Hub lesson")}</h3>
          ${recommendation.priorityStandard ? `<p><strong>Standard:</strong> ${escapeReportHtml(recommendation.priorityStandard)}</p>` : ""}
          ${recommendation.iCanStatement ? `<p><strong>I Can:</strong> ${escapeReportHtml(recommendation.iCanStatement)}</p>` : ""}
          ${recommendation.objective || recommendation.parentSummary ? `<p>${escapeReportHtml(recommendation.objective || recommendation.parentSummary)}</p>` : ""}
          <p><strong>Why this lesson:</strong> ${escapeReportHtml(curriculumRecommendationReason(recommendation, candidate))}</p>
        </article>
      `).join("")
      : `<p>No saved Hub lesson matched this need yet. Use the upload option to add a lesson source for this group.</p>`;

    if (!reportWindow) {
      window.print();
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(candidate.need)} Small Group</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:28px;color:#222}
          h1{margin:0 0 6px;font-size:26px}
          h2{margin:0 0 4px;font-size:17px}
          h3{margin:0 0 8px;font-size:15px;color:#2f4054}
          p,li{font-size:13px;line-height:1.45}
          .meta{color:#555;margin:0 0 18px}
          .layout{display:grid;grid-template-columns:220px 1fr;gap:22px;align-items:start}
          ul{margin:8px 0 0;padding-left:18px}
          .lesson-card{break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:12px;margin:0 0 12px}
          .match{margin:0 0 6px;color:#6f5b2f;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
          @media print{body{margin:12mm}.lesson-card{break-inside:avoid}.layout{grid-template-columns:190px 1fr}}
        </style>
      </head>
      <body>
        <h1>Small-Group Curriculum Plan</h1>
        <p class="meta">${escapeReportHtml(activeReportLabel)} - ${escapeReportHtml(new Date().toLocaleDateString())}</p>
        <div class="layout">
          <aside>
            <h2>${escapeReportHtml(candidate.need)}</h2>
            <p>${escapeReportHtml(curriculumGroupReason(candidate))}</p>
            <h3>Scholars</h3>
            <ul>${scholarItems}</ul>
          </aside>
          <main>
            <h2>Recommended Hub Lessons</h2>
            ${recommendationsHtml}
            ${sourceText || sourceTitle ? `
              <article class="lesson-card">
                <p class="match">Uploaded lesson source</p>
                ${sourceTitle ? `<h3>${escapeReportHtml(sourceTitle)}</h3>` : ""}
                ${sourceText ? `<p>${escapeReportHtml(sourceText.slice(0, 1800))}${sourceText.length > 1800 ? "..." : ""}</p>` : "<p>Source file attached. Add/paste key lesson steps before printing for more detail.</p>"}
              </article>
            ` : ""}
          </main>
        </div>
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const printFamilyPracticePlan = (
    candidate: CurriculumNeedCandidate,
    recommendations: CurriculumRecommendation[],
  ) => {
    const reportWindow = window.open("", "_blank");
    const bestLesson = recommendations[0];
    const tips = curriculumFamilyPracticeTips(candidate, curriculumRecommendationSubject);
    const lessonFocus =
      bestLesson?.iCanStatement
      || bestLesson?.objective
      || bestLesson?.parentSummary
      || candidate.need;

    if (!reportWindow) {
      window.print();
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${escapeReportHtml(candidate.need)} Family Practice</title>
        <style>
          body{font-family:Arial,Helvetica,sans-serif;margin:28px;color:#223044;background:#fff}
          .page{max-width:760px;margin:0 auto}
          h1{margin:0 0 6px;font-size:28px;color:#26384d}
          h2{margin:22px 0 8px;font-size:18px;color:#26384d}
          p,li{font-size:15px;line-height:1.55}
          .subtitle{margin:0 0 18px;color:#65758b;font-weight:700}
          .focus{border:1px solid #d8e2ec;border-radius:12px;background:#f8fbff;padding:14px;margin:16px 0}
          .steps{border:1px solid #f1d6bf;border-radius:12px;background:#fff8f0;padding:14px;margin:16px 0}
          .prompt{border-left:5px solid #f9735b;background:#fff3ef;padding:12px 14px;font-weight:700}
          ul{margin:8px 0 0;padding-left:22px}
          .quiet{color:#65758b;font-size:13px}
          @media print{body{margin:12mm}.focus,.steps,.prompt{break-inside:avoid}}
        </style>
      </head>
      <body>
        <main class="page">
          <h1>Family Practice: ${escapeReportHtml(candidate.need)}</h1>
          <p class="subtitle">A short, simple way to help your child practice at home.</p>

          <section class="focus">
            <h2>What We Are Practicing</h2>
            <p>${escapeReportHtml(lessonFocus)}</p>
            ${bestLesson ? `<p class="quiet">Connected classroom lesson: ${escapeReportHtml(curriculumRecommendationLessonLabel(bestLesson))}${bestLesson.lessonTitle ? ` - ${escapeReportHtml(bestLesson.lessonTitle)}` : ""}</p>` : ""}
          </section>

          <section class="steps">
            <h2>Try This At Home</h2>
            <ul>
              ${tips.steps.map((step) => `<li>${escapeReportHtml(step)}</li>`).join("")}
            </ul>
          </section>

          <section>
            <h2>What To Listen Or Look For</h2>
            <p>${escapeReportHtml(tips.lookFor)}</p>
            <p class="prompt">${escapeReportHtml(tips.prompt)}</p>
          </section>

          <p class="quiet">Keep practice short and encouraging. If your child gets stuck, model one example, then let them try again.</p>
        </main>
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const curriculumRecommendationSection = dataReportView !== "students" ? (
    <section className="curriculum-recommendation-card">
      <div className="result-row-head">
        <div>
          <p className="eyebrow">Curriculum Match</p>
          <h4>Plan From These Groups</h4>
        </div>
        <button
          className="teacher-control-button"
          disabled={!curriculumNeedCandidates.length || curriculumRecommendationStatus === "loading"}
          onClick={() => void fetchCurriculumRecommendations()}
          type="button"
        >
          {curriculumRecommendationStatus === "loading" ? "Finding..." : "Find Lessons"}
        </button>
      </div>
      <p className="pin-helper">
        Uses the charted data, small-group evidence, and current game/assessment results together so each suggestion shows who needs help, why, and which Hub lessons may fit.
      </p>
      {curriculumNeedCandidates.length ? (
        <div className="curriculum-recommendation-need-summary">
          {curriculumNeedCandidates.slice(0, 8).map((candidate) => (
            <span key={candidate.key}>
              {candidate.need} - {curriculumNeedScholarCount(candidate)} scholar{curriculumNeedScholarCount(candidate) === 1 ? "" : "s"}
            </span>
          ))}
        </div>
      ) : (
        <p className="empty-results-message">
          Use the subject chart or choose Today/This Week so the system can find small-group needs first.
        </p>
      )}
      {curriculumRecommendationError ? (
        <p className="teacher-message error">{curriculumRecommendationError}</p>
      ) : null}
      {curriculumRecommendationStatus === "success" && curriculumRecommendationNeeds.length ? (
        <p className="pin-helper">
          Searched {curriculumRecommendationNeeds.length} curriculum term{curriculumRecommendationNeeds.length === 1 ? "" : "s"} from the chart and small-group data.
        </p>
      ) : null}
      {curriculumRecommendationStatus === "success" ? (
        <div className="curriculum-recommendation-group-list">
          {curriculumRecommendationGroups.map(({ candidate, recommendations }, index) => (
            <details className="curriculum-recommendation-group" key={candidate.key} open={index === 0}>
              <summary>
                <span>
                  <strong>{candidate.need}</strong>
                  <em>{candidate.source}</em>
                </span>
                <span>
                  {curriculumNeedScholarCount(candidate)} scholar{curriculumNeedScholarCount(candidate) === 1 ? "" : "s"}
                </span>
              </summary>
              <div className="curriculum-recommendation-group-tools">
                <p>{curriculumGroupReason(candidate)}</p>
                <div>
                  <button
                    className="teacher-text-button"
                    onClick={() => printCurriculumGroupPlan(candidate, recommendations)}
                    type="button"
                  >
                    Print Group
                  </button>
                  <button
                    className="teacher-text-button"
                    onClick={() => printFamilyPracticePlan(candidate, recommendations)}
                    type="button"
                  >
                    Print Family Help
                  </button>
                  <a
                    className="curriculum-recommendation-link secondary"
                    href={curriculumGroupUploadUrl(candidate, curriculumRecommendationSubject)}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Upload Lesson to Hub
                  </a>
                </div>
              </div>
              {candidate.scholars.length ? (
                <div className="curriculum-recommendation-scholars">
                  {candidate.scholars.map((scholar) => (
                    <span key={scholar}>{scholar}</span>
                  ))}
                </div>
              ) : (
                <p className="empty-results-message">No roster names were attached to this need yet.</p>
              )}
              {recommendations.length ? (
                <div className="curriculum-recommendation-list">
                  {recommendations.map((recommendation) => (
                    <article className="curriculum-recommendation-item" key={recommendation.id}>
                      <div>
                        <span>{curriculumRecommendationMatchLabel(recommendation, candidate)}</span>
                        <h5>{recommendation.lessonTitle}</h5>
                        <small>{curriculumRecommendationLessonLabel(recommendation)}</small>
                      </div>
                      {recommendation.priorityStandard ? (
                        <p><strong>Standard:</strong> {recommendation.priorityStandard}</p>
                      ) : null}
                      {recommendation.iCanStatement ? (
                        <p><strong>I Can:</strong> {recommendation.iCanStatement}</p>
                      ) : null}
                      {recommendation.objective || recommendation.parentSummary ? (
                        <p>{recommendation.objective || recommendation.parentSummary}</p>
                      ) : null}
                      <p><strong>Why this lesson:</strong> {curriculumRecommendationReason(recommendation, candidate)}</p>
                      <a
                        className="curriculum-recommendation-link"
                        href={recommendation.url || HUB_CLASS_URL}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open Lesson in Hub
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-results-message">
                  No saved Hub lesson matched this need yet. Use Upload Lesson to Hub to add the source lesson for this group.
                </p>
              )}
            </details>
          ))}
        </div>
      ) : null}
    </section>
  ) : null;

  return (
    <div aria-modal="true" className="scholar-results-overlay" role="dialog">
      <section className="scholar-results-panel">
        <div className="scholar-results-header">
          <div>
            <p className="eyebrow">Teacher Edit</p>
            <h2>Data and Reports</h2>
            {teacherAccount ? <p className="pin-helper">Signed in as {teacherLabelForEmail(teacherAccount)}</p> : null}
          </div>
          <button className="teacher-control-button secondary" onClick={onClose} type="button">
            Close
          </button>
        </div>

        {error ? <p className="teacher-message error">{error}</p> : null}
        {status ? <p className="teacher-message success">{status}</p> : null}

        {duplicateFirstNames.length ? (
          <div className="privacy-note">
            <strong>Duplicate first name found:</strong> {duplicateFirstNames.join(", ")}. For these scholars, use a private class code or icon choice later so the child can pick the right record without seeing last names.
          </div>
        ) : null}

        <nav className="data-report-tabs" aria-label="Data report sections">
          {([
            ["students", "Students"],
            ["skills", "CKLA Skills"],
            ["listening", "Listening & Learning"],
            ["math", "Math"],
          ] as [DataReportView, string][]).map(([view, label]) => (
            <button
              className={dataReportView === view ? "is-active" : ""}
              key={view}
              onClick={() => openDataReportView(view)}
              type="button"
            >
              {label}
            </button>
          ))}
        </nav>

        <div className="scholar-results-grid">
          {dataReportView !== "students" ? (
          <section className="teacher-card results-overview-card">
            <div className="results-dashboard-head">
              <div>
                <h3>{activeReportLabel} Reports</h3>
                <p className="pin-helper">
                  {dashboardActive
                    ? `${dashboardResults.length} result${dashboardResults.length === 1 ? "" : "s"}${dashboardProgress.length ? ` - ${dashboardProgress.length} unfinished` : ""}`
                    : dashboardDateActive
                      ? `Choose filters to build ${activeReportLabel} tiles.`
                      : "Choose Today or This Week to start."}
                </p>
              </div>
            </div>

            <div className="quick-filter-actions" aria-label="Activity date filters">
              <button
                className={activityWindow === "today" ? "is-active" : ""}
                onClick={() => {
                  setActivityWindow("today");
                  setDashboardSubject("none");
                  setDateFilter("");
                  setGameFilter("all");
                  setScholarFilter("all");
                  setSelectedSmallGroupNeedKey("");
                }}
                type="button"
              >
                Today
              </button>
              <button
                className={activityWindow === "week" ? "is-active" : ""}
                onClick={() => {
                  setActivityWindow("week");
                  setDashboardSubject("none");
                  setDateFilter("");
                  setGameFilter("all");
                  setScholarFilter("all");
                  setSelectedSmallGroupNeedKey("");
                }}
                type="button"
              >
                This Week
              </button>
              <button
                onClick={() => {
                  setActivityWindow("all");
                  setDashboardFocus("mostWrong");
                  setDashboardSubject("none");
                  setDateFilter("");
                  setGameFilter("all");
                  setLessonLookupNumber("");
                  setScholarFilter("all");
                  setSelectedSmallGroupNeedKey("");
                }}
                type="button"
              >
                Clear
              </button>
            </div>

            {reportSubject === "none" && dashboardDateActive && !lessonLookupActive ? (
              <div className="dashboard-subject-actions" aria-label="Dashboard subject filter">
                {[
                  ["skills", "CKLA Skills"],
                  ["listening", "Listening & Learning"],
                  ["math", "Math"],
                ].map(([subject, label]) => (
                  <button
                    className={dashboardSubject === subject ? "is-active" : ""}
                    key={subject}
                    onClick={() => {
                      setDashboardSubject(subject as DashboardSubject);
                      setGameFilter("all");
                      setLessonLookupNumber("");
                      setScholarFilter("all");
                      setSelectedSmallGroupNeedKey("");
                    }}
                    type="button"
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            <details className="dashboard-tools-panel">
              <summary>Game, date, and lesson tools</summary>
              <div className="result-filters">
                <label>
                  Game
                  <select
                    disabled={lessonLookupActive}
                    onChange={(event) => {
                      setDashboardSubject("none");
                      setGameFilter(event.target.value);
                      setSelectedSmallGroupNeedKey("");
                    }}
                    value={gameFilter}
                  >
                    <option value="all">All games</option>
                    {managedGames.map((game) => (
                      <option key={game.gameId} value={game.gameId}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Exact date
                  <input
                    onChange={(event) => {
                      setActivityWindow("all");
                      setDashboardSubject("none");
                      setDateFilter(event.target.value);
                      setScholarFilter("all");
                      setSelectedSmallGroupNeedKey("");
                    }}
                    type="date"
                    value={dateFilter}
                  />
                </label>
                <label>
                  Lesson lookup
                  <div className="lesson-lookup-fields">
                    <select
                      onChange={(event) => {
                        setDashboardSubject("none");
                        setLessonLookupGameId(event.target.value);
                        setGameFilter("all");
                        setScholarFilter("all");
                        setSelectedSmallGroupNeedKey("");
                      }}
                      value={lessonLookupGameId}
                    >
                      {managedGames.map((game) => (
                        <option key={game.gameId} value={game.gameId}>
                          {game.title}
                        </option>
                      ))}
                    </select>
                    <input
                      min={1}
                      onChange={(event) => {
                        setDashboardSubject("none");
                        setLessonLookupNumber(event.target.value);
                        setGameFilter("all");
                        setScholarFilter("all");
                        setSelectedSmallGroupNeedKey("");
                      }}
                      placeholder="Lesson #"
                      type="number"
                      value={lessonLookupNumber}
                    />
                  </div>
                </label>
              </div>
            </details>

            {lessonLookupActive ? (
              <p className="lesson-lookup-status">
                {lessonMatchedLevels.length
                  ? `Lesson ${lessonLookupValue} matches ${lessonMatchedLevels.map((level) => `${level.name}${level.lessonRange ? ` (${level.lessonRange})` : ""}`).join(", ")}.`
                  : `No level range includes Lesson ${lessonLookupValue}.`}
              </p>
            ) : null}

            {!dashboardActive ? (
              <div className="dashboard-empty-state">
                <strong>No results shown yet.</strong>
                <span>
                  {dashboardDateActive
                    ? `Adjust filters to show ${activeReportLabel} tiles.`
                    : "Pick Today or This Week first. Date and lesson tools stay tucked away until you need them."}
                </span>
              </div>
            ) : !dashboardResults.length && !dashboardProgress.length ? (
              <p className="empty-results-message">No activity found for these filters.</p>
            ) : (
              <div className="dashboard-results-view">
                <div className="dashboard-summary-tiles">
                  <article>
                    <strong>{dashboardStudentSummaries.length}</strong>
                    <span>active scholars</span>
                  </article>
                  <article>
                    <strong>{dashboardWrongTotal}</strong>
                    <span>wrong answers</span>
                  </article>
                  <article>
                    <strong>{dashboardRepeatFlags}</strong>
                    <span>repeat flags</span>
                  </article>
                  <article>
                    <strong>{dashboardUnfinishedTotal}</strong>
                    <span>unfinished</span>
                  </article>
                </div>

                <div className="dashboard-sort-row">
                  <label>
                    Sort student tiles
                    <select
                      onChange={(event) => setDashboardFocus(event.target.value as DashboardFocus)}
                      value={dashboardFocus}
                    >
                      <option value="mostWrong">Most wrong answers</option>
                      <option value="repeatMisses">Same question missed repeatedly</option>
                      <option value="unfinished">Unfinished or skipped</option>
                      <option value="name">Name</option>
                    </select>
                  </label>
                </div>

                <div className="student-struggle-grid">
                  {dashboardStudentSummaries.map((summary) => (
                    <button
                      className={`student-struggle-tile ${summary.repeatWrongCount >= 3 || summary.unfinishedCount ? "needs-attention" : ""}`}
                      disabled={!summary.scholarId}
                      key={summary.id}
                      onClick={() => {
                        if (summary.scholarId) {
                          setSelectedScholarId(summary.scholarId);
                        }
                      }}
                      type="button"
                    >
                      <span className={`match-pill ${summary.tone}`}>{summary.tone === "matched" ? "Student match" : summary.label}</span>
                      <strong>{summary.label}</strong>
                      <span>{summary.wrongCount} wrong</span>
                      {summary.repeatWrongCount >= 3 ? (
                        <em>Same question missed {summary.repeatWrongCount} times</em>
                      ) : summary.unfinishedCount ? (
                        <em>{summary.unfinishedCount} unfinished or skipped</em>
                      ) : (
                        <em>{summary.sessions} session{summary.sessions === 1 ? "" : "s"}</em>
                      )}
                      <small>{summary.topIssue}</small>
                    </button>
                  ))}
                </div>

                <div className="struggle-board">
                  <h4>Small-Group Needs</h4>
                  {curriculumNeedCandidates.length ? (
                    <div className="small-group-need-grid">
                      {curriculumNeedCandidates.slice(0, 6).map((candidate) => (
                        <button
                          className="small-group-need-tile"
                          key={candidate.key}
                          onClick={() => setSelectedSmallGroupNeedKey(candidate.key)}
                          type="button"
                        >
                          <strong>{curriculumNeedScholarCount(candidate)}</strong>
                          <span>scholar{curriculumNeedScholarCount(candidate) === 1 ? "" : "s"}</span>
                          <em>{candidate.need}</em>
                          <small>{candidate.source}</small>
                          <small>{candidate.count} evidence point{candidate.count === 1 ? "" : "s"}</small>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="empty-results-message">No chart or game needs were recorded for this view.</p>
                  )}
                </div>

                {selectedSmallGroupNeed ? (
                  <div className="small-group-popup-backdrop" role="presentation">
                    <section aria-modal="true" className="small-group-popup" role="dialog">
                      <div className="result-row-head">
                        <div>
                          <p className="eyebrow">Small Group</p>
                          <h3>{selectedSmallGroupNeed.need}</h3>
                        </div>
                        <button
                          className="teacher-control-button secondary"
                          onClick={() => setSelectedSmallGroupNeedKey("")}
                          type="button"
                        >
                          Close
                        </button>
                      </div>
                      <p className="pin-helper">
                        {curriculumGroupReason(selectedSmallGroupNeed)}
                      </p>
                      <div className="small-group-popup-actions">
                        <button
                          className="teacher-control-button"
                          disabled={!curriculumNeedCandidates.length || curriculumRecommendationStatus === "loading"}
                          onClick={() => void fetchCurriculumRecommendations()}
                          type="button"
                        >
                          {curriculumRecommendationStatus === "loading" ? "Finding..." : "Find Lessons"}
                        </button>
                      </div>
                      {selectedSmallGroupNeed.scholars.length ? (
                        <div className="small-group-student-list">
                          {selectedSmallGroupNeed.scholars.map((student) => (
                            <span key={student}>{student}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="empty-results-message">No roster names were attached to this need yet.</p>
                      )}
                      <div className="curriculum-recommendation-list compact">
                        {selectedSmallGroupRecommendations.length ? (
                          selectedSmallGroupRecommendations.map((recommendation, index) => {
                            const lessonSource = smallGroupLessonSources[recommendation.id] ?? { fileName: "", text: "" };
                            const isStrongMatch = isStrongSmallGroupLessonMatch(recommendation, selectedSmallGroupNeed, index);

                            return (
                              <article
                                className={`curriculum-recommendation-item ${isStrongMatch ? "is-strong-match" : ""}`}
                                key={recommendation.id}
                              >
                                <div>
                                  <span>{curriculumRecommendationMatchLabel(recommendation, selectedSmallGroupNeed)}</span>
                                  <h5>{recommendation.lessonTitle}</h5>
                                  <small>{curriculumRecommendationLessonLabel(recommendation)}</small>
                                </div>
                                {isStrongMatch ? (
                                  <strong className="small-group-match-star">Best small-group plan match</strong>
                                ) : null}
                                <p><strong>Why this lesson:</strong> {curriculumRecommendationReason(recommendation, selectedSmallGroupNeed)}</p>
                                <div className="small-group-lesson-actions">
                                  <button
                                    className="teacher-text-button"
                                    onClick={() => printCurriculumGroupPlan(selectedSmallGroupNeed, [recommendation], lessonSource)}
                                    type="button"
                                  >
                                    Print Teacher Plan
                                  </button>
                                  <button
                                    className="teacher-text-button"
                                    onClick={() => printFamilyPracticePlan(selectedSmallGroupNeed, [recommendation])}
                                    type="button"
                                  >
                                    Print Family Help
                                  </button>
                                  <label className="curriculum-source-upload-button">
                                    Upload Source
                                    <input
                                      accept=".txt,.md,.csv,.pdf,application/pdf,text/*"
                                      onChange={(event) => {
                                        void attachSmallGroupLessonSourceFile(
                                          recommendation,
                                          event.currentTarget.files?.[0] ?? null,
                                        );
                                        event.currentTarget.value = "";
                                      }}
                                      type="file"
                                    />
                                  </label>
                                </div>
                                {lessonSource.fileName || lessonSource.text ? (
                                  <div className="small-group-source-box">
                                    {lessonSource.fileName ? <small>Source: {lessonSource.fileName}</small> : null}
                                    <textarea
                                      onChange={(event) => updateSmallGroupLessonSource(recommendation.id, { text: event.target.value })}
                                      placeholder="Paste the key lesson steps, activity, or notes you want the teacher plan to use."
                                      rows={4}
                                      value={lessonSource.text}
                                    />
                                  </div>
                                ) : null}
                              </article>
                            );
                          })
                        ) : (
                          <p className="empty-results-message">
                            Click Find Lessons to pull saved curriculum lessons for this group.
                          </p>
                        )}
                      </div>
                    </section>
                  </div>
                ) : null}

                <details className="dashboard-detail-list">
                  <summary>Show recent activity records</summary>
                  <div className="result-list">
                    {recentProgress.map((progress) => {
                      const match = matchResult(progress, reportScholars);
                      const updatedAt = formatDate(progress.updatedAt);

                      return (
                        <article className="result-row progress-row" key={`progress-${progress.id}`}>
                          <div className="result-row-head">
                            <strong>{match.label}</strong>
                            <span className={`match-pill ${match.tone}`}>{progressStatusLabel(progress.status)}</span>
                          </div>
                          <p>{gameTitleFor(progress.gameId, progress.gameTitle)}{progress.levelName ? ` - ${progress.levelName}` : ""}</p>
                          <p>{updatedAt ? updatedAt.toLocaleString() : "Date pending"} - question {progress.currentQuestionIndex}/{progress.totalQuestions}</p>
                        </article>
                      );
                    })}
                    {recentResults.map((result) => {
                      const match = matchResult(result, reportScholars);
                      const completedAt = formatDate(result.completedAt);

                      return (
                        <article className="result-row" key={`result-${result.id}`}>
                          <div className="result-row-head">
                            <strong>{match.label}</strong>
                            <span className={`match-pill ${match.tone}`}>{resultModeLabel(result.mode)}</span>
                          </div>
                          <p>{gameTitleFor(result.gameId, result.gameTitle)}{result.levelName ? ` - ${result.levelName}` : ""}</p>
                          <p>{completedAt ? completedAt.toLocaleString() : "Date pending"} - Score {result.score}/{result.totalQuestions} - Missed {recordMissCount(result)}</p>
                        </article>
                      );
                    })}
                  </div>
                </details>
              </div>
            )}

            {null}
          </section>
          ) : null}

          {dataReportView === "skills" || dataReportView === "math" ? (
          <section className="teacher-card skills-data-glance-card">
            <div className="skills-data-head">
              <div>
                <h3>{activeReportLabel} Data at a Glance</h3>
                <p className="pin-helper">
                  Newest evidence wins. Game attempts and teacher observations both stay in the cell history.
                </p>
              </div>
              <button className="teacher-control-button secondary" onClick={printSkillsDataReport} type="button">
                Print Chart
              </button>
            </div>

            <div className="skills-data-toolbar">
              <label>
                Report
                <select
                  onChange={(event) => {
                    setSkillsDataReportId(event.target.value as SkillsDataReportId);
                    setSelectedSkillsDataCellKey("");
                  }}
                  value={selectedSkillsDataReport.id}
                >
                  {visibleSkillsDataReports.map((report) => (
                    <option key={report.id} value={report.id}>
                      {report.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Focus
                <select
                  onChange={(event) => {
                    setSkillsDataFocusMode(event.target.value as SkillsDataFocusMode);
                    setSelectedSkillsDataCellKey("");
                  }}
                  value={skillsDataFocusMode}
                >
                  <option value="all">All</option>
                  <option value="needs-review">Needs Work</option>
                  <option value="mastered">Mastered</option>
                  <option value="unassessed">Not Assessed</option>
                  <option value="hide-mastered">Hide Mastered</option>
                  <option value="student-100">100% Mastery</option>
                  <option value="student-below-100">Still Learning / Below 100%</option>
                  <option value="student-close-100">Close to 100%</option>
                  <option value="targets-with-needs">Targets With Needs</option>
                  <option value="targets-100">Targets at 100% Class Mastery</option>
                </select>
              </label>
              <label>
                Sort
                <select
                  onChange={(event) => setSkillsDataSortMode(event.target.value as SkillsDataSortMode)}
                  value={skillsDataSortMode}
                >
                  <option value="name">First name</option>
                  <option value="mastered">Most mastered</option>
                  <option value="needs">Most needs</option>
                  <option value="close">Closest to 100%</option>
                </select>
              </label>
              <div className="skills-data-legend" aria-label="Skills data legend">
                <span className="mastered">Mastered</span>
                <span className="needs-review">Needs review</span>
                <span className="unassessed">No evidence</span>
                <span className="manual">Teacher observation</span>
              </div>
            </div>

            <div className="skills-data-summary-row">
              <span>{visibleSkillsDataRows.length}/{skillsDataRows.length} scholar{skillsDataRows.length === 1 ? "" : "s"}</span>
              <span>{visibleSkillsDataTargets.length}/{selectedSkillsDataReport.targets.length} target{selectedSkillsDataReport.targets.length === 1 ? "" : "s"}</span>
              <span>{skillsDataManualEvidenceCount} manual observation{skillsDataManualEvidenceCount === 1 ? "" : "s"}</span>
              <span>{skillsDataAt100ScholarCount} at 100%</span>
              <span>{skillsDataCloseScholarCount} close to 100%</span>
              <span>{skillsDataTargetsWithNeedsCount} target{skillsDataTargetsWithNeedsCount === 1 ? "" : "s"} with needs</span>
              <span>{skillsDataTargetsAt100Count} classwide 100%</span>
              {skillsDataMostNeedsRow?.needsReviewCount ? (
                <span>Most needs: {skillsDataMostNeedsRow.scholar.firstName} ({skillsDataMostNeedsRow.needsReviewCount})</span>
              ) : null}
            </div>

            <div className="skills-data-table-wrap">
              <table className="skills-data-table">
                <thead>
                  <tr>
                    <th scope="col">Scholar</th>
                    {visibleSkillsDataTargets.map((target) => (
                      <th key={target} scope="col">{target}</th>
                    ))}
                    <th scope="col">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleSkillsDataRows.map((row) => (
                    <tr key={row.scholar.id}>
                      <th scope="row">
                        <button
                          className="skills-data-scholar-button"
                          onClick={() => setSelectedSkillsDataScholarId(row.scholar.id)}
                          type="button"
                        >
                          {row.scholar.firstName}
                        </button>
                      </th>
                      {visibleSkillsDataTargets.map((target) => {
                        const cell = row.cells.find((nextCell) => nextCell.target === target);
                        if (!cell) {
                          return <td key={`${row.scholar.id}-${target}`} />;
                        }

                        return (
                          <td key={`${row.scholar.id}-${cell.target}`}>
                            <button
                              aria-label={`${row.scholar.firstName} ${cell.target}: ${skillsDataStatusLabel(cell.status)}`}
                              className={`skills-data-cell ${cell.status} ${cell.latest?.source === "Teacher observation" ? "is-manual" : ""} ${skillsDataCellIsMuted(cell, skillsDataFocusMode) ? "is-filter-muted" : ""}`}
                              onClick={() => setSelectedSkillsDataCellKey(`${row.scholar.id}|${cell.target}`)}
                              title={`${row.scholar.firstName} ${cell.target}: ${skillsDataStatusLabel(cell.status)}`}
                              type="button"
                            />
                          </td>
                        );
                      })}
                      <td className="skills-data-total">{row.masteredCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {selectedSkillsDataScholarRow ? (
              <div className="skills-data-scholar-detail">
                <div className="result-row-head">
                  <div>
                    <p className="eyebrow">Scholar Evidence</p>
                    <h4>{selectedSkillsDataScholarRow.scholar.firstName} {selectedSkillsDataScholarRow.scholar.lastName}</h4>
                    <p className="pin-helper">
                      {selectedSkillsDataReport.label}: {selectedSkillsDataScholarRow.masteredCount} mastered, {selectedSkillsDataScholarRow.needsReviewCount} needs review, {selectedSkillsDataScholarRow.unassessedCount} not assessed.
                    </p>
                  </div>
                  <div className="small-group-popup-actions">
                    <button
                      className="teacher-control-button secondary"
                      onClick={() => printStudentOverviewReport(selectedSkillsDataScholarRow.scholar)}
                      type="button"
                    >
                      Print Scholar
                    </button>
                    <button
                      className="teacher-control-button secondary"
                      onClick={() => setSelectedSkillsDataScholarId("")}
                      type="button"
                    >
                      Close
                    </button>
                  </div>
                </div>

                <div className="skills-data-scholar-targets">
                  {selectedSkillsDataScholarRow.cells.map((cell) => (
                    <button
                      className={`skills-data-scholar-target ${cell.status}`}
                      key={`${selectedSkillsDataScholarRow.scholar.id}-${cell.target}`}
                      onClick={() => setSelectedSkillsDataCellKey(`${selectedSkillsDataScholarRow.scholar.id}|${cell.target}`)}
                      type="button"
                    >
                      <strong>{cell.target}</strong>
                      <span>{skillsDataStatusLabel(cell.status)}</span>
                      {cell.latest ? (
                        <small>
                          {cell.latest.source}{cell.latest.date ? ` - ${cell.latest.date.toLocaleDateString()}` : ""}
                        </small>
                      ) : (
                        <small>No evidence yet</small>
                      )}
                    </button>
                  ))}
                </div>

                <div className="skills-data-scholar-records">
                  <section>
                    <h5>Recent Saved Results</h5>
                    {selectedSkillsDataScholarResults.length ? (
                      selectedSkillsDataScholarResults.map((result) => {
                        const completedAt = formatDate(result.completedAt);
                        return (
                          <article className="result-row" key={`scholar-result-${result.id}`}>
                            <div className="result-row-head">
                              <strong>{gameTitleFor(result.gameId, result.gameTitle)}</strong>
                              <span className="match-pill matched">{resultModeLabel(result.mode)}</span>
                            </div>
                            <p>{result.levelName || "Game"} - Score {result.score}/{result.totalQuestions} - Missed {recordMissCount(result)}</p>
                            <p>{completedAt ? completedAt.toLocaleString() : "Date pending"}</p>
                          </article>
                        );
                      })
                    ) : (
                      <p className="empty-results-message">No saved {activeReportLabel} results for this scholar yet.</p>
                    )}
                  </section>
                  <section>
                    <h5>Started But Not Finished</h5>
                    {selectedSkillsDataScholarProgress.length ? (
                      selectedSkillsDataScholarProgress.map((progress) => {
                        const updatedAt = formatDate(progress.updatedAt);
                        return (
                          <article className="result-row progress-row" key={`scholar-progress-${progress.id}`}>
                            <div className="result-row-head">
                              <strong>{gameTitleFor(progress.gameId, progress.gameTitle)}</strong>
                              <span className="match-pill matched">{progressStatusLabel(progress.status)}</span>
                            </div>
                            <p>{progress.levelName || "Game"} - question {progress.currentQuestionIndex}/{progress.totalQuestions}</p>
                            <p>{updatedAt ? updatedAt.toLocaleString() : "Date pending"}</p>
                          </article>
                        );
                      })
                    ) : (
                      <p className="empty-results-message">No unfinished {activeReportLabel} sessions for this scholar.</p>
                    )}
                  </section>
                </div>
              </div>
            ) : (
              <p className="skills-data-chart-helper">Click a scholar name in the chart to open a larger printable evidence view.</p>
            )}

            {selectedSkillsDataCell ? (
              <div className="skills-data-detail">
                <div className="result-row-head">
                  <div>
                    <p className="eyebrow">Cell Evidence</p>
                    <h4>
                      {selectedSkillsDataCell.row.scholar.firstName} {selectedSkillsDataCell.row.scholar.lastName} - {selectedSkillsDataCell.cell.target}
                    </h4>
                    <p className="pin-helper">
                      Current status: {skillsDataStatusLabel(selectedSkillsDataCell.cell.status)}
                    </p>
                  </div>
                  <button
                    className="teacher-control-button secondary"
                    onClick={() => setSelectedSkillsDataCellKey("")}
                    type="button"
                  >
                    Close
                  </button>
                </div>

                <div className="skills-data-edit-grid">
                  <label>
                    Manual status
                    <select
                      onChange={(event) => setSkillsDataEditStatus(event.target.value as SkillsDataStatus)}
                      value={skillsDataEditStatus}
                    >
                      <option value="mastered">Mastered from class</option>
                      <option value="needs-review">Needs review from class</option>
                      <option value="unassessed">Clear manual note</option>
                    </select>
                  </label>
                  <label>
                    Observation note
                    <textarea
                      onChange={(event) => setSkillsDataEditNote(event.target.value)}
                      placeholder="Small group, conference note, class observation..."
                      rows={3}
                      value={skillsDataEditNote}
                    />
                  </label>
                  <button
                    className="teacher-control-button"
                    disabled={isSavingSkillsDataEdit}
                    onClick={() => void saveSkillsDataEdit()}
                    type="button"
                  >
                    {isSavingSkillsDataEdit ? "Saving..." : "Save Observation"}
                  </button>
                </div>

                <div className="skills-data-evidence-list">
                  {selectedSkillsDataCell.cell.evidence.length ? (
                    selectedSkillsDataCell.cell.evidence.map((evidence, index) => (
                      <article key={`${evidence.recordId}-${index}`}>
                        <strong>{skillsDataStatusLabel(evidence.correct ? "mastered" : "needs-review")}</strong>
                        <span>{evidence.source}{evidence.levelName ? ` - ${evidence.levelName}` : ""}</span>
                        <span>{evidence.date ? evidence.date.toLocaleString() : "Date pending"}</span>
                        {evidence.selected ? <span>Selected: {evidence.selected}</span> : null}
                        {evidence.attempts.length ? <span>Attempts: {evidence.attempts.join(" -> ")}</span> : null}
                        {evidence.prompt ? <span>Note: {evidence.prompt}</span> : null}
                      </article>
                    ))
                  ) : (
                    <p className="empty-results-message">No game or teacher evidence recorded for this target yet.</p>
                  )}
                </div>
              </div>
            ) : null}
          </section>
          ) : null}

          {dataReportView === "students" ? (
          <section className="teacher-card roster-browser-card">
            <div className="students-page-head">
              <div>
                <h3>Students</h3>
                <p className="pin-helper">Open a student to view data, or print an individual student report from the card.</p>
              </div>
            </div>
            <div className="teacher-filter-tabs" aria-label="Student teacher filter">
              {authorizedTeachers.map((teacher) => (
                <button
                  className={teacherFilter === teacher.email ? "is-active" : ""}
                  key={teacher.email}
                  onClick={() => {
                    setTeacherFilter(teacher.email);
                    setScholarFilter("all");
                    setSelectedScholarId("");
                  }}
                  type="button"
                >
                  {teacher.label}
                </button>
              ))}
              <button
                className={teacherFilter === "all" ? "is-active" : ""}
                onClick={() => {
                  setTeacherFilter("all");
                  setScholarFilter("all");
                  setSelectedScholarId("");
                }}
                type="button"
              >
                All
              </button>
            </div>
            <div className="roster-card-grid">
              {isLoading ? <p>Loading students...</p> : null}
              {!isLoading && !visibleScholars.length ? <p>No students added yet for this view.</p> : null}
              {visibleScholars.map((scholar) => {
                const scholarResults = resultsForScholar(scholar);

                return (
                  <article className="roster-card" key={scholar.id}>
                    <button onClick={() => setSelectedScholarId(scholar.id)} type="button">
                      <span className="roster-initials">{initialsForScholar(scholar)}</span>
                      <span>
                        <strong>{scholar.firstName} {scholar.lastName}</strong>
                        <small>{teacherLabelForEmail(scholar.teacherEmail)} - {scholarResults.length} result{scholarResults.length === 1 ? "" : "s"}</small>
                        {isTestScholar(scholar) ? (
                          <small>Test student - {scholar.includeInReports ? "showing in data" : "hidden from data"}</small>
                        ) : null}
                      </span>
                    </button>
                    {isTestScholar(scholar) ? (
                      <button
                        className="teacher-text-button"
                        onClick={() => void toggleTestScholarReportVisibility(scholar)}
                        type="button"
                      >
                        {scholar.includeInReports ? "Hide Data" : "Show Data"}
                      </button>
                    ) : null}
                    <button className="teacher-text-button" onClick={() => printStudentOverviewReport(scholar)} type="button">
                      Print
                    </button>
                    <button className="teacher-text-button danger" onClick={() => void deleteScholar(scholar)} type="button">
                      Delete
                    </button>
                  </article>
                );
              })}
              <details className="roster-card roster-add-tile">
                <summary>
                  <span className="roster-initials">+</span>
                  <span>
                    <strong>Add Student</strong>
                    <small>{teacherLabelForEmail(rosterAddTeacherEmail)} class</small>
                  </span>
                </summary>
                <form className="roster-form" onSubmit={addScholar}>
                  <label>
                    First name
                    <input autoComplete="off" onChange={(event) => setFirstName(event.target.value)} type="text" value={firstName} />
                  </label>
                  <label>
                    Last name
                    <input autoComplete="off" onChange={(event) => setLastName(event.target.value)} type="text" value={lastName} />
                  </label>
                  <button className="teacher-control-button" disabled={isAdding} type="submit">
                    {isAdding ? "Adding..." : "Add Student"}
                  </button>
                </form>
              </details>
            </div>
          </section>
          ) : null}

        </div>
      </section>

      {selectedScholar ? (
        <div className="student-detail-backdrop" role="presentation">
          <section aria-labelledby="student-detail-title" aria-modal="true" className="student-detail-panel" role="dialog">
            <div className="student-detail-header">
              <div>
                <p className="eyebrow">{teacherLabelForEmail(selectedScholar.teacherEmail)}</p>
                <h3 id="student-detail-title">{selectedScholar.firstName} {selectedScholar.lastName}</h3>
                <p>
                  {selectedScholarResults.length} saved result{selectedScholarResults.length === 1 ? "" : "s"}
                  {selectedScholarProgress.length ? ` - ${selectedScholarProgress.length} unfinished` : ""}
                </p>
                {selectedGameIsPreassessment ? (
                  <p className="pin-helper">
                    Assessment access: {selectedPreassessmentControl?.action === "retake"
                      ? "Retake required"
                      : selectedPreassessmentControl?.action === "waived"
                        ? "Waived"
                        : selectedScholarResults.length
                          ? "Completed"
                          : "Not completed"}
                  </p>
                ) : null}
              </div>
              <div className="student-detail-actions">
                {selectedGameIsPreassessment ? (
                  <>
                    {selectedPreassessmentControl?.action === "retake" ? (
                      <button className="teacher-control-button secondary" onClick={() => void setPreassessmentControl(selectedScholar, "normal")} type="button">
                        Cancel Retake
                      </button>
                    ) : (
                      <button className="teacher-control-button" onClick={() => void setPreassessmentControl(selectedScholar, "retake")} type="button">
                        Require Retake
                      </button>
                    )}
                    {selectedPreassessmentControl?.action === "waived" ? (
                      <button className="teacher-control-button secondary" onClick={() => void setPreassessmentControl(selectedScholar, "normal")} type="button">
                        Remove Waiver
                      </button>
                    ) : (
                      <button className="teacher-control-button secondary" onClick={() => void setPreassessmentControl(selectedScholar, "waived")} type="button">
                        Waive Assessment
                      </button>
                    )}
                    {selectedScholarResults.length ? (
                      <button className="teacher-control-button secondary" onClick={() => void restorePreassessmentCompletion(selectedScholar)} type="button">
                        Restore Completed Access
                      </button>
                    ) : null}
                  </>
                ) : null}
                <button className="teacher-control-button" onClick={() => printStudentOverviewReport(selectedScholar)} type="button">
                  Print Student Report
                </button>
                <button className="teacher-control-button secondary" onClick={printSelectedScholarReport} type="button">
                  Print Current Unit
                </button>
                <button className="teacher-control-button secondary" onClick={() => setSelectedScholarId("")} type="button">
                  Close
                </button>
              </div>
            </div>

            <section className="sound-safari-summary">
              <div className="game-editor-card-head">
                <h4>{selectedManagedGame.title} Progress</h4>
                <label>
                  Unit
                  <select
                    value={selectedManagedGame.gameId}
                    onChange={(event) => {
                      setSelectedManagedGameId(event.target.value);
                      setSelectedTargetLevelIndex(0);
                      setLevelControlOpen(false);
                    }}
                  >
                    {managedGames.map((game) => (
                      <option key={game.gameId} value={game.gameId}>
                        {game.title}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="sound-safari-level-grid">
              {selectedSoundSafariStatuses.map((status, index) => (
                  <button
                    className={`sound-safari-level-card ${status.mastered ? "is-mastered" : ""} ${status.locked ? "is-locked" : ""}`}
                    disabled={selectedGameIsPreassessment}
                    key={status.level.id}
                    onClick={() => {
                      if (selectedGameIsPreassessment) {
                        return;
                      }

                      setSelectedTargetLevelIndex(index);
                      setSelectedTargetQuestionNumber(1);
                      setLevelControlOpen(true);
                    }}
                    style={selectedTargetLevelIndex === index ? { outline: "3px solid #f47f7a", opacity: 1 } : undefined}
                    type="button"
                  >
                      <strong>{status.level.name}</strong>
                      <span>
                      {selectedGameIsPreassessment
                        ? `${status.totalAttempts} attempt${status.totalAttempts === 1 ? "" : "s"}`
                        : status.locked
                          ? "Locked"
                          : status.mastered
                            ? "3 of 3 - Mastered"
                            : `${status.masteryCount} of 3 - ${status.attemptsLeft} left`}
                    </span>
                    <small>
                      {selectedGameIsPreassessment
                        ? `${status.wrongCount} missed question${status.wrongCount === 1 ? "" : "s"}`
                        : `${status.totalAttempts} attempt${status.totalAttempts === 1 ? "" : "s"} - ${status.wrongCount} missed question${status.wrongCount === 1 ? "" : "s"}`}
                    </small>
                  </button>
                ))}
              </div>
            </section>

            <div className="student-result-list">
              {selectedScholarProgress.length ? (
                <div className="student-progress-group">
                  <h4>Started But Not Finished</h4>
                  {selectedScholarProgress.map((progress) => {
                    const updatedAt = formatDate(progress.updatedAt);

                    return (
                      <article className="student-result-card progress-row" key={progress.id}>
                        <div className="result-row-head">
                          <div>
                            <strong>{gameTitleFor(progress.gameId, progress.gameTitle)}</strong>
                            <span className="match-pill">{progressStatusLabel(progress.status)}</span>
                          </div>
                          <button className="teacher-text-button danger" onClick={() => void deleteProgress(progress)} type="button">
                            Delete
                          </button>
                        </div>
                        <p>{updatedAt ? updatedAt.toLocaleString() : "Date pending"}</p>
                        <p>{progress.levelName ? `${progress.levelName} - ` : ""}Reached question {progress.currentQuestionIndex}/{progress.totalQuestions} - {progress.percentComplete}% complete</p>
                        <p>Last seen: {progress.currentWord || "Question"} - {progress.currentQuestionLabel}</p>
                        <CategoryScoreList record={progress} />
                        <VisualSearchAttemptList record={progress} />
                        {progress.missedQuestions.length ? (
                          <div className="missed-list">
                            <strong>Needs practice so far</strong>
                            {progress.missedQuestions.map((missed, index) => (
                              <p key={`${progress.id}-progress-miss-${index}`}>
                                {formatMissedContext(missed)}
                                {formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p>No missed questions recorded so far.</p>
                        )}
                      </article>
                    );
                  })}
                </div>
              ) : null}

              {!selectedScholarResults.length ? <p>No results for this scholar yet.</p> : null}
              {selectedScholarResults.map((result) => {
                const completedAt = formatDate(result.completedAt);
                const location = learningLocationLabel(result.learningLocation);
                const isWholeClassMiss = result.mode === "whole-class-miss";
                const isPracticeResult = result.mode === "practice-complete";
                const firstMiss = result.missedQuestions[0];

                return (
                  <article className="student-result-card" key={result.id}>
                    <div className="result-row-head">
                      <div>
                        <strong>{gameTitleFor(result.gameId, result.gameTitle)}</strong>
                        {isWholeClassMiss ? <span className="match-pill">Whole Class Mode</span> : null}
                        {isPracticeResult ? <span className="match-pill">Practice</span> : null}
                      </div>
                      <button className="teacher-text-button danger" onClick={() => void deleteResult(result)} type="button">
                        Delete Result
                      </button>
                    </div>
                    <p>{`${completedAt ? completedAt.toLocaleString() : "Date pending"}${location ? ` - ${location}` : ""}`}</p>
                    {isWholeClassMiss ? (
                      <p>
                        {formatMissedContext(firstMiss)}
                        {formatMissedText(result.word, result.incorrectSelection, result.correctAnswer)}
                      </p>
                    ) : (
                      <>
                        <p>
                          {result.levelName ? `${result.levelName} - ` : ""}Score {result.score}/{result.totalQuestions} - Attempts {result.attempts}
                          {result.masteryTarget && !preassessmentConfigForGameId(result.gameId) ? ` - Mastery ${result.masteryCount ?? 0}/${result.masteryTarget}` : ""}
                        </p>
                        <CategoryScoreList record={result} />
                        <VisualSearchAttemptList record={result} />
                        {result.missedQuestions.length ? (
                          <div className="missed-list">
                            <strong>Missed</strong>
                            {result.missedQuestions.map((missed, index) => (
                              <p key={`${result.id}-detail-${index}`}>
                                {formatMissedContext(missed)}
                                {formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer)}
                              </p>
                            ))}
                          </div>
                        ) : (
                          <p>No missed questions recorded.</p>
                        )}
                      </>
                    )}
                  </article>
                );
              })}
            </div>

            {levelControlOpen ? (
              <div className="level-control-backdrop" onClick={() => setLevelControlOpen(false)} role="presentation">
                <section aria-modal="true" className="level-control-dialog" onClick={(event) => event.stopPropagation()} role="dialog">
                  <p className="eyebrow">Level Controls</p>
                  <h3>{selectedManagedGame.levels[selectedTargetLevelIndex]?.name}</h3>
                  <p>Choose what you want to do for {selectedScholar.firstName}.</p>
                  <div className="level-control-actions">
                    <button className="teacher-control-button" onClick={() => void updateSelectedLevel(selectedScholar, selectedSoundSafariStatuses[selectedTargetLevelIndex]?.locked ? "unlock" : "relock")} type="button">
                      {selectedSoundSafariStatuses[selectedTargetLevelIndex]?.locked ? "Unlock" : "Relock"} {selectedManagedGame.levels[selectedTargetLevelIndex]?.name}
                    </button>
                    <label>
                      Question number
                      <input
                        min={1}
                        max={300}
                        onChange={(event) =>
                          setSelectedTargetQuestionNumber(
                            Math.max(1, Number(event.target.value) || 1),
                          )
                        }
                        type="number"
                        value={selectedTargetQuestionNumber}
                      />
                    </label>
                    <button
                      className="teacher-control-button"
                      onClick={() =>
                        void updateSelectedLevel(
                          selectedScholar,
                          "send",
                        )
                      }
                      type="button"
                    >
                      Send Scholar Here
                    </button>
                    <button
                      className="teacher-control-button"
                      onClick={() =>
                        void updateSelectedLevel(
                          selectedScholar,
                          "restart",
                        )
                      }
                      type="button"
                    >
                      Restart at Question 1
                    </button>
                    <button className="teacher-control-button" onClick={() => void updateSelectedLevel(selectedScholar, selectedSoundSafariStatuses[selectedTargetLevelIndex]?.mastered ? "unmaster" : "master")} type="button">
                      {selectedSoundSafariStatuses[selectedTargetLevelIndex]?.mastered ? "Remove Mastery" : "Mark Mastered"}
                    </button>
                    <button className="teacher-control-button secondary" onClick={() => setLevelControlOpen(false)} type="button">Cancel</button>
                  </div>
                </section>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </div>
  );
}
