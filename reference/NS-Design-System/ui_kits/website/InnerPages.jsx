const { Button, Card, Badge, Icon, Tabs, Input, Select, Checkbox, Switch, Dialog, Toast, Tooltip, IconButton } = window.NSDesignSystem_14b176;
const { Section, Eyebrow, Display, ProgrammeCards, PROGRAMMES } = window;

function ProgrammesPage({ onOpen, onNavigate }) {
  const [tab, setTab] = React.useState("all");
  const items = tab === "all" ? PROGRAMMES : PROGRAMMES.filter((p) => (tab === "group" ? p.tag === "Group" : p.tag === "1:1"));
  return (
    <div>
      <Section pad={64} tone="sunken">
        <Eyebrow>Coaching</Eyebrow>
        <Display size={64} style={{marginTop:14}}>Three ways in</Display>
        <p style={{fontFamily:"var(--font-body)",fontSize:19,lineHeight:1.55,color:"var(--text-muted)",maxWidth:600,marginTop:18}}>
          Every option includes the same weekly check-in. The difference is how much of my calendar you get. If it matters, it matters enough to put on the schedule.
        </p>
      </Section>
      <Section pad={56}>
        <div style={{marginBottom:32}}>
          <Tabs value={tab} onChange={setTab} items={[{id:"all",label:"All",count:PROGRAMMES.length},{id:"group",label:"Group"},{id:"1:1",label:"One to one"}]} />
        </div>
        <ProgrammeCards items={items} onOpen={onOpen} />
        <div style={{marginTop:48,display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"var(--space-6)"}}>
          {[["calendar-check","Weekly check-in","A video reply every Sunday. I don't skip it, and I won't let you off the hook."],["dumbbell","Real hypertrophy work","Sets, reps, RPE, and a demo video for every lift."],["apple","Food, not a diet","Targets you can hit at a restaurant on a Friday."],["message-circle","Text access","For the 9pm questions. Answered by me, not an assistant."]].map(([icon,title,body]) => (
            <div key={title}>
              <Icon name={icon} size={22} color="var(--accent)" />
              <h3 style={{fontSize:"var(--text-md)",marginTop:10}}>{title}</h3>
              <p style={{fontSize:14,lineHeight:1.55,color:"var(--text-muted)",marginTop:6}}>{body}</p>
            </div>
          ))}
        </div>
      </Section>
      <Section tone="ink" pad={64}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:"var(--space-8)",flexWrap:"wrap"}}>
          <Display invert size={44}>Not sure which one?</Display>
          <Button variant="outline-invert" size="lg" onClick={() => onNavigate("apply")}>Send me your situation</Button>
        </div>
      </Section>
    </div>
  );
}

const EVENTS = [
  { id: "misogi3", name: "Women's Misogi 3.0", date: "June 21, 2026", time: "6 AM – 6 PM", art: "../../assets/event-graphics/misogi-2-badge.png",
    blurb: "Twelve hours. One thing you're sure you can't do. Forty women finding out otherwise.", spots: "18 of 40 taken", price: "$65" },
  { id: "misogi-mar", name: "All Womens Misogi Challenge", date: "March 9, 2026", time: "10 AM – 10 PM", art: "../../assets/event-graphics/misogi-challenge-flyer.png",
    blurb: "The original. Sandbags, a long walk, and the part in hour eight where it gets funny again.", spots: "Sold out", price: "$65" },
  { id: "moms", name: "Mom's Club, spring block", date: "Tuesdays from April 7", time: "9:15 AM", art: "../../assets/event-graphics/moms-club-neon.png",
    blurb: "Thirty-five minutes, kids welcome in the corner, nobody cares what you look like. Show up with what you can.", spots: "Open", price: "$99/mo" },
];

