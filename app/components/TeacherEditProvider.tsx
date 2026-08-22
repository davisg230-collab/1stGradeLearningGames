"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { firebaseConfig, isAuthorizedTeacherEmail, teacherEmail } from "../firebase-config";
import { GameEditorPanel } from "./GameEditorPanel";
import { ScholarResultsPanel } from "./ScholarResultsPanel";

export type CardEdit = {
  description?: string;
  icon?: string;
  sortOrder?: number;
  title?: string;
  underConstruction?: boolean;
};

type TeacherEditContextValue = {
  editedCards: Record<string, CardEdit>;
  errorMessage: string;
  isEditing: boolean;
  isSaving: boolean;
  openGameEditor: (gameId?: string) => void;
  resetCard: (cardKey: string) => void;
  statusMessage: string;
  updateCard: (cardKey: string, update: CardEdit) => void;
  updateCardOrder: (updates: Record<string, CardEdit>) => void;
};

type FirebaseUser = {
  email: string | null;
};

type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
  signInWithPopup: (provider: unknown) => Promise<{ user?: FirebaseUser | null }>;
  signOut: () => Promise<void>;
};

type FirestoreDocSnapshot = {
  data: () => unknown;
  exists: boolean;
  id: string;
};

type FirestoreQuerySnapshot = {
  docs: FirestoreDocSnapshot[];
};

type FirestoreDocRef = {
  delete: () => Promise<void>;
  set: (data: unknown, options?: { merge?: boolean }) => Promise<void>;
};

type FirestoreCollectionRef = {
  add: (data: unknown) => Promise<unknown>;
  doc: (id: string) => FirestoreDocRef;
  get: () => Promise<FirestoreQuerySnapshot>;
};

type FirestoreDb = {
  collection: (path: string) => FirestoreCollectionRef;
};

type FirebaseNamespace = {
  analytics?: () => unknown;
  apps: unknown[];
  auth: {
    (): FirebaseAuth;
    GoogleAuthProvider: new () => unknown;
  };
  firestore: {
    (): FirestoreDb;
    FieldValue: {
      serverTimestamp: () => unknown;
    };
  };
  initializeApp: (config: typeof firebaseConfig) => unknown;
};

type FirebaseServices = {
  auth: FirebaseAuth;
  db: FirestoreDb;
  firebase: FirebaseNamespace;
};

type TeacherLogAction =
  | "enter-edit-mode"
  | "exit-edit-mode"
  | "reset-card"
  | "update-card"
  | "update-card-order";

declare global {
  interface Window {
    firebase?: FirebaseNamespace;
  }
}

const EDIT_STORAGE_KEY = "first-grade-game-hub-card-edits";
const EDIT_LOG_STORAGE_KEY = "first-grade-game-hub-edit-log";
const CARD_COLLECTION = "gameHubCards";
const GAME_DEFINITION_COLLECTION = "gameHubGameDefinitions";

function gameIdForCardKey(cardKey: string) {
  if (cardKey === "CKLA Skills:starting-point") {
    return "skills-starting-point";
  }

  if (cardKey === "CKLA Skills:letter-search-safari") {
    return "letter-search-safari";
  }

  if (cardKey === "Math:starting-point") {
    return "math-starting-point-quest";
  }

  if (cardKey === "Math:number-search-safari") {
    return "number-search-safari";
  }

  const mathMatch = /^Eureka Math:module-(\d+)$/.exec(cardKey);

  if (mathMatch) {
    return `eureka-math-module-${Number(mathMatch[1])}`;
  }

  const listeningMatch =
    /^CKLA Listening & Learning:unit-(\d+)$/.exec(cardKey);

  if (listeningMatch) {
    return `ckla-listening-learning-unit-${Number(listeningMatch[1])}`;
  }

  const skillsMatch = /^CKLA Skills:unit-(\d+)$/.exec(cardKey);

  if (!skillsMatch) {
    return "";
  }

  const unitNumber = Number(skillsMatch[1]);

  if (unitNumber === 1) {
    return "unit1-zone1-sound-safari";
  }

  if (unitNumber === 2) {
    return "ckla-unit-2-long-vowel-quest";
  }

  return `ckla-unit-${unitNumber}-skills-quest`;
}
const LOG_COLLECTION = "gameHubTeacherLogs";
const FIREBASE_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics-compat.js",
];

