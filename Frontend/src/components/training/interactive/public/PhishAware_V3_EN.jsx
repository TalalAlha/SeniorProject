import { useState, useEffect } from "react";
import { useTheme } from "../../../../contexts/ThemeContext";

const LIGHT = {
  bg: "#F9FAFB", surface: "#FFFFFF", card: "#FFFFFF",
  blue: "#3B82F6", blueGlow: "rgba(59,130,246,0.08)",
  red: "#EF4444", redBg: "#FEF2F2", redBorder: "rgba(239,68,68,0.3)",
  green: "#10B981", greenBg: "#ECFDF5", greenBorder: "rgba(16,185,129,0.3)",
  yellow: "#F59E0B", yellowBg: "#FFFBEB",
  text: "#1F2937", textMuted: "#6B7280", textDim: "#9CA3AF", border: "#E5E7EB", bubble: "#F3F4F6", bubbleAlt: "#E5E7EB", redLight: "#DC2626",
};
const DARK = {
  bg: "#111827", surface: "#1F2937", card: "#1F2937",
  blue: "#60A5FA", blueGlow: "rgba(96,165,250,0.12)",
  red: "#F87171", redBg: "rgba(127,29,29,0.3)", redBorder: "rgba(248,113,113,0.3)",
  green: "#34D399", greenBg: "rgba(6,78,59,0.3)", greenBorder: "rgba(52,211,153,0.3)",
  yellow: "#FBBF24", yellowBg: "rgba(120,53,15,0.3)",
  text: "#F9FAFB", textMuted: "#D1D5DB", textDim: "#9CA3AF", border: "#374151", bubble: "#1E293B", bubbleAlt: "#111827", redLight: "#FCA5A5",
};
let C = LIGHT;

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
  return (<div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 28, overflow: "hidden", border: `2px solid ${bc}`, background: C.surface }}>
    <div style={{ background: bc, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" }}>{label}</div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: "left", direction: "ltr" }}>{sender}</div>
      <div style={{ background: C.bubble, borderRadius: "14px 14px 4px 14px", padding: "14px 16px", direction: "ltr", textAlign: "left", fontSize: 14, lineHeight: 1.75, color: C.text }}>{message}</div>
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
    <div style={{ background: isScammer ? "rgba(239,68,68,0.08)" : C.bubble, borderRadius: 12, padding: "10px 14px", borderLeft: isScammer ? `3px solid ${C.red}` : "none", borderRight: !isScammer ? `3px solid ${C.textDim}` : "none", direction: "ltr", textAlign: "left" }}>
      <div style={{ fontSize: 10, color: isScammer ? C.red : C.textDim, fontWeight: 700, marginBottom: 4 }}>{speaker}</div>
      <div style={{ fontSize: 13, color: isScammer ? C.redLight : C.textMuted, lineHeight: 1.6 }}>{text}</div>
    </div>
  </div>);
}

