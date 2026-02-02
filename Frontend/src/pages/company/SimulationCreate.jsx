import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Loader2, Mail } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const templates = [
  { id: 1, name: 'Bank Alert', description: 'Fake bank security alert', category: 'Financial' },
  { id: 2, name: 'Password Reset', description: 'IT password reset request', category: 'IT Support' },
  { id: 3, name: 'Executive Request', description: 'Urgent request from CEO', category: 'CEO Fraud' },
  { id: 4, name: 'Package Delivery', description: 'Failed delivery notification', category: 'Delivery' },
];

function SimulationCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [formData, setFormData] = useState({ name: '', scheduled_date: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) {
      toast.error('Please select a template');
      return;
    }
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Simulation created successfully');
      navigate('/company/simulations');
    } catch (error) {
      toast.error('Failed to create simulation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-in max-w-3xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.back')}
      </button>

      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">{t('simulation.createSimulation')}</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="label">Simulation Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              required
            />
          </div>

          <div>
            <label className="label">{t('simulation.selectTemplate')}</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  type="button"
                  onClick={() => setSelectedTemplate(template.id)}
                  className={clsx(
                    'p-4 rounded-lg border-2 text-left transition-colors',
                    selectedTemplate === template.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-warning-50">
                      <Mail className="h-5 w-5 text-warning-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500">{template.description}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Scheduled Date (Optional)</label>
            <input
              type="datetime-local"
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="input"
            />
          </div>

          <div className="flex gap-4">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : <Save className="h-5 w-5 mr-2" />}
              {t('common.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SimulationCreate;
