import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Users,
  Target,
  Mail,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  UserPlus,
  Calendar,
  Clock,
  Play,
  Pause,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts';
import { companiesAPI, campaignsAPI, simulationsAPI, analyticsAPI } from '../../api';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';

// Risk level configuration
const RISK_CONFIG = {
  LOW: { labelKey: 'employee.riskLevels.low', color: 'bg-success-500', textColor: 'text-success-600 dark:text-success-400', bgLight: 'bg-success-100 dark:bg-success-900/30' },
  MEDIUM: { labelKey: 'employee.riskLevels.medium', color: 'bg-warning-500', textColor: 'text-warning-600 dark:text-warning-400', bgLight: 'bg-warning-100 dark:bg-warning-900/30' },
  HIGH: { labelKey: 'employee.riskLevels.high', color: 'bg-orange-500', textColor: 'text-orange-600 dark:text-orange-400', bgLight: 'bg-orange-100 dark:bg-orange-900/30' },
  CRITICAL: { labelKey: 'employee.riskLevels.critical', color: 'bg-danger-500', textColor: 'text-danger-600 dark:text-danger-400', bgLight: 'bg-danger-100 dark:bg-danger-900/30' },
};

// Stat Card Component
function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary', subtitle }) {
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
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500 mr-1" />
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

// Risk Score Gauge Component
function RiskScoreGauge({ score, size = 'large' }) {
  const getColor = () => {
    if (score <= 30) return { stroke: '#22c55e', bg: 'bg-success-100 dark:bg-success-900/30', text: 'text-success-600 dark:text-success-400', label: 'Low' };
    if (score <= 60) return { stroke: '#eab308', bg: 'bg-warning-100 dark:bg-warning-900/30', text: 'text-warning-600 dark:text-warning-400', label: 'Medium' };
    if (score <= 80) return { stroke: '#f97316', bg: 'bg-orange-100 dark:bg-orange-900/30', text: 'text-orange-600 dark:text-orange-400', label: 'High' };
    return { stroke: '#ef4444', bg: 'bg-danger-100 dark:bg-danger-900/30', text: 'text-danger-600 dark:text-danger-400', label: 'Critical' };
  };

  const config = getColor();
  const radius = size === 'large' ? 60 : 40;
  const strokeWidth = size === 'large' ? 10 : 6;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          <circle
            stroke="currentColor" className="text-gray-200 dark:text-gray-700"
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          <circle
            stroke={config.stroke}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('font-bold', config.text, size === 'large' ? 'text-2xl' : 'text-lg')}>
            {Math.round(score)}
          </span>
        </div>
      </div>
      <span className={clsx('mt-2 text-xs font-medium px-2 py-0.5 rounded-full', config.bg, config.text)}>
        {config.label}
      </span>
    </div>
  );
}

