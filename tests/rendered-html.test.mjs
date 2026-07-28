import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${path}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

function visibleHtml(html) {
  return html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
}

test("server-renders the home game hub", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);

  const html = await response.text();
  const visible = visibleHtml(html);
  assert.match(html, /1st Grade Learning Games/);
  assert.match(visible, /Pick your game area/);
  assert.match(visible, /CKLA Skills Games/);
  assert.match(visible, /Math Games/);
  assert.match(visible, /Choose Skills/);
  assert.match(visible, /Choose Math/);
  assert.match(visible, /Teacher Edit/);
  assert.doesNotMatch(visible, /Sign-in is limited to/);
  assert.doesNotMatch(visible, /Saved card edits are loaded from Firebase/);
  assert.doesNotMatch(visible, /Eureka/);
  assert.doesNotMatch(visible, /Learning Hub/);
  assert.doesNotMatch(visible, /ABC/);
  assert.doesNotMatch(visible, /their class is ready to play/);
});

test("server-renders subject pages with placeholder cards", async () => {
  const [skillsHtml, mathHtml] = await Promise.all([
    render("/skills").then((response) => response.text()),
    render("/math").then((response) => response.text()),
  ]);
  const visibleMathHtml = visibleHtml(mathHtml);

  assert.match(skillsHtml, /Choose a unit/);
  assert.match(skillsHtml, /Unit 1/);
  assert.match(skillsHtml, /Play/);
  assert.doesNotMatch(skillsHtml, /\/games\/ckla-unit-1\/index\.html/);
  assert.match(skillsHtml, /Unit 2/);
  assert.match(skillsHtml, /\/games\/ckla-unit-2\/index\.html/);
  assert.match(skillsHtml, /Play/);
  assert.match(skillsHtml, /Unit 7/);
  assert.match(skillsHtml, /Coming Soon/);
  assert.match(skillsHtml, /Master Sound Safari levels with Unit 1 letters, sounds, spellings, Tricky Words, nouns, and punctuation/);
  assert.doesNotMatch(skillsHtml, /launch the rocket/);

  assert.match(visibleMathHtml, /Math Games/);
  assert.match(visibleMathHtml, /Choose a module/);
  assert.match(visibleMathHtml, /Module 1/);
  assert.match(visibleMathHtml, /Module 6/);
  assert.match(visibleMathHtml, /Coming Soon/);
  assert.doesNotMatch(visibleMathHtml, /Eureka/);
});

test("root URL always renders the homepage", async () => {
  await render("/math");
  await render("/skills");

  const response = await render("/");
  assert.equal(response.status, 200);

  const visible = visibleHtml(await response.text());
  assert.match(visible, /Pick your game area/);
  assert.match(visible, /Choose Math/);
  assert.doesNotMatch(visible, /Choose a module/);
  assert.doesNotMatch(visible, /Choose a unit/);
});

test("Firestore rules match the hub collections without open writes", async () => {
  const rules = await readFile("firestore.rules", "utf8");

  assert.match(rules, /gameHubCards/);
  assert.match(rules, /gameHubTeacherLogs/);
  assert.match(rules, /gameHubScholars/);
  assert.match(rules, /gameHubResultSubmissions/);
  assert.match(rules, /gameHubProgressSubmissions/);
  assert.match(rules, /gameHubGameDefinitions/);
  assert.match(rules, /isValidEditableGameVersion/);
  assert.match(rules, /resource\.data\.status == 'published'/);
  assert.match(rules, /allow read, write: if isTeacherEditor/);
  assert.match(rules, /davisg230@gmail\.com/);
  assert.match(rules, /lvest1@crossroadsschoolskc\.org/);
  assert.match(rules, /ckla-unit-1-word-builder-blast/);
  assert.match(rules, /ckla-unit-2-long-vowel-quest/);
  assert.match(rules, /unit1-zone1-sound-safari/);
  assert.match(rules, /totalQuestions == 34/);
  assert.match(rules, /totalQuestions == 12/);
  assert.match(rules, /totalQuestions == 15/);
  assert.match(rules, /totalQuestions == 20/);
  assert.match(rules, /isSoundSafariResultTotalsValid/);
  assert.match(rules, /isSoundSafariProgressTotalsValid/);
  assert.match(rules, /masteryTarget == 3/);
  assert.match(rules, /isValidPublicGameId/);
  assert.match(rules, /session-progress/);
  assert.match(rules, /allow create, update: if isValidProgressSubmission/);
  assert.match(rules, /teacherEmail == 'unassigned'/);
  assert.match(rules, /mode == 'whole-class-miss'/);
  assert.match(rules, /request\.resource\.data\.teacherEmail == 'unassigned'/);
  assert.match(rules, /allow create, update: if isTeacherEditor/);
  assert.match(rules, /allow delete: if isTeacherEditor/);
  assert.doesNotMatch(rules, /allow\s+read,\s*write:\s*if\s+true/);
});

