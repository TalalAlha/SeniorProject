/**
 * AdminDashboard — Platform-wide overview for super-admins (/admin/dashboard).
 *
 * Displays platform health metrics across all companies:
 *  - Total companies, users, campaigns, and simulations
 *  - Recent company registrations
 *  - Platform-wide risk score summary
 *  - Quick links to CompanyList and UserManagement
 *
 * Data source:
 *   GET /api/v1/analytics/dashboard/   → platform-level stats
 *
 * Requires SUPER_ADMIN role.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Building2,
  Users,
  Target,
  BarChart3,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Shield,
  Plus,
  Eye,
  Mail,
  CheckCircle,
  Clock,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts';
import { analyticsAPI, companiesAPI, campaignsAPI, simulationsAPI } from '../../api';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

// Risk level configuration (consistent with CompanyDashboard)
const RISK_CONFIG = {
  LOW: { label: 'Low Risk', color: 'bg-success-500', textColor: 'text-success-600 dark:text-success-400', bgLight: 'bg-success-100 dark:bg-success-900/30' },
  MEDIUM: { label: 'Medium Risk', color: 'bg-warning-500', textColor: 'text-warning-600 dark:text-warning-400', bgLight: 'bg-warning-100 dark:bg-warning-900/30' },
  HIGH: { label: 'High Risk', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', bgLight: 'bg-orange-100 dark:bg-orange-900/30' },
  CRITICAL: { label: 'Critical Risk', color: 'bg-danger-500', textColor: 'text-danger-600 dark:text-danger-400', bgLight: 'bg-danger-100 dark:bg-danger-900/30' },
};

// --- Reusable Components ---

function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, trend, trendValue }) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="card transition-colors">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success-500 me-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500 me-1" />
              )}
              <span className={clsx('text-sm', trend === 'up' ? 'text-success-600' : 'text-danger-600')}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function RiskScoreBadge({ score }) {
  const getRiskConfig = (s) => {
    if (s == null) return { label: 'N/A', bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-500 dark:text-gray-400' };
    if (s <= 30) return { label: 'Low', bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-700 dark:text-success-300' };
    if (s <= 60) return { label: 'Medium', bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-700 dark:text-warning-300' };
    if (s <= 80) return { label: 'High', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-300' };
    return { label: 'Critical', bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-700 dark:text-danger-300' };
  };

  const config = getRiskConfig(score);

  return (
    <div className="flex items-center gap-2">
      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 flex-1 min-w-[60px]">
        <div
          className={clsx(
            'h-2 rounded-full transition-all duration-500',
            score <= 30 ? 'bg-success-500' : score <= 60 ? 'bg-warning-500' : score <= 80 ? 'bg-orange-500' : 'bg-danger-500'
          )}
          style={{ width: `${Math.min(score || 0, 100)}%` }}
        />
      </div>
      <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full whitespace-nowrap', config.bg, config.text)}>
        {score != null ? Math.round(score) : 'N/A'}
      </span>
    </div>
  );
}

function StatusBadge({ isActive }) {
  const { t } = useTranslation();
  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
        isActive ? 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
      )}
    >
      {isActive ? t('admin.common.active') : t('admin.common.inactive')}
    </span>
  );
}

function ActivityItem({ activity }) {
  const iconMap = {
    CAMPAIGN: { icon: Target, bg: 'bg-primary-100 dark:bg-primary-900/30', text: 'text-primary-600 dark:text-primary-400' },
    SIMULATION: { icon: Mail, bg: 'bg-warning-50 dark:bg-warning-900/20', text: 'text-warning-600 dark:text-warning-400' },
    COMPANY: { icon: Building2, bg: 'bg-success-50 dark:bg-success-900/20', text: 'text-success-600 dark:text-success-400' },
    USER: { icon: Users, bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-600 dark:text-purple-400' },
  };

  const config = iconMap[activity.type] || iconMap.CAMPAIGN;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
      <div className={clsx('p-2 rounded-lg flex-shrink-0', config.bg)}>
        <Icon className={clsx('h-4 w-4', config.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 dark:text-white font-medium truncate">{activity.title}</p>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{activity.description}</p>
        {activity.timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </p>
        )}
      </div>
    </div>
  );
}

// --- Main Dashboard Component ---

function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [activity, setActivity] = useState([]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [overviewRes, companiesRes, campaignsRes, simulationsRes] = await Promise.all([
        analyticsAPI.getOverview().catch(() => ({ data: null })),
        companiesAPI.list({ limit: 10, ordering: '-created_at' }).catch(() => ({ data: { results: [], count: 0 } })),
        campaignsAPI.list({ limit: 5, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
        simulationsAPI.list({ limit: 5, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
      ]);

      // Set overview stats
      setStats(overviewRes.data);

      // Set companies
      const companiesList = companiesRes.data?.results || companiesRes.data || [];
      setCompanies(companiesList);
      setTotalCompanies(companiesRes.data?.count || companiesList.length);

      // Build activity feed from recent campaigns and simulations
      const activityItems = [];

      const recentCampaigns = campaignsRes.data?.results || campaignsRes.data || [];
      for (const campaign of recentCampaigns) {
        activityItems.push({
          type: 'CAMPAIGN',
          title: campaign.name,
          description: `Campaign ${campaign.status?.toLowerCase()} - ${campaign.assigned_count || 0} employees`,
          timestamp: campaign.created_at,
        });
      }

      const recentSimulations = simulationsRes.data?.results || simulationsRes.data || [];
      for (const sim of recentSimulations) {
        activityItems.push({
          type: 'SIMULATION',
          title: sim.name,
          description: `Simulation ${sim.status?.toLowerCase()} - ${sim.target_count || sim.total_sent || 0} targets`,
          timestamp: sim.created_at,
        });
      }

      // Add recent companies as activity
      for (const company of companiesList.slice(0, 3)) {
        activityItems.push({
          type: 'COMPANY',
          title: company.name,
          description: `Company registered - ${company.total_users || 0} users`,
          timestamp: company.created_at,
        });
      }

      // Sort by timestamp and limit
      activityItems.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setActivity(activityItems.slice(0, 10));
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load dashboard data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('admin.dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  // Calculate values from overview data
  const totalUsers = stats?.total_users || 0;
  const activeCampaigns = (stats?.active_campaigns || 0) + (stats?.active_simulations || 0);
  const avgRiskScore = stats?.average_risk_score || 0;
  const activeUsers = stats?.active_users_30_days || 0;
  const highRiskCount = (stats?.high_risk_count || 0) + (stats?.critical_risk_count || 0);
  const totalEmployees = stats?.total_employees || 0;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {user?.first_name || 'Admin'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('admin.dashboard.subtitle')}</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.refresh')}
        </button>
      </div>

      {/* Section 1: Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('admin.dashboard.totalCompanies')}
          value={totalCompanies}
          icon={Building2}
          color="primary"
          subtitle={t('admin.dashboard.totalUsersAcross', { count: totalUsers })}
        />
        <StatCard
          title={t('admin.dashboard.totalUsers')}
          value={totalUsers.toLocaleString()}
          icon={Users}
          color="success"
          subtitle={t('admin.dashboard.employeesAndAdmins', { employees: totalEmployees, admins: stats?.total_admins || 0 })}
        />
        <StatCard
          title={t('admin.dashboard.activeCampaigns')}
          value={activeCampaigns}
          icon={Target}
          color="warning"
          subtitle={t('admin.dashboard.campaignBreakdown', { quiz: stats?.total_campaigns || 0, simulation: stats?.total_simulations || 0 })}
        />
        <StatCard
          title={t('admin.dashboard.platformRiskScore')}
          value={avgRiskScore ? Math.round(avgRiskScore) : 'N/A'}
          icon={AlertTriangle}
          color={avgRiskScore > 60 ? 'danger' : avgRiskScore > 30 ? 'warning' : 'success'}
          subtitle={highRiskCount > 0 ? t('admin.dashboard.highRiskEmployees', { count: highRiskCount }) : t('admin.dashboard.noHighRisk')}
        />
      </div>

      {/* Section 2: Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/companies/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Plus className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('admin.dashboard.createCompany')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.onboardNewOrg')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/companies" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
              <Building2 className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('admin.dashboard.viewCompanies')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.manageAllOrgs')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/analytics" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
              <BarChart3 className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('admin.dashboard.platformAnalytics')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.viewDetailedReports')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/users" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('admin.dashboard.userManagement')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.dashboard.manageUsersPerCompany')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>
      </div>

      {/* Section 3 & 4: Recent Companies Table + Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Companies Table */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.recentCompanies')}</h2>
            <Link
              to="/admin/companies"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              {t('admin.common.viewAll')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-start py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">{t('admin.common.company')}</th>
                    <th className="text-start py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">{t('admin.common.users')}</th>
                    <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium hidden md:table-cell">{t('admin.common.industry')}</th>
                    <th className="text-start py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">{t('admin.common.status')}</th>
                    <th className="text-left py-3 px-2 text-gray-500 dark:text-gray-400 font-medium hidden sm:table-cell">{t('admin.common.created')}</th>
                    <th className="text-end py-3 px-2 text-gray-500 dark:text-gray-400 font-medium">{t('admin.common.actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{company.name}</p>
                            {company.email && (
                              <p className="text-xs text-gray-400 truncate">{company.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-gray-900 dark:text-white font-medium">{company.total_users || 0}</p>
                        <p className="text-xs text-gray-400">{company.total_employees || 0} {t('admin.dashboard.emp')}</p>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <span className="text-gray-600 dark:text-gray-300 text-xs">{company.industry || '-'}</span>
                      </td>
                      <td className="py-3 px-2">
                        <StatusBadge isActive={company.is_active} />
                      </td>
                      <td className="py-3 px-2 hidden sm:table-cell">
                        <span className="text-gray-500 text-xs">
                          {company.created_at ? format(new Date(company.created_at), 'MMM d, yyyy') : '-'}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-end">
                        <Link
                          to={`/admin/companies`}
                          className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          {t('admin.common.view')}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('admin.dashboard.noCompaniesYet')}</p>
              <Link
                to="/admin/companies/create"
                className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                {t('admin.dashboard.createFirstCompany')}
                <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              </Link>
            </div>
          )}
        </div>

        {/* Platform Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('admin.dashboard.recentActivity')}</h2>
            <Activity className="h-5 w-5 text-gray-400" />
          </div>

          {activity.length > 0 ? (
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {activity.map((item, index) => (
                <ActivityItem key={index} activity={item} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('admin.dashboard.noRecentActivity')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Overview Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-white dark:from-primary-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.dashboard.quizCampaigns')}</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_campaigns || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('admin.dashboard.completedActive', { completed: stats?.completed_campaigns || 0, active: stats?.active_campaigns || 0 })}
          </p>
          {stats?.average_quiz_score != null && (
            <p className="text-xs text-primary-600 dark:text-primary-400 mt-1">{t('admin.dashboard.avgScore', { score: Math.round(stats.average_quiz_score) })}</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-warning-50 to-white dark:from-warning-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-warning-600 dark:text-warning-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.dashboard.simulations')}</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_simulations || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {t('admin.dashboard.completedActive', { completed: stats?.completed_simulations || 0, active: stats?.active_simulations || 0 })}
          </p>
          {stats?.overall_click_rate != null && (
            <p className="text-xs text-warning-600 dark:text-warning-400 mt-1">{t('admin.dashboard.clickRate', { rate: Math.round(stats.overall_click_rate) })}</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-success-50 to-white dark:from-success-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-success-600 dark:text-success-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.dashboard.training')}</p>
          </div>
          <p className="text-xl font-bold text-gray-900 dark:text-white">{stats?.total_trainings_assigned || 0}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {t('admin.dashboard.completedPassed', { completed: stats?.trainings_completed || 0, passed: stats?.trainings_passed || 0 })}
          </p>
          {stats?.training_completion_rate != null && (
            <p className="text-xs text-success-600 dark:text-success-400 mt-1">{t('admin.dashboard.completion', { rate: Math.round(stats.training_completion_rate) })}</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('admin.dashboard.riskDistribution')}</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-400">{stats?.low_risk_count || 0} {t('admin.dashboard.low')}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-400">{stats?.medium_risk_count || 0} {t('admin.dashboard.med')}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">{stats?.high_risk_count || 0} {t('admin.dashboard.high')}</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-400">{stats?.critical_risk_count || 0} {t('admin.dashboard.crit')}</span>
          </div>
          {stats?.active_users_30_days != null && (
            <p className="text-xs text-gray-500 mt-2">{t('admin.dashboard.activeUsers30Days', { count: stats.active_users_30_days })}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