// Risk Distribution Bar Chart Component
function RiskDistributionChart({ data, t }) {
  const total = Object.values(data).reduce((sum, count) => sum + count, 0) || 1;
  const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

  return (
    <div className="space-y-4">
      {levels.map((level) => {
        const count = data[level] || 0;
        const percentage = (count / total) * 100;
        const config = RISK_CONFIG[level];

        return (
          <div key={level} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">{t(config.labelKey)}</span>
              <span className="font-medium text-gray-900 dark:text-white">{count} {t('dashboard.employees')}</span>
            </div>
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-3">
              <div
                className={clsx('h-3 rounded-full transition-all duration-500', config.color)}
                style={{ width: `${Math.max(percentage, count > 0 ? 2 : 0)}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500">{t('dashboard.percentOfEmployees', { percent: percentage.toFixed(1) })}</p>
          </div>
        );
      })}
    </div>
  );
}

// Campaign Status Badge
function CampaignStatusBadge({ status }) {
  const { t } = useTranslation();
  const statusConfig = {
    ACTIVE: { labelKey: 'campaign.status.active', color: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400', icon: Play },
    DRAFT: { labelKey: 'campaign.status.draft', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300', icon: Clock },
    PAUSED: { labelKey: 'campaign.status.paused', color: 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400', icon: Pause },
    COMPLETED: { labelKey: 'campaign.status.completed', color: 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400', icon: CheckCircle2 },
    SCHEDULED: { labelKey: 'simulation.statusScheduled', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Calendar },
  };

  const config = statusConfig[status] || statusConfig.DRAFT;
  const Icon = config.icon;

  return (
    <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', config.color)}>
      <Icon className="h-3 w-3" />
      {t(config.labelKey)}
    </span>
  );
}

// Campaign Card Component
function CampaignCard({ campaign }) {
  const { t } = useTranslation();
  const rawRate = campaign.completion_rate ?? campaign.progress ?? 0;
  const progress = rawRate <= 1 && rawRate > 0 ? rawRate * 100 : Number(rawRate);
  const employeeCount = campaign.total_participants ?? campaign.assigned_count ?? 0;

  return (
    <Link
      to={`/company/campaigns/${campaign.id}`}
      className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">{campaign.name}</h3>
        <CampaignStatusBadge status={campaign.status} />
      </div>
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-2">
        <span>{employeeCount} {t('dashboard.employees')}</span>
        <span>{Math.round(progress)}% {t('dashboard.complete')}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
        <div
          className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </Link>
  );
}

// Simulation Card Component
function SimulationCard({ simulation }) {
  const { t } = useTranslation();
  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-400';
      case 'COMPLETED': return 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400';
      case 'SCHEDULED': return 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400';
      case 'IN_PROGRESS': return 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-400';
      default: return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  };

  const getStatusLabel = (status) => {
    const map = {
      ACTIVE: t('campaign.status.active'),
      COMPLETED: t('campaign.status.completed'),
      SCHEDULED: t('simulation.statusScheduled'),
      IN_PROGRESS: t('simulation.statusInProgress'),
      DRAFT: t('campaign.status.draft'),
    };
    return map[status] || status;
  };

  return (
    <Link
      to="/company/simulations"
      className="block p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-medium text-gray-900 dark:text-white truncate flex-1 mr-2">{simulation.name}</h3>
        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', getStatusColor(simulation.status))}>
          {getStatusLabel(simulation.status)}
        </span>
      </div>
      {simulation.template_name && (
        <p className="text-sm text-gray-500 mb-2 truncate">
          {t('dashboard.templateLabel')}: {simulation.template_name}
        </p>
      )}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <span>{simulation.target_count || 0} {t('dashboard.targets')}</span>
        {simulation.click_rate !== undefined && (
          <span className={clsx(
            'font-medium',
            simulation.click_rate > 30 ? 'text-danger-600' : 'text-success-600'
          )}>
            {simulation.click_rate}% {t('dashboard.clickRate')}
          </span>
        )}
      </div>
      {simulation.created_at && (
        <p className="text-xs text-gray-400 mt-2">
          {formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
        </p>
      )}
    </Link>
  );
}

// Main Dashboard Component
function CompanyDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    stats: null,
    riskDistribution: null,
    recentCampaigns: [],
    recentSimulations: [],
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const companyId = user?.company_id || user?.company?.id || user?.company;

      // Fetch all data in parallel
      const [statsRes, riskDistRes, campaignsRes, simulationsRes] = await Promise.all([
        companyId
          ? companiesAPI.getStats(companyId).catch(() => ({ data: null }))
          : Promise.resolve({ data: null }),
        analyticsAPI.getRiskDistribution().catch(() => ({ data: null })),
        campaignsAPI.list({ limit: 5, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
        simulationsAPI.list({ limit: 5, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
      ]);

      // Transform risk distribution from API format to chart format
      const rawDist = riskDistRes.data;
      const riskDist = rawDist ? {
        LOW: rawDist.low_risk ?? rawDist.LOW ?? 0,
        MEDIUM: rawDist.medium_risk ?? rawDist.MEDIUM ?? 0,
        HIGH: rawDist.high_risk ?? rawDist.HIGH ?? 0,
        CRITICAL: rawDist.critical_risk ?? rawDist.CRITICAL ?? 0,
      } : { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };

      setDashboardData({
        stats: statsRes.data,
        riskDistribution: riskDist,
        recentCampaigns: campaignsRes.data?.results || campaignsRes.data || [],
        recentSimulations: simulationsRes.data?.results || simulationsRes.data || [],
      });
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

  const { stats, riskDistribution, recentCampaigns, recentSimulations } = dashboardData;

  // Calculate summary values
  const totalEmployees = stats?.total_employees || 0;
  const activeCampaigns = stats?.active_campaigns || 0;
  const avgRiskScore = stats?.average_risk_score || 0;
  const trainingCompletion = stats?.training_completion_rate
    ? Math.round(stats.training_completion_rate)
    : 0;
  const highRiskCount = stats?.employees_at_high_risk || 0;
  const activeSimulations = stats?.active_simulations || 0;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('dashboard.welcome')}, {user?.first_name || 'Admin'}!
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('dashboard.companyOverview')}</p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.refresh')}
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalEmployees')}
          value={totalEmployees}
          icon={Users}
          color="primary"
          subtitle={`${stats?.total_admins || 0} ${t('dashboard.admins')}`}
        />
        <StatCard
          title={t('dashboard.activeCampaigns')}
          value={activeCampaigns}
          icon={Target}
          color="success"
          subtitle={`${activeSimulations} ${t('dashboard.activeSimulationsLabel')}`}
        />
        <StatCard
          title={t('dashboard.averageRiskScore')}
          value={`${Math.round(avgRiskScore)}`}
          icon={AlertTriangle}
          color={avgRiskScore > 60 ? 'danger' : avgRiskScore > 30 ? 'warning' : 'success'}
          subtitle={highRiskCount > 0 ? `${highRiskCount} ${t('dashboard.highRiskEmployeesLabel')}` : t('admin.dashboard.noHighRisk')}
        />
        <StatCard
          title={t('dashboard.completionRate')}
          value={`${trainingCompletion}%`}
          icon={CheckCircle}
          color="success"
          subtitle={t('dashboard.trainingCompletion')}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="card">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.riskDistribution')}</h2>
            <RiskScoreGauge score={avgRiskScore} size="small" />
          </div>
          <RiskDistributionChart data={riskDistribution} t={t} />
        </div>

        {/* Recent Campaigns */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.activeCampaigns')}</h2>
            <Link
              to="/company/campaigns"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              {t('admin.common.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentCampaigns.length > 0 ? (
            <div className="space-y-3">
              {recentCampaigns.slice(0, 4).map((campaign) => (
                <CampaignCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Target className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('dashboard.noCampaignsYet')}</p>
              <Link
                to="/company/campaigns/create"
                className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                {t('dashboard.createFirstCampaign')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>

        {/* Recent Simulations */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentSimulations')}</h2>
            <Link
              to="/company/simulations"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              {t('admin.common.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          {recentSimulations.length > 0 ? (
            <div className="space-y-3">
              {recentSimulations.slice(0, 4).map((simulation) => (
                <SimulationCard key={simulation.id} simulation={simulation} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Mail className="h-10 w-10 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">{t('dashboard.noSimulationsYet')}</p>
              <Link
                to="/company/simulations/create"
                className="mt-3 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
              >
                {t('dashboard.createFirstSimulation')}
                <ArrowRight className="h-4 w-4 ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link to="/company/campaigns/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('campaign.createCampaign')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.launchAwarenessCampaign')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link to="/company/simulations/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-50 dark:bg-warning-900/20">
              <Mail className="h-6 w-6 text-warning-600 dark:text-warning-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('simulation.createSimulation')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.testEmployeeAwareness')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link to="/company/employees" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <UserPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('dashboard.manageEmployees')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.inviteAndManageTeam')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link to="/company/analytics" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
              <BarChart3 className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('nav.analytics')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('dashboard.viewDetailedReports')}</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

export default CompanyDashboard;
