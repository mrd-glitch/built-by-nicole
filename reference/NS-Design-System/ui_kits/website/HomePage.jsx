const { Button, Card, Badge, Icon, Tag } = window.NSDesignSystem_14b176;
const { Section, Eyebrow, Display } = window;

const PROGRAMMES = [
  { id: "offseason", name: "Off-season strength", weeks: 12, price: "$249/mo", tag: "Group", photo: "../../assets/photography/gym-dumbbell-rack.jpeg",
    blurb: "Four sessions a week, real hypertrophy work, a check-in every Sunday. Built so you can still do it in week ten.", spots: "4 spots left" },
  { id: "prep", name: "Show prep, 1:1", weeks: 20, price: "$495/mo", tag: "1:1", photo: "../../assets/photography/stage-teal-suit-front.jpeg",
    blurb: "Peak week, posing, suit, tan. I hold a pro card, so I know what I'm asking you to do.", spots: "2 spots left" },
  { id: "moms", name: "Mom's Club", weeks: 8, price: "$99/mo", tag: "Group", photo: "../../assets/photography/coach-barn-door-seated.jpeg",
    blurb: "Thirty-five minutes, between drop-off and everything else. Show up with what you can.", spots: "Open" },
];

function Hero({ onNavigate }) {
  return (
    <div style={{position:"relative",minHeight:640,display:"flex",alignItems:"flex-end",background:"var(--ink-900)",overflow:"hidden"}}>
      <img src="../../assets/photography/gym-mirror-selfie.jpeg" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",objectPosition:"center 18%",opacity:0.62}} />
      <div style={{position:"absolute",inset:0,background:"linear-gradient(90deg,rgb(13 13 15 / .92) 0%,rgb(13 13 15 / .6) 55%,rgb(13 13 15 / .25) 100%)"}} />
      <div style={{position:"relative",maxWidth:"var(--container-max)",margin:"0 auto",padding:"0 var(--gutter-lg) 72px",width:"100%"}}>
        <Eyebrow tone="invert">Strength and habit coaching</Eyebrow>
        <Display invert size={84} style={{marginTop:14,maxWidth:900}}>Nothing changes<br />if nothing changes</Display>
        <p style={{fontFamily:"var(--font-body)",fontSize:19,lineHeight:1.55,color:"var(--grey-300)",maxWidth:520,marginTop:22}}>
          You don't need more motivation. You need a weekly check-in and someone who won't let you off the hook.
        </p>
        <div style={{display:"flex",gap:"var(--space-3)",marginTop:32,flexWrap:"wrap"}}>
          <Button size="lg" onClick={() => onNavigate("apply")}>Start Your Check-In</Button>
          <Button size="lg" variant="outline-invert" onClick={() => onNavigate("programmes")}>See how coaching works</Button>
        </div>
        <div style={{display:"flex",gap:"var(--space-12)",marginTop:56,flexWrap:"wrap"}}>
          {[["5th","degree black belt"],["WNBF","pro bodybuilder"],["Weekly","check-in, no skipping"]].map(([n, l]) => (
            <div key={l}>
              <div style={{fontFamily:"var(--font-mono)",fontWeight:700,fontSize:34,color:"var(--paper-50)",letterSpacing:"-0.015em"}}>{n}</div>
              <div style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"var(--tracking-widest)",textTransform:"uppercase",color:"var(--grey-500)",marginTop:4}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProgrammeCards({ onOpen, items = PROGRAMMES }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"var(--space-6)"}}>
      {items.map((p) => (
        <Card key={p.id} media={p.photo} mediaHeight={200} onClick={() => onOpen(p)}>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <Badge tone={p.spots === "Open" ? "neutral" : "accent"}>{p.spots}</Badge>
            <Badge tone="outline">{p.weeks} weeks</Badge>
          </div>
          <h3 style={{fontSize:"var(--text-xl)",marginTop:12}}>{p.name}</h3>
          <p style={{fontSize:15,lineHeight:1.55,color:"var(--text-muted)",marginTop:8}}>{p.blurb}</p>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,paddingTop:14,borderTop:"1px solid var(--border-hairline)"}}>
            <span style={{fontFamily:"var(--font-mono)",fontWeight:700,fontSize:16,color:"var(--text-strong)"}}>{p.price}</span>
            <span style={{display:"flex",alignItems:"center",gap:6,fontFamily:"var(--font-body)",fontSize:12,fontWeight:700,letterSpacing:"var(--tracking-wide)",textTransform:"uppercase",color:"var(--text-accent)"}}>
              Details <Icon name="arrow-right" size={14} />
            </span>
          </div>
        </Card>
      ))}
    </div>
  );
}

