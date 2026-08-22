import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(root, "public");
const gamesDir = path.join(publicDir, "games");
const audioDir = path.join(publicDir, "audio");
const manifestPath = path.join(audioDir, "manifest.json");

const projectId = "stgradelearninggames";
const voiceName = "en-US-Chirp3-HD-Aoede";
const languageCode = "en-US";

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const jsonOutput = args.has("--json");
const missingJson = args.has("--missing-json");
const ttsDelayMs = Number(process.env.AUDIO_TTS_DELAY_MS || 500);
const ttsQuotaRetryMs = Number(process.env.AUDIO_TTS_QUOTA_RETRY_MS || 65000);
const ttsQuotaRetryLimit = Number(process.env.AUDIO_TTS_QUOTA_RETRIES || 5);

const numberWords = [
  "zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine",
  "ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen",
  "seventeen", "eighteen", "nineteen", "twenty", "twenty one", "twenty two",
  "twenty three", "twenty four", "twenty five", "twenty six", "twenty seven",
  "twenty eight", "twenty nine", "thirty", "thirty one", "thirty two",
  "thirty three", "thirty four", "thirty five", "thirty six", "thirty seven",
  "thirty eight", "thirty nine", "forty", "forty one", "forty two", "forty three",
  "forty four", "forty five", "forty six", "forty seven", "forty eight",
  "forty nine", "fifty", "fifty one", "fifty two", "fifty three", "fifty four",
  "fifty five", "fifty six", "fifty seven", "fifty eight", "fifty nine",
  "sixty", "sixty one", "sixty two", "sixty three", "sixty four", "sixty five"
];

const alwaysInclude = [
  "Type your first name, then start the game. Your teacher can see your score after you finish.",
  "Whole Class Mode is on. Pick any zone or question together.",
  "Great job. Let's play.",
  "Trail star earned! Great reading.",
  "Great job for working hard.",
  "Keep practicing. You can do it!",
  "You got",
  "out of",
  "correct.",
  "Nice work. Keep climbing.",
  "Great blending. Let's keep going.",
  "Super work. Try the next trail.",
  "You are working hard. Keep going.",
  "You made it to Story Summit.",
  ...numberWords,
];

function decodeEntities(value) {
  return String(value)
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#039;/g, "'");
}

