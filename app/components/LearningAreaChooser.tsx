"use client";

import Link from "next/link";
import { listeningLearningGames, mathGames, skillsGames } from "../game-data";

export function LearningAreaChooser() {
  const publicSkillsGameCount = skillsGames.filter((game) => !game.teacherOnly).length;

  return (
    <section className="area-grid" aria-label="Choose a learning area">
      <Link className="area-card area-card-skills" href="/skills">
        <span className="area-icon" aria-hidden="true">
          {"\u{1F4DA}"}
        </span>
        <span className="area-label">CKLA Skills Games</span>
        <span className="area-detail">{publicSkillsGameCount} game cards</span>
        <span className="area-button">Choose Skills</span>
      </Link>

      <Link
        className="area-card area-card-skills"
        href="/listening-learning"
      >
        <span className="area-icon" aria-hidden="true">
          {"🎧"}
        </span>
        <span className="area-label">
          CKLA Listening &amp; Learning Games
        </span>
        <span className="area-detail">
          {listeningLearningGames.length} game cards
        </span>
        <span className="area-button">
          Choose Listening &amp; Learning
        </span>
      </Link>

      <Link className="area-card area-card-math" href="/math">
        <span className="area-icon" aria-hidden="true">
          {"\u{1F9EE}"}
        </span>
        <span className="area-label">Math Games</span>
        <span className="area-detail">{mathGames.length} game cards</span>
        <span className="area-button">Choose Math</span>
      </Link>
    </section>
  );
}
