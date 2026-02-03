import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Plus,
  Search,
  Users,
  Mail,
  AlertTriangle,
  UserPlus,
  MoreVertical,
  Edit2,
  Trash2,
  Eye,
  Upload,
  Download,
  Filter,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Shield,
  Award,
  BookOpen,
  FileText,
  UserCheck,
  UserX,
  Clock,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { companiesAPI } from '../../api';
import { useAuth } from '../../contexts';

// Role configuration
const ROLE_CONFIG = {
  EMPLOYEE: { label: 'Employee', color: 'bg-gray-100 text-gray-700' },
  COMPANY_ADMIN: { label: 'Admin', color: 'bg-primary-100 text-primary-700' },
};

// Risk level configuration
const getRiskConfig = (score) => {
  if (score <= 30) return { level: 'LOW', label: 'Low Risk', color: 'bg-success-50 text-success-700', bgColor: 'bg-success-500' };
  if (score <= 70) return { level: 'MEDIUM', label: 'Medium Risk', color: 'bg-warning-50 text-warning-700', bgColor: 'bg-warning-500' };
  return { level: 'HIGH', label: 'High Risk', color: 'bg-danger-50 text-danger-700', bgColor: 'bg-danger-500' };
};

// Modal Component
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

// Confirmation Dialog
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
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

