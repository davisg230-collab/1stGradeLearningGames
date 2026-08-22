import Link from "next/link";
import { GameCardGrid } from "../components/GameCardGrid";
import { SiteHeader } from "../components/SiteHeader";
import { skillsGames } from "../game-data";

export default function SkillsPage() {
  return (
    <main>
      <SiteHeader current="skills" />
      <section className="page-heading">
        <div>
          <p className="section-kicker">CKLA Skills Games</p>
          <h1>Choose Reading Practice</h1>
          <p>Pick what your class is ready to practice.</p>
        </div>
        <Link className="home-link" href="/">
          {"\u{1F3E0}"} Home
        </Link>
      </section>
      <GameCardGrid games={skillsGames} />
    </main>
  );
}
