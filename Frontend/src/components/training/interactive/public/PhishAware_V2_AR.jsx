/**
 * PhishAware_V2_AR.jsx — Interactive SMS phishing (smishing) awareness lesson (Arabic, public).
 *
 * Self-contained slide-deck style lesson. Progress is managed externally
 * by InteractiveLessonWrapper.
 */
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
  return (
    <div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 28, overflow: "hidden", border: `2px solid ${bc}`, background: C.surface, boxShadow: `0 0 24px ${type === "fake" ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)"}` }}>
      <div style={{ background: bc, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" }}>{label}</div>
      <div style={{ padding: "12px 14px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: "right", direction: "rtl" }}>{sender}</div>
        <div style={{ background: C.bubble, borderRadius: "14px 14px 4px 14px", padding: "14px 16px", direction: "rtl", textAlign: "right", fontSize: 14, lineHeight: 1.75, color: C.text }}>{message}</div>
        <div style={{ textAlign: "right", fontSize: 11, color: C.textDim, marginTop: 4 }}>{time}</div>
      </div>
      {children}
    </div>
  );
}
function RevealFlags({ flags, revealed, onReveal }) {
  if (!revealed) return (<div style={{ padding: "0 14px 14px" }}>
    <button onClick={onReveal} style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.15))", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>🔍 اكتشف العلامات التحذيرية</button>
  </div>);
  return (<div style={{ padding: "0 14px 14px" }}>
    <div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px" }}>
      {flags.map((f, i) => (<FadeIn key={i} delay={i * 200}><div style={{ display: "flex", gap: 8, marginBottom: i < flags.length - 1 ? 6 : 0, fontSize: 12, color: C.text }}><span style={{ color: C.red, flexShrink: 0 }}>✕</span><span>{f}</span></div></FadeIn>))}
    </div>
  </div>);
}
function GreenBlock({ items }) {
  return (<div style={{ background: C.greenBg, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: C.green, marginBottom: 8 }}>✅ ماذا تفعل:</div>
    {items.map((f, i) => (<FadeIn key={i} delay={i * 150}><div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.text }}><span style={{ color: C.green }}>✓</span><span>{f}</span></div></FadeIn>))}
  </div>);
}
function FlagBlock({ flags, type = "red" }) {
  const bg = type === "red" ? C.redBg : C.greenBg;
  const bc = type === "red" ? "rgba(239,68,68,0.3)" : "rgba(16,185,129,0.3)";
  const ic = type === "red" ? C.red : C.green;
  return (<div style={{ background: bg, border: `1px solid ${bc}`, borderRadius: 10, padding: "12px 14px", marginTop: 12 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: ic, marginBottom: 8 }}>{type === "red" ? "⚠️ علامات التحذير:" : "✅ الإجراء الصحيح:"}</div>
    {flags.map((f, i) => (<FadeIn key={i} delay={i * 200}><div style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 12, color: C.text }}><span style={{ color: ic, flexShrink: 0 }}>{type === "red" ? "✕" : "✓"}</span><span>{f}</span></div></FadeIn>))}
  </div>);
}
function ConvoLine({ speaker, text, isScammer, visible = true }) {
  return (<div style={{ opacity: visible ? 1 : 0, transform: visible ? "translateX(0)" : `translateX(${isScammer ? "-20px" : "20px"})`, transition: "all 0.5s cubic-bezier(0.16,1,0.3,1)", marginBottom: 8 }}>
    <div style={{ background: isScammer ? "rgba(239,68,68,0.08)" : C.bubble, borderRadius: 12, padding: "10px 14px", borderLeft: isScammer ? `3px solid ${C.red}` : "none", borderRight: !isScammer ? `3px solid ${C.textDim}` : "none", direction: "rtl", textAlign: "right" }}>
      <div style={{ fontSize: 10, color: isScammer ? C.red : C.textDim, fontWeight: 700, marginBottom: 4 }}>{speaker}</div>
      <div style={{ fontSize: 13, color: isScammer ? C.redLight : C.textMuted, lineHeight: 1.6 }}>{text}</div>
    </div>
  </div>);
}

