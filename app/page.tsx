import Link from "next/link";
import {
  ArrowUpRight,
  ChartNoAxesCombined,
  Utensils,
  Sparkles,
} from "lucide-react";
export default function Home() {
  return (
    <main>
      <section className="hero">
        <div>
          <span className="eyebrow">A more intentional approach</span>
          <h1>
            Know your body.
            <br />
            <em>Fuel your progress.</em>
          </h1>
          <p className="hero-copy">
            Bring your meals, weight trends, and nutrition goals into one
            focused workspace. Less guesswork. A clearer picture of what works
            for you.
          </p>
          <div className="row" style={{ marginTop: 30 }}>
            <Link href="/dashboard" className="button">
              Open my workspace <ArrowUpRight size={17} />
            </Link>
            <Link href="/sign-up" className="button secondary">
              Create account
            </Link>
          </div>
          <p className="muted" style={{ fontSize: 11, marginTop: 22 }}>
            Private tracking · Contextual coaching · You stay in control
          </p>
        </div>
        <div
          className="hero-art"
          aria-label="Illustration of the nutrition dashboard"
        >
          <div className="between">
            <span className="eyebrow">The daily picture</span>
            <Sparkles size={18} color="#b6a0ff" />
          </div>
          <div className="hero-ring">
            <strong>AURA</strong>
            <span className="muted">Built around you</span>
          </div>
          <div className="form-grid">
            <div className="panel">
              <span className="muted">Nourish</span>
              <h2>Log with ease</h2>
            </div>
            <div className="panel">
              <span className="muted">Understand</span>
              <h2>See the trend</h2>
            </div>
          </div>
          <p
            className="muted"
            style={{ textAlign: "center", fontSize: 11, marginTop: 20 }}
          >
            A thoughtful routine, one day at a time.
          </p>
        </div>
      </section>
      <div className="feature-grid">
        {[
          [
            Utensils,
            "Food, without the friction",
            "Log your meals, reuse recent entries, and review AI estimates before saving.",
          ],
          [
            ChartNoAxesCombined,
            "Trends over fluctuations",
            "See your weight trend alongside your intake. Complete logs make the picture more useful.",
          ],
          [
            Sparkles,
            "A coach with context",
            "Talk through your nutrition with an assistant that remembers your conversation and uses your records.",
          ],
        ].map(([Icon, title, copy]) => {
          const I = Icon as typeof Utensils;
          return (
            <section className="panel" key={String(title)}>
              <I color="#b6a0ff" size={22} />
              <h2>{String(title)}</h2>
              <p className="muted">{String(copy)}</p>
            </section>
          );
        })}
      </div>
    </main>
  );
}
