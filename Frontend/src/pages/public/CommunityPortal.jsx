/**
 * CommunityPortal — Public cybersecurity awareness resource hub (/community).
 *
 * Sections:
 *  1. Daily Phishing Challenge  — fetches today's SimulationTemplate from backend
 *  2. MENA Threat Watch          — static bilingual threat cards (MENA-specific)
 *  3. URL Inspector              — frontend-only URL analysis tool
 *  4. Security Glossary          — searchable bilingual glossary
 *  5. Trusted Resources          — verified external links
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import DOMPurify from 'dompurify';
import {
  Shield, Search, ExternalLink, ChevronDown, ChevronUp,
  AlertTriangle, CheckCircle, XCircle, Globe,
  Zap, Eye, EyeOff, RefreshCw, Building2, Truck,
  CreditCard, Smartphone, Moon, Users,
} from 'lucide-react';
import { communityAPI } from '../../api';

// Sanitiser config: allow the email-style markup we render in the daily
// challenge but strip <script>, event handlers, and `javascript:` URLs.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'a', 'b', 'br', 'div', 'em', 'i', 'img', 'li', 'ol', 'p', 'span',
    'strong', 'table', 'tbody', 'td', 'th', 'thead', 'tr', 'u', 'ul', 'h1',
    'h2', 'h3', 'h4', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'style', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto|tel):|[^a-z]|[a-z+.-]+(?:[^a-z+.\-:]|$))/i,
};

// ---------------------------------------------------------------------------
// Static bilingual data (MENA-specific content, not fetched)
// ---------------------------------------------------------------------------

const THREAT_DATA = [
  {
    id: 'government',
    icon: Building2,
    color: 'red',
    category_en: 'Government Impersonation',
    category_ar: 'انتحال الجهات الحكومية',
    title_en: 'Fake Absher / ZATCA / Nafath Alerts',
    title_ar: 'تنبيهات مزيفة من أبشر / زاتكا / نفاذ',
    desc_en: 'Attackers send official-looking emails or SMS claiming your Absher account is suspended, you owe a ZATCA fine, or your Nafath identity needs re-verification. The link leads to a fake login page that steals your national ID and password.',
    desc_ar: 'يرسل المهاجمون رسائل بريد إلكتروني أو رسائل نصية تبدو رسمية تدّعي أن حساب أبشر الخاص بك معلّق، أو أن لديك غرامة من زاتكا، أو أن هويتك في نفاذ تحتاج إعادة تحقق. يؤدي الرابط إلى صفحة تسجيل دخول مزيفة تسرق رقم هويتك الوطنية وكلمة مرورك.',
    flags_en: ['Sender is not @absher.sa or @zatca.gov.sa', 'Link domain contains extra words (e.g. absher-login.tk)', 'Urgency — "your account will be deleted in 24 hours"', 'Asks for national ID number via a link'],
    flags_ar: ['المرسل ليس من @absher.sa أو @zatca.gov.sa', 'نطاق الرابط يحتوي على كلمات إضافية مثل absher-login.tk', 'إلحاح — "سيُحذف حسابك خلال 24 ساعة"', 'يطلب رقم الهوية الوطنية عبر رابط'],
    tip_en: 'Always access Absher at absher.sa directly from your browser — never from an email or SMS link.',
    tip_ar: 'ادخل إلى أبشر دائماً من خلال كتابة absher.sa مباشرةً في المتصفح، وليس عبر أي رابط في بريد إلكتروني أو رسالة نصية.',
  },
  {
    id: 'delivery',
    icon: Truck,
    color: 'orange',
    category_en: 'Delivery Scams',
    category_ar: 'احتيال الشحن والتوصيل',
    title_en: 'Aramex / SMSA "Customs Fee" SMS',
    title_ar: 'رسائل "رسوم جمركية" من أرامكس / SMSA',
    desc_en: 'A text or WhatsApp message saying your parcel is held at customs and you must pay a small fee (10–50 SAR) to release it. After you pay via the link, your card details are captured and used for further fraud.',
    desc_ar: 'رسالة نصية أو عبر واتساب تقول إن طردك محتجز في الجمارك وعليك دفع رسوم بسيطة (10-50 ريال) للإفراج عنه. بعد الدفع عبر الرابط، تُسرق بيانات بطاقتك وتُستخدم في عمليات احتيال أخرى.',
    flags_en: ['You have no pending delivery', 'Sender number is not an official shortcode', 'Link is a shortener (bit.ly) or suspicious domain', 'Asks for full card details for a tiny fee'],
    flags_ar: ['لا يوجد لديك طرد معلق', 'رقم المرسل ليس رمز رسمياً قصيراً', 'الرابط مُقصَّر (bit.ly) أو نطاق مشبوه', 'يطلب بيانات البطاقة كاملة مقابل رسوم ضئيلة'],
    tip_en: 'Track parcels only through the carrier\'s official app or website. Never pay customs via an SMS link.',
    tip_ar: 'تتبع شحناتك فقط من خلال التطبيق أو الموقع الرسمي للشركة. لا تدفع رسوماً جمركية أبداً عبر رابط رسالة نصية.',
  },
  {
    id: 'banking',
    icon: CreditCard,
    color: 'blue',
    category_en: 'Banking Phishing',
    category_ar: 'تصيد بنكي',
    title_en: 'Al Rajhi / SNB / ADCB Fake Alerts',
    title_ar: 'تنبيهات مزيفة من الراجحي / SNB / ADCB',
    desc_en: 'An email or SMS appears to come from your bank, warning of a suspicious transaction or blocked card. Clicking the link leads to a pixel-perfect clone of the bank\'s login page — every credential you enter goes directly to the attacker.',
    desc_ar: 'بريد إلكتروني أو رسالة نصية تبدو كأنها من بنكك، تحذّر من عملية مشبوهة أو بطاقة محظورة. النقر على الرابط يؤدي إلى نسخة طبق الأصل من صفحة تسجيل دخول البنك — كل ما تُدخله يذهب مباشرةً إلى المهاجم.',
    flags_en: ['Bank never asks for login credentials via email', 'Hover over link — domain is not alrajhibank.com.sa', 'OTP request arrives even though you didn\'t initiate', 'Urgent language about account suspension'],
    flags_ar: ['البنك لن يطلب أبداً بيانات الدخول عبر البريد الإلكتروني', 'عند تحريك الماوس على الرابط — النطاق ليس alrajhibank.com.sa', 'يصل رمز OTP دون أن تبدأ أي عملية', 'لغة عاجلة بشأن تعليق الحساب'],
    tip_en: 'Call the number on the back of your bank card if you suspect any account issue. Never use contact details from an email.',
    tip_ar: 'اتصل بالرقم الموجود على ظهر بطاقتك البنكية إذا اشتبهت في أي مشكلة. لا تستخدم أبداً معلومات الاتصال الواردة في البريد الإلكتروني.',
  },
  {
    id: 'telecom',
    icon: Smartphone,
    color: 'purple',
    category_en: 'Telecom Lures',
    category_ar: 'إغراءات شركات الاتصالات',
    title_en: 'STC / Mobily / Zain "Package Expired" SMS',
    title_ar: 'رسائل "انتهت باقتك" من STC / موبايلي / زين',
    desc_en: 'A message claiming your internet package has expired or your line will be suspended unless you renew immediately via the provided link. The fake renewal page collects your credentials and payment details.',
    desc_ar: 'رسالة تزعم أن باقة الإنترنت الخاصة بك انتهت أو سيُعلَّق خطك إذا لم تجدد فوراً عبر الرابط المرفق. صفحة التجديد المزيفة تجمع بيانات الدخول ومعلومات الدفع.',
    flags_en: ['Official renewals never come from unrecognized shortcodes', 'Your operator\'s app shows no expiry warning', 'Link domain is not stc.com.sa / mobily.com.sa / zain.com.sa', 'Extreme urgency ("your line stops tonight")'],
    flags_ar: ['التجديدات الرسمية لا تأتي أبداً من أرقام غير معروفة', 'تطبيق المشغّل لا يُظهر أي تحذير انتهاء', 'نطاق الرابط ليس stc.com.sa أو mobily.com.sa أو zain.com.sa', 'إلحاح شديد ("سيتوقف خطك الليلة")'],
    tip_en: 'Manage your subscription directly in the operator\'s official app. Ignore renewal SMS from unknown numbers.',
    tip_ar: 'أدر اشتراكك مباشرةً من تطبيق المشغّل الرسمي. تجاهل رسائل التجديد من أرقام غير معروفة.',
  },
  {
    id: 'religious',
    icon: Moon,
    color: 'green',
    category_en: 'Seasonal / Religious Scams',
    category_ar: 'عمليات احتيال موسمية / دينية',
    title_en: 'Hajj Registration, Ramadan Charity & Eidiya Fraud',
    title_ar: 'تسجيل الحج والتبرعات الرمضانية واحتيال العيدية',
    desc_en: 'During Ramadan, Hajj season, and Eid, scammers exploit generosity and urgency. Fake charity sites collect donations that never reach recipients. Fake Hajj portals steal visa application fees. Eidiya WhatsApp groups distribute malicious gift links.',
    desc_ar: 'خلال رمضان وموسم الحج والعيد، يستغل المحتالون الكرم والإلحاح. مواقع خيرية مزيفة تجمع تبرعات لا تصل أبداً. بوابات حج مزيفة تسرق رسوم طلبات التأشيرة. مجموعات واتساب للعيدية تُوزّع روابط هدايا خبيثة.',
    flags_en: ['Charity is not registered on charity.gov.sa', 'Hajj registration portal URL is not hajj.gov.sa', 'Eidiya link asks for your bank details', 'Extremely emotional language to bypass rational thinking'],
    flags_ar: ['الجمعية الخيرية غير مسجلة في charity.gov.sa', 'رابط بوابة الحج ليس hajj.gov.sa', 'رابط العيدية يطلب بيانات حسابك البنكي', 'لغة عاطفية شديدة لتجاوز التفكير العقلاني'],
    tip_en: 'Verify charities at charity.gov.sa. Register for Hajj only at hajj.gov.sa or your country\'s official ministry.',
    tip_ar: 'تحقق من الجمعيات الخيرية على charity.gov.sa. سجل للحج فقط عبر hajj.gov.sa أو وزارة الشؤون الدينية في بلدك.',
  },
  {
    id: 'bec',
    icon: Users,
    color: 'yellow',
    category_en: 'WhatsApp / BEC Fraud',
    category_ar: 'احتيال واتساب / اختراق البريد التجاري',
    title_en: '"CEO" WhatsApp Requests & Supplier Fraud',
    title_ar: 'طلبات واتساب من "المدير التنفيذي" واحتيال الموردين',
    desc_en: 'An employee receives a WhatsApp message from a number saved as the CEO or a supplier, urgently requesting a wire transfer or gift cards. The number is not the real contact — it was obtained from LinkedIn or a data breach.',
    desc_ar: 'يتلقى الموظف رسالة واتساب من رقم محفوظ باسم المدير التنفيذي أو مورّد، يطلب بشكل عاجل تحويلاً مالياً أو بطاقات هدايا. الرقم ليس جهة الاتصال الحقيقية — تم الحصول عليه من LinkedIn أو اختراق بيانات.',
    flags_en: ['Real executives never request payments via WhatsApp', 'The request skips normal procurement processes', 'Extreme secrecy ("don\'t tell anyone")', 'Unexpected change in payment account or beneficiary'],
    flags_ar: ['المسؤولون الحقيقيون لا يطلبون أبداً مدفوعات عبر واتساب', 'الطلب يتجاوز عمليات المشتريات المعتادة', 'سرية مبالغ فيها ("لا تخبر أحداً")', 'تغيير مفاجئ في حساب الدفع أو المستفيد'],
    tip_en: 'Verify any payment request with a direct phone call to the known number. Never rely on a WhatsApp message alone.',
    tip_ar: 'تحقق من أي طلب دفع عبر مكالمة هاتفية مباشرة على الرقم المعروف. لا تعتمد أبداً على رسالة واتساب وحدها.',
  },
];


const RESOURCES = [
  { name: 'Saudi National Cybersecurity Authority', name_ar: 'الهيئة الوطنية للأمن السيبراني', url: 'https://nca.gov.sa', flagImg: 'https://flagcdn.com/w40/sa.png', desc_en: 'Saudi Arabia\'s top cybersecurity authority — alerts, reports, regulations.', desc_ar: 'السلطة السيبرانية العليا في المملكة — تنبيهات وتقارير وأنظمة.' },
  { name: 'Have I Been Pwned', name_ar: 'هل تعرّضت للاختراق؟', url: 'https://haveibeenpwned.com', flag: '🔍', desc_en: 'Check if your email or phone appeared in a known data breach.', desc_ar: 'تحقق مما إذا ظهر بريدك الإلكتروني أو هاتفك في اختراق بيانات معروف.' },
  { name: 'SANS Security Awareness', name_ar: 'توعية سانس الأمنية', url: 'https://www.sans.org/security-awareness-training/', flag: '📚', desc_en: 'Free awareness resources and the OUCH! newsletter (available in Arabic).', desc_ar: 'موارد توعوية مجانية ونشرة OUCH! الإخبارية (متوفرة باللغة العربية).' },
  { name: 'VirusTotal', name_ar: 'فايروس توتال', url: 'https://www.virustotal.com', flag: '🛡️', desc_en: 'Scan any suspicious URL or file for malware using 70+ antivirus engines.', desc_ar: 'افحص أي رابط أو ملف مشبوه باستخدام أكثر من 70 محرك مكافحة فيروسات.' },
];

// ---------------------------------------------------------------------------
// URL analysis utility (frontend-only)
// ---------------------------------------------------------------------------

const SHORT_DOMAINS = new Set(['bit.ly', 't.co', 'goo.gl', 'is.gd', 'buff.ly', 'ow.ly', 'tinyurl.com', 'short.io', 'rb.gy', 'cutt.ly', 'shorturl.at']);
const SUSPICIOUS_TLDS = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.click', '.download', '.work', '.loan', '.racing', '.win', '.top'];
const MENA_BRANDS = ['absher', 'stc', 'mobily', 'zain', 'aramco', 'tamara', 'tabby', 'rajhi', 'alrajhi', 'ncb', 'snb', 'adcb', 'etisalat', 'nafath', 'tawakkalna', 'citc', 'sama', 'zatca', 'hajj', 'paypal', 'amazon', 'microsoft', 'apple', 'google'];

function analyzeURL(raw) {
  let url = raw.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.toLowerCase();
    const parts = hostname.split('.');
    const tld = '.' + parts[parts.length - 1];
    const mainDomain = parts.length >= 2 ? parts[parts.length - 2] : '';
    const subdomain = parts.length > 2 ? parts.slice(0, -2).join('.') : '';
    const findings = [];

    if (parsed.protocol !== 'https:') findings.push({ type: 'danger', text_en: 'Not using HTTPS — data sent to this site is not encrypted.', text_ar: 'لا يستخدم HTTPS — البيانات المرسلة لهذا الموقع غير مشفرة.' });
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) findings.push({ type: 'danger', text_en: 'IP address used as domain — legitimate sites use domain names, not raw IPs.', text_ar: 'عنوان IP يُستخدم كنطاق — المواقع الشرعية تستخدم أسماء نطاقات وليس عناوين IP خام.' });
    if (SHORT_DOMAINS.has(hostname)) findings.push({ type: 'warning', text_en: 'URL shortener detected — the real destination is hidden from you.', text_ar: 'تم اكتشاف مُقصِّر روابط — الوجهة الحقيقية مخفية عنك.' });
    if (SUSPICIOUS_TLDS.some(t => hostname.endsWith(t))) findings.push({ type: 'danger', text_en: `Suspicious TLD: "${tld}" — frequently used in malicious campaigns.`, text_ar: `امتداد نطاق مشبوه: "${tld}" — يُستخدم كثيراً في الحملات الخبيثة.` });
    const matchedBrand = MENA_BRANDS.find(b => subdomain.includes(b) && !mainDomain.includes(b));
    if (matchedBrand) findings.push({ type: 'danger', text_en: `"${matchedBrand}" appears in the subdomain but not the real domain — a classic impersonation trick.`, text_ar: `"${matchedBrand}" يظهر في النطاق الفرعي وليس في النطاق الأصلي — خدعة انتحال هوية كلاسيكية.` });
    if (/[^\x00-\x7F]/.test(hostname)) findings.push({ type: 'danger', text_en: 'Non-ASCII characters detected — possible homograph attack using look-alike letters.', text_ar: 'تم اكتشاف أحرف غير ASCII — هجوم محتمل بأحرف متشابهة.' });
    if (parts.length > 4) findings.push({ type: 'warning', text_en: `Excessive subdomains (${parts.length - 2} levels) — legitimate sites rarely exceed 2.`, text_ar: `نطاقات فرعية مفرطة (${parts.length - 2} مستويات) — المواقع الشرعية نادراً ما تتجاوز مستويين.` });
    if (/\d/.test(mainDomain) && mainDomain.length > 3) findings.push({ type: 'warning', text_en: `Numbers in domain name: "${mainDomain}" — may mimic a well-known brand (e.g. paypa1).`, text_ar: `أرقام في اسم النطاق: "${mainDomain}" — قد يقلّد علامة تجارية معروفة (مثل paypa1).` });
    if (hostname.length > 45) findings.push({ type: 'warning', text_en: 'Unusually long hostname — legitimate brands use short, memorable domains.', text_ar: 'اسم مضيف طويل بشكل غير عادي — العلامات التجارية الشرعية تستخدم نطاقات قصيرة وسهلة التذكر.' });
    if (parsed.protocol === 'https:') findings.push({ type: 'safe', text_en: 'HTTPS is enabled — connection is encrypted.', text_ar: 'HTTPS مُفعَّل — الاتصال مشفر.' });

    const riskLevel = findings.some(f => f.type === 'danger') ? 'danger' : findings.some(f => f.type === 'warning') ? 'warning' : 'safe';
    return { ok: true, hostname, mainDomain, subdomain, tld, protocol: parsed.protocol, findings, riskLevel };
  } catch {
    return { ok: false };
  }
}

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const THREAT_COLORS = {
  red: { badge: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', border: 'border-l-red-500', icon: 'text-red-500' },
  orange: { badge: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400', border: 'border-l-orange-500', icon: 'text-orange-500' },
  blue: { badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', border: 'border-l-blue-500', icon: 'text-blue-500' },
  purple: { badge: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', border: 'border-l-purple-500', icon: 'text-purple-500' },
  green: { badge: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', border: 'border-l-green-500', icon: 'text-green-500' },
  yellow: { badge: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400', border: 'border-l-yellow-500', icon: 'text-yellow-500' },
};

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function DailyChallenge({ t, lang }) {
  const [challenge, setChallenge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const isRTL = lang === 'ar';

  const load = useCallback(async () => {
    setLoading(true);
    setError(false);
    setRevealed(false);
    try {
      const res = await communityAPI.getDailyChallenge(lang);
      setChallenge(res.data);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [lang]);

  useEffect(() => { load(); }, [load]);

  const diffLabel = challenge ? (t(`community.challenge.difficulty.${challenge.difficulty}`) || challenge.difficulty) : '';

  if (loading) {
    return (
      <div className="card flex items-center justify-center py-16 gap-3 text-gray-500 dark:text-gray-400">
        <RefreshCw className="h-5 w-5 animate-spin" />
        <span>{t('community.challenge.loadingMsg')}</span>
      </div>
    );
  }

  if (error || !challenge) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 gap-4 text-gray-500 dark:text-gray-400">
        <AlertTriangle className="h-8 w-8 text-warning-500" />
        <p>{t('community.challenge.errorMsg')}</p>
        <button onClick={load} className="btn-secondary text-sm">
          <RefreshCw className="h-4 w-4 me-2" /> Retry
        </button>
      </div>
    );
  }

  const name = (isRTL && challenge.name_ar) ? challenge.name_ar : challenge.name;

  return (
    <div className="card space-y-4">
      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium px-2 py-0.5 rounded bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
          {name}
        </span>
        <span className={`text-xs font-medium px-2 py-0.5 rounded ${
          challenge.difficulty === 'EASY' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
          challenge.difficulty === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
          challenge.difficulty === 'HARD' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' :
          'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
        }`}>
          {t('community.challenge.difficultyLabel')}: {diffLabel}
        </span>
      </div>

      {/* Email envelope preview */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {/* Email header */}
        <div className="bg-gray-50 dark:bg-gray-800 px-4 py-3 border-b border-gray-200 dark:border-gray-700 space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-gray-500 dark:text-gray-400 w-16 shrink-0">{t('community.challenge.from')}:</span>
            <span className="text-gray-800 dark:text-gray-200">{challenge.sender_name} &lt;{challenge.sender_email}&gt;</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-gray-500 dark:text-gray-400 w-16 shrink-0">{t('community.challenge.subject')}:</span>
            <span className="font-semibold text-gray-900 dark:text-white">{challenge.subject}</span>
          </div>
        </div>

        {/* Email body — full height, scaled down slightly. Sanitised
            with DOMPurify so a malicious template body cannot execute
            scripts in the page that holds our auth tokens. */}
        <div
          className="bg-white dark:bg-gray-900 text-sm"
          style={{ zoom: 0.85 }}
          dangerouslySetInnerHTML={{
            __html: DOMPurify.sanitize(challenge.body_html || '', SANITIZE_CONFIG),
          }}
        />
      </div>

      {/* Reveal / hide toggle */}
      <button
        onClick={() => setRevealed(r => !r)}
        className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
          revealed
            ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            : 'bg-danger-600 hover:bg-danger-700 text-white'
        }`}
      >
        {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        {revealed ? t('community.challenge.hideBtn') : t('community.challenge.revealBtn')}
      </button>

      {/* Red flags */}
      {revealed && (
        <div className="rounded-lg border border-danger-200 dark:border-danger-800 bg-danger-50 dark:bg-danger-900/20 p-4 space-y-3">
          <h4 className="font-semibold text-danger-700 dark:text-danger-400 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            {t('community.challenge.redFlagsTitle')} ({challenge.red_flags?.length ?? 0})
          </h4>
          <ul className="space-y-2">
            {(challenge.red_flags || []).map((flag, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <XCircle className="h-4 w-4 text-danger-500 mt-0.5 shrink-0" />
                {flag}
              </li>
            ))}
          </ul>
          {(isRTL ? challenge.landing_page_message_ar : challenge.landing_page_message) && (
            <p className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-danger-200 dark:border-danger-800">
              {isRTL ? challenge.landing_page_message_ar : challenge.landing_page_message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function ThreatCard({ threat, t, lang }) {
  const [open, setOpen] = useState(false);
  const isRTL = lang === 'ar';
  const colors = THREAT_COLORS[threat.color] || THREAT_COLORS.red;
  const Icon = threat.icon;

  return (
    <div className={`card border-l-4 ${colors.border} space-y-3`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 shrink-0 ${colors.icon}`} />
          <div>
            <span className={`text-xs font-medium px-2 py-0.5 rounded ${colors.badge}`}>
              {isRTL ? threat.category_ar : threat.category_en}
            </span>
            <h3 className="mt-1 text-base font-semibold text-gray-900 dark:text-white">
              {isRTL ? threat.title_ar : threat.title_en}
            </h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              {isRTL ? threat.desc_ar : threat.desc_en}
            </p>
          </div>
        </div>
        <button
          onClick={() => setOpen(o => !o)}
          className="shrink-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          aria-label="Toggle details"
        >
          {open ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </button>
      </div>

      {open && (
        <div className="space-y-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5">
              {t('community.threatWatch.redFlagsLabel')}
            </p>
            <ul className="space-y-1">
              {(isRTL ? threat.flags_ar : threat.flags_en).map((flag, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <XCircle className="h-3.5 w-3.5 text-danger-500 mt-0.5 shrink-0" />
                  {flag}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-md bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 px-3 py-2">
            <p className="text-xs font-semibold text-success-700 dark:text-success-400 mb-0.5">
              {t('community.threatWatch.learnMore')}
            </p>
            <p className="text-sm text-success-800 dark:text-success-300">
              {isRTL ? threat.tip_ar : threat.tip_en}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function URLInspector({ t, lang }) {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const isRTL = lang === 'ar';

  const analyze = () => {
    if (!input.trim()) return;
    setResult(analyzeURL(input));
  };

  const clear = () => { setInput(''); setResult(null); };

  const riskConfig = result ? {
    safe: { label: t('community.urlInspector.safe'), icon: CheckCircle, cls: 'text-success-600 dark:text-success-400' },
    warning: { label: t('community.urlInspector.warning'), icon: AlertTriangle, cls: 'text-warning-600 dark:text-warning-400' },
    danger: { label: t('community.urlInspector.danger'), icon: XCircle, cls: 'text-danger-600 dark:text-danger-400' },
  }[result.riskLevel] : null;

  return (
    <div className="card space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && analyze()}
          placeholder={t('community.urlInspector.placeholder')}
          dir="ltr"
          className="input flex-1 text-sm font-mono"
        />
        <button onClick={analyze} className="btn-primary text-sm px-4">{t('community.urlInspector.analyzeBtn')}</button>
        {result && <button onClick={clear} className="btn-secondary text-sm px-4">{t('community.urlInspector.clearBtn')}</button>}
      </div>

      {result && !result.ok && (
        <p className="text-sm text-danger-600 dark:text-danger-400 flex items-center gap-2">
          <XCircle className="h-4 w-4" /> Invalid URL — make sure to include the domain.
        </p>
      )}

      {result?.ok && (
        <div className="space-y-4">
          {/* Risk banner */}
          {riskConfig && (() => {
            const Icon = riskConfig.icon;
            return (
              <div className={`flex items-center gap-2 font-semibold ${riskConfig.cls}`}>
                <Icon className="h-5 w-5" /> {riskConfig.label}
              </div>
            );
          })()}

          {/* Domain breakdown */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
            {[
              { label: t('community.urlInspector.sections.protocol'), value: result.protocol.replace(':', '') },
              { label: t('community.urlInspector.sections.domain'), value: result.mainDomain + result.tld },
              result.subdomain && { label: 'Subdomain', value: result.subdomain },
            ].filter(Boolean).map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-gray-800 rounded p-2">
                <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                <p className="font-mono font-medium text-gray-800 dark:text-gray-200 truncate">{value}</p>
              </div>
            ))}
          </div>

          {/* Findings */}
          {result.findings.length > 0 ? (
            <ul className="space-y-2">
              {result.findings.map((f, i) => {
                const Icon = f.type === 'safe' ? CheckCircle : f.type === 'warning' ? AlertTriangle : XCircle;
                const cls = f.type === 'safe' ? 'text-success-600 dark:text-success-400' : f.type === 'warning' ? 'text-warning-600 dark:text-warning-400' : 'text-danger-600 dark:text-danger-400';
                const text = isRTL ? f.text_ar : f.text_en;
                return (
                  <li key={i} className="flex items-start gap-2 text-sm">
                    <Icon className={`h-4 w-4 mt-0.5 shrink-0 ${cls}`} />
                    <span className="text-gray-700 dark:text-gray-300">{text}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('community.urlInspector.noFindings')}</p>
          )}
        </div>
      )}
    </div>
  );
}

function ResourcesList({ t, lang }) {
  const isRTL = lang === 'ar';
  return (
    <div className="space-y-3">
      {RESOURCES.map(res => (
        <a
          key={res.url}
          href={res.url}
          target="_blank"
          rel="noopener noreferrer"
          className="card group hover:border-primary-300 dark:hover:border-primary-700 transition-colors flex items-start gap-3"
        >
          {res.flagImg
            ? <img src={res.flagImg} alt="" className="w-8 h-5 object-cover rounded-sm shrink-0 mt-0.5" />
            : <span className="text-2xl shrink-0">{res.flag}</span>
          }
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 text-sm">
                {isRTL ? res.name_ar : res.name}
              </h3>
              <ExternalLink className="h-4 w-4 text-gray-400 group-hover:text-primary-500 shrink-0 mt-0.5" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {isRTL ? res.desc_ar : res.desc_en}
            </p>
          </div>
        </a>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

function SectionHeader({ icon: Icon, title, subtitle, color = 'text-primary-600' }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`h-6 w-6 ${color}`} />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h2>
      </div>
      {subtitle && <p className="text-gray-500 dark:text-gray-400 text-sm ms-8">{subtitle}</p>}
    </div>
  );
}

function CommunityPortal() {
  const { t, i18n } = useTranslation();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const isRTL = lang === 'ar';

  return (
    <div className="fade-in py-10" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">

        {/* Page header */}
        <div className="text-center">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-3">
            {t('community.title')}
          </h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
            {t('community.subtitle')}
          </p>
        </div>

        {/* 1. Daily Challenge */}
        <section>
          <SectionHeader
            icon={Zap}
            title={t('community.challenge.title')}
            subtitle={t('community.challenge.subtitle')}
            color="text-warning-500"
          />
          <DailyChallenge t={t} lang={lang} />
        </section>

        {/* 2. MENA Threat Watch */}
        <section>
          <SectionHeader
            icon={Shield}
            title={t('community.threatWatch.title')}
            subtitle={t('community.threatWatch.subtitle')}
            color="text-danger-600"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {THREAT_DATA.map(threat => (
              <ThreatCard key={threat.id} threat={threat} t={t} lang={lang} />
            ))}
          </div>
        </section>

        {/* 3. URL Inspector + Trusted Resources — two-column on large screens */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <section>
            <SectionHeader
              icon={Search}
              title={t('community.urlInspector.title')}
              subtitle={t('community.urlInspector.subtitle')}
              color="text-primary-600"
            />
            <URLInspector t={t} lang={lang} />
          </section>

          <section>
            <SectionHeader
              icon={Globe}
              title={t('community.resources.title')}
              subtitle={t('community.resources.subtitle')}
              color="text-success-600"
            />
            <ResourcesList t={t} lang={lang} />
          </section>
        </div>

      </div>
    </div>
  );
}

export default CommunityPortal;
