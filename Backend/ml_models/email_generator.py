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
_WORD_RE = re.compile(r"\b[A-Za-z][A-Za-z']*\b")
_GREETING_RE = re.compile(r'\b(Dear|Hi|Hello|Mr\.|Ms\.|Mrs\.|Dr\.)\s+([a-z])')

_ALWAYS_CAPITALIZE = {
    'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
    'january', 'february', 'march', 'april', 'june', 'july',
    'august', 'september', 'october', 'november', 'december',
    'riyadh', 'jeddah', 'mecca', 'medina', 'dammam', 'khobar', 'dhahran',
    'dubai', 'doha', 'manama', 'kuwait', 'muscat', 'cairo', 'amman', 'beirut',
    'saudi', 'arabia', 'emirates', 'qatar', 'bahrain', 'oman', 'jordan',
    'arabic', 'english',
}

_ALL_CAPS = {
    'gcc', 'uae', 'ksa', 'usa', 'uk', 'eu', 'mena', 'hsbc', 'stc', 'sabic',
    'simah', 'sadad', 'dhl', 'pdf', 'url', 'id', 'pin', 'otp', 'vpn', 'api',
    'ceo', 'cfo', 'cto', 'cio',
}

_BRAND_CASE = {
    'paypal': 'PayPal', 'docusign': 'DocuSign', 'linkedin': 'LinkedIn',
    'youtube': 'YouTube', 'iphone': 'iPhone', 'ipad': 'iPad', 'macos': 'macOS',
    'ios': 'iOS', 'github': 'GitHub', 'whatsapp': 'WhatsApp',
}


def _fix_word_case(match):
    w = match.group(0)
    low = w.lower()
    if low in _ALL_CAPS:
        return w.upper()
    if low in _BRAND_CASE:
        return _BRAND_CASE[low]
    if low in _ALWAYS_CAPITALIZE:
        return w[0].upper() + w[1:].lower()
    return w


def _is_low_quality(body: str, min_words: int = 15) -> bool:
    """
    Reject obvious junk outputs that should trigger a retry.
    Catches: too short, mostly punctuation, leaked label control tokens.
    """
    if not body:
        return True
    if len(body.split()) < min_words:
        return True
    if '[PHISH]' in body or '[LEGIT]' in body:
        return True
    letters = sum(1 for c in body if c.isalpha())
    if letters < 30:
        return True
    return False


def _normalize_numbers(text: str) -> str:
    """Collapse stray whitespace inside numbers ('10, 000' -> '10,000', '175. 00' -> '175.00').

    The LSTM tokenizer sometimes splits multi-digit numbers, leaving spaces
    around commas and decimal points. Those spaces render badly in any
    language and especially in RTL Arabic where they confuse the bidi
    algorithm.
    """
    if not text:
        return text
    text = re.sub(r'(\d)\s*,\s*(\d)', r'\1,\2', text)
    text = re.sub(r'(\d)\s*\.\s*(\d)', r'\1.\2', text)
    return text


def _apply_capitalization(text: str) -> str:
    """Sentence-case an all-lowercase English body and fix proper nouns / acronyms / brands."""
    if not text:
        return text
    text = text[0].upper() + text[1:]
    text = _SENTENCE_END_RE.sub(lambda m: m.group(1) + m.group(2).upper(), text)
    text = _STANDALONE_I_RE.sub('I', text)
    text = _WORD_RE.sub(_fix_word_case, text)
    text = _GREETING_RE.sub(lambda m: f"{m.group(1)} {m.group(2).upper()}", text)
    return text