const TeacherEditContext = createContext<TeacherEditContextValue | null>(null);

let firebaseLoadPromise: Promise<FirebaseServices> | null = null;

function normalizeEmail(email: string | null | undefined) {
  return email?.trim().toLowerCase() ?? "";
}

function isAuthorizedTeacher(email: string | null | undefined) {
  return isAuthorizedTeacherEmail(email);
}

function firebaseErrorMessage(error: unknown, fallback: string) {
  const code =
    error && typeof error === "object" && "code" in error
      ? String((error as { code?: unknown }).code)
      : "";

  if (code === "auth/popup-closed-by-user") {
    return "The Google sign-in window was closed before sign-in finished.";
  }

  if (code === "auth/unauthorized-domain") {
    return "Firebase needs this website domain added as an authorized sign-in domain.";
  }

  if (code === "permission-denied" || code === "firestore/permission-denied") {
    return "Missing or insufficient permissions. Publish the Firestore rules for this project, then try again.";
  }

  return fallback;
}

function readStoredEdits() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    return normalizeCardEdits(
      JSON.parse(window.localStorage.getItem(EDIT_STORAGE_KEY) ?? "{}"),
    );
  } catch {
    return {};
  }
}

function writeStoredEdits(edits: Record<string, CardEdit>) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(EDIT_STORAGE_KEY, JSON.stringify(edits));
}

function normalizeCardEdit(value: unknown): CardEdit | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const rawEdit = value as Record<string, unknown>;
  const edit: CardEdit = {};

  if (typeof rawEdit.description === "string") {
    edit.description = rawEdit.description;
  }

  if (typeof rawEdit.icon === "string") {
    edit.icon = rawEdit.icon;
  }

  if (typeof rawEdit.sortOrder === "number" && Number.isFinite(rawEdit.sortOrder)) {
    edit.sortOrder = rawEdit.sortOrder;
  }

  if (typeof rawEdit.title === "string") {
    edit.title = rawEdit.title;
  }

  if (typeof rawEdit.underConstruction === "boolean") {
    edit.underConstruction = rawEdit.underConstruction;
  }

  return Object.keys(edit).length > 0 ? edit : null;
}

function cardPayloadForSave(
  edit: CardEdit,
  serverTime: unknown,
  updatedBy: string,
) {
  return {
    description: edit.description ?? "",
    icon: edit.icon ?? "",
    ...(typeof edit.sortOrder === "number" ? { sortOrder: edit.sortOrder } : {}),
    title: edit.title ?? "",
    ...(typeof edit.underConstruction === "boolean"
      ? { underConstruction: edit.underConstruction }
      : {}),
    updatedAt: serverTime,
    updatedBy,
  };
}

function normalizeCardEdits(value: unknown): Record<string, CardEdit> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([cardKey, cardValue]) => {
      const edit = normalizeCardEdit(cardValue);
      return edit ? [[cardKey, edit]] : [];
    }),
  );
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${src}"]`,
    );

    if (existing) {
      if (existing.dataset.ready === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener(
        "error",
        () => reject(new Error("Firebase could not load.")),
        { once: true },
      );
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.src = src;
    script.addEventListener(
      "load",
      () => {
        script.dataset.ready = "true";
        resolve();
      },
      { once: true },
    );
    script.addEventListener(
      "error",
      () => reject(new Error("Firebase could not load.")),
      { once: true },
    );
    document.head.append(script);
  });
}

async function loadFirebase() {
  if (typeof window === "undefined") {
    throw new Error("Firebase only runs in the browser.");
  }

  firebaseLoadPromise ??= (async () => {
    for (const src of FIREBASE_SCRIPTS) {
      await loadScript(src);
    }

    const firebase = window.firebase;

    if (!firebase) {
      throw new Error("Firebase did not start.");
    }

    if (firebase.apps.length === 0) {
      firebase.initializeApp(firebaseConfig);
    }

    try {
      firebase.analytics?.();
    } catch {
      // Analytics may be unavailable in some local-preview browsers.
    }

    return {
      auth: firebase.auth(),
      db: firebase.firestore(),
      firebase,
    };
  })();

  return firebaseLoadPromise;
}

