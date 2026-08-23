"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
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

type QpsErrorAnnotation = {
  actualResponse: string;
  endIndex: number;
  expectedSpan: string;
  id: string;
  startIndex: number;
};

type QpsResponseType =
  | "none"
  | "correct"
  | "annotated-error"
  | "no-response"
  | "whole-word";

type QpsItemScore = {
  errors: QpsErrorAnnotation[];
  note: string;
  said: string;
  responseType: QpsResponseType;
  status: "unscored" | "correct" | "missed";
  wholeWordResponse: string;
};

type QpsLiveSession = {
  active: boolean;
  awardKey: string;
  awardSection: string;
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

type QpsSectionAward = {
  key: string;
  section: string;
};

type QpsCallOnStatus = "mastered" | "needs-review" | "unassessed";

type QpsCallOnRecord = {
  completedAt?: unknown;
  correctAnswer?: string;
  gameId: string;
  gameTitle: string;
  id: string;
  incorrectSelection?: string;
  incorrectSelections: unknown[];
  levelName?: string;
  missedQuestions: unknown[];
  mode: string;
  questionResponses: unknown[];
  scholarDisplayName?: string;
  scholarFirstNameKey: string;
  scholarId?: string;
  status?: string;
  teacherEmail: string;
  updatedAt?: unknown;
  word?: string;
};

type QpsSkillsOverride = {
  createdAt?: unknown;
  id: string;
  reportId: "letter-names" | "letter-sounds" | "digraphs";
  scholarFirstNameKey: string;
  scholarId: string;
  status: Exclude<QpsCallOnStatus, "unassessed">;
  target: string;
  teacherEmail: string;
  updatedAt?: unknown;
};

type QpsCallOnEvidence = {
  dateMs: number;
  status: Exclude<QpsCallOnStatus, "unassessed">;
  source: string;
};

type QpsCallOnScholar = QpsScholar & {
  reason: string;
  status: QpsCallOnStatus;
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
const PROGRESS_COLLECTION = "gameHubProgressSubmissions";
const SKILLS_DATA_OVERRIDE_COLLECTION = "gameHubSkillsDataOverrides";
const GAME_DEFINITION_COLLECTION = "gameHubGameDefinitions";
const QPS_LIVE_SESSION_COLLECTION = "gameHubQpsLiveSessions";
const QPS_GAME_ID = "qps-screener";
const QPS_GAME_TITLE = "QPS Screener";
const QPS_WHOLE_CLASS_MODE = "whole-class";
const QPS_DIGRAPH_TARGETS = ["sh", "ch", "th", "wh", "ck", "ng", "qu"];
const QPS_CHART_DIGRAPH_TARGETS = ["sh", "ch", "th", "wh", "ph", "ng", "ck"];
const QPS_CHART_LETTER_TARGETS = "abcdefghijklmnopqrstuvwxyz".split("");
const QPS_VISIBLE_SET_NAMES: Record<string, string> = {
  "Set 1 - Letter Names": "Set 1 - Letter Names",
  "Set 2 - Letter Sounds": "Set 2 - Letter Sounds",
  "Set 3 - Short Vowels": "Set 3 - VC & CVC Words",
  "Set 4 - Digraphs": "Set 4 - Consonant Digraphs",
  "Set 5 - Blends": "Set 5 - CVCC & CCVC Words",
  "Set 6 - Silent E": "Set 6 - Silent E",
  "Set 7 - R-Controlled Vowels": "Set 7 - R-Controlled Vowels",
  "Set 8 - Advanced Consonants": "Set 8 - Advanced Consonants",
  "Set 9 - Vowel Teams": "Set 9 - Advanced Vowel Sounds",
  "Set 10 - Multisyllabic Words": "Set 10 - Prefixes & Suffixes",
  "Set 11 - Multisyllabic Words": "Set 11 - Two-Syllable Words",
  "Set 12 - Multisyllabic Words": "Set 12 - Three-Syllable Words",
  "Set 13 - Multisyllabic Words": "Set 13 - Four-Syllable Words",
};
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

export function qpsDisplaySectionName(section: string) {
  return QPS_VISIBLE_SET_NAMES[section] ?? section;
}

function qpsSetNumber(section: string) {
  return Math.max(1, Math.trunc(Number(section.match(/Set\s+(\d+)/i)?.[1] ?? 1)));
}

function qpsIsLetterSoundsSection(section: string) {
  return qpsSetNumber(section) === 2 || section.includes("Letter Sounds");
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
          ? `Teacher says the sound for ${display}. Scholar names the letter.`
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

function asArray(value: unknown) {
  return Array.isArray(value) ? value : [];
}

function asNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function evidenceDateMs(value: unknown) {
  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    const date = value.toDate() as Date;
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? 0 : date.getTime();
  }

  return 0;
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

function qpsOverrideReportId(value: unknown): QpsSkillsOverride["reportId"] {
  if (value === "letter-names") return "letter-names";
  return value === "digraphs" ? "digraphs" : "letter-sounds";
}

function normalizeQpsSkillTarget(value: unknown) {
  const raw = asText(value).trim().toLowerCase();

  if (!raw) {
    return "";
  }

  const slashSound = raw.match(/^\/([a-z]{1,3})\/$/);
  if (slashSound?.[1]) {
    return slashSound[1];
  }

  const namedTarget = raw.match(/^(?:letter|sound|target|pattern)\s+([a-z]{1,3})$/);
  if (namedTarget?.[1]) {
    return namedTarget[1];
  }

  const cleaned = raw
    .replace(/^letter\s+/, "")
    .replace(/^sound\s+/, "")
    .replace(/^pattern\s+/, "")
    .replace(/[^a-z]/g, "");

  return cleaned.length >= 1 && cleaned.length <= 3 ? cleaned : "";
}

function qpsChartReportIdForTarget(target: string): QpsSkillsOverride["reportId"] | "" {
  if (QPS_CHART_DIGRAPH_TARGETS.includes(target)) {
    return "digraphs";
  }

  if (QPS_CHART_LETTER_TARGETS.includes(target)) {
    return "letter-sounds";
  }

  return "";
}

function qpsChartReportIdForItem(item: QpsItem | undefined, target: string): QpsSkillsOverride["reportId"] | "" {
  if (!item) return "";

  if (QPS_CHART_DIGRAPH_TARGETS.includes(target)) {
    return "digraphs";
  }

  if (item.section.includes("Letter Names") || item.type === "letter") {
    return QPS_CHART_LETTER_TARGETS.includes(target) ? "letter-names" : "";
  }

  if (item.section.includes("Letter Sounds") || item.type === "sound") {
    return QPS_CHART_LETTER_TARGETS.includes(target) ? "letter-sounds" : "";
  }

  return qpsChartReportIdForTarget(target);
}

function qpsChartReportIdForEvidenceTarget(target: string, ...contextValues: unknown[]): QpsSkillsOverride["reportId"] | "" {
  const context = contextValues.map((value) => asText(value).toLowerCase()).join(" ");

  if (QPS_CHART_DIGRAPH_TARGETS.includes(target)) {
    return "digraphs";
  }

  if (QPS_CHART_LETTER_TARGETS.includes(target)) {
    if (/letter names?|letter identification/.test(context)) return "letter-names";
    if (/letter sounds?|sound/.test(context)) return "letter-sounds";
  }

  return qpsChartReportIdForTarget(target);
}

function qpsChartReportLabel(reportId: QpsSkillsOverride["reportId"]) {
  if (reportId === "letter-names") return "Letter Names";
  if (reportId === "digraphs") return "Digraphs";
  return "Letter Sounds";
}

function qpsChartTargetForItem(item: QpsItem | undefined) {
  if (!item) return null;

  const target =
    normalizeQpsSkillTarget(item.target)
    || normalizeQpsSkillTarget(item.display);
  const reportId = qpsChartReportIdForItem(item, target);

  if (!target || !reportId) {
    return null;
  }

  return { reportId, target };
}

function boundedQpsIndex(value: unknown, itemCount: number) {
  return Math.max(0, Math.min(Math.max(0, itemCount - 1), Math.trunc(asNumber(value))));
}

function qpsItemScoreDefaults(items: QpsItem[]): Record<string, QpsItemScore> {
  return Object.fromEntries(
    items.map((item) => [
      item.id,
      blankQpsItemScore(),
    ]),
  );
}

function blankQpsItemScore(status: QpsItemScore["status"] = "unscored"): QpsItemScore {
  return {
    errors: [],
    note: "",
    responseType: status === "correct" ? "correct" : "none",
    said: "",
    status,
    wholeWordResponse: "",
  };
}

function normalizeQpsResponseType(value: unknown, status: QpsItemScore["status"]): QpsResponseType {
  if (
    value === "correct"
    || value === "annotated-error"
    || value === "no-response"
    || value === "whole-word"
    || value === "none"
  ) {
    return value;
  }

  if (status === "correct") {
    return "correct";
  }

  return status === "missed" ? "annotated-error" : "none";
}

function qpsScoreWithDefaults(score: Partial<QpsItemScore> | undefined): QpsItemScore {
  const status = score?.status === "correct" || score?.status === "missed" ? score.status : "unscored";
  return {
    errors: Array.isArray(score?.errors) ? score.errors : [],
    note: score?.note ?? "",
    responseType: normalizeQpsResponseType(score?.responseType, status),
    said: score?.said ?? "",
    status,
    wholeWordResponse: score?.wholeWordResponse ?? "",
  };
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

function mapQpsCallOnRecord(doc: FirestoreDocSnapshot): QpsCallOnRecord {
  const data = asRecord(doc.data()) ?? {};

  return {
    completedAt: data.completedAt,
    correctAnswer: asText(data.correctAnswer),
    gameId: asText(data.gameId),
    gameTitle: asText(data.gameTitle),
    id: doc.id,
    incorrectSelection: asText(data.incorrectSelection),
    incorrectSelections: asArray(data.incorrectSelections),
    levelName: asText(data.levelName),
    missedQuestions: asArray(data.missedQuestions),
    mode: asText(data.mode),
    questionResponses: asArray(data.questionResponses),
    scholarDisplayName: asText(data.scholarDisplayName),
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    status: asText(data.status),
    teacherEmail: asText(data.teacherEmail),
    updatedAt: data.updatedAt,
    word: asText(data.word),
  };
}

function mapQpsSkillsOverride(doc: FirestoreDocSnapshot): QpsSkillsOverride | null {
  const data = asRecord(doc.data()) ?? {};
  const reportId = qpsOverrideReportId(data.reportId);
  const target = normalizeQpsSkillTarget(data.target);

  if (!target || qpsChartReportIdForTarget(target) !== reportId) {
    return null;
  }

  return {
    createdAt: data.createdAt,
    id: doc.id,
    reportId,
    scholarFirstNameKey: asText(data.scholarFirstNameKey),
    scholarId: asText(data.scholarId),
    status: data.status === "needs-review" ? "needs-review" : "mastered",
    target,
    teacherEmail: asText(data.teacherEmail),
    updatedAt: data.updatedAt,
  };
}

function qpsRosterScopedEmail(email: string) {
  return rosterTeacherEmailForEmail(email) || email;
}

function qpsRecordScholar(record: QpsCallOnRecord, scholars: QpsScholar[]) {
  if (record.scholarId) {
    const scholar = scholars.find((nextScholar) => nextScholar.id === record.scholarId);
    if (scholar) return scholar;
  }

  if (record.mode === "whole-class-miss" && record.scholarDisplayName) {
    const initials = cleanTrackingInitials(record.scholarDisplayName.replace(/-[0-9]+$/, ""));
    const recordTeacherEmail = qpsRosterScopedEmail(record.teacherEmail);
    const matches = scholars.filter((scholar) => {
      const teacherMatches = recordTeacherEmail === "unassigned" || scholar.teacherEmail === recordTeacherEmail;
      return teacherMatches && scholar.trackingInitials === initials;
    });

    if (matches.length === 1) {
      return matches[0];
    }
  }

  const matches = scholars.filter((scholar) => scholar.firstNameKey === record.scholarFirstNameKey);
  return matches.length === 1 ? matches[0] : null;
}

function qpsSectionsForItems(items: QpsItem[]) {
  return [...new Set(items.map((item) => item.section).filter(Boolean))];
}

function qpsShortSectionLabel(section: string) {
  return section.replace(/^Set\s+\d+\s*-\s*/i, "").trim() || section;
}

function qpsIsLastItemInSection(items: QpsItem[], index: number) {
  const item = items[index];
  const nextItem = items[index + 1];
  return Boolean(item) && (!nextItem || nextItem.section !== item.section);
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
    awardKey: asText(data.awardKey).trim(),
    awardSection: asText(data.awardSection).trim(),
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

function primaryQpsDisplay(value: string) {
  return value.replace(/a/g, "ɑ").replace(/g/g, "ɡ");
}

function qpsItemCharacters(item: QpsItem) {
  return Array.from(item.display);
}

function qpsExpectedSpan(item: QpsItem, startIndex: number, endIndex: number) {
  const characters = qpsItemCharacters(item);
  const start = Math.max(0, Math.min(startIndex, endIndex, characters.length - 1));
  const end = Math.max(start, Math.min(Math.max(startIndex, endIndex), characters.length - 1));
  return characters.slice(start, end + 1).join("");
}

function normalizeQpsAnnotation(value: unknown, item: QpsItem): QpsErrorAnnotation | null {
  const raw = asRecord(value);
  if (!raw) return null;

  const characters = qpsItemCharacters(item);
  const startIndex = Math.max(0, Math.min(characters.length - 1, Math.trunc(asNumber(raw.startIndex))));
  const endIndex = Math.max(startIndex, Math.min(characters.length - 1, Math.trunc(asNumber(raw.endIndex))));
  const expectedSpan = asText(raw.expectedSpan).trim() || qpsExpectedSpan(item, startIndex, endIndex);

  if (!expectedSpan) {
    return null;
  }

  return {
    actualResponse: asText(raw.actualResponse).trim(),
    endIndex,
    expectedSpan,
    id: asText(raw.id).trim() || `${startIndex}-${endIndex}-${slug(expectedSpan)}`,
    startIndex,
  };
}

function qpsAnnotationsFromValue(value: unknown, item: QpsItem) {
  return asArray(value)
    .map((annotation) => normalizeQpsAnnotation(annotation, item))
    .filter((annotation): annotation is QpsErrorAnnotation => Boolean(annotation));
}

function qpsErrorSummary(errors: QpsErrorAnnotation[]) {
  return errors
    .map((error) => `${error.expectedSpan}->${error.actualResponse || "?"}`)
    .join("; ");
}

function qpsSelectedText(score: QpsItemScore) {
  if (score.status === "correct") return "Correct";
  if (score.responseType === "no-response") return "No response";
  if (score.responseType === "whole-word") return score.wholeWordResponse.trim() || "Whole word wrong";
  return score.said.trim() || qpsErrorSummary(score.errors) || "Needs review";
}

function qpsPrintedStimulusHtml(item: QpsItem, score: QpsItemScore) {
  if (score.responseType === "no-response") {
    return `<span class="print-no-response"><b>NR</b><span class="print-expected">${escapeHtml(primaryQpsDisplay(item.display))}</span></span>`;
  }

  if (score.responseType === "whole-word") {
    return `<span class="print-whole-word"><em>${escapeHtml(score.wholeWordResponse || "Whole word wrong")}</em><span class="print-expected">${escapeHtml(primaryQpsDisplay(item.display))}</span></span>`;
  }

  if (!score.errors.length) {
    return `<span class="print-expected">${escapeHtml(primaryQpsDisplay(item.display))}</span>`;
  }

  const characters = qpsItemCharacters(item);
  const starts = new Map(score.errors.map((annotation) => [annotation.startIndex, annotation]));
  const covered = new Set<number>();
  score.errors.forEach((annotation) => {
    for (let index = annotation.startIndex; index <= annotation.endIndex; index += 1) {
      covered.add(index);
    }
  });

  return characters.map((character, index) => {
    const annotation = starts.get(index);
    if (annotation) {
      const spanCharacters = characters.slice(annotation.startIndex, annotation.endIndex + 1).join("");
      return `<span class="print-marked-span"><em>${escapeHtml(annotation.actualResponse || "?")}</em><b>${escapeHtml(primaryQpsDisplay(spanCharacters))}</b></span>`;
    }

    if (covered.has(index)) {
      return "";
    }

    return escapeHtml(primaryQpsDisplay(character));
  }).join("");
}

function qpsStimulusSizeClass(item: QpsItem) {
  const length = qpsItemCharacters(item).length;
  if (item.type === "sentence") return "is-sentence";
  if (length >= 13) return "is-long-word";
  if (length >= 9) return "is-medium-word";
  if (item.type === "word") return "is-word";
  return `is-${item.type}`;
}

function qpsAnnotationAtIndex(errors: QpsErrorAnnotation[], index: number) {
  return errors.find((error) => index >= error.startIndex && index <= error.endIndex) ?? null;
}

function safeQpsProgressText(value: string, fallback = "QPS item") {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return (cleaned || fallback).slice(0, 120);
}

function qpsProgressSessionId(formId: QpsFormId, scholar: QpsScholar) {
  return `qps-${formId.toLowerCase()}-${scholar.firstNameKey}-progress`;
}

function qpsQuestionResponse(item: QpsItem, itemIndex: number, score: QpsItemScore) {
  const correct = score.status === "correct";
  const selected = qpsSelectedText(score);
  const errors = score.errors.map((error) => ({ ...error }));

  return {
    attempts: [{
      correct,
      selected,
      timestamp: Date.now(),
    }],
    category: item.skill,
    correct,
    correctAnswer: item.display,
    errors,
    firstAttemptCorrect: correct,
    itemId: item.id,
    itemType: item.type,
    noResponse: score.responseType === "no-response",
    note: score.note.trim(),
    prompt: item.prompt,
    questionIndex: itemIndex + 1,
    responseType: score.responseType,
    section: item.section,
    sectionLabel: qpsDisplaySectionName(item.section),
    selected,
    skill: item.skill,
    target: item.target,
    wholeWordResponse: score.wholeWordResponse.trim(),
    word: item.display,
  };
}

function qpsMissedQuestion(item: QpsItem, itemIndex: number, score: QpsItemScore) {
  const selected = qpsSelectedText(score);
  const errors = score.errors.map((error) => ({ ...error }));

  return {
    category: item.skill,
    correctAnswer: item.display,
    errors,
    gameId: QPS_GAME_ID,
    gameTitle: QPS_GAME_TITLE,
    incorrectSelections: [selected],
    itemId: item.id,
    levelName: item.section,
    noResponse: score.responseType === "no-response",
    note: score.note.trim(),
    questionIndex: itemIndex + 1,
    responseType: score.responseType,
    sectionLabel: qpsDisplaySectionName(item.section),
    wholeWordResponse: score.wholeWordResponse.trim(),
    word: item.display,
  };
}

function qpsScoresFromProgress(data: Record<string, unknown>, items: QpsItem[]) {
  const nextScores = qpsItemScoreDefaults(items);
  const responses = Array.isArray(data.questionResponses) ? data.questionResponses : [];

  responses.forEach((response) => {
    const raw = asRecord(response);
    if (!raw) return;

    const itemId = asText(raw.itemId).trim();
    const questionIndex = Math.trunc(asNumber(raw.questionIndex)) - 1;
    const item =
      (itemId ? items.find((nextItem) => nextItem.id === itemId) : null)
      ?? (questionIndex >= 0 ? items[questionIndex] : undefined);

    if (!item) return;

    const selected = asText(raw.selected).trim();
    const correct = raw.correct === true || raw.firstAttemptCorrect === true || selected === "Correct";
    const responseType = normalizeQpsResponseType(raw.responseType, correct ? "correct" : "missed");
    const errors = qpsAnnotationsFromValue(raw.errors, item);
    const wholeWordResponse = asText(raw.wholeWordResponse).trim();
    nextScores[item.id] = {
      errors,
      note: asText(raw.note).trim(),
      responseType,
      said: correct ? "" : selected,
      status: correct ? "correct" : "missed",
      wholeWordResponse,
    };
  });

  return nextScores;
}

function qpsFirstText(...values: unknown[]) {
  for (const value of values) {
    const next = asText(value).trim();
    if (next) return next;
  }

  return "";
}

function qpsTargetEvidenceFromResponse(
  record: QpsCallOnRecord,
  response: unknown,
  chartTarget: { reportId: QpsSkillsOverride["reportId"]; target: string },
): QpsCallOnEvidence | null {
  const raw = asRecord(response);
  if (!raw) return null;

  const target = normalizeQpsSkillTarget(
    raw.target
    || raw.letter
    || raw.sound
    || raw.answer
    || raw.correctAnswer
    || raw.word
    || raw.display,
  );

  const reportId = qpsChartReportIdForEvidenceTarget(
    target,
    raw.section,
    raw.levelName,
    raw.levelId,
    raw.category,
    raw.skill,
    raw.itemType,
    raw.type,
    raw.prompt,
    record.levelName,
  );

  if (target !== chartTarget.target || reportId !== chartTarget.reportId) {
    return null;
  }

  const attempts = asArray(raw.attempts).map(asRecord).filter((attempt): attempt is Record<string, unknown> => Boolean(attempt));
  const firstAttempt = attempts[0];
  const firstAttemptCorrect =
    typeof raw.firstAttemptCorrect === "boolean"
      ? raw.firstAttemptCorrect
      : typeof firstAttempt?.correct === "boolean"
        ? firstAttempt.correct
        : undefined;
  const selected = qpsFirstText(
    firstAttempt?.selected,
    raw.selected,
    raw.selectedAnswer,
    raw.incorrectSelection,
    asArray(raw.incorrectSelections)[0],
  );
  const correct =
    firstAttemptCorrect
    ?? (typeof raw.correct === "boolean" ? raw.correct : undefined)
    ?? (typeof raw.eventuallyCorrect === "boolean" ? raw.eventuallyCorrect : undefined)
    ?? (selected ? normalizeQpsSkillTarget(selected) === target : false);
  const dateMs =
    evidenceDateMs(firstAttempt?.timestamp)
    || evidenceDateMs(raw.timestamp)
    || evidenceDateMs(record.updatedAt)
    || evidenceDateMs(record.completedAt)
    || 0;

  return {
    dateMs,
    source: record.gameTitle || QPS_GAME_TITLE,
    status: correct ? "mastered" : "needs-review",
  };
}

function qpsTargetEvidenceFromMiss(
  record: QpsCallOnRecord,
  missed: unknown,
  chartTarget: { reportId: QpsSkillsOverride["reportId"]; target: string },
): QpsCallOnEvidence | null {
  const raw = asRecord(missed);
  if (!raw) return null;

  const target = normalizeQpsSkillTarget(
    raw.correctAnswer
    || raw.word
    || record.correctAnswer
    || record.word,
  );

  const reportId = qpsChartReportIdForEvidenceTarget(
    target,
    raw.section,
    raw.levelName,
    raw.levelId,
    raw.category,
    raw.skill,
    raw.itemType,
    raw.type,
    record.levelName,
  );

  if (target !== chartTarget.target || reportId !== chartTarget.reportId) {
    return null;
  }

  return {
    dateMs: evidenceDateMs(record.updatedAt) || evidenceDateMs(record.completedAt) || 0,
    source: record.gameTitle || QPS_GAME_TITLE,
    status: "needs-review",
  };
}

function qpsCallOnScholarsForTarget(
  scholars: QpsScholar[],
  records: QpsCallOnRecord[],
  progressRecords: QpsCallOnRecord[],
  overrides: QpsSkillsOverride[],
  chartTarget: { reportId: QpsSkillsOverride["reportId"]; target: string } | null,
) {
  if (!chartTarget) {
    return [];
  }

  const evidenceByScholar = new Map<string, QpsCallOnEvidence[]>();

  [...records, ...progressRecords.filter((record) => record.status !== "completed")].forEach((record) => {
    const scholar = qpsRecordScholar(record, scholars);
    if (!scholar) return;

    const evidence = [
      ...record.questionResponses
        .map((response) => qpsTargetEvidenceFromResponse(record, response, chartTarget))
        .filter((nextEvidence): nextEvidence is QpsCallOnEvidence => Boolean(nextEvidence)),
      ...record.missedQuestions
        .map((missed) => qpsTargetEvidenceFromMiss(record, missed, chartTarget))
        .filter((nextEvidence): nextEvidence is QpsCallOnEvidence => Boolean(nextEvidence)),
    ];

    if (!evidence.length) return;

    evidenceByScholar.set(scholar.id, [
      ...(evidenceByScholar.get(scholar.id) ?? []),
      ...evidence,
    ]);
  });

  overrides.forEach((override) => {
    if (override.reportId !== chartTarget.reportId || override.target !== chartTarget.target) {
      return;
    }

    const scholar = scholars.find((nextScholar) =>
      nextScholar.id === override.scholarId
      || (
        nextScholar.firstNameKey === override.scholarFirstNameKey
        && (
          !override.teacherEmail
          || qpsRosterScopedEmail(override.teacherEmail) === qpsRosterScopedEmail(nextScholar.teacherEmail)
        )
      ),
    );

    if (!scholar) return;

    evidenceByScholar.set(scholar.id, [
      ...(evidenceByScholar.get(scholar.id) ?? []),
      {
        dateMs: evidenceDateMs(override.updatedAt) || evidenceDateMs(override.createdAt) || 0,
        source: "Teacher observation",
        status: override.status,
      },
    ]);
  });

  return scholars
    .map((scholar) => {
      const evidence = [...(evidenceByScholar.get(scholar.id) ?? [])]
        .sort((a, b) => b.dateMs - a.dateMs);
      const latest = evidence[0];
      const status: QpsCallOnStatus = latest?.status ?? "unassessed";

      return {
        ...scholar,
        reason: latest
          ? `${latest.status === "mastered" ? "Mastered" : "Needs review"} from ${latest.source}`
          : "No chart evidence yet",
        status,
      };
    })
    .filter((scholar) => scholar.status !== "mastered")
    .sort((a, b) => {
      if (a.status !== b.status) {
        return a.status === "needs-review" ? -1 : 1;
      }

      return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
    });
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
  const [visibleAward, setVisibleAward] = useState<QpsSectionAward | null>(null);
  const lastAwardKeyRef = useRef("");

  const selectedForm = forms[liveSession?.formId ?? "A"];
  const qpsItems = selectedForm.items;
  const currentIndex = boundedQpsIndex(liveSession?.currentIndex ?? 0, qpsItems.length);
  const currentItem = qpsItems[currentIndex] ?? qpsItems[0];
  const isConnected = liveSession?.active === true && liveSession.scholarFirstNameKey === profile.firstNameKey;
  const scholarShouldListenOnly = qpsIsLetterSoundsSection(currentItem?.section ?? "");
  const qpsSections = useMemo(() => qpsSectionsForItems(qpsItems), [qpsItems]);
  const currentSectionIndex = Math.max(0, qpsSections.indexOf(currentItem?.section ?? ""));
  const awardSectionIndex = liveSession?.awardSection ? qpsSections.indexOf(liveSession.awardSection) : -1;
  const completedSectionIndex = Math.max(awardSectionIndex, currentSectionIndex - 1);

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

  useEffect(() => {
    if (!liveSession?.awardKey || !liveSession.awardSection || liveSession.awardKey === lastAwardKeyRef.current) {
      return;
    }

    lastAwardKeyRef.current = liveSession.awardKey;
    setVisibleAward({ key: liveSession.awardKey, section: liveSession.awardSection });

    const handle = window.setTimeout(() => {
      setVisibleAward((currentAward) => currentAward?.key === liveSession.awardKey ? null : currentAward);
    }, 5000);

    return () => window.clearTimeout(handle);
  }, [liveSession?.awardKey, liveSession?.awardSection]);

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
              <strong>{selectedForm.label} - {qpsDisplaySectionName(currentItem.section)}</strong>
            </div>
            <div className="qps-scholar-progress" aria-label="QPS section progress">
              {qpsSections.map((section, index) => (
                <span
                  className={`${index <= completedSectionIndex ? "is-earned" : ""} ${index === currentSectionIndex ? "is-current" : ""}`}
                  key={section}
                  title={section}
                >
                  {index <= completedSectionIndex ? "STAR" : index + 1}
                </span>
              ))}
            </div>
            {visibleAward ? (
              <div className="qps-section-award" role="status" aria-live="polite">
                <span className="qps-award-medal">STAR</span>
                <div>
                  <strong>Section complete!</strong>
                  <p>You earned a star for {qpsShortSectionLabel(visibleAward.section)}. Keep going and try your best.</p>
                </div>
              </div>
            ) : null}
            <div className={`qps-scholar-card${scholarShouldListenOnly ? " is-listening-only" : ""}`}>
              {scholarShouldListenOnly ? (
                <>
                  <p>{qpsDisplaySectionName(currentItem.section)}</p>
                  <strong className="qps-listening-icon">Listen</strong>
                  <span>Listen to your teacher.</span>
                </>
              ) : (
                <>
                  <p>{qpsDisplaySectionName(currentItem.section)}</p>
                  <strong className={`qps-reader-display ${qpsStimulusSizeClass(currentItem)}`}>
                    {primaryQpsDisplay(currentItem.display)}
                  </strong>
                  <span>Read or say this for your teacher.</span>
                </>
              )}
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
  const [activeErrorId, setActiveErrorId] = useState("");
  const [autosaveStatus, setAutosaveStatus] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState("");
  const [formId, setFormId] = useState<QpsFormId>("A");
  const [hasCheckedScholarMode, setHasCheckedScholarMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveSessionSaving, setIsLiveSessionSaving] = useState(false);
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingWholeClassMiss, setIsSavingWholeClassMiss] = useState(false);
  const [liveSessionActive, setLiveSessionActive] = useState(false);
  const [liveSessionStatus, setLiveSessionStatus] = useState("");
  const [loadedProgressKey, setLoadedProgressKey] = useState("");
  const [loadedProgressStatus, setLoadedProgressStatus] = useState<"none" | "draft" | "completed">("none");
  const [qpsCallOnRecords, setQpsCallOnRecords] = useState<QpsCallOnRecord[]>([]);
  const [qpsCallOnProgressRecords, setQpsCallOnProgressRecords] = useState<QpsCallOnRecord[]>([]);
  const [qpsSkillsOverrides, setQpsSkillsOverrides] = useState<QpsSkillsOverride[]>([]);
  const [qpsSectionAward, setQpsSectionAward] = useState<QpsSectionAward | null>(null);
  const [forms, setForms] = useState<Record<QpsFormId, QpsForm>>(QPS_FORMS);
  const [scores, setScores] = useState<Record<string, QpsItemScore>>(() => qpsItemScoreDefaults(QPS_FORMS.A.items));
  const [scholars, setScholars] = useState<QpsScholar[]>([]);
  const [scholarSlideProfile, setScholarSlideProfile] = useState<QpsScholarSlideProfile | null>(null);
  const [selectedScholarId, setSelectedScholarId] = useState("");
  const [status, setStatus] = useState("");
  const [teacherEmail, setTeacherEmail] = useState("");
  const [wholeClassInitials, setWholeClassInitials] = useState("");
  const [wholeClassMissStatus, setWholeClassMissStatus] = useState("");
  const correctionInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const stimulusDragEndRef = useRef<number | null>(null);
  const stimulusDragStartRef = useRef<number | null>(null);
  const wholeClassInitialsRef = useRef<HTMLInputElement | null>(null);

  const selectedForm = forms[formId] ?? QPS_FORMS[formId];
  const qpsItems = selectedForm.items;
  const currentItem = qpsItems[currentIndex] ?? qpsItems[0];
  const currentScore = qpsScoreWithDefaults(scores[currentItem.id]);
  const selectedScholar = scholars.find((scholar) => scholar.id === selectedScholarId) ?? null;
  const isWholeClassMode = selectedScholarId === QPS_WHOLE_CLASS_MODE;
  const isIndividualExaminerMode = Boolean(selectedScholar) && !isWholeClassMode;
  const isExaminerSurfaceMode = isIndividualExaminerMode || isWholeClassMode;
  const canUseTeacherBoard = isAuthorizedTeacherEmail(teacherEmail);
  const signedInRosterTeacherEmail = rosterTeacherEmailForEmail(teacherEmail);
  const callOnRosterScholars = useMemo(
    () => signedInRosterTeacherEmail
      ? scholars.filter((scholar) => scholar.teacherEmail === signedInRosterTeacherEmail)
      : [],
    [scholars, signedInRosterTeacherEmail],
  );
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
  const progressSessionId = selectedScholar ? qpsProgressSessionId(formId, selectedScholar) : "";
  const scoredItems = useMemo(
    () => qpsItems.filter((item) => scores[item.id]?.status !== "unscored"),
    [qpsItems, scores],
  );
  const correctCount = scoredItems.filter((item) => scores[item.id]?.status === "correct").length;
  const missedCount = scoredItems.filter((item) => scores[item.id]?.status === "missed").length;
  const percent = scoredItems.length ? Math.round((correctCount / scoredItems.length) * 100) : 0;
  const qpsSections = useMemo(() => qpsSectionsForItems(qpsItems), [qpsItems]);
  const currentSectionItems = qpsItems.filter((item) => item.section === currentItem.section);
  const currentSectionItemIndex = Math.max(0, currentSectionItems.findIndex((item) => item.id === currentItem.id));
  const currentSectionScoredCount = currentSectionItems.filter((item) => scores[item.id]?.status !== "unscored").length;
  const currentChartTarget = qpsChartTargetForItem(currentItem);
  const qpsCallOnScholars = useMemo(
    () => qpsCallOnScholarsForTarget(
      callOnRosterScholars,
      qpsCallOnRecords,
      qpsCallOnProgressRecords,
      qpsSkillsOverrides,
      currentChartTarget,
    ),
    [callOnRosterScholars, currentChartTarget, qpsCallOnProgressRecords, qpsCallOnRecords, qpsSkillsOverrides],
  );

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isTeacherLaunch = params.get("teacher") === "1";
    const firstName = asText(params.get("player")).trim();
    const firstNameKey = asText(params.get("key")).trim() || normalizeNameKey(firstName);
    const isWholeClassLaunch = params.get("wholeClass") === "1";

    if (isWholeClassLaunch || isTeacherLaunch) {
      setSelectedScholarId(QPS_WHOLE_CLASS_MODE);
    }

    if (!isTeacherLaunch && params.get("live") === "1" && firstName && firstNameKey && normalizeNameKey(firstName) === firstNameKey) {
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
        setQpsCallOnRecords([]);
        setQpsCallOnProgressRecords([]);
        setQpsSkillsOverrides([]);
        return;
      }

      const [snapshot, resultSnapshot, progressSnapshot, overrideSnapshot] = await Promise.all([
        db.collection(SCHOLAR_COLLECTION).get(),
        db.collection(RESULT_COLLECTION).get(),
        db.collection(PROGRESS_COLLECTION).get(),
        db.collection(SKILLS_DATA_OVERRIDE_COLLECTION).get(),
      ]);
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
      setQpsCallOnRecords(resultSnapshot.docs.map(mapQpsCallOnRecord));
      setQpsCallOnProgressRecords(progressSnapshot.docs.map(mapQpsCallOnRecord));
      setQpsSkillsOverrides(
        overrideSnapshot.docs
          .map(mapQpsSkillsOverride)
          .filter((override): override is QpsSkillsOverride => Boolean(override)),
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
    if (selectedScholar) return;

    setScores(qpsItemScoreDefaults(qpsItems));
    setCurrentIndex(0);
    setQpsSectionAward(null);
    setActiveErrorId("");
    setAutosaveStatus("");
    setLoadedProgressKey("");
    setLoadedProgressStatus("none");
    setStatus("");
  }, [qpsItems, selectedScholar]);

  useEffect(() => {
    let cancelled = false;

    if (!selectedScholar || !isAuthorizedTeacherEmail(teacherEmail)) {
      setLoadedProgressKey("");
      setLoadedProgressStatus("none");
      return () => {
        cancelled = true;
      };
    }

    const nextProgressSessionId = qpsProgressSessionId(formId, selectedScholar);
    setLoadedProgressKey("");
    setLoadedProgressStatus("none");
    setScores(qpsItemScoreDefaults(qpsItems));
    setCurrentIndex(0);
    setStatus("");

    loadFirebase()
      .then(async ({ db }) => {
        const snapshot = await db.collection(PROGRESS_COLLECTION).doc(nextProgressSessionId).get();
        if (cancelled) return;

        const data = asRecord(snapshot.data());
        const statusValue = asText(data?.status);
        const isMatchingQpsProgress =
          snapshot.exists !== false
          && data
          && asText(data.gameId) === QPS_GAME_ID
          && asText(data.scholarFirstNameKey) === selectedScholar.firstNameKey;

        if (isMatchingQpsProgress) {
          const restoredIndex = boundedQpsIndex(asNumber(data.currentQuestionIndex) - 1, qpsItems.length);
          setScores(qpsScoresFromProgress(data, qpsItems));
          setCurrentIndex(restoredIndex);
          setLoadedProgressStatus(statusValue === "completed" ? "completed" : "draft");
          setStatus(
            statusValue === "completed"
              ? `Loaded saved QPS for ${selectedScholar.firstName}.`
              : `Resumed ${selectedScholar.firstName}'s QPS at item ${restoredIndex + 1}.`,
          );
        } else {
          setLoadedProgressStatus("none");
        }

        setLoadedProgressKey(nextProgressSessionId);
      })
      .catch((nextError) => {
        if (cancelled) return;
        setLoadedProgressKey(nextProgressSessionId);
        setLoadedProgressStatus("none");
        setError(nextError instanceof Error ? nextError.message : "QPS progress could not load.");
      });

    return () => {
      cancelled = true;
    };
  }, [formId, progressSessionId, qpsItems, selectedScholar, teacherEmail]);

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

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        throw new Error("Sign in with an authorized teacher account before starting live QPS.");
      }

      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      await db
        .collection(QPS_LIVE_SESSION_COLLECTION)
        .doc(liveTarget.firstNameKey)
        .set({
          active,
          awardKey: active ? qpsSectionAward?.key ?? "" : "",
          awardSection: active ? qpsSectionAward?.section ?? "" : "",
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

  const saveQpsProgress = async (progressStatus: "started" | "in-progress" | "left-early" | "completed" = "in-progress") => {
    if (!selectedScholar || !progressSessionId || !qpsItems.length) {
      return;
    }

    try {
      if (progressStatus !== "completed") {
        setAutosaveStatus("Saving...");
      }

      const { auth, db, firebase } = await loadFirebase();
      const signedInEmail = auth.currentUser?.email?.trim().toLowerCase() ?? "";

      if (!isAuthorizedTeacherEmail(signedInEmail)) {
        return;
      }

      const serverTime = firebase.firestore.FieldValue.serverTimestamp();
      const missedItems = scoredItems.filter((item) => scores[item.id]?.status === "missed");
      const progressMissedItems = missedItems.slice(0, 100);
      const currentDisplay = safeQpsProgressText(currentItem?.display ?? "", "QPS item");
      const currentLabel = safeQpsProgressText(currentItem?.prompt || currentItem?.section || "QPS item", "QPS item").slice(0, 100);
      const reachedCount = Math.min(qpsItems.length, Math.max(currentIndex + 1, scoredItems.length, 1));

      await db.collection(PROGRESS_COLLECTION).doc(progressSessionId).set({
        assessmentId: QPS_GAME_ID,
        assessmentVersion: selectedForm.version,
        categoryScores: sectionTotals(scores, qpsItems),
        completedAt: progressStatus === "completed" ? serverTime : null,
        createdAt: serverTime,
        currentQuestionIndex: Math.min(qpsItems.length, currentIndex + 1),
        currentQuestionLabel: currentLabel,
        currentWord: currentDisplay,
        gameId: QPS_GAME_ID,
        gameTitle: QPS_GAME_TITLE,
        incorrectSelections: progressMissedItems.map((item) => qpsSelectedText(qpsScoreWithDefaults(scores[item.id]))),
        learningLocation: "school",
        levelId: "qps-full-screener",
        levelIndex: 0,
        levelName: "QPS Screener",
        missedCount: progressMissedItems.length,
        missedQuestions: progressMissedItems.map((item) => {
          const itemIndex = qpsItems.findIndex((nextItem) => nextItem.id === item.id);
          return qpsMissedQuestion(item, itemIndex >= 0 ? itemIndex : 0, qpsScoreWithDefaults(scores[item.id]));
        }),
        mode: "session-progress",
        percentComplete: Math.round((reachedCount / qpsItems.length) * 100),
        questionResponses: scoredItems.map((item) => {
          const itemIndex = qpsItems.findIndex((nextItem) => nextItem.id === item.id);
          return qpsQuestionResponse(item, itemIndex >= 0 ? itemIndex : 0, qpsScoreWithDefaults(scores[item.id]));
        }),
        questionsCompleted: reachedCount,
        responseTimesMs: [],
        schemaVersion: 1,
        scholarFirstName: selectedScholar.firstName,
        scholarFirstNameKey: selectedScholar.firstNameKey,
        scholarId: null,
        score: correctCount,
        sessionId: progressSessionId,
        status: progressStatus,
        teacherEmail: selectedScholar.teacherEmail,
        totalQuestions: qpsItems.length,
        updatedAt: serverTime,
      }, { merge: true });

      if (progressStatus !== "completed") {
        setAutosaveStatus("Saved");
      }
    } catch {
      if (progressStatus !== "completed") {
        setAutosaveStatus("Autosave paused");
      }
      // Draft progress should never block live scoring or final QPS saving.
    }
  };

  useEffect(() => {
    if (
      !selectedScholar
      || !progressSessionId
      || loadedProgressKey !== progressSessionId
      || !isAuthorizedTeacherEmail(teacherEmail)
      || loadedProgressStatus === "completed"
      || !scoredItems.length
    ) {
      return;
    }

    const handle = window.setTimeout(() => {
      void saveQpsProgress("in-progress");
    }, 600);

    return () => window.clearTimeout(handle);
  }, [
    correctCount,
    currentIndex,
    currentItem,
    formId,
    loadedProgressKey,
    loadedProgressStatus,
    missedCount,
    progressSessionId,
    qpsItems,
    scoredItems,
    scores,
    selectedForm.version,
    selectedScholar,
    teacherEmail,
  ]);

  useEffect(() => {
    if (!liveSessionActive || !selectedLiveTarget || scholarSlideProfile) {
      return;
    }

    const handle = window.setTimeout(() => {
      void writeLiveSession(true, true);
    }, 175);

    return () => window.clearTimeout(handle);
  }, [currentIndex, formId, liveSessionActive, qpsSectionAward, selectedLiveTarget, scholarSlideProfile]);

  useEffect(() => {
    if (!activeErrorId) {
      return;
    }

    const handle = window.setTimeout(() => {
      const input = correctionInputRefs.current[activeErrorId];
      input?.focus({ preventScroll: true });
      input?.select();
    }, 40);

    return () => window.clearTimeout(handle);
  }, [activeErrorId, currentIndex]);

  const focusCorrectionInput = (annotationId: string) => {
    const focusNow = () => {
      const input = correctionInputRefs.current[annotationId];
      if (!input) return false;
      input.focus({ preventScroll: true });
      input.select();
      return true;
    };

    if (focusNow()) return;
    window.requestAnimationFrame(focusNow);
    window.setTimeout(focusNow, 30);
  };

  const updateCurrentScore = (update: Partial<QpsItemScore>) => {
    if (loadedProgressStatus === "completed") {
      setLoadedProgressStatus("draft");
    }

    setScores((currentScores) => ({
      ...currentScores,
      [currentItem.id]: {
        ...currentScore,
        ...update,
      },
    }));
  };

  const updateAnnotationResponse = (annotationId: string, actualResponse: string) => {
    const errors = currentScore.errors.map((annotation) =>
      annotation.id === annotationId
        ? { ...annotation, actualResponse }
        : annotation,
    );
    const nextWholeWordResponse = currentScore.responseType === "whole-word"
      ? actualResponse
      : currentScore.wholeWordResponse;
    const nextResponseType = currentScore.responseType === "whole-word" ? "whole-word" : "annotated-error";

    updateCurrentScore({
      errors,
      responseType: nextResponseType,
      said: nextResponseType === "whole-word"
        ? nextWholeWordResponse.trim() || "Whole word wrong"
        : qpsErrorSummary(errors),
      status: "missed",
      wholeWordResponse: nextWholeWordResponse,
    });
  };

  const removeAnnotation = (annotationId: string) => {
    const errors = currentScore.errors.filter((annotation) => annotation.id !== annotationId);
    updateCurrentScore({
      errors,
      responseType: errors.length ? "annotated-error" : "none",
      said: qpsErrorSummary(errors),
      status: errors.length ? "missed" : "unscored",
    });
    setActiveErrorId("");
  };

  const markStimulusRange = (startIndex: number, endIndex: number, responseType: QpsItemScore["responseType"] = "annotated-error") => {
    if (!isExaminerSurfaceMode) {
      return;
    }

    const characters = qpsItemCharacters(currentItem);
    let start = Math.max(0, Math.min(startIndex, endIndex, characters.length - 1));
    let end = Math.max(start, Math.min(Math.max(startIndex, endIndex), characters.length - 1));

    while (start <= end && /\s/.test(characters[start] ?? "")) start += 1;
    while (end >= start && /\s/.test(characters[end] ?? "")) end -= 1;

    if (start > end) {
      return;
    }

    const id = `${currentItem.id}-${start}-${end}-${Date.now()}`;
    const nextAnnotation: QpsErrorAnnotation = {
      actualResponse: responseType === "whole-word" ? currentScore.wholeWordResponse : "",
      endIndex: end,
      expectedSpan: qpsExpectedSpan(currentItem, start, end),
      id,
      startIndex: start,
    };
    const errors = currentScore.errors.filter((annotation) =>
      annotation.endIndex < start || annotation.startIndex > end,
    );
    const nextErrors = [...errors, nextAnnotation];

    flushSync(() => {
      updateCurrentScore({
        errors: nextErrors,
        responseType,
        said: responseType === "whole-word"
          ? currentScore.wholeWordResponse.trim() || "Whole word wrong"
          : qpsErrorSummary(nextErrors),
        status: "missed",
        wholeWordResponse: responseType === "whole-word" ? currentScore.wholeWordResponse : "",
      });
      setActiveErrorId(id);
    });
    focusCorrectionInput(id);
  };

  const markStimulusSpan = (index: number) => {
    if (!isExaminerSurfaceMode || /\s/.test(qpsItemCharacters(currentItem)[index] ?? "")) {
      return;
    }

    const activeAnnotation = currentScore.errors.find((annotation) => annotation.id === activeErrorId);
    const canExtendActive =
      activeAnnotation
      && (
        index >= activeAnnotation.startIndex - 1
        && index <= activeAnnotation.endIndex + 1
      );

    if (canExtendActive) {
      const startIndex = Math.min(activeAnnotation.startIndex, index);
      const endIndex = Math.max(activeAnnotation.endIndex, index);
      const errors = currentScore.errors.map((annotation) =>
        annotation.id === activeAnnotation.id
          ? {
            ...annotation,
            endIndex,
            expectedSpan: qpsExpectedSpan(currentItem, startIndex, endIndex),
            startIndex,
          }
          : annotation,
      );

      flushSync(() => {
        updateCurrentScore({
          errors,
          responseType: "annotated-error",
          said: qpsErrorSummary(errors),
          status: "missed",
        });
        setActiveErrorId(activeAnnotation.id);
      });
      focusCorrectionInput(activeAnnotation.id);
      return;
    }

    const existingAnnotation = qpsAnnotationAtIndex(currentScore.errors, index);
    if (existingAnnotation) {
      setActiveErrorId(existingAnnotation.id);
      focusCorrectionInput(existingAnnotation.id);
      return;
    }

    const id = `${currentItem.id}-${index}-${Date.now()}`;
    const nextAnnotation: QpsErrorAnnotation = {
      actualResponse: "",
      endIndex: index,
      expectedSpan: qpsExpectedSpan(currentItem, index, index),
      id,
      startIndex: index,
    };
    const errors = [...currentScore.errors, nextAnnotation];

    flushSync(() => {
      updateCurrentScore({
        errors,
        responseType: "annotated-error",
        said: qpsErrorSummary(errors),
        status: "missed",
        wholeWordResponse: "",
      });
      setActiveErrorId(id);
    });
    focusCorrectionInput(id);
  };

  const beginStimulusDrag = (index: number) => {
    if (!isExaminerSurfaceMode || /\s/.test(qpsItemCharacters(currentItem)[index] ?? "")) {
      return;
    }

    stimulusDragStartRef.current = index;
    stimulusDragEndRef.current = index;
  };

  const previewStimulusDrag = (index: number) => {
    if (stimulusDragStartRef.current === null || /\s/.test(qpsItemCharacters(currentItem)[index] ?? "")) {
      return;
    }

    stimulusDragEndRef.current = index;
  };

  const finishStimulusDrag = (index: number) => {
    const startIndex = stimulusDragStartRef.current;
    const endIndex = stimulusDragEndRef.current ?? index;
    stimulusDragStartRef.current = null;
    stimulusDragEndRef.current = null;

    if (startIndex === null) {
      return;
    }

    if (startIndex === endIndex) {
      markStimulusSpan(index);
      return;
    }

    markStimulusRange(startIndex, endIndex);
  };

  const queueSectionAward = (section: string) => {
    if (!section) {
      return;
    }

    setQpsSectionAward({
      key: `${Date.now()}-${slug(section).slice(0, 32)}`,
      section,
    });
  };

  const markCorrect = () => {
    if (qpsIsLastItemInSection(qpsItems, currentIndex)) {
      queueSectionAward(currentItem.section);
    }

    updateCurrentScore({
      errors: [],
      responseType: "correct",
      said: "",
      status: "correct",
      wholeWordResponse: "",
    });
    setActiveErrorId("");
    setWholeClassMissStatus("");

    if (currentIndex < qpsItems.length - 1) {
      setCurrentIndex((index) => Math.min(qpsItems.length - 1, index + 1));
    }
  };

  const markNeedsReview = () => {
    updateCurrentScore({ responseType: "annotated-error", status: "missed" });
    setWholeClassMissStatus("");

    if (isWholeClassMode) {
      window.setTimeout(() => wholeClassInitialsRef.current?.focus(), 50);
    }
  };

  const markNoResponse = () => {
    updateCurrentScore({
      errors: [],
      responseType: "no-response",
      said: "No response",
      status: "missed",
      wholeWordResponse: "",
    });
    setActiveErrorId("");
  };

  const markWholeWordWrong = () => {
    markStimulusRange(0, qpsItemCharacters(currentItem).length - 1, "whole-word");
  };

  const updateWholeWordResponse = (wholeWordResponse: string) => {
    const errors = currentScore.errors.length
      ? currentScore.errors.map((annotation, index) =>
        index === currentScore.errors.length - 1
          ? { ...annotation, actualResponse: wholeWordResponse }
          : annotation,
      )
      : currentScore.errors;

    updateCurrentScore({
      errors,
      responseType: "whole-word",
      said: wholeWordResponse.trim() || "Whole word wrong",
      status: "missed",
      wholeWordResponse,
    });
  };

  const undoCurrentItem = () => {
    if (currentScore.errors.length) {
      const errors = currentScore.errors.slice(0, -1);
      updateCurrentScore({
        errors,
        responseType: errors.length ? "annotated-error" : "none",
        said: qpsErrorSummary(errors),
        status: errors.length ? "missed" : "unscored",
      });
      setActiveErrorId(errors[errors.length - 1]?.id ?? "");
      return;
    }

    updateCurrentScore(blankQpsItemScore());
    setActiveErrorId("");
  };

  const resetCurrentItem = () => {
    updateCurrentScore(blankQpsItemScore());
    setActiveErrorId("");
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
      const normalizedScore = qpsScoreWithDefaults(currentScore);
      const selected = qpsSelectedText(normalizedScore);
      const note = currentScore.note.trim();
      const teacherForMiss =
        rosterTeacherEmailForEmail(teacherEmail)
        || selectedScholar?.teacherEmail
        || "unassigned";
      const localCompletedAt = Date.now();

      updateCurrentScore({ said: selected, status: "missed" });

      const missPayload = {
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
          note,
          errors: normalizedScore.errors,
          noResponse: normalizedScore.responseType === "no-response",
          responseType: normalizedScore.responseType,
          sectionLabel: qpsDisplaySectionName(currentItem.section),
          wholeWordResponse: normalizedScore.wholeWordResponse,
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
          note,
          errors: normalizedScore.errors,
          noResponse: normalizedScore.responseType === "no-response",
          responseType: normalizedScore.responseType,
          sectionLabel: qpsDisplaySectionName(currentItem.section),
          wholeWordResponse: normalizedScore.wholeWordResponse,
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
      };

      await db.collection(RESULT_COLLECTION).add(missPayload);
      setQpsCallOnRecords((currentRecords) => [
        {
          ...mapQpsCallOnRecord({
            data: () => ({
              ...missPayload,
              completedAt: localCompletedAt,
              updatedAt: localCompletedAt,
            }),
            id: `local-${localCompletedAt}`,
          }),
        },
        ...currentRecords,
      ]);

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
    setActiveErrorId("");
    setAutosaveStatus("");
    setIsItemDrawerOpen(false);
    setQpsSectionAward(null);
    setWholeClassMissStatus("");

    if (nextScholarId === QPS_WHOLE_CLASS_MODE) {
      setLiveSessionStatus("Whole Class Mode is on. Enter initials when a scholar needs review.");
    }
  };

  const goToNext = () => {
    const nextIndex = Math.min(qpsItems.length - 1, currentIndex + 1);
    if (nextIndex !== currentIndex && qpsItems[currentIndex]?.section !== qpsItems[nextIndex]?.section) {
      queueSectionAward(qpsItems[currentIndex].section);
    }
    setActiveErrorId("");
    setCurrentIndex(nextIndex);
    setWholeClassMissStatus("");
  };

  const goToPrevious = () => {
    setActiveErrorId("");
    setCurrentIndex((index) => Math.max(0, index - 1));
    setWholeClassMissStatus("");
  };

  const finishExaminerEntry = () => {
    setActiveErrorId("");
    goToNext();
  };

  const resetScores = () => {
    setScores(qpsItemScoreDefaults(qpsItems));
    setCurrentIndex(0);
    setQpsSectionAward(null);
    setActiveErrorId("");
    setAutosaveStatus("");
    setStatus("");
    setWholeClassMissStatus("");
  };

  useEffect(() => {
    if (!isExaminerSurfaceMode) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target
        && (
          target.tagName === "INPUT"
          || target.tagName === "TEXTAREA"
          || target.tagName === "SELECT"
          || target.isContentEditable
        )
      ) {
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        markCorrect();
      } else if (event.key.toLowerCase() === "n") {
        event.preventDefault();
        markNoResponse();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPrevious();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        goToNext();
      } else if (event.key === "Escape") {
        event.preventDefault();
        undoCurrentItem();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, currentScore, isExaminerSurfaceMode, qpsItems]);

  const printQps = () => {
    const reportWindow = window.open("", "_blank");
    const scholarName = selectedScholar ? `${selectedScholar.firstName} ${selectedScholar.lastName}` : "No scholar selected";
    const totals = sectionTotals(scores, qpsItems);
    const today = new Date().toLocaleDateString();
    const teacherName = selectedScholar
      ? teacherLabelForEmail(selectedScholar.teacherEmail)
      : teacherEmail
        ? teacherLabelForEmail(teacherEmail)
        : "";
    const scoreForItems = (items: QpsItem[]) => {
      const correct = items.filter((item) => qpsScoreWithDefaults(scores[item.id]).status === "correct").length;
      return `${correct}/${items.length}`;
    };
    const commentsForItems = (items: QpsItem[]) =>
      items
        .map((item) => {
          const note = qpsScoreWithDefaults(scores[item.id]).note.trim();
          return note ? `${primaryQpsDisplay(item.display)}: ${note}` : "";
        })
        .filter(Boolean)
        .join(" | ");
    const renderItems = (items: QpsItem[], className: string) => `
      <div class="item-grid ${className}">
        ${items.map((item) => {
          const score = qpsScoreWithDefaults(scores[item.id]);
          const statusClass = score.status === "correct"
            ? "is-correct"
            : score.status === "missed"
              ? "is-missed"
              : "is-unscored";
          return `<span class="print-item ${statusClass}">${qpsPrintedStimulusHtml(item, score)}</span>`;
        }).join("")}
      </div>
    `;
    const renderScoreBox = (items: QpsItem[], isLetterSounds = false) => `
      <div class="score-box">
        <span>Score</span>
        ${isLetterSounds ? `<small>/21 con<br>/5 vow</small>` : ""}
        <strong>${scoreForItems(items)}</strong>
      </div>
    `;
    const renderSection = (section: string) => {
      const sectionItems = qpsItems.filter((item) => item.section === section);
      const total = totals[section] ?? { correct: 0, missed: 0, skipped: 0, total: 0 };
      const setNumber = qpsSetNumber(section);
      const wordItems = sectionItems.filter((item) => item.type !== "sentence");
      const sentenceItems = sectionItems.filter((item) => item.type === "sentence");
      const comments = commentsForItems(sectionItems);
      const sectionClass = sentenceItems.length ? "has-task-b" : "single-task";
      const firstTaskRowClass = sentenceItems.length ? "task-row" : "task-row no-task-label";
      const wordGridClass = setNumber >= 10 ? "is-words is-long-words" : "is-words";

      if (setNumber <= 2) {
        return `
          <section class="sheet-set set-${setNumber} ${sectionClass}">
            <div class="set-number">${setNumber}</div>
            <div class="set-content">
              <div class="set-title"><strong>Skill Set ${setNumber}:</strong> ${escapeHtml(qpsDisplaySectionName(section).replace(/^Set \d+ - /, ""))}</div>
              <div class="task-row no-task-label">
                <div class="task-items">${renderItems(sectionItems, "is-letters")}</div>
                ${renderScoreBox(sectionItems, setNumber === 2)}
              </div>
              <div class="comments-line"><strong>Comments:</strong> ${escapeHtml(comments)}</div>
            </div>
          </section>
        `;
      }

      return `
        <section class="sheet-set set-${setNumber} ${sectionClass}">
          <div class="set-number">${setNumber}</div>
          <div class="set-content">
            <div class="set-title">
              <strong>Skill Set ${setNumber}:</strong> ${escapeHtml(qpsDisplaySectionName(section).replace(/^Set \d+ - /, ""))}
              <em>${total.correct}/${sectionItems.length} scored correct</em>
            </div>
            <div class="${firstTaskRowClass}">
              ${sentenceItems.length ? `<div class="task-label">Task A</div>` : ""}
              <div class="task-items">${renderItems(wordItems, wordGridClass)}</div>
              ${renderScoreBox(wordItems)}
            </div>
            ${sentenceItems.length ? `
              <div class="task-row">
                <div class="task-label">Task B</div>
                <div class="task-items">${renderItems(sentenceItems, "is-sentences")}</div>
                ${renderScoreBox(sentenceItems)}
              </div>
            ` : ""}
            <div class="comments-line"><strong>Comments:</strong> ${escapeHtml(comments)}</div>
          </div>
        </section>
      `;
    };
    const renderHeader = (continued = false) => `
      <header class="sheet-header ${continued ? "continued" : ""}">
        <div class="brand-block">
          <span class="brand-mark">qps</span>
          <h1>Quick<br>Phonics<br>Screener</h1>
        </div>
        <div class="form-title">
          <strong>Examiner Scoring Sheet</strong>
          <span>${escapeHtml(selectedForm.label.toUpperCase())}${continued ? " (continued)" : ""}</span>
        </div>
        <div class="student-fields">
          <p><strong>Student</strong><span>${escapeHtml(scholarName)}</span></p>
          <p><strong>Teacher</strong><span>${escapeHtml(teacherName)}</span></p>
          <p><strong>Date</strong><span>${escapeHtml(today)}</span><strong>Grade</strong><span></span></p>
        </div>
      </header>
    `;
    const firstPageSections = qpsSections.filter((section) => qpsSetNumber(section) <= 6);
    const secondPageSections = qpsSections.filter((section) => qpsSetNumber(section) >= 7);
    const firstPageHtml = firstPageSections.map(renderSection).join("");
    const secondPageHtml = secondPageSections.map(renderSection).join("");

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
          @page{size:letter portrait;margin:.28in}
          html,body{margin:0;padding:0}
          body{font-family:"Times New Roman",Times,serif;color:#111;background:#fff}
          .sheet-page{box-sizing:border-box;width:100%;height:10.35in;overflow:hidden;break-after:page;page-break-after:always}
          .sheet-page:last-child{break-after:auto;page-break-after:auto}
          .sheet-header{display:grid;grid-template-columns:185px 1fr 300px;gap:10px;align-items:start;margin:0 0 5px}
          .sheet-header.continued{grid-template-columns:1fr 330px}
          .sheet-header.continued .brand-block{display:none}
          .brand-block{display:grid;grid-template-columns:50px 1fr;gap:7px;align-items:center}
          .brand-mark{display:grid;place-items:center;width:46px;height:46px;border:1px solid #111;border-radius:50%;font:bold 11px Arial,sans-serif;text-transform:uppercase}
          .brand-block h1{margin:0;font:700 22px/0.95 Arial,Helvetica,sans-serif}
          .form-title{padding-top:8px;font-family:Arial,Helvetica,sans-serif}
          .form-title strong{display:block;font-size:18px}
          .form-title span{display:block;font-size:25px;letter-spacing:.03em}
          .sheet-header.continued .form-title span{display:inline;font-size:16px;font-style:italic;margin-left:4px}
          .student-fields{font:15px Arial,Helvetica,sans-serif}
          .student-fields p{display:grid;grid-template-columns:62px 1fr;gap:5px;align-items:end;margin:0 0 6px}
          .student-fields p:last-child{grid-template-columns:54px 1fr 48px 60px}
          .student-fields span{min-height:16px;border-bottom:1px solid #111}
          .sheet-set{display:grid;grid-template-columns:44px 1fr;border:1.4px solid #111;border-bottom:0;break-inside:avoid}
          .sheet-set:last-child{border-bottom:1.6px solid #111}
          .set-number{display:grid;place-items:center;border-right:1.2px solid #111;font:36px Arial,Helvetica,sans-serif}
          .set-content{min-width:0}
          .set-title{display:flex;align-items:center;justify-content:space-between;gap:8px;border-bottom:1px solid #111;background:#f2f2f2;padding:2px 7px;font:bold 14px Arial,Helvetica,sans-serif}
          .set-title em{font:11px Arial,Helvetica,sans-serif;color:#444}
          .task-row{display:grid;grid-template-columns:48px 1fr 66px;border-bottom:1px solid #111;min-height:34px}
          .task-row.no-task-label{grid-template-columns:1fr 66px}
          .task-label{display:grid;place-items:center;border-right:1px solid #111;font:bold 13px Arial,Helvetica,sans-serif}
          .task-items{padding:4px 8px}
          .item-grid{display:grid;gap:8px 22px;align-items:end}
          .item-grid.is-letters{grid-template-columns:repeat(13,minmax(20px,1fr));gap:7px 14px}
          .item-grid.is-words{grid-template-columns:repeat(5,minmax(0,1fr));gap:6px 12px}
          .item-grid.is-long-words{grid-template-columns:repeat(5,minmax(88px,1fr));gap:5px 10px}
          .item-grid.is-sentences{grid-template-columns:repeat(2,minmax(190px,1fr));gap:7px 18px}
          .print-item{display:block;text-align:center;min-height:18px;font-size:16px;line-height:1.2;text-decoration:none}
          .item-grid.is-long-words .print-item{font-size:12px;line-height:1.1;white-space:nowrap;overflow-wrap:normal}
          .is-missed{color:#9a2f1b}
          .is-unscored{color:#777}
          .score-box{display:grid;grid-template-rows:18px 1fr;align-items:end;border-left:1px solid #111;text-align:right;padding:0 4px 4px;font:16px Arial,Helvetica,sans-serif}
          .score-box span{align-self:start;text-align:center;border-bottom:1px solid #111;font:12px "Times New Roman",Times,serif}
          .score-box small{font-size:9px;line-height:1.1;text-align:right;color:#222}
          .score-box strong{font-weight:400}
          .comments-line{min-height:17px;padding:2px 7px;font-size:13px;line-height:1.15}
          .comments-line strong{font-weight:400}
          .print-expected{display:inline-block;border-bottom:1px solid #111;padding:0 1px;line-height:1.05}
          .print-marked-span{display:inline-grid;grid-template-rows:auto auto;place-items:center;margin:0 1px;color:#912f1a;text-decoration:none;vertical-align:bottom}
          .print-marked-span em{font:700 11px Arial,Helvetica,sans-serif;line-height:1;text-decoration:none;color:#912f1a}
          .print-marked-span b{border-bottom:1px solid #111;font-weight:400;line-height:1.05;text-decoration:line-through;text-decoration-thickness:1.4px;text-decoration-color:#912f1a}
          .print-whole-word,.print-no-response{display:inline-grid;grid-template-rows:auto auto;gap:0;place-items:center;text-decoration:none}
          .print-whole-word em,.print-no-response b{color:#912f1a;font:700 11px Arial,Helvetica,sans-serif;text-decoration:none}
          .sheet-footer{display:flex;justify-content:space-between;margin:6px 22px 0;font:12px Arial,Helvetica,sans-serif}
        </style>
      </head>
      <body>
        <main>
          <section class="sheet-page">
            ${renderHeader(false)}
            ${firstPageHtml}
            <footer class="sheet-footer"><span>Quick Phonics Screener</span><span>Digital Examiner Sheet</span></footer>
          </section>
          <section class="sheet-page">
            ${renderHeader(true)}
            ${secondPageHtml}
            <footer class="sheet-footer"><span>Quick Phonics Screener</span><span>Digital Examiner Sheet</span></footer>
          </section>
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
        const score = qpsScoreWithDefaults(scores[item.id]);
        const itemIndex = qpsItems.findIndex((nextItem) => nextItem.id === item.id);
        return qpsQuestionResponse(item, itemIndex >= 0 ? itemIndex : index, score);
      });
      const missedQuestions = missedItems.map((item) => {
        const score = qpsScoreWithDefaults(scores[item.id]);
        const itemIndex = qpsItems.findIndex((nextItem) => nextItem.id === item.id);
        return qpsMissedQuestion(item, itemIndex >= 0 ? itemIndex : 0, score);
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
        incorrectSelections: missedItems.map((item) => qpsSelectedText(qpsScoreWithDefaults(scores[item.id]))),
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
        sessionId: progressSessionId,
        teacherEmail: selectedScholar.teacherEmail,
        totalQuestions: scoredItems.length,
      });

      await saveQpsProgress("completed");
      setLoadedProgressStatus("completed");
      setStatus(`QPS saved for ${selectedScholar.firstName}.`);
      void loadTeacherData();
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

  const signedInButUnauthorized = teacherEmail && !isAuthorizedTeacherEmail(teacherEmail);
  const needsTeacherSignIn = !isAuthorizedTeacherEmail(teacherEmail);
  const currentSetLabel = qpsDisplaySectionName(currentItem.section).toUpperCase();
  const currentProgressLabel =
    `${selectedForm.label.toUpperCase()} · ${currentSetLabel} · ITEM ${currentSectionItemIndex + 1} OF ${currentSectionItems.length || 1}`;
  const currentOverallLabel = `Overall: ${currentIndex + 1} of ${qpsItems.length}`;
  const currentStimulusCharacters = qpsItemCharacters(currentItem);

  return (
    <section className={`qps-screener-page${isExaminerSurfaceMode ? " is-examiner-surface" : ""}`}>
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
      {selectedScholarId === QPS_WHOLE_CLASS_MODE && needsTeacherSignIn ? (
        <p className="pin-helper">QPS Whole Class Mode is ready, but QPS teacher tools require Google sign-in first.</p>
      ) : null}
      {error ? <p className="pin-error">{error}</p> : null}
      {status ? <p className="card-edit-message">{status}</p> : null}

      {canUseTeacherBoard ? (
        <div className={`qps-layout${isExaminerSurfaceMode ? " is-individual-examiner" : " is-whole-class-examiner"}`}>
          <aside className="qps-score-panel">
            <label>
              QPS Form
              <select onChange={(event) => {
                setActiveErrorId("");
                setAutosaveStatus("");
                setQpsSectionAward(null);
                setFormId(event.target.value as QpsFormId);
              }} value={formId}>
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
              {isIndividualExaminerMode ? <small>{autosaveStatus || "Autosave ready"}</small> : null}
              {isWholeClassMode ? <small>Use initials + Save Miss for class evidence</small> : null}
            </div>
            {isExaminerSurfaceMode ? (
              <label className="qps-current-set-control">
                Current set
                <select
                  onChange={(event) => {
                    const firstIndex = qpsItems.findIndex((item) => item.section === event.target.value);
                    if (firstIndex >= 0) {
                      setActiveErrorId("");
                      setCurrentIndex(firstIndex);
                    }
                  }}
                  value={currentItem.section}
                >
                  {qpsSections.map((section) => (
                    <option key={section} value={section}>
                      {qpsDisplaySectionName(section)}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <div className="qps-section-jump">
                {qpsSections.map((section) => {
                  const firstIndex = qpsItems.findIndex((item) => item.section === section);
                  return (
                    <button
                      className={currentItem.section === section ? "is-active" : ""}
                      key={section}
                      onClick={() => setCurrentIndex(firstIndex)}
                      type="button"
                    >
                      {qpsDisplaySectionName(section)}
                    </button>
                  );
                })}
              </div>
            )}
            <button className="teacher-text-button" onClick={resetScores} type="button">
              Start Over
            </button>
          </aside>

          <main className="qps-reader-panel">
            <div className={`qps-reader-card${isExaminerSurfaceMode ? " is-examiner-surface" : ""}`}>
              <div className="qps-progress-line">
                <p>{currentProgressLabel}</p>
                <span>{currentOverallLabel}</span>
              </div>
              {isExaminerSurfaceMode ? (
                <div
                  aria-label="Tap the part the scholar missed"
                  className={`qps-interactive-stimulus qps-reader-display ${qpsStimulusSizeClass(currentItem)}`}
                >
                  {currentStimulusCharacters.map((character, index) => {
                    const annotation = qpsAnnotationAtIndex(currentScore.errors, index);
                    const isAnnotationStart = annotation?.startIndex === index;
                    const isSelected = annotation?.id === activeErrorId;
                    const isSpace = /\s/.test(character);

                    return (
                      <span
                        className={`qps-stimulus-token${annotation ? " is-marked" : ""}${isSelected ? " is-selected" : ""}${isSpace ? " is-space" : ""}`}
                        key={`${currentItem.id}-${index}-${character}`}
                      >
                        {isAnnotationStart ? (
                          <span className="qps-inline-correction">
                            <input
                              aria-label={`What scholar said for ${annotation.expectedSpan}`}
                              autoComplete="off"
                              autoFocus={annotation.id === activeErrorId}
                              inputMode="text"
                              ref={(node) => {
                                correctionInputRefs.current[annotation.id] = node;
                              }}
                              onChange={(event) => updateAnnotationResponse(annotation.id, event.target.value)}
                              onFocus={() => setActiveErrorId(annotation.id)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  finishExaminerEntry();
                                }
                              }}
                              placeholder="said"
                              value={annotation.actualResponse}
                            />
                            <button
                              aria-label="Remove this mark"
                          onClick={() => removeAnnotation(annotation.id)}
                          type="button"
                        >
                          x
                        </button>
                          </span>
                        ) : null}
                        <button
                          aria-label={isSpace ? "Space" : `Mark ${character}`}
                          disabled={isSpace}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              markStimulusSpan(index);
                            }
                          }}
                          onPointerCancel={() => {
                            stimulusDragStartRef.current = null;
                            stimulusDragEndRef.current = null;
                          }}
                          onPointerDown={(event) => {
                            event.preventDefault();
                            beginStimulusDrag(index);
                          }}
                          onPointerEnter={() => {
                            previewStimulusDrag(index);
                          }}
                          onPointerUp={(event) => {
                            event.preventDefault();
                            finishStimulusDrag(index);
                          }}
                          type="button"
                        >
                          {isSpace ? "\u00a0" : primaryQpsDisplay(character)}
                        </button>
                      </span>
                    );
                  })}
                </div>
              ) : (
                <strong className={`qps-reader-display ${qpsStimulusSizeClass(currentItem)}`}>
                  {primaryQpsDisplay(currentItem.display)}
                </strong>
              )}
              <span>{currentItem.prompt}</span>
              {currentScore.status === "missed" ? (
                <em className="qps-correction-note">{qpsSelectedText(currentScore)}</em>
              ) : null}
            </div>

            <div className="qps-score-buttons" role="group" aria-label="Score current QPS item">
              <button
                className={currentScore.status === "correct" ? "is-correct" : ""}
                onClick={markCorrect}
                type="button"
              >
                {isExaminerSurfaceMode ? "✓ Correct" : "Correct"}
              </button>
              {isExaminerSurfaceMode ? (
                <>
                  <button
                    className={currentScore.responseType === "no-response" ? "is-missed" : ""}
                    onClick={markNoResponse}
                    type="button"
                  >
                    No Response
                  </button>
                  <button
                    className={currentScore.responseType === "whole-word" ? "is-missed" : ""}
                    onClick={markWholeWordWrong}
                    type="button"
                  >
                    Whole Word Wrong
                  </button>
                  <button onClick={undoCurrentItem} type="button">
                    Undo
                  </button>
                  <button onClick={resetCurrentItem} type="button">
                    Reset
                  </button>
                </>
              ) : (
                <>
                  <button
                    className={currentScore.status === "missed" ? "is-missed" : ""}
                    onClick={markNeedsReview}
                    type="button"
                  >
                    Needs Review
                  </button>
                  <button onClick={() => updateCurrentScore(blankQpsItemScore())} type="button">
                    Clear
                  </button>
                </>
              )}
            </div>

            {isExaminerSurfaceMode && currentScore.responseType === "whole-word" ? (
              <label className="qps-whole-word-response">
                What scholar said for the whole item
                <input
                  onChange={(event) => updateWholeWordResponse(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      finishExaminerEntry();
                    }
                  }}
                  placeholder="Type the whole response"
                  value={currentScore.wholeWordResponse}
                />
              </label>
            ) : null}

            <div className="qps-nav-row">
              <button className="teacher-control-button secondary" disabled={currentIndex === 0} onClick={goToPrevious} type="button">
                Previous
              </button>
              <button className="teacher-control-button" disabled={currentIndex >= qpsItems.length - 1} onClick={goToNext} type="button">
                Next
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

            <div className={`qps-notes-grid${isExaminerSurfaceMode ? " is-individual" : ""}`}>
              {!isExaminerSurfaceMode ? (
                <label>
                  What scholar said
                  <input
                    onChange={(event) => updateCurrentScore({ said: event.target.value, status: event.target.value.trim() ? "missed" : currentScore.status })}
                    placeholder="Example: /b/ for /d/"
                    value={currentScore.said}
                  />
                </label>
              ) : null}
              <label>
                Note
                <input
                  onChange={(event) => updateCurrentScore({ note: event.target.value })}
                  placeholder="Optional teacher note"
                  value={currentScore.note}
                />
              </label>
            </div>

          </main>

          <aside className={`qps-item-list${isExaminerSurfaceMode && !isItemDrawerOpen ? " is-collapsed" : ""}`}>
            {isExaminerSurfaceMode ? (
              <button
                className="qps-item-drawer-toggle"
                onClick={() => setIsItemDrawerOpen((isOpen) => !isOpen)}
                type="button"
              >
                <strong>Items / Progress</strong>
                <span>{currentSectionScoredCount}/{currentSectionItems.length} scored in this set</span>
              </button>
            ) : null}
            {isWholeClassMode ? (
              <section className="qps-call-on-panel">
                <div className="qps-call-on-head">
                  <div>
                    <strong>Suggested Call-On List</strong>
                    <span>
                      {currentChartTarget
                        ? `${qpsChartReportLabel(currentChartTarget.reportId)} chart: ${primaryQpsDisplay(currentChartTarget.target)}`
                        : "Letter and digraph chart targets"}
                    </span>
                  </div>
                  {currentChartTarget ? <em>{qpsCallOnScholars.length}</em> : null}
                </div>
                {!isAuthorizedTeacherEmail(teacherEmail) ? (
                  <p className="pin-helper">Sign in with a teacher account to use chart-based call-on suggestions.</p>
                ) : !currentChartTarget ? (
                  <p className="pin-helper">This slide is not tied to the current Letter Names, Letter Sounds, or Digraphs chart yet.</p>
                ) : qpsCallOnScholars.length ? (
                  <div className="qps-call-on-list">
                    {qpsCallOnScholars.map((scholar) => (
                      <span className={scholar.status === "needs-review" ? "needs-review" : "unassessed"} key={scholar.id}>
                        <strong>{scholar.firstName}</strong>
                        <em>{scholar.trackingInitials}</em>
                        <small>{scholar.status === "needs-review" ? "Needs review" : "No evidence"}</small>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="pin-helper">Everyone currently shows mastered for this chart target.</p>
                )}
              </section>
            ) : null}
            {(!isExaminerSurfaceMode || isItemDrawerOpen) ? qpsItems.map((item, index) => {
              const score = qpsScoreWithDefaults(scores[item.id]);
              return (
                <button
                  className={`qps-item-chip ${score.status} ${index === currentIndex ? "is-active" : ""}`}
                  key={item.id}
                  onClick={() => {
                    setActiveErrorId("");
                    setCurrentIndex(index);
                  }}
                  type="button"
                >
                  <strong>{primaryQpsDisplay(item.display)}</strong>
                  <span>{statusLabel(score.status)}</span>
                </button>
              );
            }) : null}
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
