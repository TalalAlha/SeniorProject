"""
email_generator.py — PhishAware v2 AI email generation.

Loads the trained LSTM models once (lazy, thread-safe) and exposes:
  - EmailGenerator.generate_email(email_type, language)
  - generate_campaign_emails(campaign, num_phishing, num_legitimate)
"""

import difflib
import json
import logging
import os
import random
import re
import threading

import torch

logger = logging.getLogger(__name__)

_BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# ---------------------------------------------------------------------------
# Sender pools
# ---------------------------------------------------------------------------

# Generic phishing senders — only used as fallback when NO brand keyword
# matches the body. Brand-specific senders (PayPal, Al Rajhi, Absher, etc.)
# live in _EN_KEYWORD_SENDERS / _AR_KEYWORD_SENDERS below and are selected
# only when the body actually mentions them.
_PHISHING_SENDERS_EN = [
    ("Bank Alert System",          "noreply@secure-banking-alert.com"),
    ("IT Security Department",     "security@it-alerts-verify.com"),
    ("Account Services",           "accounts@verify-login-secure.net"),
    ("Security Operations Center", "soc@security-verify-alert.net"),
    ("Customer Support Team",      "support@service-alert-verify.com"),
    ("Fraud Prevention Team",      "fraud-alert@account-secure.net"),
    ("Billing Department",         "billing@payment-verify-secure.com"),
    ("Verification Services",      "verify@identity-confirm-alert.net"),
]

_PHISHING_SENDERS_AR = [
    ("فريق أمان البنك",            "security@bank-security-alert.net"),
    ("خدمة العملاء",               "support@bank-secure-alert.net"),
    ("إدارة الحسابات",             "accounts@verify-secure.com"),
    ("فريق الحماية",               "protection@bank-alert.net"),
    ("الدعم الأمني",               "secure@account-verify-sa.com"),
    ("مكافحة الاحتيال",            "fraud@alert-verify-sa.net"),
    ("إدارة الفواتير",             "billing@payment-alert-sa.com"),
    ("خدمة التحقق",                "verify@identity-alert-sa.net"),
    ("الإشعارات الرسمية",          "notifications@alert-secure-sa.com"),
    ("فريق المتابعة",              "followup@secure-verify-sa.net"),
]

# ---------------------------------------------------------------------------
# Keyword → sender mapping (phishing only — fixes body/sender mismatch)
# ---------------------------------------------------------------------------

_EN_KEYWORD_SENDERS = {
    # More specific phrases first (dict iteration order = match order)
    'saudi electricity':         ("Saudi Electricity Company",      "noreply@se-billing-alert.net"),
    'uae federal authority':     ("UAE Federal Authority",           "noreply@uae-ica-verify.net"),
    'emirates id':               ("UAE Federal Authority",           "noreply@uae-ica-verify.net"),
    'td bank':                   ("TD Bank Security",                "security@tdbank-alert-verify.com"),
    # MENA-specific brands the model frequently generates
    'stc':        ("STC Customer Care",          "noreply@stc-account-alert.net"),
    'simah':      ("SIMAH Credit Bureau",        "noreply@simah-alert-verify.net"),
    'postpay':    ("Postpay Support",            "support@postpay-payment-alert.com"),
    'tabby':      ("Tabby Support",              "support@tabby-payment-alert.net"),
    'tamara':     ("Tamara Support",             "support@tamara-payment-alert.net"),
    'sadad':      ("SADAD Payment",              "noreply@sadad-payment-verify.net"),
    'tawakkalna': ("Tawakkalna Platform",        "noreply@tawakkalna-verify.net"),
    'muqeem':     ("Muqeem Services",            "noreply@muqeem-verify-sa.net"),
    'absher':     ("Absher Digital Services",    "noreply@absher-verify-gov.net"),
    'elm':        ("ELM Company",                "support@elm-services-verify.com"),
    'hsbc':       ("HSBC Security",              "security@hsbc-account-alert.net"),
    'aramco':     ("Aramco IT Services",         "it-security@aramco-portal-alert.net"),
    'sabic':      ("SABIC IT Services",          "it-security@sabic-portal-alert.net"),
    'du ':        ("du Customer Care",           "noreply@du-account-alert.net"),
    'etisalat':   ("Etisalat Customer Care",     "noreply@etisalat-account-alert.net"),
    'ooredoo':    ("Ooredoo Customer Care",      "noreply@ooredoo-account-alert.net"),
    'zain':       ("Zain Customer Care",         "noreply@zain-account-alert.net"),
    'riyad bank': ("Riyad Bank Security",        "security@riyadbank-alert.net"),
    'citibank':   ("Citibank Security",          "security@citibank-account-alert.net"),
    'adobe':      ("Adobe Security",             "security@adobe-account-alert.net"),
    'docusign':   ("DocuSign Support",           "support@docusign-alert-verify.net"),
    # International brands
    'netflix':    ("Netflix Support",            "billing@netflix-account-verify.net"),
    'linkedin':   ("LinkedIn Security",          "security@linkedin-verify-alert.com"),
    'coinbase':   ("Coinbase Support",           "support@coinbase-secure-alert.com"),
    'paypal':     ("PayPal Security Team",       "security@paypal-account-verify.net"),
    'venmo':      ("Venmo Support",              "support@venmo-payment-alert.net"),
    'google':     ("Google Account Security",    "accounts@google-secure-verify.net"),
    'microsoft':  ("Microsoft Support",          "support@microsoft-account-alert.com"),
    'amazon':     ("Amazon Customer Service",    "orders@amazon-verify-secure.com"),
    'apple':      ("Apple Support",              "noreply@apple-id-verify.net"),
    'dhl':        ("DHL Express",                "delivery@dhl-tracking-alert.com"),
    'customs':    ("DHL Express",                "delivery@dhl-tracking-alert.com"),
    'shipment':   ("DHL Express",                "delivery@dhl-tracking-alert.com"),
    'package':    ("Amazon Customer Service",    "orders@amazon-verify-secure.com"),
}

