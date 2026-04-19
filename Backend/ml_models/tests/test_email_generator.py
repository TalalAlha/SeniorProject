"""
Tests for ml_models/email_generator.py

Covers:
  1. _similarity()
  2. _apply_capitalization()
  3. _pick_sender() keyword matching (EN + AR)
  4. _select_red_flags() body-aware flag selection (EN + AR)
  5. Deduplication logic in generate_campaign_emails()
  6. Live model generation (integration tests)
"""

import sys
import os
import unittest
from unittest.mock import MagicMock, patch, call

# Make sure Backend/ is on the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

# Inject Django stub modules so generate_campaign_emails() can be imported
# and called without a running Django project
_mock_et = MagicMock()
_mock_et.objects.create.return_value = MagicMock()
_apps_mod = MagicMock()
_assessments_mod = MagicMock()
_models_mod = MagicMock()
_models_mod.EmailTemplate = _mock_et
sys.modules.setdefault('apps', _apps_mod)
sys.modules.setdefault('apps.assessments', _assessments_mod)
sys.modules.setdefault('apps.assessments.models', _models_mod)

from ml_models.email_generator import (
    _similarity,
    _apply_capitalization,
    _pick_sender,
    _select_red_flags,
    _PHISHING_RED_FLAGS_EN,
    _PHISHING_RED_FLAGS_AR,
    _PHISHING_SENDERS_EN,
    _PHISHING_SENDERS_AR,
    _LEGIT_SENDERS_EN,
    _LEGIT_SENDERS_AR,
    EmailGenerator,
)


# ---------------------------------------------------------------------------
# 1. _similarity()
# ---------------------------------------------------------------------------

class TestSimilarity(unittest.TestCase):

    def test_identical_strings_return_1(self):
        self.assertEqual(_similarity("hello world", "hello world"), 1.0)

    def test_completely_different_strings_return_low(self):
        sim = _similarity("your account has been suspended click here", "quarterly meeting agenda attached")
        self.assertLess(sim, 0.3)

    def test_near_duplicate_above_threshold(self):
        a = "please be advised that expense reports for the month of june must be submitted by may 10."
        b = "please be advised that expense reports for the month of july must be submitted by next monday."
        sim = _similarity(a, b)
        self.assertGreater(sim, 0.80)

    def test_partial_overlap_mid_range(self):
        a = "your account has been flagged for unusual activity please verify your identity"
        b = "your profile has been updated please verify your identity to continue"
        sim = _similarity(a, b)
        self.assertGreater(sim, 0.3)
        self.assertLess(sim, 0.9)

    def test_case_insensitive(self):
        sim_lower = _similarity("urgent verify your account", "urgent verify your account")
        sim_mixed = _similarity("Urgent Verify Your Account", "urgent verify your account")
        self.assertAlmostEqual(sim_lower, sim_mixed, places=5)

    def test_empty_strings(self):
        self.assertEqual(_similarity("", ""), 1.0)

    def test_one_empty_string(self):
        self.assertEqual(_similarity("hello", ""), 0.0)

    def test_single_word_difference(self):
        a = "please submit your expense report by friday"
        b = "please submit your expense report by monday"
        sim = _similarity(a, b)
        self.assertGreater(sim, 0.85)

    def test_arabic_near_duplicate(self):
        a = "نود تذكيركم بأن آخر موعد لتقديم تقارير الأداء الربعية هو يوم الثلاثاء الموافق 3 نوفمبر"
        b = "نود تذكيركم بأن آخر موعد لتقديم تقارير الأداء الربعية هو يوم الاثنين الموافق 21 مارس"
        sim = _similarity(a, b)
        self.assertGreater(sim, 0.80)

    def test_arabic_different_topics(self):
        a = "تنبيه أمني تم رصد محاولة دخول غير مصرح بها إلى حسابك"
        b = "نود إبلاغكم بأن اجتماع قسم المشتريات سيعقد يوم الاثنين"
        sim = _similarity(a, b)
        self.assertLess(sim, 0.4)

    def test_symmetry(self):
        a = "click here to verify your account immediately"
        b = "please verify your identity through our portal"
        self.assertAlmostEqual(_similarity(a, b), _similarity(b, a), places=10)


# ---------------------------------------------------------------------------
# 2. _apply_capitalization()
# ---------------------------------------------------------------------------

