/**
 * ServicesPage — Long-form sales page for company admins (/services).
 *
 * Linked from the "Learn More" CTA on the Companies card on the landing page.
 * Walks through the problem (phishing in MENA), why traditional training fails,
 * what PhishAware does differently, how setup works, and what metrics admins get.
 * Bilingual (EN + AR) with full dark-mode coverage.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import {
  Building2,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Mail,
  Phone,
  ShieldOff,
  X,
  Sparkles,
  Globe,
  BarChart3,
  Trophy,
  Activity,
  ClipboardList,
  UserPlus,
  Send,
  LineChart,
  CheckCircle2,
  Languages,
} from 'lucide-react';

function ServicesPage() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, getDashboardPath } = useAuth();
  const isRTL = i18n.language === 'ar';

  const stats = [
    { icon: AlertTriangle, value: t('public.services.stat1Value'), label: t('public.services.stat1Label'), color: 'text-warning-500', bg: 'bg-warning-50 dark:bg-warning-900/20' },
    { icon: TrendingUp,    value: t('public.services.stat2Value'), label: t('public.services.stat2Label'), color: 'text-danger-500',  bg: 'bg-danger-50 dark:bg-danger-900/20' },
    { icon: Mail,          value: t('public.services.stat3Value'), label: t('public.services.stat3Label'), color: 'text-primary-600 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
    { icon: Phone,         value: t('public.services.stat4Value'), label: t('public.services.stat4Label'), color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  ];

  const fails = [
    { icon: ClipboardList, title: t('public.services.fail1Title'), desc: t('public.services.fail1Desc') },
    { icon: ShieldOff,     title: t('public.services.fail2Title'), desc: t('public.services.fail2Desc') },
    { icon: X,             title: t('public.services.fail3Title'), desc: t('public.services.fail3Desc') },
  ];

  const diffs = [
    { icon: Send,       title: t('public.services.diff1Title'), desc: t('public.services.diff1Desc'), tint: 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400' },
    { icon: Globe,      title: t('public.services.diff2Title'), desc: t('public.services.diff2Desc'), tint: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400' },
    { icon: Sparkles,   title: t('public.services.diff3Title'), desc: t('public.services.diff3Desc'), tint: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' },
    { icon: Activity,   title: t('public.services.diff4Title'), desc: t('public.services.diff4Desc'), tint: 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400' },
    { icon: Languages,  title: t('public.services.diff5Title'), desc: t('public.services.diff5Desc'), tint: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' },
    { icon: Trophy,     title: t('public.services.diff6Title'), desc: t('public.services.diff6Desc'), tint: 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' },
  ];

  const steps = [
    { icon: Building2, title: t('public.services.how1Title'), desc: t('public.services.how1Desc') },
    { icon: UserPlus,  title: t('public.services.how2Title'), desc: t('public.services.how2Desc') },
    { icon: Send,      title: t('public.services.how3Title'), desc: t('public.services.how3Desc') },
    { icon: LineChart, title: t('public.services.how4Title'), desc: t('public.services.how4Desc') },
  ];

  const metrics = [
    t('public.services.metric1'),
    t('public.services.metric2'),
    t('public.services.metric3'),
    t('public.services.metric4'),
    t('public.services.metric5'),
    t('public.services.metric6'),
  ];

  return (
    <div className="fade-in transition-colors">
      {/* ── Hero ── */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 dark:from-primary-900 dark:via-primary-950 dark:to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-5 pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Building2 className="h-5 w-5 text-blue-300" />
              <span className="text-sm text-blue-100">{t('public.services.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-balance">
              {t('public.services.heroTitle')}
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              {t('public.services.heroSubtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {isAuthenticated ? (
                <Link
                  to={getDashboardPath()}
                  className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold shadow-lg shadow-primary-900/30"
                >
                  {t('public.services.ctaDashboard')}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
              ) : (
                <>
                  <Link
                    to="/register"
                    className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold shadow-lg shadow-primary-900/30"
                  >
                    {t('public.services.ctaPrimary')}
                    <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Link>
                  <Link
                    to="/login"
                    className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold"
                  >
                    {t('public.services.ctaSecondary')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── The Threat (stats) ── */}
      <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('public.services.threatTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('public.services.threatSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {stats.map((s, i) => {
              const Icon = s.icon;
              return (
                <div
                  key={i}
                  className="text-center p-6 rounded-2xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${s.bg} mb-4`}>
                    <Icon className={`h-6 w-6 ${s.color}`} />
                  </div>
                  <div className={`text-3xl sm:text-4xl font-bold ${s.color} mb-2`}>
                    {s.value}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">{s.label}</p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-8">
            {t('public.services.statsSource')}
          </p>
        </div>
      </section>

      {/* ── Why traditional approaches fail ── */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('public.services.failTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('public.services.failSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {fails.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-gray-900/50"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400 mb-4">
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {f.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── PhishAware difference ── */}
      <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('public.services.diffTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('public.services.diffSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {diffs.map((d, i) => {
              const Icon = d.icon;
              return (
                <div
                  key={i}
                  className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 hover:shadow-md dark:hover:shadow-gray-900/50 transition-shadow"
                >
                  <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${d.tint} mb-4`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {d.title}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                    {d.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works (timeline) ── */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('public.services.howTitle')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('public.services.howSubtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((s, i) => {
                const Icon = s.icon;
                return (
                  <div key={i} className="relative">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700 h-full">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary-600 dark:bg-primary-700 text-white flex items-center justify-center font-bold">
                          {i + 1}
                        </div>
                        <Icon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      </div>
                      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                        {s.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {s.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── Metrics ── */}
      <section className="py-16 lg:py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-3 py-1 rounded-full text-sm font-semibold mb-4">
                <BarChart3 className="h-4 w-4" />
                <span>Analytics</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
                {t('public.services.metricsTitle')}
              </h2>
              <p className="text-gray-600 dark:text-gray-300">
                {t('public.services.metricsSubtitle')}
              </p>
            </div>

            <ul className="space-y-3">
              {metrics.map((m, i) => (
                <li
                  key={i}
                  className="flex items-start gap-3 p-4 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                >
                  <CheckCircle2 className="h-5 w-5 text-success-600 dark:text-success-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700 dark:text-gray-200">{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-16 lg:py-20 bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">
            {t('public.services.finalTitle')}
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            {t('public.services.finalSubtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {isAuthenticated ? (
              <Link
                to={getDashboardPath()}
                className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
              >
                {t('public.services.ctaDashboard')}
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Link>
            ) : (
              <>
                <Link
                  to="/register"
                  className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
                >
                  {t('public.services.ctaPrimary')}
                  <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                </Link>
                <Link
                  to="/login"
                  className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3 text-lg font-semibold"
                >
                  {t('public.services.ctaSecondary')}
                </Link>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ServicesPage;
