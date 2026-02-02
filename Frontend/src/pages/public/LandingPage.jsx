import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Shield, BookOpen, Mail, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';

function LandingPage() {
  const { t } = useTranslation();

  const features = [
    {
      icon: BookOpen,
      title: t('landing.features.training.title'),
      description: t('landing.features.training.description'),
    },
    {
      icon: Mail,
      title: t('landing.features.simulations.title'),
      description: t('landing.features.simulations.description'),
    },
    {
      icon: BarChart3,
      title: t('landing.features.analytics.title'),
      description: t('landing.features.analytics.description'),
    },
    {
      icon: CheckCircle,
      title: t('landing.features.compliance.title'),
      description: t('landing.features.compliance.description'),
    },
  ];

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 to-primary-800 text-white py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6 text-balance">
              {t('landing.hero.title')}
            </h1>
            <p className="text-lg lg:text-xl text-primary-100 mb-8">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/register"
                className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg"
              >
                {t('landing.hero.cta')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link
                to="/community"
                className="btn border-2 border-white text-white hover:bg-white hover:text-primary-700 px-8 py-3 text-lg"
              >
                {t('landing.hero.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            {t('landing.features.title')}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="text-center p-6 rounded-xl hover:shadow-lg transition-shadow duration-300"
                >
                  <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary-100 text-primary-600 mb-4">
                    <Icon className="h-7 w-7" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { value: '500+', label: 'Companies Protected' },
              { value: '50K+', label: 'Employees Trained' },
              { value: '95%', label: 'Threat Detection Rate' },
              { value: '60%', label: 'Risk Reduction' },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to secure your organization?
          </h2>
          <p className="text-primary-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of companies in the MENA region who trust PhishAware to protect their employees from phishing threats.
          </p>
          <Link
            to="/register"
            className="btn bg-white text-primary-700 hover:bg-gray-100 px-8 py-3 text-lg"
          >
            Get Started Today
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default LandingPage;
