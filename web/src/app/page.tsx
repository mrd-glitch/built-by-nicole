import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { IntakeForm } from "@/components/IntakeForm";
import { NSBadge } from "@/components/NSBadge";
import styles from "./landing.module.css";

// Visual contract and provisional-photo replacement brief: docs/landing-direction.md.
// Keep preview-only content server-gated so it cannot enter a production build.
const preview = process.env.NODE_ENV === "development";

export const metadata: Metadata = {
  title: "Built by Nicole | Personal Fitness & Nutrition Coaching",
  description:
    "Personal fitness and nutrition coaching for women with full lives. Get stronger with a plan, weekly check-ins, and Nicole in your corner. Apply for coaching.",
};

const questions = [
  {
    question: "Do I need to be fit before I start?",
    answer:
      "No. Your application tells me where you're starting, whether you're brand new, getting back into training, or already consistent. We build from there.",
  },
  {
    question: "Can I train at home?",
    answer:
      "Yes. Tell me what you have available, whether that's a gym membership, dumbbells and bands, or very little equipment. Your plan is built around what you can use.",
  },
  {
    question: "How much time do I need?",
    answer:
      "Start with what you can realistically give. The application asks how many days you can train and what life looks like right now. We'll use that to shape your plan, with a check-in each Sunday.",
  },
  {
    question: "What does nutrition coaching include?",
    answer:
      "A personal nutrition plan, a weekly check-in on how it's going, and adjustments along the way. You'll be able to view your plan and message me through your client portal.",
  },
  {
    question: "What happens after I apply?",
    answer:
      "I review your answers and get in touch to talk about your goals and whether we're a good fit. There's no payment to submit an application. If we decide to work together, you'll receive an invitation to your client portal.",
  },
];

function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      style={down ? { transform: "rotate(90deg)" } : undefined}
    >
      <path
        d="M4 12h15m-6-6 6 6-6 6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ApplyLink({
  children = "Apply for coaching",
}: {
  children?: React.ReactNode;
}) {
  return (
    <a className={styles.cta} href="#apply">
      {children}
      <Arrow />
    </a>
  );
}