def _generate_batch(model, vocab, device, tasks, max_len=120,
                    repetition_penalty=1.15, repetition_window=20, top_k=50):
    """
    Batched autoregressive inference with vectorized sampling and a
    HuggingFace-style repetition penalty.

    tasks : list of (email_type, temperature) for the same model/vocab.
    Returns: list of raw decoded strings, same order and length as tasks.
    """
    B = len(tasks)
    if B == 0:
        return []

    start_idx = vocab.word2idx.get(vocab.START_TOKEN, 1)
    end_idx   = vocab.word2idx.get(vocab.END_TOKEN, 2)
    pad_idx   = vocab.word2idx.get(vocab.PAD_TOKEN, 0)
    phish_idx = vocab.word2idx.get('[PHISH]')
    legit_idx = vocab.word2idx.get('[LEGIT]')

    label_idx = [
        phish_idx if et == 'phishing' and phish_idx is not None
        else legit_idx if et == 'legitimate' and legit_idx is not None
        else None
        for et, _ in tasks
    ]
    temperatures = torch.tensor(
        [t for _, t in tasks], device=device
    ).unsqueeze(1)  # (B, 1)

    tokens = [[start_idx] for _ in range(B)]

    with torch.inference_mode():
        hidden = model.init_hidden(B, device)

        # ── Seed: START token (shared) ──
        x = torch.full((B, 1), start_idx, dtype=torch.long, device=device)
        output, hidden = model(x, hidden)

        # ── Seed: label token (per-sequence) ──
        if any(idx is not None for idx in label_idx):
            label_tensor = torch.tensor(
                [idx if idx is not None else pad_idx for idx in label_idx],
                dtype=torch.long, device=device,
            ).unsqueeze(1)  # (B, 1)
            output, hidden = model(label_tensor, hidden)
            for i, idx in enumerate(label_idx):
                if idx is not None:
                    tokens[i].append(idx)

        done = torch.zeros(B, dtype=torch.bool, device=device)

        # ── Autoregressive loop (vectorized sampling) ──
        for _ in range(max_len):
            # Clone so we don't mutate the model's internal output buffer
            last_logits = output[:, -1, :].clone()  # (B, vocab_size)

            # Repetition penalty (HuggingFace formula): for tokens recently seen,
            # divide if logit > 0, multiply if logit < 0 — both reduce probability.
            if repetition_penalty != 1.0:
                done_cpu = done.tolist()
                pen_batch_idx = []
                pen_token_idx = []
                for i in range(B):
                    if done_cpu[i]:
                        continue
                    recent = tokens[i][-repetition_window:]
                    for t in set(recent):
                        pen_batch_idx.append(i)
                        pen_token_idx.append(t)
                if pen_batch_idx:
                    bi = torch.tensor(pen_batch_idx, device=device, dtype=torch.long)
                    ti = torch.tensor(pen_token_idx, device=device, dtype=torch.long)
                    cur = last_logits[bi, ti]
                    last_logits[bi, ti] = torch.where(
                        cur > 0, cur / repetition_penalty, cur * repetition_penalty,
                    )

            scaled = last_logits / temperatures  # (B, V)

            # Vectorized top-k → softmax → multinomial (one call each, not B calls)
            top_vals, top_ids = torch.topk(scaled, top_k, dim=-1)  # (B, top_k)
            probs = torch.softmax(top_vals, dim=-1)                # (B, top_k)
            chosen = torch.multinomial(probs, 1)                   # (B, 1)
            sampled = top_ids.gather(1, chosen).squeeze(1)         # (B,)

            prev_done = done.clone()
            done = done | (sampled == end_idx)

            # Feed pad to LSTM for any sequence that's done (incl. just-finished)
            next_input = torch.where(
                done, torch.full_like(sampled, pad_idx), sampled,
            )

            # CPU-side append: only for sequences that weren't already done
            # AND didn't sample end/pad
            sampled_cpu = sampled.tolist()
            prev_done_cpu = prev_done.tolist()
            for i in range(B):
                if prev_done_cpu[i]:
                    continue
                nt = sampled_cpu[i]
                if nt == end_idx or nt == pad_idx:
                    continue
                tokens[i].append(nt)

            if bool(done.all().item()):
                break

            output, hidden = model(next_input.unsqueeze(1), hidden)

    return [_LABEL_STRIP_RE.sub('', vocab.decode(tok)).strip() for tok in tokens]


