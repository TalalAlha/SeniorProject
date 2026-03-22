import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Save, Loader2, Building2 } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { companiesAPI } from '../../api';

const INDUSTRY_OPTIONS = [
  { value: 'TECH', label: 'Technology' },
  { value: 'FINANCE', label: 'Finance & Banking' },
  { value: 'HEALTHCARE', label: 'Healthcare' },
  { value: 'EDUCATION', label: 'Education' },
  { value: 'RETAIL', label: 'Retail & E-commerce' },
  { value: 'MANUFACTURING', label: 'Manufacturing' },
  { value: 'GOVERNMENT', label: 'Government' },
  { value: 'TELECOM', label: 'Telecommunications' },
  { value: 'ENERGY', label: 'Energy & Utilities' },
  { value: 'OTHER', label: 'Other' },
];

const COMPANY_SIZE_OPTIONS = [
  { value: '1-10', label: '1-10 employees' },
  { value: '11-50', label: '11-50 employees' },
  { value: '51-200', label: '51-200 employees' },
  { value: '201-500', label: '201-500 employees' },
  { value: '501-1000', label: '501-1000 employees' },
  { value: '1001+', label: '1001+ employees' },
];

function CompanyCreate() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const payload = { ...formData };
      if (!payload.website) delete payload.website;
      if (!payload.phone) delete payload.phone;
      if (!payload.address) delete payload.address;
      if (!payload.name_ar) delete payload.name_ar;
      if (!payload.description) delete payload.description;

      await companiesAPI.create(payload);
      toast.success('Company created successfully');
      navigate('/admin/companies');
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(fieldErrors);
      } else {
        toast.error(data?.detail || 'Failed to create company');
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
    <div className="fade-in max-w-2xl mx-auto">
      <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-6">
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.back')}
      </button>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-lg bg-primary-100">
            <Building2 className="h-6 w-6 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Add New Company</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Company Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name *</label>
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
              <label className="label">Company Name (Arabic)</label>
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
            <label className="label">Company Email *</label>
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
              <label className="label">Industry *</label>
              <select
                value={formData.industry}
                onChange={(e) => updateField('industry', e.target.value)}
                className={clsx('input', errors.industry && 'border-danger-500')}
              >
                <option value="">Select industry</option>
                {INDUSTRY_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              {errors.industry && <p className="text-xs text-danger-600 mt-1">{errors.industry}</p>}
            </div>
            <div>
              <label className="label">Company Size *</label>
              <select
                value={formData.company_size}
                onChange={(e) => updateField('company_size', e.target.value)}
                className={clsx('input', errors.company_size && 'border-danger-500')}
              >
                <option value="">Select size</option>
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
              <label className="label">Phone Number</label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => updateField('phone', e.target.value)}
                className="input"
                placeholder="+966 5XX XXX XXXX"
              />
            </div>
            <div>
              <label className="label">Website</label>
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
              <label className="label">Country *</label>
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
              <label className="label">City *</label>
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

          {/* Description */}
          <div>
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              className="input min-h-[80px]"
              placeholder="Brief company description..."
              rows={2}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4 border-t">
            <button type="button" onClick={() => navigate(-1)} className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
              Create Company
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CompanyCreate;
