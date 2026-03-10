import { useState, useEffect } from "react";

const C = {
  bg: "#0B1120", surface: "#131B2E", card: "#1A2340",
  blue: "#3B82F6", blueGlow: "rgba(59,130,246,0.15)",
  red: "#EF4444", redBg: "rgba(239,68,68,0.08)", redBorder: "rgba(239,68,68,0.3)",
  green: "#10B981", greenBg: "rgba(16,185,129,0.08)", greenBorder: "rgba(16,185,129,0.3)",
  yellow: "#F59E0B", yellowBg: "rgba(245,158,11,0.08)",
  text: "#E2E8F0", textMuted: "#94A3B8", textDim: "#64748B", border: "#1E293B",
};

function FadeIn({ children, delay = 0 }) {
  const [v, setV] = useState(false);
  useEffect(() => { const t = setTimeout(() => setV(true), delay); return () => clearTimeout(t); }, [delay]);
  return <div style={{ opacity: v ? 1 : 0, transform: v ? "translateY(0)" : "translateY(16px)", transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)" }}>{children}</div>;
}
function Nav({ scenes, active, onSelect }) {
  return (<div style={{ display: "flex", gap: 4, overflowX: "auto", scrollbarWidth: "none" }}>
    {scenes.map((s, i) => (<button key={i} onClick={() => onSelect(i)} style={{ padding: "8px 14px", borderRadius: 20, border: "none", background: i === active ? C.blue : C.card, color: i === active ? "#fff" : C.textMuted, fontSize: 11, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.25s" }}>{s}</button>))}
  </div>);
}
function PhoneSMS({ label, type, sender, message, time, children }) {
  const bc = type === "fake" ? C.red : C.green;
  return (<div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 28, overflow: "hidden", border: `2px solid ${bc}`, background: "#0F172A" }}>
    <div style={{ background: bc, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" }}>{label}</div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: "left", direction: "ltr" }}>{sender}</div>
      <div style={{ background: "#1E293B", borderRadius: "14px 14px 4px 14px", padding: "14px 16px", direction: "ltr", textAlign: "left", fontSize: 14, lineHeight: 1.75, color: C.text }}>{message}</div>
      <div style={{ textAlign: "right", fontSize: 11, color: C.textDim, marginTop: 4 }}>{time}</div>
    </div>
    {children}
  </div>);
}
function RevealFlags({ flags, revealed, onReveal }) {
  if (!revealed) return (<div style={{ padding: "0 14px 14px" }}><button onClick={onReveal} style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.15))", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>🔍 Click to reveal red flags</button></div>);
  return (<div style={{ padding: "0 14px 14px" }}><div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px" }}>
    {flags.map((f, i) => (<FadeIn key={i} delay={i * 200}><div style={{ display: "flex", gap: 8, marginBottom: i < flags.length - 1 ? 6 : 0, fontSize: 12, color: C.text }}><span style={{ color: C.red, flexShrink: 0 }}>✕</span><span>{f}</span></div></FadeIn>))}
  </div></div>);
}
function GreenBlock({ items }) {
  return (<div style={{ background: C.greenBg, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 8 }}>✅ WHAT TO DO:</div>
    {items.map((f, i) => (<FadeIn key={i} delay={i * 150}><div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.text }}><span style={{ color: C.green }}>✓</span><span>{f}</span></div></FadeIn>))}
  </div>);
}
function FlagBlock({ flags, type = "red" }) {
  const bg = type === "red" ? C.redBg : C.greenBg;
  const bc = type === "red" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)";
  const ic = type === "red" ? C.red : C.green;
  return (<div style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: ic, marginBottom: 8 }}>{type === "red" ? "⚠️ RED FLAGS:" : "✅ CORRECT ACTION:"}</div>
    {flags.map((f, i) => (<FadeIn key={i} delay={i * 200}><div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.text }}><span style={{ color: ic, flexShrink: 0 }}>{type === "red" ? "✕" : "✓"}</span><span>{f}</span></div></FadeIn>))}
  </div>);
}
function ConvoLine({ speaker, text, isScammer, visible = true }) {
  return (<div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : `translateX(${isScammer ? "-20px" : "20px"})`, transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)", marginBottom: 8 }}>
    <div style={{ background: isScammer ? "rgba(239,68,68,0.08)" : "#1E293B", borderRadius: 12, padding: "10px 14px", borderLeft: isScammer ? `3px solid ${C.red}` : "none", borderRight: !isScammer ? `3px solid ${C.textDim}` : "none", direction: "ltr", textAlign: "left" }}>
      <div style={{ fontSize: 10, color: isScammer ? C.red : C.textDim, fontWeight: 700, marginBottom: 4 }}>{speaker}</div>
      <div style={{ fontSize: 13, color: isScammer ? "#FCA5A5" : C.textMuted, lineHeight: 1.6 }}>{text}</div>
    </div>
  </div>);
}