class TestApplyCapitalization(unittest.TestCase):

    def test_capitalizes_first_word(self):
        result = _apply_capitalization("urgent: verify your account now.")
        self.assertTrue(result[0].isupper())

    def test_capitalizes_after_period(self):
        result = _apply_capitalization("hello world. please click the link. thank you.")
        self.assertIn("Please", result)
        self.assertIn("Thank", result)

    def test_capitalizes_after_exclamation(self):
        result = _apply_capitalization("warning! your account is at risk! act now.")
        self.assertIn("Your", result)
        self.assertIn("Act", result)

    def test_capitalizes_after_question_mark(self):
        result = _apply_capitalization("did you log in? if not, please verify.")
        self.assertIn("If", result)

    def test_standalone_i_capitalized(self):
        result = _apply_capitalization("i am writing to inform you that i have detected unusual activity.")
        self.assertNotIn(" i ", result)
        self.assertIn(" I ", result)

    def test_i_at_start(self):
        result = _apply_capitalization("i would like to schedule a meeting.")
        self.assertTrue(result.startswith("I"))

    def test_i_inside_word_not_changed(self):
        # "in", "is", "it" should not be changed — only standalone "i"
        result = _apply_capitalization("it is important to click the link.")
        self.assertIn("it", result.lower())

    def test_already_capitalized_unchanged(self):
        text = "Hello World. This Is A Test."
        result = _apply_capitalization(text)
        self.assertEqual(result, text)

    def test_empty_string(self):
        self.assertEqual(_apply_capitalization(""), "")

    def test_multiple_sentences_all_capitalized(self):
        result = _apply_capitalization(
            "your account has been compromised. please verify immediately. "
            "click the link below. this link expires in 24 hours."
        )
        sentences = [s.strip() for s in result.split('.') if s.strip()]
        for sentence in sentences:
            self.assertTrue(sentence[0].isupper(), f"Not capitalized: '{sentence}'")


# ---------------------------------------------------------------------------
# 3. _pick_sender() keyword matching
# ---------------------------------------------------------------------------

class TestPickSender(unittest.TestCase):

    # --- Legitimate: always random from pool, body ignored ---
    def test_legit_en_returns_from_pool(self):
        sender = _pick_sender('legitimate', 'en', 'some body text')
        self.assertIn(sender, _LEGIT_SENDERS_EN)

    def test_legit_ar_returns_from_pool(self):
        sender = _pick_sender('legitimate', 'ar', 'بعض النصوص')
        self.assertIn(sender, _LEGIT_SENDERS_AR)

    def test_legit_no_body_still_works(self):
        sender = _pick_sender('legitimate', 'en')
        self.assertIn(sender, _LEGIT_SENDERS_EN)

    # --- English phishing keyword matching ---
    def test_en_netflix_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your netflix account has been flagged')
        self.assertEqual(name, "Netflix Support")
        self.assertIn("netflix", email)

    def test_en_microsoft_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your account at microsoft requires verification')
        self.assertEqual(name, "Microsoft Support")
        self.assertIn("microsoft", email)

    def test_en_paypal_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your paypal account has been limited')
        self.assertEqual(name, "PayPal Security Team")
        self.assertIn("paypal", email)

    def test_en_google_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'google has detected suspicious activity')
        self.assertEqual(name, "Google Account Security")
        self.assertIn("google", email)

    def test_en_amazon_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your amazon order could not be delivered')
        self.assertEqual(name, "Amazon Customer Service")
        self.assertIn("amazon", email)

    def test_en_linkedin_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your linkedin profile has been reviewed')
        self.assertEqual(name, "LinkedIn Security")
        self.assertIn("linkedin", email)

    def test_en_coinbase_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'coinbase detected unusual login activity')
        self.assertEqual(name, "Coinbase Support")
        self.assertIn("coinbase", email)

    def test_en_package_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your package could not be delivered today')
        self.assertEqual(name, "Amazon Customer Service")

    def test_en_shipment_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your international shipment is being held at customs')
        self.assertIn("DHL", name)

    def test_en_apple_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your apple id has been locked')
        self.assertEqual(name, "Apple Support")
        self.assertIn("apple", email)

    def test_en_absher_keyword(self):
        name, email = _pick_sender('phishing', 'en', 'your absher account requires verification')
        self.assertEqual(name, "Absher Digital Services")

    def test_en_no_keyword_returns_from_pool(self):
        name, email = _pick_sender('phishing', 'en', 'click here to claim your reward now')
        self.assertIn((name, email), _PHISHING_SENDERS_EN)

    def test_en_keyword_case_insensitive(self):
        name1, _ = _pick_sender('phishing', 'en', 'your NETFLIX account is at risk')
        name2, _ = _pick_sender('phishing', 'en', 'your netflix account is at risk')
        self.assertEqual(name1, name2)

    # --- Arabic phishing keyword matching ---
    def test_ar_absher_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'منصة أبشر تطلب تحديث بياناتك')
        self.assertEqual(name, "منصة أبشر")
        self.assertIn("absher", email)

    def test_ar_gosi_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'التأمينات الاجتماعية تشعركم بوجود اشتراك مزدوج')
        self.assertEqual(name, "التأمينات الاجتماعية")
        self.assertIn("gosi", email)

    def test_ar_health_ministry_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'إشعار من وزارة الصحة بشأن موعدك')
        self.assertEqual(name, "وزارة الصحة")
        self.assertIn("moh", email)

    def test_ar_zatca_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'هيئة الزكاة والضريبة تطلب منك السداد')
        self.assertIn("الزكاة", name)
        self.assertIn("zatca", email)

    def test_ar_traffic_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'تم تسجيل مخالفة مرورية جديدة باسمك')
        self.assertIn("المرور", name)
        self.assertIn("traffic", email)

    def test_ar_alrajhi_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'بنك الراجحي يطلب تحديث بياناتك')
        self.assertEqual(name, "بنك الراجحي")
        self.assertIn("alrajhi", email)

    def test_ar_sab_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'تهانينا من بنك ساب على اختيارك')
        self.assertEqual(name, "بنك ساب")
        self.assertIn("sab", email)

    def test_ar_sehhaty_keyword(self):
        name, email = _pick_sender('phishing', 'ar', 'تطبيق صحتي يحتاج تحديث بياناتك الصحية')
        self.assertEqual(name, "تطبيق صحتي")
        self.assertIn("sehhaty", email)

    def test_ar_no_keyword_returns_from_pool(self):
        name, email = _pick_sender('phishing', 'ar', 'اضغط على الرابط للحصول على الجائزة')
        self.assertIn((name, email), _PHISHING_SENDERS_AR)


