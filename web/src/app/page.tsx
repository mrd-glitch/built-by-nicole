import Image from "next/image";
import Link from "next/link";
import { IntakeForm } from "@/components/IntakeForm";

const pillars = [
  {
    title: "A plan built for your life",
    body: "Your workouts and your nutrition, written for your schedule, your equipment, and your body. Not a template with your name pasted on top.",
  },
  {
    title: "A weekly check-in that keeps you honest",
    body: "Every Sunday you weigh in, send photos, and rate your week. I read every single one and answer you myself.",
  },
  {
    title: "A coach in your corner",
    body: "Message me inside the app when the week goes sideways. We adjust and keep moving. Quitting on Wednesday is not the plan.",
  },
];

const steps = [
  { n: "01", title: "Apply", body: "Fill out the application below. Five minutes, honest answers." },
  { n: "02", title: "We talk", body: "I read it, then we connect. If we're a fit, you get your invite." },
  { n: "03", title: "Get your plan", body: "Your workouts and meals land in your portal, built from your intake." },
  { n: "04", title: "Win weekly", body: "Train, eat, check in Sunday. I watch the trend and adjust." },
];

export default function LandingPage() {
  return (
    <main>
      {/* Nav */}
      <header
        className="flex items-center justify-between px-5"
        style={{ height: "var(--nav-height)", background: "var(--ink-900)" }}
      >
        <Image src="/brand/ns-lockup-paper-pink-on-ink.png" alt="Built by Nicole" width={64} height={64} />
        <Link href="/login" className="btn btn--ghost-invert btn--sm">
          Client login
        </Link>
      </header>

      {/* Hero */}
      <section
        className="relative overflow-hidden"
        style={{ background: "var(--ink-900)", color: "var(--text-invert)" }}
      >
        <div className="mx-auto grid max-w-[1100px] items-center gap-8 px-5 py-14 md:grid-cols-2 md:py-24">
          <div>
            <p className="eyebrow eyebrow--invert" style={{ color: "var(--pink-300)" }}>
              1:1 fitness + nutrition coaching for women
            </p>
            <h1
              className="mt-4"
              style={{
                fontFamily: "var(--type-hero-family)",
                fontWeight: "var(--type-hero-weight)",
                textTransform: "uppercase",
                letterSpacing: "var(--tracking-tightest)",
                lineHeight: "var(--leading-tight)",
                fontSize: "clamp(40px, 8vw, 76px)",
                color: "var(--paper-50)",
              }}
            >
              Nothing changes
              <br />
              if{" "}
              <span className="script" style={{ color: "var(--pink-500)", textTransform: "none", fontSize: "1.2em" }}>
                nothing
              </span>{" "}
              changes.
            </h1>
            <p className="mt-6 max-w-[46ch]" style={{ color: "var(--grey-300)", fontSize: "var(--text-md)", lineHeight: "var(--leading-body)" }}>
              You don&apos;t need more motivation. You need a real plan, a weekly check-in, and
              someone who won&apos;t let you off the hook. That&apos;s what I do.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#apply" className="btn btn--primary">
                Apply for coaching
              </a>
              <a href="#how" className="btn btn--ghost-invert">
                How it works
              </a>
            </div>
          </div>
          <div className="relative mx-auto w-full max-w-[380px]">
            <div
              className="overflow-hidden"
              style={{ borderRadius: "var(--radius-lg)", boxShadow: "var(--shadow-4)" }}
            >
              <Image
                src="/photos/coach-portrait-arms-crossed.jpeg"
                alt="Nicole, your coach"
                width={760}
                height={950}
                priority
                className="h-auto w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Credibility strip */}
      <section style={{ background: "var(--surface-sunken)" }}>
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-center gap-x-10 gap-y-3 px-5 py-6">
          {["WNBF Pro Bodybuilder", "Taekwon-Do World Champion", "5th Degree Black Belt", "Mom, same as you"].map((c) => (
            <span key={c} className="eyebrow" style={{ color: "var(--ink-700)" }}>
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* Pillars */}
      <section className="mx-auto max-w-[1100px] px-5 py-16 md:py-24">
        <p className="eyebrow eyebrow--accent">What you get</p>
        <h2 className="mt-3" style={{ fontSize: "var(--type-h2-size)" }}>
          Coaching, not a PDF and a prayer.
        </h2>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {pillars.map((p) => (
            <div key={p.title} className="card">
              <div style={{ width: 40, height: 3, background: "var(--pink-500)" }} />
              <h3 className="mt-4" style={{ fontSize: "var(--text-lg)" }}>
                {p.title}
              </h3>
              <p className="mt-3" style={{ color: "var(--text-muted)", fontSize: "var(--text-base)" }}>
                {p.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" style={{ background: "var(--ink-900)", color: "var(--text-invert)" }}>
        <div className="mx-auto max-w-[1100px] px-5 py-16 md:py-24">
          <p className="eyebrow" style={{ color: "var(--pink-300)" }}>
            How it works
          </p>
          <h2 className="mt-3" style={{ color: "var(--paper-50)", fontSize: "var(--type-h2-size)" }}>
            Four steps. No guesswork.
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n}>
                <span className="metric" style={{ color: "var(--yellow)", fontSize: "var(--text-xl)" }}>
                  {s.n}
                </span>
                <h3 className="mt-2" style={{ color: "var(--paper-50)", fontSize: "var(--text-lg)" }}>
                  {s.title}
                </h3>
                <p className="mt-2" style={{ color: "var(--grey-300)", fontSize: "var(--text-sm)", lineHeight: "var(--leading-body)" }}>
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Apply */}
      <section id="apply" className="mx-auto max-w-[640px] px-5 py-16 md:py-24">
        <p className="eyebrow eyebrow--accent">Apply</p>
        <h2 className="mt-3" style={{ fontSize: "var(--type-h2-size)" }}>
          Are you willing to do the work?
        </h2>
        <p className="mt-4" style={{ color: "var(--text-muted)" }}>
          No payment today. I read every one of these myself.
        </p>
        <div className="mt-8">
          <IntakeForm />
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: "var(--ink-900)", color: "var(--grey-400)" }}>
        <div className="mx-auto flex max-w-[1100px] flex-wrap items-center justify-between gap-4 px-5 py-8">
          <Image src="/brand/swirl-paper-pink.png" alt="" width={44} height={44} />
          <p style={{ fontSize: "var(--text-sm)" }}>
            Built by Nicole · Lethbridge, AB ·{" "}
            <Link href="/login" style={{ color: "var(--pink-300)" }}>
              Client login
            </Link>
          </p>
        </div>
      </footer>
    </main>
  );
}
