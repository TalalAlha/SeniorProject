import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart3, TrendingDown, TrendingUp, Users, Target, Calendar, Download } from 'lucide-react';
import clsx from 'clsx';

function CompanyAnalytics() {
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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.analytics')}</h1>
          <p className="text-gray-600 mt-1">Track your organization's security awareness progress</p>
        </div>
        <div className="flex gap-2">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="input w-auto"
          >
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
          { label: 'Average Risk Score', value: '42%', change: '-8%', trend: 'down', color: 'success' },
          { label: 'Quiz Completion', value: '78%', change: '+12%', trend: 'up', color: 'success' },
          { label: 'Training Completion', value: '65%', change: '+5%', trend: 'up', color: 'success' },
          { label: 'Phishing Click Rate', value: '15%', change: '-10%', trend: 'down', color: 'success' },
        ].map((stat, index) => (
          <div key={index} className="card">
            <p className="text-sm text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
            <div className={clsx('flex items-center mt-2 text-sm', stat.color === 'success' ? 'text-success-600' : 'text-danger-600')}>
              {stat.trend === 'up' ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
              {stat.change} from last period
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Risk Score Distribution */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Distribution</h2>
          <div className="space-y-4">
            {[
              { label: 'Low Risk (0-30%)', count: 89, percentage: 57, color: 'bg-success-500' },
              { label: 'Medium Risk (31-60%)', count: 45, percentage: 29, color: 'bg-warning-500' },
              { label: 'High Risk (61-100%)', count: 22, percentage: 14, color: 'bg-danger-500' },
            ].map((item, index) => (
              <div key={index}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.label}</span>
                  <span className="font-medium">{item.count} employees ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className={clsx('h-2 rounded-full', item.color)} style={{ width: `${item.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department Performance */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Department Performance</h2>
          <div className="space-y-3">
            {[
              { name: 'IT', score: 28, completion: 92 },
              { name: 'HR', score: 35, completion: 85 },
              { name: 'Marketing', score: 45, completion: 78 },
              { name: 'Sales', score: 52, completion: 70 },
              { name: 'Finance', score: 48, completion: 75 },
            ].map((dept, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-900">{dept.name}</span>
                <div className="flex items-center gap-4 text-sm">
                  <span className={clsx(
                    'px-2 py-1 rounded-full',
                    dept.score <= 30 ? 'bg-success-50 text-success-700' :
                    dept.score <= 60 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                  )}>
                    Risk: {dept.score}%
                  </span>
                  <span className="text-gray-500">Completion: {dept.completion}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Simulation Results */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Simulation Results</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Simulation</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Sent</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Clicked</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">Reported</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {[
                { name: 'Bank Alert Test', date: '2024-02-01', sent: 156, clicked: 23, reported: 89 },
                { name: 'CEO Fraud Test', date: '2024-01-15', sent: 156, clicked: 18, reported: 95 },
                { name: 'Package Delivery', date: '2024-01-01', sent: 156, clicked: 35, reported: 72 },
              ].map((sim, index) => (
                <tr key={index}>
                  <td className="px-4 py-3 font-medium text-gray-900">{sim.name}</td>
                  <td className="px-4 py-3 text-gray-600">{sim.date}</td>
                  <td className="px-4 py-3 text-gray-600">{sim.sent}</td>
                  <td className="px-4 py-3 text-danger-600">{sim.clicked} ({Math.round(sim.clicked/sim.sent*100)}%)</td>
                  <td className="px-4 py-3 text-success-600">{sim.reported} ({Math.round(sim.reported/sim.sent*100)}%)</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompanyAnalytics;