_AR_KEYWORD_SENDERS = {
    # More specific phrases first so they match before broader keywords
    'شركة الكهرباء':        ("شركة الكهرباء السعودية",   "noreply@se-billing-alert-sa.net"),
    'شركة الاتصالات':       ("شركة الاتصالات السعودية",  "noreply@stc-account-alert-sa.net"),
    'الاتصالات السعودية':   ("شركة الاتصالات السعودية",  "noreply@stc-account-alert-sa.net"),
    'الكهرباء السعودية':    ("شركة الكهرباء السعودية",   "noreply@se-billing-alert-sa.net"),
    'بنك الجزيرة':          ("بنك الجزيرة",              "security@aljazira-bank-alert.net"),
    'مصرف الإنماء':         ("مصرف الإنماء",             "security@alinma-bank-alert.net"),
    'البنك الأهلي':         ("البنك الأهلي السعودي",     "security@snb-bank-alert.net"),
    'بنك البلاد':           ("بنك البلاد",               "security@albilad-bank-alert.net"),
    'وزارة الصحة':          ("وزارة الصحة",                "noreply@moh-sa-verify.net"),
    'وزارة العمل':          ("وزارة الموارد البشرية",      "noreply@hrsd-verify-sa.net"),
    'وزارة الموارد':        ("وزارة الموارد البشرية",      "noreply@hrsd-verify-sa.net"),
    'الهيئة العامة للجمارك': ("الهيئة العامة للجمارك",      "noreply@customs-verify-sa.net"),
    'الجمارك':              ("الهيئة العامة للجمارك",      "noreply@customs-verify-sa.net"),
    'العربي الوطني':        ("البنك العربي الوطني",        "security@anb-bank-alert.net"),
    'أرامكو':               ("أرامكو السعودية",            "it-security@aramco-portal-sa.net"),
    'سابك':                 ("شركة سابك",                  "it-security@sabic-portal-sa.net"),
    'نفاذ':                 ("منصة النفاذ الوطني",         "noreply@nafath-verify-sa.net"),
    'منصة إيجار':           ("منصة إيجار",                 "noreply@ejar-verify-sa.net"),
    'إيجار':                ("منصة إيجار",                 "noreply@ejar-verify-sa.net"),
    'نجم':                  ("نجم لخدمات التأمين",          "noreply@najm-verify-sa.net"),
    'موسم':                 ("هيئة الترفيه",                "noreply@seasons-alert-sa.net"),
    'مهرجان':               ("هيئة الترفيه",                "noreply@seasons-alert-sa.net"),
    # Government & services
    'أبشر':              ("منصة أبشر",                 "noreply@absher-gov-sa-verify.net"),
    'توكلنا':            ("منصة توكلنا",                "noreply@tawakkalna-verify-sa.net"),
    'التأمينات':         ("التأمينات الاجتماعية",        "noreply@gosi-verify-sa.net"),
    'هدف':               ("صندوق تنمية الموارد البشرية", "noreply@hrdf-hadaf-verify.net"),
    'تمهير':             ("برنامج تمهير",               "noreply@tamheer-verify-sa.net"),
    'نظام سداد':         ("نظام سداد للمدفوعات",         "noreply@sadad-payment-verify.net"),
    'منصة سداد':         ("نظام سداد للمدفوعات",         "noreply@sadad-payment-verify.net"),
    'خدمة سداد':         ("نظام سداد للمدفوعات",         "noreply@sadad-payment-verify.net"),
    'الصحة':             ("وزارة الصحة",                "noreply@moh-sa-verify.net"),
    'صحتي':              ("تطبيق صحتي",                 "noreply@sehhaty-verify.net"),
    'إيلوم':             ("شركة إيلوم",                 "support@elm-services-verify.com"),
    'الزكاة':            ("هيئة الزكاة والضريبة",        "noreply@zatca-verify-sa.net"),
    'الضريبة':           ("هيئة الزكاة والضريبة",        "noreply@zatca-verify-sa.net"),
    'المرور':            ("إدارة المرور السعودي",        "noreply@traffic-sa-alert.net"),
    'مخالفة':            ("إدارة المرور السعودي",        "noreply@traffic-sa-alert.net"),
    # Banks (broader keywords last)
    'الراجحي':           ("بنك الراجحي",                "security@alrajhi-bank-alert.net"),
    'ساب':               ("بنك ساب",                    "security@sab-bank-alert.net"),
    'الأهلي':            ("البنك الأهلي السعودي",        "security@snb-bank-alert.net"),
    'الاهلي':            ("البنك الأهلي السعودي",        "security@snb-bank-alert.net"),
    'الرياض':            ("بنك الرياض",                 "security@riyadhbank-alert.net"),
    'الإنماء':           ("مصرف الإنماء",               "security@alinma-bank-alert.net"),
    'الجزيرة':           ("بنك الجزيرة",                "security@aljazira-bank-alert.net"),
    'البلاد':            ("بنك البلاد",                 "security@albilad-bank-alert.net"),
    'بوبيان':            ("بنك بوبيان",                 "security@boubyan-bank-alert.net"),
    # Common services
    'الكهرباء':          ("شركة الكهرباء السعودية",     "noreply@se-billing-alert-sa.net"),
    'الاتصالات':         ("شركة الاتصالات السعودية",    "noreply@stc-account-alert-sa.net"),
}

