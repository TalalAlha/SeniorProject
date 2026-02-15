import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
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
  Building2,
  UserCheck,
  AlertTriangle,
  XCircle,
  CheckCircle,
  User,
  Mail,
  Phone,
  Clock,
  Calendar,
  Target,
  BookOpen,
  Award,
  Activity,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { companiesAPI } from '../../api';
import { useAuth } from '../../contexts/AuthContext';

// ── Constants ──────────────────────────────────────────────

const ROLE_LABELS = {
  SUPER_ADMIN: 'Super Admin',
  COMPANY_ADMIN: 'Company Admin',
  EMPLOYEE: 'Employee',
  PUBLIC_USER: 'Public User',
};

const ROLE_COLORS = {
  SUPER_ADMIN: 'bg-purple-100 text-purple-800',
  COMPANY_ADMIN: 'bg-primary-100 text-primary-800',
  EMPLOYEE: 'bg-gray-100 text-gray-700',
  PUBLIC_USER: 'bg-orange-100 text-orange-700',
};

const ROLE_OPTIONS = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'COMPANY_ADMIN', label: 'Company Admin' },
];

const ITEMS_PER_PAGE = 20;

// ── Helpers ────────────────────────────────────────────────

function getRiskBg(score) {
  if (score == null) return 'bg-gray-100 text-gray-500';
  if (score < 30) return 'bg-success-50 text-success-700';
  if (score < 60) return 'bg-warning-50 text-warning-700';
  if (score < 80) return 'bg-orange-100 text-orange-700';
  return 'bg-danger-50 text-danger-700';
}

function getRiskBarColor(score) {
  if (score < 30) return 'bg-success-500';
  if (score < 60) return 'bg-warning-500';
  if (score < 80) return 'bg-orange-500';
  return 'bg-danger-500';
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'MMM d, yyyy');
  } catch {
    return d;
  }
}

function formatRelativeTime(d) {
  if (!d) return 'Never';
  try {
    return formatDistanceToNow(new Date(d), { addSuffix: true });
  } catch {
    return d;
  }
}

