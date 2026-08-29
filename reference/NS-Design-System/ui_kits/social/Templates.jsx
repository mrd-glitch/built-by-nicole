const { Logo, Badge, Button } = window.NSDesignSystem_14b176;

const Square = ({ children, style }) => (
  <div style={{width:360,height:360,position:"relative",overflow:"hidden",borderRadius:"var(--radius-media)",boxShadow:"var(--shadow-3)",...style}}>{children}</div>
);

/* Challenge announce — Cinzel over the flyer gradient, as on the supplied Misogi artwork. */
function ChallengeAnnounce() {
  return (
    <Square style={{background:"var(--grad-flyer)"}}>
      <div style={{position:"absolute",inset:0,padding:30,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center",gap:16}}>
        <div style={{fontFamily:"var(--font-serif-display)",fontWeight:600,fontSize:12,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--ink-900)",whiteSpace:"nowrap"}}>Saturday, June 21</div>
        <div style={{fontFamily:"var(--font-serif-display)",fontWeight:700,fontSize:34,lineHeight:1.12,letterSpacing:"0.05em",textTransform:"uppercase",color:"var(--ink-900)"}}>Women&rsquo;s<br />Misogi 3.0</div>
        <div style={{width:44,borderTop:"2px solid rgb(13 13 15 / .5)"}} />
        <div style={{fontFamily:"var(--font-serif-display)",fontSize:14,letterSpacing:"0.16em",color:"rgb(13 13 15 / .78)",whiteSpace:"nowrap"}}>6 AM &ndash; 6 PM</div>
      </div>
      <Logo variant="swirl-ink-pink" size={46} basePath="../../assets/logos" style={{position:"absolute",bottom:16,left:"50%",transform:"translateX(-50%)",opacity:0.9}} />
    </Square>
  );
}

/* Programme promo — ink card, photo, display type, one pink CTA. */
function ProgrammePromo() {
  return (
    <Square style={{background:"var(--ink-900)"}}>
      <img src="../../assets/photography/gym-dumbbell-rack.jpeg" alt="" style={{position:"absolute",inset:0,width:"100%",height:"100%",objectFit:"cover",opacity:0.5}} />
      <div style={{position:"absolute",inset:0,background:"linear-gradient(180deg,rgb(13 13 15 / .35) 0%,rgb(13 13 15 / .95) 72%)"}} />
      <div style={{position:"absolute",inset:0,padding:26,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
          <Logo variant="swirl-paper-pink" size={40} basePath="../../assets/logos" />
          <Badge tone="highlight">4 spots</Badge>
        </div>
        <div>
          <div style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"0.26em",textTransform:"uppercase",color:"var(--pink-300)"}}>March cohort</div>
          <div style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:44,lineHeight:0.94,letterSpacing:"-0.03em",textTransform:"uppercase",color:"var(--paper-50)",marginTop:10}}>Off-season<br />strength</div>
          <div style={{fontFamily:"var(--font-mono)",fontSize:13,color:"var(--grey-300)",marginTop:12}}>12 WEEKS · 4 DAYS/WK · $249</div>
        </div>
      </div>
    </Square>
  );
}

/* Neon club title — the Mom's Club treatment: display + script, yellow glow on ink. */
function NeonClubTitle() {
  return (
    <Square style={{background:"radial-gradient(120% 90% at 50% 10%, #2B2B31 0%, #0D0D0F 70%)"}}>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
        <div style={{fontFamily:"var(--font-display)",fontWeight:900,fontSize:52,letterSpacing:"-0.02em",textTransform:"uppercase",color:"#FF8FA8",textShadow:"var(--glow-pink)"}}>Mom&rsquo;s</div>
        <div style={{fontFamily:"var(--font-script)",fontSize:82,lineHeight:0.9,color:"#FFF6B0",textShadow:"var(--glow-yellow)",marginTop:-4}}>Club</div>
        <div style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"0.18em",textTransform:"uppercase",color:"var(--grey-400)",marginTop:20,whiteSpace:"nowrap"}}>Tuesdays · 9:15 AM · 35 min</div>
      </div>
      <Logo variant="swirl-paper-pink" size={34} basePath="../../assets/logos" style={{position:"absolute",bottom:18,right:18,opacity:0.85}} />
    </Square>
  );
}

/* Quote card — paper, pink rule, no photo. */
function QuoteCard() {
  return (
    <Square style={{background:"var(--paper-50)"}}>
      <div style={{position:"absolute",inset:0,padding:30,display:"flex",flexDirection:"column",justifyContent:"space-between"}}>
        <div style={{width:52,borderTop:"var(--rule-accent)"}} />
        <div style={{fontFamily:"var(--font-display)",fontWeight:800,fontSize:38,lineHeight:1.04,letterSpacing:"-0.02em",color:"var(--ink-900)"}}>
          Nothing changes if nothing changes.
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-end"}}>
          <div style={{fontFamily:"var(--font-body)",fontSize:11,fontWeight:700,letterSpacing:"0.2em",textTransform:"uppercase",color:"var(--text-muted)",whiteSpace:"nowrap"}}>NS Coaching</div>
          <Logo variant="swirl-ink-pink" size={38} basePath="../../assets/logos" />
        </div>
      </div>
    </Square>
  );
}

function SocialSheet() {
  const label = (t) => (
    <div style={{fontFamily:"var(--font-body)",fontSize:10,fontWeight:700,letterSpacing:"0.26em",textTransform:"uppercase",color:"var(--text-faint)",marginTop:10}}>{t}</div>
  );
  return (
    <div style={{display:"flex",gap:24,padding:28,flexWrap:"wrap"}}>
      <div><ChallengeAnnounce />{label("Challenge announce")}</div>
      <div><ProgrammePromo />{label("Programme promo")}</div>
      <div><NeonClubTitle />{label("Neon club title")}</div>
      <div><QuoteCard />{label("Quote card")}</div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<SocialSheet />);
