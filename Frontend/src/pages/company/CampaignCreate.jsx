/**
 * CampaignCreate — New quiz campaign creation form (/company/campaigns/create).
 *
 * Collects campaign configuration:
 *  - Name (English + Arabic), description
 *  - Number of emails to generate (5–50)
 *  - Phishing ratio (0.2–0.8) — visualised as a split bar chart
 *  - English/Arabic language ratio for email templates
 *  - Optional start and end dates
 *
 * Created campaigns default to DRAFT status; admins activate them separately
 * from CampaignList after assigning employees.
 *
 * On submit, calls POST /api/v1/campaigns/ and redirects to CampaignList on success.
 *
 * Requires COMPANY_ADMIN role.
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Loader2, Mail, Target, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { campaignsAPI } from '../../api';

function CampaignCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    num_emails: 10,
    phishing_ratio: 0.5,
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) {
      newErrors.name = 'Campaign name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Campaign name must be at least 3 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await campaignsAPI.create(formData);
      toast.success('Campaign created successfully');
      navigate(`/company/campaigns/${response.data.id}`);
    } catch (error) {
      const message = error.response?.data?.detail
        || error.response?.data?.name?.[0]
        || 'Failed to create campaign';
      toast.error(message);

      // Set field-specific errors if available
      if (error.response?.data) {
        const fieldErrors = {};
        Object.keys(error.response.data).forEach(key => {
          if (Array.isArray(error.response.data[key])) {
            fieldErrors[key] = error.response.data[key][0];
          }
        });
        if (Object.keys(fieldErrors).length > 0) {
          setErrors(fieldErrors);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const phishingCount = Math.round(formData.num_emails * formData.phishing_ratio);
  const legitimateCount = formData.num_emails - phishingCount;

  return (
    <div className="fade-in max-w-2xl mx-auto">
      {/* Back Button */}
      <button
        onClick={() => navigate('/company/campaigns')}
        className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.back')} to Campaigns
      </button>

      <div className="card">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
            <Target className="h-6 w-6 text-primary-600 dark:text-primary-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('campaign.createCampaign')}</h1>
            <p className="text-gray-500 dark:text-gray-400">Create a new email awareness campaign</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Campaign Name */}
          <div>
            <label className="label">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => {
                setFormData({ ...formData, name: e.target.value });
                if (errors.name) setErrors({ ...errors, name: null });
              }}
              className={clsx('input', errors.name && 'border-danger-500 focus:ring-danger-500')}
              placeholder="e.g., Q1 Security Awareness Campaign"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-danger-600">{errors.name}</p>
            )}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Give your campaign a descriptive name to identify it later
            </p>
          </div>

          {/* Number of Emails */}
          <div>
            <label className="label">Number of Emails per Employee</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="5"
                max="20"
                value={formData.num_emails}
                onChange={(e) => setFormData({ ...formData, num_emails: parseInt(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <div className="w-16 text-center">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{formData.num_emails}</span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Total number of test emails each employee will receive (5-20)
            </p>
          </div>

          {/* Phishing Ratio */}
          <div>
            <label className="label">Phishing Email Ratio</label>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12">30%</span>
              <input
                type="range"
                min="0.3"
                max="0.7"
                step="0.1"
                value={formData.phishing_ratio}
                onChange={(e) => setFormData({ ...formData, phishing_ratio: parseFloat(e.target.value) })}
                className="flex-1 h-2 bg-gray-200 dark:bg-gray-600 rounded-lg appearance-none cursor-pointer accent-primary-600"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400 w-12">70%</span>
              <div className="w-16 text-center">
                <span className="text-2xl font-bold text-primary-600">
                  {Math.round(formData.phishing_ratio * 100)}%
                </span>
              </div>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Percentage of emails that will be phishing attempts vs legitimate
            </p>
          </div>

          {/* Preview Card */}
          <div className="p-5 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Info className="h-4 w-4" />
              Campaign Preview
            </h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-danger-100 dark:bg-danger-900/20 rounded-lg">
                  <Mail className="h-6 w-6 text-danger-600 dark:text-danger-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Phishing Emails</p>
                  <p className="text-2xl font-bold text-danger-600">{phishingCount}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">per employee</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="p-3 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <Mail className="h-6 w-6 text-success-600 dark:text-success-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Legitimate Emails</p>
                  <p className="text-2xl font-bold text-success-600">{legitimateCount}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">per employee</p>
                </div>
              </div>
            </div>

            {/* Visual Bar */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-2">
                <span>{t('campaign.emailDistribution')}</span>
              </div>
              <div className="flex h-4 rounded-full overflow-hidden">
                <div
                  className="bg-danger-500 transition-all duration-300"
                  style={{ width: `${formData.phishing_ratio * 100}%` }}
                />
                <div
                  className="bg-success-500 transition-all duration-300"
                  style={{ width: `${(1 - formData.phishing_ratio) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-1">
                <span>{t('campaign.phishing')} ({Math.round(formData.phishing_ratio * 100)}%)</span>
                <span>{t('campaign.legitimate')} ({Math.round((1 - formData.phishing_ratio) * 100)}%)</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="p-4 bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg">
            <h4 className="text-sm font-medium text-primary-800 dark:text-primary-300 mb-2">{t('campaign.whatHappensNext')}</h4>
            <ul className="text-sm text-primary-700 dark:text-primary-400 space-y-1">
              <li>• {t('campaign.draftNote1')}</li>
              <li>• {t('campaign.draftNote2')}</li>
              <li>• {t('campaign.draftNote3')}</li>
              <li>• {t('campaign.draftNote4')}</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t dark:border-gray-700">
            <button
              type="button"
              onClick={() => navigate('/company/campaigns')}
              className="btn-secondary flex-1"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Save className="h-5 w-5" />
              )}
              {t('common.create')} Campaign
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CampaignCreate;
