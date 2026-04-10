import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, Users, Mail, AlertTriangle, UserPlus } from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

function EmployeeList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployees([
          { id: 1, name: 'Ahmed Mohamed', email: 'ahmed@company.com', department: 'IT', riskScore: 25, status: 'active' },
          { id: 2, name: 'Sara Ali', email: 'sara@company.com', department: 'Marketing', riskScore: 45, status: 'active' },
          { id: 3, name: 'Omar Hassan', email: 'omar@company.com', department: 'Sales', riskScore: 78, status: 'active' },
          { id: 4, name: 'Fatima Ibrahim', email: 'fatima@company.com', department: 'HR', riskScore: 32, status: 'active' },
          { id: 5, name: 'Youssef Ahmed', email: 'youssef@company.com', department: 'Finance', riskScore: 65, status: 'pending' },
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter(e =>
    e.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getRiskBadge = (score) => {
    if (score <= 30) return { label: t('employee.riskLevels.low'), color: 'bg-success-50 text-success-700' };
    if (score <= 60) return { label: t('employee.riskLevels.medium'), color: 'bg-warning-50 text-warning-700' };
    return { label: t('employee.riskLevels.high'), color: 'bg-danger-50 text-danger-700' };
  };

  const handleInvite = () => {
    toast.success('Invitation sent successfully');
    setShowInviteModal(false);
  };

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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employee.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Manage your organization's employees</p>
        </div>
        <button onClick={() => setShowInviteModal(true)} className="btn-primary">
          <UserPlus className="h-5 w-5 mr-2" />
          {t('employee.inviteEmployee')}
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
        <input
          type="text"
          placeholder={`${t('common.search')} employees...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Employee Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.name')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.email')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.department')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.riskLevel')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.status')}</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => {
                const risk = getRiskBadge(employee.riskScore);
                return (
                  <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                          {employee.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-white">{employee.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{employee.email}</td>
                    <td className="px-6 py-4 text-gray-600 dark:text-gray-300">{employee.department}</td>
                    <td className="px-6 py-4">
                      <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', risk.color)}>
                        {employee.riskScore}% - {risk.label}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        employee.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
                      )}>
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                        {t('common.view')}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('employee.inviteEmployee')}</h2>
            <div className="space-y-4">
              <div>
                <label className="label">{t('common.email')}</label>
                <input type="email" className="input" placeholder="employee@company.com" />
              </div>
              <div>
                <label className="label">{t('employee.department')}</label>
                <select className="input">
                  <option value="IT">{t('employee.deptIT')}</option>
                  <option value="Marketing">{t('employee.deptMarketing')}</option>
                  <option value="Sales">{t('employee.deptSales')}</option>
                  <option value="HR">{t('employee.deptHR')}</option>
                  <option value="Finance">{t('employee.deptFinance')}</option>
                </select>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button onClick={() => setShowInviteModal(false)} className="btn-secondary flex-1">{t('common.cancel')}</button>
              <button onClick={handleInvite} className="btn-primary flex-1">{t('common.submit')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeList;