_LEGIT_SENDERS_EN = [
    ("IT Department",              "it@company.com"),
    ("HR Team",                    "hr@company.com"),
    ("Management",                 "management@company.com"),
    ("Support Team",               "support@company.com"),
    ("Finance Department",         "finance@company.com"),
]

_LEGIT_SENDERS_AR = [
    ("قسم تقنية المعلومات",        "it@company.sa"),
    ("الموارد البشرية",            "hr@company.sa"),
    ("الإدارة",                    "management@company.sa"),
    ("فريق الدعم",                 "support@company.sa"),
    ("الشؤون المالية",             "finance@company.sa"),
]

# ---------------------------------------------------------------------------
# Subject pools (fallback when extraction fails)
# ---------------------------------------------------------------------------

_PHISHING_SUBJECTS_EN = [
    "Urgent: Verify Your Account Immediately",
    "Security Alert: Unusual Activity Detected",
    "Action Required: Confirm Your Identity",
    "Your Account Has Been Temporarily Suspended",
    "Important: Update Your Password Now",
    "Suspicious Login Attempt Detected",
    "Final Notice: Account Verification Required",
]

_PHISHING_SUBJECTS_AR = [
    "تنبيه أمني: تحقق من حسابك",
    "عاجل: تم اكتشاف نشاط مشبوه",
    "تحذير: حسابك في خطر",
    "مطلوب: تحديث بيانات حسابك",
    "إشعار أمني هام",
    "تعليق مؤقت لحسابك",
    "عاجل: تأكيد هويتك مطلوب",
]

_LEGIT_SUBJECTS_EN = [
    "Monthly Team Newsletter",
    "Meeting Reminder: Team Sync Tomorrow",
    "HR Update: Policy Changes",
    "IT Maintenance Notice",
    "Upcoming Company Event",
    "Performance Review Schedule",
    "Office Closure Announcement",
]

