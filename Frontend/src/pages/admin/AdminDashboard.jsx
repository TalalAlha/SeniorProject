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
  LOW: { label: 'Low Risk', color: 'bg-success-500', textColor: 'text-success-600', bgLight: 'bg-success-100' },
  MEDIUM: { label: 'Medium Risk', color: 'bg-warning-500', textColor: 'text-warning-600', bgLight: 'bg-warning-100' },
  HIGH: { label: 'High Risk', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-100' },
  CRITICAL: { label: 'Critical Risk', color: 'bg-danger-500', textColor: 'text-danger-600', bgLight: 'bg-danger-100' },
};

// --- Reusable Components ---

function StatCard({ title, value, icon: Icon, color = 'primary', subtitle, trend, trendValue }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
    if (s == null) return { label: 'N/A', bg: 'bg-gray-100', text: 'text-gray-500' };
    if (s <= 30) return { label: 'Low', bg: 'bg-success-100', text: 'text-success-700' };
    if (s <= 60) return { label: 'Medium', bg: 'bg-warning-100', text: 'text-warning-700' };
    if (s <= 80) return { label: 'High', bg: 'bg-orange-100', text: 'text-orange-700' };
    return { label: 'Critical', bg: 'bg-danger-100', text: 'text-danger-700' };
  };

  const config = getRiskConfig(score);

  return (
    <div className="flex items-center gap-2">
      <div className="w-full bg-gray-100 rounded-full h-2 flex-1 min-w-[60px]">
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
  return (
    <span
      className={clsx(
        'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
        isActive ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function ActivityItem({ activity }) {
  const iconMap = {
    CAMPAIGN: { icon: Target, bg: 'bg-primary-100', text: 'text-primary-600' },
    SIMULATION: { icon: Mail, bg: 'bg-warning-50', text: 'text-warning-600' },
    COMPANY: { icon: Building2, bg: 'bg-success-50', text: 'text-success-600' },
    USER: { icon: Users, bg: 'bg-purple-100', text: 'text-purple-600' },
  };

  const config = iconMap[activity.type] || iconMap.CAMPAIGN;
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      <div className={clsx('p-2 rounded-lg flex-shrink-0', config.bg)}>
        <Icon className={clsx('h-4 w-4', config.text)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900 font-medium truncate">{activity.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
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
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
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
          <h1 className="text-2xl font-bold text-gray-900">
            {t('dashboard.welcome')}, {user?.first_name || 'Admin'}!
          </h1>
          <p className="text-gray-600 mt-1">Platform overview and management</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Section 1: Platform Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Companies"
          value={totalCompanies}
          icon={Building2}
          color="primary"
          subtitle={`${totalUsers} total users across platform`}
        />
        <StatCard
          title="Total Users"
          value={totalUsers.toLocaleString()}
          icon={Users}
          color="success"
          subtitle={`${totalEmployees} employees, ${stats?.total_admins || 0} admins`}
        />
        <StatCard
          title="Active Campaigns"
          value={activeCampaigns}
          icon={Target}
          color="warning"
          subtitle={`${stats?.total_campaigns || 0} quiz + ${stats?.total_simulations || 0} simulation campaigns`}
        />
        <StatCard
          title="Platform Risk Score"
          value={avgRiskScore ? Math.round(avgRiskScore) : 'N/A'}
          icon={AlertTriangle}
          color={avgRiskScore > 60 ? 'danger' : avgRiskScore > 30 ? 'warning' : 'success'}
          subtitle={highRiskCount > 0 ? `${highRiskCount} high/critical risk employees` : 'No high risk employees'}
        />
      </div>

      {/* Section 2: Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/admin/companies/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <Plus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Create Company</p>
              <p className="text-sm text-gray-500">Onboard new organization</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/companies" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50">
              <Building2 className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">View Companies</p>
              <p className="text-sm text-gray-500">Manage all organizations</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/analytics" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-50">
              <BarChart3 className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Platform Analytics</p>
              <p className="text-sm text-gray-500">View detailed reports</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors rtl:rotate-180" />
        </Link>

        <Link to="/admin/users" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">User Management</p>
              <p className="text-sm text-gray-500">Manage users per company</p>
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
            <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
            <Link
              to="/admin/companies"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              View All
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </Link>
          </div>

          {companies.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-start py-3 px-2 text-gray-500 font-medium">Company</th>
                    <th className="text-start py-3 px-2 text-gray-500 font-medium">Users</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium hidden md:table-cell">Industry</th>
                    <th className="text-start py-3 px-2 text-gray-500 font-medium">Status</th>
                    <th className="text-left py-3 px-2 text-gray-500 font-medium hidden sm:table-cell">Created</th>
                    <th className="text-end py-3 px-2 text-gray-500 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((company) => (
                    <tr key={company.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="py-3 px-2">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <Building2 className="h-4 w-4 text-primary-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{company.name}</p>
                            {company.email && (
                              <p className="text-xs text-gray-400 truncate">{company.email}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-2">
                        <p className="text-gray-900 font-medium">{company.total_users || 0}</p>
                        <p className="text-xs text-gray-400">{company.total_employees || 0} emp</p>
                      </td>
                      <td className="py-3 px-2 hidden md:table-cell">
                        <span className="text-gray-600 text-xs">{company.industry || '-'}</span>
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
                          View
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
              <p className="text-gray-500">No companies yet</p>
              <Link
                to="/admin/companies/create"
                className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                Create your first company
                <ArrowRight className="h-4 w-4 ms-1 rtl:rotate-180" />
              </Link>
            </div>
          )}
        </div>

        {/* Platform Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Activity</h2>
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
              <p className="text-gray-500">No recent activity</p>
            </div>
          )}
        </div>
      </div>

      {/* Platform Overview Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card bg-gradient-to-br from-primary-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <CheckCircle className="h-5 w-5 text-primary-600" />
            <p className="text-sm font-medium text-gray-700">Quiz Campaigns</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats?.total_campaigns || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.completed_campaigns || 0} completed, {stats?.active_campaigns || 0} active
          </p>
          {stats?.average_quiz_score != null && (
            <p className="text-xs text-primary-600 mt-1">Avg score: {Math.round(stats.average_quiz_score)}%</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-warning-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <Mail className="h-5 w-5 text-warning-600" />
            <p className="text-sm font-medium text-gray-700">Simulations</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats?.total_simulations || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.completed_simulations || 0} completed, {stats?.active_simulations || 0} active
          </p>
          {stats?.overall_click_rate != null && (
            <p className="text-xs text-warning-600 mt-1">Click rate: {Math.round(stats.overall_click_rate)}%</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-success-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-5 w-5 text-success-600" />
            <p className="text-sm font-medium text-gray-700">Training</p>
          </div>
          <p className="text-xl font-bold text-gray-900">{stats?.total_trainings_assigned || 0}</p>
          <p className="text-xs text-gray-500 mt-1">
            {stats?.trainings_completed || 0} completed, {stats?.trainings_passed || 0} passed
          </p>
          {stats?.training_completion_rate != null && (
            <p className="text-xs text-success-600 mt-1">Completion: {Math.round(stats.training_completion_rate)}%</p>
          )}
        </div>

        <div className="card bg-gradient-to-br from-purple-50 to-white">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="h-5 w-5 text-purple-600" />
            <p className="text-sm font-medium text-gray-700">Risk Distribution</p>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs px-1.5 py-0.5 rounded bg-success-100 text-success-700">{stats?.low_risk_count || 0} Low</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-warning-100 text-warning-700">{stats?.medium_risk_count || 0} Med</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-orange-100 text-orange-700">{stats?.high_risk_count || 0} High</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-danger-100 text-danger-700">{stats?.critical_risk_count || 0} Crit</span>
          </div>
          {stats?.active_users_30_days != null && (
            <p className="text-xs text-gray-500 mt-2">{stats.active_users_30_days} active users (30 days)</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
