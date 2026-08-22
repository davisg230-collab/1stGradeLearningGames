type SiteHeaderProps = {
  current: "home" | "skills" | "listening-learning" | "math";
};

const CLASS_HUB_URL = "https://first-grade-news-hub-mrdavis.web.app/";

export function SiteHeader({ current }: SiteHeaderProps) {
  const eyebrow =
    current === "skills"
      ? "CKLA Skills Games"
      : current === "listening-learning"
        ? "CKLA Listening & Learning Games"
        : current === "math"
          ? "Math Games"
          : "Game Hub";

  return (
    <header className="site-shell">
      <section className="hero-band">
        <div className="hero-copy">
          <p className="hero-pill">{eyebrow}</p>
          <h1>Hey Hey First Grade!</h1>
        </div>
        <nav className="site-header-actions" aria-label="Class website">
          <a className="class-hub-link" href={CLASS_HUB_URL}>
            Class Hub
          </a>
        </nav>
      </section>
    </header>
  );
}