async function readFirebaseEdits(db: FirestoreDb) {
  const snapshot = await db.collection(CARD_COLLECTION).get();

  return Object.fromEntries(
    snapshot.docs.flatMap((document) => {
      const edit = normalizeCardEdit(document.data());
      return edit ? [[document.id, edit]] : [];
    }),
  );
}

function writeLocalLog(action: TeacherLogAction, email: string, cardKey?: string) {
  if (typeof window === "undefined") {
    return;
  }

  const entry = {
    action,
    cardKey,
    email,
    timestamp: new Date().toISOString(),
  };

  try {
    const current = JSON.parse(
      window.localStorage.getItem(EDIT_LOG_STORAGE_KEY) ?? "[]",
    );
    current.push(entry);
    window.localStorage.setItem(EDIT_LOG_STORAGE_KEY, JSON.stringify(current));
  } catch {
    window.localStorage.setItem(EDIT_LOG_STORAGE_KEY, JSON.stringify([entry]));
  }
}

export function TeacherEditProvider({ children }: { children: ReactNode }) {
  const [isEditing, setIsEditing] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Loading saved card edits...");
  const [errorMessage, setErrorMessage] = useState("");
  const [hasTeacherAttemptedEdit, setHasTeacherAttemptedEdit] = useState(false);
  const [editedCards, setEditedCards] = useState<Record<string, CardEdit>>({});
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGameEditorOpen, setIsGameEditorOpen] = useState(false);
  const [isScholarResultsOpen, setIsScholarResultsOpen] = useState(false);
  const editedCardsRef = useRef<Record<string, CardEdit>>({});
  const teacherEmailRef = useRef<string>(teacherEmail);

  useEffect(() => {
    let unsubscribeAuth: (() => void) | undefined;
    let isMounted = true;

    const stored = readStoredEdits();
    editedCardsRef.current = stored;
    setEditedCards(stored);

    void loadFirebase()
      .then(({ auth, db }) => {
        unsubscribeAuth = auth.onAuthStateChanged((user) => {
          const email = normalizeEmail(user?.email);

          if (!email) {
            if (isMounted) {
              setIsEditing(false);
            }
            return;
          }

          if (isAuthorizedTeacher(email)) {
            teacherEmailRef.current = email;
            return;
          }

          if (isMounted) {
            setIsEditing(false);
            setErrorMessage("Only an authorized teacher account can use teacher edit mode.");
          }
        });

        return readFirebaseEdits(db);
      })
      .then((remoteEdits) => {
        if (!isMounted) {
          return;
        }

        editedCardsRef.current = remoteEdits;
        setEditedCards(remoteEdits);
        writeStoredEdits(remoteEdits);
        setStatusMessage("Teacher tools are ready.");
        setErrorMessage("");
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setStatusMessage("Using the built-in card list for now.");
        setErrorMessage(
          firebaseErrorMessage(
            error,
            "Firebase edits could not load. The public site still works.",
          ),
        );
      });

    return () => {
      isMounted = false;
      unsubscribeAuth?.();
    };
  }, []);

  async function signInTeacherAccount() {
    const services = await loadFirebase();
    const currentEmail = normalizeEmail(services.auth.currentUser?.email);

    if (currentEmail && !isAuthorizedTeacher(currentEmail)) {
      await services.auth.signOut().catch(() => undefined);
    }

    if (!isAuthorizedTeacher(services.auth.currentUser?.email)) {
      const provider = new services.firebase.auth.GoogleAuthProvider();
      const result = await services.auth.signInWithPopup(provider);
      const signedInEmail =
        normalizeEmail(result.user?.email) ||
        normalizeEmail(services.auth.currentUser?.email);

      if (!isAuthorizedTeacher(signedInEmail)) {
        await services.auth.signOut().catch(() => undefined);
        throw new Error("Please sign in with an authorized teacher account.");
      }
    }

    const signedInEmail = normalizeEmail(services.auth.currentUser?.email);
    teacherEmailRef.current = signedInEmail;
    return services;
  }

  async function recordTeacherLog(action: TeacherLogAction, cardKey?: string) {
    const email = teacherEmailRef.current;
    writeLocalLog(action, email, cardKey);

    const services = await loadFirebase();
    await services.db.collection(LOG_COLLECTION).add({
      action,
      cardKey: cardKey ?? null,
      email,
      timestamp: services.firebase.firestore.FieldValue.serverTimestamp(),
    });
  }

  async function openTeacherEdit() {
    setHasTeacherAttemptedEdit(true);
    setIsConnecting(true);
    setErrorMessage("");

    try {
      const services = await signInTeacherAccount();
      const remoteEdits = await readFirebaseEdits(services.db);
      editedCardsRef.current = remoteEdits;
      setEditedCards(remoteEdits);
      writeStoredEdits(remoteEdits);
      setIsEditing(true);
      setStatusMessage("Teacher edits are saving.");
      void recordTeacherLog("enter-edit-mode").catch((error) => {
        setErrorMessage(
          firebaseErrorMessage(error, "Teacher sign-in worked, but the edit log did not save."),
        );
      });
    } catch (error) {
      setErrorMessage(firebaseErrorMessage(error, "Firebase sign-in failed."));
      setStatusMessage("Google sign-in is needed before editing.");
    } finally {
      setIsConnecting(false);
    }
  }

  function saveNextEdits(
    nextEdits: Record<string, CardEdit>,
    action: TeacherLogAction,
    cardKey: string,
    saveRemoteEdit: (services: FirebaseServices) => Promise<void>,
  ) {
    editedCardsRef.current = nextEdits;
    setEditedCards(nextEdits);
    writeStoredEdits(nextEdits);
    setIsSaving(true);
    setErrorMessage("");

    void loadFirebase()
      .then(async (services) => {
        if (!isAuthorizedTeacher(services.auth.currentUser?.email)) {
          throw new Error("Please sign in with an authorized teacher account before saving.");
        }

        await saveRemoteEdit(services);
        await recordTeacherLog(action, cardKey);
        setStatusMessage("Saved.");
      })
      .catch((error) => {
        setErrorMessage(firebaseErrorMessage(error, "That change did not save to Firebase."));
        setStatusMessage("The card changed on this screen, but Firebase did not save it yet.");
      })
      .finally(() => setIsSaving(false));
  }

  function updateCard(cardKey: string, update: CardEdit) {
    const next = {
      ...editedCardsRef.current,
      [cardKey]: {
        ...editedCardsRef.current[cardKey],
        ...update,
      },
    };

    saveNextEdits(next, "update-card", cardKey, async (services) => {
      const serverTime =
        services.firebase.firestore.FieldValue.serverTimestamp();
      const savedCard = next[cardKey];

      await services.db.collection(CARD_COLLECTION).doc(cardKey).set(
        cardPayloadForSave(savedCard, serverTime, teacherEmailRef.current),
        { merge: true },
      );

      const title = savedCard.title?.trim();
      const gameId = gameIdForCardKey(cardKey);

      if (!title || !gameId) {
        return;
      }

      const gameRef = services.db
          .collection(GAME_DEFINITION_COLLECTION)
          .doc(gameId);
      const gameSnapshot = await gameRef.get();

      if (!gameSnapshot.exists) {
        return;
      }

      const gameData = gameSnapshot.data() ?? {};
      const versionIds = [
        gameData.draftVersion,
        gameData.publishedVersion,
      ].filter(
        (value): value is string =>
          typeof value === "string" && Boolean(value.trim()),
      );

      await gameRef.set(
        {
          title,
          updatedAt: serverTime,
          updatedBy: teacherEmailRef.current,
        },
        { merge: true },
      );

      for (const versionId of new Set(versionIds)) {
        const versionRef = gameRef
            .collection("versions")
            .doc(versionId);
        const versionSnapshot = await versionRef.get();

        if (!versionSnapshot.exists) {
          continue;
        }

        const versionData = versionSnapshot.data() ?? {};
        const content =
          versionData.content
          && typeof versionData.content === "object"
          && !Array.isArray(versionData.content)
            ? versionData.content as Record<string, unknown>
            : {};

        await versionRef.set({
          ...versionData,
          content: {
            ...content,
            unitTitle: title,
          },
          updatedAt: serverTime,
          updatedBy: teacherEmailRef.current,
        });
      }
    });
  }

  function updateCardOrder(updates: Record<string, CardEdit>) {
    const next = {
      ...editedCardsRef.current,
    };

    Object.entries(updates).forEach(([cardKey, update]) => {
      next[cardKey] = {
        ...next[cardKey],
        ...update,
      };
    });

    editedCardsRef.current = next;
    setEditedCards(next);
    writeStoredEdits(next);
    setIsSaving(true);
    setErrorMessage("");

    void loadFirebase()
      .then(async (services) => {
        if (!isAuthorizedTeacher(services.auth.currentUser?.email)) {
          throw new Error("Please sign in with an authorized teacher account before saving.");
        }

        const serverTime =
          services.firebase.firestore.FieldValue.serverTimestamp();

        await Promise.all(
          Object.entries(updates).map(([cardKey]) =>
            services.db.collection(CARD_COLLECTION).doc(cardKey).set(
              cardPayloadForSave(next[cardKey], serverTime, teacherEmailRef.current),
              { merge: true },
            ),
          ),
        );
        await recordTeacherLog("update-card-order");
        setStatusMessage("Card order saved.");
      })
      .catch((error) => {
        setErrorMessage(firebaseErrorMessage(error, "That card order did not save to Firebase."));
        setStatusMessage("The order changed on this screen, but Firebase did not save it yet.");
      })
      .finally(() => setIsSaving(false));
  }

  function resetCard(cardKey: string) {
    const next = { ...editedCardsRef.current };
    delete next[cardKey];

    saveNextEdits(next, "reset-card", cardKey, async (services) => {
      await services.db.collection(CARD_COLLECTION).doc(cardKey).delete();
    });
  }

  function exitEditMode() {
    setIsEditing(false);
    setIsGameEditorOpen(false);
    setIsScholarResultsOpen(false);
    setStatusMessage("Teacher edit mode is off.");
    void recordTeacherLog("exit-edit-mode").catch(() => undefined);
    void loadFirebase()
      .then(({ auth }) => auth.signOut())
      .catch(() => undefined);
  }

  function openGameEditor(gameId?: string) {
    if (gameId) {
      window.sessionStorage.setItem("first-grade-learning-games-editor-game-id", gameId);
    }
    setIsGameEditorOpen(true);
    setIsScholarResultsOpen(false);
  }

  const value = useMemo<TeacherEditContextValue>(
    () => ({
      editedCards,
      errorMessage,
      isEditing,
      isSaving,
      openGameEditor,
      resetCard,
      statusMessage,
      updateCard,
      updateCardOrder,
    }),
    [editedCards, errorMessage, isEditing, isSaving, statusMessage],
  );

  return (
    <TeacherEditContext.Provider value={value}>
      {children}
      <div className="teacher-edit-dock">
        {isEditing ? (
          <>
            <span>{isSaving ? "Saving..." : "Teacher edit mode"}</span>

            <button
              disabled={isSaving}
              type="button"
              onClick={() => {
                setIsScholarResultsOpen(true);
                setIsGameEditorOpen(false);
              }}
            >
              Data and Reports
            </button>
            <button disabled={isSaving} type="button" onClick={exitEditMode}>
              Done
            </button>
          </>
        ) : (
          <button disabled={isConnecting} type="button" onClick={openTeacherEdit}>
            {isConnecting ? "Opening..." : "Teacher Edit"}
          </button>
        )}
      </div>

      {hasTeacherAttemptedEdit && !isEditing && errorMessage ? (
        <p className="teacher-dock-error" aria-live="polite">
          {errorMessage}
        </p>
      ) : null}

      {isEditing && isScholarResultsOpen ? (
        <ScholarResultsPanel onClose={() => setIsScholarResultsOpen(false)} />
      ) : null}
      {isEditing && isGameEditorOpen ? (
        <GameEditorPanel
          cardEdits={editedCards}
          onClose={() => setIsGameEditorOpen(false)}
          updateCard={updateCard}
        />
      ) : null}
    </TeacherEditContext.Provider>
  );
}

export function useTeacherEdit() {
  const context = useContext(TeacherEditContext);

  if (!context) {
    throw new Error("useTeacherEdit must be used inside TeacherEditProvider");
  }

  return context;
}
