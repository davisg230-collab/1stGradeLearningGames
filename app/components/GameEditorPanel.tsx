"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  firebaseConfig,
  isAuthorizedTeacherEmail,
  teacherLabelForEmail,
} from "../firebase-config";
import { listeningLearningGames, mathGames, skillsGames } from "../game-data";
import type { CardEdit } from "./TeacherEditProvider";

type FirebaseUser = {
  email: string | null;
};

type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
};

type FirestoreDocSnapshot = {
  data: () => Record<string, unknown> | undefined;
  exists: boolean;
  id: string;
};

type FirestoreQuerySnapshot = {
  docs: FirestoreDocSnapshot[];
};

type FirestoreDocRef = {
  collection: (path: string) => FirestoreCollectionRef;
  get: () => Promise<FirestoreDocSnapshot>;
  set: (
    data: Record<string, unknown>,
    options?: {merge?: boolean},
  ) => Promise<void>;
};

type FirestoreDb = {
  collection: (name: string) => FirestoreCollectionRef;
  settings: (settings: {
    ignoreUndefinedProperties: boolean;
  }) => void;
};
type FirebaseStorage = {
  ref: (path: string) => {
    delete: () => Promise<void>;
    put: (
      data: Blob,
      metadata?: { contentType?: string },
    ) => Promise<StorageSnapshot>;
  };
};

type GeneratedAudioResult = {
  audioKind: "googleTts";
  audioUrl: string;
  sourceText: string;
  storagePath: string;
};

type FirebaseFunctions = {
  httpsCallable: (
    name: string,
  ) => (
    data: Record<string, unknown>,
  ) => Promise<{ data: GeneratedAudioResult }>;
};

type FirebaseCompat = {
  apps: unknown[];
  auth: () => FirebaseAuth;
  firestore: (() => FirestoreDb) & {
    FieldValue: {
      serverTimestamp: () => unknown;
    };
  };
  functions?: () => FirebaseFunctions;
  initializeApp: (config: typeof firebaseConfig) => unknown;
  storage?: () => FirebaseStorage;
};

type FirebaseServices = {
  auth: FirebaseAuth;
  db: FirestoreDb;
  firebase: FirebaseCompat;
  functions: FirebaseFunctions | null;
  storage: FirebaseStorage | null;
};
declare global {
  interface Window {
    firebase?: FirebaseCompat;
  }
}

type Choice = [string, string] | [string, string, string];
type SpeakerPosition = "above" | "below" | "left" | "right";
type SpeakerAudioKind = "googleTts" | "teacherRecording";

type SpeakerButton = {
  audioKind: SpeakerAudioKind;
  audioText?: string;
  audioUrl?: string;
  enabled: boolean;
  id: string;
  label: string;
  position: SpeakerPosition;
  storagePath?: string;
  text: string;
};

type AnswerAudio = {
  audioKind: SpeakerAudioKind;
  audioSourceText?: string;
  audioText: string;
  audioUrl?: string;
  storagePath?: string;
};

type EditableLevel = Record<string, unknown> & {
  detail: string;
  icon: string;
  learningTarget?: string;
  lessonRange?: string;
  name: string;
  practiceLabel?: string;
};

type EditableQuestion = Record<string, unknown> & {
  answer: string;
  answerAudio?: Record<string, AnswerAudio>;
  answerReportLabels?: Record<string, string>;
  answerStyle?: "standard" | "listening-letters";
  choices: Choice[];
  correctAnswer?: string;  
  display?: string;
  id: string;
  mathVisualCount?: number;
  mathVisualEnd?: number;
  mathVisualHopCount?: number;
  mathVisualShowLandingNumber?: boolean;
  mathVisualShowPathSentence?: boolean;
  mathVisualObject?: string;
  mathVisualObjects?: string;
  mathVisualPartOne?: number;
  mathVisualPartTwo?: number;
  mathVisualSecondCount?: number;
  mathVisualColorOne?: string;
  mathVisualColorTwo?: string;
  mathVisualColorThree?: string;
  mathVisualEquationLeft?: string;
  mathVisualEquationLeftColor?: string;
  mathVisualEquationLeftCount?: number;
  mathVisualEquationLeftModel?: string;
  mathVisualEquationMode?: string;
  mathVisualEquationOperator?: string;
  mathVisualEquationRight?: string;
  mathVisualEquationRightColor?: string;
  mathVisualEquationRightCount?: number;
  mathVisualEquationRightModel?: string;
  mathVisualGraphCategoryHeader?: string;
  mathVisualGraphTotalLabel?: string;
  mathVisualGraphTitle?: string;
  mathVisualLayout?: string;
  mathVisualLabels?: string;
  mathVisualValues?: string;
  mathVisualShadeCount?: number;
  mathVisualCircleCount?: number;
  mathVisualCrossOutCount?: number;
  mathVisualGroupSize?: number;
  mathVisualShowNumbers?: boolean;
  mathVisualShowTotals?: boolean;
  mathVisualGraphShowNumbers?: boolean;
  mathVisualType?: string;
  questionImageAlt?: string;
  questionImageStoragePath?: string;
  questionImageUrl?: string;
  prompt: string;
  promptSpeak?: string;
  requiresSoundAudio?: boolean;
  requiresTargetAudio?: boolean;
  skill?: string;
  speak?: string;
  speakerButtons?: SpeakerButton[];
  spokenDirections?: string;
  spokenTarget?: string;
  soundsSpeech?: string;
  type?: string;
  word?: string;
  zone: number;
};

type EditableGame = {
  content: {
    levels: EditableLevel[];
    questions: EditableQuestion[];
    schemaVersion: 1;
    supplementalQuestions: EditableQuestion[];
    unitTitle: string;
    zoneEncouragements: string[];
  };
  draftVersion?: string;
  gameId: string;
  publishedVersion?: string;
  schemaVersion: 1;
  subject: "ckla" | "ckla-listening-learning" | "math";
  tileDescription: string;
  tileIcon: string;
  title: string;
  unitSlug: string;
};

type RecordingDraft = {
  blob: Blob;
  url: string;
};

const GAME_COLLECTION = "gameHubGameDefinitions";

function unitNumberForGameId(gameId: string) {
  if (gameId === "unit1-zone1-sound-safari") {
    return 1;
  }

  const listeningLearningMatch =
    gameId.match(/^ckla-listening-learning-unit-(\d+)$/);

  if (listeningLearningMatch) {
    return Number(listeningLearningMatch[1]);
  }

  const mathMatch = gameId.match(/^eureka-math-module-(\d+)$/);

  if (mathMatch) {
    return Number(mathMatch[1]);
  }

  const skillsMatch = gameId.match(/^ckla-unit-(\d+)-/);
  return skillsMatch ? Number(skillsMatch[1]) : 0;
}

function isListeningLearningGame(gameId: string) {
  return gameId.startsWith("ckla-listening-learning-unit-");
}

function isMathGame(gameId: string) {
  return gameId.startsWith("eureka-math-module-");
}

function cardKeyForGameId(gameId: string) {
  const unitNumber = unitNumberForGameId(gameId);

  if (!unitNumber) {
    return "";
  }

  if (isMathGame(gameId)) {
    return `Eureka Math:module-${unitNumber}`;
  }

  return isListeningLearningGame(gameId)
    ? `CKLA Listening & Learning:unit-${unitNumber}`
    : `CKLA Skills:unit-${unitNumber}`;
}

function baseCardForGameId(gameId: string) {
  const unitNumber = unitNumberForGameId(gameId);
  const cards = isMathGame(gameId)
    ? mathGames
    : isListeningLearningGame(gameId)
      ? listeningLearningGames
      : skillsGames;

  return cards.find((game) => game.unitNumber === unitNumber);
}
const FIREBASE_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage-compat.js",
];
const SEED_GAME_FILES = [
  {
    gameId: "unit1-zone1-sound-safari",
    path: "/games/editable-content/unit1-zone1-sound-safari.json",
  },
  {
    gameId: "ckla-unit-2-long-vowel-quest",
    path: "/games/editable-content/ckla-unit-2-long-vowel-quest.json",
  },
  ...[3, 4, 5, 6, 7].map((unit) => ({
    gameId: `ckla-unit-${unit}-skills-quest`,
    path: `/games/editable-content/ckla-unit-${unit}-skills-quest.json`,
  })),
  ...Array.from({length: 11}, (_, index) => index + 1).map(
    (unit) => ({
      gameId: `ckla-listening-learning-unit-${unit}`,
      path:
        `/games/editable-content/`
        + `ckla-listening-learning-unit-${unit}.json`,
    }),
  ),
  ...Array.from({length: 6}, (_, index) => index + 1).map(
    (moduleNumber) => ({
      gameId: `eureka-math-module-${moduleNumber}`,
      path:
        `/games/editable-content/`
        + `eureka-math-module-${moduleNumber}.json`,
    }),
  ),
];

let firebasePromise: Promise<FirebaseServices> | null = null;

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function normalizeId(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 70);
}

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function normalizeChoice(value: unknown): Choice | null {
  if (Array.isArray(value)) {
    if (value.length < 2) {
      return null;
    }

    const choiceValue = asText(value[0]).trim();
    const label = asText(value[1]).trim();

    if (!choiceValue || !label) {
      return null;
    }

    return typeof value[2] === "string"
      ? [choiceValue, label, value[2]]
      : [choiceValue, label];
  }

  if (value && typeof value === "object") {
    const raw = value as Record<string, unknown>;
    const choiceValue = asText(raw.value).trim();
    const label = asText(raw.label).trim();
    const image = asText(raw.image).trim();

    if (!choiceValue || !label) {
      return null;
    }

    return image
      ? [choiceValue, label, image]
      : [choiceValue, label];
  }

  return null;
}

function normalizeSpeakerPosition(value: unknown): SpeakerPosition {
  return value === "above" || value === "below" || value === "left" || value === "right"
    ? value
    : "left";
}

function normalizeSpeakerButton(
  value: unknown,
  index: number,
): SpeakerButton | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const label = asText(raw.label, "Read").trim();
  const text = asText(raw.text).trim();

  if (!label || (!text && !raw.audioUrl)) {
    return null;
  }

  return {
    audioKind:
      raw.audioKind === "teacherRecording"
        ? "teacherRecording"
        : "googleTts",
    audioText: asText(raw.audioText).trim() || undefined,
    audioUrl: asText(raw.audioUrl).trim() || undefined,
    enabled: raw.enabled !== false,
    id:
      asText(raw.id, `speaker-${index + 1}`).trim() ||
      `speaker-${index + 1}`,
    label,
    position: normalizeSpeakerPosition(raw.position),
    storagePath: asText(raw.storagePath).trim() || undefined,
    text,
  };
}

function normalizeAnswerAudio(value: unknown): Record<string, AnswerAudio> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  const result: Record<string, AnswerAudio> = {};

  for (const [choiceValue, entry] of Object.entries(
    value as Record<string, unknown>,
  )) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      continue;
    }

    const raw = entry as Record<string, unknown>;
    const audioText = asText(raw.audioText).trim();
    const audioUrl = asText(raw.audioUrl).trim();
    const storagePath = asText(raw.storagePath).trim();

    if (!audioText && !audioUrl) {
      continue;
    }

    result[choiceValue] = {
      audioKind:
        raw.audioKind === "teacherRecording"
          ? "teacherRecording"
          : "googleTts",
      audioSourceText:
        asText(raw.audioSourceText).trim() || undefined,
      audioText,
      audioUrl: audioUrl || undefined,
      storagePath: storagePath || undefined,
    };
  }

  return result;
}

function normalizeQuestion(
  value: unknown,
  index: number,
  levelCount: number,
): EditableQuestion | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const zone = Number(raw.zone);
  const answer = asText(raw.answer || raw.correctAnswer).trim();
  const choices = Array.isArray(raw.choices)
    ? raw.choices
        .map(normalizeChoice)
        .filter((choice): choice is Choice => Boolean(choice))
    : [];

  if (!Number.isInteger(zone) || zone < 0 || zone >= levelCount) {
    return null;
  }

  if (!asText(raw.prompt).trim() || !answer || choices.length < 2) {
    return null;
  }

  const question = clone(raw) as EditableQuestion;
  question.answer = answer;
  question.choices = choices;
  question.correctAnswer = asText(
    raw.correctAnswer || answer,
    answer,
  ).trim();
  question.id =
    asText(raw.id, `question-${index + 1}`).trim() ||
    `question-${index + 1}`;
  question.prompt = asText(raw.prompt).trim();
  question.zone = zone;

  const answerAudio = normalizeAnswerAudio(raw.answerAudio);

  if (Object.keys(answerAudio).length) {
    question.answerAudio = answerAudio;
  } else {
    delete question.answerAudio;
  }

  if (Array.isArray(raw.speakerButtons)) {
    const speakerButtons = raw.speakerButtons
        .map(normalizeSpeakerButton)
        .filter((button): button is SpeakerButton => Boolean(button));

    if (speakerButtons.length) {
      question.speakerButtons = speakerButtons;
    }
  }

  return question;
}

function normalizeLevel(value: unknown, index: number): EditableLevel {
  const raw =
    value && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

  return {
    ...clone(raw),
    detail: asText(raw.detail, "Practice this level.").trim(),
    icon: asText(raw.icon, "star").trim(),
    learningTarget: asText(raw.learningTarget).trim(),
    lessonRange: asText(raw.lessonRange).trim(),
    name: asText(raw.name, `Level ${index + 1}`).trim(),
    practiceLabel: asText(raw.practiceLabel).trim(),
  };
}