test("Firebase Hosting does not cache page HTML across deploys", async () => {
  const config = await readFile("firebase.json", "utf8");

  assert.match(config, /"target": "firstgradelearninggames"/);
  assert.match(config, /"source": "\/"/);
  assert.match(config, /"source": "\/skills"/);
  assert.match(config, /"source": "\/math"/);
  assert.match(config, /"source": "\/audio\/manifest\.json"/);
  assert.match(config, /"storage"/);
  assert.match(config, /"rules": "storage\.rules"/);
  assert.match(config, /no-cache, no-store, must-revalidate/);
  assert.match(config, /public, max-age=31536000, immutable/);
});

test("Firebase Storage rules protect teacher recordings", async () => {
  const rules = await readFile("storage.rules", "utf8");

  assert.match(rules, /gameAudio\/\{gameId\}\/\{audioFile\}/);
  assert.match(rules, /davisg230@gmail\.com/);
  assert.match(rules, /lvest1@crossroadsschoolskc\.org/);
  assert.match(rules, /request\.resource\.contentType\.matches\('audio\/\.\*'\)/);
  assert.match(rules, /request\.resource\.size < 5 \* 1024 \* 1024/);
  assert.doesNotMatch(rules, /allow\s+read,\s*write:\s*if\s+true/);
});

test("Teacher Edit exposes a protected game editor", async () => {
  const provider = await readFile("app/components/TeacherEditProvider.tsx", "utf8");
  const editor = await readFile("app/components/GameEditorPanel.tsx", "utf8");

  assert.match(provider, /GameEditorPanel/);
  assert.match(provider, /Game Editor/);
  assert.match(editor, /Save Draft/);
  assert.match(editor, /Publish/);
  assert.match(editor, /gameHubGameDefinitions/);
  assert.match(editor, /speakerButtons/);
  assert.match(editor, /MediaRecorder/);
  assert.match(editor, /gameAudio\/\$\{selectedGame\.gameId\}/);
  assert.match(editor, /firebase-storage-compat/);
});

test("editable game content seeds preserve current unit content", async () => {
  const [unit1Raw, unit2Raw, loaderScript] = await Promise.all([
    readFile("public/games/editable-content/unit1-zone1-sound-safari.json", "utf8"),
    readFile("public/games/editable-content/ckla-unit-2-long-vowel-quest.json", "utf8"),
    readFile("public/games/editable-game-content.js", "utf8"),
  ]);
  const unit1 = JSON.parse(unit1Raw);
  const unit2 = JSON.parse(unit2Raw);

  assert.equal(unit1.gameId, "unit1-zone1-sound-safari");
  assert.equal(unit1.content.levels.length, 6);
  assert.equal(unit1.content.questions.length, 92);
  assert.equal(unit1.content.supplementalQuestions.length > 0, true);
  assert.equal(unit2.gameId, "ckla-unit-2-long-vowel-quest");
  assert.equal(unit2.content.levels.length, 5);
  assert.equal(unit2.content.questions.length, 34);
  assert.match(loaderScript, /loadPublishedGameContent/);
  assert.match(loaderScript, /gameHubGameDefinitions/);
  assert.match(loaderScript, /Saved game content could not load\. Using built-in content/);
});

