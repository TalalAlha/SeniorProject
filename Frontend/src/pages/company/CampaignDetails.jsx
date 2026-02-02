import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Users, Calendar, Target, BarChart3, Play, Pause, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

function CampaignDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState(null);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        setCampaign({
          id,
          name: 'Q1 Security Awareness',
          description: 'Comprehensive security awareness training for all employees',
          startDate: '2024-01-01',
          endDate: '2024-03-31',
          status: 'active',
          employees: 156,
          progress: 65,
          quizzes: [
            { name: 'Phishing Basics', completed: 120, total: 156 },
            { name: 'Password Security', completed: 95, total: 156 },
          ],
          training: [
            { name: 'Email Security Module', completed: 100, total: 156 },
          ],
        });
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [id]);

  if (loading || !campaign) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.back')}
      </button>

      {/* Header */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
            <p className="text-gray-600 mt-2">{campaign.description}</p>
          </div>
          <span className="text-xs font-medium px-3 py-1 rounded-full bg-success-50 text-success-700">
            {t(`campaign.status.${campaign.status}`)}
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">{t('campaign.targetEmployees')}</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <Users className="h-5 w-5 text-primary-600" />
              {campaign.employees}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('campaign.startDate')}</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <Calendar className="h-5 w-5 text-primary-600" />
              {campaign.startDate}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('campaign.endDate')}</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <Calendar className="h-5 w-5 text-primary-600" />
              {campaign.endDate}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('training.progress')}</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <BarChart3 className="h-5 w-5 text-primary-600" />
              {campaign.progress}%
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quizzes */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('campaign.assignedQuizzes')}</h2>
          <div className="space-y-4">
            {campaign.quizzes.map((quiz, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{quiz.name}</span>
                  <span className="text-sm text-gray-500">{quiz.completed}/{quiz.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-primary-600 h-2 rounded-full" style={{ width: `${(quiz.completed/quiz.total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Training */}
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('campaign.assignedTraining')}</h2>
          <div className="space-y-4">
            {campaign.training.map((module, index) => (
              <div key={index} className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{module.name}</span>
                  <span className="text-sm text-gray-500">{module.completed}/{module.total}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-success-500 h-2 rounded-full" style={{ width: `${(module.completed/module.total)*100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default CampaignDetails;