function EventsPage({ onToast }) {
  const [open, setOpen] = React.useState(null);
  return (
    <div>
      <Section pad={64} tone="ink">
        <Eyebrow tone="invert">Events</Eyebrow>
        <Display invert size={64} style={{marginTop:14}}>Show up. Find out.</Display>
      </Section>
      <Section pad={56}>
        <div style={{display:"flex",flexDirection:"column",gap:"var(--space-6)"}}>
          {EVENTS.map((e) => (
            <Card key={e.id} padding="none">
              <div style={{display:"grid",gridTemplateColumns:"220px 1fr auto",gap:"var(--space-8)",alignItems:"center",padding:"var(--pad-card)"}}>
                <img src={e.art} alt="" style={{width:"100%",height:170,objectFit:"cover",borderRadius:"var(--radius-media)"}} />
                <div>
                  <div style={{display:"flex",gap:8,alignItems:"center"}}>
                    <Badge tone={e.spots === "Sold out" ? "neutral" : "accent"}>{e.spots}</Badge>
                    <span style={{fontFamily:"var(--font-mono)",fontSize:12,color:"var(--text-muted)"}}>{e.date.toUpperCase()} · {e.time}</span>
                  </div>
                  <h3 style={{fontFamily:"var(--font-serif-display)",fontWeight:700,fontSize:28,letterSpacing:"var(--tracking-wide)",textTransform:"uppercase",marginTop:12}}>{e.name}</h3>
                  <p style={{fontSize:16,lineHeight:1.55,color:"var(--text-muted)",marginTop:10,maxWidth:520}}>{e.blurb}</p>
                </div>
                <div style={{display:"flex",flexDirection:"column",gap:10,alignItems:"stretch",minWidth:150}}>
                  <span style={{fontFamily:"var(--font-mono)",fontWeight:700,fontSize:20,textAlign:"center",color:"var(--text-strong)"}}>{e.price}</span>
                  <Button disabled={e.spots === "Sold out"} onClick={() => setOpen(e)}>{e.spots === "Sold out" ? "Sold out" : "Save my spot"}</Button>
                  <Tooltip label="Add to calendar" placement="left">
                    <IconButton label="Add to calendar" variant="outline" size="sm"><Icon name="calendar-plus" size={16} /></IconButton>
                  </Tooltip>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Section>
      <Dialog open={Boolean(open)} title={open ? open.name : ""} onClose={() => setOpen(null)}
        footer={<><Button variant="ghost" onClick={() => setOpen(null)}>Not now</Button><Button onClick={() => { setOpen(null); onToast("You're in", "Check your email for the kit list."); }}>Lock it in</Button></>}>
        {open ? (
          <div style={{display:"flex",flexDirection:"column",gap:14}}>
            <p style={{fontSize:16,lineHeight:1.55,color:"var(--text-muted)"}}>{open.blurb}</p>
            <Input label="Full name" placeholder="First and last" />
            <Select label="Have you done one before?" options={["First one", "Second", "Third or more"]} />
            <Checkbox label="I understand this is twelve hours long" hint="It's longer than you think. That's the point." />
          </div>
        ) : null}
      </Dialog>
    </div>
  );
}

function ApplyPage({ onToast }) {
  const [sent, setSent] = React.useState(false);
  return (
    <Section pad={64}>
      <div style={{display:"grid",gridTemplateColumns:"1.2fr 0.8fr",gap:"var(--space-16)",alignItems:"start"}}>
        <div>
          <Eyebrow>Apply</Eyebrow>
          <Display size={56} style={{marginTop:14}}>Tell me where<br />you actually are</Display>
          <p style={{fontFamily:"var(--font-body)",fontSize:18,lineHeight:1.6,color:"var(--text-muted)",marginTop:18,maxWidth:520}}>
            Not where you think you should be. Sleep, schedule, injuries, the last three programmes you quit. I read every one of these myself and reply within two days.
          </p>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"var(--space-4)",marginTop:34}}>
            <Input label="First name" placeholder="Nikki" required />
            <Input label="Last name" placeholder="S." required />
            <Input label="Email" type="email" placeholder="you@email.com" required />
            <Input label="Phone" placeholder="(555) 019-4432" />
            <Select label="Programme" options={["Off-season strength", "Show prep 1:1", "Mom's Club", "Not sure yet"]} />
            <Select label="Training age" options={["Brand new", "Under a year", "1–3 years", "3+ years"]} />
          </div>
          <div style={{marginTop:16}}>
            <Input label="What's getting in the way?" as="textarea" rows={5} placeholder="Be honest. This is the part that tells me what to change first." />
          </div>
          <div style={{marginTop:18,display:"flex",flexDirection:"column",gap:4}}>
            <Checkbox label="Text me session reminders" hint="Two a week. That's it." defaultChecked />
            <Checkbox label="I have a competition date in mind" />
          </div>
          <div style={{marginTop:26,display:"flex",gap:"var(--space-3)",alignItems:"center",flexWrap:"wrap"}}>
            <Button size="lg" onClick={() => { setSent(true); onToast("Application sent", "I'll reply within two days."); }}>Start Your Check-In</Button>
            <span style={{fontFamily:"var(--font-body)",fontSize:13,color:"var(--text-faint)"}}>No payment today.</span>
          </div>
          {sent ? <div style={{marginTop:22}}><Toast tone="success" title="Application sent">The reply comes from me, not an assistant.</Toast></div> : null}
        </div>
        <Card tone="invert" padding="lg">
          <Badge tone="highlight">March cohort</Badge>
          <h3 style={{fontSize:"var(--text-xl)",color:"var(--paper-50)",marginTop:14}}>What happens next</h3>
          <ol style={{margin:"16px 0 0",padding:0,listStyle:"none",display:"flex",flexDirection:"column",gap:14}}>
            {[["01","I read it and reply in two days."],["02","Fifteen minute call. No pitch, no pressure."],["03","Your plan and your first check-in date, by Monday."]].map(([n,t]) => (
              <li key={n} style={{display:"flex",gap:12}}>
                <span style={{fontFamily:"var(--font-mono)",fontWeight:700,fontSize:13,color:"var(--pink-300)"}}>{n}</span>
                <span style={{fontSize:15,lineHeight:1.5,color:"var(--grey-300)"}}>{t}</span>
              </li>
            ))}
          </ol>
          <div style={{marginTop:22,paddingTop:18,borderTop:"1px solid var(--border-invert)",display:"flex",flexDirection:"column",gap:12}}>
            <Switch label="Send me the free week first" invert labelPosition="start" />
            <Switch label="Add me to the events list" invert defaultChecked labelPosition="start" />
          </div>
        </Card>
      </div>
    </Section>
  );
}

Object.assign(window, { ProgrammesPage, EventsPage, ApplyPage, EVENTS });
