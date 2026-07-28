type SiteHeaderProps = {
  current: "home" | "skills" | "math";
};

export function SiteHeader({ current }: SiteHeaderProps) {
  const eyebrow =
    current === "skills"
      ? "CKLA Skills Games"
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
      </section>
    </header>
  );
}
