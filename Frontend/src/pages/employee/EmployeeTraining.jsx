import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Target, Clock, CheckCircle, Play, Lock } from 'lucide-react';
import clsx from 'clsx';

function EmployeeTraining() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setModules([
          { id: 1, name: 'Introduction to Phishing', duration: '15 min', progress: 100, status: 'completed' },
          { id: 2, name: 'Identifying Suspicious Emails', duration: '20 min', progress: 60, status: 'in_progress' },
          { id: 3, name: 'Safe Link Practices', duration: '12 min', progress: 0, status: 'locked' },
          { id: 4, name: 'Password Security', duration: '18 min', progress: 0, status: 'pending' },
          { id: 5, name: 'Reporting Incidents', duration: '10 min', progress: 0, status: 'locked' },
        ]);
      } catch (error) {
        console.error('Error fetching modules:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchModules();
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
        <h1 className="text-2xl font-bold text-gray-900">{t('training.title')}</h1>
        <p className="text-gray-600 mt-1">Complete training modules to improve your security awareness</p>
      </div>

      <div className="space-y-4">
        {modules.map((module, index) => (
          <div key={module.id} className="card-hover">
            <div className="flex items-center gap-4">
              <div className={clsx(
                'w-12 h-12 rounded-full flex items-center justify-center',
                module.status === 'completed' && 'bg-success-100',
                module.status === 'in_progress' && 'bg-primary-100',
                module.status === 'pending' && 'bg-gray-100',
                module.status === 'locked' && 'bg-gray-50'
              )}>
                {module.status === 'completed' ? (
                  <CheckCircle className="h-6 w-6 text-success-600" />
                ) : module.status === 'locked' ? (
                  <Lock className="h-6 w-6 text-gray-400" />
                ) : (
                  <span className="text-lg font-bold text-gray-600">{index + 1}</span>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{module.name}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                  <span><Clock className="h-4 w-4 inline mr-1" />{module.duration}</span>
                  {module.progress > 0 && module.progress < 100 && (
                    <span>{module.progress}% complete</span>
                  )}
                </div>
                {module.status === 'in_progress' && (
                  <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                    <div
                      className="bg-primary-600 h-1.5 rounded-full"
                      style={{ width: `${module.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <button
                disabled={module.status === 'locked'}
                className={clsx(
                  'btn',
                  module.status === 'completed' && 'btn-secondary',
                  module.status === 'in_progress' && 'btn-primary',
                  module.status === 'pending' && 'btn-primary',
                  module.status === 'locked' && 'bg-gray-100 text-gray-400 cursor-not-allowed'
                )}
              >
                {module.status === 'completed' ? 'Review' : module.status === 'in_progress' ? 'Continue' : module.status === 'locked' ? 'Locked' : 'Start'}
                {module.status !== 'completed' && module.status !== 'locked' && <Play className="h-4 w-4 ml-2" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default EmployeeTraining;
