import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Users, Target, Mail, BarChart3, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts';
import clsx from 'clsx';

function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
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

function CompanyDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStats({
          totalEmployees: 156,
          activeCampaigns: 3,
          averageRiskScore: 42,
          completionRate: 78,
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('dashboard.welcome')}, {user?.first_name}!</h1>
        <p className="text-gray-600 mt-1">Company overview and security metrics</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('dashboard.totalEmployees')} value={stats?.totalEmployees} icon={Users} color="primary" trend="up" trendValue="+12 this month" />
        <StatCard title={t('dashboard.activeCampaigns')} value={stats?.activeCampaigns} icon={Target} color="success" />
        <StatCard title={t('dashboard.averageRiskScore')} value={`${stats?.averageRiskScore}%`} icon={AlertTriangle} color="warning" trend="down" trendValue="-5% from last month" />
        <StatCard title={t('dashboard.completionRate')} value={`${stats?.completionRate}%`} icon={CheckCircle} color="success" trend="up" trendValue="+8% this week" />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Campaigns */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboard.activeCampaigns')}</h2>
            <Link to="/company/campaigns" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              {t('common.view')} {t('common.all')}
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Q1 Security Awareness', employees: 156, progress: 65, status: 'active' },
              { name: 'Phishing Simulation Test', employees: 50, progress: 80, status: 'active' },
              { name: 'New Employee Onboarding', employees: 12, progress: 30, status: 'active' },
            ].map((campaign, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{campaign.name}</h3>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-success-50 text-success-700">
                    {campaign.status}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
                  <span>{campaign.employees} employees</span>
                  <span>{campaign.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${campaign.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* High Risk Employees */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">High Risk Employees</h2>
            <Link to="/company/employees" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              {t('common.view')} {t('common.all')}
            </Link>
          </div>
          <div className="space-y-3">
            {[
              { name: 'John Doe', department: 'Sales', riskScore: 85 },
              { name: 'Jane Smith', department: 'Marketing', riskScore: 78 },
              { name: 'Bob Johnson', department: 'Finance', riskScore: 72 },
              { name: 'Alice Brown', department: 'HR', riskScore: 68 },
            ].map((employee, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {employee.name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{employee.name}</p>
                    <p className="text-sm text-gray-500">{employee.department}</p>
                  </div>
                </div>
                <span className={clsx(
                  'text-sm font-medium px-2 py-1 rounded-full',
                  employee.riskScore >= 70 ? 'bg-danger-50 text-danger-700' : 'bg-warning-50 text-warning-700'
                )}>
                  {employee.riskScore}%
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/company/campaigns/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <Target className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('campaign.createCampaign')}</p>
              <p className="text-sm text-gray-500">Launch new awareness campaign</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
        </Link>
        <Link to="/company/simulations/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-50">
              <Mail className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('simulation.createSimulation')}</p>
              <p className="text-sm text-gray-500">Test employee awareness</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
        </Link>
        <Link to="/company/analytics" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50">
              <BarChart3 className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('nav.analytics')}</p>
              <p className="text-sm text-gray-500">View detailed reports</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
        </Link>
      </div>
    </div>
  );
}

export default CompanyDashboard;
