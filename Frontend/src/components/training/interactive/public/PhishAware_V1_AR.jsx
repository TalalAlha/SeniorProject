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
  const hooks = [{"icon":"📱","t":"هل تلقيت رسالة من \"أبشر\" تطلب تحديث بياناتك؟"},{"icon":"🏦","t":"أو رسالة من البنك تقول أن حسابك سيُغلق؟"},{"icon":"⚠️","t":"انتبه! قد تكون محاولة تصيد إلكتروني"}];
  return (<div style={{ textAlign: "center", padding: "20px 0" }}>
    <FadeIn><div style={{ width: 80, height: 80, borderRadius: "50%", margin: "0 auto 20px", background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 36 }}>🛡️</div></FadeIn>
    <FadeIn delay={300}><h2 style={{ fontSize: 22, fontWeight: 700, color: C.text, direction: "rtl", marginBottom: 4 }}>التصيد الإلكتروني — كيف تحمي نفسك؟</h2>
    <p style={{ color: C.textMuted, fontSize: 14, marginBottom: 24 }}>في هذا الفيديو، سنتعلم كيف نحمي أنفسنا</p></FadeIn>
    <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 420, margin: "0 auto" }}>
      {hooks.map((h, i) => (<FadeIn key={i} delay={600 + i * 400}><div style={{ opacity: step > i ? 1 : 0.3, transition: "all 0.5s", background: step > i ? C.card : "transparent", border: `1px solid ${step > i ? C.border : "transparent"}`, borderRadius: 12, padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, direction: "rtl", textAlign: "right" }}>
        <span style={{ fontSize: 24 }}>{h.icon}</span>
        <div style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{h.t}</div>
      </div></FadeIn>))}
    </div>
  </div>);
}
function Scene1() {
  const [revF, setRevF] = useState(false);
  const [revR, setRevR] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>رسائل نفاذ المزيفة والحقيقية</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>انقر لاكتشاف العلامات</p>
    </div></FadeIn>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
      <FadeIn delay={200}>
        <PhoneSMS label="❌ مزيف" type="fake" sender="نفاذ الوطني" time="10:34 AM"
          message={<>تم إرسال كود التحقق: <b>123456</b><br/>للتفعيل، انقر هنا: <span style={{color:C.red,textDecoration:"underline"}}>bit.ly/nfth123</span><br/>صالح لمدة 5 دقائق</>}>
          <RevealFlags revealed={revF} onReveal={() => setRevF(true)} flags={["رابط مختصر (bit.ly) — نفاذ لا يرسل روابط أبداً","يطلب النقر على رابط","استعجال شديد — 5 دقائق فقط","أخطاء لغوية"]} />
        </PhoneSMS>
      </FadeIn>
      <FadeIn delay={400}>
        <PhoneSMS label="✅ حقيقي" type="real" sender="نفاذ الوطني - Nafath" time="10:34 AM"
          message={<>كود التحقق: <b>123456</b><br/><span style={{color:C.green}}>لا تشارك هذا الكود مع أي شخص</span><br/>صالح لمدة دقيقتين</>}>
          <RevealFlags revealed={revR} onReveal={() => setRevR(true)} flags={["✅ اسم المرسل الرسمي","✅ تحذير: لا تشارك الكود","✅ لا توجد روابط","✅ لغة عربية صحيحة"]} />
        </PhoneSMS>
      </FadeIn>
    </div>
    <FadeIn delay={600}><div style={{ marginTop: 20, padding: "14px 18px", borderRadius: 12, background: C.yellowBg, border: "1px solid rgba(245,158,11,0.25)", textAlign: "center" }}>
      <span style={{ fontSize: 16 }}>💡</span>
      <span style={{ color: C.yellow, fontWeight: 700, fontSize: 13, marginLeft: 8 }}>القاعدة الذهبية: نفاذ لن يطلب منك أبداً النقر على رابط!</span>
    </div></FadeIn>
  </div>);
}
function Scene2() {
  const [hov, setHov] = useState(null);
  const flags = [{"id":"from","label":"outlook.com — ليس من .gov.sa"},{"id":"urgency","label":"تهديد بـ 24 ساعة"},{"id":"link","label":"رابط مشبوه"},{"id":"greeting","label":"\"عزيزي المستخدم\" — تحية عامة"}];
  const realTraits = ["ينتهي بـ .gov.sa أو .sa","لا يهدد بإغلاق حسابك","لا يطلب كلمة المرور أبداً","يستخدم اسمك الحقيقي"];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>رسائل أبشر المزيفة</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>مرر الماوس على العناصر المشبوهة</p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <div style={{ background: C.card, borderRadius: 16, border: "2px solid rgba(239,68,68,0.3)", overflow: "hidden", maxWidth: 520, margin: "0 auto" }}>
        <div style={{ padding: "14px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 5, fontSize: 13 }}>
            <span style={{ color: C.textDim, minWidth: 50 }}>From:</span>
            <span onMouseEnter={() => setHov("from")} onMouseLeave={() => setHov(null)} style={{ color: C.red, fontWeight: 600, cursor: "pointer", background: hov === "from" ? C.redBg : "transparent", padding: "2px 6px", borderRadius: 4, transition: "all 0.2s" }}>absher-services@outlook.com ❌</span>
          </div>
          <div style={{ display: "flex", gap: 8, fontSize: 13 }}>
            <span style={{ color: C.textDim, minWidth: 50 }}>الموضوع:</span>
            <span style={{ color: C.text }}>تحديث عاجل - حسابك في أبشر</span>
          </div>
        </div>
        <div style={{ padding: "20px", direction: "rtl", textAlign: "right", fontSize: 14, lineHeight: 1.9, color: C.text }}>
          <span onMouseEnter={() => setHov("greeting")} onMouseLeave={() => setHov(null)} style={{ cursor: "pointer", background: hov === "greeting" ? C.redBg : "transparent", padding: "1px 4px", borderRadius: 4 }}>عزيزي المستخدم،</span><br/><br/>
          نحتاج إلى تحديث بياناتك في أبشر خلال{" "}
          <span onMouseEnter={() => setHov("urgency")} onMouseLeave={() => setHov(null)} style={{ color: C.red, fontWeight: 700, cursor: "pointer", background: hov === "urgency" ? C.redBg : "transparent", padding: "2px 6px", borderRadius: 4 }}>24 ساعة</span><br/>
          وإلا سيتم إيقاف حسابك نهائياً.<br/><br/>
          <span onMouseEnter={() => setHov("link")} onMouseLeave={() => setHov(null)} style={{ display: "inline-block", padding: "8px 18px", borderRadius: 8, background: hov === "link" ? "rgba(239,68,68,0.2)" : "#1E293B", border: `1px solid ${hov === "link" ? C.red : C.border}`, color: C.red, cursor: "pointer", fontSize: 13, transition: "all 0.2s" }}>🔗 http://absher-update.com</span>
        </div>
        {hov && (<div style={{ padding: "12px 20px", background: C.redBg, borderTop: "1px solid rgba(239,68,68,0.3)", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 18 }}>⚠️</span>
          <div style={{ fontSize: 12, color: C.red, fontWeight: 600 }}>{flags.find(f => f.id === hov)?.label}</div>
        </div>)}
      </div>
    </FadeIn>
    <FadeIn delay={400}>
      <div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, background: C.greenBg, border: "1px solid rgba(16,185,129,0.3)", maxWidth: 520, margin: "20px auto 0" }}>
        <div style={{ fontWeight: 700, fontSize: 13, color: C.green, marginBottom: 10 }}>✅ أبشر الحقيقي:</div>
        {realTraits.map((t, i) => (<div key={i} style={{ display: "flex", gap: 8, fontSize: 12, color: C.text, marginBottom: 6 }}><span style={{ color: C.green }}>✓</span><span>{t}</span></div>))}
      </div>
    </FadeIn>
  </div>);
}
function Scene3() {
  const [rev, setRev] = useState(false);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>تصيد البنوك</h3>
      <p style={{ fontSize: 12, color: C.textMuted, marginTop: 4 }}>انقر لاكتشاف العلامات</p>
    </div></FadeIn>
    <FadeIn delay={200}>
      <PhoneSMS label="❌ رسالة بنك مزيفة" type="fake" sender="الأهلي السعودي" time="2:15 PM"
        message={<>تم حظر بطاقتك مؤقتاً بسبب نشاط مشبوه<br/>لإلغاء الحظر: <span style={{color:C.red}}>0501234567</span><br/>أو انقر: <span style={{color:C.red,textDecoration:"underline"}}>saudibank.net/unblock</span></>}>
        <RevealFlags revealed={rev} onReveal={() => setRev(true)} flags={["يثير الذعر — \"بطاقتك محظورة\"","رقم هاتف غير رسمي","دومين مشبوه .net","يستعجلك في اتخاذ قرار"]} />
      </PhoneSMS>
    </FadeIn>
    <FadeIn delay={500}>
      <div style={{ maxWidth: 340, margin: "16px auto 0" }}>
        <GreenBlock items={["اتصل بالرقم خلف البطاقة","زر الفرع شخصياً","استخدم التطبيق الرسمي","تحقق من الحسابات الموثقة"]} />
      </div>
    </FadeIn>
  </div>);
}
function Scene4() {
  const [step, setStep] = useState(-1);
  const steps = [{"icon":"🕵️","title":"المحتال يدخل رقمك","desc":"يدخل رقم جوالك في موقع حكومي","color":"#EF4444"},{"icon":"📲","title":"يصلك رمز نفاذ حقيقي","desc":"رمز حقيقي لم تطلبه أنت!","color":"#F59E0B"},{"icon":"📞","title":"المحتال يتصل بك","desc":"\"أنا من البنك، ما الرمز الذي وصلك؟\"","color":"#EF4444"},{"icon":"🗣️","title":"تعطيه الرمز","desc":"المحتال يدخل الرمز الخاص بك","color":"#EF4444"},{"icon":"💀","title":"حسابك مخترق!","desc":"وصول كامل لحساباتك","color":"#DC2626"}];
  const play = () => { setStep(-1); steps.forEach((_, i) => setTimeout(() => setStep(i), 800 + i * 1000)); };
  useEffect(() => { play(); }, []);
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>كيف يُسرق رمز نفاذ؟</h3>
    </div></FadeIn>
    <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
      <div style={{ position: "absolute", left: 24, top: 20, bottom: 20, width: 2, background: C.border }} />
      {steps.map((s, i) => (<div key={i} style={{ display: "flex", gap: 16, marginBottom: 12, position: "relative", zIndex: 1, opacity: step >= i ? 1 : 0.15, transform: step >= i ? "translateX(0)" : "translateX(-10px)", transition: "all 0.6s cubic-bezier(0.16,1,0.3,1)" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: step >= i ? C.card : "#0F172A", border: `2px solid ${step >= i ? s.color : C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, boxShadow: step === i ? `0 0 20px ${s.color}40` : "none" }}>{s.icon}</div>
        <div style={{ flex: 1, background: C.card, borderRadius: 12, padding: "12px 16px", border: `1px solid ${step === i ? s.color + "60" : C.border}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: s.color }}>{s.title}</div>
          <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{s.desc}</div>
        </div>
      </div>))}
    </div>
    <FadeIn delay={5500}><div style={{ marginTop: 20, padding: "16px 20px", borderRadius: 12, textAlign: "center", background: "rgba(220,38,38,0.1)", border: "1px solid rgba(220,38,38,0.3)" }}>
      <div style={{ fontSize: 20, marginBottom: 6 }}>🚨</div>
      <div style={{ color: "#FCA5A5", fontWeight: 700, fontSize: 15, direction: "rtl" }}>لا تشارك رمز نفاذ مع أي شخص — أبداً!</div>
    </div></FadeIn>
    <div style={{ textAlign: "center", marginTop: 12 }}><button onClick={play} style={{ background: C.card, border: `1px solid ${C.border}`, color: C.blue, padding: "8px 20px", borderRadius: 20, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>↻ إعادة</button></div>
  </div>);
}
function Scene5() {
  const [exp, setExp] = useState(null);
  const tips = [{"icon":"🔍","label":"تحقق من المرسل دائماً","detail":".gov.sa للحكومة، .sa للبنوك"},{"icon":"🔗","label":"لا تنقر على الروابط المشبوهة","detail":"اكتب العنوان مباشرة"},{"icon":"🔐","label":"لا تشارك رموز نفاذ/OTP","detail":"حتى لو ادعى أنه من البنك"},{"icon":"📞","label":"عند الشك، اتصل مباشرة","detail":"استخدم الأرقام الرسمية فقط"},{"icon":"🛡️","label":"فعّل المصادقة الثنائية","detail":"في جميع حساباتك"},{"icon":"📲","label":"حدّث أجهزتك باستمرار","detail":"التحديثات تحميك من الثغرات"}];
  return (<div>
    <FadeIn><div style={{ textAlign: "center", marginBottom: 20, direction: "rtl" }}>
      <h3 style={{ fontSize: 17, fontWeight: 700, color: C.text }}>كيف تحمي نفسك؟</h3>
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
  const qs = [{"t":"أي رسالة نفاذ حقيقية؟","opts":[{"text":"كود 123456 — انقر: bit.ly/nfth","c":false,"ex":"نفاذ لا يرسل روابط أبداً!"},{"text":"كود 123456 — لا تشارك هذا الكود","c":true,"ex":"صحيح!"}]},{"t":"إيميل من absher@outlook.com — حقيقي أم مزيف؟","opts":[{"text":"حقيقي","c":false,"ex":"أبشر يستخدم .gov.sa فقط!"},{"text":"مزيف","c":true,"ex":"صحيح!"}]},{"t":"البنك يتصل ويطلب CVV — ماذا تفعل؟","opts":[{"text":"أعطيهم الرقم","c":false,"ex":"البنوك لا تطلب CVV أبداً!"},{"text":"أغلق واتصل بالبنك","c":true,"ex":"صحيح!"}]},{"t":"وصلك رمز نفاذ لم تطلبه — ماذا يعني؟","opts":[{"text":"خطأ من النظام","c":false,"ex":"شخص يحاول اختراق حسابك!"},{"text":"محاولة اختراق!","c":true,"ex":"صحيح! غيّر كلمة المرور."}]},{"t":"رابط .gov.sa — آمن دائماً؟","opts":[{"text":"نعم دائماً","c":false,"ex":"تحقق من العنوان كاملاً!"},{"text":"يجب التحقق","c":true,"ex":"صحيح!"}]}];
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
export default function PhishAwareV1_AR({
  initialScene = 0,
  onSceneChange = () => {},
  onComplete = () => {}
}) {
  const [a, setA] = useState(initialScene);
  useEffect(() => {
    const totalScenes = 7;
    onSceneChange(a, totalScenes);
  }, [a, onSceneChange]);
  const sc =["المقدمة","رسائل نفاذ","إيميل أبشر","البنوك","سرقة OTP","نصائح","اختبار"];
  const co = [<Scene0 />, <Scene1 />, <Scene2 />, <Scene3 />, <Scene4 />, <Scene5 />, <Scene6 onComplete={onComplete} />];
  return (
    <div style={{ minHeight: "100vh", background: C.bg, fontFamily: "'Segoe UI', Tahoma, sans-serif", color: C.text }}>
      <div style={{ background: `linear-gradient(135deg, #0F1729, ${C.surface})`, borderBottom: `1px solid ${C.border}`, padding: "16px 20px" }}>
        <div style={{ maxWidth: 700, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg, #3B82F6, #6366F1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🛡️</div>
              <div><div style={{ fontSize: 16, fontWeight: 700, letterSpacing: 1 }}>PhishAware</div><div style={{ fontSize: 10, color: C.textDim }}>الفيديو 1 — تدريب تفاعلي</div></div>
            </div>
            <div style={{ fontSize: 11, color: C.textMuted, background: C.card, padding: "4px 12px", borderRadius: 12 }}>التصيد الإلكتروني</div>
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