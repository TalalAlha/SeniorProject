/**
 * NotFoundPage — 404 error page.
 *
 * Shown when no route matches the current URL.  Provides role-aware "go home"
 * links so each user type is redirected to their correct dashboard.
 */
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileQuestion, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../contexts';

function NotFoundPage() {
  const { t } = useTranslation();
  const { isAuthenticated, getDashboardPath } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 mb-6">
          <FileQuestion className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-2">
          {t('errors.notFound')}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => window.history.back()}
            className="btn-secondary"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
          <Link
            to={isAuthenticated ? getDashboardPath() : '/'}
            className="btn-primary"
          >
            <Home className="h-5 w-5 mr-2" />
            {isAuthenticated ? t('nav.dashboard') : t('nav.home')}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFoundPage;
