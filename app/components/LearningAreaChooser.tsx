"use client";

import Link from "next/link";
import { mathGames, skillsGames } from "../game-data";

export function LearningAreaChooser() {
  return (
    <section className="area-grid" aria-label="Choose a learning area">
      <Link className="area-card area-card-skills" href="/skills">
        <span className="area-icon" aria-hidden="true">
          {"\u{1F4DA}"}
        </span>
        <span className="area-label">CKLA Skills Games</span>
        <span className="area-detail">{skillsGames.length} unit cards</span>
        <span className="area-button">Choose Skills</span>
      </Link>

      <Link className="area-card area-card-math" href="/math">
        <span className="area-icon" aria-hidden="true">
          {"\u{1F9EE}"}
        </span>
        <span className="area-label">Math Games</span>
        <span className="area-detail">{mathGames.length} module cards</span>
        <span className="area-button">Choose Math</span>
      </Link>
    </section>
  );
}
