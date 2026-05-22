/**
 * PhishAware_V6_AR.jsx — Interactive voice phishing (vishing) remediation training lesson (Arabic, employee).
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
  return (<div style={{ maxWidth: 340, margin: "0 auto", borderRadius: 28, overflow: "hidden", border: `2px solid ${bc}`, background: C.surface }}>
    <div style={{ background: bc, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, letterSpacing: 1.5, color: "#fff", textTransform: "uppercase" }}>{label}</div>
    <div style={{ padding: "12px 14px" }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: "right", direction: "rtl" }}>{sender}</div>
      <div style={{ background: C.bubble, borderRadius: "14px 14px 4px 14px", padding: "14px 16px", direction: "rtl", textAlign: "right", fontSize: 14, lineHeight: 1.75, color: C.text }}>{message}</div>
      <div style={{ textAlign: "right", fontSize: 11, color: C.textDim, marginTop: 4 }}>{time}</div>
    </div>
    {children}
  </div>);
}
function RevealFlags({ flags, revealed, onReveal }) {
  if (!revealed) return (<div style={{ padding: "0 14px 14px" }}><button onClick={onReveal} style={{ width: "100%", padding: "10px 16px", background: "linear-gradient(135deg, rgba(239,68,68,0.08), rgba(239,68,68,0.15))", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, cursor: "pointer", color: C.red, fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>🔍 اكتشف العلامات التحذيرية</button></div>);
  return (<div style={{ padding: "0 14px 14px" }}><div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "10px 14px" }}>
    {flags.map((f, i) => (<FadeIn key={i} delay={i * 200}><div style={{ display: "flex", gap: 8, marginBottom: i < flags.length - 1 ? 6 : 0, fontSize: 12, color: C.text }}><span style={{ color: C.red, flexShrink: 0 }}>✕</span><span>{f}</span></div></FadeIn>))}
  </div></div>);
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
  useEffect(() => { const t = setInterval(() => setStep(s => s < 3 ? s + 1 : s), 1000); return () => clearInterval(t); }, []);
  const hooks = [{"icon":"💰","t":"\"راتبك معلق، حدّث بياناتك\""},{"icon":"💻","t":"\"حسابك Office 365 سينتهي\""},{"icon":"🔐","t":"\"تحديث VPN فوري مطلوب\""}];
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #6366F1, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>📨</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "rtl", marginBottom: 4 }}>الاحتيال عبر الرسائل في بيئة العمل</h2>
    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>رسائل تستهدف الموظفين بذكاء</p></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      {hooks.map((h, i) => (<FadeIn key={i} delay={600 + i * 400}><div style={{ opacity: step > i ? 1 : 0.3, transition: "all 0.5s", background: step > i ? C.card : "transparent", border: `1px solid ${step > i ? C.border : "transparent"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, direction: "rtl", textAlign: "right" }}>
        <span style={{ fontSize: 24 }}>{h.icon}</span>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{h.t}</div>
      </div></FadeIn>))}
    </div>
  </div>);
}
function Scene1() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>احتيال الرواتب</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}></p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ مزيف" type="fake" sender="الموارد البشرية - [الشركة]" time="8:30 AM"
        message={<>تنبيه: تم تعليق راتبك بسبب خطأ في بياناتك<br/>لتحديث معلومات الراتب:<br/>انقر: <span style={{color:C.red,textDecoration:"underline"}}>hr-company-update.com/payroll</span><br/>خلال 24 ساعة</>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["رابط خارجي وليس بوابة الشركة","استعجال 24 ساعة","لا يوجد اسمك الكامل","HR لا ترسل روابط SMS"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["اتصل بالموارد البشرية مباشرة","استخدم بوابة الموظفين الرسمية","الراتب لا يتعلق بروابط SMS","أبلغ IT"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene2() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>احتيال Office 365</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}></p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ مزيف" type="fake" sender="Microsoft 365" time="3:45 PM"
        message={<>حسابك المؤسسي Office 365 سينتهي خلال 48 ساعة<br/>لتجديد حسابك:<br/>انقر: <span style={{color:C.red,textDecoration:"underline"}}>ms365-renew.com/business</span><br/>أدخل بيانات تسجيل الدخول</>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["ليس من microsoft.com","يطلب بيانات الدخول","تهديد بانتهاء 48 ساعة","O365 يديره IT، ليس SMS"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["تواصل مع IT","ادخل portal.office.com مباشرة","O365 لا ينتهي عبر SMS","لا تدخل بياناتك من روابط SMS"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene3() {
  const [active, setActive] = useState(null);
  const scams = [{"icon":"🔐","title":"تحديث VPN مزيف","fake":"\"شبكة الشركة مخترقة — حدّث VPN: company-vpn-update.com\"","truth":"تحديثات VPN تأتي من IT داخلياً"},{"icon":"📅","title":"دعوة اجتماع مزيفة","fake":"\"المدير دعاك لاجتماع طارئ — انضم: teams-meeting-join.com\"","truth":"دعوات Teams تأتي من التطبيق، ليس SMS"},{"icon":"📚","title":"تدريب إلزامي مزيف","fake":"\"تدريب مطلوب خلال 24 ساعة — انقر: company-training.net\"","truth":"التدريبات تأتي عبر إيميل الشركة أو LMS"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>احتيالات خاصة بالعمل</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>انقر لاستكشاف كل نوع</p>
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
            <div style={{ background: C.redBg, border: "1px solid rgba(239,68,68,0.3)", borderRadius: 10, padding: "12px", marginBottom: 8, direction: "rtl", textAlign: "right" }}>
              <div style={{ fontSize: 10, color: C.red, fontWeight: 700, marginBottom: 4 }}>❌ الرسالة المزيفة:</div>
              <div style={{ fontSize: 13, color: C.redLight }}>{s.fake}</div>
            </div>
            <div style={{ background: C.greenBg, border: "1px solid rgba(16,185,129,0.3)", borderRadius: 10, padding: "12px" }}>
              <div style={{ fontSize: 10, color: C.green, fontWeight: 700, marginBottom: 4 }}>✅ الحقيقة:</div>
              <div style={{ fontSize: 12, color: C.text }}>{s.truth}</div>
            </div>
          </div>)}
        </div>
      </FadeIn>))}
    </div>
    <FadeIn delay={800}><div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: C.yellowBg, border: "1px solid rgba(245,158,11,0.25)", textAlign: "center", maxWidth: 480, margin: "20px auto 0" }}>
      <span style={{ color: C.yellow, fontWeight: 700, fontSize: 13 }}>💡 القاعدة: كل SMS برابط تدعي أنها من شركتك = مشبوهة!</span>
    </div></FadeIn>
  </div>);
}
function Scene4() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"📧","label":"الشركة تتواصل عبر الإيميل والبوابة","detail":"ليس SMS"},{"icon":"🔐","label":"لا تدخل بيانات العمل في روابط SMS","detail":"استخدم البوابة الرسمية فقط"},{"icon":"🔍","label":"رسالة عن الراتب/IT/اجتماع؟ تحقق!","detail":"تواصل مع القسم مباشرة"},{"icon":"📢","label":"أبلغ IT فوراً","detail":"ساعد في حماية زملائك"},{"icon":"🌐","label":"افتح البوابة مباشرة","detail":"اكتب العنوان — لا تنقر SMS"},{"icon":"🚨","label":"عاجل + رابط + SMS = احتيال!","detail":"المعادلة الدائمة"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>حماية الموظفين من SMS</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>6 قواعد</p>
    </div></FadeIn>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, maxWidth: 520, margin: "0 auto" }}>
      {tips.map((t, i) => (<FadeIn key={i} delay={i * 120}><div onClick={() => setExp(exp === i ? null : i)} style={{ background: exp === i ? C.blueGlow : C.card, border: `1px solid ${exp === i ? C.blue + "50" : C.border}`, borderRadius: 14, padding: "16px", cursor: "pointer", transition: "all 0.3s" }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text, direction: "rtl", lineHeight: 1.4 }}>{t.label}</div>
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
  const qs = [{"t":"\"راتبك معلق، حدّث عبر hr-company.com\" — ماذا تفعل؟","opts":[{"text":"أحدّث فوراً","c":false,"ex":"HR لا ترسل روابط SMS!"},{"text":"أتصل بالموارد البشرية","c":true,"ex":"صحيح!"}]},{"t":"\"O365 سينتهي\" عبر SMS — حقيقي؟","opts":[{"text":"ممكن","c":false,"ex":"O365 يديره IT، ليس SMS!"},{"text":"مزيف","c":true,"ex":"صحيح!"}]},{"t":"\"تحديث VPN: company-vpn.com\" — تحمّل؟","opts":[{"text":"نعم","c":false,"ex":"تحديثات VPN من IT داخلياً!"},{"text":"لا — أتصل بـ IT","c":true,"ex":"صحيح!"}]},{"t":"القاعدة الذهبية لرسائل العمل؟","opts":[{"text":"SMS + رابط + عمل = مشبوه!","c":true,"ex":"صحيح!"},{"text":"بعض الروابط ممكن حقيقية","c":false,"ex":"الشركة تتواصل عبر قنواتها الرسمية فقط!"}]},{"t":"لماذا يستهدف المحتالون الموظفين عبر الرسائل النصية؟","opts":[{"text":"الموظفون يثقون بها أكثر من الإيميل","c":true,"ex":"صحيح! الرسائل تفتقر لفلاتر البريد العشوائي."},{"text":"الرسائل أكثر أماناً","c":false,"ex":"الرسائل النصية ليست أكثر أماناً بطبيعتها."}]},{"t":"إذا وصلتك رسالة مشبوهة على هاتفك الشخصي بخصوص حساب العمل:","opts":[{"text":"لا تضغط على الروابط وأبلغ قسم تقنية المعلومات","c":true,"ex":"صحيح! يمكنهم المساعدة في حماية أصول الشركة."},{"text":"تجاهلها لأنها على هاتفك الشخصي","c":false,"ex":"قد تعرض بيانات العمل للخطر."}]}];
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
  return (<div>
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
  </div>);
}
export default function PhishAwareV6_AR({
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
  const sc =["المقدمة","احتيال الرواتب","احتيال O365","احتيالات العمل","نصائح","اختبار"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, ${isDark ? "#111827" : "#EFF6FF"}, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #6366F1, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>📨</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>الفيديو 6 — تدريب الموظفين</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>الاحتيال عبر الرسائل في العمل</div>
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