"use client";

import { type FormEvent, useMemo, useState } from "react";
import type { GameCard } from "../game-data";
import {
  type LearningLocation,
  TEACHER_CLASS_CODE,
  writeCklaScholarAccess,
  writeCklaTeacherAccess,
} from "./scholar-profile";
import { type CardEdit, useTeacherEdit } from "./TeacherEditProvider";

type GameCardGridProps = {
  games: GameCard[];
};

const CKLA_GAME_URL = "/games/unit1-zone1-sound-safari/index.html";
const LISTENING_LEARNING_GAME_URL =
  "/games/listening-learning/index.html";
const MATH_GAME_URL =
  "/games/math-adventure/index.html";
const MATH_STARTING_POINT_URL =
  "/games/math-starting-point-quest/index.html";
const SKILLS_STARTING_POINT_URL =
  "/games/skills-starting-point/index.html";
const LETTER_SEARCH_SAFARI_URL =
  "/games/letter-search-safari/index.html";
const NUMBER_SEARCH_SAFARI_URL =
  "/games/number-search-safari/index.html";
const QPS_SCREENER_URL = "/games/skills/qps-screener";

function cklaGameId(unitNumber = 1) {
  if (unitNumber === 1) return "unit1-zone1-sound-safari";
  if (unitNumber === 2) return "ckla-unit-2-long-vowel-quest";
  return `ckla-unit-${unitNumber}-skills-quest`;
}

function listeningLearningGameId(unitNumber = 1) {
  return `ckla-listening-learning-unit-${unitNumber}`;
}

function mathGameId(moduleNumber = 1) {
  return `eureka-math-module-${moduleNumber}`;
}

function editableGameId(game: GameCard) {
  if (game.adventure === "math-starting-point") {
    return "math-starting-point-quest";
  }

  if (game.adventure === "skills-starting-point") {
    return "skills-starting-point";
  }

  if (game.adventure === "letter-search-safari") {
    return "letter-search-safari";
  }

  if (game.adventure === "number-search-safari") {
    return "number-search-safari";
  }

  if (game.adventure === "qps-screener") {
    return "qps-screener";
  }

  if (game.adventure === "eureka-math-module") {
    return mathGameId(game.unitNumber);
  }

  return game.adventure === "ckla-listening-learning-unit"
    ? listeningLearningGameId(game.unitNumber)
    : cklaGameId(game.unitNumber);
}

function playerUrl(game: GameCard | null) {
  if (game?.adventure === "math-starting-point") {
    return MATH_STARTING_POINT_URL;
  }

  if (game?.adventure === "skills-starting-point") {
    return SKILLS_STARTING_POINT_URL;
  }

  if (game?.adventure === "letter-search-safari") {
    return LETTER_SEARCH_SAFARI_URL;
  }

  if (game?.adventure === "number-search-safari") {
    return NUMBER_SEARCH_SAFARI_URL;
  }

  if (game?.adventure === "qps-screener") {
    return QPS_SCREENER_URL;
  }

  if (game?.adventure === "eureka-math-module") {
    return MATH_GAME_URL;
  }

  return game?.adventure === "ckla-listening-learning-unit"
    ? LISTENING_LEARNING_GAME_URL
    : CKLA_GAME_URL;
}

function cardKeyFor(game: GameCard) {
  return `${game.editGroup ?? game.group}:${game.slug}`;
}

function CardImage({ value }: { value: string }) {
  const trimmed = value.trim();

  if (/^(https?:|data:image\/|\/)/.test(trimmed)) {
    return <img alt="" src={trimmed} />;
  }

  return <span>{trimmed}</span>;
}

function visibleCardText(game: GameCard, value: string) {
  if (game.editGroup !== "Eureka Math") {
    return value;
  }

  return value.replace(/\bEureka\s*/gi, "").trim();
}

