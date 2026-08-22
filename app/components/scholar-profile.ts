export type LearningLocation = "home" | "school";

export type ScholarProfile = {
  firstName: string;
  firstNameKey: string;
  learningLocation?: LearningLocation;
};

export type CklaAccess =
  | {
      firstName: string;
      firstNameKey: string;
      learningLocation?: LearningLocation;
      mode: "scholar";
    }
  | {
      mode: "teacher";
    };

export const SCHOLAR_PROFILE_STORAGE_KEY =
  "first-grade-learning-games-scholar-profile";
export const CKLA_ACCESS_STORAGE_KEY = "first-grade-learning-games-ckla-access";
export const LEARNING_LOCATION_STORAGE_KEY =
  "first-grade-learning-games-learning-location";
export const CKLA_ACCESS_CHANGED_EVENT = "ckla-access-changed";
export const TEACHER_CLASS_CODE = "2213";

export function normalizeScholarNameKey(value: string) {
  return value
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]/g, "")
    .slice(0, 30);
}

export function normalizeLearningLocation(value: unknown): LearningLocation | "" {
  const normalized = String(value ?? "").trim().toLowerCase();
  return normalized === "home" || normalized === "school" ? normalized : "";
}

export function readScholarProfile(): ScholarProfile | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(SCHOLAR_PROFILE_STORAGE_KEY) ?? "null",
    ) as Partial<ScholarProfile> | null;

    if (
      stored?.firstName &&
      stored.firstNameKey &&
      normalizeScholarNameKey(stored.firstName) === stored.firstNameKey
    ) {
      return {
        firstName: stored.firstName,
        firstNameKey: stored.firstNameKey,
        ...(normalizeLearningLocation(stored.learningLocation)
          ? { learningLocation: normalizeLearningLocation(stored.learningLocation) }
          : {}),
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeScholarProfile(
  firstName: string,
  learningLocation?: LearningLocation,
) {
  const cleanName = firstName.trim().replace(/\s+/g, " ");
  const firstNameKey = normalizeScholarNameKey(cleanName);

  if (!cleanName || !firstNameKey) {
    return null;
  }

  const profile: ScholarProfile = {
    firstName: cleanName,
    firstNameKey,
    ...(normalizeLearningLocation(learningLocation)
      ? { learningLocation: normalizeLearningLocation(learningLocation) }
      : {}),
  };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        SCHOLAR_PROFILE_STORAGE_KEY,
        JSON.stringify(profile),
      );
      if (profile.learningLocation) {
        window.localStorage.setItem(
          LEARNING_LOCATION_STORAGE_KEY,
          profile.learningLocation,
        );
      }
    } catch {
      // The Unit 1 launch URL still carries the name if storage is blocked.
    }
  }

  return profile;
}

function announceCklaAccessChange() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(CKLA_ACCESS_CHANGED_EVENT));
  }
}

export function readCklaAccess(): CklaAccess | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(CKLA_ACCESS_STORAGE_KEY) ?? "null",
    ) as Partial<CklaAccess> | null;

    if (stored?.mode === "teacher") {
      return { mode: "teacher" };
    }

    if (
      stored?.mode === "scholar" &&
      stored.firstName &&
      stored.firstNameKey &&
      normalizeScholarNameKey(stored.firstName) === stored.firstNameKey
    ) {
      return {
        firstName: stored.firstName,
        firstNameKey: stored.firstNameKey,
        ...(normalizeLearningLocation(stored.learningLocation)
          ? { learningLocation: normalizeLearningLocation(stored.learningLocation) }
          : {}),
        mode: "scholar",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeCklaScholarAccess(
  firstName: string,
  learningLocation?: LearningLocation,
) {
  const profile = writeScholarProfile(firstName, learningLocation);

  if (!profile || typeof window === "undefined") {
    return profile;
  }

  try {
    window.localStorage.setItem(
      CKLA_ACCESS_STORAGE_KEY,
      JSON.stringify({ ...profile, mode: "scholar" }),
    );
    announceCklaAccessChange();
  } catch {
    // Do not block opening the game if browser storage is unavailable.
  }
  return profile;
}

export function writeCklaTeacherAccess() {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      CKLA_ACCESS_STORAGE_KEY,
      JSON.stringify({ mode: "teacher" }),
    );
    announceCklaAccessChange();
  } catch {
    // Whole Class Mode also uses the URL flag, so storage cannot block launch.
  }
}

export function hasTeacherCklaAccess() {
  return readCklaAccess()?.mode === "teacher";
}