function CoachBlock() {
  return (
    <div style={{display:"grid",gridTemplateColumns:"0.9fr 1.1fr",gap:"var(--space-16)",alignItems:"center"}}>
      <img src="../../assets/photography/coach-portrait-arms-crossed.jpeg" alt="" style={{width:"100%",borderRadius:"var(--radius-card)",objectFit:"cover",aspectRatio:"3/4"}} />
      <div>
        <Eyebrow>Your coach</Eyebrow>
        <Display size={52} style={{marginTop:14}}>I've done the work<br />I'm asking you to do</Display>
        <p style={{fontFamily:"var(--font-body)",fontSize:18,lineHeight:1.6,color:"var(--text-body)",marginTop:20}}>
          Fifth degree black belt. Taekwon-Do world champion. WNBF pro bodybuilder. None of that happened by accident, and none of it happened fast.
          I also coach mothers with 40 minutes, no babysitter and four hours of sleep. That plan looks nothing like mine, and it still works, because the quiet work nobody sees is the same work either way.
          Here's what you get from me: a plan you can actually run, and someone who notices when you go quiet.
        </p>
        <div style={{display:"flex",gap:"var(--space-3)",marginTop:22,flexWrap:"wrap"}}>
          <Tag>5th degree black belt</Tag><Tag>Taekwon-Do world champion</Tag><Tag>WNBF pro bodybuilder</Tag><Tag>Habit coach</Tag>
        </div>
      </div>
    </div>
  );
}

function EventStrip({ onNavigate }) {
  return (
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--space-10)",alignItems:"center"}}>
      <div>
        <Eyebrow tone="invert">Events</Eyebrow>
        <Display invert size={52} style={{marginTop:14}}>Are you willing<br />to do the work?</Display>
        <p style={{fontFamily:"var(--font-body)",fontSize:18,lineHeight:1.6,color:"var(--grey-300)",marginTop:18,maxWidth:460}}>
          The Misogi Challenge is twelve hours of work nobody chooses alone. Mom's Club is thirty-five minutes and a lot of laughing. Both are open to everyone, and both ask the same question.
        </p>
        <div style={{marginTop:26}}><Button variant="highlight" onClick={() => onNavigate("events")}>See what's coming</Button></div>
      </div>
      <div style={{display:"flex",gap:"var(--space-4)"}}>
        <img src="../../assets/event-graphics/misogi-challenge-flyer.png" alt="Misogi Challenge" style={{width:"50%",borderRadius:"var(--radius-media)",boxShadow:"var(--shadow-4)"}} />
        <img src="../../assets/event-graphics/misogi-2-badge.png" alt="Misogi 2.0" style={{width:"50%",borderRadius:"var(--radius-media)",boxShadow:"var(--shadow-4)",alignSelf:"flex-end"}} />
      </div>
    </div>
  );
}

const QUOTES = [
  { q: "I stopped restarting. Fourteen months straight now. That has never happened before, not once.", n: "Kara M.", p: "Off-season strength" },
  { q: "I went quiet in week nine. She noticed and texted me. That message is the reason I made it to the stage.", n: "Danielle R.", p: "Show prep 1:1" },
  { q: "Thirty-five minutes, three mornings a week. It fits my life, so I actually do it.", n: "Steph L.", p: "Mom's Club" },
];

function Testimonials() {
  return (
    <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"var(--space-6)"}}>
      {QUOTES.map((t) => (
        <Card key={t.n} tone="flat" padding="lg">
          <Icon name="quote" size={22} color="var(--accent)" />
          <p style={{fontFamily:"var(--font-body)",fontSize:17,lineHeight:1.5,color:"var(--text-strong)",marginTop:12}}>{t.q}</p>
          <div style={{marginTop:18,fontFamily:"var(--font-body)",fontSize:12,fontWeight:700,letterSpacing:"var(--tracking-wide)",textTransform:"uppercase",color:"var(--text-muted)"}}>{t.n} · {t.p}</div>
        </Card>
      ))}
    </div>
  );
}

function CtaBand({ onNavigate }) {
  return (
    <div style={{background:"var(--grad-flyer-diag)",padding:"72px var(--gutter-lg)"}}>
      <div style={{maxWidth:"var(--container-max)",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",gap:"var(--space-10)",flexWrap:"wrap"}}>
        <div>
          <Display size={56} style={{color:"var(--ink-900)"}}>March coaching<br />opens Monday</Display>
          <p style={{fontFamily:"var(--font-body)",fontSize:18,color:"rgb(13 13 15 / .72)",marginTop:14}}>Six spots. They go when they go.</p>
        </div>
        <Button size="lg" variant="ink" onClick={() => onNavigate("apply")}>Start Your Check-In</Button>
      </div>
    </div>
  );
}

function HomePage({ onNavigate, onOpen }) {
  return (
    <div>
      <Hero onNavigate={onNavigate} />
      <Section>
        <Eyebrow>Coaching</Eyebrow>
        <Display size={52} style={{marginTop:14,marginBottom:36}}>Show up with<br />what you can</Display>
        <ProgrammeCards onOpen={onOpen} />
      </Section>
      <Section tone="sunken"><CoachBlock /></Section>
      <Section tone="ink"><EventStrip onNavigate={onNavigate} /></Section>
      <Section>
        <Eyebrow>Real people, real numbers</Eyebrow>
        <Display size={52} style={{marginTop:14,marginBottom:36}}>The quiet work<br />nobody sees</Display>
        <Testimonials />
      </Section>
      <CtaBand onNavigate={onNavigate} />
    </div>
  );
}

Object.assign(window, { HomePage, ProgrammeCards, CoachBlock, EventStrip, Testimonials, CtaBand, Hero, PROGRAMMES });
