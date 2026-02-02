import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingUp, TrendingDown, Building2, Users, Download, Calendar } from 'lucide-react';
import clsx from 'clsx';

function PlatformAnalytics() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    setLoading(false);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Platform-wide security awareness metrics</p>
        </div>
        <div className="flex gap-2">
          <select value={dateRange} onChange={(e) => setDateRange(e.target.value)} className="input w-auto">
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button className="btn-secondary">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Companies', value: '48', change: '+5', trend: 'up', icon: Building2 },
          { label: 'Total Employees', value: '5,420', change: '+320', trend: 'up', icon: Users },
          { label: 'Platform Risk Score', value: '38%', change: '-5%', trend: 'down', icon: BarChart3 },
          { label: 'Average Completion', value: '76%', change: '+8%', trend: 'up', icon: TrendingUp },
        ].map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-gray-500">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                <div className={clsx('flex items-center mt-2 text-sm', stat.trend === 'up' && stat.label !== 'Platform Risk Score' ? 'text-success-600' : stat.trend === 'down' && stat.label === 'Platform Risk Score' ? 'text-success-600' : 'text-danger-600')}>
                  {stat.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  {stat.change} this month
                </div>
              </div>
              <div className="p-3 rounded-lg bg-primary-100 text-primary-600">
                <stat.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performing Companies */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Companies</h2>
          <div className="space-y-3">
            {[
              { name: 'Tech Solutions LLC', score: 22, completion: 95 },
              { name: 'Healthcare Plus', score: 28, completion: 92 },
              { name: 'Finance Corp', score: 32, completion: 88 },
              { name: 'Education First', score: 35, completion: 85 },
              { name: 'Retail Solutions', score: 38, completion: 82 },
            ].map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center text-xs font-bold text-primary-600">
                    {index + 1}
                  </span>
                  <span className="font-medium text-gray-900">{company.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-success-50 text-success-700 px-2 py-1 rounded-full">
                    Risk: {company.score}%
                  </span>
                  <span className="text-gray-500">{company.completion}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Companies Needing Attention */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Companies Needing Attention</h2>
          <div className="space-y-3">
            {[
              { name: 'Construction Pro', score: 68, completion: 45 },
              { name: 'Marketing Masters', score: 62, completion: 52 },
              { name: 'Logistics Co', score: 58, completion: 58 },
              { name: 'Manufacturing Inc', score: 55, completion: 62 },
              { name: 'Services Group', score: 52, completion: 65 },
            ].map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-danger-50 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-danger-600" />
                  </div>
                  <span className="font-medium text-gray-900">{company.name}</span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="bg-danger-50 text-danger-700 px-2 py-1 rounded-full">
                    Risk: {company.score}%
                  </span>
                  <span className="text-gray-500">{company.completion}% complete</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Industry Breakdown */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Industry Breakdown</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Industry</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Companies</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Avg Risk Score</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Completion Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { industry: 'Technology', companies: 12, employees: 1450, riskScore: 32, completion: 85 },
                { industry: 'Finance', companies: 8, employees: 980, riskScore: 38, completion: 82 },
                { industry: 'Healthcare', companies: 10, employees: 1200, riskScore: 35, completion: 80 },
                { industry: 'Education', companies: 6, employees: 720, riskScore: 42, completion: 75 },
                { industry: 'Retail', companies: 7, employees: 650, riskScore: 48, completion: 70 },
                { industry: 'Manufacturing', companies: 5, employees: 420, riskScore: 55, completion: 65 },
              ].map((row, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 font-medium text-gray-900">{row.industry}</td>
                  <td className="px-4 py-3 text-gray-600">{row.companies}</td>
                  <td className="px-4 py-3 text-gray-600">{row.employees.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      row.riskScore <= 35 ? 'bg-success-50 text-success-700' :
                      row.riskScore <= 50 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                    )}>
                      {row.riskScore}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{row.completion}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PlatformAnalytics;