function Scene0() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => s < 3 ? s+1 : s), 1000); return () => clearInterval(t); }, []);
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #F97316, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📞</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "rtl", marginBottom: 4 }}>الاحتيال الصوتي — لا ترد على كل مكالمة!</h2><p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>دعونا نتعلم كيف نكتشفه</p></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 400, margin: "0 auto" }}>
      {[{"icon":"🏛️","t":"مكالمة من \"وزارة الداخلية\""},{"icon":"🏦","t":"مكالمة من \"البنك\" يطلب تأكيد معلوماتك"},{"icon":"🎁","t":"\"تهانينا! فزت بجائزة!\""}].map((h, i) => (<FadeIn key={i} delay={600+i*400}><div style={{ opacity: step > i ? 1 : 0.3, transition: "all 0.5s", background: step > i ? C.card : "transparent", border: `1px solid ${step > i ? C.border : "transparent"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, direction: "rtl", textAlign: "right" }}><span style={{ fontSize: 24 }}>{h.icon}</span><div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{h.t}</div></div></FadeIn>))}
    </div>
  </div>);
}

function Scene1() {
  const [lines, setLines] = useState(0); const [showF, setShowF] = useState(false);
  const play = () => { setLines(0); setShowF(false); let i=0; const t = setInterval(() => { i++; setLines(i); if(i>=4){clearInterval(t);setTimeout(()=>setShowF(true),600);} }, 1200); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>مكالمة "وزارة الداخلية"</h3></div></FadeIn>
    <div style={{ maxWidth: 440, margin: "0 auto", background: C.card, borderRadius: 16, border: "2px solid rgba(239,68,68,0.3)", overflow: "hidden" }}>
      <div style={{ background: C.red, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>❌ مكالمة احتيال</div>
      <div style={{ padding: "16px", textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>🏛️</div><div style={{ fontSize: 16, fontWeight: 700, color: C.text, direction: "rtl" }}>وزارة الداخلية</div><div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>+966 5XX (spoofed)</div></div>
      <div style={{ padding: "0 16px 16px" }}>
        <ConvoLine speaker="المحتال" text="مرحباً، نحن من وزارة الداخلية" isScammer visible={lines>=1} />
        <ConvoLine speaker="أنت" text="نعم، تفضل" isScammer={false} visible={lines>=2} />
        <ConvoLine speaker="المحتال" text="هناك مخالفة مرورية باسمك، يجب الدفع فوراً" isScammer visible={lines>=3} />
        <ConvoLine speaker="المحتال" text="وإلا سيصدر أمر قبض عليك!" isScammer visible={lines>=4} />
      </div>
      {showF && <div style={{ padding: "0 16px 16px" }}>
        <FlagBlock type="red" flags={["يدعي أنه من جهة حكومية","يهدد بالاعتقال","يطلب الدفع عبر الهاتف","الحكومة لا تتصل لطلب الدفع"]} />
        <FlagBlock type="green" flags={["قل: \"سأتحقق من الموقع الرسمي\" ثم أغلق","تحقق من أبشر للمخالفات","بلّغ عبر كلنا أمن (996)"]} />
      </div>}
    </div>
  </div>);
}

function Scene2() {
  const [lines, setLines] = useState(0); const [showF, setShowF] = useState(false);
  useEffect(() => { let i=0; const t = setInterval(() => { i++; setLines(i); if(i>=5){clearInterval(t);setTimeout(()=>setShowF(true),600);} }, 1000); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>مكالمة "البنك"</h3></div></FadeIn>
    <div style={{ maxWidth: 440, margin: "0 auto", background: C.card, borderRadius: 16, border: "2px solid rgba(239,68,68,0.3)", overflow: "hidden" }}>
      <div style={{ background: C.red, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>❌ مكالمة بنك مزيفة</div>
      <div style={{ padding: "16px", textAlign: "center" }}><div style={{ fontSize: 32, marginBottom: 8 }}>🏦</div><div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>البنك الأهلي السعودي</div></div>
      <div style={{ padding: "0 16px 16px" }}>
        <ConvoLine speaker="المحتال" text="مرحباً، أنا من إدارة الأمن في البنك" isScammer visible={lines>=1} />
        <ConvoLine speaker="المحتال" text="اكتشفنا عملية مشبوهة على حسابك" isScammer visible={lines>=2} />
        <ConvoLine speaker="المحتال" text="نحتاج رقم البطاقة و CVV للتحقق" isScammer visible={lines>=3} />
        <ConvoLine speaker="⛔" text="لا تعطي أي معلومات!" isScammer={false} visible={lines>=4} />
      </div>
      {showF && <div style={{ padding: "0 16px 16px" }}>
        <FlagBlock type="red" flags={["البنوك لا تطلب CVV عبر الهاتف أبداً","يستعجلك بـ \"نشاط مشبوه\"","البنوك تستخدم تطبيقاتها للتواصل"]} />
        <FlagBlock type="green" flags={["أغلق المكالمة فوراً","اتصل بالرقم خلف البطاقة","استخدم تطبيق البنك الرسمي"]} />
      </div>}
    </div>
  </div>);
}

function Scene3() {
  const [stage, setStage] = useState(0);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>"مبروك، فزت!"</h3></div></FadeIn>
    <div style={{ maxWidth: 420, margin: "0 auto" }}>
      {stage === 0 && <FadeIn><div style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.1), rgba(249,115,22,0.1))", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 16, padding: "30px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: C.yellow, direction: "rtl" }}>تهانينا! فزت بجائزة 100,000 ريال!</div>
        <button onClick={() => setStage(1)} style={{ marginTop: 20, background: "#F97316", border: "none", color: "#fff", padding: "12px 28px", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>انتظر... هل هذا حقيقي؟ 🤔</button>
      </div></FadeIn>}
      {stage === 1 && <FadeIn><div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 16, padding: "24px 20px" }}>
        <div style={{ fontSize: 36, textAlign: "center", marginBottom: 12 }}>🚨</div>
        <FlagBlock type="red" flags={["\"ادفع 500 ريال رسوم استلام\"","\"أعطنا معلومات حسابك لتحويل المبلغ\"","لم تشترك في أي سحب!","الجوائز الحقيقية لا تطلب رسوم"]} />
        <button onClick={() => setStage(0)} style={{ marginTop: 12, width: "100%", background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>↻ إعادة</button>
      </div></FadeIn>}
    </div>
    <FadeIn delay={200}><div style={{ marginTop: 16, padding: "14px", borderRadius: 12, background: C.yellowBg, border: "1px solid rgba(245,158,11,0.25)", textAlign: "center", maxWidth: 420, margin: "16px auto 0" }}>
      <span style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>💡 إذا لم تشترك، لم تفز!</span>
    </div></FadeIn>
  </div>);
}

function Scene4() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"📵","label":"لا تثق بكل مكالمة","detail":"هوية المتصل يمكن تزويرها"},{"icon":"🔒","label":"لا تعطي معلومات شخصية","detail":"رقم البطاقة، CVV، نفاذ، كلمة المرور"},{"icon":"📞","label":"أغلق واتصل بالرقم الرسمي","detail":"تحقق بنفسك من الجهة الرسمية"},{"icon":"⏰","label":"احذر الاستعجال والضغط","detail":"المحتالون يستعجلونك لمنعك من التفكير"},{"icon":"🔍","label":"ابحث عن الأرقام المجهولة","detail":"ابحث في جوجل قبل الرد"},{"icon":"📢","label":"بلّغ عن الاحتيال","detail":"عبر تطبيق كلنا أمن (996)"}];
  return (
    <div>
      <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
        <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>كيف تحمي نفسك من الاحتيال الصوتي؟</h3>
        <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>6 قواعد — انقر للتفاصيل</p>
      </div></FadeIn>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520, margin: "0 auto" }}>
        {tips.map((t, i) => (<FadeIn key={i} delay={i * 120}><div onClick={() => setExp(exp === i ? null : i)} style={{ background: exp === i ? C.blueGlow : C.card, border: `1px solid ${exp === i ? C.blue + "50" : C.border}`, borderRadius: 14, padding: "16px", cursor: "pointer", transition: "all 0.3s" }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.text, direction: "rtl", lineHeight: 1.4 }}>{t.label}</div>
          {exp === i && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}`, fontSize: 11, color: C.blue }}>{t.detail}</div>}
        </div></FadeIn>))}
      </div>
    </div>
  );
}

