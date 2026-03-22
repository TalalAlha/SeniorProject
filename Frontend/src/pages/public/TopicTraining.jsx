import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Smartphone,
  Phone,
  ArrowLeft,
  ArrowRight,
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  BookOpen,
  Video,
} from 'lucide-react';
import InteractiveLessonWrapper from '../../components/training/InteractiveLessonWrapper';

// Interactive components – public portal (place files before uncommenting)
import PhishAwareV1AR from '../../components/training/interactive/public/PhishAware_V1_AR';
import PhishAwareV1EN from '../../components/training/interactive/public/PhishAware_V1_EN';
import PhishAwareV2AR from '../../components/training/interactive/public/PhishAware_V2_AR';
import PhishAwareV2EN from '../../components/training/interactive/public/PhishAware_V2_EN';
import PhishAwareV3AR from '../../components/training/interactive/public/PhishAware_V3_AR';
import PhishAwareV3EN from '../../components/training/interactive/public/PhishAware_V3_EN';

const topicConfig = {
  phishing: {
    icon: Mail,
    color: 'from-blue-500 to-blue-600 dark:from-blue-800 dark:to-blue-900',
    iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
    accentColor: 'text-blue-600 dark:text-blue-400',
    accentBg: 'bg-blue-50 dark:bg-blue-900/20',
  },
  smishing: {
    icon: Smartphone,
    color: 'from-emerald-500 to-emerald-600 dark:from-emerald-800 dark:to-emerald-900',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
    accentColor: 'text-emerald-600 dark:text-emerald-400',
    accentBg: 'bg-emerald-50 dark:bg-emerald-900/20',
  },
  vishing: {
    icon: Phone,
    color: 'from-purple-500 to-purple-600 dark:from-purple-800 dark:to-purple-900',
    iconBg: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
    accentColor: 'text-purple-600 dark:text-purple-400',
    accentBg: 'bg-purple-50 dark:bg-purple-900/20',
  },
};

