import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import {
  Menu,
  X,
  Home,
  Users,
  Target,
  Mail,
  BookOpen,
  BarChart3,
  Award,
  Trophy,
  Settings,
  LogOut,
  Building2,
  Globe,
  ChevronDown,
  Shield,
  User,
} from 'lucide-react';
import NotificationDropdown from '../components/NotificationDropdown';
import { useAuth, USER_ROLES } from '../contexts';
import { changeLanguage } from '../i18n';
import clsx from 'clsx';

// Navigation items by role
const getNavItems = (role, t) => {
  const items = {
    [USER_ROLES.EMPLOYEE]: [
      { name: t('nav.dashboard'), path: '/employee/dashboard', icon: Home },
      { name: t('nav.quizzes'), path: '/employee/quizzes', icon: BookOpen },
      { name: t('nav.training'), path: '/employee/training', icon: Target },
      { name: t('nav.badges'), path: '/employee/badges', icon: Award },
      { name: t('nav.leaderboard'), path: '/employee/leaderboard', icon: Trophy },
      { name: t('nav.profile'), path: '/employee/profile', icon: Settings },
    ],
    [USER_ROLES.COMPANY_ADMIN]: [
      { name: t('nav.dashboard'), path: '/company/dashboard', icon: Home },
      { name: t('nav.campaigns'), path: '/company/campaigns', icon: Target },
      { name: t('nav.simulations'), path: '/company/simulations', icon: Mail },
      { name: t('nav.employees'), path: '/company/employees', icon: Users },
      { name: t('nav.training'), path: '/company/training', icon: BookOpen },
      { name: t('nav.analytics'), path: '/company/analytics', icon: BarChart3 },
      { name: t('nav.profile'), path: '/company/profile', icon: Settings },
    ],
    [USER_ROLES.SUPER_ADMIN]: [
      { name: t('nav.dashboard'), path: '/admin/dashboard', icon: Home },
      { name: t('nav.companies'), path: '/admin/companies', icon: Building2 },
      { name: t('nav.analytics'), path: '/admin/analytics', icon: BarChart3 },
      { name: t('nav.users'), path: '/admin/users', icon: Users },
      { name: t('nav.profile'), path: '/admin/profile', icon: Settings },
    ],
  };

  return items[role] || [];
};

function DashboardLayout() {
  const { t, i18n } = useTranslation();
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const navItems = getNavItems(user?.role, t);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActiveLink = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex overflow-x-hidden">
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:fixed lg:inset-y-0 lg:start-0 bg-white border-e border-gray-200">
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-gray-200">
          <Link to="/" className="flex items-center gap-2">
            <Shield className="h-8 w-8 text-primary-600" />
            <span className="text-xl font-bold text-gray-900">
              {t('common.appName')}
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isActiveLink(item.path);

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-primary-50 text-primary-700 font-medium'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <Icon className="h-5 w-5 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="p-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            <span>{t('auth.logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
            <div className="absolute top-0 end-0 -me-12 pt-2">
              <button
                className="ms-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                onClick={() => setSidebarOpen(false)}
              >
                <X className="h-6 w-6 text-white" />
              </button>
            </div>

            {/* Logo */}
            <div className="h-16 flex items-center px-6 border-b border-gray-200">
              <Link to="/" className="flex items-center gap-2">
                <Shield className="h-8 w-8 text-primary-600" />
                <span className="text-xl font-bold text-gray-900">
                  {t('common.appName')}
                </span>
              </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-6 overflow-y-auto">
              <ul className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isActiveLink(item.path);

                  return (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        onClick={() => setSidebarOpen(false)}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                          isActive
                            ? 'bg-primary-50 text-primary-700 font-medium'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                        )}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        <span>{item.name}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* User section */}
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 w-full text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-lg transition-colors"
              >
                <LogOut className="h-5 w-5" />
                <span>{t('auth.logout')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="lg:ps-64 flex flex-col flex-1 min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-8 sticky top-0 z-40">
          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Page title - can be dynamic */}
          <h1 className="text-lg font-semibold text-gray-900 hidden lg:block">
            {t('dashboard.welcome')}, {user?.first_name || user?.email}
          </h1>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 text-gray-600 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
            >
              <Globe className="h-5 w-5" />
              <span className="hidden sm:inline">
                {i18n.language === 'en' ? 'AR' : 'EN'}
              </span>
            </button>

            {/* Notifications */}
            <NotificationDropdown />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100"
              >
                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <ChevronDown className="h-4 w-4 text-gray-600 hidden sm:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setUserMenuOpen(false)}
                  />
                  <div className="absolute end-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                    </div>
                    <Link
                      to={`/${user?.role === USER_ROLES.SUPER_ADMIN ? 'admin' : user?.role === USER_ROLES.COMPANY_ADMIN ? 'company' : 'employee'}/profile`}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      {t('nav.profile')}
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 w-full"
                    >
                      <LogOut className="h-4 w-4" />
                      {t('auth.logout')}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default DashboardLayout;
