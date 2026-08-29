const { Logo, Button, Icon } = window.NSDesignSystem_14b176;

const NAV = [
  { id: "home", label: "Home" },
  { id: "programmes", label: "Coaching" },
  { id: "events", label: "Events" },
  { id: "apply", label: "Apply" },
];

function SiteHeader({ page, onNavigate }) {
  return (
    <header style={{position:"sticky",top:0,zIndex:30,height:"var(--nav-height)",background:"var(--ink-900)",borderBottom:"1px solid var(--border-invert)"}}>
      <div style={{maxWidth:"var(--container-max)",margin:"0 auto",padding:"0 var(--gutter-lg)",height:"100%",display:"flex",alignItems:"center",gap:"var(--space-10)"}}>
        <button onClick={() => onNavigate("home")} style={{display:"flex",alignItems:"center",gap:10,background:"none",border:0,cursor:"pointer",padding:0}}>
          <Logo variant="swirl-paper-pink" size={38} basePath="../../assets/logos" />
          <span style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:19,letterSpacing:"0.02em",color:"var(--paper-50)"}}>NS</span>
        </button>
        <nav style={{display:"flex",gap:"var(--space-8)",flex:1}}>
          {NAV.map((n) => (
            <button key={n.id} onClick={() => onNavigate(n.id)}
              style={{background:"none",border:0,padding:"6px 0",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:13,fontWeight:700,letterSpacing:"var(--tracking-wide)",textTransform:"uppercase",
                color:page===n.id?"var(--paper-50)":"var(--grey-400)",borderBottom:page===n.id?"2px solid var(--accent)":"2px solid transparent"}}>
              {n.label}
            </button>
          ))}
        </nav>
        <div style={{display:"flex",alignItems:"center",gap:"var(--space-4)"}}>
          <span style={{fontFamily:"var(--font-mono)",fontSize:11,color:"var(--grey-400)",whiteSpace:"nowrap"}}>NEXT START · MAR 3</span>
          <Button size="sm" variant="highlight" onClick={() => onNavigate("apply")}>Start your check-in</Button>
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ onNavigate }) {
  const col = (title, links) => (
    <div style={{display:"flex",flexDirection:"column",gap:10}}>
      <span style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"var(--tracking-widest)",textTransform:"uppercase",color:"var(--grey-500)"}}>{title}</span>
      {links.map((l) => (
        <button key={l} onClick={() => onNavigate("programmes")} style={{background:"none",border:0,padding:0,textAlign:"left",cursor:"pointer",fontFamily:"var(--font-body)",fontSize:14,color:"var(--grey-300)"}}>{l}</button>
      ))}
    </div>
  );
  return (
    <footer style={{background:"var(--ink-900)",padding:"64px var(--gutter-lg) 40px"}}>
      <div style={{maxWidth:"var(--container-max)",margin:"0 auto",display:"grid",gridTemplateColumns:"1.4fr 1fr 1fr 1fr",gap:"var(--space-10)"}}>
        <div>
          <Logo variant="lockup-on-ink" size={72} basePath="../../assets/logos" />
          <p style={{fontFamily:"var(--font-body)",fontSize:15,lineHeight:1.55,color:"var(--grey-400)",marginTop:16,maxWidth:280}}>
            Strength and habit coaching for women with full lives. Real accountability, a tested process, no hype.
          </p>
        </div>
        {col("Coaching", ["Off-season strength", "Show prep", "Group training", "Nutrition"])}
        {col("Events", ["Misogi Challenge", "Mom's Club", "Team meet-ups"])}
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <span style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"var(--tracking-widest)",textTransform:"uppercase",color:"var(--grey-500)"}}>Follow</span>
          <div style={{display:"flex",gap:10}}>
            {["instagram","facebook","youtube","mail"].map((i) => (
              <span key={i} style={{width:38,height:38,borderRadius:"50%",border:"1px solid var(--border-invert)",display:"flex",alignItems:"center",justifyContent:"center",color:"var(--grey-300)"}}>
                <Icon name={i} size={17} />
              </span>
            ))}
          </div>
        </div>
      </div>
      <div style={{maxWidth:"var(--container-max)",margin:"40px auto 0",paddingTop:20,borderTop:"1px solid var(--border-invert)",display:"flex",justifyContent:"space-between",fontFamily:"var(--font-mono)",fontSize:11,color:"var(--grey-500)"}}>
        <span>© 2026 NS COACHING</span><span>BUILT TO LAST</span>
      </div>
    </footer>
  );
}

function Section({ children, tone = "paper", pad = 96, style }) {
  const bg = tone === "ink" ? "var(--ink-900)" : tone === "sunken" ? "var(--surface-sunken)" : "var(--bg-page)";
  return (
    <section style={{background:bg,padding:`${pad}px var(--gutter-lg)`,...style}}>
      <div style={{maxWidth:"var(--container-max)",margin:"0 auto"}}>{children}</div>
    </section>
  );
}

function Eyebrow({ children, tone = "accent" }) {
  return <div style={{fontFamily:"var(--font-body)",fontSize:12,fontWeight:700,letterSpacing:"var(--tracking-widest)",textTransform:"uppercase",color:tone==="accent"?"var(--text-accent)":"var(--pink-300)"}}>{children}</div>;
}

function Display({ children, size = 68, invert = false, style }) {
  return <h2 style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:size,lineHeight:0.96,letterSpacing:"var(--tracking-tightest)",textTransform:"uppercase",color:invert?"var(--paper-50)":"var(--text-strong)",margin:0,...style}}>{children}</h2>;
}

Object.assign(window, { SiteHeader, SiteFooter, Section, Eyebrow, Display, NAV });
