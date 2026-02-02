import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Search, Target, Calendar, Users, MoreVertical } from 'lucide-react';
import clsx from 'clsx';

function CampaignList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setCampaigns([
          { id: 1, name: 'Q1 Security Awareness', description: 'Quarterly security training', startDate: '2024-01-01', endDate: '2024-03-31', status: 'active', employees: 156, progress: 65 },
          { id: 2, name: 'Phishing Simulation Test', description: 'Monthly phishing test', startDate: '2024-02-01', endDate: '2024-02-28', status: 'active', employees: 50, progress: 80 },
          { id: 3, name: 'New Employee Onboarding', description: 'Onboarding security training', startDate: '2024-01-15', endDate: '2024-12-31', status: 'active', employees: 12, progress: 30 },
          { id: 4, name: 'Password Security Campaign', description: 'Password best practices', startDate: '2023-10-01', endDate: '2023-12-31', status: 'completed', employees: 140, progress: 100 },
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaigns();
  }, []);

  const filteredCampaigns = campaigns.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status) => {
    const styles = {
      draft: 'bg-gray-100 text-gray-700',
      active: 'bg-success-50 text-success-700',
      paused: 'bg-warning-50 text-warning-700',
      completed: 'bg-primary-50 text-primary-700',
    };
    return (
      <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', styles[status])}>
        {t(`campaign.status.${status}`)}
      </span>
    );
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
          <h1 className="text-2xl font-bold text-gray-900">{t('campaign.title')}</h1>
          <p className="text-gray-600 mt-1">Manage your security awareness campaigns</p>
        </div>
        <Link to="/company/campaigns/create" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          {t('campaign.createCampaign')}
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder={`${t('common.search')} campaigns...`}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Campaign Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCampaigns.map((campaign) => (
          <Link key={campaign.id} to={`/company/campaigns/${campaign.id}`} className="card-hover group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary-100">
                <Target className="h-6 w-6 text-primary-600" />
              </div>
              {getStatusBadge(campaign.status)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
              {campaign.name}
            </h3>
            <p className="text-sm text-gray-500 mb-4">{campaign.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {campaign.employees}
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {campaign.startDate}
              </span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">{t('training.progress')}</span>
                <span className="font-medium">{campaign.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-primary-600 h-1.5 rounded-full" style={{ width: `${campaign.progress}%` }} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}

export default CampaignList;