export default function LandingPage() {
  return (
    <main className={styles.landing} id="top">
      <a className={styles.skipLink} href="#main-content">
        Skip to content
      </a>
      <section className={styles.hero} aria-labelledby="hero-title">
        <div className={styles.heroPhoto}>
          <Image
            src="/photos/nicole-outdoor-portrait.webp"
            alt="Nicole smiling on a sunlit desert trail"
            fill
            sizes="(max-width: 760px) 960px, (max-width: 1100px) 1280px, 100vw"
            preload
            className={styles.heroImage}
          />
        </div>
        <div className={styles.heroScrim} />
        <header className={styles.header}>
          <a
            className={styles.brand}
            href="#top"
            aria-label="Built by Nicole home"
          >
            <NSBadge tone="paper" size={58} />
            <span>
              Built by Nicole
              <span className={styles.brandSub}>Personal coaching</span>
            </span>
          </a>
          <nav aria-label="Main navigation" className={styles.nav}>
            <a href="#nicole">Meet Nicole</a>
            <a href="#coaching">The coaching</a>
            <a href="#apply">
              Let’s get started <Arrow />
            </a>
          </nav>
          <Link className={styles.login} href="/login">
            Client login
          </Link>
        </header>
        <div className={styles.heroContent} id="main-content">
          <h1 id="hero-title">
            <span className={styles.heroLead}>Get stronger.</span>
            <span className={styles.heroRest}>
              Without putting
              <br />
              your life on hold.
            </span>
          </h1>
          <p>
            Personal fitness and nutrition coaching for women with full lives. A
            plan that fits. Support that stays.
          </p>
          <ApplyLink />
          <span className={styles.heroReassurance}>
            Your first step is a conversation. No payment today.
          </span>
        </div>
        <div className={styles.heroBottom}>
          <span>Training. Nutrition. A coach in your corner.</span>
          <a href="#nicole">
            Meet your coach <Arrow down />
          </a>
        </div>
      </section>

      <section
        className={styles.intro}
        id="nicole"
        aria-labelledby="nicole-title"
      >
        <div className={styles.familyScene}>
          <div className={styles.introPhoto}>
            <Image
              src="/photos/nicole-whole-family.webp"
              alt="Nicole with Josh and their two boys on a desert trail"
              fill
              sizes="(max-width: 900px) 100vw, 75vw"
            />
          </div>
          <div className={styles.container}>
            <div className={styles.introCopy}>
              <h2 id="nicole-title">
                A strong woman.
                <br />A full life.
                <br />
                <span className={styles.script}>I get it.</span>
              </h2>
              <p>
                I’m Nicole. A coach, an athlete, and a mom. I know training is only
                one part of your day. There’s work, family, and everything else
                asking for your attention.
              </p>
              <p>
                You don’t have to put all of that on pause to take care of yourself.
                We start with where you are, make a plan you can show up for, and
                work through the weeks together.
              </p>
              <p className={styles.introEmphasis}>
                You bring your real life. I’ll help you build from there.
              </p>
              <a className={styles.textLink} href="#coaching">
                Here’s how I coach <Arrow />
              </a>
            </div>
          </div>
        </div>
        <article
          className={`${styles.container} ${styles.athleteStory}`}
          aria-labelledby="athlete-title"
        >
          <div className={styles.athleteCopy}>
            <h2 id="athlete-title">
              The athlete behind
              <br />
              the coach.
            </h2>
            <p>
              My own training is a big part of my life. But your goals don’t
              have to look like mine.
            </p>
            <p>
              Whether you’re getting started or finding your way back, your plan
              begins with you: your starting point, your schedule, and what you
              want to feel capable of.
            </p>
            <ul
              className={styles.credentials}
              aria-label="Nicole's athletic credentials"
            >
              <li>WNBF Pro Bodybuilder</li>
              <li>Taekwon-Do World Champion</li>
              <li>5th Degree Black Belt</li>
            </ul>
          </div>
          <figure className={styles.athletePhoto}>
            <Image
              src="/photos/nicole-wnbf-celebration.webp"
              alt="Nicole celebrating on the WNBF stage, holding a sword overhead with her medal and sash"
              width={1284}
              height={1252}
              sizes="(max-width: 760px) 100vw, 42vw"
            />
            <figcaption>
              A moment from my own journey. Your journey is yours.
            </figcaption>
          </figure>
        </article>
      </section>

      <section
        className={styles.coaching}
        id="coaching"
        aria-labelledby="coaching-title"
      >
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <h2 id="coaching-title">
              Your goals.
              <br />
              Your real life.
              <br />
              <span className={styles.pink}>One personal plan.</span>
            </h2>
            <p>
              You won’t be left to figure it out alone. We put training,
              nutrition, and regular support in the same place, with me there to
              help you use them.
            </p>
          </div>
          <div className={styles.coachingGrid}>
            <figure className={styles.trainingPhoto}>
              <Image
                src="/photos/gym-mirror-selfie.jpeg"
                alt="Nicole at the gym beside the dumbbell rack"
                width={768}
                height={1024}
                sizes="(max-width: 760px) 100vw, 44vw"
              />
              <figcaption>
                The work is personal. The plan should be, too.
              </figcaption>
            </figure>
            <div className={styles.services}>
              <article>
                <h3>Training that fits your week.</h3>
                <p>
                  Your schedule, your experience, your equipment. Your workouts
                  are built around all three, with space to record your sets and
                  see how you’re progressing.
                </p>
                <span>At home or at the gym</span>
              </article>
              <article>
                <h3>Nutrition with a plan.</h3>
                <p>
                  Know what you’re working toward and what’s on your plan. We
                  look at how eating fits into your day, then use your check-ins
                  to see what needs adjusting.
                </p>
                <span>Personal guidance, week by week</span>
              </article>
              <article>
                <h3>Someone in your corner.</h3>
                <p>
                  Check in each Sunday. Tell me what worked and what was hard.
                  Message me when you need help, and we’ll figure out the next
                  step together.
                </p>
                <span>Weekly check-ins + direct messaging</span>
              </article>
            </div>
          </div>
        </div>
      </section>

      {preview && (
        <section
          className={`${styles.container} ${styles.stories}`}
          aria-labelledby="stories-title"
        >
          <div className={styles.sectionHeading}>
            <h2 id="stories-title">
              Their words.
              <br />
              Their progress.
            </h2>
            <p className={styles.previewLabel}>
              Preview only · Awaiting approved client stories. This section
              stays hidden in production until real testimonials are added.
            </p>
          </div>
          <div className={styles.storyGrid}>
            {[
              "A plan that fits real life",
              "Support that makes a difference",
            ].map((theme, i) => (
              <article className={styles.storyPlaceholder} key={theme}>
                <span>Client story {i + 1} · Placeholder</span>
                <h3>{theme}</h3>
                <p>
                  Space for an approved client quote about her experience
                  working with Nicole.
                </p>
                <div>Client name and attribution to follow</div>
              </article>
            ))}
          </div>
        </section>
      )}

      <section className={styles.start} id="how" aria-labelledby="start-title">
        <div className={styles.container}>
          <div className={styles.sectionHeading}>
            <h2 id="start-title">
              You don’t need it all
              <br />
              figured out to start.
            </h2>
            <p>
              Tell me where you are and where you want to go. We’ll take the
              next step from there.
            </p>
          </div>
          <ol className={styles.steps}>
            <li>
              <span aria-hidden="true">01</span>
              <h3>Tell me about you.</h3>
              <p>
                Share your goals, your routine, and what you’re finding
                difficult in the application below.
              </p>
            </li>
            <li>
              <span aria-hidden="true">02</span>
              <h3>Let’s connect.</h3>
              <p>
                I’ll review your answers and get in touch. We’ll talk about how
                I can help and whether we’re a fit.
              </p>
            </li>
            <li>
              <span aria-hidden="true">03</span>
              <h3>Build your beginning.</h3>
              <p>
                If we work together, you’ll get your portal invitation, your
                personal plan, and a place to check in.
              </p>
            </li>
          </ol>
          <ApplyLink />
        </div>
      </section>

      <section
        className={`${styles.container} ${styles.faq}`}
        aria-labelledby="faq-title"
      >
        <div>
          <h2 id="faq-title">
            A few things you
            <br />
            might be wondering.
          </h2>
          <p>
            Starting something new comes with questions. There’s room for those,
            too.
          </p>
        </div>
        <div className={styles.questions}>
          {questions.map(({ question, answer }) => (
            <details key={question}>
              <summary>
                {question}
                <span className={styles.plus} aria-hidden="true" />
              </summary>
              <p>{answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section
        className={styles.application}
        id="apply"
        aria-labelledby="apply-title"
      >
        <div className={`${styles.container} ${styles.applicationGrid}`}>
          <div className={styles.applicationCopy}>
            <h2 id="apply-title">
              Let’s make
              <br />
              room for <span className={styles.script}>you.</span>
            </h2>
            <p>
              You don’t need the perfect starting point. Tell me a little about
              yourself, and let’s see what we can build together.
            </p>
            <p className={styles.applicationReassurance}>
              No payment today. I read every application myself.
            </p>
            <div className={styles.signature}>
              <span>Nothing changes if</span>
              <span>nothing changes.</span>
              <span className={styles.script}>Nicole</span>
            </div>
          </div>
          <div className={styles.formWrap}>
            <IntakeForm />
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.container}>
          <a className={styles.brand} href="#top">
            <NSBadge tone="paper" size={52} />
            <span>
              Built by Nicole
              <span className={styles.brandSub}>
                Personal fitness + nutrition coaching
              </span>
            </span>
          </a>
          <p>A stronger you. A life that’s still yours.</p>
          <Link href="/login">
            Client login <Arrow />
          </Link>
        </div>
      </footer>
    </main>
  );
}
