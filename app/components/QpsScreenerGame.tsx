"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  firebaseConfig,
  isAuthorizedTeacherEmail,
  rosterTeacherEmailForEmail,
  teacherLabelForEmail,
} from "../firebase-config";
import { hasTeacherCklaAccess } from "./scholar-profile";

type FirebaseUser = {
  email: string | null;
};

type FirebaseAuth = {
  currentUser: FirebaseUser | null;
  onAuthStateChanged: (callback: (user: FirebaseUser | null) => void) => () => void;
  signInWithPopup: (provider: unknown) => Promise<{ user?: FirebaseUser | null }>;
};

type FirestoreDocSnapshot = {
  data: () => unknown;
  exists?: boolean;
  id: string;
};

type FirestoreQuerySnapshot = {
  docs: FirestoreDocSnapshot[];
};

type FirestoreDocRef = {
  collection: (name: string) => FirestoreCollectionRef;
  get: () => Promise<FirestoreDocSnapshot>;
  onSnapshot: (callback: (snapshot: FirestoreDocSnapshot) => void) => () => void;
  set: (data: unknown, options?: { merge: boolean }) => Promise<void>;
};

type FirestoreCollectionRef = {
  add: (data: unknown) => Promise<unknown>;
  doc: (id: string) => FirestoreDocRef;
  get: () => Promise<FirestoreQuerySnapshot>;
};

type FirestoreDb = {
  collection: (name: string) => FirestoreCollectionRef;
};

