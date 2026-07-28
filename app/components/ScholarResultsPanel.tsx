"use client";

import { useEffect, useMemo, useState } from "react";
import {
  authorizedTeachers,
  firebaseConfig,
  isAuthorizedTeacherEmail,
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
  delete: () => Promise<void>;
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

type ResultSubmission = {
  id: string;
  attempts: number;
  completedAt: unknown;
  correctAnswer?: string;
  gameId: string;
  gameTitle: string;
  incorrectSelections: unknown[];
  incorrectSelection?: string;
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
  questionIndex?: number;
  scholarDisplayName?: string;
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId?: string;
  score: number;
  soundSafariComplete?: boolean;
  teacherEmail: string;
  totalQuestions: number;
  word?: string;
};

type ProgressSubmission = {
  id: string;
  currentQuestionIndex: number;
  currentQuestionLabel: string;
  currentWord: string;
  gameId: string;
  gameTitle: string;
  levelId?: string;
  levelIndex?: number;
  levelName?: string;
  mode: string;
  percentComplete: number;
  questionsCompleted: number;
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId?: string;
  score: number;
  sessionId: string;
  status: string;
  teacherEmail: string;
  totalQuestions: number;
  updatedAt: unknown;
};

type MatchStatus = {
  label: string;
  scholar?: Scholar;
  tone: "ambiguous" | "matched" | "unmatched";
};

const SCHOLAR_COLLECTION = "gameHubScholars";
const RESULT_COLLECTION = "gameHubResultSubmissions";
const PROGRESS_COLLECTION = "gameHubProgressSubmissions";
const GAME_LABELS: Record<string, string> = {
  "ckla-unit-1-word-builder-blast": "CKLA Unit 1 - Full Practice",
  "ckla-unit-2-long-vowel-quest": "CKLA Unit 2 - Long Vowel Quest",
  "unit1-zone1-sound-safari": "CKLA Unit 1 - Sound Safari",
  "unit1-zone2-team-trail": "CKLA Unit 1 - Team Trail",
  "unit1-zone3-word-workshop": "CKLA Unit 1 - Word Workshop",
  "unit1-zone4-word-village": "CKLA Unit 1 - Word Village",
  "unit1-zone5-story-summit": "CKLA Unit 1 - Story Summit",
};
const SOUND_SAFARI_LEVELS = [
  { id: "level-1", name: "Back-to-School Basecamp", totalQuestions: 12 },
  { id: "level-2", name: "Code Trail", totalQuestions: 15 },
  { id: "level-3", name: "Digraph Crossing", totalQuestions: 15 },
  { id: "level-4", name: "Spelling Ridge", totalQuestions: 15 },
  { id: "level-5", name: "Sentence Springs", totalQuestions: 15 },
  { id: "level-6", name: "Unit 1 Summit", totalQuestions: 20 },
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

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
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

function mapScholar(doc: FirestoreDocSnapshot): Scholar {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    firstName: asText(data.firstName),
    firstNameKey: asText(data.firstNameKey),
    lastName: asText(data.lastName),
    lastNameKey: asText(data.lastNameKey),
    teacherEmail: asText(data.teacherEmail),
  };
}

function mapResult(doc: FirestoreDocSnapshot): ResultSubmission {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    attempts: asNumber(data.attempts),
    completedAt: data.completedAt,
    correctAnswer: asText(data.correctAnswer),
    gameId: asText(data.gameId),
    gameTitle: asText(data.gameTitle),
    incorrectSelections: asArray(data.incorrectSelections),
    incorrectSelection: asText(data.incorrectSelection),
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
    questionIndex: asNumber(data.questionIndex),
    scholarDisplayName: asText(data.scholarDisplayName),
    scholarFirstName: asText(data.scholarFirstName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    score: asNumber(data.score),
    soundSafariComplete: Boolean(data.soundSafariComplete),
    teacherEmail: asText(data.teacherEmail),
    totalQuestions: asNumber(data.totalQuestions),
    word: asText(data.word),
  };
}

function mapProgress(doc: FirestoreDocSnapshot): ProgressSubmission {
  const data = doc.data() ?? {};

  return {
    id: doc.id,
    currentQuestionIndex: asNumber(data.currentQuestionIndex),
    currentQuestionLabel: asText(data.currentQuestionLabel),
    currentWord: asText(data.currentWord),
    gameId: asText(data.gameId),
    gameTitle: asText(data.gameTitle),
    levelId: asText(data.levelId),
    levelIndex: asNumber(data.levelIndex),
    levelName: asText(data.levelName),
    mode: asText(data.mode) || "session-progress",
    percentComplete: asNumber(data.percentComplete),
    questionsCompleted: asNumber(data.questionsCompleted),
    scholarFirstName: asText(data.scholarFirstName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    score: asNumber(data.score),
    sessionId: asText(data.sessionId),
    status: asText(data.status),
    teacherEmail: asText(data.teacherEmail),
    totalQuestions: asNumber(data.totalQuestions),
    updatedAt: data.updatedAt,
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
    const matches = scholars.filter((scholar) => {
      const teacherMatches = result.teacherEmail === "unassigned" || scholar.teacherEmail === result.teacherEmail;
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

function gameTitleFor(gameId: string, fallback = "") {
  return GAME_LABELS[gameId] || fallback || gameId;
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

export function ScholarResultsPanel({ onClose }: { onClose: () => void }) {
  const [dateFilter, setDateFilter] = useState("");
  const [error, setError] = useState("");
  const [firstName, setFirstName] = useState("");
  const [gameFilter, setGameFilter] = useState("all");
  const [isAdding, setIsAdding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [lastName, setLastName] = useState("");
  const [progressRecords, setProgressRecords] = useState<ProgressSubmission[]>([]);
  const [results, setResults] = useState<ResultSubmission[]>([]);
  const [scholarFilter, setScholarFilter] = useState("all");
  const [scholars, setScholars] = useState<Scholar[]>([]);
  const [selectedScholarId, setSelectedScholarId] = useState("");
  const [status, setStatus] = useState("");
  const [teacherAccount, setTeacherAccount] = useState("");
  const [teacherFilter, setTeacherFilter] = useState("all");

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
      setTeacherFilter((currentFilter) => (currentFilter === "all" ? signedInEmail : currentFilter));

      const [scholarSnapshot, resultSnapshot, progressSnapshot] = await Promise.all([
        db.collection(SCHOLAR_COLLECTION).get(),
        db.collection(RESULT_COLLECTION).get(),
        db.collection(PROGRESS_COLLECTION).get(),
      ]);

      const nextScholars = scholarSnapshot.docs
        .map(mapScholar)
        .sort((a, b) =>
          `${teacherLabelForEmail(a.teacherEmail)} ${a.firstName} ${a.lastName}`.localeCompare(
            `${teacherLabelForEmail(b.teacherEmail)} ${b.firstName} ${b.lastName}`,
          ),
        );

      setScholars(nextScholars);
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

  const visibleScholars = useMemo(() => {
    if (teacherFilter === "all") {
      return scholars;
    }

    return scholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
  }, [scholars, teacherFilter]);

  const filteredResults = useMemo(() => {
    return results.filter((result) => {
      const teacherScopedScholars =
        teacherFilter === "all"
          ? scholars
          : scholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
      const match = matchResult(result, teacherScopedScholars);

      if (teacherFilter !== "all") {
        if (result.teacherEmail !== "unassigned" && result.teacherEmail !== teacherFilter) {
          return false;
        }

        if (result.teacherEmail === "unassigned" && !match.scholar) {
          return false;
        }
      }

      if (scholarFilter !== "all" && match.scholar?.id !== scholarFilter) {
        return false;
      }

      if (gameFilter !== "all" && result.gameId !== gameFilter) {
        return false;
      }

      if (dateFilter && toDateInputValue(result.completedAt) !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [dateFilter, gameFilter, results, scholarFilter, scholars, teacherFilter]);

  const filteredProgress = useMemo(() => {
    return progressRecords.filter((progress) => {
      if (progress.status === "completed") {
        return false;
      }

      const teacherScopedScholars =
        teacherFilter === "all"
          ? scholars
          : scholars.filter((scholar) => scholar.teacherEmail === teacherFilter);
      const match = matchResult(progress, teacherScopedScholars);

      if (teacherFilter !== "all") {
        if (progress.teacherEmail !== "unassigned" && progress.teacherEmail !== teacherFilter) {
          return false;
        }

        if (progress.teacherEmail === "unassigned" && !match.scholar) {
          return false;
        }
      }

      if (scholarFilter !== "all" && match.scholar?.id !== scholarFilter) {
        return false;
      }

      if (gameFilter !== "all" && progress.gameId !== gameFilter) {
        return false;
      }

      if (dateFilter && toDateInputValue(progress.updatedAt) !== dateFilter) {
        return false;
      }

      return true;
    });
  }, [dateFilter, gameFilter, progressRecords, scholarFilter, scholars, teacherFilter]);

  const selectedScholar = useMemo(
    () => scholars.find((scholar) => scholar.id === selectedScholarId) ?? null,
    [scholars, selectedScholarId],
  );

  const resultsForScholar = (scholar: Scholar) =>
    results.filter((result) => matchResult(result, [scholar]).scholar?.id === scholar.id);

  const selectedScholarResults = useMemo(
    () => (selectedScholar ? resultsForScholar(selectedScholar) : []),
    [results, selectedScholar],
  );

  const selectedScholarProgress = useMemo(
    () =>
      selectedScholar
        ? progressRecords.filter(
            (progress) =>
              progress.status !== "completed"
              && matchResult(progress, [selectedScholar]).scholar?.id === selectedScholar.id,
          )
        : [],
    [progressRecords, selectedScholar],
  );

  const selectedSoundSafariStatuses = useMemo(
    () => soundSafariStatuses(selectedScholarResults),
    [selectedScholarResults],
  );

  const recentResults = filteredResults.slice(0, 8);
  const recentProgress = filteredProgress.slice(0, 8);

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

      await db.collection(SCHOLAR_COLLECTION).add({
        active: true,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        firstName: cleanFirstName,
        firstNameKey,
        lastName: cleanLastName,
        lastNameKey,
        teacherEmail: signedInEmail,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
      });

      setFirstName("");
      setLastName("");
      setStatus(`${cleanFirstName} was added to the private roster.`);
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

      if (scholar.teacherEmail !== auth.currentUser?.email?.trim().toLowerCase()) {
        throw new Error("You can view the other teacher roster, but only delete scholars from your own roster.");
      }

      await db.collection(SCHOLAR_COLLECTION).doc(scholar.id).delete();
      setStatus(`${scholar.firstName} ${scholar.lastName} was removed from the private roster.`);
      await loadDashboardData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "The scholar could not be deleted.");
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
            <td>${status.locked ? "Locked" : status.mastered ? "3/3 Mastered" : `${status.masteryCount}/3`}</td>
            <td>${status.attemptsLeft}</td>
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
            return `
              <li>
                <strong>${escapeReportHtml(gameTitleFor(progress.gameId, progress.gameTitle))}</strong><br>
                ${escapeReportHtml(progress.levelName || "Game")} - reached question ${progress.currentQuestionIndex}/${progress.totalQuestions}<br>
                ${escapeReportHtml(updatedAt ? updatedAt.toLocaleString() : "Date pending")}<br>
                Last seen: ${escapeReportHtml(progress.currentWord || "Question")} - ${escapeReportHtml(progress.currentQuestionLabel)}
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
                <p>${escapeReportHtml(completedAt ? completedAt.toLocaleString() : "Date pending")}</p>
                <p>${escapeReportHtml(result.levelName ? `${result.levelName} - ` : "")}Score ${result.score}/${result.totalQuestions} - Attempts ${result.attempts}${result.masteryTarget ? ` - Mastery ${result.masteryCount ?? 0}/${result.masteryTarget}` : ""}</p>
                <h4>Missed</h4>
                <ul>${missedHtml}</ul>
              </section>
            `;
          })
          .join("")
      : "<p>No saved results yet.</p>";

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
          p,li,td,th{font-size:14px;line-height:1.4}
          table{width:100%;border-collapse:collapse;margin:10px 0 20px}
          th,td{border:1px solid #ddd;padding:8px;text-align:left}
          th{background:#fff0c8}
          .result-card{break-inside:avoid;border:1px solid #ddd;border-radius:10px;padding:14px;margin:0 0 14px}
        </style>
      </head>
      <body>
        <h1>${escapeReportHtml(selectedScholar.firstName)} ${escapeReportHtml(selectedScholar.lastName)}</h1>
        <p>${escapeReportHtml(teacherLabelForEmail(selectedScholar.teacherEmail))}</p>
        <h2>Sound Safari Progress</h2>
        <table>
          <thead>
            <tr><th>Level</th><th>Mastery</th><th>Left</th><th>Attempts</th><th>Missed</th></tr>
          </thead>
          <tbody>${progressHtml}</tbody>
        </table>
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

  return (
    <div aria-modal="true" className="scholar-results-overlay" role="dialog">
      <section className="scholar-results-panel">
        <div className="scholar-results-header">
          <div>
            <p className="eyebrow">Teacher Edit</p>
            <h2>Rosters & Results</h2>
            {teacherAccount ? <p className="pin-helper">{teacherLabelForEmail(teacherAccount)} roster</p> : null}
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

        <div className="scholar-results-grid">
          <section className="teacher-card roster-add-card">
            <h3>Add Scholar</h3>
            <p className="pin-helper">
              Adding a scholar puts them in {teacherLabelForEmail(teacherAccount)} roster.
            </p>
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
                {isAdding ? "Adding..." : "Add Scholar"}
              </button>
            </form>

          </section>

          <section className="teacher-card roster-browser-card">
            <h3>Rosters</h3>
            <div className="teacher-filter-tabs" aria-label="Roster teacher filter">
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
              {isLoading ? <p>Loading private roster...</p> : null}
              {!isLoading && !visibleScholars.length ? <p>No scholars added yet for this view.</p> : null}
              {visibleScholars.map((scholar) => {
                const scholarResults = resultsForScholar(scholar);

                return (
                  <article className="roster-card" key={scholar.id}>
                    <button onClick={() => setSelectedScholarId(scholar.id)} type="button">
                      <span className="roster-initials">{initialsForScholar(scholar)}</span>
                      <span>
                        <strong>{scholar.firstName} {scholar.lastName}</strong>
                        <small>{teacherLabelForEmail(scholar.teacherEmail)} - {scholarResults.length} result{scholarResults.length === 1 ? "" : "s"}</small>
                      </span>
                    </button>
                    {scholar.teacherEmail === teacherAccount ? (
                      <button className="teacher-text-button danger" onClick={() => void deleteScholar(scholar)} type="button">
                        Delete
                      </button>
                    ) : (
                      <span className="view-only-label">View only</span>
                    )}
                  </article>
                );
              })}
            </div>
          </section>

          <section className="teacher-card results-overview-card">
            <h3>Recent Results</h3>
            <div className="result-filters">
              <label>
                Teacher
                <select onChange={(event) => setTeacherFilter(event.target.value)} value={teacherFilter}>
                  <option value="all">All teachers</option>
                  {authorizedTeachers.map((teacher) => (
                    <option key={teacher.email} value={teacher.email}>
                      {teacher.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Scholar
                <select onChange={(event) => setScholarFilter(event.target.value)} value={scholarFilter}>
                  <option value="all">All scholars</option>
                  {visibleScholars.map((scholar) => (
                    <option key={scholar.id} value={scholar.id}>
                      {scholar.firstName} {scholar.lastName} - {teacherLabelForEmail(scholar.teacherEmail)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Game
                <select onChange={(event) => setGameFilter(event.target.value)} value={gameFilter}>
                  <option value="all">All games</option>
                  {gameOptions.map(([gameId, gameTitle]) => (
                    <option key={gameId} value={gameId}>
                      {gameTitle}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Date
                <input onChange={(event) => setDateFilter(event.target.value)} type="date" value={dateFilter} />
              </label>
            </div>

            <div className="result-list">
              {isLoading ? <p>Loading saved results...</p> : null}
              {!isLoading && !recentResults.length ? <p>No results match these filters yet.</p> : null}
              {recentResults.map((result) => {
                const matched = matchResult(result, teacherFilter === "all" ? scholars : visibleScholars);
                const completedAt = formatDate(result.completedAt);
                const isWholeClassMiss = result.mode === "whole-class-miss";
                const firstMiss = result.missedQuestions[0];

                return (
                  <article className="result-row" key={result.id}>
                    <div className="result-row-head">
                      <div>
                        <strong>{result.scholarFirstName}</strong>
                        <span className={`match-pill ${matched.tone}`}>{matched.label}</span>
                        {matched.scholar ? <span className="match-pill">{teacherLabelForEmail(matched.scholar.teacherEmail)}</span> : null}
                        {isWholeClassMiss ? <span className="match-pill">Whole Class Mode</span> : null}
                      </div>
                      <button className="teacher-text-button danger" onClick={() => void deleteResult(result)} type="button">
                        Delete Result
                      </button>
                    </div>
                    <p>{gameTitleFor(result.gameId, result.gameTitle)}</p>
                    {isWholeClassMiss ? (
                      <p>
                        {completedAt ? completedAt.toLocaleString() : "Date pending"} - {formatMissedContext(firstMiss)}
                        {formatMissedText(result.word, result.incorrectSelection, result.correctAnswer)}
                      </p>
                    ) : (
                      <p>
                        {completedAt ? completedAt.toLocaleString() : "Date pending"} - {result.levelName ? `${result.levelName} - ` : ""}Score {result.score}/{result.totalQuestions} - Attempts {result.attempts}
                        {result.masteryTarget ? ` - Mastery ${result.masteryCount ?? 0}/${result.masteryTarget}` : ""}
                      </p>
                    )}
                    {!isWholeClassMiss && result.missedQuestions.length ? (
                      <div className="missed-list">
                        <strong>Missed</strong>
                        {result.missedQuestions.map((missed, index) => (
                          <p key={`${result.id}-${index}`}>
                            {formatMissedContext(missed)}
                            {formatMissedText(missed.word || `Question ${missed.questionIndex ?? index + 1}`, missed.incorrectSelections?.join(", "), missed.correctAnswer)}
                          </p>
                        ))}
                      </div>
                    ) : !isWholeClassMiss ? (
                      <p>No missed questions recorded.</p>
                    ) : null}
                  </article>
                );
              })}
            </div>

            <div className="unfinished-section">
              <h4>Started But Not Finished</h4>
              <div className="result-list">
                {isLoading ? <p>Loading unfinished sessions...</p> : null}
                {!isLoading && !recentProgress.length ? <p>No unfinished sessions match these filters.</p> : null}
                {recentProgress.map((progress) => {
                  const matched = matchResult(progress, teacherFilter === "all" ? scholars : visibleScholars);
                  const updatedAt = formatDate(progress.updatedAt);

                  return (
                    <article className="result-row progress-row" key={progress.id}>
                      <div className="result-row-head">
                        <div>
                          <strong>{progress.scholarFirstName}</strong>
                          <span className={`match-pill ${matched.tone}`}>{matched.label}</span>
                          {matched.scholar ? <span className="match-pill">{teacherLabelForEmail(matched.scholar.teacherEmail)}</span> : null}
                          <span className="match-pill">{progressStatusLabel(progress.status)}</span>
                        </div>
                        <button className="teacher-text-button danger" onClick={() => void deleteProgress(progress)} type="button">
                          Delete
                        </button>
                      </div>
                      <p>{gameTitleFor(progress.gameId, progress.gameTitle)}</p>
                      <p>
                        {updatedAt ? updatedAt.toLocaleString() : "Date pending"} - {progress.levelName ? `${progress.levelName} - ` : ""}reached question {progress.currentQuestionIndex}/{progress.totalQuestions}
                      </p>
                      <p>
                        Last seen: {progress.currentWord || "Question"} - {progress.currentQuestionLabel}
                      </p>
                    </article>
                  );
                })}
              </div>
            </div>
          </section>
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
              </div>
              <div className="student-detail-actions">
                <button className="teacher-control-button" onClick={printSelectedScholarReport} type="button">
                  Print Results
                </button>
                <button className="teacher-control-button secondary" onClick={() => setSelectedScholarId("")} type="button">
                  Close
                </button>
              </div>
            </div>

            <section className="sound-safari-summary">
              <h4>Sound Safari Progress</h4>
              <div className="sound-safari-level-grid">
                {selectedSoundSafariStatuses.map((status) => (
                  <article
                    className={`sound-safari-level-card ${status.mastered ? "is-mastered" : ""} ${status.locked ? "is-locked" : ""}`}
                    key={status.level.id}
                  >
                    <strong>{status.level.name}</strong>
                    <span>
                      {status.locked
                        ? "Locked"
                        : status.mastered
                          ? "3 of 3 - Mastered"
                          : `${status.masteryCount} of 3 - ${status.attemptsLeft} left`}
                    </span>
                    <small>
                      {status.totalAttempts} attempt{status.totalAttempts === 1 ? "" : "s"} - {status.wrongCount} missed question{status.wrongCount === 1 ? "" : "s"}
                    </small>
                  </article>
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
                      </article>
                    );
                  })}
                </div>
              ) : null}

              {!selectedScholarResults.length ? <p>No results for this scholar yet.</p> : null}
              {selectedScholarResults.map((result) => {
                const completedAt = formatDate(result.completedAt);
                const isWholeClassMiss = result.mode === "whole-class-miss";
                const firstMiss = result.missedQuestions[0];

                return (
                  <article className="student-result-card" key={result.id}>
                    <div className="result-row-head">
                      <div>
                        <strong>{gameTitleFor(result.gameId, result.gameTitle)}</strong>
                        {isWholeClassMiss ? <span className="match-pill">Whole Class Mode</span> : null}
                      </div>
                      <button className="teacher-text-button danger" onClick={() => void deleteResult(result)} type="button">
                        Delete Result
                      </button>
                    </div>
                    <p>{completedAt ? completedAt.toLocaleString() : "Date pending"}</p>
                    {isWholeClassMiss ? (
                      <p>
                        {formatMissedContext(firstMiss)}
                        {formatMissedText(result.word, result.incorrectSelection, result.correctAnswer)}
                      </p>
                    ) : (
                      <>
                        <p>
                          {result.levelName ? `${result.levelName} - ` : ""}Score {result.score}/{result.totalQuestions} - Attempts {result.attempts}
                          {result.masteryTarget ? ` - Mastery ${result.masteryCount ?? 0}/${result.masteryTarget}` : ""}
                        </p>
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
          </section>
        </div>
      ) : null}
    </div>
  );
}
