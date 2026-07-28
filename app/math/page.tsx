import Link from "next/link";
import { GameCardGrid } from "../components/GameCardGrid";
import { SiteHeader } from "../components/SiteHeader";
import { mathGames } from "../game-data";

export default function MathPage() {
  return (
    <main>
      <SiteHeader current="math" />
      <section className="page-heading">
        <div>
          <p className="section-kicker">Math Games</p>
          <h1>Choose a module</h1>
          <p>Pick the module your class is ready to practice.</p>
        </div>
        <Link className="home-link" href="/">
          {"\u{1F3E0}"} Home
        </Link>
      </section>
      <GameCardGrid games={mathGames} />
    </main>
  );
}
