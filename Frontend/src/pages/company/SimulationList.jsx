import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Plus, Mail, Search, Eye, Download, AlertTriangle, CheckCircle } from 'lucide-react';
import clsx from 'clsx';

function SimulationList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [simulations, setSimulations] = useState([]);

  useEffect(() => {
    const fetchSimulations = async () => {
      try {
        setSimulations([
          { id: 1, name: 'Q1 Phishing Test', template: 'Bank Alert', sentDate: '2024-01-15', status: 'completed', sent: 156, clicked: 23, reported: 89 },
          { id: 2, name: 'CEO Fraud Test', template: 'Executive Request', sentDate: '2024-02-01', status: 'active', sent: 50, clicked: 8, reported: 32 },
          { id: 3, name: 'IT Support Scam', template: 'Password Reset', sentDate: '2024-02-10', status: 'draft', sent: 0, clicked: 0, reported: 0 },
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSimulations();
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('simulation.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">Test employee awareness with phishing simulations</p>
        </div>
        <Link to="/company/simulations/create" className="btn-primary">
          <Plus className="h-5 w-5 mr-2" />
          {t('simulation.createSimulation')}
        </Link>
      </div>

      {/* Simulation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {simulations.map((sim) => (
          <div key={sim.id} className="card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-lg bg-warning-50">
                  <Mail className="h-6 w-6 text-warning-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{sim.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{sim.template}</p>
                </div>
              </div>
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                sim.status === 'completed' && 'bg-success-50 text-success-700',
                sim.status === 'active' && 'bg-primary-50 text-primary-700',
                sim.status === 'draft' && 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              )}>
                {sim.status}
              </span>
            </div>

            {sim.status !== 'draft' && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{sim.sent}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                </div>
                <div className="text-center p-3 bg-danger-50 rounded-lg">
                  <p className="text-2xl font-bold text-danger-600">{sim.clicked}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('simulation.clicked')}</p>
                </div>
                <div className="text-center p-3 bg-success-50 rounded-lg">
                  <p className="text-2xl font-bold text-success-600">{sim.reported}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{t('simulation.reported')}</p>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button className="btn-secondary flex-1">
                <Eye className="h-4 w-4 mr-2" />
                {t('common.view')}
              </button>
              {sim.status !== 'draft' && (
                <button className="btn-secondary">
                  <Download className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SimulationList;
