import { useTranslation } from 'react-i18next';
import { BookOpen, FileText, Lightbulb, ExternalLink } from 'lucide-react';

function CommunityPortal() {
  const { t } = useTranslation();

  // Placeholder data
  const articles = [
    {
      id: 1,
      title: 'How to Identify Phishing Emails',
      excerpt: 'Learn the key signs of phishing emails and how to protect yourself from cyber threats.',
      date: '2024-01-15',
      category: 'Security Tips',
    },
    {
      id: 2,
      title: 'Social Engineering: What You Need to Know',
      excerpt: 'Understanding social engineering attacks and how to defend against them.',
      date: '2024-01-10',
      category: 'Education',
    },
    {
      id: 3,
      title: 'Protecting Your Business from Cyber Threats',
      excerpt: 'Essential cybersecurity practices for businesses in the MENA region.',
      date: '2024-01-05',
      category: 'Business',
    },
  ];

  const tips = [
    'Always verify the sender\'s email address before clicking any links',
    'Look for spelling and grammar mistakes in suspicious emails',
    'Never share your password via email or phone',
    'Enable two-factor authentication on all accounts',
    'Report suspicious emails to your IT department immediately',
  ];

  const resources = [
    {
      title: 'Phishing Detection Guide',
      type: 'PDF',
      size: '2.3 MB',
    },
    {
      title: 'Security Best Practices',
      type: 'PDF',
      size: '1.8 MB',
    },
    {
      title: 'Email Security Checklist',
      type: 'PDF',
      size: '0.5 MB',
    },
  ];

  return (
    <div className="fade-in py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-4">
            {t('community.title')}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Free resources, articles, and tips to help you stay safe from phishing attacks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Articles Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-6">
              <BookOpen className="h-6 w-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">{t('community.articles')}</h2>
            </div>
            <div className="space-y-6">
              {articles.map((article) => (
                <article key={article.id} className="card-hover">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-1 rounded">
                        {article.category}
                      </span>
                      <h3 className="text-lg font-semibold text-gray-900 mt-2 mb-2">
                        {article.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-2">{article.excerpt}</p>
                      <span className="text-xs text-gray-400">{article.date}</span>
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
                <h3 className="text-lg font-semibold text-gray-900">{t('community.tips')}</h3>
              </div>
              <ul className="space-y-3">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
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
                <h3 className="text-lg font-semibold text-gray-900">{t('community.resources')}</h3>
              </div>
              <ul className="space-y-3">
                {resources.map((resource, index) => (
                  <li key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-700">{resource.title}</span>
                    <span className="text-gray-400">{resource.type} • {resource.size}</span>
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
