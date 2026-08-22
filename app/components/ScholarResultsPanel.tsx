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
  getIdToken?: () => Promise<string>;
};

type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
  signInWithPopup?: (provider: unknown) => Promise<{ user: FirebaseUser | null }>;
};

type FirestoreDocSnapshot = {
  data: () => Record<string, unknown> | undefined;
  exists?: boolean;
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
  app?: (name?: string) => unknown;
  apps: Array<{ name?: string } | unknown>;
  auth: ((app?: unknown) => FirebaseAuth) & {
    GoogleAuthProvider?: new () => unknown;
  };
  firestore: ((app?: unknown) => FirestoreDb) & {
    FieldValue: {
      serverTimestamp: () => unknown;
    };
  };
  initializeApp: (config: Record<string, string>, name?: string) => unknown;
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
  trackingInitials: string;
};

type MissedQuestion = {
  category?: string;
  correctAnswer?: string;
  gameId?: string;
  gameTitle?: string;
  incorrectSelections?: string[];
  levelName?: string;
  note?: string;
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

type QpsReportRecord = ResultSubmission | ProgressSubmission;

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
type CurriculumRecommendationFeedback = {
  candidateKey: string;
  id: string;
  lessonTitle: string;
  need: string;
  reason: string;
  recommendationId: string;
  status: "not-match";
  subject: "skills" | "listening" | "math";
  teacherEmail: string;
  updatedAt: unknown;
  updatedBy: string;
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
type SmallGroupLessonAnalysis = {
  dataCheckItems: string[];
  familyLookFor: string;
  familyPrompt: string;
  familySteps: string[];
  guidedPractice: string;
  independentPractice: string;
  materials: string[];
  model: string;
  notes: string[];
  summary: string;
  target: string;
  teacherRows?: [string, string, string][];
  words: string[];
};
type SmallGroupLessonSource = {
  analysis?: SmallGroupLessonAnalysis;
  analysisStatus?: "none" | "needs-text" | "ready" | "mismatch";
  fileName: string;
  mismatchReason?: string;
  text: string;
};

const SCHOLAR_COLLECTION = "gameHubScholars";
const RESULT_COLLECTION = "gameHubResultSubmissions";
const PROGRESS_COLLECTION = "gameHubProgressSubmissions";
const PREASSESSMENT_STATUS_COLLECTION = "gameHubPreassessmentStatus";
const PREASSESSMENT_CONTROL_COLLECTION = "gameHubPreassessmentControls";
const SCHOLAR_CONTROL_COLLECTION = "gameHubScholarControls";
const SKILLS_DATA_OVERRIDE_COLLECTION = "gameHubSkillsDataOverrides";
const CURRICULUM_RECOMMENDATION_FEEDBACK_COLLECTION =
  "gameHubCurriculumRecommendationFeedback";
const GAME_COLLECTION = "gameHubGameDefinitions";
const MATH_PREASSESSMENT_GAME_ID = "math-starting-point-quest";
const MATH_PREASSESSMENT_STATUS_ID_PREFIX = "math-starting-point-quest-";
const SKILLS_PREASSESSMENT_GAME_ID = "skills-starting-point";
const SKILLS_PREASSESSMENT_STATUS_ID_PREFIX = "skills-starting-point-";
const LETTER_SEARCH_SAFARI_GAME_ID = "letter-search-safari";
const NUMBER_SEARCH_SAFARI_GAME_ID = "number-search-safari";
const QPS_SCREENER_GAME_ID = "qps-screener";
const HUB_CLASS_URL = "https://first-grade-news-hub-mrdavis.web.app/";

const HUB_TEACHER_WORKSPACE_SAVE_URL =
  "https://us-central1-first-grade-news-hub.cloudfunctions.net/saveTeacherWorkspaceResource";
const UFLI_TOOLBOX_BASE_URL = "https://ufli.education.ufl.edu/foundations/toolbox";
const UFLI_FOUNDATIONS_ROUTINE =
  "Use the UFLI Foundations routine: phonemic awareness, visual drill, auditory drill, blending drill, new concept, word work, irregular words, and connected text.";
const UFLI_INTERVENTION_LESSON_ROWS = `
1|Alphabet Unit|a /short a/
2|Alphabet Unit|m /m/
3|Alphabet Unit|s /s/
4|Alphabet Unit|t /t/
5|Alphabet Unit|VC/CVC
6|Alphabet Unit|p /p/
7|Alphabet Unit|f /f/
8|Alphabet Unit|i /short i/
9|Alphabet Unit|n /n/
10|Alphabet Unit|CVC Practice (a, i)
11|Alphabet Unit|Nasalized A (an, am)
12|Alphabet Unit|o /short o/
13|Alphabet Unit|d /d/
14|Alphabet Unit|c /k/
15|Alphabet Unit|u /short u/
16|Alphabet Unit|g /g/
17|Alphabet Unit|b /b/
18|Alphabet Unit|e /short e/
19|Alphabet Unit|Short Vowel Review (all)
20|Alphabet Unit|-s /s/
21|Alphabet Unit|s /z/
22|Alphabet Unit|k /k/
23|Alphabet Unit|h /h/
24|Alphabet Unit|r /r/ Part 1
25|Alphabet Unit|r /r/ Part 2
26|Alphabet Unit|l /l/ Part 1
27|Alphabet Unit|l /l/ Part 2
28|Alphabet Unit|w /w/
29|Alphabet Unit|j /j/
30|Alphabet Unit|y /y/
31|Alphabet Unit|x /ks/
32|Alphabet Unit|qu /kw/
33|Alphabet Unit|v /v/
34|Alphabet Unit|z /z/
35a|Alphabet Review and Longer Words Unit|Short A Review
35b|Alphabet Review and Longer Words Unit|Nasalized A Review (an, am)
35c|Alphabet Review and Longer Words Unit|Short A Advanced Review
36a|Alphabet Review and Longer Words Unit|Short I Review
36b|Alphabet Review and Longer Words Unit|Short I Advanced Review
37a|Alphabet Review and Longer Words Unit|Short O Review
37b|Alphabet Review and Longer Words Unit|Short O Advanced Review
38a|Alphabet Review and Longer Words Unit|Short A, I, O Review
38b|Alphabet Review and Longer Words Unit|Short A, I, O Advanced Review
39a|Alphabet Review and Longer Words Unit|Short U Review
39b|Alphabet Review and Longer Words Unit|Short U Advanced Review
40a|Alphabet Review and Longer Words Unit|Short E Review
40b|Alphabet Review and Longer Words Unit|Short E Advanced Review
41a|Alphabet Review and Longer Words Unit|Short Vowel Review (all)
41b|Alphabet Review and Longer Words Unit|Short Vowel Review (all)
41c|Alphabet Review and Longer Words Unit|Short Vowel Review (all)
42|Digraphs Unit|FLSZ Spelling Rule
43|Digraphs Unit|-all, -oll, -ull
44|Digraphs Unit|ck /k/
45|Digraphs Unit|sh /sh/
46|Digraphs Unit|th /th/ voiced
47|Digraphs Unit|th /th/ unvoiced
48|Digraphs Unit|ch /ch/
49|Digraphs Unit|Digraphs Review 1
50|Digraphs Unit|wh /w/, ph /f/
51|Digraphs Unit|ng /ng/
52|Digraphs Unit|nk /ngk/
53|Digraphs Unit|Digraphs Review 2
54|VCe Unit|a_e /long a/
55|VCe Unit|i_e /long i/
56|VCe Unit|o_e /long o/
57|VCe Unit|VCe review 1; e_e /long e/
58|VCe Unit|u_e /long u/
59|VCe Unit|VCe review 2
60|VCe Unit|_ce /s/
61|VCe Unit|_ge /j/
62|VCe Unit|VCe review 3; Exceptions
63|Reading Longer Words Unit|-es
64|Reading Longer Words Unit|-ed
65|Reading Longer Words Unit|-ing
66|Reading Longer Words Unit|Syllables
67a|Reading Longer Words Unit|Compound Words
67b|Reading Longer Words Unit|Closed/Closed
68|Reading Longer Words Unit|Open and Closed
69|Ending Spelling Patterns Unit|tch /ch/
70|Ending Spelling Patterns Unit|dge /j/
71|Ending Spelling Patterns Unit|tch, dge Review
72|Ending Spelling Patterns Unit|Long VCC: -ild, -old, -ind, -olt, -ost
73|Ending Spelling Patterns Unit|y /long i/
74|Ending Spelling Patterns Unit|y /long e/
75|Ending Spelling Patterns Unit|-le
76|Ending Spelling Patterns Unit|Ending Patterns Review
77|R-Controlled Vowels Unit|ar /ar/
78|R-Controlled Vowels Unit|or /or/, ore /or/
79|R-Controlled Vowels Unit|ar, or, ore Review
80|R-Controlled Vowels Unit|er /er/
81|R-Controlled Vowels Unit|ir /er/, ur /er/
82|R-Controlled Vowels Unit|Spelling /er/: er, ir, ur, w + or
83|R-Controlled Vowels Unit|R-Controlled Vowels Review
84|Long Vowel Teams Unit|ai /long a/, ay /long a/
85|Long Vowel Teams Unit|ee /long e/, ea /long e/, ey /long e/
86|Long Vowel Teams Unit|oa /long o/, ow /long o/, oe /long o/
87|Long Vowel Teams Unit|ie /long i/, igh /long i/
88|Long Vowel Teams Unit|Vowel Teams Review 1
89|Other Vowel Teams Unit|u /oo/, oo /oo/
90|Other Vowel Teams Unit|oo /long u/
91|Other Vowel Teams Unit|ew /long u/, ui /long u/, ue /long u/
92|Other Vowel Teams Unit|Vowel Teams Review 2
93|Other Vowel Teams Unit|au /aw/, aw /aw/, augh /aw/
94|Other Vowel Teams Unit|ea /short e/, a /short o/
95|Diphthongs and Silent Letters Unit|oi /oi/, oy /oi/
96|Diphthongs and Silent Letters Unit|ou /ow/, ow /ow/
97|Diphthongs and Silent Letters Unit|Vowel Teams and Diphthongs Review
98|Diphthongs and Silent Letters Unit|kn /n/, wr /r/, mb /m/
99|Suffixes and Prefixes Unit|Suffixes; -s/-es
100|Suffixes and Prefixes Unit|-er, -est
101|Suffixes and Prefixes Unit|-ly
102|Suffixes and Prefixes Unit|-less, -ful
103|Suffixes and Prefixes Unit|Prefixes; un-
104|Suffixes and Prefixes Unit|pre-, re-
105|Suffixes and Prefixes Unit|dis-
106|Suffixes and Prefixes Unit|Affixes Review
107|Suffix Spelling Changes Unit|Doubling Rule: -ed, -ing
108|Suffix Spelling Changes Unit|Doubling Rule: -er, -est
109|Suffix Spelling Changes Unit|Drop E Rule
110|Suffix Spelling Changes Unit|Y to I Rule
111|Low Frequency Spelling Unit|ar /er/, or /er/
112|Low Frequency Spelling Unit|air /air/, are /air/, ear /air/
113|Low Frequency Spelling Unit|ear /ear/
114|Low Frequency Spelling Unit|ei /long a/, eigh /long a/, ey /long a/, ea /long a/, aigh /long a/
115|Low Frequency Spelling Unit|ew /long u/, eu /long u/, ue /long u/, ou /long u/
116|Low Frequency Spelling Unit|ough /aw/, ough /long o/
117|Low Frequency Spelling Unit|Signal Vowels: c /s/, g /j/
118|Low Frequency Spelling Unit|ch /sh/, ch /k/, gn /n/, gh /g/, silent t
119|Additional Affixes Unit|-sion, -tion
120|Additional Affixes Unit|-ture
121|Additional Affixes Unit|-er, -or, -ist
122|Additional Affixes Unit|-ish
123|Additional Affixes Unit|-y
124|Additional Affixes Unit|-ness
125|Additional Affixes Unit|-ment
126|Additional Affixes Unit|-able, -ible
127|Additional Affixes Unit|bi-, tri-, uni-
128|Additional Affixes Unit|Affixes Review 2
`;
type UfliInterventionLesson = {
  concept: string;
  lessonNumber: string;
  sourceText: string;
  unitName: string;
  url: string;
};

const UFLI_INTERVENTION_LESSONS: UfliInterventionLesson[] = UFLI_INTERVENTION_LESSON_ROWS
  .trim()
  .split("\n")
  .map((row) => {
    const [lessonNumber, unitName, concept] = row.split("|").map((part) => part.trim());
    const lesson = {
      concept,
      lessonNumber,
      sourceText: "",
      unitName,
      url: ufliToolboxUrlForLesson(lessonNumber),
    };

    return {
      ...lesson,
      sourceText: ufliSourceTextForLesson(lesson),
    };
  });

function ufliToolboxUrlForLesson(lessonNumber: string) {
  const numericLesson = Number((lessonNumber.match(/\d+/) ?? ["0"])[0]);

  if (numericLesson <= 34) return `${UFLI_TOOLBOX_BASE_URL}/1-34/`;
  if (numericLesson <= 41) return `${UFLI_TOOLBOX_BASE_URL}/35-41/`;
  if (numericLesson <= 53) return `${UFLI_TOOLBOX_BASE_URL}/42-53/`;
  if (numericLesson <= 62) return `${UFLI_TOOLBOX_BASE_URL}/54-62/`;
  if (numericLesson <= 68) return `${UFLI_TOOLBOX_BASE_URL}/63-68/`;
  if (numericLesson <= 76) return `${UFLI_TOOLBOX_BASE_URL}/69-76/`;
  if (numericLesson <= 83) return `${UFLI_TOOLBOX_BASE_URL}/77-83/`;
  if (numericLesson <= 88) return `${UFLI_TOOLBOX_BASE_URL}/84-88/`;
  if (numericLesson <= 94) return `${UFLI_TOOLBOX_BASE_URL}/89-94/`;
  if (numericLesson <= 98) return `${UFLI_TOOLBOX_BASE_URL}/95-98/`;
  if (numericLesson <= 106) return `${UFLI_TOOLBOX_BASE_URL}/99-106/`;
  if (numericLesson <= 110) return `${UFLI_TOOLBOX_BASE_URL}/107-110/`;
  if (numericLesson <= 118) return `${UFLI_TOOLBOX_BASE_URL}/111-118/`;
  return `${UFLI_TOOLBOX_BASE_URL}/119-128/`;
}

function ufliLessonSortValue(lessonNumber: string) {
  const numericLesson = Number((lessonNumber.match(/\d+/) ?? ["0"])[0]);
  const suffix = (lessonNumber.match(/[a-z]$/i)?.[0] ?? "").toLowerCase();
  return numericLesson * 10 + (suffix ? suffix.charCodeAt(0) - 96 : 0);
}

function ufliSourceTextForLesson(lesson: Omit<UfliInterventionLesson, "sourceText">) {
  const letterFocus = lesson.concept.match(/^([a-z])\s+\//i)?.[1] ?? "";
  const letterFocusText = letterFocus
    ? `Letter focus: letter ${letterFocus}, lowercase ${letterFocus}, uppercase ${letterFocus}, and the sound/spelling in ${lesson.concept}.`
    : "";

  return cleanSmallGroupSourceText([
    `UFLI Foundations Lesson ${lesson.lessonNumber}: ${lesson.concept}.`,
    `Unit: ${lesson.unitName}.`,
    letterFocusText,
    UFLI_FOUNDATIONS_ROUTINE,
    `New concept and word work focus on ${lesson.concept}. Scholars practice accurate decoding, encoding, reading, spelling, and connected text with this target.`,
    `For a small group, keep the full routine short and narrow the practice to the target need. Use visual drill, auditory drill, blending, word work, and a quick data check.`,
  ].filter(Boolean).join("\n"));
}

function ufliConceptSearchText(lesson: UfliInterventionLesson) {
  return normalizeCurriculumNeedKey(`${lesson.lessonNumber} ${lesson.unitName} ${lesson.concept}`);
}

function ufliConceptExplicitlyTargetsLetter(lesson: UfliInterventionLesson, letter: string) {
  const concept = lesson.concept.toLowerCase();
  const cleanLetter = letter.toLowerCase();
  const directLetterPattern = new RegExp(`(^|[^a-z])${escapeRegExp(cleanLetter)}\\s*/`, "i");
  const letterChunkPattern = new RegExp(`(^|[^a-z])${escapeRegExp(cleanLetter)}(?:_|\\b)`, "i");

  return directLetterPattern.test(concept) || letterChunkPattern.test(concept) || (cleanLetter === "q" && /^qu\b/i.test(concept));
}

function ufliConceptExplicitlyTargetsChunk(lesson: UfliInterventionLesson, chunk: string) {
  const concept = lesson.concept.toLowerCase();
  const cleanChunk = chunk.toLowerCase();
  const chunkPattern = new RegExp(`(^|[^a-z])${escapeRegExp(cleanChunk)}(?:\\b|\\s*/|_)`, "i");

  return chunkPattern.test(concept);
}

function ufliLessonScoreForCandidate(lesson: UfliInterventionLesson, candidate: CurriculumNeedCandidate) {
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const chunkNeed = smallGroupNeedChunk(candidate);
  const conceptText = ufliConceptSearchText(lesson);
  const terms = curriculumCandidateMatchTerms(candidate);

  if (letterNeed) {
    if (ufliConceptExplicitlyTargetsLetter(lesson, letterNeed)) {
      return {
        matchType: "ufli-direct",
        reason: `UFLI Lesson ${lesson.lessonNumber} directly teaches ${lesson.concept}, matching ${candidate.need}.`,
        score: 100,
      };
    }

    return null;
  }

  if (chunkNeed) {
    if (ufliConceptExplicitlyTargetsChunk(lesson, chunkNeed)) {
      return {
        matchType: "ufli-direct",
        reason: `UFLI Lesson ${lesson.lessonNumber} directly teaches ${lesson.concept}, matching ${candidate.need}.`,
        score: 98,
      };
    }

    if (/review/i.test(lesson.concept) && curriculumNeedTermMatches(conceptText, chunkNeed)) {
      return {
        matchType: "ufli-review",
        reason: `UFLI Lesson ${lesson.lessonNumber} is a review lesson that includes ${chunkNeed}.`,
        score: 72,
      };
    }

    return null;
  }

  const exactTerm = terms.find((term) => term.length > 2 && curriculumNeedTermMatches(conceptText, term));
  if (exactTerm) {
    return {
      matchType: /review/i.test(lesson.concept) ? "ufli-review" : "ufli-related",
      reason: `UFLI Lesson ${lesson.lessonNumber} connects to ${exactTerm} through ${lesson.concept}.`,
      score: /review/i.test(lesson.concept) ? 70 : 82,
    };
  }

  if (/letter identification|letter sound|letter name|alphabet/i.test(candidate.need)) {
    return {
      matchType: "ufli-review",
      reason: `${lesson.unitName} builds alphabet knowledge and letter-sound automaticity. Open a specific letter need for the tightest match.`,
      score: 36,
    };
  }

  return null;
}

function ufliRecommendationForLesson(
  lesson: UfliInterventionLesson,
  candidate: CurriculumNeedCandidate,
  scoredMatch: { matchType: string; reason: string; score: number },
): CurriculumRecommendation {
  return {
    id: `ufli-${lesson.lessonNumber}`,
    iCanStatement: `I can practice ${lesson.concept} in words and connected reading.`,
    lessonNumber: lesson.lessonNumber,
    lessonTitle: lesson.concept,
    matchDetails: [{
      matchType: scoredMatch.matchType,
      need: candidate.need,
      reason: scoredMatch.reason,
    }],
    matchedNeeds: [candidate.need],
    objective: `Use UFLI Foundations Lesson ${lesson.lessonNumber} to strengthen ${lesson.concept} for this small group need.`,
    parentSummary: `Scholars practice ${lesson.concept} with a short routine for hearing, reading, spelling, and writing the target pattern.`,
    priorityStandard: "Foundational skills intervention",
    reason: scoredMatch.reason,
    score: scoredMatch.score,
    sourceText: lesson.sourceText,
    subject: "skills",
    subjectLabel: "UFLI Foundations",
    unitOrModule: lesson.unitName,
    url: lesson.url,
  };
}

function findUfliRecommendationsForNeedCandidate(candidate: CurriculumNeedCandidate) {
  return UFLI_INTERVENTION_LESSONS
    .map((lesson) => {
      const scoredMatch = ufliLessonScoreForCandidate(lesson, candidate);
      return scoredMatch ? {
        recommendation: ufliRecommendationForLesson(lesson, candidate, scoredMatch),
        sortValue: ufliLessonSortValue(lesson.lessonNumber),
      } : null;
    })
    .filter((item): item is { recommendation: CurriculumRecommendation; sortValue: number } => Boolean(item))
    .sort((a, b) => b.recommendation.score - a.recommendation.score || a.sortValue - b.sortValue)
    .slice(0, 3)
    .map((item) => item.recommendation);
}

function findUfliRecommendationsForNeedCandidates(candidates: CurriculumNeedCandidate[]) {
  const recommendations = new Map<string, CurriculumRecommendation>();

  candidates.forEach((candidate) => {
    findUfliRecommendationsForNeedCandidate(candidate).forEach((recommendation) => {
      const existing = recommendations.get(recommendation.id);
      if (!existing || recommendation.score > existing.score) {
        recommendations.set(recommendation.id, recommendation);
      }
    });
  });

  return Array.from(recommendations.values())
    .sort((a, b) => b.score - a.score || ufliLessonSortValue(a.lessonNumber) - ufliLessonSortValue(b.lessonNumber))
    .slice(0, 12);
}
const HUB_FIREBASE_APP_NAME = "first-grade-hub-bridge";
const HUB_FIREBASE_CONFIG = {
  apiKey: "AIzaSyBVFcyBYlz3DmCkOervIswwjPf6wwFZlhU",
  authDomain: "first-grade-news-hub.firebaseapp.com",
  projectId: "first-grade-news-hub",
  storageBucket: "first-grade-news-hub.firebasestorage.app",
} as const;
const HUB_TEACHER_WORKSPACE_COLLECTION = "teacherWorkspace";
const HUB_TEACHER_WORKSPACE_DOC_ID = "current";
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
  "qps-screener": "QPS Screener",
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
    gameId: QPS_SCREENER_GAME_ID,
    title: "QPS Screener",
    levels: [
      {id: "qps-full-screener", name: "QPS Screener"},
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

function firebaseAppByName(firebase: FirebaseCompat, name: string) {
  return firebase.apps.find((app) => (
    Boolean(app)
    && typeof app === "object"
    && "name" in app
    && app.name === name
  ));
}

async function loadHubFirebaseBridge() {
  const { firebase } = await loadFirebase();
  const hubApp =
    firebaseAppByName(firebase, HUB_FIREBASE_APP_NAME)
    ?? firebase.initializeApp(HUB_FIREBASE_CONFIG, HUB_FIREBASE_APP_NAME);
  const auth = firebase.auth(hubApp);
  let user = auth.currentUser;

  if (!isAuthorizedTeacherEmail(user?.email)) {
    const GoogleAuthProvider = firebase.auth.GoogleAuthProvider;

    if (!GoogleAuthProvider || !auth.signInWithPopup) {
      throw new Error("Hub sign-in is not available. Refresh and try again.");
    }

    const credential = await auth.signInWithPopup(new GoogleAuthProvider());
    user = credential.user ?? auth.currentUser;
  }

  if (!isAuthorizedTeacherEmail(user?.email)) {
    throw new Error("Sign in with an authorized teacher Google account to save plans to the Hub.");
  }

  return {
    db: firebase.firestore(hubApp),
    firebase,
    user,
  };
}

async function saveHubTeacherWorkspaceResource(bundle: {
  folderTitle: string;
  resource: HubTeacherWorkspaceResource;
}) {
  const { auth } = await loadFirebase();
  const user = auth.currentUser;

  if (!user || !isAuthorizedTeacherEmail(user.email)) {
    throw new Error("Sign in to Teacher Edit before saving to the Hub Teacher Workspace.");
  }

  if (!user.getIdToken) {
    throw new Error("Your teacher sign-in needs to refresh before saving to the Hub.");
  }

  const idToken = await user.getIdToken();
  const response = await fetch(HUB_TEACHER_WORKSPACE_SAVE_URL, {
    body: JSON.stringify(bundle),
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    method: "POST",
  });
  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(asText(result.error) || "The Hub could not save that Teacher Workspace item yet.");
  }

  return result as { folderTitle?: string; saved?: boolean };
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

function cleanTrackingInitials(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function automaticInitialsForScholar(scholar: Pick<Scholar, "firstName" | "lastName">) {
  return `${scholar.firstName.trim().charAt(0)}${scholar.lastName.trim().charAt(0)}`.toUpperCase();
}

function initialsForScholar(scholar: Pick<Scholar, "firstName" | "lastName"> & { trackingInitials?: string }) {
  return cleanTrackingInitials(scholar.trackingInitials) || automaticInitialsForScholar(scholar);
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

function dateToDateInputValue(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function dateInputToLocalDate(value: string, endOfDay = false) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null;
  }

  const [year, month, day] = value.split("-").map((part) => Number(part));
  const date = new Date(year, month - 1, day);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function addLocalDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
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

function qpsCurrentWeekRange() {
  const start = startOfSchoolWeek(new Date());
  return {
    end: dateToDateInputValue(addLocalDays(start, 4)),
    start: dateToDateInputValue(start),
  };
}

function reportRecordDate(record: QpsReportRecord) {
  return formatDate("completedAt" in record ? record.completedAt : record.updatedAt);
}

function reportRecordStatus(record: QpsReportRecord) {
  return "completedAt" in record ? "Saved" : "In progress";
}

function resultIsWithinDateInputs(result: QpsReportRecord, startInput: string, endInput: string) {
  const completedAt = reportRecordDate(result);

  if (!completedAt) {
    return false;
  }

  const start = dateInputToLocalDate(startInput);
  const end = dateInputToLocalDate(endInput, true);

  if (start && completedAt < start) {
    return false;
  }

  if (end && completedAt > end) {
    return false;
  }

  return true;
}

function qpsDateRangeLabel(startInput: string, endInput: string) {
  const start = dateInputToLocalDate(startInput);
  const end = dateInputToLocalDate(endInput);

  if (start && end) {
    return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
  }

  if (start) {
    return `From ${start.toLocaleDateString()}`;
  }

  if (end) {
    return `Through ${end.toLocaleDateString()}`;
  }

  return "All saved QPS sessions";
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
    trackingInitials: cleanTrackingInitials(data.trackingInitials),
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

function mapCurriculumRecommendationFeedback(doc: FirestoreDocSnapshot): CurriculumRecommendationFeedback {
  const data = doc.data() ?? {};
  const subject = asText(data.subject);

  return {
    candidateKey: asText(data.candidateKey),
    id: doc.id,
    lessonTitle: asText(data.lessonTitle),
    need: asText(data.need),
    reason: asText(data.reason),
    recommendationId: asText(data.recommendationId),
    status: "not-match",
    subject: subject === "math" || subject === "listening" ? subject : "skills",
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

function qpsResponseNoteForMiss(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
  index: number,
) {
  if (record.gameId !== QPS_SCREENER_GAME_ID) {
    return "";
  }

  const missedQuestionIndex = missed.questionIndex ?? index + 1;
  const missedWord = asText(missed.word || missed.correctAnswer).trim();
  const missedSection = asText(missed.levelName || missed.category).trim();
  const response = (record.questionResponses ?? [])
    .map(asRecord)
    .find((rawResponse) => {
      if (!rawResponse) {
        return false;
      }

      const responseIndex = asNumber(rawResponse.questionIndex);
      const responseWord = asText(rawResponse.word || rawResponse.correctAnswer).trim();
      const responseSection = asText(rawResponse.section).trim();

      return (
        responseIndex === missedQuestionIndex
        || (Boolean(missedWord) && responseWord === missedWord && (!missedSection || responseSection === missedSection))
      );
    });

  return asText(response?.note).trim();
}

function missedQuestionNote(
  record: ResultSubmission | ProgressSubmission,
  missed: MissedQuestion,
  index: number,
) {
  return asText(missed.note).trim() || qpsResponseNoteForMiss(record, missed, index);
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
    || gameId === QPS_SCREENER_GAME_ID
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
  const target =
    normalizeCurriculumNeedText(
      missed.word
      || missed.correctAnswer
      || ("word" in record ? record.word : "")
      || ("currentWord" in record ? record.currentWord : ""),
    )
    || normalizeCurriculumNeedText(missed.category || "");

  return [
    record.gameId,
    missed.levelName || record.levelName || "",
    missed.category || "Needs practice",
    target,
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

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function curriculumNeedTermMatches(text: string, term: string) {
  const cleanText = normalizeCurriculumNeedKey(text);
  const cleanTerm = normalizeCurriculumNeedKey(term);

  if (!cleanText || !cleanTerm) return false;
  if (cleanText === cleanTerm) return true;

  if (cleanText.length <= 2 || cleanTerm.length <= 2) {
    const shortTerm = cleanText.length <= cleanTerm.length ? cleanText : cleanTerm;
    const longText = cleanText.length <= cleanTerm.length ? cleanTerm : cleanText;
    return new RegExp(`(^|[^a-z0-9])${escapeRegExp(shortTerm)}([^a-z0-9]|$)`, "i").test(longText);
  }

  return cleanText.includes(cleanTerm) || cleanTerm.includes(cleanText);
}

function curriculumCandidateMatchTerms(candidate: CurriculumNeedCandidate) {
  const need = normalizeCurriculumNeedKey(candidate.need);
  const terms = [candidate.need, ...candidate.searchTerms]
    .map(normalizeCurriculumNeedKey)
    .filter(Boolean)
    .filter((term, index, allTerms) => allTerms.indexOf(term) === index);

  if (need.length <= 2) {
    return terms.filter((term) =>
      term === need
      || (
        term.length <= 45
        && curriculumNeedTermMatches(term, need)
        && !/game|safari|assessment|quest|needs practice/i.test(term)
      ),
    );
  }

  return terms.filter((term) =>
    !/game|safari|assessment|quest/i.test(term)
    && term !== "letter identification"
    && term !== "lowercase letter identification"
    && term !== "uppercase letter identification",
  );
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

function safeCurriculumFeedbackId(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80) || "item";
}

function curriculumRecommendationFeedbackId(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation,
  subject: "skills" | "listening" | "math",
) {
  return [
    subject,
    safeCurriculumFeedbackId(candidate.key || candidate.need),
    safeCurriculumFeedbackId(recommendation.id || recommendation.lessonTitle),
  ].join("__").slice(0, 220);
}

function curriculumRecommendationBlockedByFeedback(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
  feedback: CurriculumRecommendationFeedback[],
) {
  const feedbackId = curriculumRecommendationFeedbackId(candidate, recommendation, subject);

  return feedback.some((entry) =>
    entry.status === "not-match"
    && entry.id === feedbackId,
  );
}

function recommendationMatchesNeedCandidate(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  if (letterNeed) {
    return recommendationExplicitlyTeachesLetter(recommendation, letterNeed);
  }

  const terms = curriculumCandidateMatchTerms(candidate);
  const matchedNeeds = recommendation.matchedNeeds
    .map(normalizeCurriculumNeedKey)
    .filter(Boolean);

  return matchedNeeds.some((matchedNeed) =>
    terms.some((term) => curriculumNeedTermMatches(matchedNeed, term)),
  );
}

function recommendationsForNeedCandidate(
  recommendations: CurriculumRecommendation[],
  candidate: CurriculumNeedCandidate,
  options: { allowFocusedFallback?: boolean } = {},
) {
  const matchingRecommendations = recommendations
    .filter((recommendation) => recommendationMatchesNeedCandidate(recommendation, candidate));

  if (matchingRecommendations.length || !options.allowFocusedFallback) {
    return matchingRecommendations.slice(0, 4);
  }

  if (smallGroupSingleLetterNeed(candidate)) {
    return [];
  }

  // A focused search only sends terms for one need. If the UFLI bank returns
  // lessons but the local matcher is too strict for that wording, show those
  // focused results instead of making the button appear broken.
  return recommendations.slice(0, 4);
}

function recommendationExplicitlyTeachesLetter(
  recommendation: CurriculumRecommendation,
  letter: string,
) {
  const cleanLetter = letter.toLowerCase();
  const metadataText = [
    recommendation.lessonTitle,
    recommendation.iCanStatement,
    recommendation.objective,
    recommendation.parentSummary,
    recommendation.priorityStandard,
    recommendation.sourceText,
  ]
    .map((value) => String(value ?? ""))
    .join(" ")
    .toLowerCase();

  return sourceExplicitlySupportsLetter(metadataText, cleanLetter);
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
  const terms = curriculumCandidateMatchTerms(candidate);

  return (recommendation.matchDetails ?? []).filter((detail) => {
    const detailNeed = normalizeCurriculumNeedKey(detail.need);
    return terms.some((term) => curriculumNeedTermMatches(detailNeed, term));
  });
}

function curriculumRecommendationMatchLabel(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
) {
  const detail = curriculumRecommendationDetailsForCandidate(recommendation, candidate)[0];

  if (detail?.matchType === "ufli-direct") return "UFLI direct skill";
  if (detail?.matchType === "ufli-review") return "UFLI review lesson";
  if (detail?.matchType === "ufli-related") return "UFLI related lesson";
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
    return `Matched ${recommendation.matchedNeeds.slice(0, 4).join(", ")} in the recommended lesson.`;
  }
  return `Suggested for ${candidate.need} based on the current data view.`;
}

function isStrongSmallGroupLessonMatch(
  recommendation: CurriculumRecommendation,
  candidate: CurriculumNeedCandidate,
  index: number,
) {
  if (index > 1) return false;

  const detail = curriculumRecommendationDetailsForCandidate(recommendation, candidate)[0];
  const matchType = detail?.matchType || "";

  if (["ufli-direct", "direct", "source"].includes(matchType)) return true;
  if (index === 0 && ["lesson", "related"].includes(matchType) && recommendation.score >= 48) return true;

  return false;
}

function sharedCurriculumRecommendationNeedLabels(
  recommendation: CurriculumRecommendation,
  activeCandidate: CurriculumNeedCandidate,
  candidates: CurriculumNeedCandidate[],
) {
  return candidates
    .filter((candidate) => (
      candidate.key !== activeCandidate.key
      && recommendationMatchesNeedCandidate(recommendation, candidate)
    ))
    .map((candidate) => candidate.need)
    .slice(0, 4);
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

function curriculumRecommendationSearchTerms(candidate: CurriculumNeedCandidate) {
  const letterNeed = smallGroupSingleLetterNeed(candidate);

  if (letterNeed) {
    return [
      `letter ${letterNeed}`,
      `lowercase ${letterNeed}`,
      `/${letterNeed}/`,
      `sound /${letterNeed}/`,
      `${letterNeed} sound`,
      candidate.need,
    ];
  }

  return [candidate.need, ...candidate.searchTerms];
}

function curriculumFamilyPracticeTips(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const need = candidate.need.toLowerCase();
  const letterNeed = smallGroupSingleLetterNeed(candidate);

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

  if (letterNeed) {
    return {
      lookFor: `Your child can find ${letterNeed}, name it or say its sound, and write it without guessing.`,
      steps: [
        `Write ${letterNeed} on a card or paper. Say: "This is ${letterNeed}."`,
        `Mix ${letterNeed} with 3 or 4 other letters. Ask your child to point to ${letterNeed}.`,
        `Have your child write ${letterNeed} three times and read it back.`,
      ],
      prompt: `Point to ${letterNeed}, say it, write it, then find it in a book or around the house.`,
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

function smallGroupSingleLetterNeed(candidate: CurriculumNeedCandidate) {
  const need = normalizeCurriculumNeedText(candidate.need).toLowerCase();
  const terms = [
    need,
    ...candidate.searchTerms.map((term) => normalizeCurriculumNeedText(term).toLowerCase()),
  ];

  for (const term of terms) {
    const match =
      term.match(/(?:lowercase|uppercase|letter)\s+([a-z])\b/)
      || term.match(/\b([a-z])\s+(?:identification|name|sound)\b/)
      || term.match(/^([a-z])$/);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function smallGroupTeachingTarget(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const need = normalizeCurriculumNeedText(candidate.need);
  const letterNeed = smallGroupSingleLetterNeed(candidate);

  if (subject === "math") {
    return need ? `Practice ${need} with objects, drawings, numbers, and words.` : "Practice the target math skill.";
  }

  if (subject === "listening") {
    return need ? `Use details from a story or topic to practice ${need}.` : "Practice the target Listening & Learning skill.";
  }

  if (letterNeed) {
    return `Identify, say, read, and write the letter ${letterNeed}.`;
  }

  if (/^[a-z]$/i.test(need)) {
    return `Identify, say, read, and write the letter ${need}.`;
  }

  if (/^[a-z]{2,4}$/i.test(need)) {
    return `Read, say, and write words with ${need}.`;
  }

  return need ? `Practice ${need}.` : "Practice the target Skills need.";
}

function smallGroupPlanObjective(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
) {
  const target = smallGroupTeachingTarget(candidate, subject);
  const lessonConnection =
    recommendation?.lessonTitle
      ? ` This connects to ${curriculumRecommendationLessonLabel(recommendation)} - ${recommendation.lessonTitle}.`
      : "";

  return `${target}${lessonConnection}`;
}

function cleanSmallGroupSourceText(text: string) {
  return text
    .replace(/\u0000/g, "")
    .replace(/[\u0001-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\s+([,.;:!?])/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
    .slice(0, 30000);
}

function sourceTextReadability(text: string) {
  const characters = Array.from(text);
  const visibleCharacters = characters.filter((character) => !/\s/.test(character));
  const weirdCharacters = characters.filter((character) => {
    const code = character.charCodeAt(0);
    if (character === "\n" || character === "\r" || character === "\t" || character === " ") return false;
    if (code >= 32 && code <= 126) return false;
    return !"’‘“”–—•".includes(character);
  });
  const words = text.match(/[A-Za-z][A-Za-z'’.-]{2,}/g) ?? [];
  const letterCount = (text.match(/[A-Za-z]/g) ?? []).length;
  const visibleCount = Math.max(1, visibleCharacters.length);

  return {
    letterRatio: letterCount / visibleCount,
    weirdRatio: weirdCharacters.length / Math.max(1, characters.length),
    wordCount: words.length,
  };
}

function isReadableLessonSourceText(text: string, minWords = 12, minLength = 80) {
  const cleanText = cleanSmallGroupSourceText(text);
  const stats = sourceTextReadability(cleanText);

  return (
    cleanText.length >= minLength
    && stats.wordCount >= minWords
    && stats.letterRatio >= 0.45
    && stats.weirdRatio <= 0.02
  );
}

function isReadableLessonSourceSentence(text: string) {
  const stats = sourceTextReadability(text);
  const tokens = text.match(/[A-Za-z]+/g) ?? [];
  const singleLetterTokens = tokens.filter((token) => token.length === 1).length;
  const singleLetterRatio = singleLetterTokens / Math.max(1, tokens.length);

  return (
    stats.wordCount >= 3
    && stats.letterRatio >= 0.45
    && stats.weirdRatio <= 0.02
    && singleLetterRatio <= 0.28
    && !/(?:\b[a-z]\s+){4,}\b[a-z]\b/i.test(text)
    && !/additional\s+standards\s+addressed\s+in\s+all\s+lessons/i.test(text)
  );
}

function smallGroupSourceSentenceSupportsLesson(
  sentence: string,
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
) {
  const lowerSentence = sentence.toLowerCase();
  const target = smallGroupSingleLetterNeed(candidate);

  if (/copyright|all rights reserved|additional standards addressed/i.test(sentence)) {
    return false;
  }

  if (target) {
    const hasUsefulLessonAction = /read|write|spell|sound|letter|word|card|blend|segment|circle|point|tap|say|name/i.test(sentence);
    return sourceExplicitlySupportsLetter(sentence, target) && hasUsefulLessonAction;
  }

  return Boolean(recommendation) || curriculumCandidateMatchTerms(candidate).some((term) =>
    curriculumNeedTermMatches(lowerSentence, term),
  );
}

function sourceSentences(text: string) {
  return cleanSmallGroupSourceText(text)
    .replace(/\r/g, "\n")
    .split(/(?<=[.!?])\s+|\n+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => (
      sentence.length >= 24
      && sentence.length <= 260
      && isReadableLessonSourceSentence(sentence)
    ));
}

function relevantSmallGroupSourceNotes(
  sourceText: string,
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
) {
  const sentences = sourceSentences(sourceText);
  const terms = [
    ...curriculumCandidateMatchTerms(candidate),
    recommendation?.lessonTitle,
    recommendation?.iCanStatement,
    recommendation?.objective,
  ]
    .map(normalizeCurriculumNeedText)
    .filter(Boolean);

  const scored = sentences.map((sentence, index) => {
    const score = terms.reduce((total, term) => (
      curriculumNeedTermMatches(sentence, term) ? total + Math.max(2, Math.min(8, term.length)) : total
    ), 0);
    return { index, score, sentence };
  });

  const best = scored
    .filter((item) => item.score > 0)
    .filter((item) => smallGroupSourceSentenceSupportsLesson(item.sentence, candidate, recommendation))
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 5)
    .sort((a, b) => a.index - b.index)
    .map((item) => item.sentence);

  if (best.length) return best;

  return [];
}

function sourceExplicitlySupportsLetter(sourceText: string, letter: string) {
  const cleanLetter = letter.toLowerCase();
  const source = stripCurriculumCodeArtifacts(cleanSmallGroupSourceText(sourceText)).toLowerCase();
  const letterToken = `(?:${escapeRegExp(cleanLetter)}|["'“‘]${escapeRegExp(cleanLetter)}["'”’])`;
  const afterToken = `(?=$|[^a-z])`;
  const patterns = [
    new RegExp(`\\blowercase\\s+${letterToken}${afterToken}`, "i"),
    new RegExp(`\\buppercase\\s+${letterToken}${afterToken}`, "i"),
    new RegExp(`\\bletter\\s+${letterToken}${afterToken}`, "i"),
    new RegExp(`(?:^|[^a-z])${letterToken}\\s+letter\\b`, "i"),
    new RegExp(`(?:^|[^a-z])${letterToken}\\s+card\\b`, "i"),
    new RegExp(`\\bletter\\s+card\\s+${letterToken}${afterToken}`, "i"),
    new RegExp(`\\b(?:spelling|letter-sound|sound-spelling)\\s+${letterToken}${afterToken}`, "i"),
    new RegExp(`\\b(?:spellings?|sound-spellings?)\\s+(?:for\\s+)?/${escapeRegExp(cleanLetter)}/${afterToken}`, "i"),
    new RegExp(`\\bsounds?\\b[^.?!]{0,80}/${escapeRegExp(cleanLetter)}/${afterToken}`, "i"),
    new RegExp(`\\bspellings?\\b[^.?!]{0,80}/${escapeRegExp(cleanLetter)}/${afterToken}`, "i"),
    new RegExp(`\\b(?:sound|say|name)\\s+/${escapeRegExp(cleanLetter)}/${afterToken}`, "i"),
    new RegExp(`/${escapeRegExp(cleanLetter)}/\\s+(?:sound|spelling|letter)\\b`, "i"),
  ];

  return patterns.some((pattern) => pattern.test(source));
}

function stripCurriculumCodeArtifacts(text: string) {
  return text
    .replace(/\b(?:RF|RL|RI|SL|L)\.\d+\.\d+[a-z]?\b/gi, " ")
    .replace(/\b(?:K|\d+)\.[A-Z]+\.[A-Z]+\.\d+[A-Za-z]?\b/g, " ")
    .replace(/\b[A-Z]{1,4}\.\d+[A-Za-z]?\b/g, " ");
}

function sourceExplicitlySupportsChunk(sourceText: string, chunk: string) {
  const cleanChunk = chunk.toLowerCase();
  const source = cleanSmallGroupSourceText(sourceText).toLowerCase();
  const patterns = [
    new RegExp(`\\b${escapeRegExp(cleanChunk)}\\b`, "i"),
    new RegExp(`/${escapeRegExp(cleanChunk)}/`, "i"),
    new RegExp(`\\b${escapeRegExp(cleanChunk)}\\s+(?:sound|spelling|words|digraph)\\b`, "i"),
    new RegExp(`\\b(?:sound|spelling|digraph)\\s+${escapeRegExp(cleanChunk)}\\b`, "i"),
  ];

  return patterns.some((pattern) => pattern.test(source));
}

function smallGroupSourceTargetMatch(
  sourceText: string,
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
) {
  const notes = relevantSmallGroupSourceNotes(sourceText, candidate, recommendation);
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const chunkNeed = smallGroupNeedChunk(candidate);
  const terms = curriculumCandidateMatchTerms(candidate);
  const source = cleanSmallGroupSourceText(sourceText);

  if (subject === "skills" && letterNeed) {
    const matches =
      sourceExplicitlySupportsLetter(source, letterNeed)
      || notes.some((note) => sourceExplicitlySupportsLetter(note, letterNeed));

    return {
      matches,
      reason: matches
        ? `The uploaded source includes explicit lesson evidence for ${letterNeed}.`
        : `The uploaded source does not explicitly teach or practice ${letterNeed}. I marked this lesson as not a match for ${candidate.need}.`,
    };
  }

  if (subject === "skills" && chunkNeed) {
    const matches =
      sourceExplicitlySupportsChunk(source, chunkNeed)
      || notes.some((note) => sourceExplicitlySupportsChunk(note, chunkNeed));

    return {
      matches,
      reason: matches
        ? `The uploaded source includes explicit lesson evidence for ${chunkNeed}.`
        : `The uploaded source does not explicitly teach or practice ${chunkNeed}. I marked this lesson as not a match for ${candidate.need}.`,
    };
  }

  const matches = notes.length > 0 || terms.some((term) =>
    term.length > 2 && curriculumNeedTermMatches(source, term),
  );

  return {
    matches,
    reason: matches
      ? "The uploaded source includes lesson evidence for this target need."
      : `The uploaded source does not show enough evidence for ${candidate.need}. I marked this lesson as not a match for that need.`,
  };
}

function smallGroupMaterials(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  sourceText: string,
) {
  const sourceNotes = relevantSmallGroupSourceNotes(sourceText, candidate, recommendation);
  const lowerSource = sourceText.toLowerCase();
  const materials = new Set<string>();

  if (subject === "math") {
    ["small objects/counters", "whiteboards or paper", "pencils"].forEach((item) => materials.add(item));
  } else if (subject === "listening") {
    ["lesson text or read-aloud", "picture card or anchor chart", "paper/pencil response"].forEach((item) => materials.add(item));
  } else {
    ["letter/word cards", "whiteboards or paper", "pencils"].forEach((item) => materials.add(item));
  }

  if (lowerSource.includes("worksheet")) materials.add("lesson worksheet");
  if (lowerSource.includes("reader")) materials.add("reader or decodable text");
  if (lowerSource.includes("chart")) materials.add("chart paper or board");
  if (lowerSource.includes("card")) materials.add("lesson cards");

  sourceNotes
    .filter((note) => /materials?|worksheet|reader|card|chart|board|pencil|paper/i.test(note))
    .slice(0, 2)
    .forEach((note) => materials.add(note));

  return Array.from(materials).slice(0, 7);
}

function smallGroupDataCheckItems(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const need = normalizeCurriculumNeedText(candidate.need);
  const letterNeed = smallGroupSingleLetterNeed(candidate);

  if (subject === "math") {
    return [
      `Show ${need || "the target math idea"} with objects or a drawing.`,
      "Write or say the matching number sentence.",
      "Explain how you know in one sentence.",
    ];
  }

  if (subject === "listening") {
    return [
      `Tell one important detail connected to ${need || "today's story or topic"}.`,
      "Answer one who/what/where/why/how question in a complete sentence.",
      "Use one lesson word or story detail in the answer.",
    ];
  }

  if (subject === "skills" && letterNeed) {
    return [
      `Point to or circle ${letterNeed} from a small set of letters.`,
      `Say the name or sound for ${letterNeed}.`,
      `Write ${letterNeed} and read it back.`,
    ];
  }

  if (subject === "skills" && /^[a-z]$/i.test(need)) {
    return [
      `Point to or circle ${need} from a small set of letters.`,
      `Say the name/sound for ${need}.`,
      `Write ${need} and read it back to the teacher.`,
    ];
  }

  if (subject === "skills" && /^[a-z]{2,4}$/i.test(need)) {
    return [
      `Read one word with ${need}.`,
      `Build or write one word with ${need}.`,
      `Use the word in a spoken sentence.`,
    ];
  }

  return [
    `Show ${need || "the target skill"} with teacher support.`,
    "Try one example independently.",
    "Explain how you know or read the answer back.",
  ];
}

const SMALL_GROUP_SOURCE_WORD_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "before",
  "during",
  "each",
  "from",
  "have",
  "lesson",
  "page",
  "scholar",
  "scholars",
  "student",
  "students",
  "teacher",
  "their",
  "there",
  "these",
  "they",
  "this",
  "will",
  "with",
  "word",
  "words",
  "work",
  "write",
]);

const SMALL_GROUP_SOURCE_WORD_REJECTS = new Set([
  "add",
  "med",
  "od",
  "pictur",
  "rd",
  "sta",
  "tion",
  "wor",
]);

function isCleanSmallGroupExampleWord(word: string) {
  const cleanWord = word.trim().toLowerCase();
  return (
    /^[a-z]{2,8}$/.test(cleanWord)
    && !SMALL_GROUP_SOURCE_WORD_STOPWORDS.has(cleanWord)
    && !SMALL_GROUP_SOURCE_WORD_REJECTS.has(cleanWord)
    && !/(.)\1{3,}/.test(cleanWord)
  );
}

function smallGroupSourceLessonWords(
  sourceText: string,
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
) {
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const words = cleanSmallGroupSourceText(sourceText)
    .match(/\b[A-Za-z]{2,14}\b/g) ?? [];
  const uniqueWords = Array.from(new Set(words.map((word) => word.toLowerCase())));

  if (subject === "math") {
    return uniqueWords
      .filter((word) => /add|subtract|total|part|whole|number|story|equation|draw|count/.test(word))
      .slice(0, 8);
  }

  if (letterNeed) {
    const targetWords = uniqueWords
      .filter((word) =>
        word.includes(letterNeed)
        && word.length <= 8
        && !SMALL_GROUP_SOURCE_WORD_STOPWORDS.has(word),
      )
      .slice(0, 8);

    if (targetWords.length) {
      return targetWords;
    }
  }

  return uniqueWords
    .filter((word) => word.length >= 3 && !SMALL_GROUP_SOURCE_WORD_STOPWORDS.has(word))
    .slice(0, 8);
}

const SMALL_GROUP_LETTER_EXAMPLES: Record<string, string[]> = {
  a: ["at", "am", "map", "sat", "tap"],
  b: ["bat", "bag", "big", "rub", "cab"],
  c: ["cat", "cap", "cup", "can", "pic"],
  d: ["dog", "dig", "did", "dad", "red", "mud"],
  e: ["egg", "bed", "men", "ten", "pet"],
  f: ["fan", "fit", "fun", "if", "off"],
  g: ["gum", "gap", "got", "pig", "tag"],
  h: ["hat", "hop", "hit", "him", "hot"],
  i: ["it", "in", "sit", "pig", "pin"],
  j: ["jet", "jam", "jog", "jump"],
  k: ["kid", "kit", "skin", "milk"],
  l: ["lap", "lip", "leg", "hill", "bell"],
  m: ["map", "mat", "mom", "ham", "jam"],
  n: ["nap", "net", "not", "sun", "pin"],
  o: ["on", "hot", "pot", "dog", "mom"],
  p: ["pan", "pig", "pot", "cap", "tap"],
  q: ["quit", "quiz", "quack", "quick"],
  r: ["rat", "run", "red", "car", "rip"],
  s: ["sun", "sat", "sit", "bus", "mess"],
  t: ["tap", "top", "ten", "hat", "sit"],
  u: ["up", "sun", "cup", "bug", "mud"],
  v: ["van", "vet", "vest", "have"],
  w: ["wet", "win", "web", "wag"],
  x: ["box", "fox", "six", "mix"],
  y: ["yes", "yet", "yum", "my"],
  z: ["zip", "zap", "zoo", "buzz"],
};

const SMALL_GROUP_DIGRAPH_EXAMPLES: Record<string, string[]> = {
  ch: ["chip", "chin", "chop", "lunch", "rich"],
  ck: ["duck", "sock", "back", "neck", "pick"],
  ng: ["ring", "sing", "song", "king", "long"],
  sh: ["ship", "shop", "fish", "wish", "shell"],
  th: ["thin", "that", "this", "bath", "moth"],
  wh: ["whip", "when", "which", "whale"],
};

function smallGroupNeedChunk(candidate: CurriculumNeedCandidate) {
  const need = normalizeCurriculumNeedText(candidate.need).toLowerCase();
  const terms = [
    need,
    ...candidate.searchTerms.map((term) => normalizeCurriculumNeedText(term).toLowerCase()),
  ];

  for (const term of terms) {
    const match =
      term.match(/\b(ch|sh|th|wh|ck|ng|qu)\b/)
      || term.match(/\b(ch|sh|th|wh|ck|ng|qu)\s+(?:identification|sound|words|spelling)\b/);

    if (match?.[1]) {
      return match[1];
    }
  }

  return "";
}

function smallGroupPracticeExamples(
  candidate: CurriculumNeedCandidate,
  subject: "skills" | "listening" | "math",
  sourceWords: string[],
) {
  const letterNeed = smallGroupSingleLetterNeed(candidate).toLowerCase();
  const chunkNeed = smallGroupNeedChunk(candidate).toLowerCase();

  if (subject === "math") {
    return ["one teacher-modeled problem", "one group problem", "one independent check"];
  }

  if (letterNeed) {
    const sourceExamples = sourceWords
      .filter((word) => word.includes(letterNeed) && isCleanSmallGroupExampleWord(word))
      .slice(0, 3);
    return Array.from(new Set([
      ...(SMALL_GROUP_LETTER_EXAMPLES[letterNeed] ?? []),
      ...sourceExamples,
    ])).slice(0, 6);
  }

  if (chunkNeed) {
    const sourceExamples = sourceWords
      .filter((word) => word.includes(chunkNeed) && isCleanSmallGroupExampleWord(word))
      .slice(0, 3);
    return Array.from(new Set([
      ...sourceExamples,
      ...(SMALL_GROUP_DIGRAPH_EXAMPLES[chunkNeed] ?? []),
    ])).slice(0, 6);
  }

  return sourceWords.slice(0, 6);
}

function smallGroupLessonConnection(
  recommendation: CurriculumRecommendation | undefined,
) {
  if (!recommendation) {
    return "the uploaded lesson";
  }

  return `${curriculumRecommendationLessonLabel(recommendation)} - ${recommendation.lessonTitle}`;
}

function smallGroupUsefulSourceMoment(
  analysisNotes: string[],
  recommendation: CurriculumRecommendation | undefined,
) {
  return (
    analysisNotes.find((note) => /read|write|spell|sound|letter|word|card|blend|segment|draw|solve|explain|retell|answer|ask|point|circle/i.test(note))
    || recommendation?.objective
    || recommendation?.parentSummary
    || recommendation?.iCanStatement
    || "Use one short, matching moment from the uploaded lesson."
  );
}

function smallGroupTeacherPlanRowsForAnalysis(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  analysis: SmallGroupLessonAnalysis,
): [string, string, string][] {
  const lessonConnection = smallGroupLessonConnection(recommendation);
  const sourceMoment = smallGroupUsefulSourceMoment(analysis.notes, recommendation);
  const examples = analysis.words.length ? analysis.words.join(", ") : "teacher-made matching examples";
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const chunkNeed = smallGroupNeedChunk(candidate);

  if (subject === "math") {
    return [
      ["1 min", "Name the Need", `Tell scholars: Today we are practicing ${analysis.target} Connect it to ${lessonConnection}.`],
      ["3 min", "I Do", analysis.model],
      ["5 min", "We Do", `${analysis.guidedPractice} Use this lesson move: ${sourceMoment}`],
      ["4 min", "You Do", analysis.independentPractice],
      ["2 min", "Data Check", analysis.dataCheckItems.join(" ")],
      ["1 min", "Next Step", "Mark each scholar as got it, almost, or reteach. Reteach immediately with fewer numbers or concrete objects if needed."],
    ];
  }

  if (subject === "listening") {
    return [
      ["1 min", "Name the Need", `Tell scholars: Today we are practicing ${analysis.target} Connect it to ${lessonConnection}.`],
      ["3 min", "I Do", analysis.model],
      ["5 min", "We Do", `${analysis.guidedPractice} Use this lesson moment: ${sourceMoment}`],
      ["4 min", "You Do", analysis.independentPractice],
      ["2 min", "Data Check", analysis.dataCheckItems.join(" ")],
      ["1 min", "Next Step", "Mark each scholar as got it, almost, or reteach. Give a sentence frame to any scholar who needs one more try."],
    ];
  }

  if (letterNeed) {
    return [
      ["1 min", "Name the Need", `Tell scholars: Today we are practicing lowercase ${letterNeed}. We will find it, say it, write it, and read it in words from ${lessonConnection}.`],
      ["2 min", "Visual Match", `Show lowercase ${letterNeed} beside 3 mixed letters. Scholars point to ${letterNeed}, say "${letterNeed}", trace it in the air, then write it once.`],
      ["3 min", "I Do", analysis.model],
      ["5 min", "We Do", `Use these examples: ${examples}. Scholars find ${letterNeed}, say the letter/name or sound, read the word with teacher support, then write ${letterNeed} or the word on a whiteboard.`],
      ["4 min", "You Do", analysis.independentPractice],
      ["2 min", "Data Check", analysis.dataCheckItems.join(" ")],
      ["1 min", "Next Step", "Circle each scholar's result: got it, almost, or reteach. If reteach is needed, repeat with only two letter choices before adding more choices."],
    ];
  }

  if (chunkNeed) {
    return [
      ["1 min", "Name the Need", `Tell scholars: Today we are practicing ${chunkNeed}. We will read it, say it, write it, and use it in words from ${lessonConnection}.`],
      ["3 min", "I Do", analysis.model],
      ["5 min", "We Do", `Use these examples: ${examples}. Scholars underline ${chunkNeed}, say the sound, blend the word, then write one matching word.`],
      ["4 min", "You Do", analysis.independentPractice],
      ["2 min", "Data Check", analysis.dataCheckItems.join(" ")],
      ["1 min", "Next Step", "Mark got it, almost, or reteach. If reteaching, go back to one word at a time and have scholars tap the sound before reading."],
    ];
  }

  return [
    ["1 min", "Name the Need", `Tell scholars: Today we are practicing ${analysis.target} Connect it to ${lessonConnection}.`],
    ["3 min", "I Do", analysis.model],
    ["5 min", "We Do", `${analysis.guidedPractice} Use this lesson move: ${sourceMoment}`],
    ["4 min", "You Do", analysis.independentPractice],
    ["2 min", "Data Check", analysis.dataCheckItems.join(" ")],
    ["1 min", "Next Step", "Mark got it, almost, or reteach. Give one more quick example to scholars who are close."],
  ];
}

function withSmallGroupTeacherRows(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  analysis: SmallGroupLessonAnalysis,
): SmallGroupLessonAnalysis {
  return {
    ...analysis,
    teacherRows: smallGroupTeacherPlanRowsForAnalysis(candidate, recommendation, subject, analysis),
  };
}

function buildSmallGroupLessonAnalysis(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  sourceText: string,
): SmallGroupLessonAnalysis {
  const target = smallGroupTeachingTarget(candidate, subject);
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const lessonLabel = recommendation
    ? `${curriculumRecommendationLessonLabel(recommendation)} - ${recommendation.lessonTitle}`
    : "the uploaded lesson";
  const notes = relevantSmallGroupSourceNotes(sourceText, candidate, recommendation).slice(0, 4);
  const words = smallGroupSourceLessonWords(sourceText, candidate, subject);
  const sourceFeatures = smallGroupSourceFeatures(sourceText);
  const practiceExamples = smallGroupPracticeExamples(candidate, subject, words);
  const exampleWords = practiceExamples.length ? practiceExamples.slice(0, 5).join(", ") : "two lesson examples";
  const dataCheckItems = smallGroupDataCheckItems(candidate, subject);
  const materials = smallGroupMaterials(candidate, recommendation, subject, sourceText);
  const sourceMoment = smallGroupUsefulSourceMoment(notes, recommendation);

  if (subject === "math") {
    return withSmallGroupTeacherRows(candidate, recommendation, subject, {
      dataCheckItems,
      familyLookFor: "Your child can show the math idea with a drawing or objects and explain how they know.",
      familyPrompt: "Show it, say it, write it, and explain how you know.",
      familySteps: [
        "Use small objects, fingers, or a quick drawing to make one math story.",
        "Ask your child to say what is happening in the story before writing numbers.",
        "Have your child write or say the matching number sentence and explain the answer.",
      ],
      guidedPractice: `Use ${lessonLabel} to solve one parallel problem together. Scholars build or draw the story, say the math sentence, then write the equation or total.`,
      independentPractice: "Give each scholar one fresh but similar story problem. Have them draw it, solve it, and explain the answer in one sentence.",
      materials,
      model: `Model the target from ${lessonLabel}: show the story with objects or a drawing, think aloud, then connect it to the number sentence.`,
      notes,
      summary: `The uploaded lesson was analyzed and turned into a small-group plan for ${target}`,
      target,
      words: practiceExamples,
    });
  }

  if (subject === "listening") {
    return withSmallGroupTeacherRows(candidate, recommendation, subject, {
      dataCheckItems,
      familyLookFor: "Your child can answer with a detail from the story or topic instead of guessing.",
      familyPrompt: "Tell me one detail. What happened, and how do you know?",
      familySteps: [
        "Reread or retell a short part of the story/topic.",
        "Ask one who, what, where, why, or how question.",
        "Have your child answer in a complete sentence using one lesson detail.",
      ],
      guidedPractice: `Use ${lessonLabel} to revisit one important text moment. Scholars answer together using a sentence frame, then add one text detail.`,
      independentPractice: "Have each scholar say or draw one response using a lesson detail or vocabulary word.",
      materials,
      model: `Model one complete response from ${lessonLabel}. Think aloud: name the detail, explain why it matters, then say the sentence clearly.`,
      notes,
      summary: `The uploaded lesson was analyzed and turned into a small-group plan for ${target}`,
      target,
      words: practiceExamples,
    });
  }

  if (letterNeed) {
    const confusableLetters =
      letterNeed.toLowerCase() === "d"
        ? "b, p, q"
        : letterNeed.toLowerCase() === "b"
          ? "d, p, q"
          : "2 or 3 known letters";

    return withSmallGroupTeacherRows(candidate, recommendation, subject, {
      dataCheckItems,
      familyLookFor: `Your child can find ${letterNeed}, name it or say the sound, and write it without guessing.`,
      familyPrompt: `Find ${letterNeed}, say it, write it, and read it in a word.`,
      familySteps: [
        `Write ${letterNeed} with ${confusableLetters} and ask your child to point to ${letterNeed}.`,
        `Have your child say the letter name or sound, then write ${letterNeed}.`,
        practiceExamples.length
          ? `Read or say these quick practice words together: ${practiceExamples.slice(0, 4).join(", ")}.`
          : `Find ${letterNeed} in one short word and say the word together.`,
      ],
      guidedPractice: `Use ${lessonLabel} with ${exampleWords}. Scholars find ${letterNeed}, say the letter name or sound, trace or write it, and read it in a short word.`,
      independentPractice: `Give scholars a short page/whiteboard with ${letterNeed}, ${confusableLetters}, and 2 practice words. They circle ${letterNeed}, write ${letterNeed}, and read one word containing ${letterNeed}.`,
      materials,
      model: `Show lowercase ${letterNeed}. Say, "This is ${letterNeed}." Point to ${letterNeed} in ${practiceExamples[0] || "a short word"}, say the letter name or sound, then write ${letterNeed}. Connect it to this lesson source moment: ${sourceMoment}`,
      notes,
      summary: `The uploaded lesson was analyzed and turned into a small-group plan for ${target}`,
      target,
      words: practiceExamples,
    });
  }

  return withSmallGroupTeacherRows(candidate, recommendation, subject, {
    dataCheckItems,
    familyLookFor: "Your child can practice the skill accurately and explain their thinking without guessing.",
    familyPrompt: "Show me how you know, then try one more.",
    familySteps: [
      `Practice the target skill for 5 to 10 minutes: ${target}`,
      practiceExamples.length ? `Use these lesson examples if helpful: ${practiceExamples.slice(0, 5).join(", ")}.` : "Use one example from class and one fresh example.",
      "Have your child explain how they know before moving on.",
    ],
    guidedPractice: sourceFeatures.hasReader || sourceFeatures.hasCards
      ? `Use the lesson cards, reader, or word work from ${lessonLabel}. Model one example, practice two together, then have scholars read, build, or write one matching example.`
      : `Use ${lessonLabel} to model one lesson example, practice two guided examples, then have scholars try one matching example independently.`,
    independentPractice: "Scholars complete one matching lesson task independently, then read or explain the answer back to the teacher.",
    materials,
    model: `Model the exact target from ${lessonLabel}. Say the thinking out loud, show the response, then have scholars echo the key step.`,
    notes,
    summary: `The uploaded lesson was analyzed and turned into a small-group plan for ${target}`,
    target,
    words: practiceExamples,
  });
}

function smallGroupTeacherPlanRowsFromAnalysis(analysis: SmallGroupLessonAnalysis) {
  if (analysis.teacherRows?.length) {
    return analysis.teacherRows;
  }

  return [
    ["1-2 min", "Name the Need", analysis.summary],
    ["3 min", "Teacher Model", analysis.model],
    ["5 min", "Guided Lesson Practice", analysis.guidedPractice],
    ["4 min", "Independent Evidence", analysis.independentPractice],
    ["1-2 min", "Record Next Step", analysis.dataCheckItems.join(" ")],
  ];
}

function smallGroupTeacherPlanRows(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  sourceText: string,
) {
  const target = smallGroupTeachingTarget(candidate, subject);
  const lessonTitle = recommendation?.lessonTitle || "the connected lesson";
  const sourcePractice = smallGroupAnalyzedSourcePractice(candidate, recommendation, subject, sourceText);

  if (subject === "math") {
    return [
      ["1-2 min", "Name the Need", `Tell scholars the target: ${target} Show one quick teacher model.`],
      ["3 min", "Model", "Use objects or a drawing. Say the math story out loud, then connect it to numbers or a number sentence."],
      ["5 min", "Guided Practice", sourcePractice],
      ["4 min", "Independent Check", smallGroupDataCheckItems(candidate, subject).join(" ")],
      ["1 min", "Next Step", "Mark each scholar as got it, almost, or reteach. Reteach with smaller numbers or fewer parts if needed."],
    ];
  }

  if (subject === "listening") {
    return [
      ["1-2 min", "Name the Need", `Tell scholars the target: ${target}`],
      ["3 min", "Model", "Read or retell a short part of the lesson. Think aloud using one detail and one complete sentence."],
      ["5 min", "Guided Practice", sourcePractice],
      ["4 min", "Independent Check", smallGroupDataCheckItems(candidate, subject).join(" ")],
      ["1 min", "Next Step", "Mark each scholar as got it, almost, or reteach. Prompt with sentence frames if needed."],
    ];
  }

  return [
    ["1-2 min", "Name the Need", `Tell scholars the target: ${target}`],
    ["3 min", "Teacher Model", `Model the exact response: say it, point to it, read it in a word if possible, and write it.`],
    ["5 min", "Guided Practice", sourcePractice],
    ["4 min", "Independent Check", smallGroupDataCheckItems(candidate, subject).join(" ")],
    ["1 min", "Next Step", "Mark each scholar as got it, almost, or reteach. Give one more quick example to any scholar who is close."],
  ];
}

function smallGroupGuidedPracticeStep(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
) {
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const lessonTitle = recommendation?.lessonTitle || "the connected classroom lesson";

  if (subject === "skills" && letterNeed) {
    return `Mix ${letterNeed} with 3-5 known letters. Scholars point to ${letterNeed}, say its name or sound, trace it, write it, and read it in one short lesson word if available.`;
  }

  if (subject === "skills") {
    return `Use ${lessonTitle} as the connected classroom lesson. Model the target, practice two guided examples, then have scholars read or write one example independently.`;
  }

  if (subject === "math") {
    return `Use ${lessonTitle} as the connected classroom lesson. Model one problem with objects or drawings, solve one together, then have scholars try one and explain their thinking.`;
  }

  return `Use ${lessonTitle} as the connected classroom lesson. Revisit a short text/detail, model one response, then have scholars answer with a complete sentence.`;
}

function smallGroupSourceFeatures(sourceText: string) {
  const lowerSource = sourceText.toLowerCase();

  return {
    hasBlendSegment: /blend|segment|phoneme|sound/.test(lowerSource),
    hasCards: /card|pocket chart|letter/.test(lowerSource),
    hasPictureWork: /picture|image|illustration/.test(lowerSource),
    hasReader: /reader|decodable|story|sentence/.test(lowerSource),
    hasWriting: /write|copy|trace|worksheet|recording page|pencil/.test(lowerSource),
  };
}

function smallGroupAnalyzedSourcePractice(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  sourceText: string,
) {
  const hasUsableSource = isReadableLessonSourceText(sourceText, 8, 40);
  const letterNeed = smallGroupSingleLetterNeed(candidate);
  const lessonTitle = recommendation?.lessonTitle || "the uploaded lesson";

  if (!hasUsableSource) {
    return smallGroupGuidedPracticeStep(candidate, recommendation, subject);
  }

  const features = smallGroupSourceFeatures(sourceText);

  if (subject === "skills" && letterNeed) {
    const sourceActivity = [
      features.hasCards ? `use the lesson letter/word cards to find lowercase ${letterNeed}` : `show lowercase ${letterNeed} beside 3 known letters`,
      features.hasBlendSegment ? `say the sound and blend or segment one short lesson word with ${letterNeed}` : `say the letter name/sound and read it in one short word`,
      features.hasWriting ? `write ${letterNeed} and one lesson word on whiteboards` : `trace ${letterNeed} in the air, then point to it again`,
    ].join("; ");

    return `Use the uploaded ${lessonTitle} routine as the source: ${sourceActivity}. Keep the practice focused on the small-group need instead of rereading the whole lesson.`;
  }

  if (subject === "skills") {
    return `Use the uploaded ${lessonTitle} routine to model the target, practice two lesson examples together, then have scholars read, build, or write one matching example independently.`;
  }

  if (subject === "math") {
    return `Use the uploaded ${lessonTitle} routine to model one lesson problem with objects or drawings, solve one together, then have scholars try one parallel problem and explain their thinking.`;
  }

  return `Use the uploaded ${lessonTitle} routine to revisit one important text moment, model a complete response, then have scholars practice with one lesson detail or vocabulary word.`;
}

function smallGroupUploadedLessonSummary(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
  sourceText: string,
) {
  if (!isReadableLessonSourceText(sourceText, 8, 40)) {
    return "";
  }

  const target = smallGroupTeachingTarget(candidate, subject);
  const lessonTitle = recommendation?.lessonTitle || "the selected lesson";

  return `Uploaded source analyzed: this plan uses ${lessonTitle} as the classroom routine and narrows it to this target: ${target}`;
}

function smallGroupFamilyPractice(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
) {
  const tips = curriculumFamilyPracticeTips(candidate, subject);
  const target = smallGroupTeachingTarget(candidate, subject);
  const need = normalizeCurriculumNeedText(candidate.need);
  const letterNeed = smallGroupSingleLetterNeed(candidate);

  if (subject === "skills" && (letterNeed || /^[a-z]$/i.test(need))) {
    const letter = letterNeed || need;
    return {
      focus: target,
      lookFor: `Your child can find ${letter}, name or say it, and write it without guessing.`,
      steps: [
        `Write ${letter} on a card or paper. Say: "This is ${letter}."`,
        `Mix ${letter} with 3 or 4 other letters. Ask your child to point to ${letter}.`,
        `Have your child write ${letter} three times and read it back.`,
      ],
      prompt: `Point to ${letter}, say it, write it, then find it in a book or around the house.`,
    };
  }

  return {
    focus:
      target
      || recommendation?.iCanStatement
      || recommendation?.objective
      || candidate.need,
    lookFor: tips.lookFor,
    steps: tips.steps,
    prompt: tips.prompt,
  };
}

type HubTeacherWorkspaceFolder = {
  createdAtLocal: string;
  id: string;
  title: string;
};

type HubTeacherWorkspaceResource = {
  createdAtLocal: string;
  folderId: string;
  id: string;
  notes: string;
  title: string;
  type: "note" | "link" | "file" | "data";
  updatedAtLocal: string;
  url: string;
};

type HubTeacherWorkspaceData = {
  folders: HubTeacherWorkspaceFolder[];
  resources: HubTeacherWorkspaceResource[];
};

function normalizeHubTeacherWorkspaceData(data: Record<string, unknown> | undefined): HubTeacherWorkspaceData {
  const folders = Array.isArray(data?.folders) ? data.folders : [];
  const resources = Array.isArray(data?.resources) ? data.resources : [];

  return {
    folders: folders
      .map((folder) => {
        const nextFolder = folder && typeof folder === "object" ? folder as Record<string, unknown> : {};
        return {
          createdAtLocal: asText(nextFolder.createdAtLocal),
          id: asText(nextFolder.id),
          title: asText(nextFolder.title).trim(),
        };
      })
      .filter((folder) => folder.id && folder.title),
    resources: resources
      .map((resource) => {
        const nextResource = resource && typeof resource === "object" ? resource as Record<string, unknown> : {};
        const type = asText(nextResource.type);
        return {
          createdAtLocal: asText(nextResource.createdAtLocal),
          folderId: asText(nextResource.folderId),
          id: asText(nextResource.id),
          notes: asText(nextResource.notes),
          title: asText(nextResource.title).trim(),
          type: type === "link" || type === "file" || type === "data" ? type : "note",
          updatedAtLocal: asText(nextResource.updatedAtLocal),
          url: asText(nextResource.url),
        };
      })
      .filter((resource) => resource.id && (resource.title || resource.notes || resource.url)),
  };
}

function hubWorkspaceFolderTitle(subject: "skills" | "listening" | "math") {
  if (subject === "math") return "Small Group Math Plans";
  if (subject === "listening") return "Small Group Listening Plans";
  return "Small Group Skills Plans";
}

function ensureHubWorkspaceFolder(workspaceData: HubTeacherWorkspaceData, title: string) {
  const existing = workspaceData.folders.find((folder) =>
    folder.title.trim().toLowerCase() === title.trim().toLowerCase(),
  );

  if (existing) {
    return existing.id;
  }

  const folder = {
    createdAtLocal: new Date().toISOString(),
    id: `folder-${safeCurriculumFeedbackId(title)}-${Date.now().toString(36)}`,
    title,
  };

  workspaceData.folders.push(folder);
  return folder.id;
}

function smallGroupHubPlanResourceId(
  candidate: CurriculumNeedCandidate,
  recommendation: CurriculumRecommendation | undefined,
  subject: "skills" | "listening" | "math",
) {
  return [
    "small-group-plan",
    subject,
    safeCurriculumFeedbackId(candidate.key || candidate.need),
    safeCurriculumFeedbackId(recommendation?.id || recommendation?.lessonTitle || "custom"),
  ].join("-").slice(0, 180);
}

function smallGroupPlanSubjectLabel(subject: "skills" | "listening" | "math") {
  if (subject === "math") return "Math";
  if (subject === "listening") return "Listening & Learning";
  return "CKLA Skills";
}

function buildSmallGroupHubPlanResource(
  candidate: CurriculumNeedCandidate,
  recommendations: CurriculumRecommendation[],
  subject: "skills" | "listening" | "math",
  lessonSource?: SmallGroupLessonSource,
) {
  const bestLesson = recommendations[0];
  const sourceText = lessonSource?.text.trim() || recommendations[0]?.sourceText?.trim() || "";
  const sourceAnalysis = lessonSource?.analysis ?? (
    isReadableLessonSourceText(sourceText, 8, 40)
      ? buildSmallGroupLessonAnalysis(candidate, bestLesson, subject, sourceText)
      : undefined
  );
  const objective = smallGroupPlanObjective(candidate, bestLesson, subject);
  const materials = sourceAnalysis?.materials ?? smallGroupMaterials(candidate, bestLesson, subject, sourceText);
  const planRows = sourceAnalysis
    ? smallGroupTeacherPlanRowsFromAnalysis(sourceAnalysis)
    : smallGroupTeacherPlanRows(candidate, bestLesson, subject, sourceText);
  const dataCheckItems = sourceAnalysis?.dataCheckItems ?? smallGroupDataCheckItems(candidate, subject);
  const practice = sourceAnalysis
    ? {
      focus: sourceAnalysis.target,
      lookFor: sourceAnalysis.familyLookFor,
      prompt: sourceAnalysis.familyPrompt,
      steps: sourceAnalysis.familySteps,
    }
    : smallGroupFamilyPractice(candidate, bestLesson, subject);
  const folderTitle = hubWorkspaceFolderTitle(subject);
  const lessonLabel = bestLesson
    ? `${curriculumRecommendationLessonLabel(bestLesson)}${bestLesson.lessonTitle ? ` - ${bestLesson.lessonTitle}` : ""}`
    : "No connected lesson";
  const title = `Small Group: ${candidate.need}${bestLesson?.lessonNumber ? ` - Lesson ${bestLesson.lessonNumber.replace(/^lesson\s*/i, "")}` : ""}`;
  const notes = [
    "SMALL-GROUP UFLI INTERVENTION PLAN",
    "",
    `Subject: ${smallGroupPlanSubjectLabel(subject)}`,
    `Target need: ${candidate.need}`,
    `Evidence: ${curriculumGroupReason(candidate)}`,
    candidate.scholars.length ? `Scholars: ${candidate.scholars.join(", ")}` : "Scholars: No roster names were attached yet.",
    `Connected lesson: ${lessonLabel}`,
    bestLesson?.priorityStandard ? `Standard: ${bestLesson.priorityStandard}` : "",
    bestLesson?.iCanStatement ? `I Can: ${bestLesson.iCanStatement}` : "",
    bestLesson ? `Why this lesson: ${curriculumRecommendationReason(bestLesson, candidate)}` : "",
    lessonSource?.fileName ? `Uploaded source: ${lessonSource.fileName}` : "",
    sourceAnalysis?.summary ? `Source analysis: ${sourceAnalysis.summary}` : "",
    "",
    "TEACHING TARGET",
    objective,
    "",
    "MATERIALS",
    ...materials.map((material) => `- ${material}`),
    "",
    "TEACH IT",
    ...planRows.map(([time, part, moves]) => `- ${time} | ${part}: ${moves}`),
    "",
    "QUICK DATA CHECK",
    ...dataCheckItems.map((item) => `- ${item}`),
    "",
    "FAMILY HELP",
    `Focus: ${practice.focus}`,
    "Try this at home:",
    ...practice.steps.map((step) => `- ${step}`),
    `What to look for: ${practice.lookFor}`,
    `Prompt: ${practice.prompt}`,
    "",
    `Saved from Learning Games on ${new Date().toLocaleDateString()}.`,
  ]
    .filter((line) => line !== "")
    .join("\n");

  return {
    folderTitle,
    resource: {
      createdAtLocal: new Date().toISOString(),
      folderId: "",
      id: smallGroupHubPlanResourceId(candidate, bestLesson, subject),
      notes,
      title,
      type: "data" as const,
      updatedAtLocal: new Date().toISOString(),
      url: bestLesson?.url || HUB_CLASS_URL,
    },
  };
}

function decodePdfLiteralString(value: string) {
  let output = "";

  for (let index = 1; index < value.length - 1; index += 1) {
    const character = value[index];

    if (character !== "\\") {
      output += character;
      continue;
    }

    const next = value[index + 1];
    if (!next) continue;

    if (next === "n") output += "\n";
    else if (next === "r") output += "\r";
    else if (next === "t") output += "\t";
    else if (next === "b") output += "\b";
    else if (next === "f") output += "\f";
    else if (next === "(" || next === ")" || next === "\\") output += next;
    else if (/[0-7]/.test(next)) {
      const match = value.slice(index + 1, index + 4).match(/^[0-7]{1,3}/)?.[0] ?? "";
      output += String.fromCharCode(parseInt(match, 8));
      index += match.length - 1;
      continue;
    } else if (next === "\r" || next === "\n") {
      if (next === "\r" && value[index + 2] === "\n") index += 1;
    } else {
      output += next;
    }

    index += 1;
  }

  return output;
}

function textFromPdfContent(content: string) {
  const snippets: string[] = [];
  const blocks = content.match(/BT[\s\S]*?ET/g) ?? [content];
  const literalPattern = /\((?:\\[\s\S]|[^\\)])*\)/g;

  blocks.forEach((block) => {
    const pieces = Array.from(block.matchAll(literalPattern))
      .map((match) => decodePdfLiteralString(match[0]).trim())
      .filter(Boolean);

    if (pieces.length) {
      snippets.push(pieces.join(" "));
    }
  });

  return cleanSmallGroupSourceText(snippets.join("\n"));
}

function latin1FromBytes(bytes: Uint8Array) {
  return new TextDecoder("latin1").decode(bytes);
}

async function inflatePdfStreamBytes(bytes: Uint8Array) {
  const DecompressionStreamCtor = (globalThis as unknown as {
    DecompressionStream?: new (format: string) => TransformStream<Uint8Array, Uint8Array>;
  }).DecompressionStream;

  if (!DecompressionStreamCtor) return [];

  const inflated: Uint8Array[] = [];
  for (const format of ["deflate", "deflate-raw"]) {
    try {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStreamCtor(format));
      inflated.push(new Uint8Array(await new Response(stream).arrayBuffer()));
    } catch {
      // Try the next stream flavor. PDF creators are not consistent here.
    }
  }

  return inflated;
}

async function extractTextFromPdfFile(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const raw = latin1FromBytes(bytes);
  const chunks = new Set<string>();
  const directText = textFromPdfContent(raw);

  if (isReadableLessonSourceText(directText)) {
    chunks.add(directText);
  }

  let searchIndex = 0;
  while (searchIndex < raw.length) {
    const streamIndex = raw.indexOf("stream", searchIndex);
    if (streamIndex === -1) break;

    let dataStart = streamIndex + "stream".length;
    if (raw[dataStart] === "\r" && raw[dataStart + 1] === "\n") dataStart += 2;
    else if (raw[dataStart] === "\n" || raw[dataStart] === "\r") dataStart += 1;

    const endIndex = raw.indexOf("endstream", dataStart);
    if (endIndex === -1) break;

    let dataEnd = endIndex;
    while (dataEnd > dataStart && (raw[dataEnd - 1] === "\n" || raw[dataEnd - 1] === "\r")) {
      dataEnd -= 1;
    }

    const dictionary = raw.slice(Math.max(0, streamIndex - 1400), streamIndex);
    const streamBytes = bytes.slice(dataStart, dataEnd);
    const contentBytes = /FlateDecode/i.test(dictionary)
      ? await inflatePdfStreamBytes(streamBytes)
      : [streamBytes];

    contentBytes.forEach((contentByteChunk) => {
      const streamText = textFromPdfContent(latin1FromBytes(contentByteChunk));
      if (isReadableLessonSourceText(streamText, 8, 50)) chunks.add(streamText);
    });

    searchIndex = endIndex + "endstream".length;
  }

  const extractedText = cleanSmallGroupSourceText(Array.from(chunks).join("\n\n"));
  return isReadableLessonSourceText(extractedText) ? extractedText : "";
}

async function readSmallGroupLessonSourceFile(file: File) {
  if (file.type.startsWith("text/") || /\.(txt|md|csv)$/i.test(file.name)) {
    return cleanSmallGroupSourceText(await file.text());
  }

  if (file.type === "application/pdf" || /\.pdf$/i.test(file.name)) {
    return extractTextFromPdfFile(file);
  }

  return "";
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

function isQpsSkillsEvidence(evidence?: SkillsDataEvidence) {
  return evidence?.gameId === QPS_SCREENER_GAME_ID;
}

function skillsDataCellSourceClass(cell: SkillsDataCell) {
  if (isQpsSkillsEvidence(cell.latest)) return "is-qps";
  if (cell.latest?.source === "Teacher observation") return "is-manual";
  return "";
}

function skillsDataCellMarker(cell: SkillsDataCell) {
  if (isQpsSkillsEvidence(cell.latest)) return "QPS";
  return "";
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
  const [curriculumRecommendationsByNeedKey, setCurriculumRecommendationsByNeedKey] =
    useState<Record<string, CurriculumRecommendation[]>>({});
  const [curriculumRecommendationErrorsByNeedKey, setCurriculumRecommendationErrorsByNeedKey] =
    useState<Record<string, string>>({});
  const [curriculumRecommendationStatusesByNeedKey, setCurriculumRecommendationStatusesByNeedKey] =
    useState<Record<string, CurriculumRecommendationStatus>>({});
  const [curriculumRecommendationFeedback, setCurriculumRecommendationFeedback] =
    useState<CurriculumRecommendationFeedback[]>([]);
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
  const [qpsPrintEndDate, setQpsPrintEndDate] = useState(() => qpsCurrentWeekRange().end);
  const [qpsPrintStartDate, setQpsPrintStartDate] = useState(() => qpsCurrentWeekRange().start);
  const [qpsShowCurrentWeekOnly, setQpsShowCurrentWeekOnly] = useState(true);
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
  const [trackingInitialDrafts, setTrackingInitialDrafts] =
    useState<Record<string, string>>({});
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
        curriculumRecommendationFeedbackSnapshot,
        nextManagedGames,
      ] = await Promise.all([
        db.collection(SCHOLAR_COLLECTION).get(),
        db.collection(RESULT_COLLECTION).get(),
        db.collection(PROGRESS_COLLECTION).get(),
        db.collection(SCHOLAR_CONTROL_COLLECTION).get(),
        db.collection(PREASSESSMENT_CONTROL_COLLECTION).get(),
        db.collection(SKILLS_DATA_OVERRIDE_COLLECTION).get(),
        db.collection(CURRICULUM_RECOMMENDATION_FEEDBACK_COLLECTION).get(),
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
      setCurriculumRecommendationFeedback(
        curriculumRecommendationFeedbackSnapshot.docs
          .map(mapCurriculumRecommendationFeedback)
          .filter((feedback) => feedback.status === "not-match"),
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

  const duplicateTrackingInitialGroups = useMemo(() => {
    const groups = new Map<string, { initials: string; names: string[]; teacherEmail: string }>();

    scholars.forEach((scholar) => {
      const initials = initialsForScholar(scholar);
      const key = `${scholar.teacherEmail}:${initials}`;
      const group = groups.get(key) ?? { initials, names: [], teacherEmail: scholar.teacherEmail };
      group.names.push(`${scholar.firstName} ${scholar.lastName}`);
      groups.set(key, group);
    });

    return Array.from(groups.values())
      .filter((group) => group.initials && group.names.length > 1)
      .map((group) => `${group.initials}: ${group.names.sort((a, b) => a.localeCompare(b)).join(", ")} (${teacherLabelForEmail(group.teacherEmail)})`);
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
  const qpsResults = useMemo(() => {
    return results
      .filter((result) =>
        result.gameId === QPS_SCREENER_GAME_ID
        && matchResult(result, reportScholars).scholar,
      )
      .sort((a, b) =>
        (formatDate(b.completedAt)?.getTime() ?? 0) - (formatDate(a.completedAt)?.getTime() ?? 0),
      );
  }, [results, reportScholars]);
  const qpsReportRecords = useMemo<QpsReportRecord[]>(() => {
    const savedRecords = qpsResults;
    const activeProgressRecords = progressRecords.filter((progress) =>
      progress.gameId === QPS_SCREENER_GAME_ID
      && progress.status !== "completed"
      && matchResult(progress, reportScholars).scholar,
    );

    return [...savedRecords, ...activeProgressRecords].sort((a, b) =>
      (reportRecordDate(b)?.getTime() ?? 0) - (reportRecordDate(a)?.getTime() ?? 0),
    );
  }, [progressRecords, qpsResults, reportScholars]);
  const currentWeekQpsRange = qpsCurrentWeekRange();
  const qpsPanelResults = (qpsShowCurrentWeekOnly
    ? qpsReportRecords.filter((result) => resultIsWithinDateInputs(result, currentWeekQpsRange.start, currentWeekQpsRange.end))
    : qpsReportRecords
  );
  const qpsPanelTotalCount = qpsShowCurrentWeekOnly
    ? qpsReportRecords.filter((result) => resultIsWithinDateInputs(result, currentWeekQpsRange.start, currentWeekQpsRange.end)).length
    : qpsReportRecords.length;
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
      recommendations: recommendationsForNeedCandidate(curriculumRecommendations, candidate)
        .filter((recommendation) =>
          !curriculumRecommendationBlockedByFeedback(
            recommendation,
            candidate,
            curriculumRecommendationSubject,
            curriculumRecommendationFeedback,
          ),
        ),
    }));
  }, [curriculumNeedCandidates, curriculumRecommendationFeedback, curriculumRecommendationSubject, curriculumRecommendations]);
  const selectedSmallGroupNeed =
    curriculumNeedCandidates.find((need) => need.key === selectedSmallGroupNeedKey)
    ?? null;
  const selectedSmallGroupRecommendations = selectedSmallGroupNeed
    ? (
      curriculumRecommendationsByNeedKey[selectedSmallGroupNeed.key]
        ?? recommendationsForNeedCandidate(curriculumRecommendations, selectedSmallGroupNeed)
    ).filter((recommendation) =>
      Boolean(smallGroupLessonSources[recommendation.id]?.fileName || smallGroupLessonSources[recommendation.id]?.text)
      ||
      !curriculumRecommendationBlockedByFeedback(
        recommendation,
        selectedSmallGroupNeed,
        curriculumRecommendationSubject,
        curriculumRecommendationFeedback,
      ),
    )
    : [];
  const selectedSmallGroupRecommendationStatus = selectedSmallGroupNeed
    ? curriculumRecommendationStatusesByNeedKey[selectedSmallGroupNeed.key] ?? "idle"
    : "idle";
  const selectedSmallGroupRecommendationError = selectedSmallGroupNeed
    ? curriculumRecommendationErrorsByNeedKey[selectedSmallGroupNeed.key] ?? ""
    : "";

  const fetchCurriculumRecommendations = async (focusCandidate?: CurriculumNeedCandidate) => {
    const searchCandidates = focusCandidate ? [focusCandidate] : curriculumNeedCandidates;
    const needs = Array.from(new Set(
      searchCandidates
        .flatMap(curriculumRecommendationSearchTerms)
        .map(normalizeCurriculumNeedText)
        .filter(Boolean),
    )).slice(0, focusCandidate ? 12 : 24);

    if (!needs.length) {
      const message = "Choose Today, This Week, or a Data at a Glance report with needs first.";
      if (focusCandidate) {
        setCurriculumRecommendationsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: [],
        }));
        setCurriculumRecommendationErrorsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: message,
        }));
        setCurriculumRecommendationStatusesByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: "error",
        }));
      } else {
        setCurriculumRecommendations([]);
        setCurriculumRecommendationNeeds([]);
        setCurriculumRecommendationError(message);
        setCurriculumRecommendationStatus("error");
      }
      return;
    }

    if (focusCandidate) {
      setCurriculumRecommendationStatusesByNeedKey((current) => ({
        ...current,
        [focusCandidate.key]: "loading",
      }));
      setCurriculumRecommendationErrorsByNeedKey((current) => ({
        ...current,
        [focusCandidate.key]: "",
      }));
    } else {
      setCurriculumRecommendationStatus("loading");
      setCurriculumRecommendationError("");
    }

    try {
      if (curriculumRecommendationSubject !== "skills") {
        throw new Error("The UFLI intervention bank is for CKLA Skills small groups. Math and Listening groups should stay teacher-selected for now.");
      }

      const nextRecommendations = focusCandidate
        ? findUfliRecommendationsForNeedCandidate(focusCandidate)
        : findUfliRecommendationsForNeedCandidates(searchCandidates);

      if (focusCandidate) {
        setCurriculumRecommendationsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: nextRecommendations,
        }));
        setCurriculumRecommendationErrorsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: "",
        }));
        setCurriculumRecommendationStatusesByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: "success",
        }));
      } else {
        setCurriculumRecommendations(nextRecommendations);
        setCurriculumRecommendationNeeds(needs);
        setCurriculumRecommendationStatus("success");
      }
    } catch (nextError) {
      const message =
        nextError instanceof Error
          ? nextError.message
          : "UFLI intervention recommendations could not load yet.";

      if (focusCandidate) {
        setCurriculumRecommendationsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: [],
        }));
        setCurriculumRecommendationErrorsByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: message,
        }));
        setCurriculumRecommendationStatusesByNeedKey((current) => ({
          ...current,
          [focusCandidate.key]: "error",
        }));
      } else {
        setCurriculumRecommendations([]);
        setCurriculumRecommendationError(message);
        setCurriculumRecommendationStatus("error");
      }
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

  const saveCurriculumRecommendationNotMatch = async (
    candidate: CurriculumNeedCandidate,
    recommendation: CurriculumRecommendation,
    reason: string,
  ) => {
    const { auth, db, firebase } = await loadFirebase();
    const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? teacherAccount;

    if (!isAuthorizedTeacherEmail(signedInEmail)) {
      throw new Error("Sign in with an authorized teacher account before saving recommendation feedback.");
    }

    const feedbackId = curriculumRecommendationFeedbackId(
      candidate,
      recommendation,
      curriculumRecommendationSubject,
    );
    const serverTime = firebase.firestore.FieldValue.serverTimestamp();
    const feedback: CurriculumRecommendationFeedback = {
      candidateKey: candidate.key,
      id: feedbackId,
      lessonTitle: recommendation.lessonTitle,
      need: candidate.need,
      reason,
      recommendationId: recommendation.id,
      status: "not-match",
      subject: curriculumRecommendationSubject,
      teacherEmail: signedInEmail,
      updatedAt: serverTime,
      updatedBy: signedInEmail,
    };

    await db.collection(CURRICULUM_RECOMMENDATION_FEEDBACK_COLLECTION)
      .doc(feedbackId)
      .set({
        candidateKey: candidate.key,
        createdAt: serverTime,
        lessonTitle: recommendation.lessonTitle,
        need: candidate.need,
        reason,
        recommendationId: recommendation.id,
        status: "not-match",
        subject: curriculumRecommendationSubject,
        teacherEmail: signedInEmail,
        updatedAt: serverTime,
        updatedBy: signedInEmail,
      }, { merge: true });

    setCurriculumRecommendationFeedback((current) => [
      ...current.filter((entry) => entry.id !== feedbackId),
      feedback,
    ]);
  };

  const analyzeSmallGroupLessonSource = async (
    candidate: CurriculumNeedCandidate,
    recommendation: CurriculumRecommendation,
    sourceTextOverride?: string,
    fileNameOverride?: string,
  ) => {
    const currentSource = smallGroupLessonSources[recommendation.id] ?? { fileName: "", text: "" };
    const text = (sourceTextOverride ?? currentSource.text).trim();
    const fileName = fileNameOverride ?? currentSource.fileName;

    if (!isReadableLessonSourceText(text, 8, 40)) {
      updateSmallGroupLessonSource(recommendation.id, {
        analysis: undefined,
        analysisStatus: "needs-text",
        fileName,
        text,
      });
      setStatus("The uploaded source was attached, but it needs readable lesson text before it can make a stronger plan.");
      return null;
    }

    const targetMatch = smallGroupSourceTargetMatch(
      text,
      candidate,
      recommendation,
      curriculumRecommendationSubject,
    );

    if (!targetMatch.matches) {
      updateSmallGroupLessonSource(recommendation.id, {
        analysis: undefined,
        analysisStatus: "mismatch",
        fileName,
        mismatchReason: targetMatch.reason,
        text,
      });

      try {
        await saveCurriculumRecommendationNotMatch(candidate, recommendation, targetMatch.reason);
        setStatus(`${recommendation.lessonTitle} does not match ${candidate.need}. I saved that note and will stop suggesting it for this need.`);
      } catch (nextError) {
        setStatus(targetMatch.reason);
        setError(nextError instanceof Error ? nextError.message : "The not-a-match note could not be saved yet.");
      }

      return null;
    }

    const analysis = buildSmallGroupLessonAnalysis(
      candidate,
      recommendation,
      curriculumRecommendationSubject,
      text,
    );

    updateSmallGroupLessonSource(recommendation.id, {
      analysis,
      analysisStatus: "ready",
      fileName,
      text,
    });
    setStatus(`Analyzed ${fileName || recommendation.lessonTitle}. Teacher and family print plans were rebuilt from the source and this group's target need.`);
    return analysis;
  };

  const attachSmallGroupLessonSourceFile = async (
    candidate: CurriculumNeedCandidate,
    recommendation: CurriculumRecommendation,
    file: File | null,
  ) => {
    if (!file) {
      return;
    }

    updateSmallGroupLessonSource(recommendation.id, {
      analysis: undefined,
      analysisStatus: "none",
      fileName: file.name,
    });

    try {
      const text = await readSmallGroupLessonSourceFile(file);

      if (text) {
        updateSmallGroupLessonSource(recommendation.id, {
          analysis: undefined,
          analysisStatus: "none",
          fileName: file.name,
          text,
        });
        setStatus(`Attached ${file.name}. Click Analyze Source when you want to check whether it matches ${candidate.need} and rebuild the plans.`);
        return;
      }

      updateSmallGroupLessonSource(recommendation.id, {
        analysis: undefined,
        analysisStatus: "needs-text",
        fileName: file.name,
        text: "",
      });
      setStatus(`Attached ${file.name}, but the text could not be read automatically. Try a text-based PDF or paste the lesson notes in the source box.`);
    } catch {
      updateSmallGroupLessonSource(recommendation.id, {
        analysis: undefined,
        analysisStatus: "needs-text",
        fileName: file.name,
      });
      setStatus(`Attached ${file.name}, but the text could not be read automatically. Try a text-based PDF or paste the lesson notes in the source box.`);
    }
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
        trackingInitials: initialsForScholar({ firstName: cleanFirstName, lastName: cleanLastName }),
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
  const saveScholarTrackingInitials = async (scholar: Scholar, value: string) => {
    const nextInitials = cleanTrackingInitials(value);
    setError("");
    setStatus("");

    if (!nextInitials) {
      setError("Enter 1 to 3 letters for whole-group tracking initials.");
      return;
    }

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher Google account to edit tracking initials.");
      }

      await db.collection(SCHOLAR_COLLECTION).doc(scholar.id).set({
        trackingInitials: nextInitials,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
      setScholars((currentScholars) =>
        currentScholars.map((currentScholar) =>
          currentScholar.id === scholar.id
            ? { ...currentScholar, trackingInitials: nextInitials }
            : currentScholar,
        ),
      );
      setTrackingInitialDrafts((drafts) => ({
        ...drafts,
        [scholar.id]: nextInitials,
      }));
      setStatus(`Whole-group tracking initials for ${scholar.firstName} ${scholar.lastName} are now ${nextInitials}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Tracking initials could not be saved.");
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

  const qpsRecordsForSelectedRange = () => qpsReportRecords.filter((result) =>
    resultIsWithinDateInputs(result, qpsPrintStartDate, qpsPrintEndDate),
  );

  const buildQpsHubSummaryResource = (
    qpsRecordsForSave: QpsReportRecord[],
    rangeLabel: string,
  ) => {
    const summaryLines = qpsRecordsForSave.map((result) => {
      const match = matchResult(result, reportScholars);
      const completedAt = reportRecordDate(result);
      const resultPercent = result.totalQuestions ? Math.round((result.score / result.totalQuestions) * 100) : 0;
      const topNeeds = result.missedQuestions
        .slice(0, 6)
        .map((missed, index) => {
          const note = missedQuestionNote(result, missed, index);
          const label = missed.word || missed.correctAnswer || missed.category || `Item ${missed.questionIndex ?? index + 1}`;
          const response = missed.incorrectSelections?.join(", ") || "needs review";
          return `${label}: said ${response}${note ? ` (Note: ${note})` : ""}`;
        })
        .join("; ");

      return [
        `- ${match.label}`,
        `  Date: ${completedAt ? completedAt.toLocaleDateString() : "Date pending"}`,
        `  Status: ${reportRecordStatus(result)}`,
        `  Score: ${result.score}/${result.totalQuestions} (${resultPercent}%)`,
        `  Needs Review: ${result.missedCount}`,
        topNeeds ? `  Notes: ${topNeeds}` : "  Notes: No missed QPS items recorded.",
      ].join("\n");
    });
    const detailLines = qpsRecordsForSave.flatMap((result) => {
      const match = matchResult(result, reportScholars);
      const sectionLines = Object.entries(result.categoryScores ?? {}).map(([section, score]) => {
        const sectionPercent = score.total ? Math.round((score.correct / score.total) * 100) : 0;
        return `  - ${section}: ${score.correct}/${score.total}, ${score.missed} needs review, ${sectionPercent}%`;
      });
      const needLines = result.missedQuestions.length
        ? result.missedQuestions.map((missed, index) => {
          const label = missed.word || missed.correctAnswer || missed.category || `Item ${missed.questionIndex ?? index + 1}`;
          const response = missed.incorrectSelections?.join(", ") || "needs review";
          const note = missedQuestionNote(result, missed, index);
          return `  - ${missed.levelName || missed.category || `Item ${index + 1}`}: ${label}; said ${response}${note ? `; note: ${note}` : ""}`;
        })
        : ["  - No missed QPS items recorded."];

      return [
        "",
        match.label.toUpperCase(),
        "Section Scores:",
        ...(sectionLines.length ? sectionLines : ["  - No section breakdown saved for this QPS session."]),
        "Needs Review Items:",
        ...needLines,
      ];
    });
    const titleRange = rangeLabel.replace(/^QPS\s+/i, "");

    return {
      folderTitle: "QPS",
      resource: {
        createdAtLocal: new Date().toISOString(),
        folderId: "",
        id: [
          "qps-summary",
          safeCurriculumFeedbackId(teacherFilter || "all"),
          safeCurriculumFeedbackId(qpsPrintStartDate || "all"),
          safeCurriculumFeedbackId(qpsPrintEndDate || "all"),
        ].join("-").slice(0, 180),
        notes: [
          "QPS SCREENER SUMMARY",
          "",
          `Date range: ${rangeLabel}`,
          `Roster: ${teacherFilter === "all" ? "All rosters" : teacherLabelForEmail(teacherFilter)}`,
          `Records: ${qpsRecordsForSave.length}`,
          `Saved from Learning Games on ${new Date().toLocaleDateString()}.`,
          "",
          "CLASS SUMMARY",
          ...(summaryLines.length ? summaryLines : ["No QPS records were saved for this date range."]),
          "",
          "DETAILS",
          ...(detailLines.length ? detailLines : ["No QPS details were available for this date range."]),
        ].join("\n"),
        title: `QPS Screener Results - ${titleRange}`,
        type: "data" as const,
        updatedAtLocal: new Date().toISOString(),
        url: HUB_CLASS_URL,
      },
    };
  };

  const saveQpsSummaryToHub = async () => {
    const qpsRecordsForSave = qpsRecordsForSelectedRange();
    const rangeLabel = qpsDateRangeLabel(qpsPrintStartDate, qpsPrintEndDate);

    if (!qpsRecordsForSave.length) {
      setStatus("No QPS records are in that date range, so nothing was sent to the Hub.");
      return;
    }

    try {
      setError("");
      setStatus("Saving QPS summary to the Hub Teacher Workspace...");
      const bundle = buildQpsHubSummaryResource(qpsRecordsForSave, rangeLabel);
      await saveHubTeacherWorkspaceResource(bundle);
      setStatus(`Saved "${bundle.resource.title}" to Hub Teacher Workspace > ${bundle.folderTitle}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The QPS summary could not be saved to the Hub yet.");
    }
  };

  const printQpsSummaryReport = () => {
    const reportWindow = window.open("", "_blank");
    const qpsResultsForPrint = qpsRecordsForSelectedRange();
    const rangeLabel = qpsDateRangeLabel(qpsPrintStartDate, qpsPrintEndDate);
    const rowsHtml = qpsResultsForPrint.map((result) => {
      const match = matchResult(result, reportScholars);
      const completedAt = reportRecordDate(result);
      const resultPercent = result.totalQuestions ? Math.round((result.score / result.totalQuestions) * 100) : 0;
      return `
        <tr>
          <th>${escapeReportHtml(match.label)}</th>
          <td>${escapeReportHtml(completedAt ? completedAt.toLocaleDateString() : "Date pending")}</td>
          <td>${escapeReportHtml(reportRecordStatus(result))}</td>
          <td>${result.score}/${result.totalQuestions} (${resultPercent}%)</td>
          <td>${result.missedCount}</td>
          <td>${escapeReportHtml(result.missedQuestions.slice(0, 8).map((missed, index) => {
            const note = missedQuestionNote(result, missed, index);
            return `${missed.word || missed.correctAnswer || missed.category}: ${missed.incorrectSelections?.join(", ") || "needs review"}${note ? ` (Note: ${note})` : ""}`;
          }).join("; "))}</td>
        </tr>
      `;
    }).join("");
    const detailCardsHtml = qpsResultsForPrint.map((result) => {
      const match = matchResult(result, reportScholars);
      const completedAt = reportRecordDate(result);
      const resultPercent = result.totalQuestions ? Math.round((result.score / result.totalQuestions) * 100) : 0;
      const sectionRowsHtml = Object.entries(result.categoryScores ?? {}).map(([section, score]) => {
        const sectionPercent = score.total ? Math.round((score.correct / score.total) * 100) : 0;
        return `
          <tr>
            <th>${escapeReportHtml(section)}</th>
            <td>${score.correct}/${score.total}</td>
            <td>${score.missed}</td>
            <td>${sectionPercent}%</td>
          </tr>
        `;
      }).join("");
      const needsHtml = result.missedQuestions.length
        ? `<ul>${result.missedQuestions.map((missed, index) => {
            const note = missedQuestionNote(result, missed, index);
            return `
            <li>
              <strong>${escapeReportHtml(missed.levelName || missed.category || `Item ${missed.questionIndex ?? index + 1}`)}</strong>:
              ${escapeReportHtml(missed.word || missed.correctAnswer || "QPS item")}
              <span>said ${escapeReportHtml(missed.incorrectSelections?.join(", ") || "needs review")}</span>
              ${note ? `<em>Note: ${escapeReportHtml(note)}</em>` : ""}
            </li>
          `;
          }).join("")}</ul>`
        : `<p class="empty-note">No missed QPS items recorded.</p>`;

      return `
        <section class="qps-card">
          <header>
            <div>
              <h2>${escapeReportHtml(match.label)}</h2>
              <p>${escapeReportHtml(completedAt ? completedAt.toLocaleDateString() : "Date pending")} - ${escapeReportHtml(reportRecordStatus(result))}</p>
            </div>
            <strong>${result.score}/${result.totalQuestions} (${resultPercent}%)</strong>
          </header>
          <table>
            <thead>
              <tr><th>Section</th><th>Score</th><th>Needs Review</th><th>Percent</th></tr>
            </thead>
            <tbody>${sectionRowsHtml || `<tr><td colspan="4">No section breakdown saved for this QPS session.</td></tr>`}</tbody>
          </table>
          <h3>Needs Review Items</h3>
          ${needsHtml}
        </section>
      `;
    }).join("");

    if (!reportWindow) {
      window.print();
      return;
    }

    reportWindow.document.write(`
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>QPS Screener Summary</title>
        <style>
          @page{margin:10mm}
          html,body{margin:0;padding:0}
          body{font-family:Arial,Helvetica,sans-serif;color:#223044}
          .report{padding:0}
          .report-header{border-bottom:2px solid #223044;margin:0 0 12px;padding:0 0 10px}
          h1{margin:0 0 4px;font-size:24px}
          h2{margin:0;font-size:16px}
          h3{margin:10px 0 5px;font-size:13px}
          p{margin:0;color:#56677d;font-size:12px}
          table{width:100%;border-collapse:collapse;font-size:11px;page-break-inside:auto}
          thead{display:table-header-group}
          th,td{border:1px solid #cdd8e5;padding:5px;text-align:left;vertical-align:top}
          thead th,tbody th{background:#eef3f8}
          .qps-card{border:1px solid #cdd8e5;border-radius:8px;margin:12px 0 0;padding:10px;break-inside:avoid;page-break-inside:avoid}
          .qps-card header{align-items:flex-start;display:flex;justify-content:space-between;gap:12px;margin-bottom:8px}
          .qps-card header strong{font-size:18px}
          ul{margin:0;padding-left:18px;font-size:11px}
          li{margin:3px 0}
          li span{color:#56677d}
          .empty-note{border:1px solid #cdd8e5;border-radius:8px;margin:0;padding:8px;color:#56677d}
          tr{break-inside:avoid;page-break-inside:avoid}
        </style>
      </head>
      <body>
        <main class="report">
        <header class="report-header">
          <h1>QPS Screener Results</h1>
          <p>${escapeReportHtml(rangeLabel)} - Printed ${escapeReportHtml(new Date().toLocaleDateString())} - ${qpsResultsForPrint.length} QPS record${qpsResultsForPrint.length === 1 ? "" : "s"}</p>
        </header>
        <h2>Class Summary</h2>
        <table>
          <thead>
            <tr><th>Scholar</th><th>Date</th><th>Status</th><th>Score</th><th>Needs</th><th>Notes</th></tr>
          </thead>
          <tbody>${rowsHtml || `<tr><td colspan="6">No QPS records saved for this date range.</td></tr>`}</tbody>
        </table>
        ${detailCardsHtml || ""}
        </main>
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
              ? `<strong>Needs practice so far</strong><ul>${progress.missedQuestions.map((missed, index) => {
                const note = missedQuestionNote(progress, missed, index);
                return `<li>${escapeReportHtml(formatMissedContext(missed))}${escapeReportHtml(formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer))}${note ? `<br><em>Note: ${escapeReportHtml(note)}</em>` : ""}</li>`;
              }).join("")}</ul>`
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
                  .map((missed, index) => {
                    const note = missedQuestionNote(result, missed, index);
                    return `
                      <li>
                        ${escapeReportHtml(formatMissedContext(missed))}
                        ${escapeReportHtml(
                          formatMissedText(
                            missed.word || `Question ${missed.questionIndex ?? index + 1}`,
                            missed.incorrectSelections?.join(", "),
                            missed.correctAnswer,
                          ),
                        )}
                        ${note ? `<br><em>Note: ${escapeReportHtml(note)}</em>` : ""}
                      </li>
                    `;
                  })
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

  const saveSmallGroupPlanToHub = async (
    candidate: CurriculumNeedCandidate,
    recommendations: CurriculumRecommendation[],
    lessonSource?: SmallGroupLessonSource,
  ) => {
    const bestLesson = recommendations[0];

    if (!bestLesson) {
      setStatus("Choose a recommended lesson before saving a small-group plan to the Hub.");
      return;
    }

    const sourceText = lessonSource?.text.trim() || recommendations[0]?.sourceText?.trim() || "";

    if (isReadableLessonSourceText(sourceText, 8, 40)) {
      const targetMatch = smallGroupSourceTargetMatch(
        sourceText,
        candidate,
        bestLesson,
        curriculumRecommendationSubject,
      );

      if (!targetMatch.matches) {
        updateSmallGroupLessonSource(bestLesson.id, {
          analysis: undefined,
          analysisStatus: "mismatch",
          mismatchReason: targetMatch.reason,
          text: sourceText,
        });

        try {
          await saveCurriculumRecommendationNotMatch(candidate, bestLesson, targetMatch.reason);
          setStatus(`${bestLesson.lessonTitle} does not match ${candidate.need}. I saved that note and did not send it to the Hub plan folder.`);
        } catch (nextError) {
          setError(nextError instanceof Error ? nextError.message : "The not-a-match note could not be saved yet.");
          setStatus(targetMatch.reason);
        }

        return;
      }
    }

    try {
      setStatus("Saving small-group plan to the Hub Teacher Workspace...");
      const bundle = buildSmallGroupHubPlanResource(
        candidate,
        recommendations,
        curriculumRecommendationSubject,
        lessonSource,
      );
      await saveHubTeacherWorkspaceResource(bundle);

      setStatus(`Saved "${bundle.resource.title}" to Hub Teacher Workspace > ${bundle.folderTitle}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The plan could not be saved to the Hub yet.");
    }
  };

  const printCurriculumGroupPlan = (
    candidate: CurriculumNeedCandidate,
    recommendations: CurriculumRecommendation[],
    lessonSource?: SmallGroupLessonSource,
  ) => {
    if (lessonSource?.analysisStatus === "mismatch") {
      setStatus(lessonSource.mismatchReason || "This uploaded source does not match the selected target need, so I did not print a plan from it.");
      return;
    }

    const reportWindow = window.open("", "_blank");
    const sourceText = lessonSource?.text.trim() || recommendations[0]?.sourceText?.trim() || "";
    const sourceTitle = lessonSource?.fileName.trim() || recommendations[0]?.subjectLabel || "";
    const bestLesson = recommendations[0];
    const sourceAnalysis = lessonSource?.analysis ?? (
      isReadableLessonSourceText(sourceText, 8, 40)
        ? buildSmallGroupLessonAnalysis(candidate, bestLesson, curriculumRecommendationSubject, sourceText)
        : undefined
    );
    const objective = smallGroupPlanObjective(candidate, bestLesson, curriculumRecommendationSubject);
    const materials = sourceAnalysis?.materials ?? smallGroupMaterials(candidate, bestLesson, curriculumRecommendationSubject, sourceText);
    const planRows = sourceAnalysis
      ? smallGroupTeacherPlanRowsFromAnalysis(sourceAnalysis)
      : smallGroupTeacherPlanRows(candidate, bestLesson, curriculumRecommendationSubject, sourceText);
    const dataCheckItems = sourceAnalysis?.dataCheckItems ?? smallGroupDataCheckItems(candidate, curriculumRecommendationSubject);
    const sourceSummary = sourceAnalysis?.summary || (sourceText
      ? smallGroupUploadedLessonSummary(candidate, bestLesson, curriculumRecommendationSubject, sourceText)
      : "");
    const analyzedNotes = sourceAnalysis?.notes?.length
      ? `
        <section class="box">
          <h2>Lesson Source Highlights</h2>
          <ul>${sourceAnalysis.notes.map((note) => `<li>${escapeReportHtml(note)}</li>`).join("")}</ul>
        </section>
      `
      : "";
    const scholarItems = candidate.scholars.length
      ? candidate.scholars.map((scholar) => `<li>${escapeReportHtml(scholar)}</li>`).join("")
      : "<li>No roster names were attached to this need yet.</li>";
    const connectedLessonHtml = bestLesson ? `
      <section class="box">
        <p class="match">${escapeReportHtml(curriculumRecommendationMatchLabel(bestLesson, candidate))}</p>
        <h2>${escapeReportHtml(curriculumRecommendationLessonLabel(bestLesson))}</h2>
        <h3>${escapeReportHtml(bestLesson.lessonTitle || "UFLI lesson")}</h3>
        ${bestLesson.priorityStandard ? `<p><strong>Standard:</strong> ${escapeReportHtml(bestLesson.priorityStandard)}</p>` : ""}
        ${bestLesson.iCanStatement ? `<p><strong>I Can:</strong> ${escapeReportHtml(bestLesson.iCanStatement)}</p>` : ""}
        <p><strong>Why this lesson:</strong> ${escapeReportHtml(curriculumRecommendationReason(bestLesson, candidate))}</p>
      </section>
    ` : "";

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
          .box{break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:12px;margin:0 0 12px}
          table{width:100%;border-collapse:collapse;margin:10px 0 14px}
          th,td{border:1px solid #d8dee8;padding:8px;text-align:left;vertical-align:top;font-size:12px;line-height:1.35}
          th{background:#eef3f8;color:#24364c}
          ul{margin:8px 0 0;padding-left:18px}
          .lesson-card{break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:12px;margin:0 0 12px}
          .match{margin:0 0 6px;color:#6f5b2f;font-weight:700;text-transform:uppercase;font-size:11px;letter-spacing:.04em}
          .checklist li{margin-bottom:5px}
          @media print{body{margin:12mm}.lesson-card,.box,table{break-inside:avoid}.layout{grid-template-columns:190px 1fr}}
        </style>
      </head>
      <body>
        <h1>Small-Group UFLI Intervention Plan</h1>
        <p class="meta">${escapeReportHtml(activeReportLabel)} - ${escapeReportHtml(new Date().toLocaleDateString())}</p>
        <div class="layout">
          <aside>
            <h2>${escapeReportHtml(candidate.need)}</h2>
            <p>${escapeReportHtml(curriculumGroupReason(candidate))}</p>
            <h3>Scholars</h3>
            <ul>${scholarItems}</ul>
          </aside>
          <main>
            <h2>Teaching Target</h2>
            <section class="box">
              <p>${escapeReportHtml(objective)}</p>
            </section>
            ${connectedLessonHtml}
            ${sourceSummary ? `
              <section class="box">
                <h2>Uploaded Lesson Alignment</h2>
                <p>${escapeReportHtml(sourceSummary)}</p>
              </section>
            ` : ""}
            ${analyzedNotes}
            <h2>Materials</h2>
            <ul>${materials.map((material) => `<li>${escapeReportHtml(material)}</li>`).join("")}</ul>
            <h2>Teach It</h2>
            <table>
              <thead>
                <tr><th>Time</th><th>Part</th><th>Teacher Moves</th></tr>
              </thead>
              <tbody>
                ${planRows.map(([time, part, moves]) => `
                  <tr>
                    <td>${escapeReportHtml(time)}</td>
                    <td>${escapeReportHtml(part)}</td>
                    <td>${escapeReportHtml(moves)}</td>
                  </tr>
                `).join("")}
              </tbody>
            </table>
            <h2>Quick Data Check</h2>
            <ul class="checklist">${dataCheckItems.map((item) => `<li>${escapeReportHtml(item)}</li>`).join("")}</ul>
            ${sourceText && sourceTitle ? `<p class="meta">Source used: ${escapeReportHtml(sourceTitle)}</p>` : ""}
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
    lessonSource?: SmallGroupLessonSource,
  ) => {
    if (lessonSource?.analysisStatus === "mismatch") {
      setStatus(lessonSource.mismatchReason || "This uploaded source does not match the selected target need, so I did not print a family plan from it.");
      return;
    }

    const reportWindow = window.open("", "_blank");
    const bestLesson = recommendations[0];
    const sourceText = lessonSource?.text.trim() || recommendations[0]?.sourceText?.trim() || "";
    const sourceAnalysis = lessonSource?.analysis ?? (
      isReadableLessonSourceText(sourceText, 8, 40)
        ? buildSmallGroupLessonAnalysis(candidate, bestLesson, curriculumRecommendationSubject, sourceText)
        : undefined
    );
    const practice = sourceAnalysis
      ? {
        focus: sourceAnalysis.target,
        lookFor: sourceAnalysis.familyLookFor,
        prompt: sourceAnalysis.familyPrompt,
        steps: sourceAnalysis.familySteps,
      }
      : smallGroupFamilyPractice(candidate, bestLesson, curriculumRecommendationSubject);
    const sourceSummary = sourceAnalysis?.summary || (sourceText
      ? smallGroupUploadedLessonSummary(candidate, bestLesson, curriculumRecommendationSubject, sourceText)
      : "");

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
            <p>${escapeReportHtml(practice.focus)}</p>
            ${bestLesson ? `<p class="quiet">Connected classroom lesson: ${escapeReportHtml(curriculumRecommendationLessonLabel(bestLesson))}${bestLesson.lessonTitle ? ` - ${escapeReportHtml(bestLesson.lessonTitle)}` : ""}</p>` : ""}
          </section>

          <section class="steps">
            <h2>Try This At Home</h2>
            <ul>
              ${practice.steps.map((step) => `<li>${escapeReportHtml(step)}</li>`).join("")}
            </ul>
          </section>

          <section>
            <h2>What To Listen Or Look For</h2>
            <p>${escapeReportHtml(practice.lookFor)}</p>
            <p class="prompt">${escapeReportHtml(practice.prompt)}</p>
          </section>

          ${sourceSummary ? `
            <section>
              <h2>Classroom Connection</h2>
              <p>${escapeReportHtml(sourceSummary.replace(/^Uploaded source analyzed[:.]?\s*/i, ""))}</p>
            </section>
          ` : ""}

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
          <p className="eyebrow">UFLI Intervention Match</p>
          <h4>Plan From These Groups</h4>
        </div>
        <button
          className="teacher-control-button"
          disabled={!curriculumNeedCandidates.length || curriculumRecommendationStatus === "loading"}
          onClick={() => void fetchCurriculumRecommendations()}
          type="button"
        >
          {curriculumRecommendationStatus === "loading" ? "Finding..." : "Find UFLI Lessons"}
        </button>
      </div>
      <p className="pin-helper">
        Uses charted data, QPS, teacher observations, and game/assessment results to suggest UFLI intervention lessons for Skills small groups.
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
          Checked {curriculumRecommendationNeeds.length} UFLI search term{curriculumRecommendationNeeds.length === 1 ? "" : "s"} from the chart and small-group data.
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
                    href={UFLI_TOOLBOX_BASE_URL}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Open UFLI Toolbox
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
                        Open UFLI Toolbox
                      </a>
                    </article>
                  ))}
                </div>
              ) : (
                <p className="empty-results-message">
                  No UFLI lesson matched this need yet. Open a more specific Skills target, such as d, ch, or short a, for a tighter match.
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

        {duplicateTrackingInitialGroups.length ? (
          <div className="privacy-note">
            <strong>Duplicate whole-group initials:</strong> {duplicateTrackingInitialGroups.join("; ")}. Change one scholar's tracking initials below, like JRB, so whole-group misses match the right scholar.
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

                <details className="dashboard-collapsible-section">
                  <summary>
                    <span>
                      <strong>Scholar Activity Cards</strong>
                      <em>Open when you want to review individual work from these filters.</em>
                    </span>
                    <span>{dashboardStudentSummaries.length} scholar{dashboardStudentSummaries.length === 1 ? "" : "s"}</span>
                  </summary>
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
                </details>

                <details className="dashboard-collapsible-section struggle-board">
                  <summary>
                    <span>
                      <strong>Small-Group Needs</strong>
                      <em>Open to find UFLI lessons and make group plans.</em>
                    </span>
                    <span>{curriculumNeedCandidates.length} need{curriculumNeedCandidates.length === 1 ? "" : "s"}</span>
                  </summary>
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
                </details>

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
                          disabled={!curriculumNeedCandidates.length || selectedSmallGroupRecommendationStatus === "loading"}
                          onClick={() => void fetchCurriculumRecommendations(selectedSmallGroupNeed)}
                          type="button"
                        >
                          {selectedSmallGroupRecommendationStatus === "loading" ? "Finding..." : "Find UFLI Lessons"}
                        </button>
                      </div>
                      {selectedSmallGroupRecommendationStatus === "loading" ? (
                        <p className="pin-helper">Searching the UFLI intervention bank for this exact group need.</p>
                      ) : null}
                      {selectedSmallGroupRecommendationError ? (
                        <p className="teacher-message error">{selectedSmallGroupRecommendationError}</p>
                      ) : null}
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
                            const sharedNeedLabels = sharedCurriculumRecommendationNeedLabels(
                              recommendation,
                              selectedSmallGroupNeed,
                              curriculumNeedCandidates,
                            );

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
                                {sharedNeedLabels.length ? (
                                  <p><strong>Also fits:</strong> {sharedNeedLabels.join(", ")}</p>
                                ) : null}
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
                                    onClick={() => printFamilyPracticePlan(selectedSmallGroupNeed, [recommendation], lessonSource)}
                                    type="button"
                                  >
                                    Print Family Help
                                  </button>
                                  <button
                                    className="teacher-text-button"
                                    onClick={() => void saveSmallGroupPlanToHub(selectedSmallGroupNeed, [recommendation], lessonSource)}
                                    type="button"
                                  >
                                    Save to Hub
                                  </button>
                                  <label className="curriculum-source-upload-button">
                                    Upload Source
                                    <input
                                      accept=".txt,.md,.csv,.pdf,application/pdf,text/*"
                                      onChange={(event) => {
                                        void attachSmallGroupLessonSourceFile(
                                          selectedSmallGroupNeed,
                                          recommendation,
                                          event.currentTarget.files?.[0] ?? null,
                                        );
                                        event.currentTarget.value = "";
                                      }}
                                      type="file"
                                    />
                                  </label>
                                  <button
                                    className="teacher-text-button"
                                    disabled={!lessonSource.text.trim()}
                                    onClick={() => void analyzeSmallGroupLessonSource(selectedSmallGroupNeed, recommendation)}
                                    type="button"
                                  >
                                    Analyze Source
                                  </button>
                                </div>
                                {lessonSource.fileName || lessonSource.text ? (
                                  <div className="small-group-source-box">
                                    {lessonSource.fileName ? <small>Source: {lessonSource.fileName}</small> : null}
                                    {lessonSource.analysisStatus === "ready" ? (
                                      <small className="source-analysis-status ready">Analyzed source will shape the teacher and family print plans.</small>
                                    ) : lessonSource.analysisStatus === "mismatch" ? (
                                      <small className="source-analysis-status warning">{lessonSource.mismatchReason || "This uploaded source does not match the selected target need."}</small>
                                    ) : lessonSource.analysisStatus === "needs-text" ? (
                                      <small className="source-analysis-status warning">Readable lesson text is needed before this can make a stronger plan.</small>
                                    ) : (
                                      <small className="source-analysis-status">Click Analyze Source after uploading or editing source text.</small>
                                    )}
                                    <textarea
                                      onChange={(event) => updateSmallGroupLessonSource(recommendation.id, {
                                        analysis: undefined,
                                        analysisStatus: "none",
                                        mismatchReason: "",
                                        text: event.target.value,
                                      })}
                                      placeholder="Lesson source text will appear here when the upload can be read. You can edit it before printing."
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
                            {selectedSmallGroupRecommendationStatus === "success"
                              ? "No UFLI lesson matched this group yet."
                              : "Click Find UFLI Lessons to pull intervention lessons for this group."}
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
                  Newest evidence wins. Game attempts, QPS, and teacher observations all stay in the cell history.
                </p>
              </div>
              <button className="teacher-control-button secondary" onClick={printSkillsDataReport} type="button">
                Print Chart
              </button>
            </div>

            {dataReportView === "skills" ? (
              <section className="qps-report-panel">
                <div className="result-row-head">
                  <div>
                    <p className="eyebrow">QPS</p>
                    <h4>Quick Phonics Screener</h4>
                    <p className="pin-helper">
                      Teacher-run QPS sessions save as Skills evidence and stay in the history. This box only shows a small recent view.
                    </p>
                  </div>
                  <div className="small-group-popup-actions">
                    <a className="teacher-control-button secondary" href="/games/skills/qps-screener">
                      Open QPS
                    </a>
                    <button className="teacher-control-button secondary" onClick={() => void saveQpsSummaryToHub()} type="button">
                      Save to Hub
                    </button>
                    <button className="teacher-control-button secondary" onClick={printQpsSummaryReport} type="button">
                      Print QPS
                    </button>
                  </div>
                </div>
                <div className="qps-report-controls">
                  <label className="qps-compact-toggle">
                    <input
                      checked={qpsShowCurrentWeekOnly}
                      onChange={(event) => setQpsShowCurrentWeekOnly(event.target.checked)}
                      type="checkbox"
                    />
                    Show current week only
                  </label>
                  <label>
                    Print from
                    <input
                      onChange={(event) => setQpsPrintStartDate(event.target.value)}
                      type="date"
                      value={qpsPrintStartDate}
                    />
                  </label>
                  <label>
                    Print to
                    <input
                      onChange={(event) => setQpsPrintEndDate(event.target.value)}
                      type="date"
                      value={qpsPrintEndDate}
                    />
                  </label>
                  <button
                    className="teacher-text-button"
                    onClick={() => {
                      const range = qpsCurrentWeekRange();
                      setQpsPrintStartDate(range.start);
                      setQpsPrintEndDate(range.end);
                    }}
                    type="button"
                  >
                    This Week
                  </button>
                  <button
                    className="teacher-text-button"
                    onClick={() => {
                      setQpsPrintStartDate("");
                      setQpsPrintEndDate("");
                    }}
                    type="button"
                  >
                    All Dates
                  </button>
                </div>
                <p className="pin-helper">
                  Showing {qpsPanelResults.length} of {qpsPanelTotalCount} {qpsShowCurrentWeekOnly ? "current-week" : "saved"} QPS record{qpsPanelTotalCount === 1 ? "" : "s"}.
                </p>
                <div className="qps-report-list">
                  {qpsPanelResults.length ? qpsPanelResults.map((result) => {
                    const match = matchResult(result, reportScholars);
                    const completedAt = reportRecordDate(result);
                    return (
                      <article className="qps-report-row" key={`${reportRecordStatus(result)}-${result.id}`}>
                        <strong>{match.label}</strong>
                        <span>{completedAt ? completedAt.toLocaleDateString() : "Date pending"}</span>
                        <span>{reportRecordStatus(result)}</span>
                        <span>{result.score}/{result.totalQuestions}</span>
                        <em>{result.missedCount} need{result.missedCount === 1 ? "" : "s"}</em>
                      </article>
                    );
                  }) : (
                    <p className="empty-results-message">
                      {qpsReportRecords.length ? "No QPS records saved for this week." : "No QPS records saved yet."}
                    </p>
                  )}
                </div>
              </section>
            ) : null}

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
                <span className="qps">QPS</span>
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
                              className={`skills-data-cell ${cell.status} ${skillsDataCellSourceClass(cell)} ${skillsDataCellIsMuted(cell, skillsDataFocusMode) ? "is-filter-muted" : ""}`}
                              onClick={() => setSelectedSkillsDataCellKey(`${row.scholar.id}|${cell.target}`)}
                              title={`${row.scholar.firstName} ${cell.target}: ${skillsDataStatusLabel(cell.status)}`}
                              type="button"
                            >
                              {skillsDataCellMarker(cell)}
                            </button>
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
                const trackingInitialDraft = trackingInitialDrafts[scholar.id] ?? initialsForScholar(scholar);

                return (
                  <article className="roster-card" key={scholar.id}>
                    <button onClick={() => setSelectedScholarId(scholar.id)} type="button">
                      <span className="roster-initials" aria-hidden="true">{initialsForScholar(scholar)}</span>
                      <span>
                        <strong>{scholar.firstName} {scholar.lastName}</strong>
                        <small>{teacherLabelForEmail(scholar.teacherEmail)} - {scholarResults.length} result{scholarResults.length === 1 ? "" : "s"}</small>
                        {isTestScholar(scholar) ? (
                          <small>Test student - {scholar.includeInReports ? "showing in data" : "hidden from data"}</small>
                        ) : null}
                      </span>
                    </button>
                    <label className="roster-initials-badge-edit">
                      <span>Tracking initials</span>
                      <input
                        aria-label={`Whole-group tracking initials for ${scholar.firstName} ${scholar.lastName}`}
                        maxLength={3}
                        onChange={(event) => {
                          const nextInitials = cleanTrackingInitials(event.target.value);
                          setTrackingInitialDrafts((drafts) => ({
                            ...drafts,
                            [scholar.id]: nextInitials,
                          }));
                        }}
                        value={trackingInitialDraft}
                      />
                    </label>
                    <div className="roster-card-actions">
                      {trackingInitialDraft && trackingInitialDraft !== initialsForScholar(scholar) ? (
                        <button
                          className="teacher-text-button"
                          onClick={() => void saveScholarTrackingInitials(scholar, trackingInitialDraft)}
                          type="button"
                        >
                          Save Initials
                        </button>
                      ) : null}
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
                    </div>
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
                                <span>
                                  {formatMissedContext(missed)}
                                  {formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer)}
                                </span>
                                {missedQuestionNote(progress, missed, index) ? (
                                  <em className="missed-note">Note: {missedQuestionNote(progress, missed, index)}</em>
                                ) : null}
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
                        <span>
                          {formatMissedContext(firstMiss)}
                          {formatMissedText(result.word, result.incorrectSelection, result.correctAnswer)}
                        </span>
                        {firstMiss && missedQuestionNote(result, firstMiss, 0) ? (
                          <em className="missed-note">Note: {missedQuestionNote(result, firstMiss, 0)}</em>
                        ) : null}
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
                                <span>
                                  {formatMissedContext(missed)}
                                  {formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer)}
                                </span>
                                {missedQuestionNote(result, missed, index) ? (
                                  <em className="missed-note">Note: {missedQuestionNote(result, missed, index)}</em>
                                ) : null}
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
