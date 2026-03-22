import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AlertTriangle, CheckCircle, BookOpen, ShieldAlert, ArrowRight, Home } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { simulationsAPI } from '../../api';

const DIFFICULTY_COLOR = {
  'Easy - Obvious indicators': 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  'Medium - Some subtle indicators': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
  'Hard - Very convincing': 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
  'Expert - Nearly identical to legitimate': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
};

export default function SimulationCaught() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!token) { setError(true); setLoading(false); return; }
    fetchFeedback();
  }, [token]);

  const fetchFeedback = async () => {
    try {
      const res = await simulationsAPI.getSimulationFeedback(token);
      setFeedback(res.data);
      // Auto-switch UI language to match the template language
      if (res.data.language && res.data.language !== i18n.language) {
        i18n.changeLanguage(res.data.language);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const isArabic = i18n.language === 'ar';
  const dir = isArabic ? 'rtl' : 'ltr';

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center" dir={dir}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-14 w-14 border-b-2 border-red-500 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (error || !feedback) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4" dir={dir}>
        <div className="text-center max-w-md">
          <ShieldAlert className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
          <h1 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
            {isArabic ? 'الرابط غير صالح' : 'Invalid Link'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {isArabic
              ? 'هذا الرابط غير صالح أو انتهت صلاحيته.'
              : 'This simulation link is invalid or has expired.'}
          </p>
          <button
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Home className="w-4 h-4" />
            {isArabic ? 'الصفحة الرئيسية' : 'Go Home'}
          </button>
        </div>
      </div>
    );
  }

  // ── Main Page ────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-orange-50 to-yellow-50 py-12 px-4" dir={dir}>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/50 overflow-hidden">
          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-8 text-center">
            <AlertTriangle className="w-20 h-20 text-white mx-auto mb-4 drop-shadow" />
            <h1 className="text-3xl font-extrabold text-white mb-2">
              {t('simulation.caught.title')}
            </h1>
            <p className="text-white/90 text-lg">
              {t('simulation.caught.subtitle')}
            </p>

            {/* Difficulty + Attack Vector badges */}
            <div className="flex justify-center gap-3 mt-4 flex-wrap">
              {feedback.difficulty && (
                <span className={`px-3 py-1 rounded-full text-sm font-medium${DIFFICULTY_COLOR[feedback.difficulty] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'}`}>
                  {feedback.difficulty}
                </span>
              )}
              {feedback.attack_vector && (
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-white/20 text-white">
                  {feedback.attack_vector}
                </span>
              )}
            </div>
          </div>

          {/* ── Explanation ───────────────────────────────────────────────── */}
          <div className="p-8">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400 shrink-0" />
                {t('simulation.caught.whatHappened')}
              </h2>
              <p className="text-gray-700 dark:text-gray-200 leading-relaxed whitespace-pre-line">
                {feedback.explanation}
              </p>
            </div>

            {/* ── Red Flags ─────────────────────────────────────────────── */}
            {feedback.red_flags && feedback.red_flags.length > 0 && (
              <div className="mb-8">
                <h3 className="text-lg font-bold text-red-700 dark:text-red-400 mb-4 flex items-center gap-2">
                  🚩 {t('simulation.caught.redFlags')}
                </h3>
                <ul className="space-y-3">
                  {feedback.red_flags.map((flag, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-lg p-3"
                    >
                      <CheckCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0 mt-0.5" />
                      <span className="text-gray-800 dark:text-gray-100 text-sm">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* ── Tips ──────────────────────────────────────────────────── */}
            <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 rounded-r-xl p-6 mb-8" dir={isArabic ? 'rtl' : 'ltr'}>
              <h3 className="font-bold text-blue-900 dark:text-blue-300 mb-3">
                {t('simulation.caught.whatNext')}
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-300 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold shrink-0">✓</span>
                  {t('simulation.caught.tip1')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold shrink-0">✓</span>
                  {t('simulation.caught.tip2')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold shrink-0">✓</span>
                  {t('simulation.caught.tip3')}
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold shrink-0">✓</span>
                  {t('simulation.caught.tip4')}
                </li>
              </ul>
            </div>

            {/* ── Actions ───────────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/employee/training')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-semibold transition-colors"
              >
                <BookOpen className="w-5 h-5 shrink-0" />
                {t('simulation.caught.takeTraining')}
              </button>
              <button
                onClick={() => navigate('/employee/dashboard')}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 font-semibold transition-colors"
              >
                <ArrowRight className="w-5 h-5 shrink-0" />
                {t('simulation.caught.backToDashboard')}
              </button>
            </div>
          </div>
        </div>

        {/* ── Footer note ─────────────────────────────────────────────────── */}
        <p className="text-center text-gray-400 dark:text-gray-500 text-sm">
          {isArabic
            ? 'تم إجراء هذا الاختبار من قِبل فريق أمن المعلومات في شركتك بهدف تعزيز الوعي الأمني.'
            : 'This test was conducted by your organization\'s IT security team to improve security awareness.'}
        </p>
      </div>
    </div>
  );
}
