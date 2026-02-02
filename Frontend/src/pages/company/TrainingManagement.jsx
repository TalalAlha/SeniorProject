import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Search, BookOpen, Users, Clock, CheckCircle, Play } from 'lucide-react';
import clsx from 'clsx';

function TrainingManagement() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [modules, setModules] = useState([]);

  useEffect(() => {
    const fetchModules = async () => {
      try {
        setModules([
          { id: 1, name: 'Introduction to Phishing', description: 'Learn the basics of phishing attacks', duration: '15 min', assigned: 156, completed: 120, status: 'active' },
          { id: 2, name: 'Email Security Best Practices', description: 'Secure email handling procedures', duration: '20 min', assigned: 156, completed: 95, status: 'active' },
          { id: 3, name: 'Password Security', description: 'Creating and managing strong passwords', duration: '12 min', assigned: 156, completed: 140, status: 'active' },
          { id: 4, name: 'Social Engineering Awareness', description: 'Recognizing manipulation tactics', duration: '25 min', assigned: 50, completed: 30, status: 'draft' },
        ]);
      } catch (error) {
        console.error('Error:', error);
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('training.title')} Management</h1>
          <p className="text-gray-600 mt-1">Create and manage training modules for your employees</p>
        </div>
        <button className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          Create Module
        </button>
      </div>

      {/* Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {modules.map((module) => (
          <div key={module.id} className="card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-success-50">
                <BookOpen className="h-6 w-6 text-success-600" />
              </div>
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                module.status === 'active' ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-700'
              )}>
                {module.status}
              </span>
            </div>

            <h3 className="text-lg font-semibold text-gray-900 mb-2">{module.name}</h3>
            <p className="text-sm text-gray-500 mb-4">{module.description}</p>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {module.duration}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {module.assigned} assigned
              </span>
            </div>

            <div className="space-y-1 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Completion</span>
                <span className="font-medium">{Math.round(module.completed/module.assigned*100)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-1.5">
                <div className="bg-success-500 h-1.5 rounded-full" style={{ width: `${(module.completed/module.assigned)*100}%` }} />
              </div>
            </div>

            <div className="flex gap-2">
              <button className="btn-secondary flex-1">
                {t('common.edit')}
              </button>
              <button className="btn-primary flex-1">
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TrainingManagement;
