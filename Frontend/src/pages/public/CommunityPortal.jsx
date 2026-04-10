import { useTranslation } from 'react-i18next';
import { BookOpen, FileText, Lightbulb, ExternalLink } from 'lucide-react';

function CommunityPortal() {
  const { t } = useTranslation();

  // Placeholder data
  const articles = [
    {
      id: 1,
      title: t('community.article1Title'),
      excerpt: t('community.article1Excerpt'),
      date: '2024-01-15',
      category: t('community.article1Category'),
    },
    {
      id: 2,
      title: t('community.article2Title'),
      excerpt: t('community.article2Excerpt'),
      date: '2024-01-10',
      category: t('community.article2Category'),
    },
    {
      id: 3,
      title: t('community.article3Title'),
      excerpt: t('community.article3Excerpt'),
      date: '2024-01-05',
      category: t('community.article3Category'),
    },
  ];

  const tips = [
    t('community.tip1'),
    t('community.tip2'),
    t('community.tip3'),
    t('community.tip4'),
    t('community.tip5'),
  ];

  const resources = [
    {
      title: t('community.resource1'),
      type: 'PDF',
      size: '2.3 MB',
    },
    {
      title: t('community.resource2'),
      type: 'PDF',
      size: '1.8 MB',
    },
    {
      title: t('community.resource3'),
      type: 'PDF',
      size: '0.5 MB',
    },
  ];

  return (
    <div className="fade-in py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {t('community.title')}
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t('community.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('community.articles')}</h2>
            </div>
            <div className="space-y-6">
              {articles.map((article) => (
                <article key={article.id} className="card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mt-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">{article.excerpt}</p>
                      <span className="text-xs text-gray-400 dark:text-gray-500">{article.date}</span>
                    </div>
                    <button className="text-primary-600 hover:text-primary-700">
                      <ExternalLink className="h-5 w-5" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Tips Section */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-warning-500" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('community.tips')}</h3>
              </div>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <span className="text-primary-600 font-bold">{index + 1}.</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            {/* Resources Section */}
            <div className="card">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary-600" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t('community.resources')}</h3>
              </div>
              <ul className="space-y-3">
                {resources.map((resource, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-200">{resource.title}</span>
                    <span className="text-gray-400 dark:text-gray-500">{resource.type} • {resource.size}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CommunityPortal;