_LEGIT_SUBJECTS_AR = [
    "النشرة الشهرية للفريق",
    "تذكير باجتماع: مزامنة الفريق",
    "تحديث الموارد البشرية",
    "إشعار صيانة تقنية المعلومات",
    "فعالية الشركة القادمة",
    "جدول مراجعة الأداء",
    "إعلان إغلاق المكتب",
]

# ---------------------------------------------------------------------------
# Category pools
# ---------------------------------------------------------------------------

_PHISHING_CATEGORIES = [
    'CREDENTIAL_HARVESTING',
    'LINK_MANIPULATION',
    'SPEAR_PHISHING',
    'BUSINESS_EMAIL_COMPROMISE',
    'CLONE_PHISHING',
]

_LEGIT_CATEGORIES = [
    'LEGITIMATE_BUSINESS',
    'LEGITIMATE_NOTIFICATION',
    'LEGITIMATE_PERSONAL',
]

# ---------------------------------------------------------------------------
# Red-flag pools (shown to employees after quiz)
# ---------------------------------------------------------------------------

_PHISHING_RED_FLAGS_EN = [
    "Urgent language pressuring immediate action",
    "Suspicious sender domain not matching the claimed organisation",
    "Request for personal or account credentials",
    "Generic greeting instead of your name",
    "Hover-over link mismatch",
]

_PHISHING_RED_FLAGS_AR = [
    "لغة عاجلة تضغط على اتخاذ إجراء فوري",
    "نطاق المُرسِل مشبوه ولا يتطابق مع الجهة المزعومة",
    "طلب بيانات شخصية أو بيانات حساب",
    "رابط مزيف أو مشبوه",
    "تحية عامة بدلاً من اسمك",
]

# Keyword signals per flag — body keywords that indicate that flag is present.
# Empty list = always relevant (flag applies regardless of body content).
_RED_FLAG_SIGNALS_EN = {
    "Urgent language pressuring immediate action": [
        "urgent", "immediately", "within 24", "within 48", "within 72",
        "within 12", "expire", "expires", "act now", "warning", "suspended",
        "terminated", "hours", "business days", "deadline", "limited time",
        "right away", "as soon as possible", "restricted",
    ],
    "Suspicious sender domain not matching the claimed organisation": [],
    "Request for personal or account credentials": [
        "verify", "confirm", "click the link", "enter your", "update your",
        "credentials", "password", "login", "sign in", "identity",
        "account information", "personal information", "click below",
        "secure portal", "verification", "authenticate",
    ],
    "Generic greeting instead of your name": [
        "dear customer", "dear user", "dear valued", "dear account holder",
        "dear member", "hello user", "dear sir", "dear madam",
        "to whom it may concern", "dear client",
    ],
    "Hover-over link mismatch": [
        "click", "link", "here", "portal", "secure link", "click below",
        "click the link", "follow the link", "access the link",
        "click this link", "the link below",
    ],
}

_RED_FLAG_SIGNALS_AR = {
    "لغة عاجلة تضغط على اتخاذ إجراء فوري": [
        "عاجل", "فوراً", "فوري", "على الفور", "انتهاء", "تعليق",
        "تجميد", "إيقاف", "خلال", "أيام", "ساعة", "ساعات",
        "آخر موعد", "قبل", "مهلة",
    ],
    "نطاق المُرسِل مشبوه ولا يتطابق مع الجهة المزعومة": [],
    "طلب بيانات شخصية أو بيانات حساب": [
        "بيانات", "كلمة المرور", "هوية", "تحقق", "تأكيد",
        "معلومات", "سجل دخول", "ادخل", "أدخل", "تسجيل الدخول",
        "حسابك", "تحديث بياناتك", "تصحيح",
    ],
    "رابط مزيف أو مشبوه": [
        "رابط", "اضغط", "انقر", "الرابط", "عبر الرابط",
        "من خلال الرابط", "أدناه",
    ],
    "تحية عامة بدلاً من اسمك": [
        "عزيزي العميل", "عزيزي المستخدم", "عزيزي صاحب الحساب",
        "عزيزي المشترك", "أيها العميل", "عزيزي المستفيد",
    ],
}

# ---------------------------------------------------------------------------
# Red flag selection — body-aware
# ---------------------------------------------------------------------------

