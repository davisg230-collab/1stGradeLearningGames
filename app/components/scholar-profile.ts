export type ScholarProfile = {
  firstName: string;
  firstNameKey: string;
};

export type CklaAccess =
  | {
      firstName: string;
      firstNameKey: string;
      mode: "scholar";
    }
  | {
      mode: "teacher";
    };

export const SCHOLAR_PROFILE_STORAGE_KEY =
  "first-grade-learning-games-scholar-profile";
export const CKLA_ACCESS_STORAGE_KEY = "first-grade-learning-games-ckla-access";
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
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeScholarProfile(firstName: string) {
  const cleanName = firstName.trim().replace(/\s+/g, " ");
  const firstNameKey = normalizeScholarNameKey(cleanName);

  if (!cleanName || !firstNameKey) {
    return null;
  }

  const profile = { firstName: cleanName, firstNameKey };

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(
        SCHOLAR_PROFILE_STORAGE_KEY,
        JSON.stringify(profile),
      );
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
        mode: "scholar",
      };
    }
  } catch {
    return null;
  }

  return null;
}

export function writeCklaScholarAccess(firstName: string) {
  const profile = writeScholarProfile(firstName);

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
