import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, Building2, Users, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

function CompanyList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        setCompanies([
          { id: 1, name: 'Tech Solutions LLC', email: 'admin@techsolutions.com', employees: 156, riskScore: 35, status: 'active', joinDate: '2024-01-15' },
          { id: 2, name: 'Global Finance Corp', email: 'admin@globalfinance.com', employees: 320, riskScore: 42, status: 'active', joinDate: '2024-01-10' },
          { id: 3, name: 'Healthcare Plus', email: 'admin@healthcareplus.com', employees: 89, riskScore: 28, status: 'active', joinDate: '2024-01-05' },
          { id: 4, name: 'Marketing Masters', email: 'admin@marketingmasters.com', employees: 45, riskScore: 55, status: 'pending', joinDate: '2024-02-01' },
          { id: 5, name: 'Construction Pro', email: 'admin@constructionpro.com', employees: 78, riskScore: 62, status: 'active', joinDate: '2023-12-20' },
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.companies')}</h1>
          <p className="text-gray-600 mt-1">Manage all registered companies on the platform</p>
        </div>
        <Link to="/admin/companies/create" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Add Company
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`${t('common.search')} companies...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Companies Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employees</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Risk Score</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                      <span className="font-medium text-gray-900">{company.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{company.email}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-gray-600">
                      <Users className="h-4 w-4" />
                      {company.employees}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      company.riskScore <= 30 ? 'bg-success-50 text-success-700' :
                      company.riskScore <= 60 ? 'bg-warning-50 text-warning-700' : 'bg-danger-50 text-danger-700'
                    )}>
                      {company.riskScore}%
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={clsx(
                      'text-xs font-medium px-2 py-1 rounded-full',
                      company.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-warning-50 text-warning-700'
                    )}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{company.joinDate}</td>
                  <td className="px-6 py-4">
                    <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                      {t('common.view')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default CompanyList;
