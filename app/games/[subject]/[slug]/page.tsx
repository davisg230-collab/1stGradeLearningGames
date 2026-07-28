import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "../../../components/SiteHeader";
import { mathGames, skillsGames } from "../../../game-data";

type GamePageProps = {
  params: Promise<{
    slug: string;
    subject: string;
  }>;
};

export default async function GamePage({ params }: GamePageProps) {
  const { slug, subject } = await params;
  const games = subject === "skills" ? skillsGames : subject === "math" ? mathGames : [];
  const game = games.find((item) => item.slug === slug);

  if (!game) {
    notFound();
  }

  return (
    <main>
      <SiteHeader current={subject === "math" ? "math" : "skills"} />
      <section className="coming-soon-page">
        <div className={`coming-soon-card theme-${game.theme}`}>
          <span className="game-picture" aria-hidden="true">
            <span>{game.icon}</span>
          </span>
          <p className="section-kicker">{game.group}</p>
          <h1>{game.title}</h1>
          <p>This game space is ready for the finished code when it is added.</p>
          <Link className="home-link" href={subject === "math" ? "/math" : "/skills"}>
            Back to cards
          </Link>
        </div>
      </section>
    </main>
  );
}