def _select_red_flags(body: str, language: str) -> list:
    """
    Return 3 red flags whose keyword signals are present in the body.
    Flags with evidence come first; unmatched flags fill the remainder.
    The 'sender domain' flag has an empty signal list so it is always matched.
    """
    if language == 'ar':
        flags = _PHISHING_RED_FLAGS_AR
        signals = _RED_FLAG_SIGNALS_AR
        body_check = body          # Arabic is not case-sensitive in the same way
    else:
        flags = _PHISHING_RED_FLAGS_EN
        signals = _RED_FLAG_SIGNALS_EN
        body_check = body.lower()

    matched = []
    unmatched = []
    for flag in flags:
        keywords = signals.get(flag, [])
        if not keywords or any(kw in body_check for kw in keywords):
            matched.append(flag)
        else:
            unmatched.append(flag)

    selected = matched[:3]
    if len(selected) < 3:
        needed = 3 - len(selected)
        selected += random.sample(unmatched, min(needed, len(unmatched)))

    return selected


# ---------------------------------------------------------------------------
# Core generation helper (from training docs)
# ---------------------------------------------------------------------------

_LABEL_STRIP_RE = re.compile(r'\[PHISH\]|\[LEGIT\]')
_SENTENCE_END_RE = re.compile(r'([.!?]\s+)([a-z])')
_STANDALONE_I_RE = re.compile(r'\bi\b')


def _apply_capitalization(text: str) -> str:
    """Sentence-case an all-lowercase English body: capitalize after . ! ?  and standalone i -> I."""
    if not text:
        return text
    # Capitalize the very first character
    text = text[0].upper() + text[1:]
    # Capitalize first letter after sentence-ending punctuation
    text = _SENTENCE_END_RE.sub(lambda m: m.group(1) + m.group(2).upper(), text)
    # Capitalize standalone pronoun "i"
    text = _STANDALONE_I_RE.sub('I', text)
    return text


def _generate_sample(model, vocab, device, email_type='phishing',
                     max_len=120, temperature=0.8):
    model.eval()
    with torch.no_grad():
        tokens = [vocab.word2idx.get(vocab.START_TOKEN, 1)]
        if email_type == 'phishing' and '[PHISH]' in vocab.word2idx:
            tokens.append(vocab.word2idx['[PHISH]'])
        elif email_type == 'legitimate' and '[LEGIT]' in vocab.word2idx:
            tokens.append(vocab.word2idx['[LEGIT]'])

        hidden = model.init_hidden(1, device)
        for token in tokens:
            x = torch.tensor([[token]], device=device)
            output, hidden = model(x, hidden)

        for _ in range(max_len):
            logits = output[0, -1] / temperature
            top_vals, top_ids = torch.topk(logits, 50)
            probs = torch.softmax(top_vals, dim=0)
            chosen_idx = torch.multinomial(probs, 1).item()
            next_token = top_ids[chosen_idx].item()
            if next_token == vocab.word2idx.get(vocab.END_TOKEN, 2):
                break
            if next_token == vocab.word2idx.get(vocab.PAD_TOKEN, 0):
                continue
            tokens.append(next_token)
            x = torch.tensor([[next_token]], device=device)
            output, hidden = model(x, hidden)

    raw = vocab.decode(tokens)
    # Strip label control tokens that appear at start of decoded text
    return _LABEL_STRIP_RE.sub('', raw).strip()


def _extract_subject(body: str, language: str) -> str:
    """Pull a subject line from the first sentence of the body (≤80 chars)."""
    # Split on common sentence terminators
    m = re.split(r'[.!?。،]', body, maxsplit=1)
    candidate = m[0].strip() if m else ''
    # Keep only if it looks reasonable
    if 10 < len(candidate) <= 80:
        return candidate
    # Fall back to a fixed-length truncation of the body start
    if len(body) > 15:
        truncated = body[:75].rsplit(' ', 1)[0]
        if len(truncated) > 10:
            return truncated + '…'
    return ''   # caller will use fallback pool


def _pick_sender(email_type: str, language: str, body: str = ''):
    if email_type != 'phishing':
        pool = _LEGIT_SENDERS_AR if language == 'ar' else _LEGIT_SENDERS_EN
        return random.choice(pool)

    # Keyword scan: return a sender that matches the brand mentioned in the body
    if language == 'ar':
        for keyword, sender in _AR_KEYWORD_SENDERS.items():
            if keyword in body:
                return sender
    else:
        body_lower = body.lower()
        for keyword, sender in _EN_KEYWORD_SENDERS.items():
            if keyword in body_lower:
                return sender

    # No keyword match — fall back to random from pool
    pool = _PHISHING_SENDERS_AR if language == 'ar' else _PHISHING_SENDERS_EN
    return random.choice(pool)