function downloadCSV(rows, headers, filename) {
  const csvContent = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Reusable Sub-components ────────────────────────────────

function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;
  const sizeClasses = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

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
        </>
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
    purple: 'bg-purple-100 text-purple-600',
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

// ── User Details Modal ─────────────────────────────────────

function UserDetailsModal({ isOpen, onClose, user, onEdit }) {
  if (!isOpen || !user) return null;

  const riskScore = user.risk_score;
  const riskValue = riskScore?.score ?? riskScore?.risk_score ?? null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="User Details" size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-bold flex-shrink-0">
            {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900">
              {user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.email}
            </h3>
            <p className="text-gray-500 text-sm">{user.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', ROLE_COLORS[user.role])}>
                {ROLE_LABELS[user.role] || user.role}
              </span>
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                user.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
              )}>
                {user.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* User Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">{user._companyName || 'No company'}</span>
          </div>
          {user.phone_number && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-gray-400 flex-shrink-0" />
              <span className="text-gray-600">{user.phone_number}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Joined {formatDate(user.date_joined)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Clock className="h-4 w-4 text-gray-400 flex-shrink-0" />
            <span className="text-gray-600">Last login {formatRelativeTime(user.last_login)}</span>
          </div>
        </div>

        {/* Account Status */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Account Status</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="text-center">
              <div className={clsx(
                'w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1',
                user.is_active ? 'bg-success-100' : 'bg-gray-200'
              )}>
                <CheckCircle className={clsx('h-4 w-4', user.is_active ? 'text-success-600' : 'text-gray-400')} />
              </div>
              <p className="text-xs text-gray-500">Active</p>
            </div>
            <div className="text-center">
              <div className={clsx(
                'w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1',
                user.is_verified ? 'bg-success-100' : 'bg-gray-200'
              )}>
                <Shield className={clsx('h-4 w-4', user.is_verified ? 'text-success-600' : 'text-gray-400')} />
              </div>
              <p className="text-xs text-gray-500">Verified</p>
            </div>
            <div className="text-center">
              <div className={clsx(
                'w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1',
                user.last_login ? 'bg-primary-100' : 'bg-gray-200'
              )}>
                <Activity className={clsx('h-4 w-4', user.last_login ? 'text-primary-600' : 'text-gray-400')} />
              </div>
              <p className="text-xs text-gray-500">Logged In</p>
            </div>
            <div className="text-center">
              <div className={clsx(
                'w-8 h-8 rounded-full mx-auto flex items-center justify-center mb-1',
                user.company ? 'bg-primary-100' : 'bg-gray-200'
              )}>
                <Building2 className={clsx('h-4 w-4', user.company ? 'text-primary-600' : 'text-gray-400')} />
              </div>
              <p className="text-xs text-gray-500">Company</p>
            </div>
          </div>
        </div>

        {/* Activity Summary (employees only) */}
        {user.role === 'EMPLOYEE' && riskScore && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">Activity Summary</h4>

            {/* Risk Score Bar */}
            {riskValue != null && (
              <div className="mb-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-gray-600">Risk Score</span>
                  <span className={clsx('text-sm font-medium px-2 py-0.5 rounded-full', getRiskBg(riskValue))}>
                    {Math.round(riskValue)} - {riskScore.risk_level || 'N/A'}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={clsx('h-2.5 rounded-full transition-all', getRiskBarColor(riskValue))}
                    style={{ width: `${Math.min(riskValue, 100)}%` }}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-2 bg-white rounded-lg">
                <Target className="h-4 w-4 text-primary-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{riskScore.total_quizzes_taken || 0}</p>
                <p className="text-xs text-gray-500">Quizzes Taken</p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <Mail className="h-4 w-4 text-warning-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{riskScore.total_simulations_received || 0}</p>
                <p className="text-xs text-gray-500">Sims Received</p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <BookOpen className="h-4 w-4 text-success-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{riskScore.trainings_completed || 0}</p>
                <p className="text-xs text-gray-500">Training Done</p>
              </div>
              <div className="p-2 bg-white rounded-lg">
                <AlertTriangle className="h-4 w-4 text-danger-600 mx-auto mb-1" />
                <p className="text-lg font-bold text-gray-900">{riskScore.simulations_clicked || 0}</p>
                <p className="text-xs text-gray-500">Phish Clicked</p>
              </div>
            </div>

            {riskScore.requires_remediation && (
              <div className="mt-3 p-2 bg-danger-50 rounded-lg text-center">
                <p className="text-xs text-danger-700 font-medium">Requires remediation training</p>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">Close</button>
          <button
            onClick={() => { onClose(); onEdit(user); }}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            <Edit2 className="h-4 w-4" />
            Edit User
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ── Edit User Modal ────────────────────────────────────────

function EditUserModal({ isOpen, onClose, user, companies, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    role: '',
    is_active: true,
    phone_number: '',
  });
  const [moveCompany, setMoveCompany] = useState(null); // For moving user to a different company
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        role: user.role || 'EMPLOYEE',
        is_active: user.is_active ?? true,
        phone_number: user.phone_number || '',
      });
      setMoveCompany(null);
      setErrors({});
    }
  }, [isOpen, user]);

  const validate = () => {
    const newErrors = {};
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required';
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required';
    if (!formData.role) newErrors.role = 'Role is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate() || !user) return;

    setLoading(true);
    try {
      const payload = {
        first_name: formData.first_name,
        last_name: formData.last_name,
        role: formData.role,
        is_active: formData.is_active,
        phone_number: formData.phone_number,
      };

      await companiesAPI.updateUser(user._companyId, user.id, payload);
      toast.success(`User "${formData.first_name} ${formData.last_name}" updated successfully`);
      onSuccess();
      onClose();
    } catch (err) {
      const data = err.response?.data;
      if (data && typeof data === 'object' && !data.detail) {
        const fieldErrors = {};
        for (const [key, val] of Object.entries(data)) {
          fieldErrors[key] = Array.isArray(val) ? val[0] : val;
        }
        setErrors(fieldErrors);
      } else {
        toast.error(data?.detail || 'Failed to update user');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  if (!user) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit User" size="md">
      <div className="space-y-5">
        {/* Email (read-only) */}
        <div>
          <label className="label">Email</label>
          <input
            type="email"
            value={user.email || ''}
            disabled
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
          />
          <p className="text-xs text-gray-400 mt-1">Email cannot be changed</p>
        </div>

        {/* Names */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => updateField('first_name', e.target.value)}
              className={clsx('input', errors.first_name && 'border-danger-500')}
              placeholder="First name"
            />
            {errors.first_name && <p className="text-xs text-danger-600 mt-1">{errors.first_name}</p>}
          </div>
          <div>
            <label className="label">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => updateField('last_name', e.target.value)}
              className={clsx('input', errors.last_name && 'border-danger-500')}
              placeholder="Last name"
            />
            {errors.last_name && <p className="text-xs text-danger-600 mt-1">{errors.last_name}</p>}
          </div>
        </div>

        {/* Role */}
        <div>
          <label className="label">Role *</label>
          <select
            value={formData.role}
            onChange={(e) => updateField('role', e.target.value)}
            className={clsx('input', errors.role && 'border-danger-500')}
            disabled={user.role === 'SUPER_ADMIN'}
          >
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          {user.role === 'SUPER_ADMIN' && (
            <p className="text-xs text-gray-400 mt-1">Super Admin role cannot be changed here</p>
          )}
          {errors.role && <p className="text-xs text-danger-600 mt-1">{errors.role}</p>}
        </div>

        {/* Company (read-only display) */}
        <div>
          <label className="label">Company</label>
          <input
            type="text"
            value={user._companyName || 'No company'}
            disabled
            className="input bg-gray-50 text-gray-500 cursor-not-allowed"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="label">Phone Number</label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => updateField('phone_number', e.target.value)}
            className="input"
            placeholder="+966 5XX XXX XXXX"
          />
        </div>

        {/* Status Toggle */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-900">Account Status</p>
            <p className="text-xs text-gray-500">
              {formData.is_active ? 'User has access to the platform' : 'User cannot access the platform'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => updateField('is_active', !formData.is_active)}
            className={clsx(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              formData.is_active ? 'bg-success-500' : 'bg-gray-300'
            )}
          >
            <span
              className={clsx(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                formData.is_active ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Actions */}
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

// ── Main UserManagement Component ──────────────────────────

function UserManagement() {
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allUsers, setAllUsers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [companyFilter, setCompanyFilter] = useState('ALL');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showCompanyMenu, setShowCompanyMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'date_joined', direction: 'desc' });
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [viewingUser, setViewingUser] = useState(null);
  const [editingUser, setEditingUser] = useState(null);
  const [deactivatingUser, setDeactivatingUser] = useState(null);
  const [deletingUser, setDeletingUser] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // ── Data fetching ──

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch all companies
      const companiesRes = await companiesAPI.list({ ordering: 'name' });
      const companiesList = companiesRes.data?.results || companiesRes.data || [];
      setCompanies(companiesList);

      // 2. Fetch users from all companies in parallel
      const userPromises = companiesList.map((company) =>
        companiesAPI.getUsers(company.id)
          .then((res) => {
            const users = res.data?.results || res.data || [];
            // Annotate each user with company info
            return users.map((u) => ({
              ...u,
              _companyId: company.id,
              _companyName: company.name,
              _companyActive: company.is_active,
            }));
          })
          .catch(() => [])
      );

      const allCompanyUsers = await Promise.all(userPromises);
      const flatUsers = allCompanyUsers.flat();

      // Super Admins don't belong to any company, so include the current user if they're a Super Admin
      if (currentUser && currentUser.role === 'SUPER_ADMIN') {
        const alreadyIncluded = flatUsers.some((u) => u.id === currentUser.id);
        if (!alreadyIncluded) {
          flatUsers.push({
            ...currentUser,
            _companyId: null,
            _companyName: 'Platform',
            _companyActive: true,
          });
        }
      }

      setAllUsers(flatUsers);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load users';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── Stats ──

  const stats = useMemo(() => {
    const total = allUsers.length;
    const superAdmins = allUsers.filter((u) => u.role === 'SUPER_ADMIN').length;
    const companyAdmins = allUsers.filter((u) => u.role === 'COMPANY_ADMIN').length;
    const employees = allUsers.filter((u) => u.role === 'EMPLOYEE').length;
    return { total, superAdmins, companyAdmins, employees };
  }, [allUsers]);

  // ── Filtering, sorting, pagination ──

  const filteredUsers = useMemo(() => {
    let data = [...allUsers];

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((u) => {
        const name = `${u.first_name || ''} ${u.last_name || ''}`.toLowerCase();
        const email = (u.email || '').toLowerCase();
        return name.includes(q) || email.includes(q);
      });
    }

    // Company filter
    if (companyFilter !== 'ALL') {
      data = data.filter((u) => String(u._companyId) === String(companyFilter));
    }

    // Role filter
    if (roleFilter !== 'ALL') {
      data = data.filter((u) => u.role === roleFilter);
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      data = data.filter((u) => (statusFilter === 'ACTIVE' ? u.is_active : !u.is_active));
    }

    return data;
  }, [allUsers, searchQuery, companyFilter, roleFilter, statusFilter]);

  const sortedUsers = useMemo(() => {
    const result = [...filteredUsers];
    result.sort((a, b) => {
      let aVal, bVal;
      switch (sortConfig.key) {
        case 'name':
          aVal = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          bVal = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          break;
        case 'company':
          aVal = (a._companyName || '').toLowerCase();
          bVal = (b._companyName || '').toLowerCase();
          break;
        case 'role':
          aVal = a.role || '';
          bVal = b.role || '';
          break;
        case 'last_login':
          aVal = a.last_login || '';
          bVal = b.last_login || '';
          break;
        case 'date_joined':
          aVal = a.date_joined || '';
          bVal = b.date_joined || '';
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
  }, [filteredUsers, sortConfig]);

  const totalPages = Math.ceil(sortedUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return sortedUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [sortedUsers, currentPage]);

  // ── Handlers ──

  const handleSort = (key) => {
    setSortConfig((prev) => ({
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

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    setActionLoading(true);
    try {
      const newStatus = !deactivatingUser.is_active;
      await companiesAPI.updateUser(deactivatingUser._companyId, deactivatingUser.id, { is_active: newStatus });
      toast.success(`User ${newStatus ? 'activated' : 'deactivated'} successfully`);
      setDeactivatingUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setActionLoading(true);
    try {
      await companiesAPI.removeUser(deletingUser._companyId, deletingUser.id);
      toast.success(`User "${deletingUser.first_name} ${deletingUser.last_name}" has been removed`);
      setDeletingUser(null);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (filteredUsers.length === 0) {
      toast.error('No users to export');
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Company', 'Status', 'Risk Score', 'Last Login', 'Date Joined'];
    const rows = filteredUsers.map((u) => {
      const risk = u.risk_score?.score ?? u.risk_score?.risk_score ?? '';
      return [
        u.first_name || '',
        u.last_name || '',
        u.email || '',
        ROLE_LABELS[u.role] || u.role || '',
        u._companyName || '',
        u.is_active ? 'Active' : 'Inactive',
        risk !== '' ? Math.round(risk) : 'N/A',
        u.last_login ? format(new Date(u.last_login), 'yyyy-MM-dd HH:mm') : 'Never',
        u.date_joined ? format(new Date(u.date_joined), 'yyyy-MM-dd') : '',
      ];
    });

    downloadCSV(rows, headers, `platform-users-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${filteredUsers.length} users`);
  };

  // Close all filter menus
  const closeMenus = () => {
    setShowCompanyMenu(false);
    setShowRoleMenu(false);
    setShowStatusMenu(false);
  };

  // ── Loading state ──

  if (loading && allUsers.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading users across all companies...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error && allUsers.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage all users across the platform</p>
        </div>
        <div className="flex gap-3">
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label="Total Users"
          value={stats.total.toLocaleString()}
          color="primary"
          subtext={`Across ${companies.length} companies`}
        />
        <StatCard
          icon={Shield}
          label="Super Admins"
          value={stats.superAdmins}
          color="purple"
          subtext="Platform administrators"
        />
        <StatCard
          icon={UserCheck}
          label="Company Admins"
          value={stats.companyAdmins}
          color="success"
          subtext="Company managers"
        />
        <StatCard
          icon={User}
          label="Employees"
          value={stats.employees.toLocaleString()}
          color="warning"
          subtext="End users"
        />
      </div>

      {/* ── Search & Filters ── */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="input ps-10"
          />
        </div>

        {/* Company Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowCompanyMenu(!showCompanyMenu); setShowRoleMenu(false); setShowStatusMenu(false); }}
            className="btn-secondary flex items-center gap-2 min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate max-w-[100px]">
                {companyFilter === 'ALL'
                  ? 'All Companies'
                  : companies.find((c) => String(c.id) === String(companyFilter))?.name || 'Company'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showCompanyMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeMenus} />
              <div className="absolute end-0 mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20 max-h-60 overflow-y-auto">
                <button
                  onClick={() => { setCompanyFilter('ALL'); setShowCompanyMenu(false); setCurrentPage(1); }}
                  className={clsx(
                    'w-full px-4 py-2 text-start text-sm hover:bg-gray-50',
                    companyFilter === 'ALL' && 'bg-primary-50 text-primary-700'
                  )}
                >
                  All Companies
                </button>
                {companies.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => { setCompanyFilter(String(c.id)); setShowCompanyMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-start text-sm hover:bg-gray-50 truncate',
                      String(companyFilter) === String(c.id) && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Role Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowRoleMenu(!showRoleMenu); setShowCompanyMenu(false); setShowStatusMenu(false); }}
            className="btn-secondary flex items-center gap-2 min-w-[140px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {roleFilter === 'ALL' ? 'All Roles' : ROLE_LABELS[roleFilter] || roleFilter}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showRoleMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeMenus} />
              <div className="absolute end-0 mt-1 w-44 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {['ALL', 'SUPER_ADMIN', 'COMPANY_ADMIN', 'EMPLOYEE'].map((role) => (
                  <button
                    key={role}
                    onClick={() => { setRoleFilter(role); setShowRoleMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-start text-sm hover:bg-gray-50',
                      roleFilter === role && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {role === 'ALL' ? 'All Roles' : ROLE_LABELS[role]}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => { setShowStatusMenu(!showStatusMenu); setShowCompanyMenu(false); setShowRoleMenu(false); }}
            className="btn-secondary flex items-center gap-2 min-w-[130px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'ALL' ? 'All Status' : statusFilter === 'ACTIVE' ? 'Active' : 'Inactive'}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showStatusMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={closeMenus} />
              <div className="absolute end-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowStatusMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-start text-sm hover:bg-gray-50',
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

      {/* Active filters indicator */}
      {(companyFilter !== 'ALL' || roleFilter !== 'ALL' || statusFilter !== 'ALL' || searchQuery) && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-gray-500">Showing {filteredUsers.length} of {allUsers.length} users</span>
          <button
            onClick={() => { setCompanyFilter('ALL'); setRoleFilter('ALL'); setStatusFilter('ALL'); setSearchQuery(''); setCurrentPage(1); }}
            className="text-sm text-primary-600 hover:text-primary-700 font-medium"
          >
            Clear all filters
          </button>
        </div>
      )}

      {/* ── Users Table ── */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-1">
                    User
                    <SortIndicator column="name" />
                  </div>
                </th>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hidden lg:table-cell"
                  onClick={() => handleSort('company')}
                >
                  <div className="flex items-center gap-1">
                    Company
                    <SortIndicator column="company" />
                  </div>
                </th>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center gap-1">
                    Role
                    <SortIndicator column="role" />
                  </div>
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase hidden md:table-cell">
                  Risk Score
                </th>
                <th className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th
                  className="text-start px-4 py-3 text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100 hidden sm:table-cell"
                  onClick={() => handleSort('last_login')}
                >
                  <div className="flex items-center gap-1">
                    Last Login
                    <SortIndicator column="last_login" />
                  </div>
                </th>
                <th className="text-end px-4 py-3 text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map((user) => {
                  const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
                  const riskValue = user.risk_score?.score ?? user.risk_score?.risk_score ?? null;

                  return (
                    <tr key={`${user._companyId}-${user.id}`} className="hover:bg-gray-50 transition-colors">
                      {/* User Name + Email */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-primary-600">
                              {(user.first_name?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {fullName || user.email}
                            </p>
                            <p className="text-xs text-gray-400 truncate">{user.email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Company */}
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          <span className="text-sm text-gray-600 truncate max-w-[150px]">
                            {user._companyName || '—'}
                          </span>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
                          ROLE_COLORS[user.role] || 'bg-gray-100 text-gray-700'
                        )}>
                          {ROLE_LABELS[user.role] || user.role}
                        </span>
                      </td>

                      {/* Risk Score */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        {user.role === 'EMPLOYEE' && riskValue != null ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 bg-gray-200 rounded-full h-1.5">
                              <div
                                className={clsx('h-1.5 rounded-full transition-all', getRiskBarColor(riskValue))}
                                style={{ width: `${Math.min(riskValue, 100)}%` }}
                              />
                            </div>
                            <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', getRiskBg(riskValue))}>
                              {Math.round(riskValue)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">
                            {user.role === 'EMPLOYEE' ? 'N/A' : '—'}
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
                          user.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                        )}>
                          {user.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>

                      {/* Last Login */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(user.last_login)}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu
                            trigger={<MoreVertical className="h-5 w-5 text-gray-400" />}
                            items={[
                              { icon: Eye, label: 'View Details', onClick: () => setViewingUser(user) },
                              { icon: Edit2, label: 'Edit User', onClick: () => setEditingUser(user) },
                              { divider: true },
                              {
                                icon: user.is_active ? XCircle : CheckCircle,
                                label: user.is_active ? 'Deactivate' : 'Activate',
                                onClick: () => setDeactivatingUser(user),
                                danger: user.is_active,
                              },
                              {
                                icon: Trash2,
                                label: 'Remove User',
                                onClick: () => setDeletingUser(user),
                                danger: true,
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
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                    <p className="text-gray-500">
                      {searchQuery || companyFilter !== 'ALL' || roleFilter !== 'ALL' || statusFilter !== 'ALL'
                        ? 'Try adjusting your search or filters'
                        : 'No users across the platform yet'}
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
              Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, sortedUsers.length)} of {sortedUsers.length} users
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══════════ Modals ══════════ */}

      {/* User Details */}
      <UserDetailsModal
        isOpen={!!viewingUser}
        onClose={() => setViewingUser(null)}
        user={viewingUser}
        onEdit={(u) => setEditingUser(u)}
      />

      {/* Edit User */}
      <EditUserModal
        isOpen={!!editingUser}
        onClose={() => setEditingUser(null)}
        user={editingUser}
        companies={companies}
        onSuccess={fetchData}
      />

      {/* Deactivate / Activate Confirmation */}
      <ConfirmDialog
        isOpen={!!deactivatingUser}
        onClose={() => setDeactivatingUser(null)}
        onConfirm={handleDeactivate}
        title={deactivatingUser?.is_active ? 'Deactivate User' : 'Activate User'}
        message={
          deactivatingUser?.is_active
            ? `Deactivate ${deactivatingUser?.first_name} ${deactivatingUser?.last_name}? They will lose access to the platform.`
            : `Activate ${deactivatingUser?.first_name} ${deactivatingUser?.last_name}? They will regain access to the platform.`
        }
        confirmText={deactivatingUser?.is_active ? 'Deactivate' : 'Activate'}
        danger={deactivatingUser?.is_active}
        loading={actionLoading}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingUser}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDelete}
        title="Remove User"
        message={`Remove "${deletingUser?.first_name} ${deletingUser?.last_name}" from ${deletingUser?._companyName}? This action cannot be undone. All user data including quiz results and activity will be removed.`}
        confirmText="Remove User"
        danger
        loading={actionLoading}
      />
    </div>
  );
}

export default UserManagement;