function Scene0() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => s < 3 ? s + 1 : s), 1000); return () => clearTimeout(t); }, []);
  const hooks = [{"icon":"📦","t":"\"Your shipment is held, click to update\""},{"icon":"⚡","t":"\"Electricity bill overdue, pay or disconnect\""},{"icon":"🔑","t":"\"Nafath code: 123456 — valid 2 min\""}];
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>💬</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "ltr", marginBottom: 4 }}>SMS Phishing (Smishing) — How to Detect It?</h2>
    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>Which of these messages is real?</p></FadeIn>
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
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Fake Package Delivery SMS</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Click to reveal red flags</p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ FAKE" type="fake" sender="SMSA" time="9:45 AM"
        message={<>Your shipment SA1234567 is held<br/>Reason: Incomplete address<br/>Update: <span style={{color:C.red,textDecoration:"underline"}}>smsa-sa.net/track</span><br/>Within 24 hours</>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["Suspicious .net domain","24-hour urgency","You didn't order anything!","Shipping companies use their apps"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["Use official SMSA app","Track with tracking number","Call customer service","Delete suspicious SMS"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene2() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>Fake Electricity Bill (SEC)</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}></p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ FAKE" type="fake" sender="Saudi Electricity (SEC)" time="11:20 AM"
        message={<>Your bill: 1,250 SAR<br/><span style={{color:C.red,fontWeight:700}}>Disconnection in 24 hours!</span><br/>Pay: <span style={{color:C.red,textDecoration:"underline"}}>sec-pay.com/bill</span></>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["Threatens disconnection","Suspicious payment link","sec-pay.com is NOT official","No meter number mentioned"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["Use official SEC app","Check bill in the app","Pay via official channels only","SEC doesn't disconnect without notice"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene3() {
  const [step, setStep] = useState(-1);
  const steps = [{"icon":"🕵️","title":"Scammer enters your #","desc":"On a government website","color":"#EF4444"},{"icon":"📲","title":"Real code arrives","desc":"You didn't request it!","color":"#F59E0B"},{"icon":"📞","title":"Scammer calls","desc":"'What's the code?'","color":"#EF4444"},{"icon":"🗣️","title":"You share it","desc":"Scammer enters your code","color":"#EF4444"},{"icon":"💀","title":"HACKED!","desc":"Full access","color":"#DC2626"}];
  const play = () => { setStep(-1); steps.forEach((_, i) => setTimeout(() => setStep(i), 800 + i * 900)); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>How OTP Theft Works</h3></div></FadeIn>
    <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", left: 24, top: 20, bottom: 20, width: 2, background: C.border }} />
      {steps.map((s, i) => (<div key={i} style={{ display: "flex", gap: 16, marginBottom: 12, position: "relative", zIndex: 1, opacity: step >= i ? 1 : 0.15, transform: step >= i ? "translateX(0)" : "translateX(-10px)", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: step >= i ? C.card : C.bubbleAlt, border: `2px solid ${step >= i ? s.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: step === i ? `0 0 20px ${s.color}40` : "none" }}>{s.icon}</div>
        <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${step === i ? s.color + "60" : C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.desc}</div>
        </div>
      </div>))}
    </div>
    <FadeIn delay={5000}><div style={{ marginTop: 20, padding: "16px", borderRadius: 12, textAlign: "center", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)" }}>
      <div style={{ color: C.redLight, fontWeight: 700, fontSize: 15, direction: "ltr" }}>🚨 Your Nafath code = Key to your digital life — NEVER share!</div>
    </div></FadeIn>
    <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={play} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↻ Replay</button></div>
  </div>);
}
function Scene4() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"🔗","label":"Never click SMS links","detail":"Go to official app directly"},{"icon":"🔍","label":"Check URL before clicking","detail":"Does it end in .sa or .gov.sa?"},{"icon":"⚠️","label":"Beware shortened links","detail":"bit.ly may hide malicious URLs"},{"icon":"🔐","label":"Never share Nafath/OTP","detail":"With anyone by any method"},{"icon":"🗑️","label":"Delete suspicious messages","detail":"Don't save the links"},{"icon":"📢","label":"Report fraud","detail":"Via Kulluna Amn (996)"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "ltr" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>SMS Protection Rules</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>6 Rules — Click to expand</p>
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
  const qs = [{"t":"SMSA SMS with smsa-sa.net link — real?","opts":[{"text":"Yes","c":false,"ex":"smsa-sa.net is NOT official!"},{"text":"No, it's fake","c":true,"ex":"Correct!"}]},{"t":"Electricity bill threatens 24hr disconnection?","opts":[{"text":"Pay immediately","c":false,"ex":"SEC doesn't disconnect without notice!"},{"text":"Check SEC app","c":true,"ex":"Correct!"}]},{"t":"Unrequested Nafath code — what does it mean?","opts":[{"text":"Technical error","c":false,"ex":"Someone is hacking your account!"},{"text":"Hacking attempt!","c":true,"ex":"Correct!"}]},{"t":"bit.ly link from official source — safe?","opts":[{"text":"Yes","c":false,"ex":"Shortened links can hide malicious URLs!"},{"text":"No, dangerous","c":true,"ex":"Correct!"}]}];
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
export default function PhishAwareV3_EN({
  initialScene = 0,
  onSceneChange = () => {},
  onComplete = () => {}
}) {
  const { isDark } = useTheme();
  C = isDark ? DARK : LIGHT;
  const [a, setA] = useState(initialScene);
  useEffect(() => {
    const totalScenes = 6;
    onSceneChange(a, totalScenes);
  }, [a, onSceneChange]);
  const sc =["Intro","Package Scam","Electricity","OTP Theft","Tips","Quiz"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, ${isDark ? "#111827" : "#EFF6FF"}, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>💬</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>Video 3 — Interactive Training</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>Smishing</div>
          </div>
          <Nav scenes={sc} active={a} onSelect={setA} />
        </div>
      </div>
      <div style={{ maxWidth: 700, margin: "0 auto", padding: "24px 16px 32px", flex: 1 }}>{co[a]}</div>
      <div style={{ position: "sticky", bottom: 0, background: C.surface, borderTop: `1px solid ${C.border}`, padding: "14px 20px", zIndex: 10 }}>
        <div style={{ maxWidth: 700, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button onClick={() => setA(Math.max(0, a - 1))} disabled={a === 0} style={{ background: C.card, border: `1px solid ${C.border}`, color: a === 0 ? C.textDim : C.text, padding: "10px 24px", borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: a === 0 ? "default" : "pointer", opacity: a === 0 ? 0.4 : 1 }}>←</button>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textMuted, background: C.card, padding: "4px 14px", borderRadius: 12, border: `1px solid ${C.border}` }}>{a + 1}/{sc.length}</div>
          <button onClick={() => setA(Math.min(sc.length - 1, a + 1))} disabled={a === sc.length - 1} style={{ background: a === sc.length - 1 ? C.card : C.blue, border: "none", color: "#fff", padding: "10px 24px", borderRadius: 24, fontSize: 13, fontWeight: 600, cursor: a === sc.length - 1 ? "default" : "pointer", opacity: a === sc.length - 1 ? 0.4 : 1 }}>→</button>
        </div>
      </div>
    </div>
  );
}