function TopicTraining() {
  const { topic } = useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  // null = mode chooser | 'video' = video content | 'interactive' = lesson
  const [mode, setMode] = useState(null);

  const config = topicConfig[topic];
  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('errors.notFound')}</h2>
          <Link to="/training" className="btn-primary">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  // Map topic → component (keyed by language)
  const interactiveMap = {
    phishing: { ar: PhishAwareV1AR, en: PhishAwareV1EN },
    vishing:  { ar: PhishAwareV2AR, en: PhishAwareV2EN },
    smishing: { ar: PhishAwareV3AR, en: PhishAwareV3EN },
  };
  const InteractiveComponent = interactiveMap[topic]?.[lang];
  const hasInteractive = Boolean(InteractiveComponent);

  // Saudi-specific content
  const redFlags = {
    phishing: [
      { en: 'Emails claiming to be from Absher asking to verify your identity via a link', ar: 'رسائل تدعي أنها من أبشر تطلب التحقق من هويتك عبر رابط' },
      { en: 'Fake SAMA alerts about account suspension or unauthorized transactions', ar: 'تنبيهات ساما المزيفة حول تعليق الحساب أو معاملات غير مصرح بها' },
      { en: 'Messages impersonating Saudi banks requesting password updates', ar: 'رسائل تنتحل صفة البنوك السعودية تطلب تحديث كلمة المرور' },
      { en: 'Urgent emails from "government agencies" threatening account closure', ar: 'رسائل عاجلة من "جهات حكومية" تهدد بإغلاق الحساب' },
      { en: 'Offers too good to be true from fake e-commerce platforms', ar: 'عروض مغرية من منصات تجارة إلكترونية مزيفة' },
    ],
    smishing: [
      { en: 'Fake Nafath OTP codes asking you to share or click a link', ar: 'أكواد نفاذ مزيفة تطلب منك المشاركة أو النقر على رابط' },
      { en: 'Saudi Post delivery notifications with suspicious tracking links', ar: 'إشعارات توصيل البريد السعودي مع روابط تتبع مشبوهة' },
      { en: 'SADAD payment alerts claiming failed transactions', ar: 'تنبيهات دفع سداد تدعي فشل المعاملات' },
      { en: 'Prize messages from fake STC, Mobily, or Zain promotions', ar: 'رسائل جوائز من عروض STC أو موبايلي أو زين مزيفة' },
      { en: 'Fake Tawakkalna or Tabaud app update messages', ar: 'رسائل تحديث مزيفة لتطبيق توكلنا أو تباعد' },
    ],
    vishing: [
      { en: 'Callers claiming to be from Ministry of Interior requesting personal details', ar: 'متصلون يدعون أنهم من وزارة الداخلية يطلبون تفاصيل شخصية' },
      { en: 'Fake bank representatives asking for OTP codes over the phone', ar: 'ممثلون مزيفون للبنوك يطلبون أكواد OTP عبر الهاتف' },
      { en: 'Scammers posing as telecom support to "fix" account issues', ar: 'محتالون ينتحلون صفة دعم الاتصالات "لإصلاح" مشاكل الحساب' },
      { en: 'Automated calls claiming your Absher account will be suspended', ar: 'مكالمات آلية تدعي أن حساب أبشر سيتم تعليقه' },
      { en: 'Prize claim calls asking for bank details for "fund transfer"', ar: 'مكالمات المطالبة بالجوائز تطلب تفاصيل بنكية "لتحويل الأموال"' },
    ],
  };

  const protectionTips = {
    phishing: [
      { en: 'Always check the sender email domain — Absher uses @absher.sa only', ar: 'تحقق دائماً من نطاق بريد المرسل — أبشر يستخدم @absher.sa فقط' },
      { en: 'Never click links in emails; go directly to the official website', ar: 'لا تنقر أبداً على الروابط في الرسائل؛ اذهب مباشرة إلى الموقع الرسمي' },
      { en: 'Look for HTTPS and verify the website URL matches the official domain', ar: 'ابحث عن HTTPS وتحقق من أن رابط الموقع يطابق النطاق الرسمي' },
      { en: 'Report suspicious emails to your bank or the Saudi CERT', ar: 'أبلغ عن الرسائل المشبوهة لبنكك أو المركز الوطني الإرشادي للأمن السيبراني' },
    ],
    smishing: [
      { en: 'Nafath OTP codes should only be entered in the official Nafath app', ar: 'أكواد نفاذ يجب إدخالها فقط في تطبيق نفاذ الرسمي' },
      { en: 'Saudi Post tracks shipments only through splonline.com.sa', ar: 'البريد السعودي يتتبع الشحنات فقط عبر splonline.com.sa' },
      { en: 'Never share OTP codes received via SMS with anyone', ar: 'لا تشارك أبداً أكواد التحقق المرسلة عبر الرسائل النصية مع أي شخص' },
      { en: 'Block and report suspicious numbers through your phone settings', ar: 'احظر وأبلغ عن الأرقام المشبوهة من خلال إعدادات هاتفك' },
    ],
    vishing: [
      { en: 'Government agencies will never ask for sensitive info over the phone', ar: 'الجهات الحكومية لن تطلب أبداً معلومات حساسة عبر الهاتف' },
      { en: 'If in doubt, hang up and call the official number from the website', ar: 'إذا شككت، أغلق الخط واتصل بالرقم الرسمي من الموقع الإلكتروني' },
      { en: 'Banks will never ask for your full card number or CVV by phone', ar: 'البنوك لن تطلب أبداً رقم بطاقتك الكامل أو CVV عبر الهاتف' },
      { en: 'Use the official "Kolluna Amn" app to report suspicious calls', ar: 'استخدم تطبيق "كلنا أمن" الرسمي للإبلاغ عن المكالمات المشبوهة' },
    ],
  };

  const currentRedFlags = redFlags[topic] || [];
  const currentTips = protectionTips[topic] || [];

  // ── Interactive mode ──────────────────────────────────────────────────────
  if (mode === 'interactive' && InteractiveComponent) {
    return (
      <div className="min-h-screen bg-gray-950">
        <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center">
          <button
            onClick={() => setMode(null)}
            className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
          >
            {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {t('common.back')}
          </button>
        </div>
        <InteractiveLessonWrapper
          LessonComponent={InteractiveComponent}
          lessonType={topic}
          language={lang}
        />
      </div>
    );
  }

  // ── Shared page header ────────────────────────────────────────────────────
  const pageHeader = (
    <section className={`bg-gradient-to-br ${config.color} text-white py-16`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link
          to="/training"
          className="inline-flex items-center text-white/80 hover:text-white mb-6 transition-colors"
        >
          {isRTL ? <ArrowRight className="h-4 w-4 ml-2" /> : <ArrowLeft className="h-4 w-4 mr-2" />}
          {t('common.back')}
        </Link>
        <div className="flex items-center gap-4">
          <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center">
            <Icon className="h-8 w-8" />
          </div>
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              {t(`public.topics.${topic}.title`)}
            </h1>
            <p className="text-white/80 mt-1 text-lg">
              {t(`public.topics.${topic}.description`)}
            </p>
          </div>
        </div>
      </div>
    </section>
  );

  // ── Mode chooser (mode === null) ──────────────────────────────────────────
  if (mode === null) {
    return (
      <div className="fade-in">
        {pageHeader}
        <section className="py-14 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-2">
              {t('training.chooseMethod')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-center mb-8 text-sm">
              {t('training.chooseMethodSubtitle')}
            </p>

            <div className={`grid gap-6 ${hasInteractive ? 'sm:grid-cols-2' : 'sm:grid-cols-1 max-w-sm mx-auto'}`}>
              {hasInteractive && (
                <button
                  onClick={() => setMode('interactive')}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg hover:border-blue-300 dark:hover:border-blue-500 transition-all text-start group"
                >
                  <div className="bg-blue-100 dark:bg-blue-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                    <BookOpen className="h-7 w-7 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('training.interactive')}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('training.interactiveDescription')}</p>
                  <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />{t('training.interactiveBenefit1')}</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />{t('training.interactiveBenefit2')}</li>
                    <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-blue-500 flex-shrink-0" />{t('training.interactiveBenefit3')}</li>
                  </ul>
                </button>
              )}

              <button
                onClick={() => setMode('video')}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 p-8 hover:shadow-lg hover:border-emerald-300 dark:hover:border-emerald-500 transition-all text-start group"
              >
                <div className="bg-emerald-100 dark:bg-emerald-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
                  <Video className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('training.video')}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t('training.videoDescription')}</p>
                <ul className="space-y-1.5 text-sm text-gray-600 dark:text-gray-300">
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />{t('training.videoBenefit1')}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />{t('training.videoBenefit2')}</li>
                  <li className="flex items-center gap-2"><CheckCircle className="h-4 w-4 text-emerald-500 flex-shrink-0" />{t('training.videoBenefit3')}</li>
                </ul>
              </button>
            </div>
          </div>
        </section>
      </div>
    );
  }

  // ── Video mode ─────────────────────────────────────────────────────────────
  return (
    <div className="fade-in">
      {pageHeader}

      {/* Training Video */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('public.training.videoTitle')}
            </h2>
            {hasInteractive && (
              <button
                onClick={() => setMode('interactive')}
                className="btn-secondary flex items-center gap-2 text-sm"
              >
                <BookOpen className="h-4 w-4" />
                {t('training.switchToInteractive')}
              </button>
            )}
          </div>

          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg shadow-lg"
              src="https://www.youtube.com/embed/XBkzBrXlle0"
              title={`${topic.charAt(0).toUpperCase() + topic.slice(1)} Training Video`}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <p className="text-gray-600 dark:text-gray-300 mt-4 text-sm">
            {t('public.training.videoDescription')}
          </p>
        </div>
      </section>

      {/* Red Flags */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-danger-50 dark:bg-danger-900/20 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-danger-600 dark:text-danger-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {i18n.language === 'ar' ? 'علامات التحذير' : 'Red Flags to Watch For'}
            </h2>
          </div>
          <div className="space-y-3">
            {currentRedFlags.map((flag, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-danger-50 dark:bg-danger-900/20 rounded-xl border border-danger-100 dark:border-danger-800">
                <XCircle className="h-5 w-5 text-danger-500 dark:text-danger-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 dark:text-gray-200">{i18n.language === 'ar' ? flag.ar : flag.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Tips */}
      <section className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-success-50 dark:bg-success-900/20 flex items-center justify-center">
              <Shield className="h-5 w-5 text-success-600 dark:text-success-400" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {i18n.language === 'ar' ? 'كيف تحمي نفسك' : 'How to Protect Yourself'}
            </h2>
          </div>
          <div className="space-y-3">
            {currentTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-success-50 dark:bg-success-900/20 rounded-xl border border-green-100 dark:border-green-800">
                <CheckCircle className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800 dark:text-gray-200">{i18n.language === 'ar' ? tip.ar : tip.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="py-12 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{t('public.quiz.title')}</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-xl mx-auto">{t('public.quiz.subtitle')}</p>
          <Link
            to={`/quiz?topic=${topic}`}
            className="btn-primary inline-flex items-center text-lg px-8 py-3"
          >
            {t('public.quiz.startQuiz')}
            <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default TopicTraining;
