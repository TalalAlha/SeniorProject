import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';
import { useAuth } from '../../contexts';

function UnauthorizedPage() {
  const { t } = useTranslation();
  const { isAuthenticated, getDashboardPath } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-danger-100 text-danger-600 mb-6">
          <ShieldX className="h-10 w-10" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-4">403</h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-2">
          {t('errors.unauthorized')}
        </h2>
        <p className="text-gray-600 mb-8 max-w-md">
          You don't have permission to access this page. Please contact your administrator if you believe this is a mistake.
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

export default UnauthorizedPage;