export function normalizeSpeechText(value) {
  return decodeEntities(value)
    .replace(/<[^>]+>/g, " ")
    .replace(/_+/g, " blank ")
    .replace(/\/kw\//gi, "kw sound")
    .replace(/\/ks\//gi, "k s sound")
    .replace(/\/ee\//gi, "long e")
    .replace(/\/ae\//gi, "long a")
    .replace(/\/ie\//gi, "long i")
    .replace(/\/oe\//gi, "long o")
    .replace(/\/ue\//gi, "long u")
    .replace(/\/sh\//gi, "sh sound")
    .replace(/\/ch\//gi, "ch sound")
    .replace(/\/th\//gi, "th sound")
    .replace(/\/ng\//gi, "ng sound")
    .replace(/\/([a-z])\//gi, "$1 sound")
    .replace(/\bee\b/gi, "e e vowel team")
    .replace(/\ba_e\b/gi, "a blank e separated vowel team")
    .replace(/\bi_e\b/gi, "i blank e separated vowel team")
    .replace(/\bo_e\b/gi, "o blank e separated vowel team")
    .replace(/\bu_e\b/gi, "u blank e separated vowel team")
    .replace(/\bsh\b(?! sound)/gi, "sh sound")
    .replace(/\bch\b(?! sound)/gi, "ch sound")
    .replace(/\bth\b(?! sound)/gi, "th sound")
    .replace(/\bng\b(?! sound)/gi, "ng sound")
    .replace(/\bck\b(?! sound)/gi, "c k")
    .replace(/\bqu\b(?! sound)/gi, "q u")
    .replace(/\bss\b/gi, "double s")
    .replace(/\bzz\b/gi, "double z")
    .replace(/\b[A-Z]{2,}\b/g, (word) => word.toLowerCase())
    .replace(/\s+/g, " ")
    .trim();
}

function audioFileName(text) {
  const hash = createHash("sha256").update(text).digest("hex").slice(0, 20);
  return `tts-${hash}.mp3`;
}

function existingAudioFileName(text) {
  return audioFileName(text);
}

function hasAudioFile(text) {
  return existsSync(path.join(audioDir, audioFileName(text)));
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function addText(texts, value, source) {
  const text = normalizeSpeechText(value);
  if (!text) return;
  const item = texts.get(text) || { text, sources: new Set() };
  item.sources.add(source);
  texts.set(text, item);
}

async function findGameFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await findGameFiles(fullPath));
    } else if (entry.name === "index.html") {
      files.push(fullPath);
    }
  }
  return files.sort();
}

function findMatchingBracket(source, openIndex) {
  let depth = 0;
  let quote = "";
  let escaped = false;
  for (let index = openIndex; index < source.length; index++) {
    const char = source[index];
    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === quote) {
        quote = "";
      }
      continue;
    }
    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }
    if (char === "[") depth++;
    if (char === "]") {
      depth--;
      if (depth === 0) return index;
    }
  }
  return -1;
}

function decodeJsString(quote, body) {
  if (quote === "`") return body.replace(/\\`/g, "`").replace(/\\\\/g, "\\");
  return JSON.parse(`${quote}${body}${quote}`);
}

function extractStringLiterals(source) {
  const results = [];
  const matcher = /(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const match of source.matchAll(matcher)) {
    if (match[1] === "`" && match[2].includes("${")) continue;
    try {
      results.push(decodeJsString(match[1], match[2]));
    } catch {
      // Skip malformed snippets from template-heavy code.
    }
  }
  return results;
}

function extractConstants(script) {
  const constants = new Map();
  const matcher = /const\s+([A-Z0-9_]+)\s*=\s*(["'`])((?:\\.|(?!\2)[\s\S])*?)\2\s*;/g;
  for (const match of script.matchAll(matcher)) {
    try {
      constants.set(match[1], decodeJsString(match[2], match[3]));
    } catch {
      // Ignore constants that are not simple strings.
    }
  }
  return constants;
}

function extractQuestionBlock(script) {
  const markers = [
    "const QUESTIONS = [",
    "const DEFAULT_QUESTIONS = [",
  ];
  const start = markers
    .map((marker) => script.indexOf(marker))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  if (start === undefined) return "";
  const openIndex = script.indexOf("[", start);
  const closeIndex = findMatchingBracket(script, openIndex);
  return closeIndex > openIndex ? script.slice(openIndex, closeIndex + 1) : "";
}

function extractArrayBlocks(source, marker) {
  const blocks = [];
  let searchIndex = 0;
  while (searchIndex < source.length) {
    const markerIndex = source.indexOf(marker, searchIndex);
    if (markerIndex < 0) break;
    const openIndex = source.indexOf("[", markerIndex);
    const closeIndex = findMatchingBracket(source, openIndex);
    if (openIndex < 0 || closeIndex < 0) break;
    blocks.push(source.slice(openIndex, closeIndex + 1));
    searchIndex = closeIndex + 1;
  }
  return blocks;
}

function collectChoiceSpeech(block, texts, sourceName) {
  let foundChoiceRows = false;
  const rowMatcher = /\[\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1\s*,\s*(["'`])((?:\\.|(?!\3)[\s\S])*?)\3(?:\s*,\s*(["'`])((?:\\.|(?!\5)[\s\S])*?)\5)?\s*\]/g;
  for (const match of block.matchAll(rowMatcher)) {
    foundChoiceRows = true;
    try {
      if (match[5]) {
        addText(texts, decodeJsString(match[5], match[6]), `${sourceName}:choices`);
      } else {
        addText(texts, decodeJsString(match[3], match[4]), `${sourceName}:choices`);
      }
    } catch {
      // Fall back below if the row cannot be decoded.
      foundChoiceRows = false;
    }
  }
  if (!foundChoiceRows) {
    for (const text of extractStringLiterals(block)) {
      addText(texts, text, `${sourceName}:choices`);
    }
  }
}

function collectHtmlSpeech(html, filePath, texts) {
  const sourceName = path.relative(root, filePath).replace(/\\/g, "/");
  for (const match of html.matchAll(/\sdata-speak=(["'])(.*?)\1/g)) {
    if (match[2].includes("${")) continue;
    addText(texts, match[2], `${sourceName}:data-speak`);
  }
  for (const match of html.matchAll(/<[^>]+id=(["'])start-directions\1[^>]*>([\s\S]*?)<\/[^>]+>/g)) {
    addText(texts, match[2], `${sourceName}:start-directions`);
  }
}

function collectScriptSpeech(script, filePath, texts) {
  const sourceName = path.relative(root, filePath).replace(/\\/g, "/");
  const constants = extractConstants(script);
  const questionBlock = extractQuestionBlock(script);
  for (const match of questionBlock.matchAll(/["'`]?(?:audioSourceText|audioText|prompt|visiblePrompt|spokenDirections|spokenTarget|soundsSpeech|promptSpeak|speak|hint|visibleExplanation|spokenExplanation|word|passage)["'`]?\s*:\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g)) {
    try {
      addText(texts, decodeJsString(match[1], match[2]), `${sourceName}:question-field`);
    } catch {
      // Ignore malformed question strings.
    }
  }
  for (const block of [
    ...extractArrayBlocks(questionBlock, "choices:"),
    ...extractArrayBlocks(questionBlock, '"choices":'),
  ]) {
    collectChoiceSpeech(block, texts, sourceName);
  }
  for (const block of extractArrayBlocks(script, "PRELOAD_SPEECH_TEXTS")) {
    for (const text of extractStringLiterals(block)) {
      addText(texts, text, `${sourceName}:preload`);
    }
  }
  for (const match of questionBlock.matchAll(/["'`]?(?:audioSourceText|audioText|speak|passage|prompt|visiblePrompt|spokenDirections|spokenTarget|soundsSpeech|promptSpeak|hint|visibleExplanation|spokenExplanation|word)["'`]?\s*:\s*([A-Z][A-Z0-9_]*)/g)) {
    const value = constants.get(match[1]);
    if (value) addText(texts, value, `${sourceName}:question-constant`);
  }
  const scriptWithoutQuestionBlock = questionBlock
    ? script.replace(questionBlock, "[]")
    : script;
  const speechCallMatcher = /\b(?:speak|showFeedback)\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1/g;
  for (const match of scriptWithoutQuestionBlock.matchAll(speechCallMatcher)) {
    if (match[2].includes("${")) continue;
    try {
      addText(texts, decodeJsString(match[1], match[2]), `${sourceName}:speech-call`);
    } catch {
      // Ignore malformed speech call snippets.
    }
  }
}

async function collectSpeechTexts() {
  const texts = new Map();
  for (const text of alwaysInclude) addText(texts, text, "shared");
  const gameFiles = await findGameFiles(gamesDir);
  for (const filePath of gameFiles) {
    const html = await readFile(filePath, "utf8");
    collectHtmlSpeech(html, filePath, texts);
    const scriptMatcher = /<script>([\s\S]*?)<\/script>/g;
    for (const match of html.matchAll(scriptMatcher)) {
      collectScriptSpeech(match[1], filePath, texts);
    }
  }
  return [...texts.values()].sort((a, b) => a.text.localeCompare(b.text));
}

function isQuotaError(error) {
  return error?.code === 8 || /RESOURCE_EXHAUSTED|quota/i.test(String(error?.message || error));
}

async function synthesizeSpeechWithRetry(client, text) {
  for (let attempt = 0; attempt <= ttsQuotaRetryLimit; attempt++) {
    try {
      const [response] = await client.synthesizeSpeech({
        input: { text },
        voice: { languageCode, name: voiceName },
        audioConfig: {
          audioEncoding: "MP3",
          speakingRate: 0.88,
        },
      });
      return response;
    } catch (error) {
      if (!isQuotaError(error) || attempt === ttsQuotaRetryLimit) throw error;
      if (!jsonOutput) {
        console.log(`Text-to-Speech quota paused. Waiting ${Math.round(ttsQuotaRetryMs / 1000)} seconds before retry ${attempt + 1}...`);
      }
      await sleep(ttsQuotaRetryMs);
    }
  }
  throw new Error("Text-to-Speech generation did not return audio.");
}

async function synthesizeMissing(items) {
  const { TextToSpeechClient } = await import("@google-cloud/text-to-speech");
  const client = new TextToSpeechClient({ projectId });
  const missing = [];
  let skipped = 0;
  for (const item of items) {
    const filePath = path.join(audioDir, audioFileName(item.text));
    if (hasAudioFile(item.text)) {
      skipped++;
    } else {
      missing.push({ item, filePath });
    }
  }
  let created = 0;
  for (const { item, filePath } of missing) {
    const response = await synthesizeSpeechWithRetry(client, item.text);
    await writeFile(filePath, response.audioContent);
    created++;
    if (!jsonOutput && (created === missing.length || created % 10 === 0)) {
      console.log(`Generated ${created} of ${missing.length} new clips...`);
    }
    if (created < missing.length && ttsDelayMs > 0) {
      await sleep(ttsDelayMs);
    }
  }
  return { created, skipped };
}

async function main() {
  await mkdir(audioDir, { recursive: true });
  const items = await collectSpeechTexts();
  const manifestItems = Object.fromEntries(
    items.map((item) => [item.text, `/audio/${existingAudioFileName(item.text)}`]),
  );
  if (missingJson) {
    const missing = items
      .filter((item) => !hasAudioFile(item.text))
      .map((item) => ({
        text: item.text,
        file: `public/audio/${audioFileName(item.text)}`,
        sources: [...item.sources].sort(),
      }));
    console.log(JSON.stringify({ missingCount: missing.length, missing }, null, 2));
    return;
  }
  const summary = {
    dryRun,
    gameCount: (await findGameFiles(gamesDir)).length,
    projectId,
    voice: voiceName,
    textCount: items.length,
    audioDir: path.relative(root, audioDir).replace(/\\/g, "/"),
  };
  if (!dryRun) {
    const generated = await synthesizeMissing(items);
    await writeFile(
      manifestPath,
      `${JSON.stringify({
        generatedAt: new Date().toISOString(),
        projectId,
        voice: voiceName,
        languageCode,
        itemCount: items.length,
        items: manifestItems,
      }, null, 2)}\n`,
    );
    Object.assign(summary, generated, { manifest: path.relative(root, manifestPath).replace(/\\/g, "/") });
  }
  if (jsonOutput) {
    console.log(JSON.stringify(summary, null, 2));
  } else if (dryRun) {
    console.log(`Found ${items.length} speech lines in ${summary.gameCount} games. No audio was generated.`);
  } else {
    console.log(`Audio ready: ${summary.created} created, ${summary.skipped} already existed.`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