def _generate_sample(model, vocab, device, email_type='phishing',
                     max_len=120, temperature=0.8):
    """Generate a single email body — thin wrapper around _generate_batch."""
    results = _generate_batch(
        model, vocab, device,
        tasks=[(email_type, temperature)],
        max_len=max_len,
    )
    return results[0] if results else ''


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
    """Subject rendering disabled — frontend hides the subject row when blank."""
    return ''


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

        # Collapse stray whitespace inside numbers (applies to both languages)
        body = _normalize_numbers(body)

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
    generator._load_models()

    english_ratio = float(getattr(campaign, 'english_ratio', 0.5))

    phishing_en = round(num_phishing * english_ratio)
    phishing_ar = num_phishing - phishing_en
    legit_en    = round(num_legitimate * english_ratio)
    legit_ar    = num_legitimate - legit_en

    tasks = (
        [('phishing',   'en')] * phishing_en +
        [('phishing',   'ar')] * phishing_ar +
        [('legitimate', 'en')] * legit_en +
        [('legitimate', 'ar')] * legit_ar
    )
    random.shuffle(tasks)

    _SIMILARITY_THRESHOLD = 0.80
    _MAX_RETRIES = 3

    # ── Batch inference: one forward-pass loop per language ──────────────────
    bodies = [None] * len(tasks)

    en_indices = [(i, et) for i, (et, lang) in enumerate(tasks) if lang == 'en']
    ar_indices = [(i, et) for i, (et, lang) in enumerate(tasks) if lang == 'ar']

    if en_indices:
        max_len_en = generator._config.get('max_seq_len_en', 120)
        en_results = _generate_batch(
            generator._en_model, generator._en_vocab, generator._device,
            [(et, 0.8) for _, et in en_indices],
            max_len=max_len_en,
        )
        for (orig_i, _), body in zip(en_indices, en_results):
            bodies[orig_i] = body

    if ar_indices:
        max_len_ar = generator._config.get('max_seq_len_ar', 100)
        ar_results = _generate_batch(
            generator._ar_model, generator._ar_vocab, generator._device,
            [(et, 0.75) for _, et in ar_indices],
            max_len=max_len_ar,
        )
        for (orig_i, _), body in zip(ar_indices, ar_results):
            bodies[orig_i] = body

    # ── Post-process all bodies ───────────────────────────────────────────────
    for i, (_, language) in enumerate(tasks):
        body = bodies[i]
        if not body:
            continue
        body = _normalize_numbers(body)
        if language == 'en':
            body = _apply_capitalization(body)
        bodies[i] = body

    # ── Quality + similarity check; batched retries for failures ─────────────
    # accepted_lower stores pre-lowercased copies so we don't re-lowercase
    # every accepted body on every comparison.
    accepted_lower = {}            # (email_type, language) -> [str.lower() ...]
    best_bodies   = list(bodies)   # best candidate so far per index
    best_sims     = [1.0] * len(tasks)
    needs_retry   = []

    def _max_sim_lower(cand_lower, lower_list):
        if not lower_list:
            return 0.0
        return max(
            difflib.SequenceMatcher(None, cand_lower, b).ratio()
            for b in lower_list
        )

    # Initial pass: classify each generated body as accepted / needs retry
    for i, (email_type, language) in enumerate(tasks):
        body = bodies[i]
        if _is_low_quality(body):
            needs_retry.append(i)
            best_bodies[i] = None
            best_sims[i]   = 1.0
            continue
        body_lower = body.lower()
        sim = _max_sim_lower(body_lower, accepted_lower.get((email_type, language), []))
        if sim <= _SIMILARITY_THRESHOLD:
            accepted_lower.setdefault((email_type, language), []).append(body_lower)
            best_bodies[i] = body
            best_sims[i]   = sim
        else:
            needs_retry.append(i)
            best_bodies[i] = body
            best_sims[i]   = sim

    # Retry rounds — one batched LSTM pass per language per round
    for retry_round in range(_MAX_RETRIES):
        if not needs_retry:
            break

        en_temp = min(0.8 + 0.1 * (retry_round + 1), 1.0)
        ar_temp = min(0.75 + 0.1 * (retry_round + 1), 1.0)

        en_idx = [i for i in needs_retry if tasks[i][1] == 'en']
        ar_idx = [i for i in needs_retry if tasks[i][1] == 'ar']

        en_results = []
        ar_results = []
        try:
            if en_idx:
                en_results = _generate_batch(
                    generator._en_model, generator._en_vocab, generator._device,
                    [(tasks[i][0], en_temp) for i in en_idx],
                    max_len=generator._config.get('max_seq_len_en', 120),
                )
            if ar_idx:
                ar_results = _generate_batch(
                    generator._ar_model, generator._ar_vocab, generator._device,
                    [(tasks[i][0], ar_temp) for i in ar_idx],
                    max_len=generator._config.get('max_seq_len_ar', 100),
                )
        except Exception as exc:
            logger.warning("Batched retry round %d failed: %s", retry_round, exc)
            break

        still_failing = []

        def _process_retry(indices, results):
            for j, i in enumerate(indices):
                email_type, language = tasks[i]
                candidate = results[j]
                candidate = _normalize_numbers(candidate)
                if language == 'en':
                    candidate = _apply_capitalization(candidate)
                if _is_low_quality(candidate):
                    still_failing.append(i)
                    return
                cand_lower = candidate.lower()
                sim = _max_sim_lower(cand_lower, accepted_lower.get((email_type, language), []))
                if sim <= _SIMILARITY_THRESHOLD:
                    accepted_lower.setdefault((email_type, language), []).append(cand_lower)
                    bodies[i]      = candidate
                    best_bodies[i] = candidate
                    best_sims[i]   = sim
                else:
                    still_failing.append(i)
                    if sim < best_sims[i]:
                        best_bodies[i] = candidate
                        best_sims[i]   = sim

        _process_retry(en_idx, en_results)
        _process_retry(ar_idx, ar_results)

        needs_retry = still_failing

    # Fallback: for indices still failing, accept the least-bad attempt seen
    for i in needs_retry:
        if best_bodies[i] and not _is_low_quality(best_bodies[i]):
            bodies[i] = best_bodies[i]
        else:
            bodies[i] = None

    # ── Build objects and bulk-insert in one query ────────────────────────────
    template_objects = []
    for i, (email_type, language) in enumerate(tasks):
        body = bodies[i]
        if not body:
            continue

        db_type  = 'PHISHING' if email_type == 'phishing' else 'LEGITIMATE'
        category = (
            random.choice(_PHISHING_CATEGORIES) if email_type == 'phishing'
            else random.choice(_LEGIT_CATEGORIES)
        )
        red_flags = _select_red_flags(body, language) if email_type == 'phishing' else []
        sender_name, sender_email = _pick_sender(email_type, language, body)

        template_objects.append(EmailTemplate(
            campaign=campaign,
            sender_name=sender_name,
            sender_email=sender_email,
            subject=_pick_subject(email_type, language, body),
            body=body,
            email_type=db_type,
            category=category,
            difficulty=_pick_difficulty(),
            language=language,
            is_ai_generated=True,
            ai_model_used='PhishAware-LSTM-v2',
            generation_prompt=f'type={email_type}, language={language}',
            red_flags=red_flags,
        ))

    created = EmailTemplate.objects.bulk_create(template_objects)

    logger.info(
        "Campaign '%s': created %d/%d AI email templates.",
        campaign.name, len(created), num_phishing + num_legitimate,
    )
    return list(created)


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