function normalizeGame(value: unknown): EditableGame | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const raw = value as Record<string, unknown>;
  const rawContent =
    raw.content && typeof raw.content === "object" && !Array.isArray(raw.content)
      ? (raw.content as Record<string, unknown>)
      : {};
  const rawLevels = Array.isArray(rawContent.levels) ? rawContent.levels : [];
  const levels = rawLevels.map(normalizeLevel);
  const questions = Array.isArray(rawContent.questions)
    ? rawContent.questions
        .map((question, index) => normalizeQuestion(question, index, levels.length))
        .filter((question): question is EditableQuestion => Boolean(question))
    : [];
  const supplementalQuestions = Array.isArray(rawContent.supplementalQuestions)
    ? rawContent.supplementalQuestions
        .map((question, index) => normalizeQuestion(question, index, levels.length))
        .filter((question): question is EditableQuestion => Boolean(question))
    : [];

  const gameId = normalizeId(asText(raw.gameId));

  if (!gameId || !levels.length) {
    return null;
  }

  return {
    content: {
      levels,
      questions,
      schemaVersion: 1,
      supplementalQuestions,
      unitTitle: asText(rawContent.unitTitle, asText(raw.title, gameId)).trim(),
zoneEncouragements: Array.isArray(rawContent.zoneEncouragements)
  ? rawContent.zoneEncouragements.map((item) =>
      Array.isArray(item)
        ? item.filter((message): message is string => typeof message === "string")
        : typeof item === "string"
          ? [item]
          : [],
    )
  : rawContent.zoneEncouragements &&
      typeof rawContent.zoneEncouragements === "object"
    ? Object.entries(
        rawContent.zoneEncouragements as Record<string, unknown>,
      )
        .sort(([firstKey], [secondKey]) => Number(firstKey) - Number(secondKey))
        .map(([, item]) =>
          Array.isArray(item)
            ? item.filter(
                (message): message is string => typeof message === "string",
              )
            : typeof item === "string"
              ? [item]
              : [],
        )
    : [],    },
    draftVersion: asText(raw.draftVersion).trim() || undefined,
    gameId,
    publishedVersion: asText(raw.publishedVersion).trim() || undefined,
    schemaVersion: 1,
    subject: raw.subject === "math" ? "math" : raw.subject === "ckla-listening-learning" ? "ckla-listening-learning" : "ckla",
    tileDescription: asText(raw.tileDescription).trim(),
    tileIcon: asText(raw.tileIcon).trim(),
    title: asText(raw.title, gameId).trim(),
    unitSlug: normalizeId(asText(raw.unitSlug, gameId)),
  };
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);

    if (existing) {
      if (existing.dataset.loaded === "true" || existing.dataset.ready === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Could not load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
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
  firebasePromise ??= Promise.all(FIREBASE_SCRIPTS.map(loadScript)).then(() => {
    const firebase = window.firebase;

    if (!firebase) {
      throw new Error("Firebase did not load.");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    const db = firebase.firestore();

    return {
      auth: firebase.auth(),
      db,
      firebase,      
      functions:
        typeof firebase.functions === "function"
          ? firebase.functions()
          : null,
      storage: typeof firebase.storage === "function" ? firebase.storage() : null,
    };
  });

  return firebasePromise;
}

async function signedInTeacher(services: FirebaseServices) {
  const user =
    services.auth.currentUser ??
    (await new Promise<FirebaseUser | null>((resolve) => {
      const unsubscribe = services.auth.onAuthStateChanged((nextUser) => {
        unsubscribe();
        resolve(nextUser);
      });
    }));
  const email = user?.email?.trim().toLowerCase() ?? "";

  if (!isAuthorizedTeacherEmail(email)) {
    throw new Error("Sign in with an authorized teacher Google account first.");
  }

  return email;
}

function versionContent(game: EditableGame) {
  const firestoreQuestion = (question: EditableQuestion) => ({
    ...question,
    choices: question.choices.map((choice) => ({
      value: choice[0],
      label: choice[1],
      ...(choice[2] ? {image: choice[2]} : {}),
    })),
  });

  const content = {
    levels: game.content.levels,
    questions: game.content.questions.map(firestoreQuestion),
    schemaVersion: 1,
    supplementalQuestions:
      game.content.supplementalQuestions.map(firestoreQuestion),
    unitTitle: game.content.unitTitle || game.title,
    zoneEncouragements: Object.fromEntries(
      game.content.zoneEncouragements.map(
        (encouragements, index) => [
          String(index),
          encouragements,
        ],
      ),
    ),
  };

  return JSON.parse(JSON.stringify(content));
}

function deriveSpeakerButtons(question: EditableQuestion): SpeakerButton[] {
  if (Array.isArray(question.speakerButtons)) {
    return question.speakerButtons;
  }

  const buttons: SpeakerButton[] = [];
  const promptText = question.promptSpeak || question.spokenDirections || question.prompt;

  if (promptText) {
    buttons.push({
      audioKind: "googleTts",
      enabled: true,
      id: "read-directions",
      label: "Read directions",
      position: "left",
      text: promptText,
    });
  }

  if (question.requiresSoundAudio && question.soundsSpeech) {
    buttons.push({
      audioKind: "googleTts",
      enabled: true,
      id: "hear-sounds",
      label: "Hear sounds",
      position: "below",
      text: question.soundsSpeech,
    });
  } else if (question.requiresTargetAudio && question.spokenTarget) {
    buttons.push({
      audioKind: "googleTts",
      enabled: true,
      id: "hear-word",
      label: "Hear word",
      position: "below",
      text: question.spokenTarget,
    });
  } else if (question.speak) {
    buttons.push({
      audioKind: "googleTts",
      enabled: true,
      id: "hear-word",
      label: "Hear word",
      position: "below",
      text: question.speak,
    });
  }

  return buttons;
}

function blankQuestion(zone: number): EditableQuestion {
  return {
    answer: "yes",
    choices: [
      ["yes", "yes"],
      ["no", "no"],
    ],
    correctAnswer: "yes",
    id: makeId("question"),
    prompt: "Choose the correct answer.",
    skill: "Practice",
    type: "custom",
    word: "practice",
    zone,
  };
}

function blankGame(): EditableGame {
  const id = makeId("ckla-unit");

  return {
    content: {
      levels: [
        {
          detail: "New level",
          icon: "star",
          learningTarget: "",
          lessonRange: "",
          name: "New Level",
          practiceLabel: "",
        },
      ],
      questions: [blankQuestion(0)],
      schemaVersion: 1,
      supplementalQuestions: [],
      unitTitle: "New CKLA Unit",
      zoneEncouragements: [],
    },
    gameId: id,
    publishedVersion: "",
    schemaVersion: 1,
    subject: "ckla",
    tileDescription: "Build and practice skills and levels.",
    tileIcon: "🎮",
    title: "New CKLA Unit",
    unitSlug: id,
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function normalizeSpeechKey(text: string) {
  return text.replace(/_+/g, " blank ").replace(/\s+/g, " ").trim();
}

function mathVisualNumber(
  value: unknown,
  fallback = 0,
  maximum = 100,
) {
  const numberValue =
    typeof value === "number"
      ? value
      : Number(value);

  if (!Number.isFinite(numberValue)) {
    return fallback;
  }

  return Math.max(
    0,
    Math.min(maximum, Math.round(numberValue)),
  );
}

function MathVisualPreview({
  question,
}: {
  question: EditableQuestion;
}) {
  const visualType =
    typeof question.mathVisualType === "string"
      ? question.mathVisualType
      : "none";

  if (visualType === "none" || !visualType) {
    return null;
  }

  const count = mathVisualNumber(
    question.mathVisualCount,
    5,
    100,
  );
  const objectStyle =
    question.mathVisualObject === "cubes"
      ? "cubes"
      : "circles";
  const visualObjectSymbols: Record<string, string> = {
    apples: "\uD83C\uDF4E",
    backpacks: "\uD83C\uDF92",
    bananas: "\uD83C\uDF4C",
    birds: "\uD83D\uDC26",
    books: "\uD83D\uDCD6",
    cats: "\uD83D\uDC31",
    cookies: "\uD83C\uDF6A",
    crayons: "\uD83D\uDD8D",
    dogs: "\uD83D\uDC36",
    fish: "\uD83D\uDC1F",
    pencils: "\u270E",
    pizza: "\uD83C\uDF55",
    bears: "\uD83D\uDC3B",
    circles: "\u25CF",
    cubes: "\u25A0",
    diamonds: "\u25C6",
    hearts: "\u2665",
    hexagons: "\u2B22",
    squares: "\u25A0",
    stars: "\u2605",
    triangles: "\u25B2",
  };
  const visualObjectSymbol =
    visualObjectSymbols[question.mathVisualObject ?? ""];

  const shellStyle = {
    background: "#fffdf8",
    border: "2px solid #eadfce",
    borderRadius: "20px",
    margin: "16px auto",
    maxWidth: "620px",
    padding: "20px",
  };

  if (visualType === "number-path") {
    const pathEnd = Math.max(
      2,
      mathVisualNumber(question.mathVisualEnd, 10, 30),
    );
    const start = Math.max(
      1,
      Math.min(
        pathEnd,
        mathVisualNumber(question.mathVisualCount, 4, 30),
      ),
    );
    const requestedHops = mathVisualNumber(
      question.mathVisualHopCount,
      3,
      20,
    );
    const hops = Math.min(
      requestedHops,
      Math.max(0, pathEnd - start),
    );
    const finish = start + hops;
    const showLandingNumber = question.mathVisualShowLandingNumber !== false;
    const showPathSentence = question.mathVisualShowPathSentence !== false;
    const cellWidth = 46;
    const svgWidth = Math.max(460, pathEnd * cellWidth);
    const numberCenter = (number: number) =>
      ((number - 1) * cellWidth) + (cellWidth / 2);

    return (
      <div
        aria-label={`Number path from 1 to ${pathEnd}, starting at ${start} and making ${hops} hops to ${finish}`}
        role="img"
        style={{
          ...shellStyle,
          maxWidth: "760px",
          overflowX: "auto",
        }}
      >
        <div
          style={{
            margin: "0 auto",
            minWidth: `${svgWidth}px`,
            paddingTop: "62px",
            position: "relative",
            width: `${svgWidth}px`,
          }}
        >
          <svg
            aria-hidden="true"
            height="72"
            style={{
              left: 0,
              overflow: "visible",
              position: "absolute",
              top: 0,
            }}
            viewBox={`0 0 ${svgWidth} 72`}
            width={svgWidth}
          >
            <defs>
              <marker
                id="math-path-arrow-editor"
                markerHeight="7"
                markerWidth="7"
                orient="auto"
                refX="6"
                refY="3.5"
              >
                <path
                  d="M0,0 L7,3.5 L0,7 z"
                  fill="#7a4cc2"
                />
              </marker>
            </defs>

            {Array.from({length: hops}, (_, index) => {
              const from = start + index;
              const x1 = numberCenter(from);
              const x2 = numberCenter(from + 1);
              const middle = (x1 + x2) / 2;

              return (
                <path
                  d={`M ${x1} 60 Q ${middle} 8 ${x2} 60`}
                  fill="none"
                  key={from}
                  markerEnd={
                    index === hops - 1
                      ? "url(#math-path-arrow-editor)"
                      : undefined
                  }
                  stroke="#7a4cc2"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              );
            })}
          </svg>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                `repeat(${pathEnd}, ${cellWidth}px)`,
            }}
          >
            {Array.from(
              {length: pathEnd},
              (_, index) => {
                const number = index + 1;
                const isStart = number === start;
                const isFinish = number === finish;
                const isTraveled =
                  number >= start && number <= finish;

                return (
                  <div
                    key={number}
                    style={{
                      alignItems: "center",
                      background: isTraveled
                        ? "#efe4ff"
                        : "#ffffff",
                      borderBottom: "3px solid #354b63",
                      borderLeft: "3px solid #354b63",
                      borderTop: "3px solid #354b63",
                      boxShadow:
                        isStart || isFinish
                          ? "inset 0 0 0 4px #7a4cc2"
                          : "none",
                      color: "#25384c",
                      display: "flex",
                      fontSize: "22px",
                      fontWeight: 900,
                      height: "54px",
                      justifyContent: "center",
                      position: "relative",
                      borderRight:
                        number === pathEnd
                          ? "3px solid #354b63"
                          : undefined,
                    }}
                  >
                    {showLandingNumber && isFinish ? null : number}
                  </div>
                );
              },
            )}
          </div>

          {showPathSentence ? (
            <p
              style={{
                color: "#596b7d",
                fontWeight: 800,
                margin: "12px 0 0",
                textAlign: "center",
              }}
            >
              Start at {start}. Count on {hops} to reach {finish}.
            </p>
          ) : null}
        </div>
      </div>
    );
  }
  if (visualType === "categorical-number-path-graph") {
    const labels = (
      typeof question.mathVisualLabels === "string"
        ? question.mathVisualLabels
        : "Category A,Category B"
    )
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 3);
    const graphLabels = labels.length >= 2
      ? labels
      : ["Category A", "Category B"];
    const rawValues = (
      typeof question.mathVisualValues === "string"
        ? question.mathVisualValues
        : "3,5"
    )
      .split(",")
      .map((value) => mathVisualNumber(value, 0, 30));
    const maximum = Math.max(
      1,
      mathVisualNumber(question.mathVisualEnd, 10, 30),
    );
    const values = graphLabels.map(
      (_, index) => Math.min(maximum, rawValues[index] ?? 0),
    );
    const colors = [
      question.mathVisualColorOne || "#70b7ff",
      question.mathVisualColorTwo || "#ff8396",
      question.mathVisualColorThree || "#ffc857",
    ];
    const showTotals = question.mathVisualShowTotals !== false;
    const showNumbers = question.mathVisualGraphShowNumbers !== false;
    const categoryHeader = question.mathVisualGraphCategoryHeader?.trim() || "Category";
    const totalLabel = question.mathVisualGraphTotalLabel?.trim() || "Total";
    const gridTemplateColumns = `minmax(110px, 1fr) repeat(${maximum}, 30px)${showTotals ? " 54px" : ""}`;

    return (
      <div
        aria-label={`${question.mathVisualGraphTitle || "Categorical graph"} showing ${graphLabels.join(", ")}`}
        role="img"
        style={{
          ...shellStyle,
          maxWidth: "860px",
          overflowX: "auto",
        }}
      >
        {question.mathVisualGraphTitle ? (
          <h4
            style={{
              color: "#354b63",
              fontSize: "22px",
              fontWeight: 900,
              margin: "0 0 16px",
              textAlign: "center",
            }}
          >
            {question.mathVisualGraphTitle}
          </h4>
        ) : null}
        <div
          style={{
            display: "grid",
            gridTemplateColumns,
            minWidth: `${110 + (maximum * 30) + (showTotals ? 54 : 0)}px`,
          }}
        >
          <strong style={{background: "#e9f4ff", padding: "8px"}}>
            {categoryHeader}
          </strong>
          {Array.from({length: maximum}, (_, index) => (
            <strong
              key={`number-${index + 1}`}
              style={{
                background: "#e9f4ff",
                padding: "8px 2px",
                textAlign: "center",
              }}
            >
              {showNumbers ? index + 1 : null}
            </strong>
          ))}
          {showTotals ? (
            <strong style={{background: "#e9f4ff", padding: "8px"}}>
              {totalLabel}
            </strong>
          ) : null}
          {graphLabels.flatMap((label, rowIndex) => [
            <strong key={`${label}-label`} style={{padding: "8px"}}>
              {label}
            </strong>,
            ...Array.from({length: maximum}, (_, cellIndex) => (
              <span
                aria-label={`${label} ${cellIndex + 1}: ${cellIndex < values[rowIndex] ? "filled" : "empty"}`}
                key={`${label}-${cellIndex}`}
                style={{
                  background: cellIndex < values[rowIndex]
                    ? colors[rowIndex]
                    : "#ffffff",
                  border: "2px solid #354b63",
                  height: "28px",
                  margin: "1px",
                  width: "28px",
                }}
              />
            )),
            ...(showTotals
              ? [
                <strong key={`${label}-total`} style={{padding: "8px", textAlign: "center"}}>
                  {values[rowIndex]}
                </strong>,
              ]
              : []),
          ])}
        </div>
      </div>
    );
  }

  if (visualType === "equation-comparison") {
    const leftExpression =
      question.mathVisualEquationLeft?.trim() || "3 + 2";
    const rightExpression =
      question.mathVisualEquationRight?.trim() || "5";
    const mode = question.mathVisualEquationMode === "missing-symbol"
      ? "missing-symbol"
      : "true-false";
    const operator = ["<", "=", ">"].includes(
      question.mathVisualEquationOperator || "",
    )
      ? question.mathVisualEquationOperator
      : "=";
    const displayOperator = mode === "missing-symbol" ? "?" : operator;
    const model = (
      modelType: string | undefined,
      amount: number | undefined,
      color: string,
      label: string,
    ) => {
      if (!modelType || modelType === "none") return null;
      const count = mathVisualNumber(amount, 0, 30);
      const cellCount = modelType === "ten-frame"
        ? 10
        : Math.max(1, count);
      return (
        <div
          aria-label={`${label} visual model with ${count}`}
          style={{
            display: "grid",
            gap: "5px",
            gridTemplateColumns: modelType === "ten-frame"
              ? "repeat(5, 24px)"
              : "repeat(auto-fit, 24px)",
            justifyContent: "center",
            marginTop: "10px",
          }}
        >
          {Array.from({length: cellCount}, (_, index) => (
            <span
              aria-hidden="true"
              key={index}
              style={{
                background: index < count ? color : "#ffffff",
                border: "2px solid #354b63",
                borderRadius: modelType === "counters" ? "50%" : "5px",
                height: "22px",
                width: "22px",
              }}
            />
          ))}
        </div>
      );
    };

    return (
      <div
        aria-label={`Equation ${leftExpression} ${displayOperator} ${rightExpression}`}
        role="img"
        style={{...shellStyle, maxWidth: "760px"}}
      >
        <div
          style={{
            alignItems: "center",
            display: "grid",
            gap: "16px",
            gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr)",
          }}
        >
          <div style={{textAlign: "center"}}>
            <strong style={{color: "#354b63", fontSize: "24px"}}>
              {leftExpression}
            </strong>
            {model(
              question.mathVisualEquationLeftModel,
              question.mathVisualEquationLeftCount,
              question.mathVisualEquationLeftColor || "#70b7ff",
              "Left",
            )}
          </div>
          <strong style={{color: "#7a4cc2", fontSize: "34px"}}>
            {displayOperator}
          </strong>
          <div style={{textAlign: "center"}}>
            <strong style={{color: "#354b63", fontSize: "24px"}}>
              {rightExpression}
            </strong>
            {model(
              question.mathVisualEquationRightModel,
              question.mathVisualEquationRightCount,
              question.mathVisualEquationRightColor || "#ff8396",
              "Right",
            )}
          </div>
        </div>
        <p style={{color: "#596b7d", fontWeight: 800, margin: "16px 0 0", textAlign: "center"}}>
          {mode === "missing-symbol" ? "Which symbol belongs?" : "Is the equation true or false?"}
        </p>
      </div>
    );
  }

  if (visualType === "number-bond") {
    const partOne = mathVisualNumber(
      question.mathVisualPartOne,
      Math.max(0, count - 2),
      100,
    );
    const partTwo = mathVisualNumber(
      question.mathVisualPartTwo,
      Math.max(0, count - partOne),
      100,
    );

    return (
      <div
        aria-label={`Number bond with whole ${count}, parts ${partOne} and ${partTwo}`}
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          <div
            style={{
              alignItems: "center",
              background: "#ffe59a",
              border: "3px solid #354b63",
              borderRadius: "50%",
              display: "flex",
              fontSize: "28px",
              fontWeight: 900,
              height: "78px",
              justifyContent: "center",
              width: "78px",
            }}
          >
            {count}
          </div>

          <div
            aria-hidden="true"
            style={{
              fontSize: "30px",
              fontWeight: 900,
            }}
          >
            ↙ ↘
          </div>

          <div
            style={{
              display: "flex",
              gap: "64px",
            }}
          >
            {[partOne, partTwo].map((part, index) => (
              <div
                key={`${part}-${index}`}
                style={{
                  alignItems: "center",
                  background:
                    index === 0 ? "#bde4ff" : "#ffd1dc",
                  border: "3px solid #354b63",
                  borderRadius: "50%",
                  display: "flex",
                  fontSize: "24px",
                  fontWeight: 900,
                  height: "68px",
                  justifyContent: "center",
                  width: "68px",
                }}
              >
                {part}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (visualType === "two-groups") {
    const secondCount = mathVisualNumber(
      question.mathVisualSecondCount,
      3,
      50,
    );
    const colorOne =
      typeof question.mathVisualColorOne === "string"
        ? question.mathVisualColorOne
        : "#70b7ff";
    const colorTwo =
      typeof question.mathVisualColorTwo === "string"
        ? question.mathVisualColorTwo
        : "#ff8396";
    const object =
      typeof question.mathVisualObject === "string"
        ? question.mathVisualObject
        : "circles";
    const symbols: Record<string, string> = {
      diamonds: "\u25C6",
      hearts: "\u2665",
      hexagons: "\u2B22",
      squares: "\u25A0",
      triangles: "\u25B2",
      apples: "🍎",
      backpacks: "\uD83C\uDF92",
      bananas: "\uD83C\uDF4C",
      birds: "\uD83D\uDC26",
      books: "\uD83D\uDCD6",
      cats: "\uD83D\uDC31",
      cookies: "\uD83C\uDF6A",
      crayons: "\uD83D\uDD8D",
      dogs: "\uD83D\uDC36",
      fish: "\uD83D\uDC1F",
      pencils: "\u270E",
      pizza: "\uD83C\uDF55",
      bears: "🧸",
      stars: "★",
    };
    const symbol = symbols[object] ?? "";
    const isCube = object === "cubes";
    const showTotals = question.mathVisualShowTotals !== false;

    const group = (
      amount: number,
      color: string,
      label: string,
    ) => (
      <div style={{flex: "1 1 220px"}}>
        <p
          style={{
            color: "#596b7d",
            fontWeight: 900,
            textAlign: "center",
          }}
        >
          {label}: {amount}
        </p>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "10px",
            justifyContent: "center",
          }}
        >
          {Array.from({length: amount}, (_, index) => (
            <span
              aria-hidden="true"
              key={index}
              style={{
                alignItems: "center",
                background:
                  symbol ? "transparent" : color,
                border:
                  symbol ? "none" : "3px solid #354b63",
                borderRadius: isCube ? "9px" : "50%",
                boxShadow:
                  isCube
                    ? "inset -6px -6px 0 rgba(0,0,0,.12)"
                    : "none",
                color,
                display: "flex",
                fontSize: symbol ? "42px" : "0",
                height: "52px",
                justifyContent: "center",
                textShadow:
                  symbol === "★"
                    ? "1px 1px 0 #354b63"
                    : "none",
                width: "52px",
              }}
            >
              {symbol}
            </span>
          ))}
        </div>
      </div>
    );

    return (
      <div
        aria-label={`Two groups showing ${count} and ${secondCount}`}
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "28px",
            justifyContent: "center",
          }}
        >
          {group(count, colorOne, "Part 1")}
          {group(secondCount, colorTwo, "Part 2")}
        </div>
        {showTotals ? (
          <p
            style={{
              color: "#354b63",
              fontSize: "22px",
              fontWeight: 900,
              margin: "20px 0 0",
              textAlign: "center",
            }}
          >
            {count} + {secondCount} = {count + secondCount}
          </p>
        ) : null}
      </div>
    );
  }

  if (visualType === "dice") {
    const dieOne = Math.max(1, Math.min(6, count));
    const rawSecond = mathVisualNumber(
      question.mathVisualSecondCount,
      0,
      6,
    );
    const dice = rawSecond > 0
      ? [dieOne, Math.max(1, rawSecond)]
      : [dieOne];

    return (
      <div
        aria-label={`${dice.length} dice showing ${dice.join(" and ")}`}
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "24px",
            justifyContent: "center",
          }}
        >
          {dice.map((value, dieIndex) => (
            <div
              key={`${value}-${dieIndex}`}
              style={{
                background:
                  dieIndex === 0 ? "#fff5b8" : "#bde4ff",
                border: "4px solid #354b63",
                borderRadius: "18px",
                boxShadow: "inset -8px -8px 0 rgba(0,0,0,.08)",
                display: "grid",
                gap: "8px",
                gridTemplateColumns: "repeat(3, 18px)",
                gridTemplateRows: "repeat(3, 18px)",
                padding: "18px",
              }}
            >
              {Array.from({length: 9}, (_, position) => {
                const pipPositions: Record<number, number[]> = {
                  1: [4],
                  2: [0, 8],
                  3: [0, 4, 8],
                  4: [0, 2, 6, 8],
                  5: [0, 2, 4, 6, 8],
                  6: [0, 2, 3, 5, 6, 8],
                };

                return (
                  <span
                    key={position}
                    style={{
                      background:
                        pipPositions[value].includes(position)
                          ? "#354b63"
                          : "transparent",
                      borderRadius: "50%",
                      display: "block",
                    }}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (visualType === "cube-train") {
    const secondCount = mathVisualNumber(
      question.mathVisualSecondCount,
      3,
      50,
    );
    const colorOne =
      typeof question.mathVisualColorOne === "string"
        ? question.mathVisualColorOne
        : "#70b7ff";
    const colorTwo =
      typeof question.mathVisualColorTwo === "string"
        ? question.mathVisualColorTwo
        : "#ffc857";
    const vertical =
      question.mathVisualLayout === "vertical";
    const cubes = [
      ...Array.from({length: count}, () => colorOne),
      ...Array.from({length: secondCount}, () => colorTwo),
    ];

    return (
      <div
        aria-label={`Cube train with ${count} and ${secondCount} cubes`}
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            alignItems: "center",
            display: "flex",
            flexDirection: vertical ? "column" : "row",
            justifyContent: "center",
            margin: "0 auto",
            minHeight: vertical ? "300px" : "70px",
            overflow: "auto",
          }}
        >
          {cubes.map((color, index) => (
            <span
              aria-hidden="true"
              key={index}
              style={{
                background: color,
                border: "3px solid #354b63",
                borderRadius: "7px",
                boxShadow: "inset -7px -7px 0 rgba(0,0,0,.12)",
                display: "block",
                flex: "0 0 50px",
                height: "50px",
                marginLeft:
                  !vertical && index > 0 ? "-3px" : 0,
                marginTop:
                  vertical && index > 0 ? "-3px" : 0,
                width: "50px",
              }}
            />
          ))}
        </div>
        <p
          style={{
            color: "#354b63",
            fontSize: "22px",
            fontWeight: 900,
            margin: "18px 0 0",
            textAlign: "center",
          }}
        >
          {count} + {secondCount} = {count + secondCount}
        </p>
      </div>
    );
  }
  if (
    visualType === "picture-graph"
    || visualType === "bar-graph"
    || visualType === "tally-table"
  ) {
    const labels = (
      typeof question.mathVisualLabels === "string"
        ? question.mathVisualLabels
        : "Bears,Stars,Apples"
    )
      .split(",")
      .map((label) => label.trim())
      .filter(Boolean)
      .slice(0, 6);

    const rawValues = (
      typeof question.mathVisualValues === "string"
        ? question.mathVisualValues
        : "3,5,2"
    )
      .split(",")
      .map((value) => mathVisualNumber(value, 0, 20));

    const values = labels.map(
      (_, index) => rawValues[index] ?? 0,
    );
    const maximum = Math.max(1, ...values);
    const categoryObjects = (
      typeof question.mathVisualObjects === "string"
        ? question.mathVisualObjects
        : ""
    )
      .split(",")
      .map((object) => object.trim())
      .filter(Boolean);
    const symbols: Record<string, string> = {
      diamonds: "\u25C6",
      hearts: "\u2665",
      hexagons: "\u2B22",
      squares: "\u25A0",
      triangles: "\u25B2",
      apples: "🍎",
      backpacks: "\uD83C\uDF92",
      bananas: "\uD83C\uDF4C",
      birds: "\uD83D\uDC26",
      books: "\uD83D\uDCD6",
      cats: "\uD83D\uDC31",
      cookies: "\uD83C\uDF6A",
      crayons: "\uD83D\uDD8D",
      dogs: "\uD83D\uDC36",
      fish: "\uD83D\uDC1F",
      pencils: "\u270E",
      pizza: "\uD83C\uDF55",
      bears: "🧸",
      circles: "●",
      cubes: "■",
      stars: "★",
    };
    const symbol =
      symbols[question.mathVisualObject ?? "stars"] ?? "★";

    if (visualType === "picture-graph") {
      return (
        <div
          aria-label="Picture graph"
          role="img"
          style={shellStyle}
        >
          <div style={{display: "grid", gap: "12px"}}>
            {labels.map((label, index) => (
              <div
                key={label}
                style={{
                  alignItems: "center",
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "110px 1fr 40px",
                }}
              >
                <strong>{label}</strong>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "6px",
                  }}
                >
                  {Array.from(
                    {length: values[index]},
                    (_, symbolIndex) => (
                      <span
                        key={symbolIndex}
                        style={{
                          color: index % 2
                            ? "#ff8396"
                            : "#70b7ff",
                          fontSize: "32px",
                        }}
                      >
                        {symbols[
                          categoryObjects[index]
                            || question.mathVisualObject
                            || "stars"
                        ] ?? symbol}
                      </span>
                    ),
                  )}
                </div>
                <strong>{values[index]}</strong>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (visualType === "bar-graph") {
      return (
        <div
          aria-label="Bar graph"
          role="img"
          style={shellStyle}
        >
          <div
            style={{
              alignItems: "end",
              display: "flex",
              gap: "18px",
              height: "260px",
              justifyContent: "center",
            }}
          >
            {labels.map((label, index) => (
              <div
                key={label}
                style={{
                  alignItems: "center",
                  display: "flex",
                  flex: "1 1 70px",
                  flexDirection: "column",
                  justifyContent: "end",
                  maxWidth: "100px",
                }}
              >
                <strong>{values[index]}</strong>
                <div
                  style={{
                    background: index % 2
                      ? "#ff8396"
                      : "#70b7ff",
                    border: "3px solid #354b63",
                    borderRadius: "10px 10px 0 0",
                    height:
                      `${Math.max(
                        12,
                        (values[index] / maximum) * 190,
                      )}px`,
                    width: "58px",
                  }}
                />
                <strong style={{marginTop: "8px"}}>
                  {label}
                </strong>
              </div>
            ))}
          </div>
        </div>
      );
    }

    const tallyMarks = (value: number) => {
      const groups = Math.floor(value / 5);
      const remainder = value % 5;

      return (
        <span
          aria-label={`${value} tally marks`}
          style={{
            alignItems: "center",
            display: "inline-flex",
            flexWrap: "wrap",
            gap: "9px",
          }}
        >
          {Array.from({length: groups}, (_, groupIndex) => (
            <span
              aria-hidden="true"
              key={`group-${groupIndex}`}
              style={{
                display: "inline-flex",
                gap: "7px",
                height: "32px",
                position: "relative",
                width: "43px",
              }}
            >
              {Array.from({length: 4}, (_, markIndex) => (
                <span
                  key={markIndex}
                  style={{
                    background: "#354b63",
                    borderRadius: "2px",
                    display: "block",
                    height: "30px",
                    width: "3px",
                  }}
                />
              ))}

              <span
                style={{
                  background: "#7a4cc2",
                  borderRadius: "2px",
                  display: "block",
                  height: "3px",
                  left: "-2px",
                  position: "absolute",
                  top: "14px",
                  transform: "rotate(-38deg)",
                  width: "47px",
                }}
              />
            </span>
          ))}

          {Array.from({length: remainder}, (_, markIndex) => (
            <span
              aria-hidden="true"
              key={`remainder-${markIndex}`}
              style={{
                background: "#354b63",
                borderRadius: "2px",
                display: "block",
                height: "30px",
                width: "3px",
              }}
            />
          ))}
        </span>
      );
    };

    const showTotals = question.mathVisualShowTotals !== false;

    return (
      <div
        aria-label="Tally table"
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            border: "3px solid #354b63",
            display: "grid",
            gridTemplateColumns: showTotals
              ? "1fr 1.5fr .5fr"
              : "1fr 1.5fr",
          }}
        >
          {["Category", "Tallies", ...(showTotals ? ["Total"] : [])].map((heading) => (
            <strong
              key={heading}
              style={{
                background: "#e9f4ff",
                borderBottom: "2px solid #354b63",
                padding: "10px",
              }}
            >
              {heading}
            </strong>
          ))}

          {labels.flatMap((label, index) => [
            <span key={`${label}-name`} style={{padding: "10px"}}>
              {label}
            </span>,
            <strong
              key={`${label}-tally`}
              style={{
                fontFamily: "monospace",
                fontSize: "22px",
                padding: "10px",
              }}
            >
              {tallyMarks(values[index])}
            </strong>,
            ...(showTotals
              ? [
                <strong key={`${label}-total`} style={{padding: "10px"}}>
                  {values[index]}
                </strong>,
              ]
              : []),
          ])}
        </div>
      </div>
    );
  }
  if (visualType === "number-line") {
    const end = Math.max(
      1,
      mathVisualNumber(question.mathVisualEnd, 10, 30),
    );
    const highlighted = Math.min(count, end);

    return (
      <div
        aria-label={`Number line from 0 to ${end}, highlighting ${highlighted}`}
        role="img"
        style={shellStyle}
      >
        <div
          style={{
            alignItems: "flex-start",
            display: "grid",
            gridTemplateColumns:
              `repeat(${end + 1}, minmax(28px, 1fr))`,
          }}
        >
          {Array.from(
            {length: end + 1},
            (_, number) => (
              <div
                key={number}
                style={{
                  color:
                    number === highlighted
                      ? "#d94f64"
                      : "#354b63",
                  fontWeight:
                    number === highlighted ? 900 : 700,
                  textAlign: "center",
                }}
              >
                <div
                  style={{
                    background:
                      number === highlighted
                        ? "#d94f64"
                        : "#354b63",
                    height:
                      number === highlighted ? "24px" : "15px",
                    margin: "0 auto 8px",
                    width: "3px",
                  }}
                />
                {number}
              </div>
            ),
          )}
        </div>
        <div
          aria-hidden="true"
          style={{
            background: "#354b63",
            height: "4px",
            marginTop: "-39px",
          }}
        />
      </div>
    );
  }

  const cellCount =
    visualType === "ten-frame" ? 10 : count;
  const shadeCount = mathVisualNumber(
    question.mathVisualShadeCount,
    0,
    cellCount,
  );
  const circleCount = mathVisualNumber(
    question.mathVisualCircleCount,
    0,
    cellCount,
  );
  const crossOutCount = mathVisualNumber(
    question.mathVisualCrossOutCount,
    0,
    cellCount,
  );
  const groupSize = mathVisualNumber(
    question.mathVisualGroupSize,
    0,
    cellCount,
  );
  const showNumbers =
    question.mathVisualShowNumbers === true;
  const usesObjectSymbol = Boolean(visualObjectSymbol)
    && visualType !== "ten-frame"
    && visualType !== "linking-cubes"
    && question.mathVisualObject !== "cubes";

  return (
    <div
      aria-label={`${count} ${objectStyle}`}
      role="img"
      style={shellStyle}
    >
      <div
        style={{
          display: "grid",
          gap: groupSize ? "4px" : "10px",
          gridTemplateColumns:
            visualType === "ten-frame"
              ? "repeat(5, 58px)"
              : "repeat(auto-fit, minmax(52px, 58px))",
          justifyContent: "center",
        }}
      >
        {Array.from({length: cellCount}, (_, index) => {
          const filled =
            visualType !== "ten-frame" || index < count;
          const cube =
            visualType === "linking-cubes"
            || objectStyle === "cubes";
          const shaded = index < shadeCount;
          const circled = index < circleCount;
          const crossed =
            index >= cellCount - crossOutCount;
          const grouped = index < groupSize;

          return (
            <div
              key={index}
              style={{
                alignItems: "center",
                background: shaded
                  ? "#ffe59a"
                  : usesObjectSymbol
                    ? "transparent"
                    : filled
                      ? cube
                        ? "#70b7ff"
                        : "#ff8396"
                      : "#ffffff",
                border: usesObjectSymbol
                  ? "none"
                  : "3px solid #354b63",
                borderRadius: usesObjectSymbol
                  ? "0"
                  : cube
                    ? "9px"
                    : "50%",
                boxShadow: [
                  filled && cube && !usesObjectSymbol
                    ? "inset -6px -6px 0 rgba(0,0,0,.12)"
                    : "",
                  circled
                    ? "0 0 0 5px #7a4cc2"
                    : "",
                ].filter(Boolean).join(", "),
                color: usesObjectSymbol
                  ? (shaded ? "#e9b949" : "#ff6f91")
                  : "#25384c",
                display: "flex",
                fontSize: usesObjectSymbol ? "42px" : "20px",
                fontWeight: 900,
                height: "54px",
                justifyContent: "center",
                outline:
                  grouped ? "3px dashed #ef6d64" : "none",
                position: "relative",
                width: "54px",
              }}
            >
              {usesObjectSymbol && filled
                ? visualObjectSymbol
                : showNumbers
                  ? index + 1
                  : null}
              {crossed ? (
                <span
                  aria-hidden="true"
                  style={{
                    color: "#d53c4e",
                    fontSize: "54px",
                    fontWeight: 400,
                    left: "5px",
                    lineHeight: 1,
                    position: "absolute",
                    top: "-2px",
                  }}
                >
                  ×
                </span>
              ) : null}
            </div>
          );
        })}
      </div>

      {groupSize ? (
        <p
          style={{
            color: "#ef6d64",
            fontWeight: 900,
            margin: "14px 0 0",
            textAlign: "center",
          }}
        >
          First {groupSize} grouped together
        </p>
      ) : null}
    </div>
  );
}
export function GameEditorPanel({
  cardEdits,
  onClose,
  updateCard,
}: {
  cardEdits: Record<string, CardEdit>;
  onClose: () => void;
  updateCard: (cardKey: string, update: CardEdit) => void;
}) {
  const [tileEditorOpen, setTileEditorOpen] = useState(false);
  const [tileTitleDraft, setTileTitleDraft] = useState("");
  const [tileDescriptionDraft, setTileDescriptionDraft] =
    useState("");
  const [tileIconDraft, setTileIconDraft] = useState("");
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [games, setGames] = useState<EditableGame[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [previewChoice, setPreviewChoice] = useState("");
  const [activeEditorTab, setActiveEditorTab] =
    useState<"question" | "answers" | "voice" | "preview">("question");
  const [expandedAnswerAudio, setExpandedAnswerAudio] = useState("");
  const [answerRecordingDrafts, setAnswerRecordingDrafts] =
    useState<Record<string, RecordingDraft>>({});
  const [recordingAnswerValue, setRecordingAnswerValue] = useState("");
  const [recordingDrafts, setRecordingDrafts] =
    useState<Record<string, RecordingDraft>>({});
  const [recordingSpeakerId, setRecordingSpeakerId] = useState("");  
  const [selectedGameId, setSelectedGameId] = useState("");
  const [selectedLevelIndex, setSelectedLevelIndex] = useState(0);
  const [selectedQuestionId, setSelectedQuestionId] = useState("");
  const [speechManifest, setSpeechManifest] = useState<Record<string, string> | null>(null);
  const [status, setStatus] = useState("");
  const [teacherAccount, setTeacherAccount] = useState("");
  const chunksRef = useRef<Blob[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const selectedGame = useMemo(
    () => games.find((game) => game.gameId === selectedGameId) ?? games[0],
    [games, selectedGameId],
  );
  const selectedLevel = selectedGame?.content.levels[selectedLevelIndex];
  const levelQuestions = useMemo(
    () =>
      selectedGame
        ? selectedGame.content.questions
            .map((question, index) => ({ index, question }))
            .filter((item) => item.question.zone === selectedLevelIndex)
        : [],
    [selectedGame, selectedLevelIndex],
  );
  const selectedQuestionItem = useMemo(
    () =>
      selectedGame
        ? selectedGame.content.questions
            .map((question, index) => ({ index, question }))
            .find((item) => item.question.id === selectedQuestionId) ?? levelQuestions[0]
        : undefined,
    [levelQuestions, selectedGame, selectedQuestionId],
  );
  const selectedQuestion = selectedQuestionItem?.question;
  const selectedLevelQuestionIndex = levelQuestions.findIndex(
    (item) => item.question.id === selectedQuestion?.id,
  );
  const previousQuestion =
    selectedLevelQuestionIndex > 0
      ? levelQuestions[selectedLevelQuestionIndex - 1]?.question
      : undefined;
  const nextQuestion =
    selectedLevelQuestionIndex >= 0
      ? levelQuestions[selectedLevelQuestionIndex + 1]?.question
      : undefined;
  const speakerButtons = selectedQuestion ? deriveSpeakerButtons(selectedQuestion) : [];

  useEffect(() => {
    let mounted = true;

    async function loadGames() {
      setError("");
      setIsLoading(true);

      try {
        const seedGames = (
          await Promise.all(
            SEED_GAME_FILES.map(async (seed) => {
              const response = await fetch(seed.path, { cache: "no-store" });
              return normalizeGame(await response.json());
            }),
          )
        ).filter((game): game is EditableGame => Boolean(game));
        const byId = new Map(seedGames.map((game) => [game.gameId, game]));
        const services = await loadFirebase();
        const email = await signedInTeacher(services);

        setTeacherAccount(email);

        for (const seedGame of seedGames) {
          const parentDoc = await services.db
            .collection(GAME_COLLECTION)
            .doc(seedGame.gameId)
            .get();

          if (!parentDoc.exists) {
            continue;
          }

          const parent = parentDoc.data() ?? {};
          const gameId = seedGame.gameId;
          const draftVersion = asText(parent.draftVersion).trim();
          const publishedVersion = asText(parent.publishedVersion).trim();
          const versionId = draftVersion || publishedVersion;
          let loadedGame = byId.get(gameId);

          if (versionId) {
            const versionDoc = await services.db
              .collection(GAME_COLLECTION)
              .doc(gameId)
              .collection("versions")
              .doc(versionId)
              .get();
            const versionData = versionDoc.data() ?? {};
            loadedGame = normalizeGame({
              ...parent,
              content: versionData.content,
              gameId,
            }) ?? loadedGame;
          }

          if (loadedGame) {
            loadedGame.draftVersion = draftVersion || undefined;
            loadedGame.publishedVersion = publishedVersion || undefined;
            byId.set(gameId, loadedGame);
          }
        }

        const gameOrder = new Map(
          SEED_GAME_FILES.map((seed, index) => [seed.gameId, index]),
        );

        const nextGames = Array.from(byId.values())
          .map((game) => {
            const cardKey = cardKeyForGameId(game.gameId);
            const baseCard = baseCardForGameId(game.gameId);
            const cardEdit = cardKey ? cardEdits[cardKey] : undefined;
            const title = cardEdit?.title?.trim() || game.title;

            return {
              ...game,
              content: {
                ...game.content,
                unitTitle: title,
              },
              tileDescription:
                cardEdit?.description?.trim()
                || baseCard?.description
                || "",
              tileIcon:
                cardEdit?.icon?.trim()
                || baseCard?.icon
                || "",
              title,
            };
          })
          .sort(
            (a, b) =>
              (gameOrder.get(a.gameId) ?? Number.MAX_SAFE_INTEGER)
              - (gameOrder.get(b.gameId) ?? Number.MAX_SAFE_INTEGER),
          );

        if (mounted) {
          const requestedGameId = window.sessionStorage.getItem("first-grade-learning-games-editor-game-id") ?? "";
          const requestedGame = nextGames.find((game) => game.gameId === requestedGameId);
          const initialGame = requestedGame ?? nextGames[0];
          window.sessionStorage.removeItem("first-grade-learning-games-editor-game-id");
          setGames(nextGames);
          setSelectedGameId(initialGame?.gameId ?? "");
          setSelectedLevelIndex(0);
          setSelectedQuestionId(initialGame?.content.questions[0]?.id ?? "");
          setStatus("Game editor is ready.");
        }
      } catch (nextError) {
        if (mounted) {
          setError(nextError instanceof Error ? nextError.message : "Game editor could not load.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadGames();

    return () => {
      mounted = false;
      Object.values(recordingDrafts).forEach((draft) => URL.revokeObjectURL(draft.url));
    };
  }, []);

  function updateSelectedGame(mutator: (game: EditableGame) => void) {
    if (!selectedGame) {
      return;
    }

    setGames((currentGames) =>
      currentGames.map((game) => {
        if (game.gameId !== selectedGame.gameId) {
          return game;
        }

        const nextGame = clone(game);
        mutator(nextGame);
        return nextGame;
      }),
    );
    setDirty(true);
    setStatus("Draft has unsaved changes.");
  }

  function openTileEditor() {
    if (!selectedGame) {
      return;
    }

    setTileTitleDraft(selectedGame.title);
    setTileDescriptionDraft(selectedGame.tileDescription);
    setTileIconDraft(selectedGame.tileIcon);
    setTileEditorOpen(true);
  }

  function applyTileEditor() {
    if (!selectedGame) {
      return;
    }

    updateSelectedGame((game) => {
      const nextTitle = tileTitleDraft.trim() || game.title;
      game.title = nextTitle;
      game.content.unitTitle = nextTitle;
      game.tileDescription = tileDescriptionDraft.trim();
      game.tileIcon = tileIconDraft.trim();
    });

    setTileEditorOpen(false);
  }

  function updateGameMeta(
    field:
      | "title"
      | "unitSlug"
      | "subject"
      | "tileDescription"
      | "tileIcon",
    value: string,
  ) {
    updateSelectedGame((game) => {
      if (field === "subject") {
        game.subject = value === "math" ? "math" : "ckla";
      } else if (field === "unitSlug") {
        game.unitSlug = normalizeId(value) || game.unitSlug;
      } else if (field === "tileDescription") {
        game.tileDescription = value;
      } else if (field === "tileIcon") {
        game.tileIcon = value;
      } else {
        game.title = value;
        game.content.unitTitle = value;
      }
    });
  }

  function updateLevel(field: keyof EditableLevel, value: string) {
    updateSelectedGame((game) => {
      const level = game.content.levels[selectedLevelIndex];
      if (level) {
        level[field] = value;
      }
    });
  }

  function addLevel() {
    updateSelectedGame((game) => {
      game.content.levels.push({
        detail: "New level",
        icon: "star",
        learningTarget: "",
        lessonRange: "",
        name: `Level ${game.content.levels.length + 1}`,
        practiceLabel: "",
      });
    });
    setSelectedLevelIndex(selectedGame?.content.levels.length ?? 0);
    setSelectedQuestionId("");
  }

  function duplicateLevel() {
    updateSelectedGame((game) => {
      const source = game.content.levels[selectedLevelIndex];
      if (!source) {
        return;
      }

      const insertIndex = selectedLevelIndex + 1;
      game.content.levels.splice(insertIndex, 0, {
        ...clone(source),
        name: `${source.name} Copy`,
      });
      game.content.questions.forEach((question) => {
        if (question.zone >= insertIndex) {
          question.zone += 1;
        }
      });
      const copiedQuestions = game.content.questions
        .filter((question) => question.zone === selectedLevelIndex)
        .map((question) => ({
          ...clone(question),
          id: makeId(question.id),
          zone: insertIndex,
        }));
      game.content.questions.push(...copiedQuestions);
    });
    setSelectedLevelIndex(selectedLevelIndex + 1);
    setSelectedQuestionId("");
  }

  function deleteLevel() {
    if (!selectedGame || selectedGame.content.levels.length <= 1) {
      setError("A game needs at least one level.");
      return;
    }

    updateSelectedGame((game) => {
      game.content.levels.splice(selectedLevelIndex, 1);
      game.content.questions = game.content.questions
        .filter((question) => question.zone !== selectedLevelIndex)
        .map((question) => ({
          ...question,
          zone: question.zone > selectedLevelIndex ? question.zone - 1 : question.zone,
        }));
    });
    setSelectedLevelIndex(Math.max(0, selectedLevelIndex - 1));
    setSelectedQuestionId("");
  }

  function moveLevel(direction: -1 | 1) {
    if (!selectedGame) {
      return;
    }

    const targetIndex = selectedLevelIndex + direction;
    if (targetIndex < 0 || targetIndex >= selectedGame.content.levels.length) {
      return;
    }

    updateSelectedGame((game) => {
      game.content.levels = moveItem(game.content.levels, selectedLevelIndex, targetIndex);
      game.content.questions.forEach((question) => {
        if (question.zone === selectedLevelIndex) {
          question.zone = targetIndex;
        } else if (question.zone === targetIndex) {
          question.zone = selectedLevelIndex;
        }
      });
    });
    setSelectedLevelIndex(targetIndex);
  }

  function updateQuestion(field: keyof EditableQuestion, value: string | number | boolean | SpeakerButton[]) {
    if (selectedQuestionItem === undefined) {
      return;
    }

    updateSelectedGame((game) => {
      const question = game.content.questions[selectedQuestionItem.index];
      if (question) {
        question[field] = value as never;
        if (field === "answer") {
          question.correctAnswer = String(value);
        }
      }
    });
  }

  function addQuestion() {
    const question = blankQuestion(selectedLevelIndex);

    updateSelectedGame((game) => {
      game.content.questions.push(question);
    });
    setSelectedQuestionId(question.id);
  }

  function duplicateQuestion() {
    if (!selectedQuestion) {
      return;
    }

    const question = {
      ...clone(selectedQuestion),
      id: makeId(selectedQuestion.id),
    };

    updateSelectedGame((game) => {
      const insertAt = selectedQuestionItem ? selectedQuestionItem.index + 1 : game.content.questions.length;
      game.content.questions.splice(insertAt, 0, question);
    });
    setSelectedQuestionId(question.id);
  }

  function deleteQuestion() {
    if (!selectedQuestionItem || !selectedGame || selectedGame.content.questions.length <= 1) {
      setError("A game needs at least one question.");
      return;
    }

    updateSelectedGame((game) => {
      game.content.questions.splice(selectedQuestionItem.index, 1);
    });
    setSelectedQuestionId("");
  }

  function moveQuestion(direction: -1 | 1) {
    if (!selectedGame || !selectedQuestionItem) {
      return;
    }

    const questionIndexes = levelQuestions.map((item) => item.index);
    const position = questionIndexes.indexOf(selectedQuestionItem.index);
    const targetPosition = position + direction;

    if (targetPosition < 0 || targetPosition >= questionIndexes.length) {
      return;
    }

    const targetIndex = questionIndexes[targetPosition];
    updateSelectedGame((game) => {
      const nextQuestions = [...game.content.questions];
      [nextQuestions[selectedQuestionItem.index], nextQuestions[targetIndex]] = [
        nextQuestions[targetIndex],
        nextQuestions[selectedQuestionItem.index],
      ];
      game.content.questions = nextQuestions;
    });
  }

  function updateChoice(choiceIndex: number, field: 0 | 1, value: string) {
    if (!selectedQuestion) {
      return;
    }

    const choices = clone(selectedQuestion.choices);
    const choice = choices[choiceIndex];

    if (!choice) {
      return;
    }

    choice[field] = value;
    updateQuestion("choices", choices);
  }

  function addChoice() {
    if (!selectedQuestion) {
      return;
    }

    const choiceValue = makeId("answer");

    updateQuestion("choices", [
      ...selectedQuestion.choices,
      [choiceValue, "New answer"],
    ]);
  }
  function deleteChoice(choiceIndex: number) {
    if (!selectedQuestion || selectedQuestion.choices.length <= 2) {
      return;
    }

    const choices = selectedQuestion.choices.filter((_, index) => index !== choiceIndex);
    const stillHasAnswer = choices.some((choice) => choice[0] === selectedQuestion.answer);
    updateSelectedGame((game) => {
      if (!selectedQuestionItem) {
        return;
      }
      const question = game.content.questions[selectedQuestionItem.index];
      question.choices = choices;
      if (!stillHasAnswer) {
        question.answer = choices[0][0];
        question.correctAnswer = choices[0][0];
      }
    });
  }
  function updateAnswerStyle(
    answerStyle: "standard" | "listening-letters",
  ) {
    if (selectedQuestionItem === undefined) {
      return;
    }

    updateSelectedGame((game) => {
      const question =
        game.content.questions[selectedQuestionItem.index];

      if (!question || question.answerStyle === answerStyle) {
        return;
      }

      if (answerStyle === "listening-letters") {
        const previousChoices = clone(question.choices);
        const previousAnswer = question.answer;
        const previousAudio = question.answerAudio ?? {};
        const correctIndex = previousChoices.findIndex(
          (choice) => choice[0] === previousAnswer,
        );

        question.standardChoicesJson =
          JSON.stringify(previousChoices);
        question.standardAnswer = previousAnswer;

        const nextAudio: Record<string, AnswerAudio> = {};
        const nextReportLabels: Record<string, string> = {};

        question.choices = previousChoices.map(
          (choice, index): Choice => {
            const letter = String.fromCharCode(65 + index);
            const audio = previousAudio[choice[0]];

            if (audio) {
              nextAudio[letter] = audio;
            }

            nextReportLabels[letter] = (
              audio?.audioSourceText
              || audio?.audioText
              || choice[1]
              || choice[0]
            ).trim();

            return [letter, letter];
          },
        );

        const nextAnswer =
          correctIndex >= 0
            ? String.fromCharCode(65 + correctIndex)
            : question.choices[0]?.[0] ?? "A";

        question.answer = nextAnswer;
        question.correctAnswer = nextAnswer;
        question.answerAudio = nextAudio;
        question.answerReportLabels = nextReportLabels;
        question.answerStyle = "listening-letters";
        return;
      }

      let restoredChoices: Choice[] = [];

      try {
        const parsed = JSON.parse(
          String(question.standardChoicesJson ?? "[]"),
        );

        if (Array.isArray(parsed)) {
          restoredChoices = parsed as Choice[];
        }
      } catch {
        restoredChoices = [];
      }

      if (!restoredChoices.length) {
        restoredChoices = question.choices.map(
          (choice): Choice => [choice[0], choice[1]],
        );
      }

      const currentAudio = question.answerAudio ?? {};
      const currentAnswerIndex = question.choices.findIndex(
        (choice) => choice[0] === question.answer,
      );
      const restoredAudio: Record<string, AnswerAudio> = {};

      restoredChoices.forEach((choice, index) => {
        const letter = String.fromCharCode(65 + index);
        const audio = currentAudio[letter];

        if (audio) {
          restoredAudio[choice[0]] = audio;
        }
      });

      const restoredAnswer =
        String(question.standardAnswer ?? "").trim()
        || restoredChoices[
          Math.max(0, currentAnswerIndex)
        ]?.[0]
        || restoredChoices[0]?.[0]
        || "";

      question.choices = restoredChoices;
      question.answer = restoredAnswer;
      question.correctAnswer = restoredAnswer;
      question.answerAudio = restoredAudio;
      question.answerReportLabels = {};
      question.answerStyle = "standard";
      delete question.standardChoicesJson;
      delete question.standardAnswer;
    });
  }

  function updateAnswerAudio(
    choiceValue: string,
    update: Partial<AnswerAudio>,
  ) {
    if (!selectedQuestion) {
      return;
    }

    const choice = selectedQuestion.choices.find(
      (item) => item[0] === choiceValue,
    );
    const current = selectedQuestion.answerAudio?.[choiceValue];
    const nextAudio: AnswerAudio = {
      audioKind: current?.audioKind ?? "googleTts",
      audioText: current?.audioText ?? choice?.[1] ?? choiceValue,
      ...current,
      ...update,
    };

    updateSelectedGame((game) => {
      if (selectedQuestionItem === undefined) {
        return;
      }

      const question =
        game.content.questions[selectedQuestionItem.index];

      if (!question) {
        return;
      }

      question.answerAudio = {
        ...(question.answerAudio ?? {}),
        [choiceValue]: nextAudio,
      };

      if (question.answerStyle === "listening-letters") {
        const spokenReportLabel = (
          nextAudio.audioSourceText
          || nextAudio.audioText
          || choice?.[1]
          || choiceValue
        ).trim();

        question.answerReportLabels = {
          ...(question.answerReportLabels ?? {}),
          [choiceValue]: spokenReportLabel,
        };
      }
    });
  }

  function openAnswerAudio(choice: Choice) {
    updateAnswerAudio(choice[0], {
      audioText:
        selectedQuestion?.answerAudio?.[choice[0]]?.audioText ??
        choice[1],
    });
    setExpandedAnswerAudio(choice[0]);
  }

  function removeAnswerAudio(choiceValue: string) {
    if (!selectedQuestion) {
      return;
    }

    const nextAudio = {
      ...(selectedQuestion.answerAudio ?? {}),
    };
    delete nextAudio[choiceValue];

    updateQuestion("answerAudio", nextAudio);
    setExpandedAnswerAudio("");
    setAnswerRecordingDrafts((current) => {
      const next = {...current};
      const draft = next[choiceValue];

      if (draft) {
        URL.revokeObjectURL(draft.url);
        delete next[choiceValue];
      }

      return next;
    });
  }

  function setSpeakerButtons(nextButtons: SpeakerButton[]) {
    updateQuestion("speakerButtons", nextButtons);
  }

  function updateSpeakerButton(buttonId: string, update: Partial<SpeakerButton>) {
    const nextButtons = deriveSpeakerButtons(selectedQuestion as EditableQuestion).map((button) =>
      button.id === buttonId ? { ...button, ...update } : button,
    );
    setSpeakerButtons(nextButtons);
  }

  function addSpeakerButton() {
    const nextButtons = [
      ...speakerButtons,
      {
        audioKind: "googleTts" as const,
        enabled: true,
        id: makeId("speaker"),
        label: "Hear word",
        position: "below" as const,
        text: selectedQuestion?.word || selectedQuestion?.prompt || "",
      },
    ];
    setSpeakerButtons(nextButtons);
  }

  function deleteSpeakerButton(buttonId: string) {
    setSpeakerButtons(speakerButtons.filter((button) => button.id !== buttonId));
  }

  function addNewGame() {
    const game = blankGame();
    setGames((currentGames) => [...currentGames, game]);
    setSelectedGameId(game.gameId);
    setSelectedLevelIndex(0);
    setSelectedQuestionId(game.content.questions[0].id);
    setDirty(true);
    setStatus("New unit draft created.");
  }

  async function loadSpeechManifest() {
    if (speechManifest) {
      return speechManifest;
    }

    const response = await fetch("/audio/manifest.json", { cache: "no-store" });
    const data = (await response.json()) as { items?: Record<string, string> };
    const items = data.items ?? {};
    setSpeechManifest(items);
    return items;
  }

  async function previewSpeaker(button: SpeakerButton) {
    setError("");

    try {
      if (button.audioUrl) {
        if (
          button.audioText &&
          button.audioText !== button.text.trim()
        ) {
          setError(
            "This text changed after its audio was created. Generate or record new audio.",
          );
          return;
        }

        await new Audio(button.audioUrl).play();
        return;
      }

      const manifest = await loadSpeechManifest();
      const source =
        manifest[button.text] ??
        manifest[normalizeSpeechKey(button.text)];

      if (!source) {
        setError(
          "No audio exists for this exact text. Use Generate AI Voice or Record.",
        );
        return;
      }
      await new Audio(source).play();
    } catch {
      setError("That audio could not play in this browser.");
    }
  }

  async function generateAnswerAudio(choiceValue: string) {
    if (!selectedGame || !selectedQuestion) {
      return;
    }

    const choice = selectedQuestion.choices.find(
      (item) => item[0] === choiceValue,
    );
    const current = selectedQuestion.answerAudio?.[choiceValue];
    const text = (current?.audioText ?? choice?.[1] ?? "").trim();

    if (!text) {
      setError("Enter what this answer should say first.");
      return;
    }

    setError("");
    setStatus("Generating answer audio...");
    setIsSaving(true);

    try {
      const services = await loadFirebase();
      await signedInTeacher(services);

      if (!services.functions) {
        throw new Error("Firebase Functions did not load.");
      }

      const generateAudio =
        services.functions.httpsCallable("generateGameAudio");
      const result = await generateAudio({
        audioId: `${selectedQuestion.id}-answer-${choiceValue}`,
        gameId: selectedGame.gameId,
        text,
      });
      const generated = result.data;

      updateAnswerAudio(choiceValue, {
        audioKind: "googleTts",
        audioSourceText: generated.sourceText,
        audioText: text,
        audioUrl: generated.audioUrl,
        storagePath: generated.storagePath,
      });

      setStatus("Answer AI voice generated. Preview it, then save.");
      await new Audio(generated.audioUrl).play().catch(() => undefined);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Answer AI audio could not be generated.",
      );
      setStatus("");
    } finally {
      setIsSaving(false);
    }
  }

  async function previewAnswerAudio(choiceValue: string) {
    const audio = selectedQuestion?.answerAudio?.[choiceValue];

    if (!audio?.audioUrl) {
      setError("No audio exists for this answer yet.");
      return;
    }

    if (
      audio.audioSourceText &&
      audio.audioSourceText !== audio.audioText.trim()
    ) {
      setError(
        "This answer’s spoken text changed. Generate or record new audio.",
      );
      return;
    }

    setError("");

    try {
      await new Audio(audio.audioUrl).play();
    } catch {
      setError("That answer audio could not play in this browser.");
    }
  }

  function selectPreviewAnswer(choiceValue: string) {
    setPreviewChoice(choiceValue);

    if (selectedQuestion?.answerAudio?.[choiceValue]?.audioUrl) {
      void previewAnswerAudio(choiceValue);
    }
  }
  async function generateSpeakerAudio(button: SpeakerButton) {
    if (!selectedGame) {
      return;
    }

    const text = button.text.trim();

    if (!text) {
      setError("Enter what this button should say first.");
      return;
    }

    setError("");
    setStatus("Generating Google AI voice...");
    setIsSaving(true);

    try {
      const services = await loadFirebase();
      await signedInTeacher(services);

      if (!services.functions) {
        throw new Error("Firebase Functions did not load.");
      }

      const generateAudio =
        services.functions.httpsCallable("generateGameAudio");
      const result = await generateAudio({
        audioId: button.id,
        gameId: selectedGame.gameId,
        text,
      });
      const generated = result.data;

      updateSpeakerButton(button.id, {
        audioKind: "googleTts",
        audioText: generated.sourceText,
        audioUrl: generated.audioUrl,
        storagePath: generated.storagePath,
      });

      setStatus("Google AI voice generated. Preview it, then save or publish.");
      await new Audio(generated.audioUrl).play().catch(() => undefined);
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Google AI audio could not be generated.",
      );
      setStatus("");
    } finally {
      setIsSaving(false);
    }
  }
  async function startAnswerRecording(choiceValue: string) {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const url = URL.createObjectURL(blob);

        setAnswerRecordingDrafts((current) => {
          const existing = current[choiceValue];

          if (existing) {
            URL.revokeObjectURL(existing.url);
          }

          return {
            ...current,
            [choiceValue]: {blob, url},
          };
        });

        stream.getTracks().forEach((track) => track.stop());
        setRecordingAnswerValue("");
      };

      mediaRecorderRef.current = recorder;
      setRecordingAnswerValue(choiceValue);
      recorder.start();
    } catch {
      setError(
        "Microphone recording could not start. Check browser microphone permission.",
      );
    }
  }

  async function startRecording(buttonId: string) {
    setError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordingDrafts((current) => {
          const existing = current[buttonId];
          if (existing) {
            URL.revokeObjectURL(existing.url);
          }
          return { ...current, [buttonId]: { blob, url } };
        });
        stream.getTracks().forEach((track) => track.stop());
        setRecordingSpeakerId("");
      };
      mediaRecorderRef.current = recorder;
      setRecordingSpeakerId(buttonId);
      recorder.start();
    } catch {
      setError("Microphone recording could not start. Check browser microphone permission.");
    }
  }

  function stopRecording() {
    
    mediaRecorderRef.current?.stop();
  }
  async function uploadAnswerRecording(choiceValue: string) {
    const draft = answerRecordingDrafts[choiceValue];

    if (!draft || !selectedGame || !selectedQuestion) {
      return;
    }

    const choice = selectedQuestion.choices.find(
      (item) => item[0] === choiceValue,
    );
    const current = selectedQuestion.answerAudio?.[choiceValue];
    const audioText = (
      current?.audioText ??
      choice?.[1] ??
      choiceValue
    ).trim();

    setIsSaving(true);
    setError("");

    try {
      const services = await loadFirebase();
      await signedInTeacher(services);

      if (!services.storage) {
        throw new Error("Firebase Storage is not available.");
      }

      const storagePath =
        `gameAudio/${selectedGame.gameId}/` +
        `${selectedQuestion.id}-answer-${choiceValue}-${Date.now()}.webm`;
      const snapshot = await services.storage
          .ref(storagePath)
          .put(draft.blob, {
            contentType: draft.blob.type || "audio/webm",
          });
      const audioUrl = await snapshot.ref.getDownloadURL();

      updateAnswerAudio(choiceValue, {
        audioKind: "teacherRecording",
        audioSourceText: audioText,
        audioText,
        audioUrl,
        storagePath: snapshot.ref.fullPath || storagePath,
      });

      setAnswerRecordingDrafts((currentDrafts) => {
        const next = {...currentDrafts};
        delete next[choiceValue];
        return next;
      });

      URL.revokeObjectURL(draft.url);
      setStatus("Answer recording saved to this draft.");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Answer recording could not save.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteAnswerAudio(choiceValue: string) {
    const audio = selectedQuestion?.answerAudio?.[choiceValue];
    setError("");

    try {
      if (audio?.storagePath) {
        const services = await loadFirebase();
        await signedInTeacher(services);
        await services.storage
            ?.ref(audio.storagePath)
            .delete()
            .catch(() => undefined);
      }

      removeAnswerAudio(choiceValue);
      setStatus("Answer audio removed.");
    } catch {
      setError("Answer audio could not be removed.");
    }
  }

  async function uploadQuestionImage(file: File) {
    if (!selectedGame || !selectedQuestionItem) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Question images must be smaller than 10 MB.");
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const services = await loadFirebase();
      await signedInTeacher(services);

      if (!services.storage) {
        throw new Error("Firebase Storage is not available.");
      }

      const previousStoragePath =
        selectedQuestion?.questionImageStoragePath;
      const extension =
        file.name.split(".").pop()?.toLowerCase()
          ?.replace(/[^a-z0-9]/g, "")
        || "image";
      const storagePath =
        `gameImages/${selectedGame.gameId}/`
        + `${selectedQuestion.id}-${Date.now()}.${extension}`;
      const snapshot = await services.storage
        .ref(storagePath)
        .put(file, {
          contentType: file.type,
        });
      const imageUrl = await snapshot.ref.getDownloadURL();

      updateSelectedGame((game) => {
        const question =
          game.content.questions[selectedQuestionItem.index];

        if (!question) {
          return;
        }

        question.questionImageUrl = imageUrl;
        question.questionImageStoragePath =
          snapshot.ref.fullPath || storagePath;

        if (!question.questionImageAlt?.trim()) {
          question.questionImageAlt =
            question.prompt.trim() || "Question image";
        }
      });

      if (
        previousStoragePath
        && previousStoragePath
          !== (snapshot.ref.fullPath || storagePath)
      ) {
        await services.storage
          .ref(previousStoragePath)
          .delete()
          .catch(() => undefined);
      }

      setStatus("Question image added to this draft.");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Question image could not upload.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function removeQuestionImage() {
    if (!selectedGame || !selectedQuestionItem) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const storagePath =
        selectedQuestion?.questionImageStoragePath;

      if (storagePath) {
        const services = await loadFirebase();
        await signedInTeacher(services);
        await services.storage
          ?.ref(storagePath)
          .delete()
          .catch(() => undefined);
      }

      updateSelectedGame((game) => {
        const question =
          game.content.questions[selectedQuestionItem.index];

        if (!question) {
          return;
        }

        delete question.questionImageAlt;
        delete question.questionImageStoragePath;
        delete question.questionImageUrl;
      });

      setStatus("Question image removed from this draft.");
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Question image could not be removed.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function uploadRecording(button: SpeakerButton) {
    const draft = recordingDrafts[button.id];

    if (!draft || !selectedGame) {
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const services = await loadFirebase();
      await signedInTeacher(services);

      if (!services.storage) {
        throw new Error("Firebase Storage is not available yet.");
      }

      const storagePath = `gameAudio/${selectedGame.gameId}/${button.id}-${Date.now()}.webm`;
      const snapshot = await services.storage.ref(storagePath).put(draft.blob, {
        contentType: draft.blob.type || "audio/webm",
      });
      const audioUrl = await snapshot.ref.getDownloadURL();
      updateSpeakerButton(button.id, {
        audioKind: "teacherRecording",
        audioText: button.text.trim(),
        audioUrl,
        storagePath: snapshot.ref.fullPath || storagePath,
      });
      setRecordingDrafts((current) => {        
        const next = { ...current };
        delete next[button.id];
        return next;
      });
      URL.revokeObjectURL(draft.url);
      setStatus("Recording saved to this draft.");
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Recording could not save.");
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteRecording(button: SpeakerButton) {
    setError("");

    try {
      if (button.storagePath) {
        const services = await loadFirebase();
        await signedInTeacher(services);
        await services.storage?.ref(button.storagePath).delete().catch(() => undefined);
      }

      updateSpeakerButton(button.id, {
        audioKind: "googleTts",
        audioUrl: undefined,
        storagePath: undefined,
      });
      setStatus("Recording removed from this speaker button.");
    } catch {
      setError("Recording could not be removed.");
    }
  }

  async function saveGame(statusType: "draft" | "published") {
    if (!selectedGame) {
      return;
    }

    setError("");
    setIsSaving(true);

    try {
      const services = await loadFirebase();
      const email = await signedInTeacher(services);
      const serverTime = services.firebase.firestore.FieldValue.serverTimestamp();
      const versionId =
        statusType === "draft"
          ? "draft"
          : `published-${Date.now()}`;
      const gameRef = services.db
          .collection(GAME_COLLECTION)
          .doc(selectedGame.gameId);

      const versionData = {
          content: versionContent(selectedGame),
          createdAt: serverTime,
          schemaVersion: 1,
          status: statusType,
          updatedAt: serverTime,
          updatedBy: email,
          versionId,
        };

      try {
        await gameRef
          .collection("versions")
          .doc(versionId)
          .set(versionData);
      } catch (writeError) {
        throw new Error(
          `VERSION-WRITE-V4: ${
            writeError instanceof Error
              ? writeError.message
              : String(writeError)
          }`,
        );
      }      
      
      if (statusType === "published") {
        const cardKey = cardKeyForGameId(selectedGame.gameId);

        if (cardKey) {
          updateCard(cardKey, {
            description: selectedGame.tileDescription.trim(),
            icon: selectedGame.tileIcon.trim(),
            title: selectedGame.title.trim(),
          });
        }
      }

      await gameRef.set(
        {
          createdAt: serverTime,
          draftVersion:
            statusType === "draft"
              ? versionId
              : selectedGame.draftVersion ?? null,
          gameId: selectedGame.gameId,
          publishedVersion:
            statusType === "published"
              ? versionId
              : selectedGame.publishedVersion ?? "",
          schemaVersion: 1,
          subject: selectedGame.subject,
          title: selectedGame.title,
          unitSlug: selectedGame.unitSlug,
          updatedAt: serverTime,
          updatedBy: email,
        },
        {merge: true},
      );

      setGames((currentGames) =>
        currentGames.map((game) =>
          game.gameId === selectedGame.gameId
            ? {
                ...game,
                draftVersion:
                  statusType === "draft"
                    ? versionId
                    : game.draftVersion,
                publishedVersion:
                  statusType === "published"
                    ? versionId
                    : game.publishedVersion,
              }
            : game,
        ),
      );

      setDirty(false);
      setStatus(
        statusType === "published"
          ? "Published. Students will load this version."
          : "Draft saved.",
      );
    } catch (nextError) {
      setError(
        nextError instanceof Error
          ? nextError.message
          : "Game content could not save.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div aria-modal="true" className="scholar-results-overlay game-editor-overlay" role="dialog">
      <section className="scholar-results-panel game-editor-panel">
        <div
          className="scholar-results-header"
          style={{
            alignItems: "center",
            background: "#ffffff",
            border: "1px solid rgba(35, 54, 74, 0.1)",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(35, 54, 74, 0.08)",
            display: "grid",
            gap: "24px",
            gridTemplateColumns: "1fr minmax(240px, 1fr) auto",
            padding: "20px 24px",
          }}
        >
          <div>
            <p className="eyebrow">Teacher Edit</p>
            <h2>Game Editor</h2>
            {teacherAccount ? (
              <p className="pin-helper">
                {teacherLabelForEmail(teacherAccount)} editing account
              </p>
            ) : null}
          </div>

          <div style={{textAlign: "center"}}>
            {selectedGame ? (
              <p className="eyebrow" style={{marginBottom: "4px"}}>
                {selectedGame.subject === "math"
                  ? "EUREKA MATH · MODULE "
                  : selectedGame.subject === "ckla-listening-learning"
                    ? "CKLA LISTENING & LEARNING · UNIT "
                    : "CKLA UNIT "}
                {unitNumberForGameId(selectedGame.gameId)}
              </p>
            ) : null}
            <h2 style={{margin: 0}}>
              {selectedGame?.title ?? "Select a unit"}
            </h2>
          </div>

          <div className="student-detail-actions">
            {selectedGame ? (
              <button
                className="teacher-control-button"
                onClick={openTileEditor}
                type="button"
              >
                Edit Tile
              </button>
            ) : null}
            <button
              className="teacher-control-button secondary"
              onClick={onClose}
              type="button"
            >
              Close
            </button>
          </div>
        </div>

        {error ? <p className="teacher-message error">{error}</p> : null}
        {status ? <p className="teacher-message success">{status}</p> : null}

        {tileEditorOpen && selectedGame ? (
          <div
            className="pin-modal-backdrop"
            role="presentation"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) {
                setTileEditorOpen(false);
              }
            }}
          >
            <form
              className="pin-modal"
              onSubmit={(event) => {
                event.preventDefault();
                applyTileEditor();
              }}
            >
              <p className="eyebrow">Unit tile</p>
              <h2>Edit {selectedGame.title}</h2>

              <label>
                Unit title
                <input
                  autoFocus
                  required
                  value={tileTitleDraft}
                  onChange={(event) =>
                    setTileTitleDraft(event.target.value)
                  }
                />
              </label>

              <label>
                Description
                <textarea
                  required
                  rows={3}
                  value={tileDescriptionDraft}
                  onChange={(event) =>
                    setTileDescriptionDraft(event.target.value)
                  }
                />
              </label>

              <label>
                Small picture
                <input
                  required
                  value={tileIconDraft}
                  onChange={(event) =>
                    setTileIconDraft(event.target.value)
                  }
                />
                <span className="field-help">
                  Use an emoji or paste an image URL.
                </span>
              </label>

              <div className="pin-actions">
                <button
                  onClick={() => setTileEditorOpen(false)}
                  type="button"
                >
                  Cancel
                </button>
                <button type="submit">
                  Done
                </button>
              </div>
            </form>
          </div>
        ) : null}

        {isLoading ? (
          <section className="teacher-card">
            <h3>Loading Game Editor...</h3>
          </section>
        ) : null}

        {!isLoading && selectedGame ? (
          <>
            <section className="teacher-card game-editor-toolbar">
              <div className="game-editor-toolbar-selects">
                <label>
                  Subject
                  <select
                    onChange={(event) => {
                      const nextGame = games.find(
                        (game) => game.subject === event.target.value,
                      );
                      if (!nextGame) return;
                      setSelectedGameId(nextGame.gameId);
                      setSelectedLevelIndex(0);
                      setSelectedQuestionId(nextGame.content.questions[0]?.id ?? "");
                      setPreviewChoice("");
                      setActiveEditorTab("question");
                    }}
                    value={selectedGame.subject}
                  >
                    <option value="ckla">CKLA Skills</option>
                    <option value="ckla-listening-learning">
                      CKLA Listening &amp; Learning
                    </option>
                    <option value="math">Math</option>
                  </select>
                </label>
                <label>
                  Unit game
                  <select
                    onChange={(event) => {
                      const nextGame = games.find((game) => game.gameId === event.target.value);
                      setSelectedGameId(event.target.value);
                      setSelectedLevelIndex(0);
                      setSelectedQuestionId(nextGame?.content.questions[0]?.id ?? "");
                      setPreviewChoice("");
                      setActiveEditorTab("question");
                    }}
                    value={selectedGame.gameId}
                  >
                    {games
                      .filter((game) => game.subject === selectedGame.subject)
                      .map((game) => (
                        <option key={game.gameId} value={game.gameId}>
                          {game.title}
                        </option>
                      ))}
                  </select>
                </label>
              </div>
              <button className="teacher-control-button secondary" onClick={addNewGame} type="button">
                New Unit
              </button>
              <button className="teacher-control-button secondary" disabled={!dirty || isSaving} onClick={() => void saveGame("draft")} type="button">
                Save Draft
              </button>
              <button className="teacher-control-button" disabled={isSaving} onClick={() => void saveGame("published")} type="button">
                Publish
              </button>
            </section>
            <div className="game-editor-grid">
              <section className="teacher-card game-editor-level-card">
                <div className="game-editor-card-head">
                  <h3>Levels</h3>
                  <div>
                    <button className="teacher-text-button" onClick={addLevel} type="button">Add</button>
                    <button className="teacher-text-button" onClick={duplicateLevel} type="button">Duplicate</button>
                    <button className="teacher-text-button danger" onClick={deleteLevel} type="button">Delete</button>
                  </div>
                </div>
                <div className="game-editor-list">
                  {selectedGame.content.levels.map((level, index) => (
                    <button
                      className={index === selectedLevelIndex ? "is-active" : ""}
                      key={`${level.name}-${index}`}
                      onClick={() => {
                        setSelectedLevelIndex(index);
                        setSelectedQuestionId(selectedGame.content.questions.find((question) => question.zone === index)?.id ?? "");
                        setPreviewChoice("");
                      }}
                      type="button"
                    >
                      <strong>{index + 1}. {level.name}</strong>
                      <span>{selectedGame.content.questions.filter((question) => question.zone === index).length} questions</span>
                    </button>
                  ))}
                </div>
                <div className="game-editor-move-actions">
                  <button className="teacher-text-button" onClick={() => moveLevel(-1)} type="button">Move Up</button>
                  <button className="teacher-text-button" onClick={() => moveLevel(1)} type="button">Move Down</button>
                </div>
                {selectedLevel ? (
                  <div className="game-editor-fields">
                    <label>Name<input value={selectedLevel.name} onChange={(event) => updateLevel("name", event.target.value)} /></label>
                    <label>Practice label<input value={selectedLevel.practiceLabel ?? ""} onChange={(event) => updateLevel("practiceLabel", event.target.value)} /></label>
                    <label>Lesson range<input value={selectedLevel.lessonRange ?? ""} onChange={(event) => updateLevel("lessonRange", event.target.value)} /></label>
                    <label>Icon<input value={selectedLevel.icon} onChange={(event) => updateLevel("icon", event.target.value)} /></label>
                    <label>Detail<textarea rows={3} value={selectedLevel.detail} onChange={(event) => updateLevel("detail", event.target.value)} /></label>
                  </div>
                ) : null}
              </section>

              <section className="teacher-card game-editor-question-list-card">
                <div className="game-editor-card-head">
                  <h3>Questions</h3>
                  <div>
                    <button className="teacher-text-button" onClick={addQuestion} type="button">Add</button>
                    <button className="teacher-text-button" onClick={duplicateQuestion} type="button">Duplicate</button>
                    <button className="teacher-text-button danger" onClick={deleteQuestion} type="button">Delete</button>
                  </div>
                </div>
                <div className="game-editor-list question-list">
                  {levelQuestions.map(({ question }, index) => (
                    <button
                      className={question.id === selectedQuestion?.id ? "is-active" : ""}
                      key={question.id}
                      onClick={() => {
                        setSelectedQuestionId(question.id);
                        setPreviewChoice("");
                      }}
                      type="button"
                    >
                      <strong>{index + 1}. {question.skill || question.type || "Question"}</strong>
                      <span>{question.prompt}</span>
                    </button>
                  ))}
                </div>
                <div className="game-editor-move-actions">
                  <button className="teacher-text-button" onClick={() => moveQuestion(-1)} type="button">Move Up</button>
                  <button className="teacher-text-button" onClick={() => moveQuestion(1)} type="button">Move Down</button>
                </div>
              </section>

              <section className="teacher-card game-editor-question-card">
                <div className="game-editor-card-head">
                  <h3>Question Editor</h3>
                  <span className="game-editor-selection-label">
                    {selectedQuestion?.skill || selectedQuestion?.type || "No question selected"}
                  </span>
                </div>
                <div aria-label="Question editor sections" className="game-editor-tabs" role="tablist">
                  {(["question", "answers", "voice", "preview"] as const).map((tab) => (
                    <button
                      aria-selected={activeEditorTab === tab}
                      className={activeEditorTab === tab ? "is-active" : ""}
                      key={tab}
                      onClick={() => setActiveEditorTab(tab)}
                      role="tab"
                      type="button"
                    >
                      {tab === "question"
                        ? "Question"
                        : tab === "answers"
                          ? "Answers"
                          : tab === "voice"
                            ? "Voice"
                            : "Preview"}
                    </button>
                  ))}
                </div>
                {selectedQuestion ? (
                  <div className="game-editor-fields">
                    <div className="game-editor-tab-panel" hidden={activeEditorTab !== "question"} role="tabpanel">
                      <label>Directions<textarea rows={3} value={selectedQuestion.prompt} onChange={(event) => updateQuestion("prompt", event.target.value)} /></label>
                      <label>Question type<input value={selectedQuestion.type ?? ""} onChange={(event) => updateQuestion("type", event.target.value)} /></label>
                      <label>Skill label<input value={selectedQuestion.skill ?? ""} onChange={(event) => updateQuestion("skill", event.target.value)} /></label>
                      <label>Word or target<input value={selectedQuestion.word ?? ""} onChange={(event) => updateQuestion("word", event.target.value)} /></label>
                      <label>Displayed sentence or target<input value={selectedQuestion.display ?? ""} onChange={(event) => updateQuestion("display", event.target.value)} /></label>

                      {selectedGame.subject === "math" ? (
                        <section className="game-editor-subsection">
                          <div className="game-editor-card-head">
                            <div>
                              <h4>Math Visual</h4>
                              <p className="pin-helper">
                                Build a clear math model without uploading an image.
                              </p>
                            </div>
                          </div>

                          <label>
                            Visual template
                            <select
                              value={
                                selectedQuestion.mathVisualType
                                ?? "none"
                              }
                              onChange={(event) =>
                                updateQuestion(
                                  "mathVisualType",
                                  event.target.value,
                                )
                              }
                            >
                              <option value="none">None</option>
                              <option value="counters">
                                Counters or circles
                              </option>
                              <option value="linking-cubes">
                                Linking cubes
                              </option>
                              <option value="ten-frame">
                                Ten-frame
                              </option>
                              <option value="two-groups">
                                Two-color groups
                              </option>
                              <option value="dice">
                                One or two dice
                              </option>
                              <option value="cube-train">
                                Two-color cube train
                              </option>
                              <option value="picture-graph">
                                Picture graph
                              </option>
                              <option value="bar-graph">
                                Bar graph
                              </option>
                              <option value="tally-table">
                                Tally table
                              </option>
                              <option value="number-bond">
                                Number bond
                              </option>
                              <option value="number-line">
                                Number line
                              </option>
                              <option value="number-path">
                                Number path with counting hops
                              </option>
                              <option value="categorical-number-path-graph">
                                Categorical number path graph
                              </option>
                              <option value="equation-comparison">
                                Equation comparison
                              </option>
                            </select>
                          </label>

                          {selectedQuestion.mathVisualType
                            && selectedQuestion.mathVisualType
                              !== "none" ? (
                            <>
                              {selectedQuestion.mathVisualType
                                !== "categorical-number-path-graph"
                                && selectedQuestion.mathVisualType
                                  !== "equation-comparison" ? (
                              <label>
                                {selectedQuestion.mathVisualType
                                  === "number-bond"
                                  ? "Whole"
                                  : selectedQuestion.mathVisualType
                                      === "number-line"
                                    ? "Highlighted number"
                                    : selectedQuestion.mathVisualType
                                        === "number-path"
                                      ? "Starting number"
                                      : selectedQuestion.mathVisualType
                                          === "dice"
                                        ? "Die 1 value"
                                        : selectedQuestion.mathVisualType
                                            === "two-groups"
                                          || selectedQuestion.mathVisualType
                                            === "cube-train"
                                          ? "Part 1 amount"
                                          : "How many"}
                                <input
                                  max={100}
                                  min={0}
                                  type="number"
                                  value={
                                    selectedQuestion.mathVisualCount
                                    ?? 5
                                  }
                                  onChange={(event) =>
                                    updateQuestion(
                                      "mathVisualCount",
                                      Number(event.target.value),
                                    )
                                  }
                                />
                              </label>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "categorical-number-path-graph" ? (
                                <section className="game-editor-subsection">
                                  <h4>Category graph settings</h4>
                                  <label>
                                    Graph title (optional)
                                    <input
                                      value={selectedQuestion.mathVisualGraphTitle ?? ""}
                                      onChange={(event) => updateQuestion("mathVisualGraphTitle", event.target.value)}
                                    />
                                  </label>
                                  <div style={{display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
                                    <label>
                                      Category column label
                                      <input
                                        value={selectedQuestion.mathVisualGraphCategoryHeader ?? "Category"}
                                        onChange={(event) => updateQuestion("mathVisualGraphCategoryHeader", event.target.value)}
                                      />
                                    </label>
                                    <label>
                                      Totals column label
                                      <input
                                        value={selectedQuestion.mathVisualGraphTotalLabel ?? "Total"}
                                        onChange={(event) => updateQuestion("mathVisualGraphTotalLabel", event.target.value)}
                                      />
                                    </label>
                                  </div>
                                  <label>
                                    Category labels (2 or 3)
                                    <input
                                      placeholder="Apples, Bears, Stars"
                                      value={selectedQuestion.mathVisualLabels ?? "Category A,Category B"}
                                      onChange={(event) => updateQuestion("mathVisualLabels", event.target.value)}
                                    />
                                    <span className="field-help">Separate labels with commas.</span>
                                  </label>
                                  <label>
                                    Filled amount for each category
                                    <input
                                      placeholder="3, 5"
                                      value={selectedQuestion.mathVisualValues ?? "3,5"}
                                      onChange={(event) => updateQuestion("mathVisualValues", event.target.value)}
                                    />
                                    <span className="field-help">Use one number for each category label.</span>
                                  </label>
                                  <label>
                                    Maximum number
                                    <input
                                      max={30}
                                      min={1}
                                      type="number"
                                      value={selectedQuestion.mathVisualEnd ?? 10}
                                      onChange={(event) => updateQuestion("mathVisualEnd", Number(event.target.value))}
                                    />
                                  </label>
                                  <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                    <input
                                      checked={selectedQuestion.mathVisualShowTotals !== false}
                                      onChange={(event) => updateQuestion("mathVisualShowTotals", event.target.checked)}
                                      type="checkbox"
                                    />
                                    Show totals column
                                  </label>
                                  <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                    <input
                                      checked={selectedQuestion.mathVisualGraphShowNumbers !== false}
                                      onChange={(event) => updateQuestion("mathVisualGraphShowNumbers", event.target.checked)}
                                      type="checkbox"
                                    />
                                    Show number labels (1 to maximum)
                                  </label>
                                  <div style={{display: "grid", gap: "12px", gridTemplateColumns: "repeat(3, minmax(0, 1fr))"}}>
                                    {([
                                      ["Category 1 color", "mathVisualColorOne", "#70b7ff"],
                                      ["Category 2 color", "mathVisualColorTwo", "#ff8396"],
                                      ["Category 3 color", "mathVisualColorThree", "#ffc857"],
                                    ] as const).map(([label, field, fallback]) => (
                                      <label key={field}>
                                        {label}
                                        <select
                                          value={String(selectedQuestion[field] ?? fallback)}
                                          onChange={(event) => updateQuestion(field, event.target.value)}
                                        >
                                          <option value="#70b7ff">Blue</option>
                                          <option value="#ff8396">Pink</option>
                                          <option value="#ffc857">Yellow</option>
                                          <option value="#70d6a7">Green</option>
                                          <option value="#a98bff">Purple</option>
                                          <option value="#ff936b">Orange</option>
                                        </select>
                                      </label>
                                    ))}
                                  </div>
                                </section>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "equation-comparison" ? (
                                <section className="game-editor-subsection">
                                  <h4>Equation settings</h4>
                                  <label>
                                    Left expression
                                    <input
                                      placeholder="3 + 2"
                                      value={selectedQuestion.mathVisualEquationLeft ?? "3 + 2"}
                                      onChange={(event) => updateQuestion("mathVisualEquationLeft", event.target.value)}
                                    />
                                  </label>
                                  <label>
                                    Right expression
                                    <input
                                      placeholder="5"
                                      value={selectedQuestion.mathVisualEquationRight ?? "5"}
                                      onChange={(event) => updateQuestion("mathVisualEquationRight", event.target.value)}
                                    />
                                  </label>
                                  <label>
                                    Question mode
                                    <select
                                      value={selectedQuestion.mathVisualEquationMode ?? "true-false"}
                                      onChange={(event) => updateQuestion("mathVisualEquationMode", event.target.value)}
                                    >
                                      <option value="true-false">True or false</option>
                                      <option value="missing-symbol">Choose the missing symbol</option>
                                    </select>
                                  </label>
                                  <label>
                                    Comparison symbol
                                    <select
                                      value={selectedQuestion.mathVisualEquationOperator ?? "="}
                                      onChange={(event) => updateQuestion("mathVisualEquationOperator", event.target.value)}
                                    >
                                      <option value="=">=</option>
                                      <option value="&lt;">&lt;</option>
                                      <option value="&gt;">&gt;</option>
                                    </select>
                                  </label>
                                  <div style={{display: "grid", gap: "12px", gridTemplateColumns: "repeat(2, minmax(0, 1fr))"}}>
                                    <label>
                                      Left visual model
                                      <select
                                        value={selectedQuestion.mathVisualEquationLeftModel ?? "none"}
                                        onChange={(event) => updateQuestion("mathVisualEquationLeftModel", event.target.value)}
                                      >
                                        <option value="none">None</option>
                                        <option value="counters">Counters</option>
                                        <option value="ten-frame">Ten-frame</option>
                                      </select>
                                    </label>
                                    <label>
                                      Right visual model
                                      <select
                                        value={selectedQuestion.mathVisualEquationRightModel ?? "none"}
                                        onChange={(event) => updateQuestion("mathVisualEquationRightModel", event.target.value)}
                                      >
                                        <option value="none">None</option>
                                        <option value="counters">Counters</option>
                                        <option value="ten-frame">Ten-frame</option>
                                      </select>
                                    </label>
                                    <label>
                                      Left model count
                                      <input
                                        max={30}
                                        min={0}
                                        type="number"
                                        value={selectedQuestion.mathVisualEquationLeftCount ?? 5}
                                        onChange={(event) => updateQuestion("mathVisualEquationLeftCount", Number(event.target.value))}
                                      />
                                    </label>
                                    <label>
                                      Right model count
                                      <input
                                        max={30}
                                        min={0}
                                        type="number"
                                        value={selectedQuestion.mathVisualEquationRightCount ?? 5}
                                        onChange={(event) => updateQuestion("mathVisualEquationRightCount", Number(event.target.value))}
                                      />
                                    </label>
                                    <label>
                                      Left model color
                                      <select
                                        value={selectedQuestion.mathVisualEquationLeftColor ?? "#70b7ff"}
                                        onChange={(event) => updateQuestion("mathVisualEquationLeftColor", event.target.value)}
                                      >
                                        <option value="#70b7ff">Blue</option>
                                        <option value="#ff8396">Pink</option>
                                        <option value="#ffc857">Yellow</option>
                                        <option value="#70d6a7">Green</option>
                                      </select>
                                    </label>
                                    <label>
                                      Right model color
                                      <select
                                        value={selectedQuestion.mathVisualEquationRightColor ?? "#ff8396"}
                                        onChange={(event) => updateQuestion("mathVisualEquationRightColor", event.target.value)}
                                      >
                                        <option value="#ff8396">Pink</option>
                                        <option value="#70b7ff">Blue</option>
                                        <option value="#ffc857">Yellow</option>
                                        <option value="#70d6a7">Green</option>
                                      </select>
                                    </label>
                                  </div>
                                </section>
                              ) : null}

                              {(selectedQuestion.mathVisualType
                                === "two-groups"
                                || selectedQuestion.mathVisualType
                                  === "cube-train"
                                || selectedQuestion.mathVisualType
                                  === "dice") ? (
                                <label>
                                  {selectedQuestion.mathVisualType
                                    === "dice"
                                    ? "Die 2 value (0 for one die)"
                                    : "Part 2 amount"}
                                  <input
                                    max={
                                      selectedQuestion.mathVisualType
                                        === "dice"
                                        ? 6
                                        : 50
                                    }
                                    min={0}
                                    type="number"
                                    value={
                                      selectedQuestion.mathVisualSecondCount
                                      ?? (
                                        selectedQuestion.mathVisualType
                                          === "dice"
                                          ? 0
                                          : 3
                                      )
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "mathVisualSecondCount",
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                </label>
                              ) : null}

                              {(selectedQuestion.mathVisualType
                                === "two-groups"
                                || selectedQuestion.mathVisualType
                                  === "cube-train") ? (
                                <div
                                  style={{
                                    display: "grid",
                                    gap: "12px",
                                    gridTemplateColumns:
                                      "repeat(2, minmax(0, 1fr))",
                                  }}
                                >
                                  <label>
                                    Part 1 color
                                    <select
                                      value={
                                        selectedQuestion.mathVisualColorOne
                                        ?? "#70b7ff"
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualColorOne",
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="#70b7ff">Blue</option>
                                      <option value="#ff8396">Pink</option>
                                      <option value="#ffc857">Yellow</option>
                                      <option value="#70d6a7">Green</option>
                                      <option value="#a98bff">Purple</option>
                                      <option value="#ff936b">Orange</option>
                                    </select>
                                  </label>

                                  <label>
                                    Part 2 color
                                    <select
                                      value={
                                        selectedQuestion.mathVisualColorTwo
                                        ?? "#ff8396"
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualColorTwo",
                                          event.target.value,
                                        )
                                      }
                                    >
                                      <option value="#ff8396">Pink</option>
                                      <option value="#70b7ff">Blue</option>
                                      <option value="#ffc857">Yellow</option>
                                      <option value="#70d6a7">Green</option>
                                      <option value="#a98bff">Purple</option>
                                      <option value="#ff936b">Orange</option>
                                    </select>
                                  </label>
                                </div>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "two-groups" ? (
                                <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                  <input
                                    checked={selectedQuestion.mathVisualShowTotals !== false}
                                    onChange={(event) => updateQuestion("mathVisualShowTotals", event.target.checked)}
                                    type="checkbox"
                                  />
                                  Show sum/equation
                                </label>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "cube-train" ? (
                                <label>
                                  Cube train direction
                                  <select
                                    value={
                                      selectedQuestion.mathVisualLayout
                                      ?? "horizontal"
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "mathVisualLayout",
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <option value="horizontal">
                                      Horizontal
                                    </option>
                                    <option value="vertical">
                                      Vertical
                                    </option>
                                  </select>
                                </label>
                              ) : null}
                              {(selectedQuestion.mathVisualType
                                === "picture-graph"
                                || selectedQuestion.mathVisualType
                                  === "bar-graph"
                                || selectedQuestion.mathVisualType
                                  === "tally-table") ? (
                                <>
                                  <label>
                                    Graph category names
                                    <input
                                      placeholder="Bears, Stars, Apples"
                                      value={
                                        selectedQuestion.mathVisualLabels
                                        ?? "Bears,Stars,Apples"
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualLabels",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <span className="field-help">
                                      Separate each name with a comma.
                                    </span>
                                  </label>

                                  <label>
                                    Values for each category
                                    <input
                                      placeholder="3, 5, 2"
                                      value={
                                        selectedQuestion.mathVisualValues
                                        ?? "3,5,2"
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualValues",
                                          event.target.value,
                                        )
                                      }
                                    />
                                    <span className="field-help">
                                      Enter matching numbers separated by commas.
                                    </span>
                                  </label>
                                  {selectedQuestion.mathVisualType
                                    === "tally-table" ? (
                                    <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                      <input
                                        checked={selectedQuestion.mathVisualShowTotals !== false}
                                        onChange={(event) => updateQuestion("mathVisualShowTotals", event.target.checked)}
                                        type="checkbox"
                                      />
                                      Show totals column
                                    </label>
                                  ) : null}
                                </>
                              ) : null}
                              {selectedQuestion.mathVisualType
                                === "picture-graph" ? (
                                <section className="game-editor-subsection">
                                  <h4>Picture for each category</h4>
                                  <span className="field-help">
                                    Choose a different object for each category row.
                                  </span>
                                  {(selectedQuestion.mathVisualLabels
                                    ?? "Bears,Stars,Apples")
                                    .split(",")
                                    .map((label) => label.trim())
                                    .filter(Boolean)
                                    .slice(0, 6)
                                    .map((label, index, labels) => {
                                      const currentObjects = (selectedQuestion.mathVisualObjects
                                        ?? "")
                                        .split(",")
                                        .map((value) => value.trim());
                                      const currentObject = currentObjects[index]
                                        || selectedQuestion.mathVisualObject
                                        || "stars";

                                      return (
                                        <label key={`${label}-${index}`}>
                                          {label} object
                                          <select
                                            value={currentObject}
                                            onChange={(event) => {
                                              const nextObjects = labels.map((_, objectIndex) =>
                                                currentObjects[objectIndex]
                                                || selectedQuestion.mathVisualObject
                                                || "stars",
                                              );
                                              nextObjects[index] = event.target.value;
                                              updateQuestion(
                                                "mathVisualObjects",
                                                nextObjects.join(","),
                                              );
                                            }}
                                          >
                                            <optgroup label="Shapes">
                                              <option value="circles">Circles</option>
                                              <option value="cubes">Cubes</option>
                                              <option value="triangles">Triangles</option>
                                              <option value="squares">Squares</option>
                                              <option value="diamonds">Diamonds</option>
                                              <option value="hearts">Hearts</option>
                                              <option value="hexagons">Hexagons</option>
                                            </optgroup>
                                            <optgroup label="Animals">
                                              <option value="bears">Bears</option>
                                              <option value="cats">Cats</option>
                                              <option value="dogs">Dogs</option>
                                              <option value="fish">Fish</option>
                                              <option value="birds">Birds</option>
                                            </optgroup>
                                            <optgroup label="School items">
                                              <option value="pencils">Pencils</option>
                                              <option value="books">Books</option>
                                              <option value="crayons">Crayons</option>
                                              <option value="backpacks">Backpacks</option>
                                            </optgroup>
                                            <optgroup label="Food">
                                              <option value="apples">Apples</option>
                                              <option value="bananas">Bananas</option>
                                              <option value="pizza">Pizza</option>
                                              <option value="cookies">Cookies</option>
                                            </optgroup>
                                          </select>
                                        </label>
                                      );
                                    })}
                                </section>
                              ) : null}
                              {selectedQuestion.mathVisualType
                                === "number-bond" ? (
                                <div
                                  style={{
                                    display: "grid",
                                    gap: "12px",
                                    gridTemplateColumns:
                                      "repeat(2, minmax(0, 1fr))",
                                  }}
                                >
                                  <label>
                                    Part 1
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion
                                          .mathVisualPartOne
                                        ?? 3
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualPartOne",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    Part 2
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion
                                          .mathVisualPartTwo
                                        ?? 2
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualPartTwo",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>
                                </div>
                              ) : null}

                              {(selectedQuestion.mathVisualType
                                === "number-line"
                                || selectedQuestion.mathVisualType
                                  === "number-path") ? (
                                <label>
                                  Number line or path ends at
                                  <input
                                    max={30}
                                    min={1}
                                    type="number"
                                    value={
                                      selectedQuestion.mathVisualEnd
                                      ?? 10
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "mathVisualEnd",
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                </label>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "number-path" ? (
                                <label>
                                  How many counting hops
                                  <input
                                    max={20}
                                    min={0}
                                    type="number"
                                    value={
                                      selectedQuestion.mathVisualHopCount
                                      ?? 3
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "mathVisualHopCount",
                                        Number(event.target.value),
                                      )
                                    }
                                  />
                                </label>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                === "number-path" ? (
                                <>
                                  <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                    <input
                                      checked={selectedQuestion.mathVisualShowLandingNumber !== false}
                                      onChange={(event) => updateQuestion("mathVisualShowLandingNumber", event.target.checked)}
                                      type="checkbox"
                                    />
                                    Show landing number
                                  </label>
                                  <label style={{alignItems: "center", display: "flex", gap: "10px"}}>
                                    <input
                                      checked={selectedQuestion.mathVisualShowPathSentence !== false}
                                      onChange={(event) => updateQuestion("mathVisualShowPathSentence", event.target.checked)}
                                      type="checkbox"
                                    />
                                    Show sentence underneath
                                  </label>
                                </>
                              ) : null}

                              {selectedQuestion.mathVisualType
                                !== "number-line"
                                && selectedQuestion.mathVisualType
                                  !== "number-path"
                                && selectedQuestion.mathVisualType
                                  !== "dice"
                                && selectedQuestion.mathVisualType
                                  !== "cube-train"
                                && selectedQuestion.mathVisualType
                                  !== "categorical-number-path-graph"
                                && selectedQuestion.mathVisualType
                                  !== "equation-comparison" ? (
                                <label>
                                  Object style
                                  <select
                                    value={
                                      selectedQuestion.mathVisualObject
                                      ?? (
                                        selectedQuestion.mathVisualType
                                          === "linking-cubes"
                                          ? "cubes"
                                          : "circles"
                                      )
                                    }
                                    onChange={(event) =>
                                      updateQuestion(
                                        "mathVisualObject",
                                        event.target.value,
                                      )
                                    }
                                  >
                                    <optgroup label="Shapes">
                                      <option value="circles">
                                        Circles
                                      </option>
                                      <option value="cubes">
                                        Cubes
                                      </option>
                                      <option value="triangles">
                                        Triangles
                                      </option>
                                      <option value="squares">
                                        Squares
                                      </option>
                                      <option value="diamonds">
                                        Diamonds
                                      </option>
                                      <option value="hearts">
                                        Hearts
                                      </option>
                                      <option value="hexagons">
                                        Hexagons
                                      </option>
                                    </optgroup>
                                    <optgroup label="Animals">
                                      <option value="bears">
                                        Bears
                                      </option>
                                      <option value="cats">
                                        Cats
                                      </option>
                                      <option value="dogs">
                                        Dogs
                                      </option>
                                      <option value="fish">
                                        Fish
                                      </option>
                                      <option value="birds">
                                        Birds
                                      </option>
                                    </optgroup>
                                    <optgroup label="School items">
                                      <option value="pencils">
                                        Pencils
                                      </option>
                                      <option value="books">
                                        Books
                                      </option>
                                      <option value="crayons">
                                        Crayons
                                      </option>
                                      <option value="backpacks">
                                        Backpacks
                                      </option>
                                    </optgroup>
                                    <optgroup label="Food">
                                      <option value="apples">
                                        Apples
                                      </option>
                                      <option value="bananas">
                                        Bananas
                                      </option>
                                      <option value="pizza">
                                        Pizza
                                      </option>
                                      <option value="cookies">
                                        Cookies
                                      </option>
                                    </optgroup>
                                  </select>
                                </label>
                              ) : null}

                              {(
                                selectedQuestion.mathVisualType === "counters"
                                || selectedQuestion.mathVisualType
                                  === "linking-cubes"
                                || selectedQuestion.mathVisualType
                                  === "ten-frame"
                              ) ? (
                                <section className="game-editor-subsection">
                                  <h4>Visual markings</h4>

                                  <label>
                                    Shade the first
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion.mathVisualShadeCount
                                        ?? 0
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualShadeCount",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    Circle the first
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion.mathVisualCircleCount
                                        ?? 0
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualCircleCount",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    Cross out the last
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion.mathVisualCrossOutCount
                                        ?? 0
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualCrossOutCount",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>

                                  <label>
                                    Group the first
                                    <input
                                      max={100}
                                      min={0}
                                      type="number"
                                      value={
                                        selectedQuestion.mathVisualGroupSize
                                        ?? 0
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualGroupSize",
                                          Number(event.target.value),
                                        )
                                      }
                                    />
                                  </label>

                                  <label
                                    style={{
                                      alignItems: "center",
                                      display: "flex",
                                      gap: "10px",
                                    }}
                                  >
                                    <input
                                      checked={
                                        selectedQuestion.mathVisualShowNumbers
                                        ?? false
                                      }
                                      onChange={(event) =>
                                        updateQuestion(
                                          "mathVisualShowNumbers",
                                          event.target.checked,
                                        )
                                      }
                                      type="checkbox"
                                    />
                                    Put numbers on the objects or squares
                                  </label>
                                </section>
                              ) : null}
                              <MathVisualPreview
                                question={selectedQuestion}
                              />
                            </>
                          ) : null}
                        </section>
                      ) : null}

                      {selectedGame.subject === "ckla-listening-learning"
                        || selectedGame.subject === "math" ? (
                        <section className="game-editor-subsection">
                          <div className="game-editor-card-head">
                            <div>
                              <h4>Question Image</h4>
                              <p className="pin-helper">
                                Optional. Upload an image only when the
                                question needs one.
                              </p>
                            </div>
                            {selectedQuestion.questionImageUrl ? (
                              <button
                                className="teacher-text-button danger"
                                disabled={isSaving}
                                onClick={() =>
                                  void removeQuestionImage()
                                }
                                type="button"
                              >
                                Remove Image
                              </button>
                            ) : null}
                          </div>

                          {selectedQuestion.questionImageUrl ? (
                            <img
                              alt={
                                selectedQuestion.questionImageAlt
                                || "Question preview"
                              }
                              src={selectedQuestion.questionImageUrl}
                              style={{
                                borderRadius: "16px",
                                display: "block",
                                margin: "12px auto",
                                maxHeight: "280px",
                                maxWidth: "100%",
                                objectFit: "contain",
                              }}
                            />
                          ) : null}

                          <label>
                            {selectedQuestion.questionImageUrl
                              ? "Replace image"
                              : "Upload image"}
                            <input
                              accept="image/png,image/jpeg,image/webp,image/gif"
                              disabled={isSaving}
                              onChange={(event) => {
                                const file=event.target.files?.[0];

                                if (file) {
                                  void uploadQuestionImage(file);
                                }

                                event.target.value="";
                              }}
                              type="file"
                            />
                          </label>

                          {selectedQuestion.questionImageUrl ? (
                            <label>
                              Image description
                              <input
                                maxLength={200}
                                placeholder="Describe the image for accessibility"
                                value={
                                  selectedQuestion.questionImageAlt ?? ""
                                }
                                onChange={(event) =>
                                  updateQuestion(
                                    "questionImageAlt",
                                    event.target.value,
                                  )
                                }
                              />
                            </label>
                          ) : null}
                        </section>
                      ) : null}
                    </div>
                    <div className="game-editor-tab-panel" hidden={activeEditorTab !== "answers"} role="tabpanel">
                    <label>
                      Correct answer
                      <select
                        value={selectedQuestion.answer}
                        onChange={(event) =>
                          updateQuestion("answer", event.target.value)
                        }
                      >
                        {selectedQuestion.choices.map((choice) => (
                          <option key={choice[0]} value={choice[0]}>
                            {choice[1]}
                          </option>
                        ))}
                      </select>
                    </label>

                    <div className="game-editor-subsection">                      
                      <div className="game-editor-card-head">
                        <h4>Answer Choices</h4>
                        <button className="teacher-text-button" onClick={addChoice} type="button">Add Choice</button>
                      </div>
                      {selectedQuestion.choices.map((choice, index) => (
                        <article
                          className="speaker-editor-card"
                          key={`${choice[0]}-${index}`}
                        >
                          <div className="choice-editor-row">
                            <label>
                              Answer
                              <input
                                value={choice[1]}
                                onChange={(event) =>
                                  updateChoice(index, 1, event.target.value)
                                }
                              />
                            </label>
                            <button
                              className="teacher-text-button danger"
                              onClick={() => deleteChoice(index)}
                              type="button"
                            >
                              Delete
                            </button>
                          </div>

                          {expandedAnswerAudio === choice[0] ? (
                            <div className="answer-audio-editor">
                              <label>
                                What this answer says
                                <input
                                  value={
                                    selectedQuestion.answerAudio?.[choice[0]]
                                      ?.audioText ?? choice[1]
                                  }
                                  onChange={(event) =>
                                    updateAnswerAudio(choice[0], {
                                      audioText: event.target.value,
                                    })
                                  }
                                />
                              </label>

                              <p className="pin-helper">
                                {selectedQuestion.answerAudio?.[choice[0]]
                                  ?.audioUrl
                                  ? selectedQuestion.answerAudio?.[choice[0]]
                                      ?.audioSourceText ===
                                    selectedQuestion.answerAudio?.[choice[0]]
                                      ?.audioText
                                    ? "Audio ready"
                                    : "Audio needs to be updated"
                                  : "No audio yet"}
                              </p>

                              <div className="recording-actions">
                                <button
                                  className="teacher-text-button"
                                  disabled={
                                    !selectedQuestion.answerAudio?.[choice[0]]
                                      ?.audioUrl
                                  }
                                  onClick={() =>
                                    void previewAnswerAudio(choice[0])
                                  }
                                  type="button"
                                >
                                  Preview Audio
                                </button>

                                <button
                                  className="teacher-text-button"
                                  disabled={isSaving}
                                  onClick={() =>
                                    void generateAnswerAudio(choice[0])
                                  }
                                  type="button"
                                >
                                  {selectedQuestion.answerAudio?.[choice[0]]
                                    ?.audioKind === "googleTts" &&
                                  selectedQuestion.answerAudio?.[choice[0]]
                                    ?.audioUrl
                                    ? "Regenerate AI Voice"
                                    : "Generate AI Voice"}
                                </button>

                                {recordingAnswerValue === choice[0] ? (
                                  <button
                                    className="teacher-text-button danger"
                                    onClick={stopRecording}
                                    type="button"
                                  >
                                    Stop Recording
                                  </button>
                                ) : (
                                  <button
                                    className="teacher-text-button"
                                    onClick={() =>
                                      void startAnswerRecording(choice[0])
                                    }
                                    type="button"
                                  >
                                    Record
                                  </button>
                                )}

                                {answerRecordingDrafts[choice[0]] ? (
                                  <>
                                    <button
                                      className="teacher-text-button"
                                      onClick={() =>
                                        void new Audio(
                                          answerRecordingDrafts[
                                            choice[0]
                                          ].url,
                                        ).play()
                                      }
                                      type="button"
                                    >
                                      Preview Recording
                                    </button>
                                    <button
                                      className="teacher-text-button"
                                      disabled={isSaving}
                                      onClick={() =>
                                        void uploadAnswerRecording(choice[0])
                                      }
                                      type="button"
                                    >
                                      Save Recording
                                    </button>
                                  </>
                                ) : null}

                                {selectedQuestion.answerAudio?.[choice[0]] ? (
                                  <button
                                    className="teacher-text-button danger"
                                    onClick={() =>
                                      void deleteAnswerAudio(choice[0])
                                    }
                                    type="button"
                                  >
                                    Remove Audio
                                  </button>
                                ) : null}

                                <button
                                  className="teacher-text-button"
                                  onClick={() => setExpandedAnswerAudio("")}
                                  type="button"
                                >
                                  Close Audio
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              className="teacher-text-button"
                              onClick={() => openAnswerAudio(choice)}
                              type="button"
                            >
                              {selectedQuestion.answerAudio?.[choice[0]]
                                ? "Edit Audio"
                                : "Add Audio"}
                            </button>
                          )}
                        </article>
                        ))}                    
                      </div>

                      <div className="game-editor-subsection">
                        <div className="game-editor-card-head">
                          <div>
                            <h4>Answer Style</h4>
                            <p className="pin-helper">
                              Choose how answer choices should appear in scholar reports.
                            </p>
                          </div>
                        </div>

                        <label>
                          Question kind
                          <select
                            value={selectedQuestion.answerStyle ?? "standard"}
                            onChange={(event) =>
                              updateAnswerStyle(
                                event.target.value === "listening-letters"
                                  ? "listening-letters"
                                  : "standard",
                              )
                            }
                          >
                            <option value="standard">
                              Words or pictures
                            </option>
                            <option value="listening-letters">
                              Listening choices (A, B, C)
                            </option>
                          </select>
                        </label>

                        {selectedQuestion.answerStyle ===
                        "listening-letters" ? (
                          <p className="field-help">
                            Reports will use each answer button’s spoken audio
                            text, such as green (B), instead of only B.
                          </p>
                        ) : null}
                      </div>

                    </div>

                    <div className="game-editor-tab-panel" hidden={activeEditorTab !== "voice"} role="tabpanel">
                    <div className="game-editor-subsection">
                      <div className="game-editor-card-head">
                        <h4>Speaker Buttons</h4>
                        <button className="teacher-text-button" onClick={addSpeakerButton} type="button">Add Speaker</button>
                      </div>
                      {speakerButtons.length ? speakerButtons.map((button) => (
                        <article className="speaker-editor-card" key={button.id}>
                          <div className="speaker-editor-top">
                            <label className="inline-check">
                              <input
                                checked={button.enabled}
                                onChange={(event) => updateSpeakerButton(button.id, { enabled: event.target.checked })}
                                type="checkbox"
                              />
                              On
                            </label>
                            <button className="teacher-text-button danger" onClick={() => deleteSpeakerButton(button.id)} type="button">Delete</button>
                          </div>
                          <div className="speaker-editor-grid">
                            <label>Label<input value={button.label} onChange={(event) => updateSpeakerButton(button.id, { label: event.target.value })} /></label>
                            <label>
                              Position
                              <select value={button.position} onChange={(event) => updateSpeakerButton(button.id, { position: event.target.value as SpeakerPosition })}>
                                <option value="left">Left of sentence</option>
                                <option value="right">Right of sentence</option>
                                <option value="above">Above sentence</option>
                                <option value="below">Below sentence</option>
                              </select>
                            </label>
                            <label>
                              Audio
                              <select value={button.audioKind} onChange={(event) => updateSpeakerButton(button.id, { audioKind: event.target.value as SpeakerAudioKind })}>
                                <option value="googleTts">Google AI voice</option>
                                <option value="teacherRecording">Teacher recording</option>
                              </select>
                            </label>
                          </div>
                          <label>What this button says<textarea rows={2} value={button.text} onChange={(event) => updateSpeakerButton(button.id, { text: event.target.value })} /></label>
                          <div className="recording-actions">
                            <button className="teacher-text-button" onClick={() => void previewSpeaker(button)} type="button">Preview Audio</button>
                            <button
                              className="teacher-text-button"
                              disabled={isSaving || !button.text.trim()}
                              onClick={() => void generateSpeakerAudio(button)}
                              type="button"
                            >
                              {button.audioKind === "googleTts" && button.audioUrl
                                ? "Regenerate AI Voice"
                                : "Generate AI Voice"}
                            </button>
                            {recordingSpeakerId === button.id ? (
                              <button
                                className="teacher-text-button danger"
                                onClick={stopRecording}
                                type="button"
                              >
                                Stop Recording
                              </button>
                            ) : (
                              <button
                                className="teacher-text-button"
                                onClick={() => void startRecording(button.id)}
                                type="button"
                              >
                                Record
                              </button>
                            )}                            
                            {recordingDrafts[button.id] ? (
                              <>
                                <button className="teacher-text-button" onClick={() => void new Audio(recordingDrafts[button.id].url).play()} type="button">Preview Recording</button>
                                <button className="teacher-text-button" disabled={isSaving} onClick={() => void uploadRecording(button)} type="button">Save Recording</button>
                              </>
                            ) : null}
                            {button.audioUrl ? (
                              <button className="teacher-text-button danger" onClick={() => void deleteRecording(button)} type="button">Delete Clip</button>
                            ) : null}
                          </div>
                        </article>
                      )) : <p>No speaker buttons for this question.</p>}
                    </div>
                    </div>
                  </div>
                ) : (
                  <p>No question selected.</p>
                )}

                <div className="game-editor-tab-panel game-editor-preview-panel" hidden={activeEditorTab !== "preview"} role="tabpanel">
                  <h4>Student Preview</h4>
                {selectedQuestion ? (
                  <article className="editor-question-preview">
                    <div className="preview-prompt">
                      <div className="preview-speakers above">
                        {speakerButtons.filter((button) => button.enabled && button.position === "above").map((button) => (
                          <button key={button.id} onClick={() => void previewSpeaker(button)} type="button">{button.label}</button>
                        ))}
                      </div>
                      <div className="preview-prompt-row">
                        {speakerButtons.filter((button) => button.enabled && button.position === "left").map((button) => (
                          <button key={button.id} onClick={() => void previewSpeaker(button)} type="button">{button.label}</button>
                        ))}
                        <p>{selectedQuestion.prompt}</p>
                        {speakerButtons.filter((button) => button.enabled && button.position === "right").map((button) => (
                          <button key={button.id} onClick={() => void previewSpeaker(button)} type="button">{button.label}</button>
                        ))}
                      </div>
                      <MathVisualPreview
                        question={selectedQuestion}
                      />
                      {selectedQuestion.questionImageUrl ? (
                        <img
                          alt={
                            selectedQuestion.questionImageAlt
                            || "Question preview"
                          }
                          src={selectedQuestion.questionImageUrl}
                          style={{
                            borderRadius: "18px",
                            display: "block",
                            margin: "16px auto",
                            maxHeight: "320px",
                            maxWidth: "100%",
                            objectFit: "contain",
                          }}
                        />
                      ) : null}
                      <div className="preview-target-row">
                        <div className="preview-speakers below">
                          {speakerButtons.filter((button) => button.enabled && button.position === "below").map((button) => (
                            <button key={button.id} onClick={() => void previewSpeaker(button)} type="button">{button.label}</button>
                          ))}
                        </div>
                        {selectedQuestion.display ? (
                          <div className="preview-display-target">
                            {selectedQuestion.display}
                          </div>
                        ) : null}
                      </div>
                    </div>
                    <div className="preview-answers">
                      {selectedQuestion.choices.map((choice) => (
                        <button
                          className={previewChoice === choice[0] ? (choice[0] === selectedQuestion.answer ? "is-correct" : "is-wrong") : ""}
                          key={choice[0]}
                          onClick={() => selectPreviewAnswer(choice[0])}                          
                          type="button"
                        >
                          {choice[1]}
                        </button>
                      ))}
                    </div>
                  </article>
                ) : null}
                  <div className="preview-question-navigation">
                    <button
                      className="teacher-text-button"
                      disabled={!previousQuestion}
                      onClick={() => {
                        if (!previousQuestion) return;
                        setSelectedQuestionId(previousQuestion.id);
                        setPreviewChoice("");
                      }}
                      type="button"
                    >
                      Previous Question
                    </button>
                    <span>
                      Question {selectedLevelQuestionIndex >= 0 ? selectedLevelQuestionIndex + 1 : 0} of {levelQuestions.length}
                    </span>
                    <button
                      className="teacher-text-button"
                      disabled={!nextQuestion}
                      onClick={() => {
                        if (!nextQuestion) return;
                        setSelectedQuestionId(nextQuestion.id);
                        setPreviewChoice("");
                      }}
                      type="button"
                    >
                      Next Question
                    </button>
                  </div>
                </div>
              </section>


            </div>
          </>
        ) : null}
      </section>
    </div>
  );
}
