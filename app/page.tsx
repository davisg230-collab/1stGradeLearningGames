import { LearningAreaChooser } from "./components/LearningAreaChooser";
import { SiteHeader } from "./components/SiteHeader";

export default function Home() {
  return (
    <main>
      <SiteHeader current="home" />

      <section className="home-intro" aria-labelledby="hub-title">
        <div className="home-intro-copy">
          <h1 id="hub-title">Pick your game area!</h1>
          <p>
            Scholars can choose CKLA Skills or Math, then find the unit
            or module game they are ready to practice at school or at home.
          </p>
        </div>
      </section>

      <LearningAreaChooser />
    </main>
  );
}
