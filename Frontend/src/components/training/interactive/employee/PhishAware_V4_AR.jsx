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
      <div style={{ fontSize: 12, fontWeight: 600, color: C.textDim, marginBottom: 6, textAlign: "right", direction: "rtl" }}>{sender}</div>
      <div style={{ background: "#1E293B", borderRadius: "14px 14px 4px 14px", padding: "14px 16px", direction: "rtl", textAlign: "right", fontSize: 14, lineHeight: 1.75, color: C.text }}>{message}</div>
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
    <div style={{ background: isScammer ? "rgba(239,68,68,0.08)" : "#1E293B", borderRadius: 12, padding: "10px 14px", borderLeft: isScammer ? `3px solid ${C.red}` : "none", borderRight: !isScammer ? `3px solid ${C.textDim}` : "none", direction: "rtl", textAlign: "right" }}>
      <div style={{ fontSize: 10, color: isScammer ? C.red : C.textDim, fontWeight: 700, marginBottom: 4 }}>{speaker}</div>
      <div style={{ fontSize: 13, color: isScammer ? "#FCA5A5" : C.textMuted, lineHeight: 1.6 }}>{text}</div>
    </div>
  </div>);
}

function Scene0() {
  const [step, setStep] = useState(0);
  useEffect(() => { const t = setInterval(() => setStep(s => s < 3 ? s + 1 : s), 1000); return () => clearTimeout(t); }, []);
  const hooks = [{"icon":"👔","t":"رسالة من \"المدير\" يطلب تحويل عاجل"},{"icon":"📄","t":"فاتورة من \"مورد\" بحساب جديد"},{"icon":"👥","t":"\"الموارد البشرية\" تطلب كلمة المرور"}];
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #0D9488, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🏢</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "rtl", marginBottom: 4 }}>التصيد الإلكتروني في بيئة العمل</h2>
    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>كيف تحمي شركتك من الاختراق؟</p></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      {hooks.map((h, i) => (<FadeIn key={i} delay={600 + i * 400}><div style={{ opacity: step > i ? 1 : 0.3, transition: "all 0.5s", background: step > i ? C.card : "transparent", border: `1px solid ${step > i ? C.border : "transparent"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, direction: "rtl", textAlign: "right" }}>
        <span style={{ fontSize: 24 }}>{h.icon}</span>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{h.t}</div>
      </div></FadeIn>))}
    </div>
  </div>);
}
function Scene1() {
  const [lines, setLines] = useState(0);
  const [showF, setShowF] = useState(false);
  const play = () => { setLines(0); setShowF(false); let i = 0; const t = setInterval(() => { i++; setLines(i); if (i >= 5) { clearInterval(t); setTimeout(() => setShowF(true), 600); } }, 1000); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>احتيال المدير العام</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>شاهد كيف يعمل الاحتيال</p>
    </div></FadeIn>
    <div style={{ maxWidth: 440, margin: "0 auto", background: C.card, borderRadius: 16, border: "2px solid rgba(239,68,68,0.3)", overflow: "hidden" }}>
      <div style={{ background: C.red, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>❌ إيميل مدير مزيف</div>
      <div style={{ padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>👔</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, direction: "rtl" }}>المدير العام</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>ceo@company-sa.com ≠ company.sa</div>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <ConvoLine speaker="المحتال" text="محمد، أنا في اجتماع مهم" isScammer={true} visible={lines >= 1} />
        <ConvoLine speaker="المحتال" text="نحتاج تحويل 50,000 ريال عاجلاً" isScammer={true} visible={lines >= 2} />
        <ConvoLine speaker="المحتال" text="الموضوع سري، لا تخبر أحد" isScammer={true} visible={lines >= 3} />
        <ConvoLine speaker="المحتال" text="حوّل الآن وسأشرح لاحقاً" isScammer={true} visible={lines >= 4} />
        <ConvoLine speaker="⛔" text="لا تحوّل! تحقق أولاً!" isScammer={false} visible={lines >= 5} />
      </div>
      {showF && <div style={{ padding: "0 16px 16px" }}>
        <FlagBlock type="red" flags={["الدومين خاطئ: company-sa.com ≠ company.sa","استعجال + سرية","يتجاوز الإجراءات المالية","\"لا تخبر أحد\" = علامة كبرى"]} />
        <FlagBlock type="green" flags={["اتصل بالمدير بالرقم المعروف","تحقق من الدومين حرفاً حرفاً","اتبع الإجراءات المالية","أبلغ قسم IT"]} />
      </div>}
    </div>
    <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={play} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>▶ إعادة</button></div>
  </div>);
}
function Scene2() {
  const [lines, setLines] = useState(0);
  const [showF, setShowF] = useState(false);
  const play = () => { setLines(0); setShowF(false); let i = 0; const t = setInterval(() => { i++; setLines(i); if (i >= 4) { clearInterval(t); setTimeout(() => setShowF(true), 600); } }, 1000); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>التلاعب بالفواتير</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>كيف يسرقون الملايين</p>
    </div></FadeIn>
    <div style={{ maxWidth: 440, margin: "0 auto", background: C.card, borderRadius: 16, border: "2px solid rgba(239,68,68,0.3)", overflow: "hidden" }}>
      <div style={{ background: C.red, padding: "8px 16px", textAlign: "center", fontWeight: 700, fontSize: 12, color: "#fff" }}>❌ فاتورة مزيفة</div>
      <div style={{ padding: "16px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>📄</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: C.text, direction: "rtl" }}>قسم المحاسبة — المورد</div>
        <div style={{ fontSize: 12, color: C.textDim, marginBottom: 12 }}>accounts@supplier.com ≠ supplier.sa</div>
      </div>
      <div style={{ padding: "0 16px 16px" }}>
        <ConvoLine speaker="المحتال" text="نعتذر، حسابنا البنكي تغير" isScammer={true} visible={lines >= 1} />
        <ConvoLine speaker="المحتال" text="القديم: SA1111... ← الجديد: SA9999..." isScammer={true} visible={lines >= 2} />
        <ConvoLine speaker="المحتال" text="المبلغ لم يتغير: 25,000 ريال" isScammer={true} visible={lines >= 3} />
        <ConvoLine speaker="⛔" text="لا تحوّل! تحقق هاتفياً!" isScammer={false} visible={lines >= 4} />
      </div>
      {showF && <div style={{ padding: "0 16px 16px" }}>
        <FlagBlock type="red" flags={["تغيير مفاجئ للحساب البنكي","دومين مشابه لكن مختلف (.com ≠ .sa)","توقيت قبل الدفع","لا اتصال هاتفي للتأكيد"]} />
        <FlagBlock type="green" flags={["اتصل بالمورد برقم محفوظ","تحقق شفهياً من أي تغيير","قارن مع عقد الشراء","لا تغير معلومات الدفع بناءً على إيميل"]} />
      </div>}
    </div>
    <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={play} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>▶ إعادة</button></div>
  </div>);
}
function Scene3() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>تصيد الموارد البشرية</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>فخ كلمة المرور</p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ إيميل HR مزيف" type="fake" sender="hr@company-portal.com ❌" time=""
        message={<>حسب متطلبات GOSI الجديدة، حدّث بياناتك:<br/>— رقم الهوية<br/>— IBAN<br/>— <span style={{color:C.red,fontWeight:700}}>كلمة مرور بوابة الموظفين ❌❌</span></>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["يطلب كلمة المرور! — HR لن تفعل ذلك أبداً","رابط خارجي وليس بوابة الشركة","ليس من البريد الرسمي","استعجال نهاية الشهر"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["HR لا تطلب كلمة المرور أبداً","استخدم بوابة الشركة الداخلية","GOSI عبر gosi.gov.sa فقط","تواصل مع HR مباشرة"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene4() {
  const [step, setStep] = useState(-1);
  const steps = [{"icon":"🔍","title":"يدرسون الشركة","desc":"من المدراء؟ من يتعامل مع المال؟","color":"#F59E0B"},{"icon":"✉️","title":"ينشئون إيميلات مشابهة","desc":"company.sa → company-sa.com","color":"#EF4444"},{"icon":"🎭","title":"ينتحلون شخصيات","desc":"المدير، المحاسبة، الموردين","color":"#EF4444"},{"icon":"💸","title":"يطلبون تحويلات","desc":"عاجلة، سرية، تجاوز الإجراءات","color":"#EF4444"},{"icon":"💀","title":"خسارة ملايين!","desc":"حالات حقيقية في السعودية","color":"#DC2626"}];
  const play = () => { setStep(-1); steps.forEach((_, i) => setTimeout(() => setStep(i), 600 + i * 900)); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}><h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>كيف يخترق المحتالون الشركات؟</h3><p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>Business Email Compromise (BEC)</p></div></FadeIn>
    <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", left: 24, top: 20, bottom: 20, width: 2, background: C.border }} />
      {steps.map((s, i) => (<div key={i} style={{ display: "flex", gap: 16, marginBottom: 12, position: "relative", zIndex: 1, opacity: step >= i ? 1 : 0.15, transform: step >= i ? "translateX(0)" : "translateX(-10px)", transition: "all 0.6s" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: step >= i ? C.card : "#0F172A", border: `2px solid ${step >= i ? s.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: step === i ? `0 0 20px ${s.color}40` : "none" }}>{s.icon}</div>
        <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${step === i ? s.color + "60" : C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.desc}</div>
        </div>
      </div>))}
    </div>
    <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={play} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↻ إعادة</button></div>
  </div>);
}
function Scene5() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"🔍","label":"تحقق من الدومين دائماً","detail":"company.sa vs company-sa.com"},{"icon":"🔐","label":"لا تعطي كلمة مرورك لأحد","detail":"حتى IT أو HR لن يطلبوها"},{"icon":"📋","label":"اتبع الإجراءات المالية","detail":"التحويلات تحتاج موافقات"},{"icon":"📞","label":"اتصل للتحقق","detail":"طلب غير عادي؟ اتصل مباشرة"},{"icon":"🚨","label":"سري + عاجل = تحذير!","detail":"أكبر علامة احتيال"},{"icon":"🛡️","label":"فعّل 2FA + أبلغ IT","detail":"في كل حساباتك العملية"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>كيف تحمي شركتك؟</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>6 قواعد — انقر للتفاصيل</p>
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
function Scene6({ onComplete = () => {} }) {
  const [cq, setCq] = useState(0);
  const [sel, setSel] = useState(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const qs = [{"t":"المدير يطلب تحويل 50,000 سري عاجل — ماذا تفعل؟","opts":[{"text":"أحوّل فوراً","c":false,"ex":"تحقق دائماً عبر قناة أخرى!"},{"text":"أتصل بالمدير للتحقق","c":true,"ex":"صحيح!"}]},{"t":"المورد يغير حسابه البنكي عبر الإيميل — طبيعي؟","opts":[{"text":"نعم","c":false,"ex":"لا تغير معلومات الدفع بناءً على إيميل!"},{"text":"لا، يجب التحقق هاتفياً","c":true,"ex":"صحيح!"}]},{"t":"HR تطلب كلمة مرورك عبر إيميل — ترسلها؟","opts":[{"text":"لا — HR لن تطلبها أبداً","c":true,"ex":"صحيح!"},{"text":"نعم لتحديث GOSI","c":false,"ex":"لن يطلب أحد كلمة مرورك!"}]},{"t":"\"سري + عاجل + لا تخبر أحد\" — علامة على؟","opts":[{"text":"صفقة مهمة","c":false,"ex":"هذا نمط احتيال BEC الكلاسيكي!"},{"text":"احتيال BEC","c":true,"ex":"صحيح!"}]}];
  const [answers, setAnswers] = useState({});
  const handleSel = (oi) => { if (sel !== null) return; setSel(oi); const isCorrect = qs[cq].opts[oi].c; if (isCorrect) setScore(s => s + 1); setAnswers(prev => ({ ...prev, [cq]: { selected: oi, correct: isCorrect } })); };
  const handleNext = () => { if (cq < qs.length - 1) { setCq(c => c + 1); setSel(null); } else setDone(true); };
  useEffect(() => {
    if (done) {
      onComplete({ score, total: qs.length, answers, total_scenes: 7 });
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
export default function PhishAwareV4_AR({
  initialScene = 0,
  onSceneChange = () => {},
  onComplete = () => {}
}) {
  const [a, setA] = useState(initialScene);
  useEffect(() => {
    const totalScenes = 7;
    onSceneChange(a, totalScenes);
  }, [a, onSceneChange]);
  const sc =["المقدمة","احتيال المدير","الفواتير","تصيد HR","هجمات BEC","نصائح","اختبار"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 />, <Scene6 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, #0F1729, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #0D9488, #3B82F6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🏢</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>الفيديو 4 — تدريب الموظفين</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>التصيد في العمل</div>
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