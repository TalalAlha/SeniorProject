import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Shield,
  Mail,
  Smartphone,
  Phone,
  ArrowRight,
  AlertTriangle,
  TrendingUp,
  Users,
  Clock,
  BookOpen,
  CheckCircle,
  ChevronRight,
} from 'lucide-react';

function PublicHome() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const stats = [
    {
      icon: AlertTriangle,
      value: '70%',
      label: t('public.stats.phishingAttempts'),
      color: 'text-warning-500',
      bgColor: 'bg-warning-50',
    },
    {
      icon: TrendingUp,
      value: '150%',
      label: t('public.stats.smsIncrease'),
      color: 'text-danger-500',
      bgColor: 'bg-danger-50',
    },
    {
      icon: Users,
      value: '1/3',
      label: t('public.stats.voiceScams'),
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
  ];

  const topics = [
    {
      icon: Mail,
      title: t('public.topics.phishing.title'),
      description: t('public.topics.phishing.description'),
      examples: t('public.topics.phishing.examples'),
      link: '/training/phishing',
      color: 'from-blue-500 to-blue-600',
      iconBg: 'bg-blue-100 text-blue-600',
    },
    {
      icon: Smartphone,
      title: t('public.topics.smishing.title'),
      description: t('public.topics.smishing.description'),
      examples: t('public.topics.smishing.examples'),
      link: '/training/smishing',
      color: 'from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-100 text-emerald-600',
    },
    {
      icon: Phone,
      title: t('public.topics.vishing.title'),
      description: t('public.topics.vishing.description'),
      examples: t('public.topics.vishing.examples'),
      link: '/training/vishing',
      color: 'from-purple-500 to-purple-600',
      iconBg: 'bg-purple-100 text-purple-600',
    },
  ];

  const quizzes = [
    {
      icon: Mail,
      topic: 'phishing',
      title: t('public.quiz.phishingQuiz'),
      questions: 10,
      time: '10',
      difficulty: t('public.quiz.beginner'),
      color: 'border-blue-200 hover:border-blue-400',
      iconColor: 'text-blue-600 bg-blue-50',
    },
    {
      icon: Smartphone,
      topic: 'smishing',
      title: t('public.quiz.smishingQuiz'),
      questions: 10,
      time: '10',
      difficulty: t('public.quiz.beginner'),
      color: 'border-emerald-200 hover:border-emerald-400',
      iconColor: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Phone,
      topic: 'vishing',
      title: t('public.quiz.vishingQuiz'),
      questions: 10,
      time: '10',
      difficulty: t('public.quiz.beginner'),
      color: 'border-purple-200 hover:border-purple-400',
      iconColor: 'text-purple-600 bg-purple-50',
    },
  ];

  return (
    <div className="fade-in">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-800 to-primary-900 text-white overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6">
              <Shield className="h-5 w-5 text-blue-300" />
              <span className="text-sm text-blue-100">{t('public.hero.badge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-6 leading-tight text-balance">
              {t('public.hero.title')}
            </h1>
            <p className="text-lg sm:text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
              {t('public.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/training"
                className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3.5 text-lg font-semibold shadow-lg shadow-primary-900/30"
              >
                {t('public.hero.startLearning')}
                <ArrowRight className={`h-5 w-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
              </Link>
              <Link
                to="/quiz"
                className="btn border-2 border-white/30 text-white hover:bg-white/10 px-8 py-3.5 text-lg font-semibold"
              >
                {t('public.hero.takeQuiz')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('public.stats.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('public.stats.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="card-hover text-center p-8"
                >
                  <div className={`inline-flex items-center justify-center w-14 h-14 rounded-full ${stat.bgColor} mb-4`}>
                    <Icon className={`h-7 w-7 ${stat.color}`} />
                  </div>
                  <div className={`text-4xl font-bold ${stat.color} mb-2`}>
                    {stat.value}
                  </div>
                  <p className="text-gray-600">{stat.label}</p>
                </div>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-400 mt-6">
            {t('public.stats.source')}
          </p>
        </div>
      </section>

      {/* Training Topics Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('public.topics.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('public.topics.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {topics.map((topic, index) => {
              const Icon = topic.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  {/* Card header with gradient */}
                  <div className={`bg-gradient-to-r ${topic.color} p-6 text-white`}>
                    <div className="bg-white/20 backdrop-blur-sm w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-bold">{topic.title}</h3>
                  </div>

                  {/* Card body */}
                  <div className="p-6">
                    <p className="text-gray-600 mb-4">
                      {topic.description}
                    </p>

                    <div className="bg-gray-50 rounded-lg p-3 mb-6">
                      <p className="text-sm text-gray-500 font-medium mb-1">
                        {t('public.topics.examplesLabel')}
                      </p>
                      <p className="text-sm text-gray-700">{topic.examples}</p>
                    </div>

                    <Link
                      to={topic.link}
                      className="inline-flex items-center text-primary-600 font-semibold hover:text-primary-700 transition-colors group-hover:gap-3 gap-2"
                    >
                      {t('public.topics.learnMore')}
                      <ChevronRight className={`h-4 w-4 transition-transform group-hover:translate-x-1 ${isRTL ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Quiz Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('public.quiz.title')}
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              {t('public.quiz.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {quizzes.map((quiz, index) => {
              const Icon = quiz.icon;
              return (
                <div
                  key={index}
                  className={`card border-2 ${quiz.color} transition-all duration-200`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${quiz.iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900 mb-1">
                        {quiz.title}
                      </h3>
                      <span className="inline-block text-xs font-medium bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                        {quiz.difficulty}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      {quiz.questions} {t('public.quiz.questions')}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {quiz.time} {t('public.quiz.minutes')}
                    </span>
                  </div>

                  <Link
                    to={`/quiz?topic=${quiz.topic}`}
                    className="btn-primary w-full mt-5 justify-center"
                  >
                    {t('public.quiz.startQuiz')}
                    <ArrowRight className={`h-4 w-4 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Safety Tips Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3">
              {t('public.tips.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <div key={num} className="flex items-start gap-3 bg-white rounded-xl p-4 border border-gray-100">
                <div className="w-8 h-8 rounded-full bg-success-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <CheckCircle className="h-5 w-5 text-success-600" />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed">
                  {t(`public.tips.tip${num}`)}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-4">
            {t('public.cta.title')}
          </h2>
          <p className="text-blue-100 mb-8 max-w-2xl mx-auto text-lg">
            {t('public.cta.subtitle')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/training"
              className="btn bg-white text-primary-700 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
            >
              {t('public.cta.explore')}
            </Link>
            <Link
              to="/register"
              className="btn border-2 border-white text-white hover:bg-white hover:text-primary-700 px-8 py-3 text-lg font-semibold"
            >
              {t('public.cta.register')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

export default PublicHome;