function Scene5({ onComplete = () => {} }) {
  const [cq, setCq] = useState(0); const [sel, setSel] = useState(null); const [score, setScore] = useState(0); const [done, setDone] = useState(false);
  const qs =[{"t":"شخص يتصل من \"وزارة الداخلية\" عن مخالفة — ماذا تفعل؟","opts":[{"text":"أدفع فوراً","c":false,"ex":"الحكومة لا تطلب الدفع عبر الهاتف!"},{"text":"أغلق وأتحقق من أبشر","c":true,"ex":"صحيح!"}]},{"t":"البنك يطلب رقم CVV عبر الهاتف — طبيعي؟","opts":[{"text":"نعم للتحقق","c":false,"ex":"البنوك لا تطلب CVV أبداً عبر الهاتف!"},{"text":"لا، هذا احتيال","c":true,"ex":"صحيح!"}]},{"t":"\"فزت بـ 100,000! ادفع 500 رسوم\" — ما رأيك؟","opts":[{"text":"احتيال — لم أشترك","c":true,"ex":"صحيح! الجوائز الحقيقية لا تطلب رسوم."},{"text":"ممكن حقيقي","c":false,"ex":"إذا لم تشترك، لم تفز!"}]},{"t":"هل يمكن تزوير هوية المتصل؟","opts":[{"text":"لا، دائماً دقيق","c":false,"ex":"يمكن تزوير Caller ID بسهولة!"},{"text":"نعم، يمكن تزويره","c":true,"ex":"صحيح!"}]}];
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
      <h3 style={{ fontSize: 18, fontWeight: 700, color: pct >= 75 ? C.green : C.yellow, marginBottom: 20 }}>{pct >= 75 ? "ممتاز! أنت محمي 🛡️" : "راجع الدروس وحاول مجدداً 📚"}</h3>
      <button onClick={() => { setCq(0); setSel(null); setScore(0); setDone(false); }} style={{ background: C.blue, color: "#fff", border: "none", padding: "12px 32px", borderRadius: 24, fontSize: 14, fontWeight: 600, cursor: "pointer" }}>↻ أعد المحاولة</button>
    </FadeIn></div>);
  }
  const q = qs[cq];
  return (
    <div>
      <FadeIn><div style={{ textAlign: "center", marginBottom: 6 }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text, direction: "rtl" }}>🧪 اختبر معلوماتك!</h3><p style={{ fontSize: 12, color: C.textMuted }}>سؤال {cq + 1} / {qs.length}</p></div></FadeIn>
      <div style={{ display: "flex", gap: 4, marginBottom: 20, justifyContent: "center" }}>{qs.map((_, i) => (<div key={i} style={{ width: i === cq ? 28 : 10, height: 4, borderRadius: 2, background: i < cq ? C.green : i === cq ? C.blue : C.border, transition: "all 0.3s" }} />))}</div>
      <FadeIn key={cq}><div style={{ background: C.card, borderRadius: 16, padding: "24px 20px", maxWidth: 480, margin: "0 auto", border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.text, direction: "rtl", textAlign: "center", marginBottom: 20, lineHeight: 1.6 }}>{q.t}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {q.opts.map((opt, oi) => {
            const isSel = sel === oi; const showR = sel !== null;
            let bg = C.surface; let bc = C.border;
            if (showR && opt.c) { bg = C.greenBg; bc = C.green; } else if (isSel && !opt.c) { bg = C.redBg; bc = C.red; }
            return (<button key={oi} onClick={() => handleSel(oi)} style={{ background: bg, border: `2px solid ${bc}`, borderRadius: 12, padding: "14px 18px", cursor: sel === null ? "pointer" : "default", textAlign: "right", direction: "rtl", transition: "all 0.3s" }}>
              <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{opt.text}</div>
              {showR && (isSel || opt.c) && <div style={{ fontSize: 11, marginTop: 8, color: opt.c ? C.green : C.red }}>{opt.c ? "✅ " : "❌ "}{opt.ex}</div>}
            </button>);
          })}
        </div>
        {sel !== null && <div style={{ textAlign: "center", marginTop: 16 }}><button onClick={handleNext} style={{ background: C.blue, color: "#fff", border: "none", padding: "10px 28px", borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{cq < qs.length - 1 ? "التالي →" : "النتائج"}</button></div>}
      </div></FadeIn>
    </div>
  );
}

export default function PhishAwareV2_AR({
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
  const sc =["المقدمة","مكالمة حكومية","مكالمة البنك","جائزة مزيفة","نصائح","اختبار"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, ${isDark ? "#111827" : "#EFF6FF"}, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #F97316, #EF4444)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📞</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>الفيديو 2 — تدريب تفاعلي</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>الاحتيال الصوتي</div>
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