/**
 * PublicHome — Landing page at `/`.
 *
 * Two-audience explainer for unauthenticated visitors. Hero one-liner explains
 * what PhishAware is, then a side-by-side "For Companies" / "For the Community"
 * section lets each audience self-select and see what's offered before deciding.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts';
import {
  Shield,
  Building2,
  Users,
  ArrowRight,
  Mail,
  Sparkles,
  ClipboardCheck,
  BarChart3,
  Trophy,
  Calendar,
  Globe,
  Search,
  GraduationCap,
  Heart,
  Newspaper,
  CheckCircle2,
  BookOpen,
} from 'lucide-react';

function PublicHome() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, getDashboardPath } = useAuth();
  const isRTL = i18n.language === 'ar';

  const companyFeatures = [
    {
      icon: Mail,
      title: t('public.landing.company.feature1Title'),
      description: t('public.landing.company.feature1Desc'),
    },
    {
      icon: Sparkles,
      title: t('public.landing.company.feature2Title'),
      description: t('public.landing.company.feature2Desc'),
    },
    {
      icon: ClipboardCheck,
      title: t('public.landing.company.feature3Title'),
      description: t('public.landing.company.feature3Desc'),
    },
    {
      icon: BarChart3,
      title: t('public.landing.company.feature4Title'),
      description: t('public.landing.company.feature4Desc'),
    },
    {
      icon: Trophy,
      title: t('public.landing.company.feature5Title'),
      description: t('public.landing.company.feature5Desc'),
    },
  ];

  const communityFeatures = [
    {
      icon: Calendar,
      title: t('public.landing.community.feature1Title'),
      description: t('public.landing.community.feature1Desc'),
    },
    {
      icon: GraduationCap,
      title: t('public.landing.community.feature2Title'),
      description: t('public.landing.community.feature2Desc'),
    },
    {
      icon: Search,
      title: t('public.landing.community.feature3Title'),
      description: t('public.landing.community.feature3Desc'),
    },
    {
      icon: BookOpen,
      title: t('public.landing.community.feature4Title'),
      description: t('public.landing.community.feature4Desc'),
    },
    {
      icon: Newspaper,
      title: t('public.landing.community.feature5Title'),
      description: t('public.landing.community.feature5Desc'),
    },
  ];

  const trustItems = [
    {
      icon: GraduationCap,
      title: t('public.landing.trust.studentsTitle'),
      description: t('public.landing.trust.studentsDesc'),
    },
    {
      icon: Globe,
      title: t('public.landing.trust.bilingualTitle'),
      description: t('public.landing.trust.bilingualDesc'),
    },
    {
      icon: Heart,
      title: t('public.landing.trust.freeTitle'),
      description: t('public.landing.trust.freeDesc'),
    },
  ];

  return (
    <div className="fade-in transition-colors">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 dark:from-primary-900 dark:via-primary-950 dark:to-gray-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10 dark:opacity-5">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-24">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-sm text-blue-100">{t('public.landing.badge')}</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight text-balance">
              {t('public.landing.heroTitle')}
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl mx-auto">
              {t('public.landing.heroSubtitle')}
            </p>
          </div>
        </div>
      </section>

      {/* Choose-your-path section */}
      <section className="py-16 lg:py-20 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3">
              {t('public.landing.chooseYourPath')}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              {t('public.landing.chooseYourPathSubtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* For Companies */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-primary-600 to-primary-800 dark:from-primary-800 dark:to-primary-950 p-8 text-white">
                <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Building2 className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t('public.landing.company.label')}
                </h3>
                <div className="inline-flex items-center gap-1.5 bg-white text-primary-700 dark:bg-primary-100 dark:text-primary-900 px-3 py-1 rounded-full text-sm font-semibold shadow-sm mb-3">
                  <Globe className="h-4 w-4" />
                  <span>{t('public.landing.company.badge')}</span>
                </div>
                <p className="text-primary-100">
                  {t('public.landing.company.tagline')}
                </p>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-5 mb-8 flex-1">
                  {companyFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {feature.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  {isAuthenticated ? (
                    <Link
                      to={getDashboardPath()}
                      className="btn-primary flex-1 justify-center"
                    >
                      {t('public.landing.company.dashboardCta')}
                      <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </Link>
                  ) : (
                    <>
                      <Link
                        to="/register"
                        className="btn-primary flex-1 justify-center"
                      >
                        {t('public.landing.company.primaryCta')}
                        <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                      </Link>
                      <Link
                        to="/login"
                        className="btn-outline flex-1 justify-center"
                      >
                        {t('public.landing.company.secondaryCta')}
                      </Link>
                    </>
                  )}
                </div>

                <Link
                  to="/services"
                  className="mt-4 inline-flex items-center justify-center gap-1 text-sm text-primary-600 dark:text-primary-300 hover:text-primary-700 dark:hover:text-primary-200 font-medium transition-colors"
                >
                  {t('public.landing.company.learnMore')}
                  <ArrowRight className={`h-4 w-4 ${isRTL ? 'rotate-180' : ''}`} />
                </Link>
              </div>
            </div>

            {/* For Community */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm dark:shadow-gray-900/50 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
              <div className="bg-gradient-to-r from-emerald-600 to-emerald-800 dark:from-emerald-800 dark:to-emerald-950 p-8 text-white">
                <div className="bg-white/20 backdrop-blur-sm w-14 h-14 rounded-xl flex items-center justify-center mb-4">
                  <Users className="h-7 w-7" />
                </div>
                <h3 className="text-2xl font-bold mb-3">
                  {t('public.landing.community.label')}
                </h3>
                <div className="inline-flex items-center gap-1.5 bg-white text-emerald-700 dark:bg-emerald-100 dark:text-emerald-900 px-3 py-1 rounded-full text-sm font-semibold shadow-sm mb-3">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>{t('public.landing.community.badge')}</span>
                </div>
                <p className="text-emerald-100">
                  {t('public.landing.community.tagline')}
                </p>
              </div>

              <div className="p-8 flex-1 flex flex-col">
                <ul className="space-y-5 mb-8 flex-1">
                  {communityFeatures.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <li key={index} className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mt-0.5">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-0.5">
                            {feature.title}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-300">
                            {feature.description}
                          </p>
                        </div>
                      </li>
                    );
                  })}
                </ul>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    to="/community"
                    className="btn flex-1 justify-center bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-700 dark:hover:bg-emerald-600 text-white"
                  >
                    {t('public.landing.community.primaryCta')}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Link>
                  <Link
                    to="/training"
                    className="btn flex-1 justify-center border-2 border-emerald-600 dark:border-emerald-300 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-emerald-900/30"
                  >
                    {t('public.landing.community.secondaryCta')}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('public.landing.trust.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {trustItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="flex items-start gap-4 p-5 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 flex items-center justify-center">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-1">
                      {item.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {item.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicHome;
