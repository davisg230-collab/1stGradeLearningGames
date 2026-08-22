export type GameCard = {
  adventure?:
    | "ckla-unit"
    | "ckla-listening-learning-unit"
    | "eureka-math-module"
    | "letter-search-safari"
    | "math-starting-point"
    | "number-search-safari"
    | "qps-screener"
    | "skills-starting-point";
  description: string;
  editGroup?: string;
  group: string;
  href?: string;
  icon: string;
  slug: string;
  teacherOnly?: boolean;
  theme: "coral" | "gold" | "blue" | "orange" | "green" | "purple";
  title: string;
  unitNumber?: number;
};

export const skillsGames: GameCard[] = [
  { adventure: "skills-starting-point", description: "Use this to help find the best reading starting place for each scholar before first grade reading work.", group: "CKLA Skills", icon: "\u{1F4DD}", slug: "starting-point", theme: "purple", title: "Reading Starting Point" },
  { adventure: "letter-search-safari", description: "Use this for quick practice and check-ins with letters, sounds, digraphs, and spelling patterns.", group: "CKLA Skills", icon: "ABC", slug: "letter-search-safari", theme: "blue", title: "Letter Search Safari" },
  { adventure: "ckla-unit", unitNumber: 1, description: "Use this during or after Unit 1 lessons for extra practice, review, and confidence-building with the skills taught in class.", group: "CKLA Skills", icon: "\u{1F98B}", slug: "unit-1", theme: "coral", title: "Unit 1" },
  { adventure: "ckla-unit", unitNumber: 2, description: "Practice long vowels, separated vowel teams, Tricky Words, nouns, and a short story.", group: "CKLA Skills", icon: "\u{1F5FA}\u{FE0F}", slug: "unit-2", theme: "gold", title: "Unit 2" },
  { adventure: "ckla-unit", unitNumber: 3, description: "Build and practice Unit 3 skills and levels.", group: "CKLA Skills", icon: "\u{1F4D6}", slug: "unit-3", theme: "blue", title: "Unit 3" },
  { adventure: "ckla-unit", unitNumber: 4, description: "Build and practice Unit 4 skills and levels.", group: "CKLA Skills", icon: "\u{1F50E}", slug: "unit-4", theme: "orange", title: "Unit 4" },
  { adventure: "ckla-unit", unitNumber: 5, description: "Build and practice Unit 5 skills and levels.", group: "CKLA Skills", icon: "\u{1F9E0}", slug: "unit-5", theme: "green", title: "Unit 5" },
  { adventure: "ckla-unit", unitNumber: 6, description: "Build and practice Unit 6 skills and levels.", group: "CKLA Skills", icon: "\u{270D}\u{FE0F}", slug: "unit-6", theme: "purple", title: "Unit 6" },
  { adventure: "ckla-unit", unitNumber: 7, description: "Build and practice Unit 7 skills and levels.", group: "CKLA Skills", icon: "\u{1F3A7}", slug: "unit-7", theme: "coral", title: "Unit 7" },
  { adventure: "qps-screener", description: "Teacher-led QPS slides. Start live with your teacher, then type your name to connect.", group: "CKLA Skills", icon: "QPS", slug: "qps-screener", theme: "green", title: "QPS" },
];

export const listeningLearningGames: GameCard[] = [
  { adventure: "ckla-listening-learning-unit", unitNumber: 1, description: "Build and practice Listening & Learning Unit 1.", group: "CKLA Listening & Learning", icon: "📖", slug: "unit-1", theme: "coral", title: "Unit 1" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 2, description: "Build and practice Listening & Learning Unit 2.", group: "CKLA Listening & Learning", icon: "💬", slug: "unit-2", theme: "gold", title: "Unit 2" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 3, description: "Build and practice Listening & Learning Unit 3.", group: "CKLA Listening & Learning", icon: "🌎", slug: "unit-3", theme: "blue", title: "Unit 3" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 4, description: "Build and practice Listening & Learning Unit 4.", group: "CKLA Listening & Learning", icon: "🔎", slug: "unit-4", theme: "orange", title: "Unit 4" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 5, description: "Build and practice Listening & Learning Unit 5.", group: "CKLA Listening & Learning", icon: "🧠", slug: "unit-5", theme: "green", title: "Unit 5" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 6, description: "Build and practice Listening & Learning Unit 6.", group: "CKLA Listening & Learning", icon: "🗣️", slug: "unit-6", theme: "purple", title: "Unit 6" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 7, description: "Build and practice Listening & Learning Unit 7.", group: "CKLA Listening & Learning", icon: "🏛️", slug: "unit-7", theme: "coral", title: "Unit 7" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 8, description: "Build and practice Listening & Learning Unit 8.", group: "CKLA Listening & Learning", icon: "🧭", slug: "unit-8", theme: "gold", title: "Unit 8" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 9, description: "Build and practice Listening & Learning Unit 9.", group: "CKLA Listening & Learning", icon: "🌟", slug: "unit-9", theme: "blue", title: "Unit 9" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 10, description: "Build and practice Listening & Learning Unit 10.", group: "CKLA Listening & Learning", icon: "🏰", slug: "unit-10", theme: "orange", title: "Unit 10" },
  { adventure: "ckla-listening-learning-unit", unitNumber: 11, description: "Build and practice Listening & Learning Unit 11.", group: "CKLA Listening & Learning", icon: "🎓", slug: "unit-11", theme: "green", title: "Unit 11" },
];

export const mathGames: GameCard[] = [
  { adventure: "math-starting-point", description: "Practice the Math Starting Point.", group: "Math", icon: "\u{1F4DD}", slug: "starting-point", theme: "purple", title: "Math Starting Point" },
  { adventure: "number-search-safari", description: "Use this for quick practice and check-ins with numbers 1-20 and counting dots.", group: "Math", icon: "123", slug: "number-search-safari", theme: "green", title: "Number Search Safari" },
  { adventure: "eureka-math-module", unitNumber: 1, description: "Build and practice Eureka Math Module 1.", editGroup: "Eureka Math", group: "Math", icon: "\u{2795}", slug: "module-1", theme: "blue", title: "Module 1" },
  { adventure: "eureka-math-module", unitNumber: 2, description: "Build and practice Eureka Math Module 2.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F4CF}", slug: "module-2", theme: "gold", title: "Module 2" },
  { adventure: "eureka-math-module", unitNumber: 3, description: "Build and practice Eureka Math Module 3.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F9E9}", slug: "module-3", theme: "green", title: "Module 3" },
  { adventure: "eureka-math-module", unitNumber: 4, description: "Build and practice Eureka Math Module 4.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F522}", slug: "module-4", theme: "orange", title: "Module 4" },
  { adventure: "eureka-math-module", unitNumber: 5, description: "Build and practice Eureka Math Module 5.", editGroup: "Eureka Math", group: "Math", icon: "\u{23F1}\u{FE0F}", slug: "module-5", theme: "purple", title: "Module 5" },
  { adventure: "eureka-math-module", unitNumber: 6, description: "Build and practice Eureka Math Module 6.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F4AF}", slug: "module-6", theme: "coral", title: "Module 6" },
];
