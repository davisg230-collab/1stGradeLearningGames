(function () {
  const GAME_COLLECTION = "gameHubGameDefinitions";

  function asText(value, fallback = "") {
    return typeof value === "string" ? value : fallback;
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeChoice(choice) {
    if (!Array.isArray(choice) || choice.length < 2) {
      return null;
    }

    const value = asText(choice[0]).trim();
    const label = asText(choice[1]).trim();

    if (!value || !label) {
      return null;
    }

    return choice.length > 2 && typeof choice[2] === "string"
      ? [value, label, choice[2]]
      : [value, label];
  }

  function normalizeLevel(level, index) {
    if (!level || typeof level !== "object" || Array.isArray(level)) {
      return null;
    }

    const next = clone(level);
    next.name = asText(next.name, `Level ${index + 1}`).trim();
    next.detail = asText(next.detail).trim();
    next.icon = asText(next.icon, "star").trim();
    next.lessonRange = asText(next.lessonRange).trim();
    next.learningTarget = asText(next.learningTarget).trim();
    next.practiceLabel = asText(next.practiceLabel).trim();

    return next.name ? next : null;
  }

  function normalizeQuestion(question, index, levelCount) {
    if (!question || typeof question !== "object" || Array.isArray(question)) {
      return null;
    }

    const next = clone(question);
    const zone = Number(next.zone);
    const answer = asText(next.answer || next.correctAnswer).trim();
    const choices = Array.isArray(next.choices)
      ? next.choices.map(normalizeChoice).filter(Boolean)
      : [];

    if (!Number.isInteger(zone) || zone < 0 || zone >= levelCount) {
      return null;
    }

    if (!asText(next.prompt).trim() || !answer || choices.length < 2) {
      return null;
    }

    if (!choices.some((choice) => choice[0] === answer)) {
      return null;
    }

    next.id = asText(next.id, `question-${index + 1}`).trim();
    next.zone = zone;
    next.answer = answer;
    next.correctAnswer = asText(next.correctAnswer || answer, answer).trim();
    next.choices = choices;

    return next.id ? next : null;
  }

  function normalizeGameContent(rawContent) {
    const content = rawContent && typeof rawContent === "object" && rawContent.content
      ? rawContent.content
      : rawContent;

    if (!content || typeof content !== "object" || Array.isArray(content)) {
      return null;
    }

    const rawLevels = Array.isArray(content.levels)
      ? content.levels
      : Array.isArray(content.zones)
        ? content.zones
        : [];
    const levels = rawLevels.map(normalizeLevel).filter(Boolean);

    if (!levels.length) {
      return null;
    }

    const questions = Array.isArray(content.questions)
      ? content.questions
          .map((question, index) => normalizeQuestion(question, index, levels.length))
          .filter(Boolean)
      : [];

    if (!questions.length) {
      return null;
    }

    const supplementalQuestions = Array.isArray(content.supplementalQuestions)
      ? content.supplementalQuestions
          .map((question, index) => normalizeQuestion(question, index, levels.length))
          .filter(Boolean)
      : [];

    return {
      levels,
      questions,
      schemaVersion: Number(content.schemaVersion) || 1,
      supplementalQuestions,
      unitTitle: asText(content.unitTitle),
      zoneEncouragements: Array.isArray(content.zoneEncouragements)
        ? content.zoneEncouragements.filter((value) => typeof value === "string")
        : [],
    };
  }

  function getFirebaseServices(firebaseConfig) {
    if (!window.firebase) {
      return null;
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(firebaseConfig);
    }

    return {
      db: firebase.firestore(),
    };
  }

  async function loadPublishedGameContent(options) {
    const services = getFirebaseServices(options.firebaseConfig);

    if (!services) {
      return null;
    }

    try {
      const gameDoc = await services.db
        .collection(GAME_COLLECTION)
        .doc(options.gameId)
        .get();

      if (!gameDoc.exists) {
        return null;
      }

      const gameData = gameDoc.data() || {};
      const versionId = asText(gameData.publishedVersion).trim();

      if (!versionId) {
        return null;
      }

      const versionDoc = await services.db
        .collection(GAME_COLLECTION)
        .doc(options.gameId)
        .collection("versions")
        .doc(versionId)
        .get();

      if (!versionDoc.exists) {
        return null;
      }

      const versionData = versionDoc.data() || {};

      if (versionData.status !== "published") {
        return null;
      }

      return normalizeGameContent(versionData.content || versionData);
    } catch (error) {
      console.warn("Saved game content could not load. Using built-in content.", error);
      return null;
    }
  }

  window.EditableGameContent = {
    clone,
    loadPublishedGameContent,
    normalizeGameContent,
  };
})();
