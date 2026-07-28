"use client";

import { type FormEvent, useState } from "react";
import type { GameCard } from "../game-data";
import {
  TEACHER_CLASS_CODE,
  writeCklaScholarAccess,
  writeCklaTeacherAccess,
} from "./scholar-profile";
import { type CardEdit, useTeacherEdit } from "./TeacherEditProvider";

type GameCardGridProps = {
  games: GameCard[];
};

const UNIT_1_GAME_URL = "/games/unit1-zone1-sound-safari/index.html";

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

export function GameCardGrid({ games }: GameCardGridProps) {
  const {
    editedCards,
    errorMessage,
    isEditing,
    isSaving,
    resetCard,
    statusMessage,
    updateCard,
  } = useTeacherEdit();
  const [editingGame, setEditingGame] = useState<GameCard | null>(null);
  const [namePromptGame, setNamePromptGame] = useState<GameCard | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");

  const editingKey = editingGame ? cardKeyFor(editingGame) : "";
  const editingValues = editingGame
    ? {
        ...editingGame,
        ...editedCards[editingKey],
      }
    : null;

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

  function openUnit1Prompt(game: GameCard) {
    setNameDraft("");
    setNameError("");
    setNamePromptGame(game);
  }

  function submitUnit1Access(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanEntry = nameDraft.trim();

    if (cleanEntry.replace(/\D/g, "") === TEACHER_CLASS_CODE) {
      writeCklaTeacherAccess();
      window.location.href = `${UNIT_1_GAME_URL}?wholeClass=1`;
      return;
    }

    const profile = writeCklaScholarAccess(cleanEntry);

    if (!profile) {
      setNameError("Type your first name or the teacher code first.");
      return;
    }

    const params = new URLSearchParams({
      player: profile.firstName,
      key: profile.firstNameKey,
    });
    window.location.href = `${UNIT_1_GAME_URL}?${params.toString()}`;
  }

  return (
    <>
      <div className="game-grid">
        {games.map((game) => {
          const cardKey = cardKeyFor(game);
          const card = {
            ...game,
            ...editedCards[cardKey],
          };
          const cardTitle = visibleCardText(game, card.title);
          const cardDescription = visibleCardText(game, card.description);

          return (
            <article className={`game-card theme-${game.theme}`} key={cardKey}>
              <div className="game-picture" aria-hidden="true">
                <CardImage value={card.icon} />
              </div>
              <div className="game-card-copy">
                <p>{game.group}</p>
                <h2>{cardTitle}</h2>
                <span>{cardDescription}</span>
              </div>
              <div className="game-card-actions">
                {game.adventure === "unit-1" ? (
                  <button
                    className="play-button"
                    onClick={() => openUnit1Prompt(game)}
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
                  <button
                    className="edit-card-button"
                    disabled={isSaving}
                    onClick={() => setEditingGame(game)}
                    type="button"
                  >
                    Edit
                  </button>
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
            onSubmit={submitUnit1Access}
            role="dialog"
          >
            <h2 id="unit1-name-title">Who is playing?</h2>
            <p>Scholars type a first name. Teachers type the class code.</p>
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
              <button type="button" onClick={() => setNamePromptGame(null)}>
                Cancel
              </button>
              <button type="submit">Open Unit 1</button>
            </div>
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
                defaultValue={visibleCardText(
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
