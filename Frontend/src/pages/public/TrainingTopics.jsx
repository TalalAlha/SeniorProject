import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Mail,
  Smartphone,
  Phone,
  ChevronRight,
  Shield,
  ArrowRight,
} from 'lucide-react';

function TrainingTopics() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const topics = [
    {
      id: 'phishing',
      icon: Mail,
      title: t('public.topics.phishing.title'),
      description: t('public.topics.phishing.description'),
      examples: t('public.topics.phishing.examples'),
      link: '/training/phishing',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
      borderColor: 'border-blue-200',
    },
    {
      id: 'smishing',
      icon: Smartphone,
      title: t('public.topics.smishing.title'),
      description: t('public.topics.smishing.description'),
      examples: t('public.topics.smishing.examples'),
      link: '/training/smishing',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
      borderColor: 'border-emerald-200',
    },
    {
      id: 'vishing',
      icon: Phone,
      title: t('public.topics.vishing.title'),
      description: t('public.topics.vishing.description'),
      examples: t('public.topics.vishing.examples'),
      link: '/training/vishing',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 text-purple-600',
      borderColor: 'border-purple-200',
    },
  ];

  return (
    <div className="fade-in">
      {/* Header */}
      <section className="bg-gradient-to-br from-primary-700 to-primary-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-4">
            <Shield className="h-5 w-5 text-blue-300" />
            <span className="text-sm text-blue-100">{t('public.hero.badge')}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">
            {t('public.topics.title')}
          </h1>
          <p className="text-lg text-blue-100 max-w-2xl mx-auto">
            {t('public.topics.subtitle')}
          </p>
        </div>
      </section>

      {/* Topics Grid */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            {topics.map((topic) => {
              const Icon = topic.icon;
              return (
                <div
                  key={topic.id}
                  className={`bg-white rounded-2xl shadow-sm border ${topic.borderColor} overflow-hidden hover:shadow-lg transition-all duration-300`}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Left gradient bar */}
                    <div className={`bg-gradient-to-b ${topic.color} p-8 md:w-64 flex flex-col items-center justify-center text-white`}>
                      <div className="bg-white/20 backdrop-blur-sm w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
                        <Icon className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-bold text-center">{topic.title}</h3>
                    </div>

                    {/* Content */}
                    <div className="flex-1 p-8">
                      <p className="text-gray-600 text-lg mb-4">
                        {topic.description}
                      </p>

                      <div className="bg-gray-50 rounded-lg p-4 mb-6">
                        <p className="text-sm text-gray-500 font-medium mb-1">
                          {t('public.topics.examplesLabel')}
                        </p>
                        <p className="text-gray-700">{topic.examples}</p>
                      </div>

                      <Link
                        to={topic.link}
                        className="btn-primary inline-flex items-center"
                      >
                        {t('public.topics.learnMore')}
                        <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('public.quiz.title')}
          </h2>
          <p className="text-gray-600 mb-6">
            {t('public.quiz.subtitle')}
          </p>
          <Link
            to="/quiz"
            className="btn-primary inline-flex items-center text-lg px-8 py-3"
          >
            {t('public.hero.takeQuiz')}
            <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
          </Link>
        </div>
      </section>
    </div>
  );
}

export default TrainingTopics;