test("Google Cloud audio generator creates reusable prerecorded speech", async () => {
  const script = await readFile("scripts/generate-game-audio.mjs", "utf8");
  const packageJson = await readFile("package.json", "utf8");

  assert.match(packageJson, /"audio:generate": "node scripts\/generate-game-audio\.mjs"/);
  assert.match(packageJson, /"@google-cloud\/text-to-speech"/);
  assert.match(script, /@google-cloud\/text-to-speech/);
  assert.match(script, /stgradelearninggames/);
  assert.match(script, /en-US-Chirp3-HD-Aoede/);
  assert.match(script, /path\.join\(publicDir, "audio"\)/);
  assert.match(script, /manifest\.json/);
  assert.match(script, /createHash\("sha256"\)/);
  assert.match(script, /hasAudioFile\(item\.text\)/);
  assert.doesNotMatch(script, /fallbackAudioFileName/);
  assert.match(script, /missing-json/);
  assert.match(script, /dry-run/);
  assert.match(script, /findGameFiles/);
  assert.match(script, /data-speak/);
  assert.match(script, /start-directions/);
  assert.match(script, /Great job for working hard/);
  assert.match(script, /Keep practicing\. You can do it/);
  assert.match(script, /You got/);
  assert.match(script, /twenty one/);
  assert.match(script, /sixty five/);
  assert.match(script, /sh sound/);
});

