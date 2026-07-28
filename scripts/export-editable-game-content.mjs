import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";

const root = process.cwd();
const outputDir = path.join(root, "public", "games", "editable-content");

function findAssignment(source, name) {
  const pattern = new RegExp(`(?:const|let)\\s+${name}\\s*=\\s*`);
  const match = pattern.exec(source);

  if (!match) {
    throw new Error(`Could not find ${name}.`);
  }

  return match.index + match[0].length;
}

function readBalancedExpression(source, startIndex) {
  const opener = source[startIndex];
  const closer = opener === "[" ? "]" : opener === "{" ? "}" : null;

  if (!closer) {
    const semicolon = source.indexOf(";", startIndex);
    if (semicolon === -1) {
      throw new Error("Could not find assignment end.");
    }
    return source.slice(startIndex, semicolon).trim();
  }

  let depth = 0;
  let quote = "";
  let escaped = false;

  for (let index = startIndex; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = "";
      }
      continue;
    }

    if (character === '"' || character === "'" || character === "`") {
      quote = character;
      continue;
    }

    if (character === opener) {
      depth += 1;
    } else if (character === closer) {
      depth -= 1;
      if (depth === 0) {
        return source.slice(startIndex, index + 1);
      }
    }
  }

  throw new Error("Could not read balanced expression.");
}

function extractValue(source, name, context = {}) {
  const startIndex = findAssignment(source, name);
  const expression = readBalancedExpression(source, startIndex);
  const sandbox = { ...context };
  return vm.runInNewContext(`(${expression})`, sandbox);
}

async function exportSoundSafari() {
  const source = await readFile(
    path.join(root, "public", "games", "unit1-zone1-sound-safari", "index.html"),
    "utf8",
  );
  const levels = extractValue(source, "ZONES");
  const questions = extractValue(source, "QUESTIONS");
  const supplementalQuestions = extractValue(source, "SUPPLEMENTAL_QUESTIONS");
  const zoneEncouragements = extractValue(source, "ZONE_ENCOURAGEMENTS");

  return {
    content: {
      levels,
      questions,
      schemaVersion: 1,
      supplementalQuestions,
      unitTitle: "CKLA Unit 1 Sound Safari",
      zoneEncouragements,
    },
    gameId: "unit1-zone1-sound-safari",
    schemaVersion: 1,
    subject: "ckla",
    title: "CKLA Unit 1 Sound Safari",
    unitSlug: "unit-1",
  };
}

async function exportUnit2() {
  const source = await readFile(
    path.join(root, "public", "games", "ckla-unit-2", "index.html"),
    "utf8",
  );
  const passage = extractValue(source, "UNIT_2_PASSAGE");
  const storyTitle = extractValue(source, "UNIT_2_STORY_TITLE");
  const context = {
    UNIT_2_PASSAGE: passage,
    UNIT_2_STORY_TITLE: storyTitle,
  };
  const levels = extractValue(source, "ZONES");
  const questions = extractValue(source, "QUESTIONS", context);
  const zoneEncouragements = extractValue(source, "ZONE_ENCOURAGEMENTS");

  return {
    content: {
      levels,
      questions,
      schemaVersion: 1,
      supplementalQuestions: [],
      unitTitle: "CKLA Unit 2 Long Vowel Quest",
      zoneEncouragements,
    },
    gameId: "ckla-unit-2-long-vowel-quest",
    schemaVersion: 1,
    subject: "ckla",
    title: "CKLA Unit 2 Long Vowel Quest",
    unitSlug: "unit-2",
  };
}

async function main() {
  await mkdir(outputDir, { recursive: true });
  const games = [await exportSoundSafari(), await exportUnit2()];

  await Promise.all(
    games.map((game) =>
      writeFile(
        path.join(outputDir, `${game.gameId}.json`),
        `${JSON.stringify(game, null, 2)}\n`,
      ),
    ),
  );

  console.log(`Exported ${games.length} editable game content files.`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
