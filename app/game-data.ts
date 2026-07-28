export type GameCard = {
  adventure?: "unit-1";
  description: string;
  editGroup?: string;
  group: string;
  href?: string;
  icon: string;
  slug: string;
  theme: "coral" | "gold" | "blue" | "orange" | "green" | "purple";
  title: string;
};

export const skillsGames: GameCard[] = [
  { adventure: "unit-1", description: "Master Sound Safari levels with Unit 1 letters, sounds, spellings, Tricky Words, nouns, and punctuation.", group: "CKLA Skills", icon: "\u{1F98B}", slug: "unit-1", theme: "coral", title: "Unit 1" },
  { description: "Practice long vowels, separated vowel teams, Tricky Words, nouns, and a short story.", group: "CKLA Skills", href: "/games/ckla-unit-2/index.html", icon: "\u{1F5FA}\u{FE0F}", slug: "unit-2", theme: "gold", title: "Unit 2" },
  { description: "Skills game placeholder for this unit.", group: "CKLA Skills", icon: "\u{1F4D6}", slug: "unit-3", theme: "blue", title: "Unit 3" },
  { description: "Skills game placeholder for this unit.", group: "CKLA Skills", icon: "\u{1F50E}", slug: "unit-4", theme: "orange", title: "Unit 4" },
  { description: "Skills game placeholder for this unit.", group: "CKLA Skills", icon: "\u{1F9E0}", slug: "unit-5", theme: "green", title: "Unit 5" },
  { description: "Skills game placeholder for this unit.", group: "CKLA Skills", icon: "\u{270D}\u{FE0F}", slug: "unit-6", theme: "purple", title: "Unit 6" },
  { description: "Skills game placeholder for this unit.", group: "CKLA Skills", icon: "\u{1F3A7}", slug: "unit-7", theme: "coral", title: "Unit 7" },
];

export const mathGames: GameCard[] = [
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{2795}", slug: "module-1", theme: "blue", title: "Module 1" },
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F4CF}", slug: "module-2", theme: "gold", title: "Module 2" },
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F9E9}", slug: "module-3", theme: "green", title: "Module 3" },
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F522}", slug: "module-4", theme: "orange", title: "Module 4" },
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{23F1}\u{FE0F}", slug: "module-5", theme: "purple", title: "Module 5" },
  { description: "Math game placeholder for this module.", editGroup: "Eureka Math", group: "Math", icon: "\u{1F4AF}", slug: "module-6", theme: "coral", title: "Module 6" },
];
