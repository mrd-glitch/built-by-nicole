const { Dialog, Button, Badge, Toast } = window.NSDesignSystem_14b176;
const { SiteHeader, SiteFooter, HomePage, ProgrammesPage, EventsPage, ApplyPage } = window;

function App() {
  const [page, setPage] = React.useState("home");
  const [programme, setProgramme] = React.useState(null);
  const [toast, setToast] = React.useState(null);
  const go = (p) => { setPage(p); window.scrollTo(0, 0); };
  const fireToast = (title, body) => { setToast({ title, body }); window.setTimeout(() => setToast(null), 4200); };

  return (
    <div>
      <SiteHeader page={page} onNavigate={go} />
      {page === "home" ? <HomePage onNavigate={go} onOpen={setProgramme} /> : null}
      {page === "programmes" ? <ProgrammesPage onOpen={setProgramme} onNavigate={go} /> : null}
      {page === "events" ? <EventsPage onToast={fireToast} /> : null}
      {page === "apply" ? <ApplyPage onToast={fireToast} /> : null}
      <SiteFooter onNavigate={go} />

      <Dialog open={Boolean(programme)} title={programme ? programme.name : ""} onClose={() => setProgramme(null)}
        footer={<><Button variant="ghost" onClick={() => setProgramme(null)}>Close</Button><Button onClick={() => { setProgramme(null); go("apply"); }}>Apply for this</Button></>}>
        {programme ? (
          <div style={{display:"flex",flexDirection:"column",gap:16}}>
            <img src={programme.photo} alt="" style={{width:"100%",height:180,objectFit:"cover",borderRadius:"var(--radius-media)"}} />
            <div style={{display:"flex",gap:8}}>
              <Badge tone="accent">{programme.spots}</Badge>
              <Badge tone="outline">{programme.weeks} weeks</Badge>
              <Badge tone="neutral">{programme.price}</Badge>
            </div>
            <p style={{fontSize:16,lineHeight:1.6,color:"var(--text-muted)"}}>{programme.blurb}</p>
          </div>
        ) : null}
      </Dialog>

      {toast ? (
        <div style={{position:"fixed",right:24,bottom:24,zIndex:80}}>
          <Toast tone="success" title={toast.title} onDismiss={() => setToast(null)}>{toast.body}</Toast>
        </div>
      ) : null}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
