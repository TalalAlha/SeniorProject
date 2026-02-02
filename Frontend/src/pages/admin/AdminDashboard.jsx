import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Building2, Users, BarChart3, TrendingUp, TrendingDown, ArrowRight, Shield, Target } from 'lucide-react';
import { useAuth } from '../../contexts';
import clsx from 'clsx';

function AdminDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setStats({
          totalCompanies: 48,
          totalEmployees: 5420,
          activeCampaigns: 156,
          platformRiskScore: 38,
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
        <p className="text-gray-600 mt-1">Platform overview and management</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Companies</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalCompanies}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600">+5 this month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Employees</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.totalEmployees.toLocaleString()}</p>
              <div className="flex items-center mt-2">
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600">+320 this month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-success-50 text-success-600">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Campaigns</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.activeCampaigns}</p>
            </div>
            <div className="p-3 rounded-lg bg-warning-50 text-warning-600">
              <Target className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-gray-500">Platform Risk Score</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{stats?.platformRiskScore}%</p>
              <div className="flex items-center mt-2">
                <TrendingDown className="h-4 w-4 text-success-500 mr-1" />
                <span className="text-sm text-success-600">-5% from last month</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-secondary-100 text-secondary-600">
              <Shield className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Companies */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Companies</h2>
            <Link to="/admin/companies" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
              {t('common.view')} {t('common.all')}
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Tech Solutions LLC', employees: 156, joined: '2024-02-01', status: 'active' },
              { name: 'Global Finance Corp', employees: 320, joined: '2024-01-28', status: 'active' },
              { name: 'Healthcare Plus', employees: 89, joined: '2024-01-25', status: 'active' },
              { name: 'Marketing Masters', employees: 45, joined: '2024-01-20', status: 'pending' },
            ].map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{company.name}</p>
                    <p className="text-sm text-gray-500">{company.employees} employees</p>
                  </div>
                </div>
                <span className={clsx(
                  'text-xs font-medium px-2 py-1 rounded-full',
                  company.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                )}>
                  {company.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Platform Stats */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Platform Statistics</h2>
          <div className="space-y-4">
            {[
              { label: 'Quizzes Completed', value: '28,450', change: '+1,234 this week' },
              { label: 'Training Hours', value: '12,380', change: '+856 this week' },
              { label: 'Simulations Sent', value: '45,000', change: '+2,100 this month' },
              { label: 'Reports Generated', value: '1,250', change: '+85 this week' },
            ].map((stat, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                  <p className="text-lg font-semibold text-gray-900">{stat.value}</p>
                </div>
                <span className="text-xs text-success-600">{stat.change}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/admin/companies/create" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Add Company</p>
              <p className="text-sm text-gray-500">Onboard new organization</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
        </Link>
        <Link to="/admin/companies" className="card-hover flex items-center justify-between group">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50">
              <Users className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">Manage Companies</p>
              <p className="text-sm text-gray-500">View all organizations</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
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
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600" />
        </Link>
      </div>
    </div>
  );
}

export default AdminDashboard;