type FirebaseNamespace = {
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

type QpsScholar = {
  firstName: string;
  firstNameKey: string;
  id: string;
  lastName: string;
  teacherEmail: string;
  trackingInitials: string;
};

type QpsItem = {
  display: string;
  formId: QpsFormId;
  id: string;
  prompt: string;
  section: string;
  skill: string;
  target: string;
  type: "letter" | "sound" | "word" | "sentence";
};

type QpsFormId = "A" | "B" | "C";

type QpsForm = {
  id: QpsFormId;
  items: QpsItem[];
  label: string;
  version: string;
};

type QpsItemScore = {
  note: string;
  said: string;
  status: "unscored" | "correct" | "missed";
};

type QpsLiveSession = {
  active: boolean;
  currentIndex: number;
  formId: QpsFormId;
  lastChangedBy: "scholar" | "teacher";
  scholarFirstName: string;
  scholarFirstNameKey: string;
  scholarId: string;
  teacherEmail: string;
};

type QpsScholarSlideProfile = {
  firstName: string;
  firstNameKey: string;
};

declare global {
  interface Window {
    firebase?: FirebaseNamespace;
  }
}

const FIREBASE_SCRIPTS = [
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore-compat.js",
];
const SCHOLAR_COLLECTION = "gameHubScholars";
const RESULT_COLLECTION = "gameHubResultSubmissions";
const GAME_DEFINITION_COLLECTION = "gameHubGameDefinitions";
const QPS_LIVE_SESSION_COLLECTION = "gameHubQpsLiveSessions";
const QPS_GAME_ID = "qps-screener";
const QPS_GAME_TITLE = "QPS Screener";
const QPS_WHOLE_CLASS_MODE = "whole-class";
const QPS_DIGRAPH_TARGETS = ["sh", "ch", "th", "wh", "ck", "ng", "qu"];
const QPS_FORM_RAW = {
  A: {
    letterNames: "m t a s i r d f o g l h u c n b j k y e w p v q x z",
    letterSounds: "t a m r s i o f d h g l c n b u k e j w p y qu v z x",
    sets: [
      ["Set 3 - Short Vowels", "fod mip noz sib lec tut gat cug taf hev", "Ben hid the gum. | Tim sat in a tub. | Mom had a big pot. | Tom is on the bed. | Don can nap. | Ted did run."],
      ["Set 4 - Digraphs", "lesh voth jing gack mich whum chun thog shif thip", "The duck had a wet wing. | The big ship is long. | Can Chet pack much in the bag? | When did fish get in that tub?"],
      ["Set 5 - Blends", "gosp rimp mant jast sund clof trin snaf prem slun", "Glen swam past the raft in the pond. | The frog can spin and jump and flop in the sand."],
      ["Set 6 - Silent E", "sipe nole fune moze vate rine lade zile gane fote", "Mike and Jane use a rope to ride the mule. | Pete will take his kite home."],
      ["Set 7 - R-Controlled Vowels", "cort pirk varb serl surp tarn forp murk tirn kerm", "The dark tar on his torn shirt can burn and hurt him. | The bird hid under the fern in the park."],
      ["Set 8 - Advanced Consonants", "litch mudge vux quam cep gen knaz wrop satch quif", "The cider is in the wrong cup. | She ran to the center of the bridge. | Mom will stitch a knot on the quilt. | The giant will wrap the big box."],
      ["Set 9 - Vowel Teams", "kray fraw chout koe poid galt kigh nauf toam moy", "The tall ship creaks as it sails on the gray waves in the storm. | He told us that the wind soon blew so hard they had to shout. | Can you join us on the boat to go fishing?"],
      ["Set 10 - Multisyllabic Words", "discount index return confide station madness portable fastest careless nonsense", ""],
      ["Set 11 - Multisyllabic Words", "mascot basket moment bacon handle puzzle cartoon order escape chowder", ""],
      ["Set 12 - Multisyllabic Words", "amputate liberty dominate elastic entertain practical innocent electric volcano segregate", ""],
      ["Set 13 - Multisyllabic Words", "particular contaminate community superior vitality evaporate inventory entertainment emergency solitary", ""],
    ],
  },
  B: {
    letterNames: "t a m r s i o f d h g l c n b u k e j w p y q v z x",
    letterSounds: "m s i a t f d o r l g n b h c j k u w e y v p z qu x",
    sets: [
      ["Set 3 - Short Vowels", "sov nat rem mog sig kuv hak jit ket cul", "Ted ran to the dog. | Tom fed the fat cat. | Mom and Bob can hug. | Sis hid the big bug. | Tim sat on the red rug."],
      ["Set 4 - Digraphs", "fosh hing cack fich rith chak thup shum wheb thef", "A big fish is in that sack. | When can I sing? | I can chop a log. | Can you shut the lid? | The king is on a big rock. | Sam had a wish."],
      ["Set 5 - Blends", "tomp sint wust zend gast clem trak snof prib sleg", "Spot must run fast and jump and spin! | I am glad to help Greg dust the desk."],
      ["Set 6 - Silent E", "rane kide fale sone wite bine nule rone foze sate", "June rode the bike on the wide path to the gate. | Pete and Mike made a cake for Kate."],
      ["Set 7 - R-Controlled Vowels", "nart porf kurm mirn nerk torb sirp barp lert durp", "Bert can turn the Ford car at the barn. | The third girl had worn a short red skirt."],
      ["Set 8 - Advanced Consonants", "kniz wrab gen potch quib nodge nax sotch quag cem", "In the city it will cost ten cents to go on the bus. | Quinn knelt on the ledge. | Can you fix the car that got in a wreck? | The dog can gnaw on the latch on the box."],
      ["Set 9 - Vowel Teams", "wout loe vigh soaf skay poit nolt foom fraw crea", "They want to launch the small ship. | The high winds blew the rain very hard. | Roy and Joe will clean the red and gold rug they found at the dump."],
      ["Set 10 - Multisyllabic Words", "prepare uncertain motion joyous witness drinkable dampest fearful ageless fragment", ""],
      ["Set 11 - Multisyllabic Words", "tender ticket carpet taken chapter tractor booklet winner candle recent", ""],
      ["Set 12 - Multisyllabic Words", "argument library condition concentrate fantastic together important possible contemplate history", ""],
      ["Set 13 - Multisyllabic Words", "information experience appropriate compatible identity preparation development manipulate immediate investigate", ""],
    ],
  },
  C: {
    letterNames: "m s i a t f d o r l g n b h c j k u w e y v p z q x",
    letterSounds: "m t a s i r d f o g l h u c n b j k y e w p v qu x z",
    sets: [
      ["Set 3 - Short Vowels", "suv zet naf rom dez kuz gom tif han tig", "Sis can pet the cat. | Sid sat on the log. | Jim hid the big cup. | Jed got the red bug. | Tom and Bob had a nap."],
      ["Set 4 - Digraphs", "fesh ling weck fach poth whaf chof thop shif whib", "Shut the lid on that pot! | The duck has a long wing. | Mack hit my chin with the bat. | I wish I had a whip."],
      ["Set 5 - Blends", "komp nast zint fand hust twim prak snop crub glem", "The band just went on a trip. | Grab the lamp on the desk. | The twig can snap if I step on it."],
      ["Set 6 - Silent E", "jate zile hote tane pode nute mize vale kine zune", "I like to ride a bike to the lake and wade. | Nate can make up a tune in no time."],
      ["Set 7 - R-Controlled Vowels", "nurt tark lerf vort barm horp sirn terp narf mirp", "The bird born in the nest will chirp for corn. | The storm may harm the herd at her farm."],
      ["Set 8 - Advanced Consonants", "lidge votch wux quib gen lotch knov cef quop wrik", "The judge wrote six notes with the quill pen. | Can you catch my quick pitch? | The fox bit him on the knee and the wrist."],
      ["Set 9 - Vowel Teams", "volp houk shoy maip dray vigh poat naul galt meaf", "Did you scream with fright when the mouse crawled up your broom? | Joe is afraid he can't chew the roast he broiled."],
      ["Set 10 - Multisyllabic Words", "distrust invest preview remain unkind action washable darkest handful basement", ""],
      ["Set 11 - Multisyllabic Words", "extreme freedom classic number complete nature admit person command afraid", ""],
      ["Set 12 - Multisyllabic Words", "astonish expression adventure discussion operate potential consistent reference diagram estimate", ""],
      ["Set 13 - Multisyllabic Words", "disorganized democracy impractical investigate occupation fundamental relationship accomplishment appreciate generalize", ""],
    ],
  },
} as const;
export const QPS_FORMS: Record<QpsFormId, QpsForm> = {
  A: buildQpsForm("A"),
  B: buildQpsForm("B"),
  C: buildQpsForm("C"),
};

let firebaseLoadPromise: Promise<FirebaseServices> | null = null;

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function wordsFrom(value: string) {
  return value.split(/\s+/).map((word) => word.trim()).filter(Boolean);
}

function sentencesFrom(value: string) {
  return value.split("|").map((sentence) => sentence.trim()).filter(Boolean);
}

function qpsTargetFor(display: string, section: string) {
  const clean = display.toLowerCase().replace(/[^a-z]/g, "");

  if (!clean) return "";
  if (clean.length <= 3 && (section.includes("Letter") || section.includes("Digraph"))) {
    return clean;
  }

  return QPS_DIGRAPH_TARGETS.find((pattern) => clean.includes(pattern)) ?? "";
}

function qpsItem(
  formId: QpsFormId,
  section: string,
  skill: string,
  display: string,
  index: number,
  type: QpsItem["type"],
): QpsItem {
  const isSentence = type === "sentence";
  const isLetterName = section.includes("Letter Names");
  const isLetterSound = section.includes("Letter Sounds");

  return {
    display,
    formId,
    id: `${formId}-${slug(section)}-${index + 1}-${slug(display).slice(0, 36)}`,
    prompt: isSentence
      ? "Read the sentence."
      : isLetterName
        ? `Name the letter ${display}.`
        : isLetterSound
          ? `Say the sound for ${display}.`
          : `Read ${display}.`,
    section,
    skill,
    target: qpsTargetFor(display, section),
    type,
  };
}

function buildQpsForm(formId: QpsFormId): QpsForm {
  const raw = QPS_FORM_RAW[formId];
  const items: QpsItem[] = [
    ...wordsFrom(raw.letterNames).map((letter, index) =>
      qpsItem(formId, "Set 1 - Letter Names", "Letter identification", letter, index, "letter"),
    ),
    ...wordsFrom(raw.letterSounds).map((letter, index) =>
      qpsItem(formId, "Set 2 - Letter Sounds", "Letter sounds", letter, index, "sound"),
    ),
  ];

  raw.sets.forEach(([section, words, sentences]) => {
    const wordItems = wordsFrom(words);
    const sentenceItems = sentencesFrom(sentences);

    wordItems.forEach((word, index) => {
      items.push(qpsItem(formId, section, section.replace(/^Set \d+ - /, ""), word, index, "word"));
    });
    sentenceItems.forEach((sentence, index) => {
      items.push(qpsItem(formId, section, section.replace(/^Set \d+ - /, ""), sentence, wordItems.length + index, "sentence"));
    });
  });

  return {
    id: formId,
    items,
    label: `Form ${formId}`,
    version: `qps-form-${formId.toLowerCase()}-2026-08`,
  };
}

function loadScript(src: string) {
  return new Promise<void>((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Could not load ${src}`));
    document.head.appendChild(script);
  });
}

async function loadFirebase() {
  if (firebaseLoadPromise) {
    return firebaseLoadPromise;
  }

  firebaseLoadPromise = (async () => {
    for (const script of FIREBASE_SCRIPTS) {
      await loadScript(script);
    }

    const firebase = window.firebase;
    if (!firebase) {
      throw new Error("Firebase did not load.");
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    return {
      auth: firebase.auth(),
      db: firebase.firestore(),
      firebase,
    };
  })();

  return firebaseLoadPromise;
}

function asRecord(value: unknown) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function normalizeNameKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z]/g, "").slice(0, 30);
}

function cleanTrackingInitials(value: unknown) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function automaticInitials(firstName: string, lastName: string) {
  return `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`
    .toUpperCase()
    .replace(/[^A-Z]/g, "")
    .slice(0, 3);
}

function qpsFormIdFor(value: unknown): QpsFormId {
  return value === "B" || value === "C" ? value : "A";
}

function boundedQpsIndex(value: unknown, itemCount: number) {
  return Math.max(0, Math.min(Math.max(0, itemCount - 1), Math.trunc(asNumber(value))));
}

function qpsItemScoreDefaults(items: QpsItem[]): Record<string, QpsItemScore> {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      {
        note: "",
        said: "",
        status: "unscored" as const,
      },
    ]),
  );
}

function mapScholar(doc: FirestoreDocSnapshot): QpsScholar | null {
  const data = asRecord(doc.data());

  if (!data || data.active === false || data.includeInReports === false) {
    return null;
  }

  const firstName = asText(data.firstName).trim();
  const lastName = asText(data.lastName).trim();
  const firstNameKey = asText(data.firstNameKey).trim() || normalizeNameKey(firstName);
  const teacherEmail = rosterTeacherEmailForEmail(asText(data.teacherEmail)) || asText(data.teacherEmail);
  const trackingInitials =
    cleanTrackingInitials(data.trackingInitials)
    || automaticInitials(firstName, lastName);

  if (!firstName || !firstNameKey || !teacherEmail) {
    return null;
  }

  return {
    firstName,
    firstNameKey,
    id: doc.id,
    lastName,
    teacherEmail,
    trackingInitials,
  };
}

function mapQpsLiveSession(doc: FirestoreDocSnapshot): QpsLiveSession | null {
  if (doc.exists === false) {
    return null;
  }

  const data = asRecord(doc.data());
  if (!data) {
    return null;
  }

  const formId = qpsFormIdFor(data.formId);
  const scholarFirstName = asText(data.scholarFirstName).trim();
  const scholarFirstNameKey = asText(data.scholarFirstNameKey).trim();
  const scholarId = asText(data.scholarId).trim();
  const teacherEmail = rosterTeacherEmailForEmail(asText(data.teacherEmail)) || asText(data.teacherEmail);

  if (!scholarFirstName || !scholarFirstNameKey || !teacherEmail) {
    return null;
  }

  return {
    active: data.active === true,
    currentIndex: boundedQpsIndex(data.currentIndex, QPS_FORMS[formId].items.length),
    formId,
    lastChangedBy: data.lastChangedBy === "scholar" ? "scholar" : "teacher",
    scholarFirstName,
    scholarFirstNameKey,
    scholarId,
    teacherEmail,
  };
}

function sectionTotals(scores: Record<string, QpsItemScore>, items: QpsItem[]) {
  const totals = new Map<string, { correct: number; missed: number; skipped: number; total: number }>();

  items.forEach((item) => {
    const score = scores[item.id];
    if (!score || score.status === "unscored") return;

    const current = totals.get(item.section) ?? { correct: 0, missed: 0, skipped: 0, total: 0 };
    current.total += 1;
    if (score.status === "correct") current.correct += 1;
    else current.missed += 1;
    totals.set(item.section, current);
  });

  return Object.fromEntries(totals);
}

function statusLabel(status: QpsItemScore["status"]) {
  if (status === "correct") return "Correct";
  if (status === "missed") return "Needs review";
  return "Not scored";
}

function qpsItemTypeFor(value: unknown, display: string, section: string): QpsItem["type"] {
  if (value === "letter" || value === "sound" || value === "word" || value === "sentence") {
    return value;
  }

  if (section.includes("Letter Names")) return "letter";
  if (section.includes("Letter Sounds")) return "sound";
  if (/\s/.test(display.trim())) return "sentence";
  return display.trim().length <= 2 ? "letter" : "word";
}

function editableQpsFormsFromContent(content: Record<string, unknown>, versionId: string) {
  const levels = Array.isArray(content.levels) ? content.levels : [];
  const questions = Array.isArray(content.questions) ? content.questions : [];
  const nextForms: Record<QpsFormId, QpsForm> = {
    A: { ...QPS_FORMS.A, items: [] },
    B: { ...QPS_FORMS.B, items: [] },
    C: { ...QPS_FORMS.C, items: [] },
  };

  questions.forEach((question, index) => {
    const raw = asRecord(question);
    if (!raw) return;

    const zone = Math.max(0, Math.trunc(asNumber(raw.zone)));
    const level = asRecord(levels[zone]);
    const levelName = asText(level?.name).trim();
    const formId = qpsFormIdFor(raw.formId || levelName.match(/Form\s+([ABC])/i)?.[1]);
    const display = asText(raw.display || raw.word || raw.correctAnswer || raw.answer).trim();
    const section = asText(raw.section).trim() || levelName.replace(/^Form\s+[ABC]\s*[-:]\s*/i, "").trim() || "QPS";
    const prompt = asText(raw.prompt).trim();

    if (!display || !prompt) {
      return;
    }

    nextForms[formId].items.push({
      display,
      formId,
      id: asText(raw.id).trim() || `${formId}-${slug(section)}-${index + 1}-${slug(display).slice(0, 36)}`,
      prompt,
      section,
      skill: asText(raw.skill || raw.category).trim() || section.replace(/^Set \d+ - /, ""),
      target: asText(raw.target).trim() || qpsTargetFor(display, section),
      type: qpsItemTypeFor(raw.itemType || raw.type, display, section),
    });
  });

  if (!nextForms.A.items.length && !nextForms.B.items.length && !nextForms.C.items.length) {
    return null;
  }

  return {
    A: nextForms.A.items.length ? { ...nextForms.A, version: versionId } : QPS_FORMS.A,
    B: nextForms.B.items.length ? { ...nextForms.B, version: versionId } : QPS_FORMS.B,
    C: nextForms.C.items.length ? { ...nextForms.C, version: versionId } : QPS_FORMS.C,
  };
}

async function loadEditableQpsForms(db: FirestoreDb) {
  try {
    const parentDoc = await db.collection(GAME_DEFINITION_COLLECTION).doc(QPS_GAME_ID).get();
    const parent = asRecord(parentDoc.data());
    const versionId = asText(parent?.publishedVersion || parent?.draftVersion).trim();

    if (!versionId) {
      return QPS_FORMS;
    }

    const versionDoc = await db
      .collection(GAME_DEFINITION_COLLECTION)
      .doc(QPS_GAME_ID)
      .collection("versions")
      .doc(versionId)
      .get();
    const versionData = asRecord(versionDoc.data());
    const content = asRecord(versionData?.content);

    return content ? editableQpsFormsFromContent(content, versionId) ?? QPS_FORMS : QPS_FORMS;
  } catch {
    return QPS_FORMS;
  }
}

function QpsScholarLiveSlides({ profile }: { profile: QpsScholarSlideProfile }) {
  const [error, setError] = useState("");
  const [forms, setForms] = useState<Record<QpsFormId, QpsForm>>(QPS_FORMS);
  const [isLoading, setIsLoading] = useState(true);
  const [liveSession, setLiveSession] = useState<QpsLiveSession | null>(null);
  const [isMoving, setIsMoving] = useState(false);

  const selectedForm = forms[liveSession?.formId ?? "A"];
  const qpsItems = selectedForm.items;
  const currentIndex = boundedQpsIndex(liveSession?.currentIndex ?? 0, qpsItems.length);
  const currentItem = qpsItems[currentIndex] ?? qpsItems[0];
  const isConnected = liveSession?.active === true && liveSession.scholarFirstNameKey === profile.firstNameKey;

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    setError("");
    setIsLoading(true);

    loadFirebase()
      .then(async ({ db }) => {
        setForms(await loadEditableQpsForms(db));
        unsubscribe = db
          .collection(QPS_LIVE_SESSION_COLLECTION)
          .doc(profile.firstNameKey)
          .onSnapshot((snapshot) => {
            setLiveSession(mapQpsLiveSession(snapshot));
            setIsLoading(false);
          });
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "QPS could not connect.");
        setIsLoading(false);
      });

    return () => {
      unsubscribe?.();
    };
  }, [profile.firstNameKey]);

  const moveToIndex = async (nextIndex: number) => {
    if (!isConnected) {
      return;
    }

    setIsMoving(true);
    setError("");

    try {
      const { db, firebase } = await loadFirebase();
      await db
        .collection(QPS_LIVE_SESSION_COLLECTION)
        .doc(profile.firstNameKey)
        .set({
          currentIndex: boundedQpsIndex(nextIndex, qpsItems.length),
          lastChangedBy: "scholar",
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
        }, { merge: true });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "QPS could not move.");
    } finally {
      setIsMoving(false);
    }
  };

  return (
    <section className="qps-scholar-page">
      <div className="qps-scholar-shell">
        <a className="home-link" href="/skills">
          Back to Skills
        </a>

        {isLoading ? (
          <div className="qps-waiting-card">
            <p className="section-kicker">QPS</p>
            <h2>Connecting to your teacher...</h2>
          </div>
        ) : null}

        {!isLoading && !isConnected ? (
          <div className="qps-waiting-card">
            <p className="section-kicker">QPS</p>
            <h2>Waiting for your teacher</h2>
            <p>{profile.firstName}, keep this screen open. When your teacher starts your QPS, the slide will appear here.</p>
          </div>
        ) : null}

        {isConnected ? (
          <>
            <div className="qps-scholar-status">
              <span>Connected with your teacher</span>
              <strong>{selectedForm.label} - Item {currentIndex + 1} of {qpsItems.length}</strong>
            </div>
            <div className="qps-scholar-card">
              <p>{currentItem.section}</p>
              <strong className={`qps-reader-display is-${currentItem.type}`}>
                {currentItem.display}
              </strong>
              <span>Read or say this for your teacher.</span>
            </div>
            <div className="qps-scholar-nav">
              <button
                className="teacher-control-button secondary"
                disabled={isMoving || currentIndex === 0}
                onClick={() => void moveToIndex(currentIndex - 1)}
                type="button"
              >
                Previous
              </button>
              <button
                className="teacher-control-button"
                disabled={isMoving || currentIndex >= qpsItems.length - 1}
                onClick={() => void moveToIndex(currentIndex + 1)}
                type="button"
              >
                Next
              </button>
            </div>
          </>
        ) : null}

        {error ? <p className="pin-error">{error}</p> : null}
      </div>
    </section>
  );
}

export function QpsScreenerGame() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [formId, setFormId] = useState<QpsFormId>("A");
  const [hasCheckedScholarMode, setHasCheckedScholarMode] = useState(false);
  const [hasPinTeacherAccess, setHasPinTeacherAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSessionSaving, setIsLiveSessionSaving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWholeClassMiss, setIsSavingWholeClassMiss] = useState(false);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [liveSessionStatus, setLiveSessionStatus] = useState("");
  const [forms, setForms] = useState<Record<QpsFormId, QpsForm>>(QPS_FORMS);
  const [scores, setScores] = useState<Record<string, QpsItemScore>>(() => qpsItemScoreDefaults(QPS_FORMS.A.items));
  const [scholars, setScholars] = useState<QpsScholar[]>([]);
  const [scholarSlideProfile, setScholarSlideProfile] = useState<QpsScholarSlideProfile | null>(null);
  const [selectedScholarId, setSelectedScholarId] = useState("");
  const [status, setStatus] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [wholeClassInitials, setWholeClassInitials] = useState("");
  const [wholeClassMissStatus, setWholeClassMissStatus] = useState("");
  const wholeClassInitialsRef = useRef<HTMLInputElement | null>(null);

  const selectedForm = forms[formId] ?? QPS_FORMS[formId];
  const qpsItems = selectedForm.items;
  const currentItem = qpsItems[currentIndex] ?? qpsItems[0];
  const currentScore = scores[currentItem.id] ?? { note: "", said: "", status: "unscored" as const };
  const selectedScholar = scholars.find((scholar) => scholar.id === selectedScholarId) ?? null;
  const isWholeClassMode = selectedScholarId === QPS_WHOLE_CLASS_MODE;
  const canUseTeacherBoard = hasPinTeacherAccess || isAuthorizedTeacherEmail(teacherEmail);
  const wholeClassLiveTarget = useMemo(
    () => isWholeClassMode
      ? {
        firstName: "Whole Class Mode",
        firstNameKey: "wcm",
        id: "whole-class-mode",
        teacherEmail: rosterTeacherEmailForEmail(teacherEmail) || "unassigned",
      }
      : null,
    [isWholeClassMode, teacherEmail],
  );
  const selectedLiveTarget = selectedScholar ?? wholeClassLiveTarget;
  const scoredItems = useMemo(
    () => qpsItems.filter((item) => scores[item.id]?.status !== "unscored"),
    [qpsItems, scores],
  );
  const correctCount = scoredItems.filter((item) => scores[item.id]?.status === "correct").length;
  const missedCount = scoredItems.filter((item) => scores[item.id]?.status === "missed").length;
  const percent = scoredItems.length ? Math.round((correctCount / scoredItems.length) * 100) : 0;

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const firstName = asText(params.get("player")).trim();
    const firstNameKey = asText(params.get("key")).trim() || normalizeNameKey(firstName);
    const isWholeClassLaunch = params.get("wholeClass") === "1";

    if (isWholeClassLaunch && hasTeacherCklaAccess()) {
      setHasPinTeacherAccess(true);
      setSelectedScholarId(QPS_WHOLE_CLASS_MODE);
    }

    if (params.get("live") === "1" && firstName && firstNameKey && normalizeNameKey(firstName) === firstNameKey) {
      setScholarSlideProfile({ firstName, firstNameKey });
    }

    setHasCheckedScholarMode(true);
  }, []);

  const loadTeacherData = async () => {
    setError("");
    setIsLoading(true);

    try {
      const { auth, db } = await loadFirebase();
      const user = auth.currentUser;
      const signedInEmail = user?.email?.trim().toLowerCase() ?? "";

      setTeacherEmail(signedInEmail);
      setForms(await loadEditableQpsForms(db));

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        setScholars([]);
        return;
      }

      const snapshot = await db.collection(SCHOLAR_COLLECTION).get();
      setScholars(
        snapshot.docs
          .map(mapScholar)
          .filter((scholar): scholar is QpsScholar => Boolean(scholar))
          .sort((a, b) =>
            `${teacherLabelForEmail(a.teacherEmail)} ${a.firstName} ${a.lastName}`.localeCompare(
              `${teacherLabelForEmail(b.teacherEmail)} ${b.firstName} ${b.lastName}`,
            ),
          ),
      );
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "QPS could not load.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    if (!hasCheckedScholarMode || scholarSlideProfile) {
      return () => {
        unsubscribe?.();
      };
    }

    loadFirebase()
      .then(({ auth }) => {
        unsubscribe = auth.onAuthStateChanged(() => {
          void loadTeacherData();
        });
      })
      .catch((nextError) => {
        setError(nextError instanceof Error ? nextError.message : "QPS could not load.");
        setIsLoading(false);
      });

    return () => {
      unsubscribe?.();
    };
  }, [hasCheckedScholarMode, scholarSlideProfile]);

  useEffect(() => {
    setScores(qpsItemScoreDefaults(qpsItems));
    setCurrentIndex(0);
    setStatus("");
  }, [qpsItems]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;
    const liveTarget = selectedLiveTarget;

    if (!liveTarget || (!isWholeClassMode && !isAuthorizedTeacherEmail(teacherEmail))) {
      setLiveSessionActive(false);
      setLiveSessionStatus(isWholeClassMode ? "Whole Class Mode is on. Start live slides, then type WCM on the smart board." : "");
      return () => {
        unsubscribe?.();
      };
    }

    loadFirebase()
      .then(({ db }) => {
        unsubscribe = db
          .collection(QPS_LIVE_SESSION_COLLECTION)
          .doc(liveTarget.firstNameKey)
          .onSnapshot((snapshot) => {
            const session = mapQpsLiveSession(snapshot);

            if (!session?.active || session.scholarFirstNameKey !== liveTarget.firstNameKey) {
              setLiveSessionActive(false);
              setLiveSessionStatus(isWholeClassMode ? "Whole Class Mode is on. Start live slides, then type WCM on the smart board." : "Live slides are off for this scholar.");
              return;
            }

            setLiveSessionActive(true);
            setLiveSessionStatus(`Live slides are on for ${session.scholarFirstName}.`);
            if (session.formId !== formId) {
              setFormId(session.formId);
              return;
            }

            setCurrentIndex((index) => index === session.currentIndex ? index : session.currentIndex);
          });
      })
      .catch((nextError) => {
        setLiveSessionStatus(nextError instanceof Error ? nextError.message : "Live QPS could not connect.");
      });

    return () => {
      unsubscribe?.();
    };
  }, [selectedLiveTarget, selectedScholarId, teacherEmail, formId, isWholeClassMode]);

  const signIn = async () => {
    setError("");

    try {
      const { auth, firebase } = await loadFirebase();
      await auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
      await loadTeacherData();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Teacher sign-in did not finish.");
    }
  };

  const writeLiveSession = async (active: boolean, silent = false) => {
    const liveTarget = selectedLiveTarget;

    if (!liveTarget) {
      setLiveSessionStatus("Choose a scholar or Whole Class Mode before starting live QPS.");
      return;
    }

    if (!silent) {
      setIsLiveSessionSaving(true);
    }
    setError("");

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isWholeClassMode && !isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher account before starting live QPS.");
      }

      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      await db
        .collection(QPS_LIVE_SESSION_COLLECTION)
        .doc(liveTarget.firstNameKey)
        .set({
          active,
          createdAt: serverTime,
          currentIndex: boundedQpsIndex(currentIndex, qpsItems.length),
          formId,
          lastChangedBy: "teacher",
          schemaVersion: 1,
          scholarFirstName: liveTarget.firstName,
          scholarFirstNameKey: liveTarget.firstNameKey,
          scholarId: liveTarget.id,
          teacherEmail: isWholeClassMode
            ? rosterTeacherEmailForEmail(signedInEmail) || "unassigned"
            : liveTarget.teacherEmail,
          updatedAt: serverTime,
        }, { merge: true });

      setLiveSessionActive(active);
      setLiveSessionStatus(active ? `Live slides are on for ${liveTarget.firstName}.` : `Live slides ended for ${liveTarget.firstName}.`);
    } catch (nextError) {
      const message = nextError instanceof Error ? nextError.message : "Live QPS could not update.";
      setError(message);
      setLiveSessionStatus(message);
    } finally {
      if (!silent) {
        setIsLiveSessionSaving(false);
      }
    }
  };

  useEffect(() => {
    if (!liveSessionActive || !selectedLiveTarget || scholarSlideProfile) {
      return;
    }

    const handle = window.setTimeout(() => {
      void writeLiveSession(true, true);
    }, 175);

    return () => window.clearTimeout(handle);
  }, [currentIndex, formId, liveSessionActive, selectedLiveTarget, scholarSlideProfile]);

  const updateCurrentScore = (update: Partial<QpsItemScore>) => {
    setScores((currentScores) => ({
      ...currentScores,
      [currentItem.id]: {
        ...currentScore,
        ...update,
      },
    }));
  };

  const markNeedsReview = () => {
    updateCurrentScore({ status: "missed" });
    setWholeClassMissStatus("");

    if (isWholeClassMode) {
      window.setTimeout(() => wholeClassInitialsRef.current?.focus(), 50);
    }
  };

  const saveWholeClassMiss = async () => {
    if (!isWholeClassMode) {
      setWholeClassMissStatus("Choose Whole Class Mode first.");
      return;
    }

    const initials = cleanTrackingInitials(wholeClassInitials);

    if (!initials) {
      setWholeClassMissStatus("Type the scholar's initials first.");
      wholeClassInitialsRef.current?.focus();
      return;
    }

    setIsSavingWholeClassMiss(true);
    setWholeClassMissStatus("");
    setError("");

    try {
      const { db, firebase } = await loadFirebase();
      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      const selected = currentScore.said.trim() || "Needs review";
      const teacherForMiss =
        rosterTeacherEmailForEmail(teacherEmail)
        || selectedScholar?.teacherEmail
        || "unassigned";

      updateCurrentScore({ said: selected, status: "missed" });

      await db.collection(RESULT_COLLECTION).add({
        attempts: 1,
        completedAt: serverTime,
        correctAnswer: currentItem.display,
        createdAt: serverTime,
        gameId: QPS_GAME_ID,
        gameTitle: QPS_GAME_TITLE,
        incorrectSelection: selected,
        incorrectSelections: [{
          category: currentItem.skill,
          correctAnswer: currentItem.display,
          gameId: QPS_GAME_ID,
          gameTitle: QPS_GAME_TITLE,
          incorrectSelection: selected,
          levelId: currentItem.section,
          levelName: currentItem.section,
          questionIndex: currentIndex + 1,
          word: currentItem.display,
        }],
        missedCount: 1,
        missedQuestions: [{
          category: currentItem.skill,
          correctAnswer: currentItem.display,
          gameId: QPS_GAME_ID,
          gameTitle: QPS_GAME_TITLE,
          incorrectSelections: [selected],
          levelId: currentItem.section,
          levelName: currentItem.section,
          questionIndex: currentIndex + 1,
          word: currentItem.display,
        }],
        mode: "whole-class-miss",
        questionIndex: currentIndex + 1,
        schemaVersion: 1,
        scholarDisplayName: initials,
        scholarFirstName: "Class Miss",
        scholarFirstNameKey: "classmiss",
        scholarId: null,
        score: 0,
        teacherEmail: teacherForMiss,
        totalQuestions: 1,
        word: currentItem.display,
      });

      setWholeClassMissStatus(`Saved ${currentItem.display} for ${initials}.`);
      setWholeClassInitials("");
    } catch (nextError) {
      setWholeClassMissStatus(nextError instanceof Error ? nextError.message : "This QPS miss could not save yet.");
    } finally {
      setIsSavingWholeClassMiss(false);
    }
  };

  const handleScholarSelection = (nextScholarId: string) => {
    setSelectedScholarId(nextScholarId);
    setWholeClassMissStatus("");

    if (nextScholarId === QPS_WHOLE_CLASS_MODE) {
      setLiveSessionStatus("Whole Class Mode is on. Enter initials when a scholar needs review.");
    }
  };

  const goToNext = () => {
    setCurrentIndex((index) => Math.min(qpsItems.length - 1, index + 1));
    setWholeClassMissStatus("");
  };

  const goToPrevious = () => {
    setCurrentIndex((index) => Math.max(0, index - 1));
    setWholeClassMissStatus("");
  };

  const resetScores = () => {
    setScores(qpsItemScoreDefaults(qpsItems));
    setCurrentIndex(0);
    setStatus("");
    setWholeClassMissStatus("");
  };

  const printQps = () => {
    const reportWindow = window.open("", "_blank");
    const scholarName = selectedScholar ? `${selectedScholar.firstName} ${selectedScholar.lastName}` : "No scholar selected";
    const sectionSummaryRows = Object.entries(sectionTotals(scores, qpsItems)).map(([section, total]) => {
      const sectionPercent = total.total ? Math.round((total.correct / total.total) * 100) : 0;
      return `
        <tr>
          <th>${escapeHtml(section)}</th>
          <td>${total.correct}/${total.total}</td>
          <td>${total.missed}</td>
          <td>${sectionPercent}%</td>
        </tr>
      `;
    }).join("");
    const needsRows = qpsItems.filter((item) => scores[item.id]?.status === "missed").map((item, index) => {
      const score = scores[item.id] ?? { note: "", said: "", status: "missed" as const };
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(item.section)}</td>
          <td>${escapeHtml(item.display)}</td>
          <td>${escapeHtml(score.said.trim() || "Needs review")}</td>
          <td>${escapeHtml(score.note)}</td>
        </tr>
      `;
    }).join("");
    const rows = qpsItems.map((item, index) => {
      const score = scores[item.id] ?? { note: "", said: "", status: "unscored" as const };
      return `
        <tr class="${score.status}">
          <td>${index + 1}</td>
          <td>${escapeHtml(item.section)}</td>
          <td>${escapeHtml(item.display)}</td>
          <td>${escapeHtml(statusLabel(score.status))}</td>
          <td>${escapeHtml(score.said)}</td>
          <td>${escapeHtml(score.note)}</td>
        </tr>
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
        <title>QPS Screener</title>
        <style>
          @page{margin:10mm}
          html,body{margin:0;padding:0}
          body{font-family:Arial,Helvetica,sans-serif;color:#223044}
          .report{padding:0}
          .report-header{border-bottom:2px solid #223044;margin:0 0 12px;padding:0 0 10px}
          h1{margin:0 0 4px;font-size:24px}
          h2{font-size:15px;margin:16px 0 6px;color:#223044}
          p{margin:0;color:#56677d;font-size:12px}
          .summary-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:12px 0}
          .summary-card{border:1px solid #cdd8e5;border-radius:8px;padding:8px}
          .summary-card span{display:block;color:#56677d;font-size:10px;text-transform:uppercase;letter-spacing:.04em}
          .summary-card strong{display:block;font-size:18px;margin-top:3px}
          table{width:100%;border-collapse:collapse;font-size:11px;page-break-inside:auto}
          thead{display:table-header-group}
          th,td{border:1px solid #cdd8e5;padding:5px;text-align:left;vertical-align:top}
          th{background:#eef4fa}
          tr.correct td{background:#f0fbf3}
          tr.missed td{background:#fff0ec}
          tr.unscored td{color:#64748b}
          .empty-note{border:1px solid #cdd8e5;border-radius:8px;padding:9px;color:#56677d}
          tr,.summary-card{break-inside:avoid;page-break-inside:avoid}
        </style>
      </head>
      <body>
        <main class="report">
        <header class="report-header">
          <h1>QPS Screener Results</h1>
          <p>${escapeHtml(selectedForm.label)} - ${escapeHtml(scholarName)} - ${new Date().toLocaleDateString()}</p>
        </header>
        <section class="summary-grid" aria-label="QPS summary">
          <div class="summary-card"><span>Score</span><strong>${correctCount}/${scoredItems.length || 0}</strong></div>
          <div class="summary-card"><span>Percent</span><strong>${percent}%</strong></div>
          <div class="summary-card"><span>Needs Review</span><strong>${missedCount}</strong></div>
          <div class="summary-card"><span>Items Scored</span><strong>${scoredItems.length}/${qpsItems.length}</strong></div>
        </section>
        <h2>Section Breakdown</h2>
        <table>
          <thead>
            <tr><th>Section</th><th>Score</th><th>Needs Review</th><th>Percent</th></tr>
          </thead>
          <tbody>${sectionSummaryRows || `<tr><td colspan="4">No QPS items have been scored yet.</td></tr>`}</tbody>
        </table>
        <h2>Needs Review Items</h2>
        ${needsRows ? `
        <table>
          <thead>
            <tr><th>#</th><th>Section</th><th>Item</th><th>What scholar said</th><th>Notes</th></tr>
          </thead>
          <tbody>${needsRows}</tbody>
        </table>
        ` : `<p class="empty-note">No missed QPS items recorded.</p>`}
        <h2>Full Score Sheet</h2>
        <table>
          <thead>
            <tr><th>#</th><th>Section</th><th>Item</th><th>Status</th><th>What scholar said</th><th>Notes</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
        </main>
      </body>
      </html>
    `);
    reportWindow.document.close();
    reportWindow.focus();
    setTimeout(() => reportWindow.print(), 100);
  };

  const saveQps = async () => {
    if (!selectedScholar || !scoredItems.length) {
      setError("Choose a scholar and score at least one item before saving.");
      return;
    }

    setError("");
    setStatus("");
    setIsSaving(true);

    try {
      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher account before saving QPS.");
      }

      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      const missedItems = scoredItems.filter((item) => scores[item.id]?.status === "missed");
      const questionResponses = scoredItems.map((item, index) => {
        const score = scores[item.id] ?? { note: "", said: "", status: "unscored" as const };
        const correct = score.status === "correct";
        const selected = correct ? "Correct" : score.said.trim() || "Needs review";

        return {
          attempts: [{
            correct,
            selected,
            timestamp: Date.now(),
          }],
          category: item.skill,
          correct,
          correctAnswer: item.display,
          firstAttemptCorrect: correct,
          itemType: item.type,
          note: score.note.trim(),
          prompt: item.prompt,
          section: item.section,
          selected,
          skill: item.skill,
          target: item.target,
          word: item.display,
          questionIndex: index + 1,
        };
      });
      const missedQuestions = missedItems.map((item) => {
        const score = scores[item.id] ?? { note: "", said: "", status: "missed" as const };
        return {
          category: item.skill,
          correctAnswer: item.display,
          gameId: QPS_GAME_ID,
          gameTitle: QPS_GAME_TITLE,
          incorrectSelections: [score.said.trim() || "Needs review"],
          levelName: item.section,
          questionIndex: qpsItems.findIndex((nextItem) => nextItem.id === item.id) + 1,
          word: item.display,
        };
      });

      await db.collection(RESULT_COLLECTION).add({
        assessmentId: QPS_GAME_ID,
        assessmentVersion: selectedForm.version,
        attempts: 1,
        categoryScores: sectionTotals(scores, qpsItems),
        completedAt: serverTime,
        createdAt: serverTime,
        gameId: QPS_GAME_ID,
        gameTitle: QPS_GAME_TITLE,
        incorrectSelections: missedItems.map((item) => scores[item.id]?.said.trim() || item.display),
        learningLocation: "school",
        levelId: "qps-full-screener",
        levelIndex: 0,
        levelName: "QPS Screener",
        missedCount,
        missedQuestions,
        mode: "teacher-qps-screener",
        percent,
        questionResponses,
        responseTimesMs: [],
        schemaVersion: 1,
        scholarFirstName: selectedScholar.firstName,
        scholarFirstNameKey: selectedScholar.firstNameKey,
        scholarId: selectedScholar.id,
        score: correctCount,
        teacherEmail: selectedScholar.teacherEmail,
        totalQuestions: scoredItems.length,
      });

      setStatus(`QPS saved for ${selectedScholar.firstName}.`);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "QPS could not be saved.");
    } finally {
      setIsSaving(false);
    }
  };

  if (!hasCheckedScholarMode) {
    return (
      <section className="qps-screener-page">
        <p className="empty-results-message">Preparing QPS...</p>
      </section>
    );
  }

  if (scholarSlideProfile) {
    return <QpsScholarLiveSlides profile={scholarSlideProfile} />;
  }

  const signedInButUnauthorized = teacherEmail && !isAuthorizedTeacherEmail(teacherEmail) && !hasPinTeacherAccess;
  const needsTeacherSignIn = !isAuthorizedTeacherEmail(teacherEmail);

  return (
    <section className="qps-screener-page">
      <div className="qps-toolbar">
        <div>
          <p className="section-kicker">Teacher-only screener</p>
          <h2>QPS Screener</h2>
          <p>Run the screener like a game, while the teacher records the score sheet live.</p>
        </div>
        <div className="qps-toolbar-actions">
          <a className="teacher-control-button secondary" href="/skills">
            Back to Skills
          </a>
          <a className="teacher-control-button secondary" href="/">
            Games Home
          </a>
          <button className="teacher-control-button secondary" onClick={printQps} type="button">
            Print
          </button>
          <button className="teacher-control-button" disabled={isSaving || isWholeClassMode} onClick={() => void saveQps()} type="button">
            {isSaving ? "Saving..." : "Save QPS"}
          </button>
        </div>
      </div>

      {isLoading ? <p className="empty-results-message">Loading QPS...</p> : null}
      {signedInButUnauthorized ? (
        <p className="pin-error">This QPS screener is teacher-only. Sign in with an authorized teacher account.</p>
      ) : null}
      {needsTeacherSignIn ? (
        <button className="teacher-control-button" onClick={() => void signIn()} type="button">
          Teacher Sign In for Roster
        </button>
      ) : null}
      {hasPinTeacherAccess && needsTeacherSignIn ? (
        <p className="pin-helper">PIN mode is on. Whole Class Mode works now; sign in only if you need the scholar roster or individual QPS saves.</p>
      ) : null}
      {error ? <p className="pin-error">{error}</p> : null}
      {status ? <p className="card-edit-message">{status}</p> : null}

      {canUseTeacherBoard ? (
        <div className="qps-layout">
          <aside className="qps-score-panel">
            <label>
              QPS Form
              <select onChange={(event) => setFormId(event.target.value as QpsFormId)} value={formId}>
                <option value="A">Form A</option>
                <option value="B">Form B</option>
                <option value="C">Form C</option>
              </select>
            </label>
            <label>
              Scholar
              <select onChange={(event) => handleScholarSelection(event.target.value)} value={selectedScholarId}>
                <option value={QPS_WHOLE_CLASS_MODE}>Whole Class Mode</option>
                <option value="">Choose a scholar</option>
                {scholars.map((scholar) => (
                  <option key={scholar.id} value={scholar.id}>
                    {scholar.firstName} {scholar.lastName} ({scholar.trackingInitials}) - {teacherLabelForEmail(scholar.teacherEmail)}
                  </option>
                ))}
              </select>
            </label>
            <div className="qps-live-controls">
              <button
                className="teacher-control-button"
                disabled={!selectedLiveTarget || isLiveSessionSaving}
                onClick={() => void writeLiveSession(true)}
                type="button"
              >
                {liveSessionActive ? "Update Live Slides" : "Start Live Slides"}
              </button>
              <button
                className="teacher-control-button secondary"
                disabled={!selectedLiveTarget || !liveSessionActive || isLiveSessionSaving}
                onClick={() => void writeLiveSession(false)}
                type="button"
              >
                End Live
              </button>
              <p>{liveSessionStatus || (isWholeClassMode ? "Start live slides, then type WCM on the smart board." : "Start live slides when the scholar is ready on their iPad.")}</p>
            </div>
            <div className="qps-score-summary">
              <strong>{correctCount}/{scoredItems.length || 0}</strong>
              <span>correct</span>
              <em>{missedCount} needs review</em>
            </div>
            <div className="qps-section-jump">
              {[...new Set(qpsItems.map((item) => item.section))].map((section) => {
                const firstIndex = qpsItems.findIndex((item) => item.section === section);
                return (
                  <button
                    className={currentItem.section === section ? "is-active" : ""}
                    key={section}
                    onClick={() => setCurrentIndex(firstIndex)}
                    type="button"
                  >
                    {section}
                  </button>
                );
              })}
            </div>
            <button className="teacher-text-button" onClick={resetScores} type="button">
              Start Over
            </button>
          </aside>

          <main className="qps-reader-panel">
            <div className="qps-reader-card">
              <p>{selectedForm.label} - {currentItem.section} - Item {currentIndex + 1} of {qpsItems.length}</p>
              <strong className={`qps-reader-display is-${currentItem.type}`}>
                {currentItem.display}
              </strong>
              <span>{currentItem.prompt}</span>
              {currentScore.status === "missed" && currentScore.said ? (
                <em className="qps-correction-note">Said: {currentScore.said}</em>
              ) : null}
            </div>

            <div className="qps-score-buttons" role="group" aria-label="Score current QPS item">
              <button
                className={currentScore.status === "correct" ? "is-correct" : ""}
                onClick={() => updateCurrentScore({ said: "", status: "correct" })}
                type="button"
              >
                Correct
              </button>
              <button
                className={currentScore.status === "missed" ? "is-missed" : ""}
                onClick={markNeedsReview}
                type="button"
              >
                Needs Review
              </button>
              <button onClick={() => updateCurrentScore({ note: "", said: "", status: "unscored" })} type="button">
                Clear
              </button>
            </div>

            {isWholeClassMode ? (
              <div className="qps-whole-class-tools">
                <label>
                  Whole Class miss initials
                  <input
                    ref={wholeClassInitialsRef}
                    autoComplete="off"
                    inputMode="text"
                    maxLength={3}
                    onChange={(event) => setWholeClassInitials(cleanTrackingInitials(event.target.value))}
                    placeholder="JRB"
                    value={wholeClassInitials}
                  />
                </label>
                <button
                  className="teacher-control-button"
                  disabled={isSavingWholeClassMiss}
                  onClick={() => void saveWholeClassMiss()}
                  type="button"
                >
                  {isSavingWholeClassMiss ? "Saving..." : "Save Miss"}
                </button>
                <p>{wholeClassMissStatus || "Use the scholar's gray tracking initials when this item needs review."}</p>
              </div>
            ) : null}

            <div className="qps-notes-grid">
              <label>
                What scholar said
                <input
                  onChange={(event) => updateCurrentScore({ said: event.target.value, status: event.target.value.trim() ? "missed" : currentScore.status })}
                  placeholder="Example: /b/ for /d/"
                  value={currentScore.said}
                />
              </label>
              <label>
                Note
                <input
                  onChange={(event) => updateCurrentScore({ note: event.target.value })}
                  placeholder="Optional teacher note"
                  value={currentScore.note}
                />
              </label>
            </div>

            <div className="qps-nav-row">
              <button className="teacher-control-button secondary" disabled={currentIndex === 0} onClick={goToPrevious} type="button">
                Previous
              </button>
              <button className="teacher-control-button" disabled={currentIndex >= qpsItems.length - 1} onClick={goToNext} type="button">
                Next
              </button>
            </div>
          </main>

          <aside className="qps-item-list">
            {qpsItems.map((item, index) => {
              const score = scores[item.id] ?? { note: "", said: "", status: "unscored" as const };
              return (
                <button
                  className={`qps-item-chip ${score.status} ${index === currentIndex ? "is-active" : ""}`}
                  key={item.id}
                  onClick={() => setCurrentIndex(index)}
                  type="button"
                >
                  <strong>{item.display}</strong>
                  <span>{statusLabel(score.status)}</span>
                </button>
              );
            })}
          </aside>
        </div>
      ) : null}
    </section>
  );
}

function escapeHtml(value: unknown) {
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