# ---------------------------------------------------------------------------
# 4. _select_red_flags()
# ---------------------------------------------------------------------------

class TestSelectRedFlags(unittest.TestCase):

    # --- Always returns exactly 3 flags ---

    def test_always_returns_3_flags_en(self):
        body = "Click here to verify your account immediately."
        result = _select_red_flags(body, 'en')
        self.assertEqual(len(result), 3)

    def test_always_returns_3_flags_ar(self):
        body = "يرجى الضغط على الرابط لتأكيد بياناتك فوراً"
        result = _select_red_flags(body, 'ar')
        self.assertEqual(len(result), 3)

    def test_returns_3_even_with_no_keywords(self):
        body = "a b c d e f g"  # no matching keywords at all
        result = _select_red_flags(body, 'en')
        self.assertEqual(len(result), 3)

    # --- Flags are from the correct pool ---

    def test_en_flags_are_from_en_pool(self):
        body = "Click here to verify your account immediately."
        result = _select_red_flags(body, 'en')
        for flag in result:
            self.assertIn(flag, _PHISHING_RED_FLAGS_EN)

    def test_ar_flags_are_from_ar_pool(self):
        body = "يرجى الضغط على الرابط لتأكيد بياناتك فوراً"
        result = _select_red_flags(body, 'ar')
        for flag in result:
            self.assertIn(flag, _PHISHING_RED_FLAGS_AR)

    def test_no_duplicate_flags(self):
        body = "Urgent! Click the link to verify your password immediately. Dear customer."
        result = _select_red_flags(body, 'en')
        self.assertEqual(len(result), len(set(result)))

    # --- Sender domain flag always matched (empty keyword list) ---

    def test_sender_domain_flag_always_included_en(self):
        # Even with a body that has no other signals, sender domain should appear
        body = "this is a very generic body with no special keywords at all here"
        result = _select_red_flags(body, 'en')
        self.assertIn("Suspicious sender domain not matching the claimed organisation", result)

    def test_sender_domain_flag_always_included_ar(self):
        body = "نص عادي بدون أي كلمات مفتاحية مشبوهة"
        result = _select_red_flags(body, 'ar')
        self.assertIn("نطاق المُرسِل مشبوه ولا يتطابق مع الجهة المزعومة", result)

    # --- English keyword matching ---

    def test_en_urgent_keyword_urgent(self):
        body = "This is urgent! Please verify your account."
        result = _select_red_flags(body, 'en')
        self.assertIn("Urgent language pressuring immediate action", result)

    def test_en_urgent_keyword_hours(self):
        body = "Your account will be locked within 24 hours."
        result = _select_red_flags(body, 'en')
        self.assertIn("Urgent language pressuring immediate action", result)

    def test_en_urgent_keyword_expires(self):
        body = "This link expires in 12 hours. Act now."
        result = _select_red_flags(body, 'en')
        self.assertIn("Urgent language pressuring immediate action", result)

    def test_en_credentials_keyword_verify(self):
        body = "Please verify your identity through our secure portal."
        result = _select_red_flags(body, 'en')
        self.assertIn("Request for personal or account credentials", result)

    def test_en_credentials_keyword_password(self):
        body = "Enter your password to continue to your account."
        result = _select_red_flags(body, 'en')
        self.assertIn("Request for personal or account credentials", result)

    def test_en_credentials_keyword_click_the_link(self):
        body = "Please click the link below to confirm your details."
        result = _select_red_flags(body, 'en')
        self.assertIn("Request for personal or account credentials", result)

    def test_en_generic_greeting_dear_customer(self):
        body = "Dear customer, your account has been flagged."
        result = _select_red_flags(body, 'en')
        self.assertIn("Generic greeting instead of your name", result)

    def test_en_generic_greeting_dear_valued(self):
        body = "Dear valued member, we need to verify your identity."
        result = _select_red_flags(body, 'en')
        self.assertIn("Generic greeting instead of your name", result)

    def test_en_link_mismatch_click(self):
        body = "Click here to access your account securely."
        result = _select_red_flags(body, 'en')
        self.assertIn("Hover-over link mismatch", result)

    def test_en_link_mismatch_portal(self):
        body = "Access our secure portal to verify your information."
        result = _select_red_flags(body, 'en')
        self.assertIn("Hover-over link mismatch", result)

    def test_en_case_insensitive_matching(self):
        body = "URGENT: Please VERIFY your account IMMEDIATELY."
        result = _select_red_flags(body, 'en')
        self.assertIn("Urgent language pressuring immediate action", result)

    # --- All 5 flags matched → only 3 returned ---

    def test_en_all_5_signals_present_returns_only_3(self):
        body = (
            "Dear customer, urgent action required! "
            "Click the link to verify your password within 24 hours. "
            "Please confirm your account credentials immediately."
        )
        result = _select_red_flags(body, 'en')
        self.assertEqual(len(result), 3)

    # --- Arabic keyword matching ---

    def test_ar_urgent_keyword_fawran(self):
        body = "يرجى الرد فوراً لتجنب تعليق الخدمة"
        result = _select_red_flags(body, 'ar')
        self.assertIn("لغة عاجلة تضغط على اتخاذ إجراء فوري", result)

    def test_ar_urgent_keyword_ajil(self):
        body = "عاجل: تم اكتشاف نشاط مشبوه على حسابك"
        result = _select_red_flags(body, 'ar')
        self.assertIn("لغة عاجلة تضغط على اتخاذ إجراء فوري", result)

    def test_ar_urgent_keyword_deadline(self):
        body = "آخر موعد للسداد هو يوم الثلاثاء القادم"
        result = _select_red_flags(body, 'ar')
        self.assertIn("لغة عاجلة تضغط على اتخاذ إجراء فوري", result)

    def test_ar_credentials_keyword_bianaat(self):
        body = "يرجى تحديث بياناتك الشخصية عبر الرابط"
        result = _select_red_flags(body, 'ar')
        self.assertIn("طلب بيانات شخصية أو بيانات حساب", result)

    def test_ar_credentials_keyword_tahaqoq(self):
        body = "يرجى تحقق من هويتك وتسجيل الدخول من جديد"
        result = _select_red_flags(body, 'ar')
        self.assertIn("طلب بيانات شخصية أو بيانات حساب", result)

    def test_ar_link_keyword_rabit(self):
        body = "اضغط على الرابط أدناه للتحقق من حسابك"
        result = _select_red_flags(body, 'ar')
        self.assertIn("رابط مزيف أو مشبوه", result)

    def test_ar_link_keyword_idghat(self):
        body = "اضغط هنا للدخول إلى حسابك الآن"
        result = _select_red_flags(body, 'ar')
        self.assertIn("رابط مزيف أو مشبوه", result)

    def test_ar_generic_greeting(self):
        # Isolated: only greeting + always-matched sender domain signal in this body
        # No urgent/credentials/link keywords present
        body = "عزيزي العميل نرجو مراجعة طلبكم"
        result = _select_red_flags(body, 'ar')
        self.assertIn("تحية عامة بدلاً من اسمك", result)

    # --- Integration: live model outputs always get body-matched flags ---

    def test_en_phishing_body_flags_match_body_content(self):
        """
        For any real EN phishing body: at least 2 of the 3 returned flags
        should have at least one keyword signal present in the body.
        (The third may be the always-included sender domain flag.)
        """
        from ml_models.email_generator import _RED_FLAG_SIGNALS_EN
        gen = EmailGenerator()
        for _ in range(5):
            result = gen.generate_email('phishing', 'en')
            body = result['body'].lower()
            flags = _select_red_flags(result['body'], 'en')
            evidence_count = sum(
                1 for f in flags
                if not _RED_FLAG_SIGNALS_EN.get(f) or  # empty = always matched
                any(kw in body for kw in _RED_FLAG_SIGNALS_EN.get(f, []))
            )
            self.assertGreaterEqual(
                evidence_count, 2,
                f"Only {evidence_count}/3 flags have body evidence.\n"
                f"Body: {result['body'][:100]}\nFlags: {flags}"
            )

    def test_ar_phishing_body_flags_match_body_content(self):
        """Same check for Arabic phishing emails."""
        from ml_models.email_generator import _RED_FLAG_SIGNALS_AR
        gen = EmailGenerator()
        for _ in range(5):
            result = gen.generate_email('phishing', 'ar')
            body = result['body']
            flags = _select_red_flags(result['body'], 'ar')
            evidence_count = sum(
                1 for f in flags
                if not _RED_FLAG_SIGNALS_AR.get(f) or
                any(kw in body for kw in _RED_FLAG_SIGNALS_AR.get(f, []))
            )
            self.assertGreaterEqual(
                evidence_count, 2,
                f"Only {evidence_count}/3 flags have body evidence.\n"
                f"Body: {result['body'][:100]}\nFlags: {flags}"
            )