def _pick_subject(email_type: str, language: str, body: str) -> str:
    subject = _extract_subject(body, language)
    if subject:
        return subject
    if email_type == 'phishing':
        pool = _PHISHING_SUBJECTS_AR if language == 'ar' else _PHISHING_SUBJECTS_EN
    else:
        pool = _LEGIT_SUBJECTS_AR if language == 'ar' else _LEGIT_SUBJECTS_EN
    return random.choice(pool)


# ---------------------------------------------------------------------------
# EmailGenerator — loads models once, lazily, thread-safe
# ---------------------------------------------------------------------------

class EmailGenerator:
    def __init__(self):
        self._lock = threading.Lock()
        self._loaded = False
        self._en_model = None
        self._ar_model = None
        self._en_vocab = None
        self._ar_vocab = None
        self._config = None
        self._device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

    def _load_models(self):
        if self._loaded:
            return
        with self._lock:
            if self._loaded:   # double-checked locking
                return
            logger.info("Loading PhishAware v2 LSTM models onto %s …", self._device)
            from ml_models.vocabulary import Vocabulary
            from ml_models.lstm_model import EmailLSTM

            with open(os.path.join(_BASE_DIR, 'model_config.json'), 'r', encoding='utf-8') as f:
                self._config = json.load(f)

            cfg = self._config

            # --- English model ---
            self._en_vocab = Vocabulary.load(os.path.join(_BASE_DIR, 'vocab_en.json'))
            en_model = EmailLSTM(
                vocab_size=len(self._en_vocab),
                embedding_dim=cfg['embedding_dim'],
                hidden_dim=cfg['hidden_dim'],
                num_layers=cfg['num_layers'],
                dropout=cfg['dropout'],
            )
            en_model.load_state_dict(
                torch.load(
                    os.path.join(_BASE_DIR, 'phishing_lstm_en.pth'),
                    map_location=self._device,
                    weights_only=True,
                )
            )
            en_model.to(self._device).eval()
            self._en_model = en_model

            # --- Arabic model ---
            self._ar_vocab = Vocabulary.load(os.path.join(_BASE_DIR, 'vocab_ar.json'))
            ar_model = EmailLSTM(
                vocab_size=len(self._ar_vocab),
                embedding_dim=cfg['embedding_dim'],
                hidden_dim=cfg['hidden_dim'],
                num_layers=cfg['num_layers'],
                dropout=cfg['dropout'],
            )
            ar_model.load_state_dict(
                torch.load(
                    os.path.join(_BASE_DIR, 'phishing_lstm_ar.pth'),
                    map_location=self._device,
                    weights_only=True,
                )
            )
            ar_model.to(self._device).eval()
            self._ar_model = ar_model

            self._loaded = True
            logger.info("PhishAware v2 models loaded successfully.")

    def generate_email(self, email_type: str = 'phishing', language: str = 'en') -> dict:
        """
        Generate one AI email.

        Args:
            email_type: 'phishing' | 'legitimate'
            language:   'en' | 'ar'

        Returns:
            dict with keys: subject, body, sender_name, sender_email
        """
        self._load_models()

        if language == 'ar':
            model, vocab = self._ar_model, self._ar_vocab
            max_len = self._config.get('max_seq_len_ar', 100)
            temperature = 0.75
        else:
            model, vocab = self._en_model, self._en_vocab
            max_len = self._config.get('max_seq_len_en', 120)
            temperature = 0.8

        body = _generate_sample(model, vocab, self._device,
                                email_type=email_type,
                                max_len=max_len,
                                temperature=temperature)

        # Ensure minimum useful length; retry once with higher temperature
        if len(body.split()) < 15:
            body = _generate_sample(model, vocab, self._device,
                                    email_type=email_type,
                                    max_len=max_len,
                                    temperature=min(temperature + 0.15, 1.0))

        # Apply sentence-case capitalization for English output
        if language == 'en':
            body = _apply_capitalization(body)

        subject = _pick_subject(email_type, language, body)
        sender_name, sender_email = _pick_sender(email_type, language, body)

        return {
            'subject': subject,
            'body': body,
            'sender_name': sender_name,
            'sender_email': sender_email,
        }


