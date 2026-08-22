export const firebaseConfig = {
  apiKey: "AIzaSyDKzxn9EHkjRTEAYNBuFtoIRH4ZB2r8vi8",
  appId: "1:794898732231:web:07dace393137990eef5ae2",
  authDomain: "stgradelearninggames.firebaseapp.com",
  measurementId: "G-NBW471V655",
  messagingSenderId: "794898732231",
  projectId: "stgradelearninggames",
  storageBucket: "stgradelearninggames.firebasestorage.app",
} as const;

export const authorizedTeachers = [
  {
    aliases: [],
    email: "davisg230@gmail.com",
    label: "Mr. Davis",
  },
  {
    aliases: [
      "lvest1010@gmail.com",
      "lvest@crossroadsschoolskc.org",
    ],
    email: "lvest1@crossroadsschoolskc.org",
    label: "Ms. Vest",
  },
] as const;

export const authorizedTeacherEmails = authorizedTeachers.flatMap((teacher) => [
  teacher.email,
  ...teacher.aliases,
]);
export const teacherEmail = authorizedTeachers[0].email;

export function isAuthorizedTeacherEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return authorizedTeacherEmails.includes(normalized as (typeof authorizedTeacherEmails)[number]);
}

export function rosterTeacherEmailForEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return authorizedTeachers.find((teacher) =>
    teacher.email === normalized || (teacher.aliases as readonly string[]).includes(normalized),
  )?.email ?? "";
}

export function teacherLabelForEmail(email: string | null | undefined) {
  const normalized = email?.trim().toLowerCase() ?? "";
  return authorizedTeachers.find((teacher) =>
    teacher.email === normalized || (teacher.aliases as readonly string[]).includes(normalized),
  )?.label ?? "Teacher";
}