function visibleCardDescription(game: GameCard, value: string) {
  const cardText = visibleCardText(game, value);

  if (game.adventure !== "letter-search-safari") {
    return cardText;
  }

  return cardText
    .replace(/\s*\(Currently only Letters are available to review\.\)\s*/i, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isManagedGame(game: GameCard) {
  return Boolean(game.adventure);
}

function isTeacherOnlyGame(game: GameCard) {
  return game.teacherOnly === true && game.adventure !== "qps-screener";
}

function isPreassessmentGame(game: GameCard | null) {
  return (
    game?.adventure === "math-starting-point"
    || game?.adventure === "skills-starting-point"
  );
}

function defaultPostAssessmentUrl(game: GameCard | null, wholeClass = false) {
  const params = new URLSearchParams({ unit: "1" });

  if (wholeClass) {
    params.set("wholeClass", "1");
  }

  return game?.adventure === "math-starting-point"
    ? `${MATH_GAME_URL}?${params.toString()}`
    : `${CKLA_GAME_URL}?${params.toString()}`;
}

function preassessmentLabel(game: GameCard) {
  if (game.adventure === "math-starting-point") {
    return "MATH STARTING POINT";
  }

  if (game.adventure === "skills-starting-point") {
    return "CKLA SKILLS STARTING POINT";
  }

  return "";
}

type ScholarLaunchProfile = {
  firstName: string;
  firstNameKey: string;
  learningLocation?: LearningLocation;
};

function wholeClassGameUrl(game: GameCard | null) {
  if (game?.adventure === "qps-screener") {
    return `${QPS_SCREENER_URL}?wholeClass=1`;
  }

  if (isPreassessmentGame(game)) {
    const params = new URLSearchParams({
      next: defaultPostAssessmentUrl(game, true),
      wholeClass: "1",
    });
    return `${playerUrl(game)}?${params.toString()}`;
  }

  return `${playerUrl(game)}?unit=${game?.unitNumber ?? 1}&wholeClass=1`;
}

function scholarGameUrl(game: GameCard, profile: ScholarLaunchProfile) {
  const params = new URLSearchParams({
    player: profile.firstName,
    key: profile.firstNameKey,
    unit: String(game.unitNumber ?? 1),
  });

  if (profile.learningLocation) {
    params.set("learningLocation", profile.learningLocation);
  }

  const directUrl = `${playerUrl(game)}?${params.toString()}`;

  if (game.adventure === "qps-screener") {
    params.delete("unit");
    params.set("live", "1");
    params.set("learningLocation", "school");
    return `${QPS_SCREENER_URL}?${params.toString()}`;
  }

  if (isPreassessmentGame(game)) {
    const startingPointParams = new URLSearchParams({
      key: profile.firstNameKey,
      next: defaultPostAssessmentUrl(game),
      player: profile.firstName,
      practice: "1",
    });

    if (profile.learningLocation) {
      startingPointParams.set("learningLocation", profile.learningLocation);
    }

    return `${playerUrl(game)}?${startingPointParams.toString()}`;
  }

  if (game.adventure === "ckla-unit") {
    const gateParams = new URLSearchParams({
      key: profile.firstNameKey,
      next: directUrl,
      player: profile.firstName,
    });

    if (profile.learningLocation) {
      gateParams.set("learningLocation", profile.learningLocation);
    }

    return `${SKILLS_STARTING_POINT_URL}?${gateParams.toString()}`;
  }

  if (game.adventure === "eureka-math-module") {
    const gateParams = new URLSearchParams({
      key: profile.firstNameKey,
      next: directUrl,
      player: profile.firstName,
    });

    if (profile.learningLocation) {
      gateParams.set("learningLocation", profile.learningLocation);
    }

    return `${MATH_STARTING_POINT_URL}?${gateParams.toString()}`;
  }

  return directUrl;
}

export function GameCardGrid({ games }: GameCardGridProps) {
  const {
    editedCards,
    errorMessage,
    isEditing,
    isSaving,
    openGameEditor,
    resetCard,
    statusMessage,
    updateCard,
    updateCardOrder,
  } = useTeacherEdit();
  const [editingGame, setEditingGame] = useState<GameCard | null>(null);
  const [namePromptGame, setNamePromptGame] = useState<GameCard | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");
  const [pendingScholarProfile, setPendingScholarProfile] =
    useState<ScholarLaunchProfile | null>(null);
  const [pendingLaunchProfile, setPendingLaunchProfile] =
    useState<ScholarLaunchProfile | null>(null);

  const editingKey = editingGame ? cardKeyFor(editingGame) : "";
  const editingValues = editingGame
    ? {
        ...editingGame,
        ...editedCards[editingKey],
      }
    : null;
  const orderedGames = useMemo(
    () =>
      games
        .filter((game) => !isTeacherOnlyGame(game) || isEditing)
        .map((game, originalIndex) => {
          const cardKey = cardKeyFor(game);
          const sortOrder = editedCards[cardKey]?.sortOrder;

          return {
            game,
            originalIndex,
            order:
              typeof sortOrder === "number" && Number.isFinite(sortOrder)
                ? sortOrder
                : originalIndex,
          };
        })
        .sort((first, second) =>
          first.order - second.order
          || first.originalIndex - second.originalIndex,
        )
        .map(({ game }) => game),
    [editedCards, games, isEditing],
  );

  function saveEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!editingGame) {
      return;
    }

    const formData = new FormData(event.currentTarget);
    const update: CardEdit = {
      description: String(formData.get("description") ?? "").trim(),
      icon: String(formData.get("icon") ?? "").trim(),
      title: String(formData.get("title") ?? "").trim(),
    };

    updateCard(cardKeyFor(editingGame), update);
    setEditingGame(null);
  }

  function setCardConstruction(game: GameCard, underConstruction: boolean) {
    const cardKey = cardKeyFor(game);
    const currentCard = {
      ...game,
      ...editedCards[cardKey],
    };

    updateCard(cardKey, {
      description: currentCard.description,
      icon: currentCard.icon,
      title: currentCard.title,
      underConstruction,
    });
  }

  function cardEditForOrder(game: GameCard, sortOrder: number): CardEdit {
    const cardKey = cardKeyFor(game);
    const currentCard = {
      ...game,
      ...editedCards[cardKey],
    };

    return {
      description: currentCard.description,
      icon: currentCard.icon,
      sortOrder,
      title: currentCard.title,
      underConstruction: currentCard.underConstruction === true,
    };
  }

  function moveCard(game: GameCard, direction: -1 | 1) {
    const currentIndex = orderedGames.findIndex(
      (nextGame) => cardKeyFor(nextGame) === cardKeyFor(game),
    );
    const targetIndex = currentIndex + direction;

    if (
      currentIndex < 0
      || targetIndex < 0
      || targetIndex >= orderedGames.length
    ) {
      return;
    }

    const nextGames = [...orderedGames];
    [nextGames[currentIndex], nextGames[targetIndex]] = [
      nextGames[targetIndex],
      nextGames[currentIndex],
    ];

    updateCardOrder(
      Object.fromEntries(
        nextGames.map((nextGame, index) => [
          cardKeyFor(nextGame),
          cardEditForOrder(nextGame, index),
        ]),
      ),
    );
  }

  function openCklaPrompt(game: GameCard) {
    if (isTeacherOnlyGame(game)) {
      window.location.href = playerUrl(game);
      return;
    }

    setNameDraft("");
    setNameError("");
    setPendingScholarProfile(null);
    setNamePromptGame(game);
  }

  function closeCklaPrompt() {
    setNamePromptGame(null);
    setNameDraft("");
    setNameError("");
    setPendingScholarProfile(null);
    setPendingLaunchProfile(null);
  }

  function openScholarGameFromLocation(learningLocation: LearningLocation) {
    if (!namePromptGame || !pendingScholarProfile) {
      return;
    }

    const profile =
      writeCklaScholarAccess(pendingScholarProfile.firstName, learningLocation)
      ?? {
        ...pendingScholarProfile,
        learningLocation,
      };

    setPendingLaunchProfile(profile);
  }

  function startScholarGameAfterReminder() {
    if (!namePromptGame || !pendingLaunchProfile) {
      return;
    }

    window.location.href = scholarGameUrl(namePromptGame, pendingLaunchProfile);
  }

  async function submitCklaAccess(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEntry = nameDraft.trim();

    if (cleanEntry.replace(/\D/g, "") === TEACHER_CLASS_CODE) {
      writeCklaTeacherAccess();
      window.location.href = wholeClassGameUrl(namePromptGame);
      return;
    }

    if (
      namePromptGame?.adventure === "qps-screener"
      && ["WCM", "WHOLECLASS", "WHOLECLASSMODE"].includes(cleanEntry.replace(/\s+/g, "").toUpperCase())
    ) {
      window.location.href = scholarGameUrl(namePromptGame, {
        firstName: "WCM",
        firstNameKey: "wcm",
        learningLocation: "school",
      });
      return;
    }

    if (!cleanEntry) {
      setNameError("Type your full first name or the teacher code first.");
      return;
    }

    setNameError("Checking the class roster...");

    try {
      const response = await fetch(
        "https://us-central1-stgradelearninggames.cloudfunctions.net/validateScholarName",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: { firstName: cleanEntry } }),
        },
      );
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error?.message || "The roster could not be checked.");
      }

      const validation = payload.result || {};
      if (!validation.allowed) {
        setNameError(
          "That name was not found. Please enter your full first name. You must be a scholar in Mr. Davis's or Ms. Vest's class.",
        );
        return;
      }

      const profile = writeCklaScholarAccess(validation.firstName || cleanEntry);

      if (!profile) {
        setNameError("Please enter your full first name.");
        return;
      }

      if (namePromptGame?.adventure === "qps-screener") {
        window.location.href = scholarGameUrl(namePromptGame, profile);
        return;
      }

      setNameDraft(profile.firstName);
      setPendingScholarProfile(profile);
      setNameError("");
    } catch {
      setNameError("The class roster could not be checked. Please try again.");
    }
  }

  return (
    <>
      <div className="game-grid">
        {orderedGames.map((game, index) => {
          const cardKey = cardKeyFor(game);
          const card = {
            ...game,
            ...editedCards[cardKey],
          };
          const cardTitle = visibleCardText(game, card.title);
          const cardDescription = visibleCardDescription(game, card.description);
          const isUnderConstruction = card.underConstruction === true;
          const cardClassName = `game-card theme-${game.theme}${
            isUnderConstruction ? " is-under-construction" : ""
          }`;
          const isFirstCard = index === 0;
          const isLastCard = index === orderedGames.length - 1;

          return (
            <article className={cardClassName} key={cardKey}>
              <div className="game-picture" aria-hidden="true">
                <CardImage value={card.icon} />
              </div>
              <div className="game-card-copy">
                <p>
                  {isPreassessmentGame(game)
                    ? preassessmentLabel(game)
                    : game.adventure === "eureka-math-module"
                    ? `EUREKA MATH · MODULE ${game.unitNumber}`
                    : game.adventure === "ckla-listening-learning-unit"
                      ? `CKLA LISTENING & LEARNING · UNIT ${game.unitNumber}`
                    : game.adventure === "qps-screener"
                      ? "TEACHER-LED CHECK-IN"
                      : isTeacherOnlyGame(game)
                        ? "TEACHER ONLY · CKLA SKILLS"
                      : game.adventure === "ckla-unit"
                        ? `CKLA UNIT ${game.unitNumber}`
                        : game.group}
                </p>
                <h2>{cardTitle}</h2>
                {isUnderConstruction ? (
                  <strong className="construction-badge">Under Construction</strong>
                ) : null}
                <span>{cardDescription}</span>
              </div>
              <div className="game-card-actions">
                {isUnderConstruction ? (
                  <span className="play-button is-disabled">Under Construction</span>
                ) : isManagedGame(game) ? (
                  <button
                    className="play-button"
                    onClick={() => openCklaPrompt(game)}
                    type="button"
                  >
                    Play
                  </button>
                ) : game.href ? (
                  <a className="play-button" href={game.href}>
                    Play
                  </a>
                ) : (
                  <span className="play-button is-disabled">Coming Soon</span>
                )}
                {isEditing ? (
                  <>
                    <button
                      className="edit-card-button"
                      disabled={isSaving}
                      onClick={() => {
                        if (isManagedGame(game)) {
                          if (isTeacherOnlyGame(game)) {
                            setEditingGame(game);
                          } else {
                            openGameEditor(editableGameId(game));
                          }
                        } else {
                          setEditingGame(game);
                        }
                      }}
                      type="button"
                    >
                      {game.adventure
                        ? "Edit Game"
                        : "Edit"}
                    </button>

                    <div className="tile-order-actions" aria-label={`Move ${cardTitle}`}>
                      <button
                        className="tile-order-button"
                        disabled={isSaving || isFirstCard}
                        onClick={() => moveCard(game, -1)}
                        type="button"
                      >
                        Move Earlier
                      </button>
                      <button
                        className="tile-order-button"
                        disabled={isSaving || isLastCard}
                        onClick={() => moveCard(game, 1)}
                        type="button"
                      >
                        Move Later
                      </button>
                    </div>

                    <button
                      aria-pressed={isUnderConstruction}
                      className={`construction-toggle-button${
                        isUnderConstruction ? " is-active" : ""
                      }`}
                      disabled={isSaving}
                      onClick={() => setCardConstruction(game, !isUnderConstruction)}
                      type="button"
                    >
                      {isUnderConstruction ? "Open for Scholars" : "Under Construction"}
                    </button>

                  </>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>

      {namePromptGame ? (
        <div className="pin-modal-backdrop" role="presentation">
          <form
            aria-labelledby="unit1-name-title"
            aria-modal="true"
            className="pin-modal scholar-name-modal"
            onSubmit={submitCklaAccess}
            role="dialog"
          >
            {pendingLaunchProfile ? (
              <>
                <h2 id="unit1-name-title">Take Charge of Your Learning</h2>
                <div className="independent-learning-card" aria-hidden="true">
                  <span>Think</span>
                  <span>Try</span>
                  <span>Grow</span>
                </div>
                <p>
                  Try first. Think, choose, and do your best. Grown-ups can cheer you on,
                  but your answers should be your own.
                </p>
                <p className="independent-learning-note">
                  Mistakes help your teacher know what to practice next.
                </p>
                <div className="pin-actions">
                  <button type="button" onClick={() => setPendingLaunchProfile(null)}>
                    Back
                  </button>
                  <button type="button" onClick={startScholarGameAfterReminder}>
                    I Will Try It Myself
                  </button>
                </div>
              </>
            ) : pendingScholarProfile ? (
              <>
                <h2 id="unit1-name-title">Where is {pendingScholarProfile.firstName} playing?</h2>
                <p>This adds Home or School to the saved game data for your reports.</p>
                <div className="location-choice-grid" role="group" aria-label="Playing location">
                  <button
                    className="location-choice-button"
                    onClick={() => openScholarGameFromLocation("school")}
                    type="button"
                  >
                    <strong>School</strong>
                    <span>Playing in class</span>
                  </button>
                  <button
                    className="location-choice-button"
                    onClick={() => openScholarGameFromLocation("home")}
                    type="button"
                  >
                    <strong>Home</strong>
                    <span>Playing away from school</span>
                  </button>
                </div>
                <div className="pin-actions">
                  <button type="button" onClick={() => setPendingScholarProfile(null)}>
                    Back
                  </button>
                  <button type="button" onClick={closeCklaPrompt}>
                    Cancel
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 id="unit1-name-title">Who is {namePromptGame.adventure === "qps-screener" ? "doing" : "playing"} {namePromptGame.title}?</h2>
                <p>{namePromptGame.adventure === "qps-screener" ? "Scholars type a first name to connect to live QPS. Teachers type the class code for the QPS control screen." : "Scholars type a first name. Teachers type the class code."}</p>
                <label>
                  First name or teacher code
                  <input
                    autoFocus
                    autoComplete="off"
                    maxLength={30}
                    onChange={(event) => {
                      setNameDraft(event.target.value);
                      setNameError("");
                    }}
                    type="text"
                    value={nameDraft}
                  />
                </label>
                {nameError ? <p className="pin-error">{nameError}</p> : null}
                <div className="pin-actions">
                  <button type="button" onClick={closeCklaPrompt}>
                    Cancel
                  </button>
                  <button type="submit">Next</button>
                </div>
              </>
            )}
          </form>
        </div>
      ) : null}

      {editingGame && editingValues ? (
        <div className="pin-modal-backdrop" role="presentation">
          <form
            aria-labelledby="card-edit-title"
            aria-modal="true"
            className="pin-modal card-edit-modal"
            onSubmit={saveEdit}
            role="dialog"
          >
            <h2 id="card-edit-title">Edit Card</h2>
            <p className={errorMessage ? "card-edit-message is-error" : "card-edit-message"}>
              {errorMessage || statusMessage}
            </p>
            <label>
              Card title
              <input
                name="title"
                required
                type="text"
                defaultValue={visibleCardText(editingGame, editingValues.title)}
              />
            </label>
            <label>
              Description
              <textarea
                name="description"
                required
                rows={3}
                defaultValue={visibleCardDescription(
                  editingGame,
                  editingValues.description,
                )}
              />
            </label>
            <label>
              Small picture
              <input
                name="icon"
                required
                type="text"
                defaultValue={editingValues.icon}
              />
              <span className="field-help">Use an emoji or paste an image URL.</span>
            </label>
            <div className="pin-actions">
              <button type="button" onClick={() => setEditingGame(null)}>
                Cancel
              </button>
              <button
                disabled={isSaving}
                type="button"
                onClick={() => {
                  resetCard(cardKeyFor(editingGame));
                  setEditingGame(null);
                }}
              >
                Reset
              </button>
              <button disabled={isSaving} type="submit">
                {isSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
