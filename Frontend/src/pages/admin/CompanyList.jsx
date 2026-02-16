import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Search,
  Building2,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  AlertCircle,
  RefreshCw,
  Shield,
  Target,
  Mail,
  Globe,
  Phone,
  MapPin,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Activity,
  UserCheck,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { companiesAPI, analyticsAPI } from '../../api';

// Industry labels mapping
const INDUSTRY_LABELS = {
  TECH: 'Technology',
  FINANCE: 'Finance & Banking',
  HEALTHCARE: 'Healthcare',
  EDUCATION: 'Education',
  RETAIL: 'Retail & E-commerce',
  MANUFACTURING: 'Manufacturing',
  GOVERNMENT: 'Government',
  TELECOM: 'Telecommunications',
  ENERGY: 'Energy & Utilities',
  OTHER: 'Other',
};

const INDUSTRY_OPTIONS = Object.entries(INDUSTRY_LABELS).map(([value, label]) => ({ value, label }));

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' },
];

// Risk level helper
const getRiskConfig = (score) => {
  if (score == null) return { label: 'N/A', color: 'bg-gray-100 text-gray-600', bgColor: 'bg-gray-400' };
  if (score <= 30) return { label: 'Low', color: 'bg-success-50 text-success-700', bgColor: 'bg-success-500' };
  if (score <= 60) return { label: 'Medium', color: 'bg-warning-50 text-warning-700', bgColor: 'bg-warning-500' };
  if (score <= 80) return { label: 'High', color: 'bg-orange-100 text-orange-700', bgColor: 'bg-orange-500' };
  return { label: 'Critical', color: 'bg-danger-50 text-danger-700', bgColor: 'bg-danger-500' };
};

