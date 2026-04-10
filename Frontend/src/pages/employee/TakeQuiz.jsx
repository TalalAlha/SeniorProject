/**
 * TakeQuiz — Interactive phishing quiz page for employees (/employee/quizzes/:id).
 *
 * Renders the full quiz experience:
 *  1. Intro screen — campaign info, estimated time, start button
 *  2. Question screen — Gmail-style email viewer displaying the email to classify
 *     - Employee selects PHISHING or LEGITIMATE
 *     - For PHISHING answers: red-flag checkbox panel (scored separately)
 *     - Confidence slider (1–5) and time-on-question timer
 *  3. Results screen — score, accuracy, phishing detection rate, per-question review
 *
 * Scoring model (hybrid):
 *  - PHISHING correct: 50 base + up to 50 from red-flag selections
 *  - LEGITIMATE correct: 100 (50 base + 50 bonus)
 *  - Wrong answer: 0
 *  Flag score and flag_max_score are computed frontend-side and sent with each answer.
 *
 * Answer submission: POST /api/v1/campaigns/quizzes/{id}/answer_question/
 * Quiz finalization: POST /api/v1/campaigns/quizzes/{id}/submit/
 * Results:           GET  /api/v1/campaigns/quizzes/{id}/result/
 *
 * Quiz ID is read from the :id URL parameter via useParams().
 * Requires EMPLOYEE role.
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  User,
  Paperclip,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Download,
  Info,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Award,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { campaignsAPI } from '../../api';

// ── Email rendering helpers ──────────────────────────────────────────────────

/** Detect Arabic characters in a string */
const isArabicText = (text = '') => /[\u0600-\u06FF]/.test(text);

/**
 * Return a realistic-looking date/time string, slightly offset per question
 * so consecutive emails don't all show the same time.
 */
const formatEmailDate = (index = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - (75 + index * 47));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Wrap currency amounts, time-period phrases, and (for phishing emails)
 * suspicious phrases in styled React nodes.
 * Amounts          → bold dark gray
 * Deadlines        → bold blue
 * Phishing phrases → yellow highlight
 */
const enhanceInlineText = (text, emailType = 'LEGITIMATE') => {
  if (!text) return text;

  const splitPattern =
    emailType === 'PHISHING'
      ? /(\$[\d,]+(?:\.\d{2})?|[\d,]+\s*ريال|\d+\s*(?:business\s+)?(?:hours?|days?|ساعة|يوم|أيام)|click\s+here|click\s+below|verify\s+your\s+\w+|urgent|immediately|restricted|locked|unusual\s+activity|unauthorized\s+access)/gi
      : /(\$[\d,]+(?:\.\d{2})?|[\d,]+\s*ريال|\d+\s*(?:business\s+)?(?:hours?|days?|ساعة|يوم|أيام))/gi;

  const parts = text.split(splitPattern).filter(Boolean);

  return parts.map((part, i) => {
    const isAmount = /^\$[\d,]+(?:\.\d{2})?$/.test(part) || /^[\d,]+\s*ريال$/.test(part);
    if (isAmount) {
      // Phishing: oversized green (over-formatted); Legitimate: clean dark gray
      return emailType === 'PHISHING' ? (
        <strong key={i} className="text-emerald-600 font-bold text-[17px]">
          {part}
        </strong>
      ) : (
        <strong key={i} className="font-bold text-gray-900 dark:text-white">
          {part}
        </strong>
      );
    }
    if (/^\d+\s*(?:business\s+)?(?:hours?|days?|ساعة|يوم|أيام)$/i.test(part)) {
      return (
        <strong key={i} className="font-semibold text-blue-700">
          {part}
        </strong>
      );
    }
    if (
      emailType === 'PHISHING' &&
      /^(?:click\s+here|click\s+below|verify\s+your\s+\w+|urgent|immediately|restricted|locked|unusual\s+activity|unauthorized\s+access)$/i.test(part)
    ) {
      // Phishing: aggressive red+uppercase (excessive formatting clue)
      return (
        <strong key={i} className="text-red-600 font-bold uppercase">
          {part}
        </strong>
      );
    }
    return part;
  });
};

/**
 * Return a full button class string (background + shadow) based on email type
 * and question index — varies style beyond just color.
 */
const getButtonStyle = (emailType, index) => {
  const phishingStyles = [
    'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl',
    'bg-red-600 border-2 border-red-700 shadow-md hover:shadow-lg',
    'bg-gradient-to-r from-orange-500 to-red-600 shadow-lg hover:shadow-xl',
    'bg-slate-800 border border-slate-600 shadow-xl hover:shadow-2xl',
  ];
  const legitimateStyles = [
    'bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg hover:shadow-xl',
    'bg-gradient-to-r from-green-600 to-green-700 shadow-lg hover:shadow-xl',
    'bg-slate-700 border border-slate-500 shadow-md hover:shadow-lg',
  ];
  const palette = emailType === 'PHISHING' ? phishingStyles : legitimateStyles;
  return palette[index % palette.length];
};

/** Urgency keyword patterns */
const URGENCY_PATTERNS = [
  /urgent/i,
  /immediate/i,
  /action\s+required/i,
  /within\s+24\s+hours?/i,
  /عاجل/,
  /فوري/,
  /خلال\s+24\s+ساعة/,
];

/**
 * Render email body paragraphs and, when actionable link keywords are
 * detected, append a centered CTA button at the end.
 * – First paragraph: larger, bolder, with a subtle left-border callout
 * – Remaining paragraphs: standard body text with improved line height
 * – Phishing phrases highlighted in yellow via enhanceInlineText
 */
