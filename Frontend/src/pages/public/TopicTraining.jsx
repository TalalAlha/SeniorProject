/**
 * TopicTraining — Interactive training lesson page (/training/:topic).
 *
 * Loads the correct bilingual interactive lesson component based on the
 * topic slug (email-phishing, sms-phishing, voice-phishing) and the active
 * language (en / ar) from i18n.
 */
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import InteractiveLessonWrapper from '../../components/training/InteractiveLessonWrapper';

// Interactive components – public portal
import PhishAwareV1AR from '../../components/training/interactive/public/PhishAware_V1_AR';
import PhishAwareV1EN from '../../components/training/interactive/public/PhishAware_V1_EN';
import PhishAwareV2AR from '../../components/training/interactive/public/PhishAware_V2_AR';
import PhishAwareV2EN from '../../components/training/interactive/public/PhishAware_V2_EN';
import PhishAwareV3AR from '../../components/training/interactive/public/PhishAware_V3_AR';
import PhishAwareV3EN from '../../components/training/interactive/public/PhishAware_V3_EN';

// Topic → interactive component (keyed by language).
const interactiveMap = {
  phishing: { ar: PhishAwareV1AR, en: PhishAwareV1EN },
  vishing:  { ar: PhishAwareV2AR, en: PhishAwareV2EN },
  smishing: { ar: PhishAwareV3AR, en: PhishAwareV3EN },
};

function TopicTraining() {
  const { topic } = useParams();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  const InteractiveComponent = interactiveMap[topic]?.[lang];

  // Unknown topic OR no interactive lesson available → bounce back.
  if (!InteractiveComponent) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('errors.notFound')}
          </h2>
          <Link to="/training" className="btn-primary">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="bg-gray-900 border-b border-gray-800 px-6 py-3 flex items-center">
        <Link
          to="/training"
          className="text-gray-400 hover:text-white flex items-center gap-2 text-sm transition-colors"
        >
          {isRTL ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
          {t('common.back')}
        </Link>
      </div>
      <InteractiveLessonWrapper
        LessonComponent={InteractiveComponent}
        lessonType={topic}
        language={lang}
      />
    </div>
  );
}

export default TopicTraining;