// ============================================================================
// Reusable Components
// ============================================================================

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className={clsx('relative bg-white rounded-xl shadow-xl w-full', sizeClasses[size])}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          {children}
          <div className="flex gap-3 justify-end mt-6">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={clsx(danger ? 'btn-danger' : 'btn-primary', 'flex items-center gap-2')}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = (menuRef.current?.offsetHeight) || 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      // Flip upward if not enough room below
      const top = spaceBelow < menuHeight + 8
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;
      setPos({ top, left: rect.right - 192 });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        {trigger}
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            ref={menuRef}
            className="fixed w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
            style={{ top: pos.top, left: pos.left }}
          >
            {items.map((item, index) =>
              item.divider ? (
                <hr key={index} className="my-1" />
              ) : (
                <button
                  key={index}
                  onClick={() => {
                    setIsOpen(false);
                    item.onClick();
                  }}
                  disabled={item.disabled}
                  className={clsx(
                    'w-full px-4 py-2 text-start text-sm flex items-center gap-2 transition-colors',
                    item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-gray-700 hover:bg-gray-50',
                    item.disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {item.icon && <item.icon className="h-4 w-4" />}
                  {item.label}
                </button>
              )
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'primary', subtext }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between">
        <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// ============================================================================
// Create / Edit Company Modal
// ============================================================================

function CompanyFormModal({ isOpen, onClose, company, onSuccess }) {
  const { t } = useTranslation();
  const isEditing = !!company;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    name_ar: '',
    email: '',
    phone: '',
    website: '',
    country: '',
    city: '',
    address: '',
    industry: '',
    company_size: '',
    description: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      if (company) {
        setFormData({
          name: company.name || '',
          name_ar: company.name_ar || '',
          email: company.email || '',
          phone: company.phone || '',
          website: company.website || '',
          country: company.country || '',
          city: company.city || '',
          address: company.address || '',
          industry: company.industry || '',
          company_size: company.company_size || '',
          description: company.description || '',
        });
      } else {
        setFormData({
          name: '', name_ar: '', email: '', phone: '', website: '',
          country: '', city: '', address: '', industry: '', company_size: '', description: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, company]);

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Company name is required';
    else if (formData.name.trim().length < 2) newErrors.name = 'Name must be at least 2 characters';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (formData.website && !/^https?:\/\/.+/.test(formData.website) && formData.website.trim()) {
      newErrors.website = 'Website must start with http:// or https://';
    }
    if (!formData.country.trim()) newErrors.country = 'Country is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.company_size) newErrors.company_size = 'Company size is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      // Clean up data - remove empty optional fields
      const payload = { ...formData };
      if (!payload.website) delete payload.website;
      if (!payload.phone) delete payload.phone;
      if (!payload.address) delete payload.address;
      if (!payload.name_ar) delete payload.name_ar;
      if (!payload.description) delete payload.description;

      if (isEditing) {
        await companiesAPI.update(company.id, payload);
        toast.success('Company updated successfully');
      } else {
        await companiesAPI.create(payload);
        toast.success('Company created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        // Field-level errors from DRF
        const fieldErrors = {};
        for (const [key, val] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(fieldErrors);
      } else {
        toast.error(data?.detail || `Failed to ${isEditing ? 'update' : 'create'} company`);
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? t('admin.common.editCompany') : t('admin.companies.createNewCompany')} size="lg">
      <div className="space-y-5">
        {/* Company Name */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('admin.companies.companyName')} *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className={clsx('input', errors.name && 'border-danger-500')}
              placeholder="Acme Corporation"
            />
            {errors.name && <p className="text-xs text-danger-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="label">{t('admin.companies.companyNameAr')}</label>
            <input
              type="text"
              value={formData.name_ar}
              onChange={(e) => updateField('name_ar', e.target.value)}
              className="input"
              placeholder="اسم الشركة"
              dir="rtl"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label className="label">{t('admin.companies.companyEmail')} *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            className={clsx('input', errors.email && 'border-danger-500')}
            placeholder="admin@company.com"
          />
          {errors.email && <p className="text-xs text-danger-600 mt-1">{errors.email}</p>}
        </div>

        {/* Industry & Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('admin.common.industry')} *</label>
            <select
              value={formData.industry}
              onChange={(e) => updateField('industry', e.target.value)}
              className={clsx('input', errors.industry && 'border-danger-500')}
            >
              <option value="">{t('admin.companies.selectIndustry')}</option>
              {INDUSTRY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.industry && <p className="text-xs text-danger-600 mt-1">{errors.industry}</p>}
          </div>
          <div>
            <label className="label">{t('admin.companies.companySize')} *</label>
            <select
              value={formData.company_size}
              onChange={(e) => updateField('company_size', e.target.value)}
              className={clsx('input', errors.company_size && 'border-danger-500')}
            >
              <option value="">{t('admin.companies.selectSize')}</option>
              {COMPANY_SIZE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            {errors.company_size && <p className="text-xs text-danger-600 mt-1">{errors.company_size}</p>}
          </div>
        </div>

        {/* Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('admin.companies.phoneNumber')}</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              className="input"
              placeholder="+966 5XX XXX XXXX"
            />
          </div>
          <div>
            <label className="label">{t('admin.companies.website')}</label>
            <input
              type="url"
              value={formData.website}
              onChange={(e) => updateField('website', e.target.value)}
              className={clsx('input', errors.website && 'border-danger-500')}
              placeholder="https://company.com"
            />
            {errors.website && <p className="text-xs text-danger-600 mt-1">{errors.website}</p>}
          </div>
        </div>

        {/* Location */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">{t('admin.companies.country')} *</label>
            <input
              type="text"
              value={formData.country}
              onChange={(e) => updateField('country', e.target.value)}
              className={clsx('input', errors.country && 'border-danger-500')}
              placeholder="Saudi Arabia"
            />
            {errors.country && <p className="text-xs text-danger-600 mt-1">{errors.country}</p>}
          </div>
          <div>
            <label className="label">{t('admin.companies.city')} *</label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateField('city', e.target.value)}
              className={clsx('input', errors.city && 'border-danger-500')}
              placeholder="Riyadh"
            />
            {errors.city && <p className="text-xs text-danger-600 mt-1">{errors.city}</p>}
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="label">{t('admin.companies.address')}</label>
          <textarea
            value={formData.address}
            onChange={(e) => updateField('address', e.target.value)}
            className="input min-h-[80px]"
            placeholder="Full street address"
            rows={2}
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">{t('admin.companies.description')}</label>
          <textarea
            value={formData.description}
            onChange={(e) => updateField('description', e.target.value)}
            className="input min-h-[80px]"
            placeholder="Brief company description..."
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">{t('admin.common.cancel')}</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isEditing ? t('admin.common.saveChanges') : t('admin.companies.createCompany')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Company Details Modal
// ============================================================================

function CompanyDetailsModal({ isOpen, onClose, company, onEdit, onManageUsers }) {
  const { t } = useTranslation();
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    if (isOpen && company) {
      fetchStats();
    }
  }, [isOpen, company?.id]);

  const fetchStats = async () => {
    if (!company) return;
    setLoadingStats(true);
    try {
      const res = await companiesAPI.getStats(company.id);
      setStats(res.data);
    } catch {
      // Stats are optional - don't block the modal
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  if (!company) return null;

  const riskConfig = getRiskConfig(stats?.average_risk_score);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('admin.companies.companyDetails')} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-xl bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold flex-shrink-0">
            {company.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">{company.name}</h3>
            {company.name_ar && <p className="text-gray-500 text-sm" dir="rtl">{company.name_ar}</p>}
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                company.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
              )}>
                {company.is_active ? t('admin.common.active') : t('admin.common.inactive')}
              </span>
              <span className="text-xs text-gray-400">
                {INDUSTRY_LABELS[company.industry] || company.industry}
              </span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600 truncate">{company.email}</span>
          </div>
          {company.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">{company.phone}</span>
            </div>
          )}
          {company.website && (
            <div className="flex items-center gap-2 text-sm">
              <Globe className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline truncate">
                {company.website}
              </a>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{company.city}, {company.country}</span>
          </div>
        </div>

        {/* Stats Section */}
        {loadingStats ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Users className="h-5 w-5 text-primary-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.total_users}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.totalUsers')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Target className="h-5 w-5 text-success-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.active_campaigns}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.activeCampaigns')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-warning-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{stats.total_simulations}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.simulations')}</p>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <AlertTriangle className={clsx('h-5 w-5 mx-auto mb-1', riskConfig.bgColor === 'bg-gray-400' ? 'text-gray-400' : riskConfig.color.split(' ')[1])} />
                <p className="text-lg font-bold text-gray-900">
                  {stats.average_risk_score != null ? Math.round(stats.average_risk_score) : 'N/A'}
                </p>
                <p className="text-xs text-gray-500">{t('admin.companies.avgRiskScore')}</p>
              </div>
            </div>

            {/* Risk Score Bar */}
            {stats.average_risk_score != null && (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">{t('admin.common.riskScore')}</span>
                  <span className={clsx('text-sm font-medium px-2 py-0.5 rounded-full', riskConfig.color)}>
                    {riskConfig.label}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className={clsx('h-3 rounded-full transition-all', riskConfig.bgColor)}
                    style={{ width: `${Math.min(stats.average_risk_score, 100)}%` }}
                  />
                </div>
                {stats.employees_at_high_risk > 0 && (
                  <p className="text-xs text-danger-600 mt-2">{t('admin.companies.highRiskEmployees', { count: stats.employees_at_high_risk })}</p>
                )}
              </div>
            )}

            {/* Training & Engagement */}
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.total_quiz_completions || 0}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.quizzesDone')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.total_training_completions || 0}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.trainingDone')}</p>
              </div>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p className="text-lg font-bold text-gray-900">{stats.total_phishing_clicks || 0}</p>
                <p className="text-xs text-gray-500">{t('admin.companies.phishingClicks')}</p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4 text-gray-500 text-sm">{t('admin.companies.noStatsAvailable')}</div>
        )}

        {/* Meta Info */}
        <div className="grid grid-cols-2 gap-4 text-sm border-t pt-4">
          <div>
            <span className="text-gray-500">{t('admin.common.created')}</span>
            <p className="font-medium text-gray-900">
              {company.created_at ? format(new Date(company.created_at), 'MMM d, yyyy') : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">{t('admin.companies.companySize')}</span>
            <p className="font-medium text-gray-900">
              {COMPANY_SIZE_OPTIONS.find(s => s.value === company.company_size)?.label || company.company_size || 'N/A'}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">{t('admin.common.close')}</button>
          <button
            onClick={() => { onClose(); onEdit(company); }}
            className="btn-secondary flex-1 flex items-center justify-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            {t('common.edit')}
          </button>
          <button
            onClick={() => { onClose(); onManageUsers(company); }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Users className="h-4 w-4" />
            {t('admin.companies.manageUsers')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ============================================================================
// Delete Company Modal (with type-to-confirm)
// ============================================================================

function DeleteCompanyModal({ isOpen, onClose, company, onConfirm, loading }) {
  const { t } = useTranslation();
  const [confirmName, setConfirmName] = useState('');

  useEffect(() => {
    if (isOpen) setConfirmName('');
  }, [isOpen]);

  if (!isOpen || !company) return null;

  const nameMatches = confirmName.trim().toLowerCase() === company.name.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-danger-100 rounded-lg">
              <Trash2 className="h-5 w-5 text-danger-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{t('admin.common.deleteCompany')}</h3>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <p className="text-sm text-danger-800 font-medium mb-2">
                {t('admin.companies.deleteConfirm', { name: company.name })}
              </p>
              <p className="text-sm text-danger-700">
                {t('admin.companies.deleteWarning')}
              </p>
              <ul className="text-sm text-danger-700 mt-2 space-y-1 list-disc list-inside">
                <li>{t('admin.companies.usersCount', { count: company.total_users || 0 })}</li>
                <li>{t('admin.companies.allCampaignsAndSims')}</li>
                <li>{t('admin.companies.allTrainingRecords')}</li>
              </ul>
            </div>

            <div>
              <label className="label">
                Type <span className="font-semibold">{company.name}</span> to confirm
              </label>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                className="input"
                placeholder={company.name}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end mt-6">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              {t('admin.common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading || !nameMatches}
              className="btn-danger flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {t('admin.common.deleteCompany')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main CompanyList Component
// ============================================================================

function CompanyList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [overviewStats, setOverviewStats] = useState(null);
  const [totalCount, setTotalCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [industryFilter, setIndustryFilter] = useState('ALL');
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showIndustryMenu, setShowIndustryMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [viewingCompany, setViewingCompany] = useState(null);
  const [deletingCompany, setDeletingCompany] = useState(null);
  const [togglingCompany, setTogglingCompany] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input to avoid race conditions from rapid keystrokes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        ordering: '-created_at',
        page: currentPage,
        page_size: itemsPerPage,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (statusFilter === 'ACTIVE') params.is_active = true;
      if (statusFilter === 'INACTIVE') params.is_active = false;
      if (industryFilter !== 'ALL') params.industry = industryFilter;

      const [companiesRes, overviewRes] = await Promise.all([
        companiesAPI.list(params),
        analyticsAPI.getOverview().catch(() => ({ data: null })),
      ]);

      const data = companiesRes.data;
      const extractedCompanies = data?.results || data || [];

      setCompanies(extractedCompanies);
      setTotalCount(data?.count ?? extractedCompanies.length);
      setOverviewStats(overviewRes.data);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load companies';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, industryFilter, currentPage]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = totalCount;
    const active = companies.filter(c => c.is_active).length;
    const totalUsers = companies.reduce((sum, c) => sum + (c.total_users || 0), 0);
    const avgRisk = overviewStats?.average_risk_score
      ? Math.round(overviewStats.average_risk_score)
      : 0;
    return { total, active, totalUsers, avgRisk };
  }, [companies, overviewStats, totalCount]);

  // Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  };

  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  // Sorting logic
  const sortedCompanies = useMemo(() => {
    const result = [...companies];

    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'name':
          aVal = (a.name || '').toLowerCase();
          bVal = (b.name || '').toLowerCase();
          break;
        case 'total_users':
          aVal = a.total_users || 0;
          bVal = b.total_users || 0;
          break;
        case 'created_at':
          aVal = a.created_at || '';
          bVal = b.created_at || '';
          break;
        default:
          aVal = a[sortConfig.key];
          bVal = b[sortConfig.key];
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [companies, sortConfig]);

  // Pagination (server-side — API returns the correct page)
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Action handlers
  const handleDelete = async () => {
    if (!deletingCompany) return;
    setActionLoading(true);
    try {
      await companiesAPI.delete(deletingCompany.id);
      toast.success(`Company "${deletingCompany.name}" has been deleted`);
      setDeletingCompany(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete company');
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!togglingCompany) return;
    setActionLoading(true);
    try {
      if (togglingCompany.is_active) {
        await companiesAPI.update(togglingCompany.id, { is_active: false });
        toast.success(`Company "${togglingCompany.name}" has been deactivated`);
      } else {
        await companiesAPI.update(togglingCompany.id, { is_active: true });
        toast.success(`Company "${togglingCompany.name}" has been activated`);
      }
      setTogglingCompany(null);
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update company status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (companies.length === 0) {
      toast.error('No companies to export');
      return;
    }

    const headers = ['Name', 'Email', 'Industry', 'Size', 'Users', 'Status', 'Country', 'City', 'Created'];
    const rows = companies.map(c => [
      c.name || '',
      c.email || '',
      INDUSTRY_LABELS[c.industry] || c.industry || '',
      c.company_size || '',
      c.total_users || 0,
      c.is_active ? 'Active' : 'Inactive',
      c.country || '',
      c.city || '',
      c.created_at ? format(new Date(c.created_at), 'yyyy-MM-dd') : '',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(`Exported ${companies.length} companies`);
  };

  // Loading state
  if (loading && companies.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">{t('admin.companies.loadingCompanies')}</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && companies.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchCompanies} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.companies.title')}</h1>
          <p className="text-gray-600 mt-1">{t('admin.companies.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('admin.common.exportCsv')}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-4 w-4" />
            {t('admin.companies.createCompany')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Building2}
          label={t('admin.companies.totalCompanies')}
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={CheckCircle}
          label={t('admin.companies.activeCompanies')}
          value={stats.active}
          color="success"
          subtext={stats.total > 0 ? t('admin.companies.percentActive', { percent: Math.round(stats.active / stats.total * 100) }) : undefined}
        />
        <StatCard
          icon={Users}
          label={t('admin.companies.totalUsers')}
          value={stats.totalUsers.toLocaleString()}
          color="warning"
          subtext={t('admin.companies.acrossAllCompanies')}
        />
        <StatCard
          icon={Shield}
          label={t('admin.companies.avgRiskScore')}
          value={stats.avgRisk || 'N/A'}
          color={stats.avgRisk <= 30 ? 'success' : stats.avgRisk <= 60 ? 'warning' : 'danger'}
          subtext={t('admin.companies.platformWide')}
        />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={t('admin.companies.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input ps-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowIndustryMenu(false); }}
            className="btn-secondary flex items-center gap-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'ALL' ? t('admin.common.allStatus') : statusFilter === 'ACTIVE' ? t('admin.common.active') : t('admin.common.inactive')}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowStatusMenu(false)} />
              <div className="absolute end-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowStatusMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                      statusFilter === status && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {status === 'ALL' ? t('admin.common.allStatus') : status === 'ACTIVE' ? t('admin.common.active') : t('admin.common.inactive')}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Industry Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowIndustryMenu(!showIndustryMenu); setShowStatusMenu(false); }}
            className="btn-secondary flex items-center gap-2 min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">
                {industryFilter === 'ALL' ? t('admin.common.allIndustries') : (INDUSTRY_LABELS[industryFilter] || industryFilter)}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showIndustryMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowIndustryMenu(false)} />
              <div className="absolute end-0 mt-1 w-52 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setIndustryFilter('ALL'); setShowIndustryMenu(false); setCurrentPage(1); }}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                    industryFilter === 'ALL' && 'bg-primary-50 text-primary-700'
                  )}
                >
                  {t('admin.common.allIndustries')}
                </button>
                {INDUSTRY_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setIndustryFilter(opt.value); setShowIndustryMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                      industryFilter === opt.value && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        <button onClick={fetchCompanies} className="btn-secondary flex items-center gap-2">
          <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
          {t('admin.common.refresh')}
        </button>
      </div>

      {/* Companies Table */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin.common.company')}
                    <SortIndicator column="name" />
                  </div>
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">
                  {t('admin.common.industry')}
                </th>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('total_users')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin.common.users')}
                    <SortIndicator column="total_users" />
                  </div>
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  {t('admin.common.location')}
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  {t('admin.common.status')}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center gap-1">
                    {t('admin.common.created')}
                    <SortIndicator column="created_at" />
                  </div>
                </th>
                <th className="text-end px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  {t('admin.common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {sortedCompanies.length > 0 ? (
                sortedCompanies.map((company) => (
                  <tr key={company.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                          <Building2 className="h-5 w-5 text-primary-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 truncate">{company.name}</p>
                          <p className="text-xs text-gray-400 truncate">{company.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-sm text-gray-600">
                        {INDUSTRY_LABELS[company.industry] || company.industry || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">{company.total_users || 0}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {company.total_employees || 0} emp, {company.total_admins || 0} admin
                      </p>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm text-gray-600">
                        {company.city && company.country ? `${company.city}, ${company.country}` : company.country || '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
                        company.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                      )}>
                        {company.is_active ? t('admin.common.active') : t('admin.common.inactive')}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {company.created_at ? format(new Date(company.created_at), 'MMM d, yyyy') : '-'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <DropdownMenu
                          trigger={<MoreVertical className="h-5 w-5 text-gray-400" />}
                          items={[
                            { icon: Eye, label: t('admin.common.viewDetails'), onClick: () => setViewingCompany(company) },
                            { icon: Edit2, label: t('admin.common.editCompany'), onClick: () => setEditingCompany(company) },
                            { icon: Users, label: t('admin.companies.manageUsers'), onClick: () => navigate(`/admin/users?company=${company.id}`) },
                            { divider: true },
                            {
                              icon: company.is_active ? XCircle : CheckCircle,
                              label: company.is_active ? t('admin.common.deactivate') : t('admin.common.activate'),
                              onClick: () => setTogglingCompany(company),
                              danger: company.is_active,
                            },
                            {
                              icon: Trash2,
                              label: t('common.delete'),
                              onClick: () => setDeletingCompany(company),
                              danger: true,
                            },
                          ]}
                        />
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">{t('admin.companies.noCompaniesFound')}</h3>
                    <p className="text-gray-500 mb-4">
                      {searchQuery || statusFilter !== 'ALL' || industryFilter !== 'ALL'
                        ? t('admin.companies.adjustFilters')
                        : t('admin.companies.getStarted')}
                    </p>
                    {!searchQuery && statusFilter === 'ALL' && industryFilter === 'ALL' && (
                      <button onClick={() => setShowCreateModal(true)} className="btn-primary">
                        <Plus className="h-4 w-4 me-2" />
                        {t('admin.companies.createCompany')}
                      </button>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t">
            <div className="text-sm text-gray-500">
              {t('admin.companies.showingPagination', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, totalCount), total: totalCount })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                {t('admin.common.page')} {currentPage} {t('admin.common.of')} {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ======== Modals ======== */}

      {/* Create Company */}
      <CompanyFormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        company={null}
        onSuccess={fetchCompanies}
      />

      {/* Edit Company */}
      <CompanyFormModal
        isOpen={!!editingCompany}
        onClose={() => setEditingCompany(null)}
        company={editingCompany}
        onSuccess={fetchCompanies}
      />

      {/* Company Details */}
      <CompanyDetailsModal
        isOpen={!!viewingCompany}
        onClose={() => setViewingCompany(null)}
        company={viewingCompany}
        onEdit={(c) => setEditingCompany(c)}
        onManageUsers={(c) => {
          navigate(`/admin/users?company=${c.id}`);
        }}
      />

      {/* Delete Confirmation */}
      <DeleteCompanyModal
        isOpen={!!deletingCompany}
        onClose={() => setDeletingCompany(null)}
        company={deletingCompany}
        onConfirm={handleDelete}
        loading={actionLoading}
      />

      {/* Activate/Deactivate Confirmation */}
      <ConfirmDialog
        isOpen={!!togglingCompany}
        onClose={() => setTogglingCompany(null)}
        onConfirm={handleToggleStatus}
        title={togglingCompany?.is_active ? t('admin.companies.deactivateCompany') : t('admin.companies.activateCompany')}
        message={
          togglingCompany?.is_active
            ? t('admin.companies.deactivateConfirm', { name: togglingCompany?.name })
            : t('admin.companies.activateConfirm', { name: togglingCompany?.name })
        }
        confirmText={togglingCompany?.is_active ? t('admin.common.deactivate') : t('admin.common.activate')}
        danger={togglingCompany?.is_active}
        loading={actionLoading}
      />
    </div>
  );
}

export default CompanyList;