const formatEmailBody = (body = '', isRtl = false, emailType = 'LEGITIMATE', questionIndex = 0, senderEmail = '') => {
  if (!body) return null;

  const hasLink = isRtl
    ? /رابط|انقر|اضغط|تحقق|حدث/.test(body)
    : /\blink\b|\bclick\b|\bverify\b|\bupdate\b|\bconfirm\b|\breschedule\b/i.test(body);

  // Phishing: amplify single ! → !!! to simulate over-formatted scam emails
  const displayBody = emailType === 'PHISHING' ? body.replace(/!(?!!)/g, '!!!') : body;
  const paragraphs = displayBody.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const buttonStyle = getButtonStyle(emailType, questionIndex);

  // Direction-aware left-border callout for the opening paragraph
  const firstParaClass = isRtl
    ? 'text-[15px] font-semibold text-gray-900 dark:text-white leading-relaxed border-r-4 border-blue-400 pr-4 py-2'
    : 'text-[15px] font-semibold text-gray-900 dark:text-white leading-relaxed border-l-4 border-blue-400 pl-4 py-2';

  return (
    <div className="space-y-5 animate-fade-in">
      {paragraphs.map((para, idx) => {
        const lines = para.split('\n');
        const isFirst = idx === 0;
        return (
          <p
            key={idx}
            className={isFirst ? firstParaClass : 'text-[15px] text-gray-700 dark:text-gray-200 leading-[1.8]'}
          >
            {lines.map((line, li) => (
              <span key={li}>
                {enhanceInlineText(line, emailType)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}

      {hasLink && (
        <div className="flex justify-center pt-4 pb-2">
          <div className="relative group">
            {/* Button */}
            <div
              className={`inline-flex items-center gap-2 px-6 py-3 ${buttonStyle} text-white rounded-lg hover:-translate-y-0.5 hover:scale-105 transition-all duration-200 cursor-default select-none ${isRtl ? 'flex-row-reverse' : ''}`}
            >
              <ExternalLink className="h-4 w-4 flex-shrink-0" />
              <span className="font-semibold text-base">
                {isRtl ? 'انقر هنا' : 'Click Here'}
              </span>
            </div>
            {/* URL preview tooltip — appears on hover */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 absolute left-1/2 -translate-x-1/2 bottom-full mb-2 z-50 pointer-events-none">
              <div className="bg-gray-900 text-white rounded-lg shadow-2xl px-4 py-3 min-w-[260px] max-w-[320px]">
                <div className={`flex items-center gap-1.5 text-[10px] text-gray-400 uppercase tracking-wide mb-1.5 ${isRtl ? 'flex-row-reverse' : ''}`}>
                  <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  {isRtl ? 'معاينة الرابط' : 'Link Preview'}
                </div>
                <p className="font-mono text-xs break-all text-gray-100 leading-relaxed">
                  {generateLinkUrl(senderEmail, emailType, questionIndex)}
                </p>
              </div>
              <div className="flex justify-center">
                <div className="border-8 border-transparent border-t-gray-900 -mt-1" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/** Estimate reading time in minutes (200 wpm average). */
const getReadTime = (text = '') => {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
};

// ── Link hover preview ───────────────────────────────────────────────────────

const PHISHING_PATHS = [
  '/account/verify.php',
  '/login/confirm.aspx',
  '/secure/validate.html',
  '/verify-identity.php',
  '/account-update.asp',
  '/confirm-details.php',
  '/security/verify.html',
  '/signin/update.php',
];

const LEGITIMATE_PATHS = [
  '/portal/employee',
  '/intranet/announcements',
  '/hr/benefits',
  '/resources/training',
  '/employee/dashboard',
];

const SESSION_IDS = ['x4k2m9p', 'r7n1q5w', 'b8j3s6t', 'h2f9k4v', 'm1d7p3n', 'q5t8g2c'];
const USER_IDS = ['475829', '312056', '638741', '291834', '583920', '147263'];

/**
 * Build a URL whose domain is extracted from the sender email so the hover
 * tooltip always matches the From address — no more domain mismatch.
 * Phishing:   http://  + suspicious path + query params
 * Legitimate: https:// + clean intranet path
 */
const generateLinkUrl = (senderEmail, emailType, index) => {
  const domain =
    (senderEmail || '').split('@')[1] ||
    (emailType === 'PHISHING' ? 'paypa1.com' : 'company.sa');

  if (emailType === 'PHISHING') {
    const path = PHISHING_PATHS[index % PHISHING_PATHS.length];
    const session = SESSION_IDS[index % SESSION_IDS.length];
    const userId = USER_IDS[index % USER_IDS.length];
    return `http://${domain}${path}?session=${session}&user=${userId}&verify=true`;
  }

  return `https://${domain}${LEGITIMATE_PATHS[index % LEGITIMATE_PATHS.length]}`;
};

// ── Sender email fallback (Feature 2) ────────────────────────────────────────

const PHISHING_DOMAINS = [
  'paypa1.com', 'microsfot.com', 'goog1e.com',
  'app1e.com', 'netf1ix.com', 'paypal-verify.net',
  'microsoft-security.com', 'amazon-account.net', 'bank-secure-a1ert.net',
];
const EMAIL_PREFIXES = ['security', 'noreply', 'support', 'accounts', 'verify', 'notification'];

/**
 * Fallback sender email used only when the backend field is empty.
 * Index-based selection keeps the result deterministic across renders.
 */
const generateSenderEmail = (senderName, emailType, index) => {
  if (emailType === 'PHISHING') {
    return `${EMAIL_PREFIXES[index % EMAIL_PREFIXES.length]}@${PHISHING_DOMAINS[index % PHISHING_DOMAINS.length]}`;
  }
  return `${(senderName || 'noreply').toLowerCase().replace(/\s+/g, '.')}@company.sa`;
};

// ── Email signature data (Feature 3) ─────────────────────────────────────────

const EN_TITLES = [
  'Senior Manager', 'HR Director', 'Finance Manager',
  'IT Administrator', 'Department Head', 'Team Lead',
];
const AR_TITLES = [
  'مدير أول', 'مدير الموارد البشرية', 'مدير المالية',
  'مسؤول تقنية المعلومات', 'رئيس القسم',
];
const PHONE_SUFFIXES = ['1234', '5678', '9012', '3456', '7890', '2345'];

/** Returns deterministic signature metadata based on question index. */
const getSignatureData = (index, isRtl) => ({
  title: isRtl ? AR_TITLES[index % AR_TITLES.length] : EN_TITLES[index % EN_TITLES.length],
  phone: `+966 12 345 ${PHONE_SUFFIXES[index % PHONE_SUFFIXES.length]}`,
  tagline: isRtl ? 'التميز في خدمة العملاء' : 'Excellence in Customer Service',
});

// ── Red flag detection ────────────────────────────────────────────────────────

/**
 * Decoy flags pool — plausible red flags that may or may not be present in
 * any given email. Selecting a decoy flag costs the user points.
 * Using realistic categories (not 'decoy') so the UI doesn't reveal them.
 */
const DECOY_FLAGS = {
  en: [
    { id: 'decoy_spelling',     label: 'Multiple spelling or grammar errors',                          points: -10, category: 'format',  isDecoy: true },
    { id: 'decoy_attachments',  label: 'Contains a suspicious attachment',                             points: -10, category: 'content', isDecoy: true },
    { id: 'decoy_sender_name',  label: "Sender name doesn't match the email address",                  points: -10, category: 'sender',  isDecoy: true },
    { id: 'decoy_time',         label: 'Email sent at an unusual time (late night / early morning)',   points: -10, category: 'format',  isDecoy: true },
    { id: 'decoy_images',       label: 'Contains suspicious images or fake logos',                     points: -10, category: 'content', isDecoy: true },
    { id: 'decoy_reply',        label: 'Reply-to address is different from the sender address',        points: -10, category: 'sender',  isDecoy: true },
    { id: 'decoy_cc',           label: "CC'd to multiple unknown recipients",                          points: -10, category: 'content', isDecoy: true },
  ],
  ar: [
    { id: 'decoy_spelling',     label: 'أخطاء إملائية أو نحوية متعددة',                              points: -10, category: 'format',  isDecoy: true },
    { id: 'decoy_attachments',  label: 'يحتوي على ملف مرفق مشبوه',                                   points: -10, category: 'content', isDecoy: true },
    { id: 'decoy_sender_name',  label: 'اسم المرسل لا يتطابق مع عنوان البريد الإلكتروني',           points: -10, category: 'sender',  isDecoy: true },
    { id: 'decoy_time',         label: 'تم الإرسال في وقت غير عادي (في وقت متأخر من الليل)',         points: -10, category: 'format',  isDecoy: true },
    { id: 'decoy_images',       label: 'يحتوي على صور مشبوهة أو شعارات مزيفة',                      points: -10, category: 'content', isDecoy: true },
    { id: 'decoy_reply',        label: 'عنوان الرد يختلف عن عنوان المرسل',                           points: -10, category: 'sender',  isDecoy: true },
    { id: 'decoy_cc',           label: 'نسخة إلى عدة مستلمين غير معروفين',                           points: -10, category: 'content', isDecoy: true },
  ],
};

/**
 * Decoy IDs that overlap with real flag IDs conceptually — we exclude the
 * decoy when the real flag has already been detected to avoid showing the
 * same concept twice.
 */
const DECOY_REAL_CONFLICTS = {
  decoy_spelling: 'poor_grammar',
};

/**
 * Core detector: finds only the REAL red flags present in the email.
 * Returns an array of flag objects: { id, label, points, category }
 */
const detectRealFlagsOnly = (question, language = 'en') => {
  const flags = [];
  const body = question.email_body || '';
  const senderEmail = (question.email_sender_email || '').toLowerCase();

  // 1. Suspicious sender domain
  const domain = senderEmail.split('@')[1] || '';
  const suspiciousDomainPatterns = [/\d/, /verify|secure|alert|account-/i, /-com\.net|-net\.com/i];
  const isSuspiciousDomain =
    suspiciousDomainPatterns.some((p) => p.test(domain)) || !domain.endsWith('company.sa');

  if (isSuspiciousDomain && question.email_type === 'PHISHING') {
    flags.push({
      id: 'suspicious_domain',
      label:
        language === 'ar'
          ? 'نطاق المرسل مشبوه (مثل: paypa1.com بدلاً من paypal.com)'
          : 'Suspicious sender domain (e.g., paypa1.com instead of paypal.com)',
      points: 20,
      category: 'sender',
    });
  }

  // 2. Generic greeting
  if (/dear (customer|user|member|sir|madam|valued|client)/i.test(body)) {
    flags.push({
      id: 'generic_greeting',
      label:
        language === 'ar'
          ? 'تحية عامة (عزيزي العميل بدلاً من الاسم الشخصي)'
          : 'Generic greeting (Dear Customer instead of personal name)',
      points: 15,
      category: 'content',
    });
  }

  // 3. Urgency / time pressure
  if (
    /urgent|immediately|asap|within \d+\s*(hours?|days?)|act now|limited time|expires|عاجل|فوراً|خلال|حالاً/i.test(
      body
    )
  ) {
    flags.push({
      id: 'urgency',
      label:
        language === 'ar'
          ? 'لغة الإلحاح والضغط الزمني (خلال 24 ساعة، إجراء عاجل)'
          : 'Urgency and time pressure (within 24 hours, act now)',
      points: 20,
      category: 'content',
    });
  }

  // 4. Threats
  if (
    /suspend|suspended|block|blocked|restrict|close|closed|terminate|terminated|freeze|frozen|deactivate|تعليق|حظر|إغلاق|تجميد|إلغاء/i.test(
      body
    )
  ) {
    flags.push({
      id: 'threats',
      label:
        language === 'ar'
          ? 'تهديدات (تعليق الحساب، حظر الوصول، إغلاق الخدمة)'
          : 'Threats (account suspension, access blocking, service termination)',
      points: 20,
      category: 'content',
    });
  }

  // 5. Requests personal / sensitive information
  if (
    /password|credit card|debit card|ssn|social security|pin|otp|cvv|account number|routing number|كلمة المرور|كلمة السر|رقم سري|بطاقة ائتمان|رقم الحساب/i.test(
      body
    )
  ) {
    flags.push({
      id: 'personal_info',
      label:
        language === 'ar'
          ? 'طلب معلومات شخصية حساسة (كلمة المرور، بطاقة ائتمان، رقم حساب)'
          : 'Requests sensitive personal information (password, credit card, account number)',
      points: 25,
      category: 'content',
    });
  }

  // 6. Suspicious link
  if (
    /(click|verify|update|confirm|reset).*link|link.*(below|here|above)|الرابط|انقر|اضغط/i.test(body)
  ) {
    flags.push({
      id: 'suspicious_link',
      label:
        language === 'ar' ? 'طلب النقر على رابط مشبوه' : 'Asks to click a suspicious link',
      points: 20,
      category: 'link',
    });
  }

  // 7. Multiple spelling errors
  const spellingErrors = (
    body.match(
      /\b(recieve|occured|seperrate|definately|occassion|accomodate|beleive|untill|sucessful|adress)\b/gi
    ) || []
  ).length;
  if (spellingErrors >= 2) {
    flags.push({
      id: 'poor_grammar',
      label:
        language === 'ar'
          ? 'أخطاء إملائية أو نحوية متعددة'
          : 'Multiple spelling or grammar errors',
      points: 15,
      category: 'format',
    });
  }

  // 8. No professional signature
  const hasSignature =
    /best regards|sincerely|kind regards|تحياتي|مع تحياتي|وتفضلوا بقبول/i.test(body);
  if (!hasSignature && question.email_type === 'PHISHING') {
    flags.push({
      id: 'no_signature',
      label:
        language === 'ar'
          ? 'لا يوجد توقيع احترافي أو معلومات اتصال'
          : 'Missing professional signature or contact information',
      points: 10,
      category: 'format',
    });
  }

  // 9. Excessive formatting
  const hasExcessiveFormatting =
    (body.match(/!!!/g) || []).length > 0 ||
    (body.match(/[A-Z]{10,}/g) || []).length > 0 ||
    body.includes('⚠️⚠️');

  if (hasExcessiveFormatting) {
    flags.push({
      id: 'excessive_formatting',
      label:
        language === 'ar'
          ? 'تنسيق مبالغ فيه (أحرف كبيرة، رموز تحذير متعددة)'
          : 'Excessive formatting (ALL CAPS, multiple warning symbols)',
      points: 10,
      category: 'format',
    });
  }

  return flags;
};

/**
 * Full detection: real flags + 3-4 random decoys, all shuffled.
 * Returns { allFlags, realFlagIds, decoyFlagIds }
 * Points are NOT shown in the modal — they are revealed only in results.
 */
const detectRedFlags = (question, language = 'en') => {
  const realFlags = detectRealFlagsOnly(question, language);
  const realFlagIdSet = new Set(realFlags.map((f) => f.id));

  // Exclude decoys that conceptually overlap with an already-detected real flag
  const decoyPool = (DECOY_FLAGS[language] || DECOY_FLAGS.en).filter((d) => {
    const conflictId = DECOY_REAL_CONFLICTS[d.id];
    return !conflictId || !realFlagIdSet.has(conflictId);
  });

  // Pick 3-4 random decoys
  const shuffled = [...decoyPool].sort(() => Math.random() - 0.5);
  const count = 3 + Math.floor(Math.random() * 2); // 3 or 4
  const selectedDecoys = shuffled.slice(0, count);

  // Merge and shuffle so decoys aren't bunched at the end
  const allFlags = [...realFlags, ...selectedDecoys].sort(() => Math.random() - 0.5);

  return {
    allFlags,
    realFlagIds: realFlags.map((f) => f.id),
    decoyFlagIds: selectedDecoys.map((f) => f.id),
  };
};

// ─────────────────────────────────────────────────────────────────────────────

function TakeQuiz() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);

  // Red flags modal state
  const [showRedFlagsModal, setShowRedFlagsModal] = useState(false);
  const [selectedFlags, setSelectedFlags] = useState([]);
  const [detectedRedFlags, setDetectedRedFlags] = useState([]);
  // Real / decoy IDs for the currently open modal
  const [realFlagIds, setRealFlagIds] = useState([]);
  const [decoyFlagIds, setDecoyFlagIds] = useState([]);
  // Per-question selected flags stored for results display: { [question_number]: string[] }
  const [answersFlags, setAnswersFlags] = useState({});
  // Per-question full flags data (real + decoys) for accurate results breakdown
  // { [question_number]: { allFlags, realFlagIds, decoyFlagIds } }
  const [questionFlagsData, setQuestionFlagsData] = useState({});
  // question_details returned by the result API (available after quiz completion)
  const [questionDetails, setQuestionDetails] = useState([]);
  // Which accordion item is expanded in the completed results view (index or null)
  const [expandedQuestion, setExpandedQuestion] = useState(null);

  // Time tracking per question
  const questionStartTime = useRef(Date.now());

  const fetchQuizData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const questionsRes = await campaignsAPI.getQuizQuestions(id);
      const data = questionsRes.data;

      setQuizData({
        quiz_id: data.quiz_id,
        campaign_name: data.campaign_name,
        status: data.status,
        total_questions: data.total_questions,
        current_question_index: data.current_question_index,
      });
      setQuestions(data.questions || []);

      // Restore previous answers if quiz was in progress
      const restored = {};
      (data.questions || []).forEach((q) => {
        if (q.answer) {
          restored[q.question_number] = q.answer;
        }
      });
      setAnswers(restored);

      // If quiz was already in progress, resume from where left off
      if (data.current_question_index > 0 && data.status === 'IN_PROGRESS') {
        const resumeIdx = Math.min(
          data.current_question_index,
          (data.questions || []).length - 1
        );
        setCurrentIndex(resumeIdx);
      }

      // If completed, fetch results
      if (data.status === 'COMPLETED') {
        setCompleted(true);
        try {
          const resultRes = await campaignsAPI.getQuizResult(id);
          setResult(resultRes.data.result);
          if (resultRes.data.question_details) {
            setQuestionDetails(resultRes.data.question_details);
          }
        } catch {
          // Result may not exist yet
        }
      } else if (data.status === 'NOT_STARTED') {
        // Auto-start the quiz
        await campaignsAPI.startQuiz(id);
      }

      questionStartTime.current = Date.now();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to load quiz';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  // Reset timer when navigating between questions
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  const handleAnswer = async (answer, flags = [], flagScoreData = null) => {
    const question = questions[currentIndex];
    if (!question) return;

    // Lock answers in assessment mode — once answered, cannot change
    if (answers[question.question_number]) return;

    // Calculate time spent on this question
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);

    // Optimistic update
    setAnswers((prev) => ({ ...prev, [question.question_number]: answer }));
    if (answer === 'PHISHING') {
      setAnswersFlags((prev) => ({ ...prev, [question.question_number]: flags }));
    }

    // Submit answer to backend
    try {
      await campaignsAPI.answerQuestion(id, {
        question_number: question.question_number,
        answer,
        time_spent_seconds: timeSpent,
        selected_flags: flags,
        ...(flagScoreData && {
          flag_score: flagScoreData.score,
          flag_max_score: flagScoreData.maxScore,
        }),
      });
    } catch (err) {
      // Revert on failure
      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[question.question_number];
        return copy;
      });
      toast.error(err.response?.data?.error || 'Failed to save answer');
    }
  };

  // ── Red flags modal handlers ───────────────────────────────────────────────

  const handlePhishingClick = () => {
    const question = questions[currentIndex];
    if (!question) return;
    const flagsData = detectRedFlags(
      {
        email_body: question.email_body,
        email_sender_email: question.email_sender_email,
        email_type: question.email_type,
      },
      i18n.language
    );
    setDetectedRedFlags(flagsData.allFlags);
    setRealFlagIds(flagsData.realFlagIds);
    setDecoyFlagIds(flagsData.decoyFlagIds);
    // Store for results page so we know which were real vs decoy
    setQuestionFlagsData((prev) => ({
      ...prev,
      [question.question_number]: flagsData,
    }));
    setSelectedFlags([]);
    setShowRedFlagsModal(true);
  };

  const toggleFlag = (flagId) => {
    setSelectedFlags((prev) =>
      prev.includes(flagId) ? prev.filter((f) => f !== flagId) : [...prev, flagId]
    );
  };

  const submitWithRedFlags = () => {
    if (selectedFlags.length === 0) {
      toast.error(t('quiz.selectAtLeastOneFlag'));
      return;
    }

    const question = questions[currentIndex];

    // Tally correct selections (real flags the user picked)
    const correctSelections = selectedFlags.filter((id) => realFlagIds.includes(id));
    // Tally penalty selections (decoy flags the user picked)
    const incorrectSelections = selectedFlags.filter((id) => decoyFlagIds.includes(id));
    // Real flags the user did not pick at all
    const missedFlagIds = realFlagIds.filter((id) => !selectedFlags.includes(id));

    const earnedPoints = correctSelections.reduce((sum, id) => {
      const flag = detectedRedFlags.find((f) => f.id === id);
      return sum + (flag?.points || 0);
    }, 0);

    const penaltyPoints = incorrectSelections.reduce((sum, id) => {
      const flag = detectedRedFlags.find((f) => f.id === id);
      return sum + Math.abs(flag?.points || 0);
    }, 0);

    const maxScore = realFlagIds.reduce((sum, id) => {
      const flag = detectedRedFlags.find((f) => f.id === id);
      return sum + (flag?.points || 0);
    }, 0);

    const finalScore = Math.max(0, earnedPoints - penaltyPoints);

    // Persist per-question scoring breakdown for the results page
    if (question) {
      setQuestionFlagsData((prev) => ({
        ...prev,
        [question.question_number]: {
          ...(prev[question.question_number] || {}),
          scoringResult: {
            correct: correctSelections,
            incorrect: incorrectSelections,
            missed: missedFlagIds,
            score: finalScore,
            maxScore,
          },
        },
      }));
    }

    handleAnswer('PHISHING', selectedFlags, { score: finalScore, maxScore });
    setShowRedFlagsModal(false);
    setSelectedFlags([]);
  };

  const handleSubmitQuiz = async () => {
    // Check for unanswered questions
    const unanswered = questions.filter(
      (q) => !answers[q.question_number]
    ).length;

    if (unanswered > 0) {
      toast.error(t('quiz.unansweredWarning', { count: unanswered }));
      return;
    }

    if (!window.confirm(t('quiz.confirmSubmit'))) return;

    setSubmitting(true);
    try {
      const res = await campaignsAPI.submitQuiz(id);
      setCompleted(true);
      setResult(res.data.result);

      // Fetch question details so getQuestionBreakdown has is_correct + email_type
      // from the backend rather than relying on local state (which lacks email_type).
      try {
        const resultRes = await campaignsAPI.getQuizResult(id);
        if (resultRes.data.question_details) {
          setQuestionDetails(resultRes.data.question_details);
        }
      } catch {
        // Non-fatal: results panel will fall back to local answer comparison
      }

      toast.success(t('quiz.quizComplete'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Loading / Error states ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <button onClick={fetchQuizData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ---------- Completed state ----------

  if (completed && result) {
    return (
      <div className="fade-in max-w-2xl mx-auto">
        <div className="card text-center py-10">
          <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t('quiz.quizComplete')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">{quizData?.campaign_name}</p>

          {/* Score */}
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {Math.round(result.score)}%
          </div>
          <p className="text-gray-500 dark:text-gray-400 mb-4">{t('quiz.yourScore')}</p>

          {/* Pass/Fail Badge */}
          {(() => {
            const passThreshold = 70;
            const hasPassed = Math.round(result.score) >= passThreshold;
            return (
              <div className="mb-8">
                <div className={`inline-flex items-center gap-2 px-6 py-3 rounded-full text-lg font-bold ${
                  hasPassed
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300 border-2 border-green-500'
                    : 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-2 border-red-500'
                }`}>
                  {hasPassed ? (
                    <>
                      <CheckCircle className="w-6 h-6" />
                      {i18n.language === 'ar' ? 'نجحت!' : t('quiz.assessmentPassed')}
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6" />
                      {i18n.language === 'ar' ? 'لم تنجح' : t('quiz.assessmentNotPassed')}
                    </>
                  )}
                </div>
                {!hasPassed && (
                  <p className="text-sm text-red-700 dark:text-red-400 mt-2">
                    {i18n.language === 'ar'
                      ? `تحتاج ${passThreshold}٪ للنجاح. يمكنك إعادة المحاولة.`
                      : t('quiz.needToPassMsg', { threshold: passThreshold })}
                  </p>
                )}
              </div>
            );
          })()}

          {/* Leaderboard Impact Card */}
          {(() => {
            const finalScore = Math.round(result.score);
            const basePoints = 30;
            const performanceBonus = Math.floor(finalScore * 0.7);
            const totalEarned = basePoints + performanceBonus;
            return (
              <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-6 mb-6">
                <h4 className="font-semibold text-purple-900 dark:text-purple-300 mb-4 flex items-center gap-2 justify-center">
                  <Award className="w-5 h-5" />
                  {t('quiz.leaderboardImpact')}
                </h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('quiz.basePoints')}</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{basePoints}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('quiz.forCompletion')}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('quiz.performanceBonus')}</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">+{performanceBonus}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{finalScore}% × 0.7</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{t('quiz.totalEarned')}</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalEarned}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{t('quiz.leaderboardPoints')}</p>
                  </div>
                </div>
                <div className="mt-4 text-center">
                  {finalScore >= 90 ? (
                    <p className="text-sm text-green-700 dark:text-green-400 font-medium">{t('quiz.excellentPerformance')}</p>
                  ) : finalScore >= 70 ? (
                    <p className="text-sm text-blue-700 dark:text-blue-400 font-medium">{t('quiz.goodPerformance')}</p>
                  ) : (
                    <p className="text-sm text-orange-700 dark:text-orange-400 font-medium">{t('quiz.keepImproving')}</p>
                  )}
                </div>
              </div>
            );
          })()}

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-success-50 dark:bg-success-500/20 rounded-lg">
              <p className="text-2xl font-bold text-success-700 dark:text-success-500">{result.correct_answers}</p>
              <p className="text-xs text-success-600">{t('quiz.answeredCorrectly')}</p>
            </div>
            <div className="p-4 bg-primary-50 dark:bg-primary-500/20 rounded-lg">
              <p className="text-2xl font-bold text-primary-700">
                {result.phishing_emails_identified}
              </p>
              <p className="text-xs text-primary-600">{t('quiz.phishingDetected')}</p>
            </div>
            <div className="p-4 bg-danger-50 dark:bg-danger-500/20 rounded-lg">
              <p className="text-2xl font-bold text-danger-700">
                {result.phishing_emails_missed}
              </p>
              <p className="text-xs text-danger-600">{t('quiz.phishingMissed')}</p>
            </div>
            <div className="p-4 bg-warning-50 dark:bg-warning-500/20 rounded-lg">
              <p className="text-2xl font-bold text-warning-700">
                {result.false_positives}
              </p>
              <p className="text-xs text-warning-600">{t('quiz.falsePositives')}</p>
            </div>
          </div>

          {/* Risk Level */}
          <div className="mb-6">
            <span
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                result.risk_level === 'LOW' && 'bg-success-100 text-success-800',
                result.risk_level === 'MEDIUM' && 'bg-warning-100 text-warning-800',
                result.risk_level === 'HIGH' && 'bg-danger-100 text-danger-800',
                result.risk_level === 'CRITICAL' && 'bg-danger-200 text-danger-900'
              )}
            >
              {result.risk_level === 'LOW' || result.risk_level === 'MEDIUM' ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Risk Level: {result.risk_level}
            </span>
          </div>

          {(() => {
            // Helper: compute per-question flag breakdown using stored state or API fallback
            const getQuestionBreakdown = (q) => {
              const userAnswer = answers[q.question_number];
              const qData = questionFlagsData[q.question_number];
              const qd = questionDetails.find((d) => d.question_number === q.question_number);
              const userFlagIds = answersFlags[q.question_number] || qd?.selected_flags || [];
              // email_type is NOT in the simple questions list (hidden during quiz to prevent cheating).
              // Use the detailed result (qd) which is returned only after quiz completion.
              const emailType = qd?.email_template?.email_type;
              let correctFlags = [], missedFlags = [], incorrectFlags = [], scoringResult = null;

              if (userAnswer === 'PHISHING') {
                if (qData) {
                  const { allFlags, realFlagIds: rIds, decoyFlagIds: dIds } = qData;
                  correctFlags   = allFlags.filter((f) => rIds.includes(f.id) && userFlagIds.includes(f.id));
                  missedFlags    = allFlags.filter((f) => rIds.includes(f.id) && !userFlagIds.includes(f.id));
                  incorrectFlags = allFlags.filter((f) => dIds.includes(f.id) && userFlagIds.includes(f.id));
                  scoringResult  = qData.scoringResult;
                } else {
                  const realFlags = detectRealFlagsOnly({
                    email_body: q.email_body,
                    email_sender_email: q.email_sender_email || qd?.email_template?.sender_email,
                    email_type: emailType,
                  }, i18n.language);
                  correctFlags = realFlags.filter((f) => userFlagIds.includes(f.id));
                  missedFlags  = realFlags.filter((f) => !userFlagIds.includes(f.id));
                }
              } else if (emailType === 'PHISHING') {
                const realFlags = detectRealFlagsOnly({
                  email_body: q.email_body,
                  email_sender_email: q.email_sender_email || qd?.email_template?.sender_email,
                  email_type: emailType,
                }, i18n.language);
                missedFlags = realFlags;
              }

              return {
                // Use is_correct from backend result; fall back to local comparison if results not loaded yet
                isCorrect: qd ? Boolean(qd.is_correct) : (userAnswer === emailType),
                emailType,
                userAnswer,
                correctFlags,
                missedFlags,
                incorrectFlags,
                scoringResult,
              };
            };

            // Aggregate flag stats for the summary row
            const flagStats = questions.reduce((acc, q) => {
              const { correctFlags, missedFlags, incorrectFlags } = getQuestionBreakdown(q);
              return {
                correct:   acc.correct   + correctFlags.length,
                missed:    acc.missed    + missedFlags.length,
                incorrect: acc.incorrect + incorrectFlags.length,
              };
            }, { correct: 0, missed: 0, incorrect: 0 });

            const resultIsArabic = isArabicText(
              (questions[0]?.email_body || '') + (questions[0]?.email_subject || '')
            );

            return (
              <>
                {/* Flag Detection Summary */}
                {(flagStats.correct + flagStats.missed + flagStats.incorrect) > 0 && (
                  <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                    <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2 justify-center">
                      <Award className="h-4 w-4 text-blue-600" />
                      {t('quiz.redFlagsAccuracy')}
                    </h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-green-600">{flagStats.correct}</p>
                        <p className="text-xs text-green-700 dark:text-green-400">{t('quiz.correctFlags')}</p>
                      </div>
                      <div className="text-center p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-orange-500">{flagStats.missed}</p>
                        <p className="text-xs text-orange-700 dark:text-orange-400">{t('quiz.missedFlags')}</p>
                      </div>
                      <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-2xl font-bold text-red-600">{flagStats.incorrect}</p>
                        <p className="text-xs text-red-700 dark:text-red-400">{t('quiz.incorrectFlags')}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Detailed Results Accordion */}
                <div className="mt-2 text-left space-y-2">
                  <h3 className="text-base font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-3">
                    <AlertTriangle className="h-5 w-5 text-orange-500" />
                    {t('quiz.detailedResults')}
                  </h3>

                  {questions.map((q, idx) => {
                    const {
                      isCorrect, emailType, userAnswer, correctFlags, missedFlags,
                      incorrectFlags, scoringResult,
                    } = getQuestionBreakdown(q);
                    const isExpanded = expandedQuestion === idx;

                    return (
                      <div key={q.question_number} className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                        {/* Accordion header */}
                        <button
                          type="button"
                          onClick={() => setExpandedQuestion(isExpanded ? null : idx)}
                          className={clsx(
                            'w-full p-4 flex items-center justify-between transition-colors text-left',
                            isCorrect ? 'bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30' : 'bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={clsx(
                                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                                isCorrect ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                              )}
                            >
                              {isCorrect ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                                {resultIsArabic ? `السؤال ${q.question_number}` : `Q${q.question_number}`}
                                {q.email_subject && (
                                  <span className="text-gray-500 dark:text-gray-400 font-normal"> — {q.email_subject}</span>
                                )}
                              </p>
                              <p className={clsx('text-xs', isCorrect ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400')}>
                                {isCorrect
                                  ? (userAnswer === 'PHISHING'
                                      ? (resultIsArabic ? 'تصيد احتيالي — صحيح ✓' : 'Phishing — Correct ✓')
                                      : (resultIsArabic ? 'شرعي — صحيح ✓' : 'Legitimate — Correct ✓'))
                                  : (userAnswer === 'PHISHING'
                                      ? (resultIsArabic ? 'هذا كان بريداً شرعياً ✗' : 'This was a legitimate email ✗')
                                      : (resultIsArabic ? 'هذا كان تصيداً احتيالياً ✗' : 'This was a phishing email ✗'))}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                            {scoringResult && scoringResult.maxScore > 0 && (
                              <div className="text-right">
                                <p className="text-sm font-bold text-blue-700 dark:text-blue-400">
                                  {scoringResult.score}
                                  <span className="text-xs text-blue-400 dark:text-blue-500 font-normal">/{scoringResult.maxScore}</span>
                                </p>
                                <p className="text-[10px] text-gray-400 dark:text-gray-500">{resultIsArabic ? 'نقاط' : 'flag pts'}</p>
                              </div>
                            )}
                            {isExpanded
                              ? <ChevronUp className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              : <ChevronDown className="w-4 h-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />}
                          </div>
                        </button>

                        {/* Accordion body */}
                        {isExpanded && (
                          <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 space-y-3">
                            {/* PHISHING answered as PHISHING */}
                            {userAnswer === 'PHISHING' && emailType === 'PHISHING' && (
                              <>
                                {scoringResult && (
                                  <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-400 p-3 rounded">
                                    <p className="text-xs font-semibold text-blue-900 dark:text-blue-300">
                                      {resultIsArabic ? 'نقاط العلامات: ' : 'Flag score: '}
                                      <span className="text-sm">{scoringResult.score}</span>
                                      <span className="text-blue-500 font-normal"> / {scoringResult.maxScore}</span>
                                      {scoringResult.incorrect.length > 0 && (
                                        <span className="text-red-600 font-normal ml-1">
                                          ({resultIsArabic
                                            ? `خصم ${scoringResult.incorrect.length * 10} نقطة`
                                            : `-${scoringResult.incorrect.length * 10} pts penalty`})
                                        </span>
                                      )}
                                    </p>
                                  </div>
                                )}
                                {correctFlags.length > 0 && (
                                  <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded">
                                    <h4 className="font-semibold text-green-800 dark:text-green-300 text-xs mb-2 flex items-center gap-1">
                                      <Check className="w-3.5 h-3.5" />
                                      {t('quiz.correctlyIdentified')} ({correctFlags.length})
                                    </h4>
                                    <ul className="space-y-1">
                                      {correctFlags.map((f) => (
                                        <li key={f.id} className="text-xs text-green-700 dark:text-green-400 flex justify-between gap-2">
                                          <span>• {f.label}</span>
                                          <span className="text-green-600 font-semibold flex-shrink-0">+{f.points}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {incorrectFlags.length > 0 && (
                                  <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                                    <h4 className="font-semibold text-red-800 dark:text-red-300 text-xs mb-1 flex items-center gap-1">
                                      <X className="w-3.5 h-3.5" />
                                      {t('quiz.incorrectSelections')} ({incorrectFlags.length})
                                    </h4>
                                    <p className="text-[10px] text-red-500 dark:text-red-400 mb-2">{t('quiz.theseWereNotInEmail')}</p>
                                    <ul className="space-y-1">
                                      {incorrectFlags.map((f) => (
                                        <li key={f.id} className="text-xs text-red-700 dark:text-red-400 flex justify-between gap-2">
                                          <span>• {f.label}</span>
                                          <span className="text-red-600 font-semibold flex-shrink-0">{f.points}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {missedFlags.length > 0 && (
                                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-xs mb-1 flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      {t('quiz.youMissed')} ({missedFlags.length})
                                    </h4>
                                    <p className="text-[10px] text-orange-500 dark:text-orange-400 mb-2">{t('quiz.theseWerePresent')}</p>
                                    <ul className="space-y-1">
                                      {missedFlags.map((f) => (
                                        <li key={f.id} className="text-xs text-orange-700 dark:text-orange-400">• {f.label}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                {correctFlags.length === 0 && missedFlags.length === 0 && incorrectFlags.length === 0 && (
                                  <p className="text-xs text-gray-400 dark:text-gray-500 italic text-center py-2">
                                    {resultIsArabic ? 'لا تتوفر تفاصيل العلامات' : 'No flag details available'}
                                  </p>
                                )}
                                {scoringResult
                                  && scoringResult.score === scoringResult.maxScore
                                  && scoringResult.maxScore > 0 && (
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 p-3 rounded text-center">
                                      <p className="text-sm font-bold text-yellow-800 dark:text-yellow-300 flex items-center justify-center gap-1">
                                        <Award className="w-4 h-4" />
                                        {t('quiz.perfectFlagScore')}
                                      </p>
                                    </div>
                                  )}
                              </>
                            )}
                            {/* PHISHING answered as LEGITIMATE */}
                            {userAnswer === 'LEGITIMATE' && emailType === 'PHISHING' && (
                              <div className="space-y-2">
                                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                                  <p className="text-sm font-semibold text-red-800 dark:text-red-300">
                                    {resultIsArabic
                                      ? 'كانت هذه رسالة تصيدية! يجب أن تكون الإجابة "تصيد احتيالي".'
                                      : 'This was a phishing email! The correct answer was "Phishing".'}
                                  </p>
                                </div>
                                {missedFlags.length > 0 && (
                                  <div className="bg-orange-50 dark:bg-orange-900/20 border-l-4 border-orange-500 p-3 rounded">
                                    <h4 className="font-semibold text-orange-800 dark:text-orange-300 text-xs mb-2 flex items-center gap-1">
                                      <AlertTriangle className="w-3.5 h-3.5" />
                                      {resultIsArabic ? 'العلامات التحذيرية التي كان يجب ملاحظتها:' : 'Red flags you should have noticed:'}
                                    </h4>
                                    <ul className="space-y-1">
                                      {missedFlags.map((f) => (
                                        <li key={f.id} className="text-xs text-orange-700 dark:text-orange-400">• {f.label}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            )}
                            {/* LEGITIMATE answered correctly */}
                            {userAnswer === 'LEGITIMATE' && emailType === 'LEGITIMATE' && (
                              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded">
                                <p className="text-sm text-green-800 dark:text-green-300 flex items-center gap-2">
                                  <Check className="w-4 h-4 flex-shrink-0" />
                                  {t('quiz.correctlyIdentifiedLegitimate')}
                                </p>
                              </div>
                            )}
                            {/* LEGITIMATE answered as PHISHING (false positive) */}
                            {userAnswer === 'PHISHING' && emailType === 'LEGITIMATE' && (
                              <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                                <p className="text-sm text-red-800 dark:text-red-300 flex items-center gap-2">
                                  <X className="w-4 h-4 flex-shrink-0" />
                                  {resultIsArabic
                                    ? 'هذا كان بريداً شرعياً! تجنب الإيجابيات الكاذبة.'
                                    : 'This was a legitimate email! Avoid false positives.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Key Takeaways */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 text-left">
                  <h4 className="font-semibold text-blue-900 dark:text-blue-300 mb-3 flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-600" />
                    {t('quiz.keyTakeaways')}
                  </h4>
                  <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-300">
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{t('quiz.takeaway1')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{t('quiz.takeaway2')}</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="flex-shrink-0">•</span>
                      <span>{t('quiz.takeaway3')}</span>
                    </li>
                  </ul>
                </div>
              </>
            );
          })()}

          <div className="mt-8">
            <Link to="/employee/quizzes" className="btn-primary">
              {t('quiz.backToQuizzes')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Taking the quiz ----------

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Mail className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
        <p className="text-gray-600 dark:text-gray-400">No questions found for this quiz.</p>
        <Link to="/employee/quizzes" className="btn-secondary mt-4">
          {t('quiz.backToQuizzes')}
        </Link>
      </div>
    );
  }

  const question = questions[currentIndex];
  const selectedAnswer = answers[question.question_number] || null;
  const isAnswered = selectedAnswer !== null;
  const answeredCount = Object.keys(answers).length;
  const allQuestionsAnswered = answeredCount === questions.length;
  const isArabic = isArabicText(
    (question.email_body || '') + (question.email_subject || '')
  );

  // Urgency: any urgency keyword in body or subject
  const isUrgent = URGENCY_PATTERNS.some(
    (p) =>
      p.test(question.email_body || '') || p.test(question.email_subject || '')
  );

  // Deterministic fake attachment for phishing emails that have no real attachment
  const showFakeAttachment =
    question.email_type === 'PHISHING' &&
    !question.has_attachments &&
    (question.question_number || 0) % 2 === 0;

  const sig = getSignatureData(currentIndex, isArabic);

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            {quizData?.campaign_name || t('quiz.takeQuiz')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('quiz.questionOf', {
              current: currentIndex + 1,
              total: questions.length,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-8">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Assessment Instructions — shown before first answer */}
      {answeredCount === 0 && !isAnswered && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
            {i18n.language === 'ar' ? '⚠️ تعليمات الاختبار' : `⚠️ ${t('quiz.assessmentTitle')}`}
          </h4>
          <ul className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
            <li>• {i18n.language === 'ar'
              ? 'لن يتم عرض النتائج حتى إكمال جميع الأسئلة'
              : t('quiz.resultsAfterCompletion')}
            </li>
            <li>• {i18n.language === 'ar'
              ? 'لا يمكن العودة للأسئلة السابقة'
              : t('quiz.cannotGoBack')}
            </li>
            <li>• {i18n.language === 'ar'
              ? 'النسبة المطلوبة للنجاح: 70٪'
              : t('quiz.passThresholdMsg')}
            </li>
          </ul>
        </div>
      )}

      {/* Prompt */}
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-primary-600" />
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {t('quiz.identifyEmail')}
        </p>
      </div>

      {/* Email Client — Gmail-style */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 mb-6 hover:shadow-2xl transition-shadow duration-300">

        {/* ── Toolbar ── */}
        <div className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-2.5 flex items-center justify-between overflow-hidden rounded-t-xl">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 font-medium">
            <Mail className="h-4 w-4" />
            <span>{t('quiz.inbox')}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
              <Clock className="h-3 w-3" />
              <span>{getReadTime(question.email_body)} min read</span>
            </div>
            <MoreVertical className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </div>
        </div>

        {/* ── Urgency badge (shown only when email contains urgency keywords) ── */}
        {isUrgent && (
          <div className="px-6 pt-4 pb-1">
            <div className={`flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded text-sm font-semibold text-red-800 dark:text-red-300 ${isArabic ? 'flex-row-reverse border-l-0 border-r-4 text-right' : ''}`}>
              <AlertTriangle className="h-4 w-4 text-red-600 flex-shrink-0" />
              {isArabic ? 'تنبيه: إجراء عاجل مطلوب' : 'Warning: Urgent Action Required'}
            </div>
          </div>
        )}

        {/* ── Sender row ── */}
        <div className="px-6 pb-5 border-b border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3">
            {/* Initials avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 select-none">
              {(question.email_sender_name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {question.email_sender_name}
                </p>
                <span className="text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                  {formatEmailDate(currentIndex)}
                </span>
              </div>
              <div className="flex items-center gap-2 flex-wrap mt-0.5">
                <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                  &lt;{question.email_sender_email || generateSenderEmail(question.email_sender_name, question.email_type, currentIndex)}&gt;
                </p>
                {question.email_type === 'PHISHING' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 text-[11px] font-medium rounded">
                    <AlertCircle className="h-3 w-3" />
                    Suspicious
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">to me</p>
            </div>
          </div>

          {/* Attachments */}
          {question.has_attachments && question.attachment_names?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 dark:text-gray-500 uppercase tracking-wide font-medium mb-2">
                Attachments
              </p>
              <div className="flex flex-wrap gap-2">
                {question.attachment_names.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-700 dark:text-gray-300"
                  >
                    <Paperclip className="h-3 w-3 text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Email body ── */}
        <div
          className={`px-8 py-7 ${isArabic ? 'text-right' : ''}`}
          dir={isArabic ? 'rtl' : 'ltr'}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            lineHeight: '1.65',
            color: '#374151',
          }}
        >
          {formatEmailBody(
            question.email_body,
            isArabic,
            question.email_type,
            currentIndex,
            question.email_sender_email || generateSenderEmail(question.email_sender_name, question.email_type, currentIndex)
          )}

          {/* Fake attachment pill for phishing emails without a real attachment */}
          {showFakeAttachment && (
            <div
              className={`mt-5 inline-flex items-center gap-3 px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg cursor-default select-none max-w-xs ${isArabic ? 'flex-row-reverse' : ''}`}
            >
              <Paperclip className="h-5 w-5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {isArabic ? 'فاتورة.pdf' : 'Invoice.pdf'}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">245 KB</p>
              </div>
              <Download className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0" />
            </div>
          )}

          {/* Email signature — legitimate emails only (phishing rarely has professional signatures) */}
          {question.email_type === 'LEGITIMATE' && (
            <div className={`mt-8 pt-5 border-t border-gray-200 dark:border-gray-700 text-sm space-y-0.5 ${isArabic ? 'text-right' : ''}`}>
              <p className="font-semibold text-gray-900 dark:text-white text-[15px]">{question.email_sender_name}</p>
              <p className="text-gray-500 dark:text-gray-400">{sig.title}</p>
              <p className="text-gray-400 dark:text-gray-500 font-mono text-xs">
                {question.email_sender_email || generateSenderEmail(question.email_sender_name, 'LEGITIMATE', currentIndex)}
              </p>
              <p className="text-gray-400 dark:text-gray-500 text-xs">{sig.phone}</p>
              <p className="text-gray-400 dark:text-gray-500 italic text-xs mt-2 pt-1.5 border-t border-gray-100 dark:border-gray-700">{sig.tagline}</p>
            </div>
          )}
        </div>
      </div>

      {/* Answer Buttons */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handlePhishingClick}
            disabled={isAnswered}
            className={clsx(
              'flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-medium',
              isAnswered
                ? selectedAnswer === 'PHISHING'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-md cursor-default'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-danger-300 hover:bg-danger-50/50'
            )}
          >
            <ShieldAlert className="h-6 w-6" />
            <span className="text-lg">{t('quiz.phishing')}</span>
          </button>

          <button
            onClick={() => handleAnswer('LEGITIMATE', [])}
            disabled={isAnswered}
            className={clsx(
              'flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-medium',
              isAnswered
                ? selectedAnswer === 'LEGITIMATE'
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-md cursor-default'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500 opacity-50 cursor-not-allowed'
                : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-success-300 hover:bg-success-50/50'
            )}
          >
            <ShieldCheck className="h-6 w-6" />
            <span className="text-lg">{t('quiz.legitimate')}</span>
          </button>
        </div>

        {/* Answer recorded notification */}
        {isAnswered && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
            <p className="text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <CheckCircle className="w-5 h-5" />
              {i18n.language === 'ar' ? 'تم تسجيل إجابتك' : t('quiz.answerRecorded')}
            </p>
            {currentIndex < questions.length - 1 ? (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                {i18n.language === 'ar' ? 'انتقل إلى السؤال التالي' : t('quiz.continueToNext')}
              </p>
            ) : (
              <p className="text-sm text-blue-600 dark:text-blue-400 mt-2">
                {i18n.language === 'ar' ? 'جاهز لإرسال الاختبار' : t('quiz.readyToSubmit')}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Red Flags Modal */}
      {showRedFlagsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">

            {/* Header */}
            <div className="bg-gradient-to-r from-red-500 to-orange-500 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-7 h-7 flex-shrink-0" />
                <div>
                  <h2 className="text-xl font-bold">
                    {i18n.language === 'ar'
                      ? 'ما هي العلامات المشبوهة التي لاحظتها؟'
                      : 'What red flags did you notice?'}
                  </h2>
                  <p className="text-sm text-red-100 mt-1">
                    {i18n.language === 'ar'
                      ? 'اختر فقط العلامات الموجودة فعلاً في هذا البريد — الاختيارات الخاطئة تخصم نقاطاً'
                      : 'Select only flags actually present in this email — wrong selections cost points'}
                  </p>
                </div>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              {detectedRedFlags.length === 0 ? (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400 dark:text-gray-500" />
                  <p>{i18n.language === 'ar' ? 'لا توجد علامات مشبوهة للعرض' : 'No red flags to display'}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {detectedRedFlags.map((flag) => (
                    <label
                      key={flag.id}
                      className={clsx(
                        'flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all',
                        selectedFlags.includes(flag.id)
                          ? 'bg-red-50 dark:bg-red-900/20 border-red-500 shadow-md scale-[1.02]'
                          : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:shadow-sm'
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selectedFlags.includes(flag.id)}
                        onChange={() => toggleFlag(flag.id)}
                        className="mt-1 w-5 h-5 text-red-600 rounded focus:ring-red-500 cursor-pointer flex-shrink-0"
                      />
                      <div className="flex-1">
                        <p className={`text-sm font-medium text-gray-800 dark:text-gray-100 ${i18n.language === 'ar' ? 'text-right' : 'text-left'}`}>
                          {flag.label}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs rounded-full">
                            {flag.category}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}

              {/* Selection count + penalty hint */}
              <div className="mt-4 space-y-2">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
                    <Info className="w-4 h-4 flex-shrink-0" />
                    {i18n.language === 'ar'
                      ? `تم اختيار ${selectedFlags.length} من ${detectedRedFlags.length} علامات`
                      : `${selectedFlags.length} of ${detectedRedFlags.length} flags selected`}
                  </p>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                  <p className="text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    {i18n.language === 'ar'
                      ? 'تحذير: اختيار علامة غير موجودة في هذا البريد يخصم نقاطاً من نتيجتك. حلّل البريد بعناية!'
                      : 'Tip: Selecting a flag that is not actually in this email will deduct points. Analyze carefully!'}
                  </p>
                </div>
              </div>

              {selectedFlags.length === 0 && (
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-3 flex items-center gap-2 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>
                    {i18n.language === 'ar'
                      ? 'يجب اختيار علامة واحدة مشبوهة على الأقل للمتابعة'
                      : 'Please select at least one red flag to continue'}
                  </span>
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
              <button
                onClick={() => {
                  setShowRedFlagsModal(false);
                  setSelectedFlags([]);
                }}
                className="px-5 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium transition-colors"
              >
                {i18n.language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>

              <button
                onClick={submitWithRedFlags}
                disabled={selectedFlags.length === 0}
                className={clsx(
                  'px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2',
                  selectedFlags.length === 0
                    ? 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:from-red-700 hover:to-orange-700 shadow-lg hover:shadow-xl hover:scale-105'
                )}
              >
                {i18n.language === 'ar' ? 'تأكيد الإجابة' : 'Submit Answer'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Navigation — assessment mode: no back, Next only enabled after answering */}
      <div className="flex items-center justify-end">
        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            disabled={!isAnswered}
            className={clsx(
              'btn-primary flex items-center gap-2',
              !isAnswered && 'opacity-50 cursor-not-allowed'
            )}
          >
            {t('quiz.nextQuestion')}
            <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting || !allQuestionsAnswered}
            className={clsx(
              'btn-primary flex items-center gap-2',
              (submitting || !allQuestionsAnswered) && 'opacity-50 cursor-not-allowed'
            )}
          >
            {submitting ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin ltr:mr-2 rtl:ml-2" />
                {i18n.language === 'ar' ? 'جاري الإرسال...' : 'Submitting...'}
              </>
            ) : (
              t('quiz.submitQuiz')
            )}
          </button>
        )}
      </div>

      {/* Question progress dots — non-interactive in assessment mode */}
      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {questions.map((q, idx) => (
          <div
            key={q.id}
            className={clsx(
              'w-8 h-8 rounded-full text-xs font-medium flex items-center justify-center',
              idx === currentIndex
                ? 'bg-primary-600 text-white'
                : answers[q.question_number]
                  ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            )}
          >
            {answers[q.question_number] && idx !== currentIndex ? '✓' : idx + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TakeQuiz;
