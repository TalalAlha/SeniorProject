import { Outlet, Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Menu, X, Globe, Shield, Mail, ExternalLink } from 'lucide-react';
import { useState } from 'react';
import { changeLanguage } from '../i18n';
import { useAuth } from '../contexts';

function PublicLayout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, getDashboardPath } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const navLinks = [
    { name: t('nav.home'), path: '/' },
    { name: t('nav.training'), path: '/training' },
    { name: t('nav.quizzes'), path: '/quiz' },
    { name: t('nav.community'), path: '/community' },
  ];

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">
                {t('common.appName')}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`transition-colors font-medium ${
                    isActive(link.path)
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-primary-600'
                  }`}
                >
                  {link.name}
                </Link>
              ))}

              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors"
              >
                <Globe className="h-5 w-5" />
                <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
              </button>

              {/* Auth Buttons */}
              {isAuthenticated ? (
                <Link to={getDashboardPath()} className="btn-primary">
                  {t('nav.dashboard')}
                </Link>
              ) : (
                <div className="flex items-center gap-3">
                  <Link
                    to="/login"
                    className="text-gray-600 hover:text-primary-600 transition-colors"
                  >
                    {t('auth.login')}
                  </Link>
                  <Link to="/register" className="btn-primary">
                    {t('auth.register')}
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6 text-gray-600" />
              ) : (
                <Menu className="h-6 w-6 text-gray-600" />
              )}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-100">
              <div className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.path}
                    to={link.path}
                    className={`transition-colors ${
                      isActive(link.path)
                        ? 'text-primary-600 font-medium'
                        : 'text-gray-600 hover:text-primary-600'
                    }`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.name}
                  </Link>
                ))}

                <button
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors"
                >
                  <Globe className="h-5 w-5" />
                  <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
                </button>

                <hr className="border-gray-100" />

                {isAuthenticated ? (
                  <Link
                    to={getDashboardPath()}
                    className="btn-primary text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {t('nav.dashboard')}
                  </Link>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="text-gray-600 hover:text-primary-600 transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth.login')}
                    </Link>
                    <Link
                      to="/register"
                      className="btn-primary text-center"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {t('auth.register')}
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </nav>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="h-8 w-8 text-primary-400" />
                <span className="text-xl font-bold">{t('common.appName')}</span>
              </div>
              <p className="text-gray-400 text-sm">
                {t('public.footer.about')}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h4 className="font-semibold mb-4">{t('public.footer.quickLinks')}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t('nav.home')}
                  </Link>
                </li>
                <li>
                  <Link to="/training" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t('nav.training')}
                  </Link>
                </li>
                <li>
                  <Link to="/quiz" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t('nav.quizzes')}
                  </Link>
                </li>
                <li>
                  <Link to="/community" className="text-gray-400 hover:text-white transition-colors text-sm">
                    {t('nav.community')}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Saudi Resources */}
            <div>
              <h4 className="font-semibold mb-4">{t('public.footer.resources')}</h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://www.nca.gov.sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {t('public.footer.nca')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.sama.gov.sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {t('public.footer.sama')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://www.cert.gov.sa"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-white transition-colors text-sm inline-flex items-center gap-1"
                  >
                    {t('public.footer.cert')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact & Language */}
            <div>
              <h4 className="font-semibold mb-4">{t('public.footer.contact')}</h4>
              <ul className="space-y-2">
                <li className="text-gray-400 text-sm flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  phishaware.team@gmail.com
                </li>
              </ul>
              <div className="mt-4">
                <button
                  onClick={toggleLanguage}
                  className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
                >
                  <Globe className="h-4 w-4" />
                  {i18n.language === 'en' ? 'العربية' : 'English'}
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; {new Date().getFullYear()} {t('common.appName')}. {t('public.footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default PublicLayout;