function Scene0() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => s < 3 ? s + 1 : s), 1000); return () => clearTimeout(t); }, []);
  const hooks = [{"icon":"💰","t":"'Your salary is suspended, update details'"},{"icon":"💻","t":"'Your Office 365 will expire'"},{"icon":"🔐","t":"'Urgent VPN update required'"}];
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #6366F1, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📨</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "ltr", marginBottom: 4 }}>Employee Smishing — Work-Targeted SMS Scams</h2>
    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Smart SMS scams targeting employees</p></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      {hooks.map((h, i) => (<FadeIn key={i} delay={600 + i * 400}><div style={{ opacity: step > i ? 1 : 0.3, transition: "all 0.5s", background: step > i ? C.card : "transparent", border: `1px solid ${step > i ? C.border : "transparent"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, direction: "ltr", textAlign: "left" }}>
        <span style={{ fontSize: 24 }}>{h.icon}</span>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{h.t}</div>
      </div></FadeIn>))}
    </div>
  </div>);
}
function Scene1() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Payroll/Salary Scam</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}></p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ FAKE" type="fake" sender="HR - [Company]" time="8:30 AM"
        message={<>Alert: Your salary is suspended due to data error<br/>To update payroll info:<br/>Click: <span style={{color:C.red,textDecoration:"underline"}}>hr-company-update.com/payroll</span><br/>Within 24 hours</>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["External link, not company portal","24-hour urgency","No employee full name","HR doesn't send payroll links via SMS"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["Contact HR directly","Use official employee portal","Salary ≠ clicking SMS links","Report to IT"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene2() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Office 365 Scam</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}></p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ FAKE" type="fake" sender="Microsoft 365" time="3:45 PM"
        message={<>Your Office 365 account expires in 48 hours<br/>To renew your account:<br/>Click: <span style={{color:C.red,textDecoration:"underline"}}>ms365-renew.com/business</span><br/>Enter your login credentials</>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["Not from microsoft.com","Asks for login credentials","48-hour expiration threat","O365 managed by IT, not SMS"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["Contact your IT department","Go to portal.office.com directly","O365 doesn't expire via SMS","Never enter creds from SMS links"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene3() {
  const [active, setActive] = useState(null);
  const scams = [{"icon":"🔐","title":"Fake VPN Update","fake":"'Network breached — update VPN: company-vpn-update.com'","truth":"VPN updates come from IT internally"},{"icon":"📅","title":"Fake Meeting Invite","fake":"'CEO invited you to urgent meeting: teams-meeting-join.com'","truth":"Teams invites come through the app, not SMS"},{"icon":"📚","title":"Fake Compliance Training","fake":"'Mandatory training in 24hr: company-training.net'","truth":"Training comes via company email or LMS"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Business-Specific Scams</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Click each to explore</p>
    </div></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 480, margin: "0 auto" }}>
      {scams.map((s, i) => (<FadeIn key={i} delay={i * 200}>
        <div onClick={() => setActive(active === i ? null : i)} style={{ background: active === i ? C.card : C.surface, border: `1px solid ${active === i ? "rgba(239,68,68,0.3)" : C.border}`, borderRadius: 14, padding: "16px 18px", cursor: "pointer", transition: "all 0.3s" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: C.redBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{s.title}</div></div>
            <span style={{ color: C.textDim, transition: "transform 0.3s", transform: active === i ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
          </div>
          {active === i && (<div style={{ marginTop: 12 }}>
            <div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px", marginBottom: 8, direction: "ltr", textAlign: "left" }}>
              <div style={{ fontSize: 10, color: C.red, fontWeight: 700, marginBottom: 4 }}>❌ FAKE SMS:</div>
              <div style={{ fontSize: 13, color: "#FCA5A5" }}>{s.fake}</div>
            </div>
            <div style={{ background: C.greenBg, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px" }}>
              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 4 }}>✅ THE TRUTH:</div>
              <div style={{ fontSize: 12, color: C.text }}>{s.truth}</div>
            </div>
          </div>)}
        </div>
      </FadeIn>))}
    </div>
    <FadeIn delay={800}><div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: C.yellowBg, border: "1px solid rgba(245,158,11,0.25)", textAlign: "center", maxWidth: 480, margin: "20px auto 0" }}>
      <span style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>💡 Rule: Any SMS with a link claiming to be from your company = SUSPICIOUS!</span>
    </div></FadeIn>
  </div>);
}
function Scene4() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"📧","label":"Company uses email/portal","detail":"Not SMS links"},{"icon":"🔐","label":"No work creds in SMS links","detail":"Only official portal"},{"icon":"🔍","label":"Salary/IT/meeting SMS? Verify!","detail":"Contact the department directly"},{"icon":"📢","label":"Report to IT immediately","detail":"Help protect your colleagues"},{"icon":"🌐","label":"Open portal directly","detail":"Type the URL — never click SMS"},{"icon":"🚨","label":"Urgent+Link+SMS = SCAM!","detail":"The formula for employee smishing"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Employee Smishing Protection</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>6 Rules</p>
    </div></FadeIn>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520, margin: "0 auto" }}>
      {tips.map((t, i) => (<FadeIn key={i} delay={i * 120}><div onClick={() => setExp(exp === i ? null : i)} style={{ background: exp === i ? C.blueGlow : C.card, border: `1px solid ${exp === i ? C.blue + "50" : C.border}`, borderRadius: 14, padding: "16px", cursor: "pointer", transition: "all 0.3s" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, direction: "ltr", lineHeight: 1.4 }}>{t.label}</div>
        {exp === i && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.blue }}>{t.detail}</div>}
      </div></FadeIn>))}
    </div>
  </div>);
}
function Scene5({ onComplete = () => {} }) {
  const [cq, setCq] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const qs = [{"t":"'Salary suspended, update via hr-company.com' — what to do?","opts":[{"text":"Update immediately","c":false,"ex":"HR never sends payroll links via SMS!"},{"text":"Call HR directly","c":true,"ex":"Correct!"}]},{"t":"'O365 expiring' via SMS — real?","opts":[{"text":"Maybe","c":false,"ex":"O365 managed by IT, not SMS!"},{"text":"Fake","c":true,"ex":"Correct!"}]},{"t":"'VPN update: company-vpn.com' — download?","opts":[{"text":"Yes","c":false,"ex":"VPN updates come from IT internally!"},{"text":"No — call IT to verify","c":true,"ex":"Correct!"}]},{"t":"Golden rule for work SMS?","opts":[{"text":"SMS + link + work = suspicious!","c":true,"ex":"Correct!"},{"text":"Some links could be real","c":false,"ex":"Companies use official channels only!"}]}];
  const [answers, setAnswers] = useState({});
  const handleSel = (oi) => { if (sel !== null) return; setSel(oi); const isCorrect = qs[cq].opts[oi].c; if (isCorrect) setScore(s => s + 1); setAnswers(prev => ({ ...prev, [cq]: { selected: oi, correct: isCorrect } })); };
  const handleNext = () => { if (cq < qs.length - 1) { setCq(c => c + 1); setSel(null); } else setDone(true); };
  useEffect(() => {
    if (done) {
      onComplete({ score, total: qs.length, answers, total_scenes: 6 });
    }
  }, [done, score, answers, onComplete]);
  if (done) {
    const pct = Math.round((score / qs.length) * 100);
    return (<div style={{ textAlign: "center", padding: "30px 0" }}><FadeIn>
      <div style={{ fontSize: 48, marginBottom: 16 }}>{pct >= 75 ? "🛡️" : "📚"}</div>
      <div style={{ fontSize: 36, fontWeight: 800, color: pct >= 75 ? C.green : C.yellow }}>{pct}%</div>
      <div style={{ fontSize: 12, color: C.textDim, marginBottom: 6 }}>{score}/{qs.length}</div>
      <h3 style={{ fontSize: 18, fontWeight: 700, color: pct >= 75 ? C.green : C.yellow, marginBottom: 20 }}>{pct >= 75 ? "Excellent! You are protected 🛡️" : "Review the lessons and try again 📚"}</h3>
      <button onClick={() => { setCq(0); setSel(null); setScore(0); setDone(false); }} style={{ background: C.blue, color: "#fff", border: "none", padding: "12px 32px", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ Try Again</button>
    </FadeIn></div>);
  }
  const q = qs[cq];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 6 }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, direction: "ltr" }}>🧪 Test Your Knowledge!</h3><p style={{ fontSize: 12, color: C.textMuted }}>Question {cq + 1} / {qs.length}</p></div></FadeIn>
    <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center" }}>{qs.map((_, i) => (<div key={i} style={{ width: i === cq ? 28 : 10, height: 4, borderRadius: 2, background: i < cq ? C.green : i === cq ? C.blue : C.border, transition: "all 0.3s" }} />))}</div>
    <FadeIn key={cq}><div style={{ background: C.card, borderRadius: 16, padding: "24px 20px", maxWidth: 480, margin: "0 auto", border: `1px solid ${C.border}` }}>
      <div style={{ fontSize: 15, fontWeight: 700, color: C.text, direction: "ltr", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>{q.t}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {q.opts.map((opt, oi) => {
          const isSel = sel === oi; const showR = sel !== null;
          let bg = C.surface; let bc = C.border;
          if (showR && opt.c) { bg = C.greenBg; bc = C.green; } else if (isSel && !opt.c) { bg = C.redBg; bc = C.red; }
          return (<button key={oi} onClick={() => handleSel(oi)} style={{ background: bg, border: `2px solid ${bc}`, borderRadius: 12, padding: "14px 18px", cursor: sel === null ? "pointer" : "default", textAlign: "left", direction: "ltr", transition: "all 0.3s" }}>
            <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{opt.text}</div>
            {showR && (isSel || opt.c) && <div style={{ fontSize: 11, marginTop: 8, color: opt.c ? C.green : C.red }}>{opt.c ? "✅ " : "❌ "}{opt.ex}</div>}
          </button>);
        })}
      </div>
      {sel !== null && <div style={{ textAlign: "center", marginTop: 16 }}><button onClick={handleNext} style={{ background: C.blue, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{cq < qs.length - 1 ? "→ Next" : "Results"}</button></div>}
    </div></FadeIn>
  </div>);
}
export default function PhishAwareV6_EN({
  initialScene = 0,
  onSceneChange = () => {},
  onComplete = () => {}
}) {
  const [a, setA] = useState(initialScene);
  useEffect(() => {
    const totalScenes = 6;
    onSceneChange(a, totalScenes);
  }, [a, onSceneChange]);
  const sc =["Intro","Payroll Scam","O365 Scam","Business Scams","Tips","Quiz"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, #0F1729, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366F1, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📨</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>Video 6 — Employee Training</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>Employee Smishing</div>
          </div>
          <Nav scenes={sc} active={a} onSelect={setA} />
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 60px" }}>{co[a]}</div>
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: `${C.bg}F0`, backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, padding: "10px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setA(Math.max(0, a - 1))} disabled={a === 0} style={{ background: C.card, border: `1px solid ${C.border}`, color: a === 0 ? C.textDim : C.text, padding: "8px 20px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: a === 0 ? "default" : "pointer", opacity: a === 0 ? 0.4 : 1 }}>←</button>
          <div style={{ fontSize: 11, color: C.textDim }}>{a + 1}/{sc.length}</div>
          <button onClick={() => setA(Math.min(sc.length - 1, a + 1))} disabled={a === sc.length - 1} style={{ background: a === sc.length - 1 ? C.card : C.blue, border: "none", color: "#fff", padding: "8px 20px", borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: a === sc.length - 1 ? "default" : "pointer", opacity: a === sc.length - 1 ? 0.4 : 1 }}>→</button>
        </div>
      </div>
    </div>
  );
}