# ---------------------------------------------------------------------------
# Django integration — called from CampaignViewSet.perform_create
# ---------------------------------------------------------------------------

def generate_campaign_emails(campaign, num_phishing: int, num_legitimate: int):
    """
    Generate and save EmailTemplate objects for a campaign.

    Args:
        campaign:       Campaign model instance
        num_phishing:   Number of phishing emails to generate
        num_legitimate: Number of legitimate emails to generate

    Returns:
        List of created EmailTemplate instances
    """
    from apps.assessments.models import EmailTemplate

    generator = _get_generator()
    templates = []

    # Determine language distribution from campaign's english_ratio (default 0.5)
    english_ratio = float(getattr(campaign, 'english_ratio', 0.5))

    phishing_en = round(num_phishing * english_ratio)
    phishing_ar = num_phishing - phishing_en
    legit_en = round(num_legitimate * english_ratio)
    legit_ar = num_legitimate - legit_en

    tasks = (
        [('phishing', 'en')] * phishing_en +
        [('phishing', 'ar')] * phishing_ar +
        [('legitimate', 'en')] * legit_en +
        [('legitimate', 'ar')] * legit_ar
    )
    random.shuffle(tasks)

    _SIMILARITY_THRESHOLD = 0.80
    _MAX_RETRIES = 3

    # Track accepted bodies per (email_type, language) to detect near-duplicates
    accepted_bodies: dict = {}

    for email_type, language in tasks:
        group_key = (email_type, language)
        accepted = accepted_bodies.setdefault(group_key, [])

        best_data = None
        best_sim = 1.0

        for attempt in range(_MAX_RETRIES + 1):
            try:
                data = generator.generate_email(email_type=email_type, language=language)
            except Exception as exc:
                logger.warning(
                    "AI generation failed for (%s, %s): %s — skipping email",
                    email_type, language, exc,
                )
                break

            if not accepted:
                best_data = data
                break

            max_sim = max(_similarity(data['body'], b) for b in accepted)

            if max_sim <= _SIMILARITY_THRESHOLD:
                best_data = data
                break

            # Keep the least similar attempt seen so far
            if best_data is None or max_sim < best_sim:
                best_data = data
                best_sim = max_sim

            logger.debug(
                "Similarity %.2f > %.2f for (%s, %s) — retry %d/%d",
                max_sim, _SIMILARITY_THRESHOLD, email_type, language,
                attempt + 1, _MAX_RETRIES,
            )

        if best_data is None:
            continue

        accepted.append(best_data['body'])
        data = best_data

        db_type = 'PHISHING' if email_type == 'phishing' else 'LEGITIMATE'

        category = (
            random.choice(_PHISHING_CATEGORIES)
            if email_type == 'phishing'
            else random.choice(_LEGIT_CATEGORIES)
        )

        red_flags = _select_red_flags(data['body'], language) if email_type == 'phishing' else []

        template = EmailTemplate.objects.create(
            campaign=campaign,
            sender_name=data['sender_name'],
            sender_email=data['sender_email'],
            subject=data['subject'],
            body=data['body'],
            email_type=db_type,
            category=category,
            difficulty=_pick_difficulty(),
            language=language,
            is_ai_generated=True,
            ai_model_used='PhishAware-LSTM-v2',
            generation_prompt=f'type={email_type}, language={language}',
            red_flags=red_flags,
        )
        templates.append(template)

    logger.info(
        "Campaign '%s': created %d/%d AI email templates.",
        campaign.name, len(templates), num_phishing + num_legitimate,
    )
    return templates


def _similarity(a: str, b: str) -> float:
    """Return a similarity ratio between 0.0 and 1.0 using SequenceMatcher."""
    return difflib.SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _pick_difficulty() -> str:
    """Weighted random difficulty: 30% EASY, 50% MEDIUM, 20% HARD."""
    return random.choices(['EASY', 'MEDIUM', 'HARD'], weights=[30, 50, 20])[0]


# ---------------------------------------------------------------------------
# Module-level singleton — lazy, created on first use
# ---------------------------------------------------------------------------

_generator_instance: EmailGenerator | None = None
_generator_lock = threading.Lock()


def _get_generator() -> EmailGenerator:
    global _generator_instance
    if _generator_instance is None:
        with _generator_lock:
            if _generator_instance is None:
                _generator_instance = EmailGenerator()
    return _generator_instance