test("audio manifest uses the recorded MP3 voice for game speech", async () => {
  const manifest = await readFile("public/audio/manifest.json", "utf8");

  assert.match(manifest, /"Read the story Sam and Beth's Big Bag and answer the questions\.": "\/audio\/tts-[a-f0-9]+\.mp3"/);
  assert.match(manifest, /"Read the story A Ride to Pine Lake and answer the questions\.": "\/audio\/tts-[a-f0-9]+\.mp3"/);
  assert.doesNotMatch(manifest, /\.wav"/);
});

test("CKLA Unit 1 game is isolated and printable", async () => {
  const gameHtml = await readFile("public/games/ckla-unit-1/index.html", "utf8");
  const questionCount = gameHtml.match(/\{ zone:/g)?.length ?? 0;

  assert.equal(questionCount, 34);
  assert.match(gameHtml, /Word Builder Quest/);
  assert.match(gameHtml, /Type your first name, then start the game\. Your teacher can see your score after you finish\./);
  assert.match(gameHtml, /Short Vowel Base Camp/);
  assert.match(gameHtml, /Letter Team Trail/);
  assert.match(gameHtml, /Word Workshop/);
  assert.match(gameHtml, /Tricky Word Lookout/);
  assert.match(gameHtml, /Climb to Story Summit/);
  assert.match(gameHtml, /Sound it out\. Blend it together\. Choose the one that matches\./);
  assert.match(gameHtml, /Sam and Beth's Big Bag/);
  assert.match(gameHtml, /Read the story Sam and Beth's Big Bag and answer the questions\./);
  assert.match(gameHtml, /story-directions/);
  assert.match(gameHtml, /text-decoration:underline/);
  assert.match(gameHtml, /focus:\[1\]/);
  assert.match(gameHtml, /word:"NECK"/);
  assert.match(gameHtml, /word:"QUACK"/);
  assert.match(gameHtml, /word:"BUZZ"/);
  assert.match(gameHtml, /word:"WHICH"/);
  assert.match(gameHtml, /Sam and Beth had a big red bag/);
  assert.match(gameHtml, /Choice \$\{index \+ 1\}/);
  assert.match(gameHtml, /data-speak-choice/);
  assert.match(gameHtml, /q\.type === "decode"/);
  assert.match(gameHtml, /choiceSpeakText\(q, choice\)/);
  assert.match(gameHtml, /\.reverse\(\)/);
  assert.match(gameHtml, /const promptRead = storyPrompt\(q\)/);
  assert.match(gameHtml, /speakScore\(resultScore, totalQuestions, percent\)/);
  assert.match(gameHtml, /speakZoneEncouragement\(previousZone\)/);
  assert.match(gameHtml, /You got/);
  assert.match(gameHtml, /Next quest/);
  assert.match(gameHtml, /Print Results/);
  assert.match(gameHtml, /window\.print\(\)/);
  assert.match(gameHtml, /AUDIO_MANIFEST_URL = "\/audio\/manifest\.json"/);
  assert.match(gameHtml, /AUDIO_MANIFEST_VERSION = "2026-07-15-story-directions"/);
  assert.match(gameHtml, /cache:"no-store"/);
  assert.match(gameHtml, /PRELOAD_SPEECH_TEXTS/);
  assert.match(gameHtml, /new Audio\(source\)/);
  assert.match(gameHtml, /stopSpeechAudio/);
  assert.match(gameHtml, /loadAudioManifest\(\)/);
  assert.match(gameHtml, /Great job\. Let's play\./);
  assert.match(gameHtml, /scholar-first-name/);
  assert.match(gameHtml, /Whole Class Mode/);
  assert.match(gameHtml, /CLASS_MODE_CODE = "2213"/);
  assert.match(gameHtml, /teacherForClassCode/);
  assert.match(gameHtml, /validClassMissTeacherEmail/);
  assert.match(gameHtml, /skip-question-button/);
  assert.match(gameHtml, /countedResultIndexes/);
  assert.match(gameHtml, /gameHubResultSubmissions/);
  assert.match(gameHtml, /gameHubProgressSubmissions/);
  assert.match(gameHtml, /whole-class-miss/);
  assert.match(gameHtml, /left-early/);
  assert.match(gameHtml, /pagehide/);
  assert.match(gameHtml, /teacherEmail: "unassigned"/);
  assert.doesNotMatch(gameHtml, /resultsPanel\.scrollIntoView/);
  assert.doesNotMatch(gameHtml, /start-class-mode-button/);
  assert.doesNotMatch(gameHtml, /teacher-only-start/);
  assert.doesNotMatch(gameHtml, /typedTeacher/);
  assert.doesNotMatch(gameHtml, /mrdavis/);
  assert.doesNotMatch(gameHtml, /msvest/);
  assert.doesNotMatch(gameHtml, /gameHubClassRosters/);
  assert.doesNotMatch(gameHtml, /teacher-select/);
  assert.doesNotMatch(gameHtml, /WORD ROCKET/);
  assert.doesNotMatch(gameHtml, /Race to the flag/);
  assert.doesNotMatch(gameHtml, /Every correct word sends the rocket higher/);
  assert.doesNotMatch(gameHtml, /Focus sound/);
  assert.doesNotMatch(gameHtml, /Blend the word, then choose the word you built/);
  assert.doesNotMatch(gameHtml, /cache:"force-cache"/);
  assert.doesNotMatch(gameHtml, /Yesterday, Mia/);
  assert.doesNotMatch(gameHtml, /Sam can run from the bus/);
  assert.doesNotMatch(gameHtml, /Read the story\. Who/);
  assert.doesNotMatch(gameHtml, />Read story</);
  assert.doesNotMatch(gameHtml, /class="choice-speak"/);
  assert.doesNotMatch(gameHtml, /\$\{q\.passage\} \$\{q\.prompt\}/);
  assert.doesNotMatch(gameHtml, /speechSynthesis/);
  assert.doesNotMatch(gameHtml, /SpeechSynthesisUtterance/);
  assert.doesNotMatch(gameHtml, /Great job, \$\{scholarFirstName\}/);
  assert.doesNotMatch(gameHtml, /reward-overlay/);
  assert.doesNotMatch(gameHtml, /\/_sdk\//);
});

test("CKLA Unit 1 Sound Safari follows the CKLA lesson sequence", async () => {
  const gameHtml = await readFile("public/games/unit1-zone1-sound-safari/index.html", "utf8");
  const activeQuestionBlock = gameHtml.slice(
    gameHtml.search(/let\s+QUESTIONS\s*=\s*\[/),
    gameHtml.search(/let\s+SUPPLEMENTAL_QUESTIONS\s*=\s*\[/),
  );
  const preLevel4Block = activeQuestionBlock.slice(
    0,
    activeQuestionBlock.indexOf('{ zone:3,id:"l4-q01'),
  );
  const questionCount = activeQuestionBlock.match(/\{ zone:/g)?.length ?? 0;
  const levelCounts = [0, 1, 2, 3, 4, 5].map(
    (zone) => (activeQuestionBlock.match(new RegExp(`zone:${zone},`, "g")) ?? []).length,
  );

  assert.equal(questionCount, 92);
  assert.deepEqual(levelCounts, [12, 15, 15, 15, 15, 20]);
  assert.match(gameHtml, /Sound Safari/);
  assert.match(gameHtml, /unit1-zone1-sound-safari/);
  assert.match(gameHtml, /SUPPLEMENTAL_QUESTIONS/);
  assert.match(gameHtml, /MASTERY_TARGET = 3/);
  assert.match(gameHtml, /MASTERY_PERCENT = 80/);
  assert.match(gameHtml, /level-card-grid/);
  assert.match(gameHtml, /speakerButtons/);
  assert.match(gameHtml, /data-audio-src/);
  assert.match(gameHtml, /loadEditableGameContent/);
  assert.match(gameHtml, /Choose your next level/);
  assert.match(gameHtml, /Master each level 3 times with 80% or higher/);
  assert.match(gameHtml, /Back-to-School Basecamp/);
  assert.match(gameHtml, /Code Trail/);
  assert.match(gameHtml, /Digraph Crossing/);
  assert.match(gameHtml, /Spelling Ridge/);
  assert.match(gameHtml, /Sentence Springs/);
  assert.match(gameHtml, /Unit 1 Summit/);
  assert.match(gameHtml, /Practice after Lesson 5/);
  assert.match(gameHtml, /Practice after Lesson 16/);
  assert.match(gameHtml, /Practice after Lesson 20/);
  assert.match(gameHtml, /Practice after Lesson 24/);
  assert.match(gameHtml, /Practice after Lesson 29/);
  assert.match(gameHtml, /End-of-Unit Review/);
  assert.match(gameHtml, /Lessons 1-5/);
  assert.match(gameHtml, /Lessons 11-16/);
  assert.match(gameHtml, /Lessons 17-20/);
  assert.match(gameHtml, /Lessons 21-24/);
  assert.match(gameHtml, /Lessons 25-29/);
  assert.match(gameHtml, /Lessons 30-32/);
  assert.match(gameHtml, /Find the lowercase letter that matches P/);
  assert.match(gameHtml, /choices:\[\["p","p"\],\["n","n"\],\["m","m"\]\]/);
  assert.match(gameHtml, /Find the lowercase letter that matches G/);
  assert.match(gameHtml, /choices:\[\["c","c"\],\["g","g"\],\["n","n"\]\]/);
  assert.match(gameHtml, /Listen to the word\. Choose the beginning sound/);
  assert.match(gameHtml, /Listen to the word\. Choose the ending sound/);
  assert.match(gameHtml, /l2-q06-ending-web/);
  assert.match(gameHtml, /word:"web"/);
  assert.match(gameHtml, /choices:\[\["b","b"\],\["d","d"\],\["w","w"\]\]/);
  assert.match(gameHtml, /Choose the vowel sound you hear in the middle/);
  assert.match(gameHtml, /Blend the sounds\. Choose the word/);
  assert.match(gameHtml, /Listen to the word\. Choose the digraph you hear/);
  assert.match(gameHtml, /Choose the spelling you hear at the beginning/);
  assert.match(gameHtml, /Choose the spelling you hear at the end/);
  assert.match(gameHtml, /double-letter spelling represents one consonant sound/);
  assert.match(gameHtml, /Which sentence uses quotation marks correctly/);
  assert.match(gameHtml, /Which sentence asks a question/);
  assert.doesNotMatch(gameHtml, /Read the Tricky Words\. Choose/);
  assert.match(gameHtml, /__ did the dog go\?/);
  assert.match(gameHtml, /th as in thin/);
  assert.match(gameHtml, /th as in them/);
  assert.match(gameHtml, /rubbing/);
  assert.match(gameHtml, /swimming/);
  assert.match(gameHtml, /running/);
  assert.match(gameHtml, /shopping/);
  assert.match(gameHtml, /cat-c, kit-k, rock-ck, hiccup-cc/);
  for (const spelling of ["ck","bb","dd","ff","gg","ll","mm","ss","cc","nn","pp","rr","tt","zz"]) {
    assert.match(gameHtml, new RegExp(`(^|[^a-z])${spelling}([^a-z]|$)`, "i"), `Missing Level 4 spelling ${spelling}`);
  }
  assert.match(gameHtml, /level1AllowedLetters/);
  assert.match(gameHtml, /trickyWordZones/);
  assert.match(gameHtml, /doubleLetterSpellings/);
  assert.match(gameHtml, /separates q from u/);
  assert.match(gameHtml, /quotation punctuation before Level 5/);
  assert.match(gameHtml, /Read Directions speaks the answer/);
  assert.match(gameHtml, /Read directions/);
  assert.match(gameHtml, /Hear word/);
  assert.match(gameHtml, /Hear sounds/);
  assert.match(gameHtml, /spokenDirections/);
  assert.match(gameHtml, /spokenTarget/);
  assert.match(gameHtml, /soundsSpeech/);
  assert.match(gameHtml, /requiresTargetAudio/);
  assert.match(gameHtml, /requiresSoundAudio/);
  assert.match(gameHtml, /independentReading/);
  assert.match(gameHtml, /validateSoundSafariQuestionBank/);
  assert.match(gameHtml, /Climb to Unit 1 Summit/);
  assert.match(gameHtml, /Practice Unit 1 letters, sounds, spellings, Tricky Words, nouns, and punctuation/);
  assert.match(gameHtml, /Level Complete!/);
  assert.match(gameHtml, /totalQuestions: activeQuestions\.length/);
  assert.match(gameHtml, /category: labelForQuestion/);
  assert.match(gameHtml, /levelName: level\.name/);
  assert.match(gameHtml, /recordLevelMastery/);
  assert.match(gameHtml, /markSoundSafariCompleteIfNeeded/);
  assert.match(gameHtml, /renderMasteryStars/);
  assert.match(gameHtml, /mastery-star/);
  assert.match(gameHtml, /printCurrentResults/);
  assert.match(gameHtml, /window\.open\("", "_blank"\)/);
  assert.match(gameHtml, /first-grade-learning-games-sound-safari-progress/);
  assert.match(gameHtml, /first-grade-learning-games-unit1-progress/);
  assert.match(gameHtml, /readLaunchScholarProfile/);
  assert.match(gameHtml, /params\.get\("player"\)/);
  assert.match(gameHtml, /Back to CKLA Units/);
  assert.match(gameHtml, /Whole Class Mode is on/);
  assert.match(gameHtml, /skip-question-button/);
  assert.match(gameHtml, /gameHubResultSubmissions/);
  assert.match(gameHtml, /gameHubProgressSubmissions/);
  assert.match(gameHtml, /left-early/);
  assert.match(gameHtml, /AUDIO_MANIFEST_URL = "\/audio\/manifest\.json"/);
  assert.match(gameHtml, /AUDIO_MANIFEST_VERSION = "2026-07-17-unit1-lesson-sequence"/);
  assert.match(gameHtml, /new Audio\(source\)/);
  assert.match(gameHtml, /stopSpeechAudio/);
  assert.match(gameHtml, /sixty five/);
  for (const word of ["no", "so", "of", "is", "to", "all", "some", "from", "word", "are", "have", "were", "one", "once", "do", "two", "the", "who", "said", "says", "was", "when", "why", "where", "which", "what", "here", "there"]) {
    assert.match(gameHtml.toLowerCase(), new RegExp(`(^|[^a-z])${word}([^a-z]|$)`), `Missing Tricky Word ${word}`);
  }
  assert.doesNotMatch(gameHtml, /QUESTION_MIX/);
  assert.doesNotMatch(gameHtml, /markSoundSafariMastered/);
  assert.doesNotMatch(gameHtml, /What sound does the letter/);
  assert.doesNotMatch(gameHtml, /Which letter spells this sound/);
  assert.doesNotMatch(gameHtml, /l2-q06-ending-bell/);
  assert.doesNotMatch(preLevel4Block, /rabbit/);
  assert.doesNotMatch(preLevel4Block, /Which word names the picture\?/);
  assert.doesNotMatch(preLevel4Block, /Choose the missing Tricky Word: "/);
  assert.doesNotMatch(gameHtml, /data-choice-speak/);
  assert.doesNotMatch(gameHtml, /sound team/i);
  assert.doesNotMatch(gameHtml, /a_e/);
  assert.doesNotMatch(gameHtml, /silent-e/);
  assert.doesNotMatch(gameHtml, /speechSynthesis/);
  assert.doesNotMatch(gameHtml, /SpeechSynthesisUtterance/);
});

test("CKLA Unit 2 game covers the requested skills and keeps game features", async () => {
  const gameHtml = await readFile("public/games/ckla-unit-2/index.html", "utf8");
  const questionCount = gameHtml.match(/\{ zone:/g)?.length ?? 0;

  assert.equal(questionCount, 34);
  assert.match(gameHtml, /Long Vowel Quest/);
  assert.match(gameHtml, /Type your first name, then start the game\. Your teacher can see your score after you finish\./);
  assert.match(gameHtml, /ckla-unit-2-long-vowel-quest/);
  assert.match(gameHtml, /AUDIO_MANIFEST_URL = "\/audio\/manifest\.json"/);
  assert.match(gameHtml, /AUDIO_MANIFEST_VERSION = "2026-07-15-story-directions"/);
  assert.match(gameHtml, /cache:"no-store"/);
  assert.match(gameHtml, /PRELOAD_SPEECH_TEXTS/);
  assert.match(gameHtml, /new Audio\(source\)/);
  assert.match(gameHtml, /stopSpeechAudio/);
  assert.match(gameHtml, /loadAudioManifest\(\)/);
  assert.match(gameHtml, /Great job\. Let's play\./);
  assert.match(gameHtml, /CLASS_MODE_CODE = "2213"/);
  assert.match(gameHtml, /skip-question-button/);
  assert.match(gameHtml, /Print Results/);
  assert.match(gameHtml, /gameHubResultSubmissions/);
  assert.match(gameHtml, /gameHubProgressSubmissions/);
  assert.match(gameHtml, /speakerButtons/);
  assert.match(gameHtml, /data-audio-src/);
  assert.match(gameHtml, /loadEditableGameContent/);
  assert.match(gameHtml, /Whole Class Mode/);
  assert.match(gameHtml, /left-early/);
  assert.match(gameHtml, /pagehide/);
  assert.match(gameHtml, /Listen to this word/);
  assert.match(gameHtml, /long a/);
  assert.match(gameHtml, /a_e/);
  assert.match(gameHtml, /i_e/);
  assert.match(gameHtml, /o_e/);
  assert.match(gameHtml, /u_e/);
  assert.match(gameHtml, /SEED/);
  assert.match(gameHtml, /FEET/);
  assert.match(gameHtml, /GREEN/);
  assert.match(gameHtml, /cape/);
  assert.match(gameHtml, /kit/);
  assert.match(gameHtml, /kite/);
  assert.match(gameHtml, /separated vowel team/);
  assert.match(gameHtml, /Tricky Word/);
  assert.match(gameHtml, /Which Tricky Word completes this sentence/);
  assert.match(gameHtml, /choices:\[\["by","by"\],\["your","your"\],\["we","we"\]\]/);
  assert.match(gameHtml, /proper noun/);
  assert.match(gameHtml, /Maya and Lee ride bikes to Pine Lake/);
  assert.match(gameHtml, /A Ride to Pine Lake/);
  assert.match(gameHtml, /Read the story A Ride to Pine Lake and answer the questions\./);
  assert.match(gameHtml, /story-directions/);
  assert.match(gameHtml, /Maya is a name\. Does Maya name a person, place, or thing/);
  assert.match(gameHtml, /Choose the word you hear/);
  assert.match(gameHtml, /\.reverse\(\)/);
  assert.match(gameHtml, /const promptRead = storyPrompt\(q\)/);
  assert.match(gameHtml, /speakScore\(resultScore, totalQuestions, percent\)/);
  assert.match(gameHtml, /speakZoneEncouragement\(previousZone\)/);
  assert.match(gameHtml, /q\.zone === 3/);
  assert.doesNotMatch(gameHtml, /Teachers can type the class code/);
  assert.doesNotMatch(gameHtml, /Listen to seed/);
  assert.doesNotMatch(gameHtml, /Which written word says/);
  assert.doesNotMatch(gameHtml, /___ can ride a bike/);
  assert.doesNotMatch(gameHtml, /This is ___ cube/);
  assert.doesNotMatch(gameHtml, /This cube belongs to you/);
  assert.doesNotMatch(gameHtml, /What kind of thing does Maya name/);
  assert.doesNotMatch(gameHtml, /cache:"force-cache"/);
  assert.doesNotMatch(gameHtml, /data-speak-choice/);
  assert.doesNotMatch(gameHtml, /choiceSpeakText/);
  assert.doesNotMatch(gameHtml, /Read the story\. What/);
  assert.doesNotMatch(gameHtml, /story-heading-row/);
  assert.doesNotMatch(gameHtml, />Read story</);
  assert.doesNotMatch(gameHtml, /class="choice-speak"/);
  assert.doesNotMatch(gameHtml, /\$\{q\.passage\} \$\{q\.prompt\}/);
  assert.doesNotMatch(gameHtml, /speechSynthesis/);
  assert.doesNotMatch(gameHtml, /SpeechSynthesisUtterance/);
  assert.doesNotMatch(gameHtml, /Great job, \$\{scholarFirstName\}/);
  assert.doesNotMatch(gameHtml, /\/_sdk\//);
});

test("teacher roster detail can print one scholar's results", async () => {
  const panel = await readFile("app/components/ScholarResultsPanel.tsx", "utf8");
  const styles = await readFile("app/globals.css", "utf8");

  assert.match(panel, /Print Results/);
  assert.match(panel, /printSelectedScholarReport/);
  assert.match(panel, /window\.open\("", "_blank"\)/);
  assert.match(panel, /window\.print\(\)/);
  assert.match(panel, /Started But Not Finished/);
  assert.match(panel, /Sound Safari Progress/);
  assert.match(panel, /SOUND_SAFARI_LEVELS/);
  assert.match(panel, /soundSafariStatuses/);
  assert.match(panel, /Mastery/);
  assert.match(panel, /gameHubProgressSubmissions/);
  assert.match(panel, /result\.teacherEmail === "unassigned"/);
  assert.match(styles, /student-detail-actions/);
  assert.match(styles, /sound-safari-summary/);
  assert.match(styles, /@media print/);
  assert.match(styles, /student-detail-panel/);
});