// Dropdown Menu Component
function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
        {trigger}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
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
                    'w-full px-4 py-2 text-left text-sm flex items-center gap-2 transition-colors',
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
        </>
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color = 'primary', trend, subtext }) {
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
        {trend !== undefined && (
          <div className={clsx(
            'flex items-center gap-1 text-sm font-medium',
            trend >= 0 ? 'text-success-600' : 'text-danger-600'
          )}>
            {trend >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
        {subtext && <p className="text-xs text-gray-400 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// Invite Employees Modal
function InviteEmployeesModal({ isOpen, onClose, companyId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [emailText, setEmailText] = useState('');

  const emails = useMemo(() => {
    return emailText
      .split(/[\n,;]/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.length > 0);
  }, [emailText]);

  const validEmails = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.filter(e => emailRegex.test(e));
  }, [emails]);

  const invalidEmails = useMemo(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emails.filter(e => !emailRegex.test(e));
  }, [emails]);

  const handleSubmit = async () => {
    if (validEmails.length === 0) {
      toast.error('Please enter at least one valid email');
      return;
    }

    setLoading(true);
    try {
      await companiesAPI.inviteUsers(companyId, validEmails);
      toast.success(`Invited ${validEmails.length} employee(s)`);
      setEmailText('');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to send invitations';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Invite Employees" size="md">
      <div className="space-y-4">
        <div>
          <label className="label">Email Addresses</label>
          <textarea
            value={emailText}
            onChange={(e) => setEmailText(e.target.value)}
            className="input min-h-[150px] font-mono text-sm"
            placeholder="Enter email addresses (one per line)&#10;employee1@company.com&#10;employee2@company.com"
          />
          <p className="text-xs text-gray-500 mt-1">
            Separate emails with new lines, commas, or semicolons
          </p>
        </div>

        {/* Email Validation Summary */}
        {emails.length > 0 && (
          <div className="p-3 bg-gray-50 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Check className="h-4 w-4 text-success-600" />
              <span className="text-success-700">{validEmails.length} valid email(s)</span>
            </div>
            {invalidEmails.length > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertCircle className="h-4 w-4 text-danger-600 mt-0.5" />
                <div>
                  <span className="text-danger-700">{invalidEmails.length} invalid email(s):</span>
                  <div className="text-xs text-danger-600 mt-1">
                    {invalidEmails.slice(0, 3).join(', ')}
                    {invalidEmails.length > 3 && ` +${invalidEmails.length - 3} more`}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="text-sm font-medium text-primary-800 mb-2">What happens next?</h4>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>Employees receive invitation emails</li>
            <li>They create accounts with the provided links</li>
            <li>They're automatically added to your company</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading || validEmails.length === 0}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Send {validEmails.length} Invitation{validEmails.length !== 1 ? 's' : ''}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Add Employee Modal
function AddEmployeeModal({ isOpen, onClose, companyId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', first_name: '', last_name: '', role: 'EMPLOYEE' });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await companiesAPI.addUser(companyId, formData);
      toast.success('Employee added successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.email?.[0] || 'Failed to add employee';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Employee" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className={clsx('input', errors.first_name && 'border-danger-500')}
              placeholder="John"
            />
            {errors.first_name && <p className="text-xs text-danger-600 mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className={clsx('input', errors.last_name && 'border-danger-500')}
              placeholder="Doe"
            />
            {errors.last_name && <p className="text-xs text-danger-600 mt-1">{errors.last_name}</p>}
          </div>
        </div>

        <div>
          <label className="label">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={clsx('input', errors.email && 'border-danger-500')}
            placeholder="john.doe@company.com"
          />
          {errors.email && <p className="text-xs text-danger-600 mt-1">{errors.email}</p>}
        </div>

        <div>
          <label className="label">Role</label>
          <div className="flex gap-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                  formData.role === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={key}
                  checked={formData.role === key}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="sr-only"
                />
                <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', config.color)}>
                  {config.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Employee
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Edit Employee Modal
function EditEmployeeModal({ isOpen, onClose, employee, companyId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: 'EMPLOYEE',
  });

  useEffect(() => {
    if (employee) {
      setFormData({
        first_name: employee.first_name || '',
        last_name: employee.last_name || '',
        role: employee.role || 'EMPLOYEE',
      });
    }
  }, [employee]);

  const handleSubmit = async () => {
    if (!formData.first_name.trim() || !formData.last_name.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      await companiesAPI.updateUser(companyId, employee.id, formData);
      toast.success('Employee updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update employee';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Employee" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
              placeholder="John"
            />
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
              className="input"
              placeholder="Doe"
            />
          </div>
        </div>

        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={employee.email}
            disabled
            className="input bg-gray-50 text-gray-500"
          />
          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
        </div>

        <div>
          <label className="label">Role</label>
          <div className="flex gap-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                  formData.role === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                )}
              >
                <input
                  type="radio"
                  name="role"
                  value={key}
                  checked={formData.role === key}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="sr-only"
                />
                <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', config.color)}>
                  {config.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Import CSV Modal
function ImportCSVModal({ isOpen, onClose, companyId, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setFile(null);
    }
  }, [isOpen]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.type === 'text/csv' || droppedFile.name.endsWith('.csv')) {
        setFile(droppedFile);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await companiesAPI.importCSV(companyId, formData);
      toast.success('Employees imported successfully');
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to import employees';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const template = 'email,first_name,last_name,role\njohn@example.com,John,Doe,EMPLOYEE\njane@example.com,Jane,Smith,COMPANY_ADMIN';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employee_import_template.csv';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Import Employees from CSV" size="md">
      <div className="space-y-4">
        {/* Download Template */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <FileText className="h-4 w-4" />
            <span>Need a template?</span>
          </div>
          <button onClick={downloadTemplate} className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            Download CSV Template
          </button>
        </div>

        {/* File Upload */}
        <div
          className={clsx(
            'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
            dragActive ? 'border-primary-500 bg-primary-50' : 'border-gray-300',
            file && 'border-success-500 bg-success-50'
          )}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <Check className="h-8 w-8 text-success-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">{file.name}</p>
                <p className="text-sm text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
              <button
                onClick={() => setFile(null)}
                className="p-1 hover:bg-gray-200 rounded"
              >
                <X className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-2">
                Drag and drop your CSV file here, or
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                browse to upload
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* CSV Format Info */}
        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="text-sm font-medium text-primary-800 mb-2">CSV Format</h4>
          <p className="text-sm text-primary-700 mb-2">Your CSV should have these columns:</p>
          <code className="text-xs bg-white px-2 py-1 rounded border">
            email, first_name, last_name, role
          </code>
          <p className="text-xs text-primary-600 mt-2">
            Role can be: EMPLOYEE or COMPANY_ADMIN
          </p>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={loading || !file}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Import Employees
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Employee Details Modal
function EmployeeDetailsModal({ isOpen, onClose, employee }) {
  if (!employee) return null;

  const riskConfig = getRiskConfig(employee.risk_score?.score || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Employee Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-semibold">
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-gray-500">{employee.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', ROLE_CONFIG[employee.role]?.color)}>
                {ROLE_CONFIG[employee.role]?.label || employee.role}
              </span>
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                employee.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-700'
              )}>
                {employee.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">Risk Score</span>
            <span className={clsx('text-sm font-medium px-2 py-1 rounded-full', riskConfig.color)}>
              {riskConfig.label}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={clsx('h-3 rounded-full transition-all', riskConfig.bgColor)}
                  style={{ width: `${employee.risk_score?.score || 0}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900">{employee.risk_score?.score || 0}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{employee.quizzes_completed || 0}</p>
            <p className="text-sm text-gray-500">Quizzes Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Award className="h-6 w-6 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{employee.trainings_completed || 0}</p>
            <p className="text-sm text-gray-500">Trainings Completed</p>
          </div>
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <Shield className="h-6 w-6 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{employee.badges_earned || 0}</p>
            <p className="text-sm text-gray-500">Badges Earned</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Joined</span>
            <p className="font-medium text-gray-900">
              {employee.date_joined
                ? format(new Date(employee.date_joined), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500">Last Active</span>
            <p className="font-medium text-gray-900">
              {employee.last_login
                ? formatDistanceToNow(new Date(employee.last_login), { addSuffix: true })
                : 'Never'}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button onClick={onClose} className="btn-secondary w-full">Close</button>
        </div>
      </div>
    </Modal>
  );
}

// Main Component
function CompanyEmployees() {
  const { user } = useAuth();
  const companyId = user?.company_id || user?.company;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'first_name', direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const itemsPerPage = 10;

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEmployees = useCallback(async () => {
    if (!companyId) return;

    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter === 'ACTIVE') params.is_active = true;
      if (statusFilter === 'INACTIVE') params.is_active = false;
      if (searchQuery) params.search = searchQuery;

      const response = await companiesAPI.getUsers(companyId, params);
      setEmployees(response.data?.results || response.data || []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load employees';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [companyId, statusFilter, searchQuery]);

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  // Stats calculations
  const stats = useMemo(() => {
    const total = employees.length;
    const active = employees.filter(e => e.is_active).length;
    const highRisk = employees.filter(e => (e.risk_score?.score || 0) > 70).length;
    const avgRisk = total > 0
      ? Math.round(employees.reduce((sum, e) => sum + (e.risk_score?.score || 0), 0) / total)
      : 0;
    return { total, active, highRisk, avgRisk };
  }, [employees]);

  // Sorting
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filtering and sorting
  const filteredAndSortedEmployees = useMemo(() => {
    let result = [...employees];

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e =>
        `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      let aVal, bVal;

      switch (sortConfig.key) {
        case 'name':
        case 'first_name':
          aVal = `${a.first_name} ${a.last_name}`.toLowerCase();
          bVal = `${b.first_name} ${b.last_name}`.toLowerCase();
          break;
        case 'risk_score':
          aVal = a.risk_score?.score || 0;
          bVal = b.risk_score?.score || 0;
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
  }, [employees, searchQuery, sortConfig]);

  // Pagination
  const paginatedEmployees = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredAndSortedEmployees.slice(start, start + itemsPerPage);
  }, [filteredAndSortedEmployees, currentPage]);

  const totalPages = Math.ceil(filteredAndSortedEmployees.length / itemsPerPage);

  // Selection handlers
  const toggleSelectAll = () => {
    if (selectedEmployees.size === paginatedEmployees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(paginatedEmployees.map(e => e.id)));
    }
  };

  const toggleSelectEmployee = (id) => {
    const newSet = new Set(selectedEmployees);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedEmployees(newSet);
  };

  // Action handlers
  const handleDeactivate = async () => {
    if (!deactivatingEmployee) return;
    setActionLoading(true);
    try {
      await companiesAPI.removeUser(companyId, deactivatingEmployee.id);
      toast.success('Employee deactivated successfully');
      setDeactivatingEmployee(null);
      fetchEmployees();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to deactivate employee';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await companiesAPI.exportUsers(companyId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Employees exported successfully');
    } catch (err) {
      toast.error('Failed to export employees');
    }
  };

  // Sort indicator
  const SortIndicator = ({ column }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? (
      <ChevronUp className="h-4 w-4" />
    ) : (
      <ChevronDown className="h-4 w-4" />
    );
  };

  if (loading && employees.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchEmployees} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Employees</h1>
          <p className="text-gray-600 mt-1">Manage your organization's employees</p>
        </div>
        <div className="flex gap-3">
          <DropdownMenu
            trigger={
              <div className="btn-secondary flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Add
                <ChevronDown className="h-4 w-4" />
              </div>
            }
            items={[
              { icon: UserPlus, label: 'Invite Employees', onClick: () => setShowInviteModal(true) },
              { icon: Plus, label: 'Add Single Employee', onClick: () => setShowAddModal(true) },
              { icon: Upload, label: 'Import from CSV', onClick: () => setShowImportModal(true) },
              { divider: true },
              { icon: Download, label: 'Export to CSV', onClick: handleExport },
            ]}
          />
          <button onClick={fetchEmployees} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={UserCheck}
          label="Active Employees"
          value={stats.active}
          color="success"
        />
        <StatCard
          icon={AlertTriangle}
          label="High Risk"
          value={stats.highRisk}
          color="danger"
          subtext="Score > 70"
        />
        <StatCard
          icon={Shield}
          label="Avg Risk Score"
          value={stats.avgRisk}
          color={stats.avgRisk <= 30 ? 'success' : stats.avgRisk <= 70 ? 'warning' : 'danger'}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="btn-secondary flex items-center gap-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'ALL' ? 'All Status' : statusFilter === 'ACTIVE' ? 'Active' : 'Inactive'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowFilterMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                      statusFilter === status && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {status === 'ALL' ? 'All Status' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Employee Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === paginatedEmployees.length && paginatedEmployees.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center gap-1">
                    Name
                    <SortIndicator column="first_name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('risk_score')}
                >
                  <div className="flex items-center gap-1">
                    Risk Score
                    <SortIndicator column="risk_score" />
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Quizzes
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Training
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Badges
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => {
                  const riskConfig = getRiskConfig(employee.risk_score?.score || 0);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(employee.id)}
                          onChange={() => toggleSelectEmployee(employee.id)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </div>
                          <span className="font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{employee.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', ROLE_CONFIG[employee.role]?.color)}>
                          {ROLE_CONFIG[employee.role]?.label || employee.role}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div
                              className={clsx('h-2 rounded-full', riskConfig.bgColor)}
                              style={{ width: `${employee.risk_score?.score || 0}%` }}
                            />
                          </div>
                          <span className={clsx('text-xs font-medium px-2 py-0.5 rounded-full', riskConfig.color)}>
                            {employee.risk_score?.score || 0}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {employee.quizzes_completed || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {employee.trainings_completed || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">
                        {employee.badges_earned || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          employee.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {employee.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu
                            trigger={<MoreVertical className="h-5 w-5 text-gray-400" />}
                            items={[
                              { icon: Eye, label: 'View Details', onClick: () => setViewingEmployee(employee) },
                              { icon: Edit2, label: 'Edit', onClick: () => setEditingEmployee(employee) },
                              { divider: true },
                              {
                                icon: employee.is_active ? UserX : UserCheck,
                                label: employee.is_active ? 'Deactivate' : 'Activate',
                                onClick: () => setDeactivatingEmployee(employee),
                                danger: employee.is_active,
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
                    <p className="text-gray-500">
                      {searchQuery || statusFilter !== 'ALL'
                        ? 'Try adjusting your filters'
                        : 'Get started by inviting employees to your organization'}
                    </p>
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
              Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length)} of {filteredAndSortedEmployees.length} employees
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
                Page {currentPage} of {totalPages}
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

      {/* Modals */}
      <InviteEmployeesModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        companyId={companyId}
        onSuccess={fetchEmployees}
      />

      <AddEmployeeModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        companyId={companyId}
        onSuccess={fetchEmployees}
      />

      <EditEmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
        companyId={companyId}
        onSuccess={fetchEmployees}
      />

      <ImportCSVModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        companyId={companyId}
        onSuccess={fetchEmployees}
      />

      <EmployeeDetailsModal
        isOpen={!!viewingEmployee}
        onClose={() => setViewingEmployee(null)}
        employee={viewingEmployee}
      />

      <ConfirmDialog
        isOpen={!!deactivatingEmployee}
        onClose={() => setDeactivatingEmployee(null)}
        onConfirm={handleDeactivate}
        title={deactivatingEmployee?.is_active ? 'Deactivate Employee' : 'Activate Employee'}
        message={
          deactivatingEmployee?.is_active
            ? `Are you sure you want to deactivate ${deactivatingEmployee?.first_name} ${deactivatingEmployee?.last_name}? They will no longer be able to access the platform.`
            : `Are you sure you want to activate ${deactivatingEmployee?.first_name} ${deactivatingEmployee?.last_name}?`
        }
        confirmText={deactivatingEmployee?.is_active ? 'Deactivate' : 'Activate'}
        danger={deactivatingEmployee?.is_active}
        loading={actionLoading}
      />
    </div>
  );
}

export default CompanyEmployees;