# ---------------------------------------------------------------------------
# 5. Deduplication logic (mocked generator)
# ---------------------------------------------------------------------------

class TestDeduplication(unittest.TestCase):
    """
    Test the deduplication retry logic in generate_campaign_emails()
    by patching EmailGenerator.generate_email to return controlled outputs.
    """

    def _make_campaign(self, english_ratio=1.0, name="Test Campaign"):
        campaign = MagicMock()
        campaign.english_ratio = english_ratio
        campaign.name = name
        return campaign

    def _make_email_data(self, body, subject="Subject", sender_name="Sender", sender_email="s@test.com"):
        return {'subject': subject, 'body': body, 'sender_name': sender_name, 'sender_email': sender_email}

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_unique_emails_no_retry(self, mock_get_gen, mock_template_class):
        """Unique bodies: generate_email called exactly once per email."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        bodies = [
            "Your netflix account has been suspended. Click the link to verify.",
            "Your google account shows unusual activity from a device in iran.",
            "Your paypal balance is on hold pending identity verification.",
        ]
        mock_gen.generate_email.side_effect = [self._make_email_data(b) for b in bodies]

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        generate_campaign_emails(campaign, num_phishing=3, num_legitimate=0)

        self.assertEqual(mock_gen.generate_email.call_count, 3)

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_duplicate_triggers_retry(self, mock_get_gen, mock_template_class):
        """Duplicate body triggers at least one retry."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        body_a = "Please be advised that expense reports for the month of june must be submitted by may 10."
        body_b = "Please be advised that expense reports for the month of july must be submitted by next monday."
        body_c = "Your account has been flagged for unusual activity please verify immediately."

        # First email: body_a (accepted)
        # Second email attempt 1: body_b (>80% similar to body_a → retry)
        # Second email attempt 2: body_c (different → accepted)
        mock_gen.generate_email.side_effect = [
            self._make_email_data(body_a),
            self._make_email_data(body_b),
            self._make_email_data(body_c),
        ]

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        generate_campaign_emails(campaign, num_phishing=2, num_legitimate=0)

        # Should have called generate_email 3 times (1 + retry + 1)
        self.assertEqual(mock_gen.generate_email.call_count, 3)
        # Should have created 2 templates
        self.assertEqual(mock_template_class.objects.create.call_count, 2)

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_accepts_best_after_max_retries(self, mock_get_gen, mock_template_class):
        """After 3 retries all similar, accepts the least similar one (not discarded)."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        base = "Please be advised that expense reports for the month of june must be submitted by may 10 all receipts attached."
        dup1 = "Please be advised that expense reports for the month of july must be submitted by may 15 all receipts attached."
        dup2 = "Please be advised that expense reports for the month of august must be submitted by june 1 all receipts attached."
        dup3 = "Please be advised that expense reports for the month of september must be submitted by june 5 all receipts attached."
        dup4 = "Please be advised that expense reports for the month of october must be submitted by june 10 all receipts attached."

        mock_gen.generate_email.side_effect = [
            self._make_email_data(base),   # email 1 — accepted
            self._make_email_data(dup1),   # email 2 attempt 1 — similar, retry
            self._make_email_data(dup2),   # email 2 attempt 2 — similar, retry
            self._make_email_data(dup3),   # email 2 attempt 3 — similar, retry
            self._make_email_data(dup4),   # email 2 attempt 4 — still similar, max retries hit
        ]

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        result = generate_campaign_emails(campaign, num_phishing=2, num_legitimate=0)

        # Both emails should still be created (not silently dropped)
        self.assertEqual(mock_template_class.objects.create.call_count, 2)

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_different_type_groups_independent(self, mock_get_gen, mock_template_class):
        """Similarity check is per (email_type, language) group — phishing and legitimate don't cross-check."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        # Same body used for both phishing and legitimate — should NOT trigger retry
        # because they are different groups
        same_body = "Please be advised that expense reports for the month of june must be submitted by may 10."
        mock_gen.generate_email.side_effect = [
            self._make_email_data(same_body),
            self._make_email_data(same_body),
        ]

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        generate_campaign_emails(campaign, num_phishing=1, num_legitimate=1)

        # No retries — called exactly twice
        self.assertEqual(mock_gen.generate_email.call_count, 2)
        self.assertEqual(mock_template_class.objects.create.call_count, 2)

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_generation_exception_skips_email(self, mock_get_gen, mock_template_class):
        """If generate_email raises, that email is skipped gracefully."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        mock_gen.generate_email.side_effect = [
            self._make_email_data("Your account is at risk. Click here to verify."),
            RuntimeError("Model inference failed"),
            self._make_email_data("Your payment method needs to be updated immediately."),
        ]

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        result = generate_campaign_emails(campaign, num_phishing=3, num_legitimate=0)

        # Only 2 templates created (one was skipped)
        self.assertEqual(mock_template_class.objects.create.call_count, 2)

    @patch('apps.assessments.models.EmailTemplate')
    @patch('ml_models.email_generator._get_generator')
    def test_first_email_in_group_always_accepted(self, mock_get_gen, mock_template_class):
        """The very first email in a group is always accepted with no comparison."""
        mock_gen = MagicMock()
        mock_get_gen.return_value = mock_gen
        mock_template_class.objects.create.return_value = MagicMock()

        mock_gen.generate_email.return_value = self._make_email_data("First email body for this group.")

        from ml_models.email_generator import generate_campaign_emails
        campaign = self._make_campaign(english_ratio=1.0)
        generate_campaign_emails(campaign, num_phishing=1, num_legitimate=0)

        self.assertEqual(mock_gen.generate_email.call_count, 1)
        self.assertEqual(mock_template_class.objects.create.call_count, 1)


# ---------------------------------------------------------------------------
# 5. Integration tests — live model
# ---------------------------------------------------------------------------

class TestLiveGeneration(unittest.TestCase):
    """Runs actual LSTM inference. Requires model files to be present."""

    @classmethod
    def setUpClass(cls):
        cls.gen = EmailGenerator()

    def test_english_phishing_generates_valid_email(self):
        result = self.gen.generate_email('phishing', 'en')
        self.assertIn('subject', result)
        self.assertIn('body', result)
        self.assertIn('sender_name', result)
        self.assertIn('sender_email', result)
        self.assertGreater(len(result['body'].split()), 14)

    def test_arabic_phishing_generates_valid_email(self):
        result = self.gen.generate_email('phishing', 'ar')
        self.assertGreater(len(result['body'].split()), 14)

    def test_english_legitimate_generates_valid_email(self):
        result = self.gen.generate_email('legitimate', 'en')
        self.assertGreater(len(result['body'].split()), 14)

    def test_arabic_legitimate_generates_valid_email(self):
        result = self.gen.generate_email('legitimate', 'ar')
        self.assertGreater(len(result['body'].split()), 14)

    def test_english_body_starts_with_capital(self):
        for _ in range(5):
            result = self.gen.generate_email('phishing', 'en')
            self.assertTrue(
                result['body'][0].isupper(),
                f"Body does not start with capital: {result['body'][:60]}"
            )

    def test_english_legitimate_body_starts_with_capital(self):
        for _ in range(5):
            result = self.gen.generate_email('legitimate', 'en')
            self.assertTrue(
                result['body'][0].isupper(),
                f"Body does not start with capital: {result['body'][:60]}"
            )

    def test_english_no_standalone_lowercase_i(self):
        import re
        pattern = re.compile(r'\bi\b')
        for _ in range(5):
            result = self.gen.generate_email('phishing', 'en')
            self.assertIsNone(
                pattern.search(result['body']),
                f"Found lowercase standalone 'i' in: {result['body'][:100]}"
            )

    def _assert_majority_unique(self, emails, label):
        """
        Helper: assert at least 90% of pairwise combinations are below 0.80 similarity.
        Raw generate_email() has no deduplication guard — generate_campaign_emails()
        handles that at campaign level. A small number of similar pairs from the model
        is acceptable here; this helper allows up to 10% similar pairs.
        """
        bodies = [e['body'] for e in emails]
        pairs = [(i, j) for i in range(len(bodies)) for j in range(i + 1, len(bodies))]
        similar_pairs = [(i, j) for i, j in pairs if _similarity(bodies[i], bodies[j]) >= 0.80]
        allowed = max(1, len(pairs) // 10)
        self.assertLessEqual(
            len(similar_pairs), allowed,
            f"[{label}] {len(similar_pairs)} similar pairs found (allowed {allowed}):\n" +
            '\n'.join(
                f"  [{i}] vs [{j}] sim={_similarity(bodies[i], bodies[j]):.2f}:\n"
                f"    {bodies[i][:70]}\n    {bodies[j][:70]}"
                for i, j in similar_pairs
            )
        )

    def test_six_phishing_en_majority_below_threshold(self):
        """Generate 6 EN phishing emails, at least 90% of pairs below 0.80 similarity."""
        emails = [self.gen.generate_email('phishing', 'en') for _ in range(6)]
        self._assert_majority_unique(emails, 'phishing_en')

    def test_six_phishing_ar_majority_below_threshold(self):
        """Generate 6 AR phishing emails, at least 90% of pairs below 0.80 similarity."""
        emails = [self.gen.generate_email('phishing', 'ar') for _ in range(6)]
        self._assert_majority_unique(emails, 'phishing_ar')

    def test_six_legitimate_en_majority_below_threshold(self):
        """Generate 6 EN legitimate emails, at least 90% of pairs below 0.80 similarity."""
        emails = [self.gen.generate_email('legitimate', 'en') for _ in range(6)]
        self._assert_majority_unique(emails, 'legitimate_en')

    def test_six_legitimate_ar_majority_below_threshold(self):
        """Generate 6 AR legitimate emails, at least 90% of pairs below 0.80 similarity."""
        emails = [self.gen.generate_email('legitimate', 'ar') for _ in range(6)]
        self._assert_majority_unique(emails, 'legitimate_ar')

    def test_netflix_body_gets_netflix_sender(self):
        """If model generates a body mentioning netflix, sender should match."""
        for _ in range(10):
            result = self.gen.generate_email('phishing', 'en')
            if 'netflix' in result['body'].lower():
                self.assertEqual(result['sender_name'], "Netflix Support",
                                 f"netflix in body but sender is: {result['sender_name']}")
                break

    def test_absher_body_gets_absher_sender_ar(self):
        """If model generates Arabic body mentioning أبشر, sender should match."""
        for _ in range(10):
            result = self.gen.generate_email('phishing', 'ar')
            if 'أبشر' in result['body']:
                self.assertEqual(result['sender_name'], "منصة أبشر",
                                 f"أبشر in body but sender is: {result['sender_name']}")
                break


if __name__ == '__main__':
    unittest.main(verbosity=2)
