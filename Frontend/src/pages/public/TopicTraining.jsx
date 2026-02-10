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
} from 'lucide-react';

const topicConfig = {
  phishing: {
    icon: Mail,
    color: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-100 text-blue-600',
    accentColor: 'text-blue-600',
    accentBg: 'bg-blue-50',
  },
  smishing: {
    icon: Smartphone,
    color: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-100 text-emerald-600',
    accentColor: 'text-emerald-600',
    accentBg: 'bg-emerald-50',
  },
  vishing: {
    icon: Phone,
    color: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-100 text-purple-600',
    accentColor: 'text-purple-600',
    accentBg: 'bg-purple-50',
  },
};

function TopicTraining() {
  const { topic } = useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const config = topicConfig[topic];
  if (!config) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">{t('errors.notFound')}</h2>
          <Link to="/training" className="btn-primary">
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  // Saudi-specific red flags by topic
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

  return (
    <div className="fade-in">
      {/* Header */}
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

      {/* Red Flags */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-danger-50 flex items-center justify-center">
              <AlertTriangle className="h-5 w-5 text-danger-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {i18n.language === 'ar' ? 'علامات التحذير' : 'Red Flags to Watch For'}
            </h2>
          </div>

          <div className="space-y-3">
            {currentRedFlags.map((flag, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-danger-50 rounded-xl border border-danger-100">
                <XCircle className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800">{i18n.language === 'ar' ? flag.ar : flag.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Protection Tips */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-full bg-success-50 flex items-center justify-center">
              <Shield className="h-5 w-5 text-success-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">
              {i18n.language === 'ar' ? 'كيف تحمي نفسك' : 'How to Protect Yourself'}
            </h2>
          </div>

          <div className="space-y-3">
            {currentTips.map((tip, index) => (
              <div key={index} className="flex items-start gap-3 p-4 bg-success-50 rounded-xl border border-green-100">
                <CheckCircle className="h-5 w-5 text-success-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-800">{i18n.language === 'ar' ? tip.ar : tip.en}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quiz CTA */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-3">
            {t('public.quiz.title')}
          </h2>
          <p className="text-gray-600 mb-6 max-w-xl mx-auto">
            {t('public.quiz.subtitle')}
          </p>
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
