import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { createPortal } from 'react-dom';
import {
  Search,
  Users,
  Mail,
  AlertTriangle,
  UserPlus,
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
  Award,
  BookOpen,
  UserCheck,
  UserX,
  Clock,
  Send,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { companiesAPI, employeesAPI } from '../../api';
import { useAuth } from '../../contexts';

// Role configuration
const ROLE_CONFIG = {
  EMPLOYEE: { labelKey: 'employee.roleEmployee', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200' },
  COMPANY_ADMIN: { labelKey: 'employee.roleAdmin', color: 'bg-primary-100 text-primary-700' },
};

// Risk level configuration
const getRiskConfig = (score) => {
  if (score <= 30) return { level: 'LOW', labelKey: 'employee.riskLevels.low', color: 'bg-success-50 text-success-700', bgColor: 'bg-success-500' };
  if (score <= 70) return { level: 'MEDIUM', labelKey: 'employee.riskLevels.medium', color: 'bg-warning-50 text-warning-700', bgColor: 'bg-warning-500' };
  return { level: 'HIGH', labelKey: 'employee.riskLevels.high', color: 'bg-danger-50 text-danger-700', bgColor: 'bg-danger-500' };
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
        <div className={clsx('relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 w-full', sizeClasses[size])}>
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
          <div className="p-6 max-h-[calc(100vh-200px)] overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

// Confirmation Dialog
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText, danger = false, loading = false }) {
  const { t } = useTranslation();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50 transition-opacity" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 w-full max-w-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
          <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button onClick={onClose} className="btn-secondary" disabled={loading}>
              {t('common.cancel')}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className={clsx(danger ? 'btn-danger' : 'btn-primary', 'flex items-center gap-2')}
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmText || t('common.confirm')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Dropdown Menu Component (Portal-based to avoid overflow clipping)
function DropdownMenu({ trigger, items }) {
  const [isOpen, setIsOpen] = useState(false);
  const btnRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      const menuHeight = menuRef.current?.offsetHeight || 220;
      const spaceBelow = window.innerHeight - rect.bottom;
      const top = spaceBelow < menuHeight + 8
        ? rect.top - menuHeight - 4
        : rect.bottom + 4;
      setPos({ top, left: rect.right - 192 });
    }
  }, [isOpen]);

  return (
    <div className="relative">
      <button ref={btnRef} onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
        {trigger}
      </button>
      {isOpen && createPortal(
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div
            ref={menuRef}
            className="fixed w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-1 z-50"
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
                    item.danger ? 'text-danger-600 hover:bg-danger-50' : 'text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700',
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
        <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtext}</p>}
      </div>
    </div>
  );
}

// Invite Employee Modal — sends a token-based invitation email
function InviteEmployeesModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', first_name: '', last_name: '', department: '' });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({ email: '', first_name: '', last_name: '', department: '' });
      setErrors({});
    }
  }, [isOpen]);

  const validate = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = t('employee.emailRequired');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = t('employee.invalidEmailFormat');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await employeesAPI.invite(formData);
      toast.success(t('employee.invitationSentTo', { email: formData.email }));
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.error || t('employee.failedToSendInvitation');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employee.inviteEmployee')} size="md">
      <div className="space-y-4">
        <div>
          <label className="label">{t('employee.emailAddressLabel')}</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={clsx('input', errors.email && 'border-danger-500')}
            placeholder="employee@company.com"
          />
          {errors.email && <p className="text-xs text-danger-600 mt-1">{errors.email}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('auth.firstName')}</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
              placeholder="John"
            />
          </div>
          <div>
            <label className="label">{t('auth.lastName')}</label>
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
          <label className="label">{t('employee.department')}</label>
          <input
            type="text"
            value={formData.department}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            className="input"
            placeholder="e.g. Engineering, Marketing"
          />
        </div>

        <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
          <h4 className="text-sm font-medium text-primary-800 mb-2">{t('employee.whatHappensNext')}</h4>
          <ul className="text-sm text-primary-700 space-y-1 list-disc list-inside">
            <li>{t('employee.inviteBullet1')}</li>
            <li>{t('employee.inviteBullet2')}</li>
            <li>{t('employee.inviteBullet3')}</li>
          </ul>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('employee.sendInvitation')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Edit Employee Modal
function EditEmployeeModal({ isOpen, onClose, employee, companyId, onSuccess }) {
  const { t } = useTranslation();
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
      toast.error(t('employee.fillRequiredFields'));
      return;
    }

    setLoading(true);
    try {
      await companiesAPI.updateUser(companyId, employee.id, formData);
      toast.success(t('employee.employeeUpdated'));
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || t('employee.failedToUpdateEmployee');
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employee.editEmployeeTitle')} size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">{t('auth.firstName')} *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
              className="input"
              placeholder="John"
            />
          </div>
          <div>
            <label className="label">{t('auth.lastName')} *</label>
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
          <label className="label">{t('common.email')}</label>
          <input
            type="email"
            value={employee.email}
            disabled
            className="input bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('employee.emailCannotChange')}</p>
        </div>

        <div>
          <label className="label">{t('employee.roleLabel')}</label>
          <div className="flex gap-4">
            {Object.entries(ROLE_CONFIG).map(([key, config]) => (
              <label
                key={key}
                className={clsx(
                  'flex-1 flex items-center justify-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors',
                  formData.role === key
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                  {t(config.labelKey)}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button onClick={onClose} className="btn-secondary flex-1">{t('common.cancel')}</button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {t('admin.common.saveChanges')}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// Employee Details Modal
function EmployeeDetailsModal({ isOpen, onClose, employee }) {
  const { t } = useTranslation();
  if (!employee) return null;

  const riskConfig = getRiskConfig(employee.risk_score?.score || 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('employee.employeeDetails')} size="lg">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xl font-semibold">
            {employee.first_name?.[0]}{employee.last_name?.[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              {employee.first_name} {employee.last_name}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">{employee.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', ROLE_CONFIG[employee.role]?.color)}>
                {t(ROLE_CONFIG[employee.role]?.labelKey || 'employee.roleEmployee')}
              </span>
              <span className={clsx(
                'text-xs font-medium px-2 py-1 rounded-full',
                employee.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
              )}>
                {employee.is_active ? t('employee.statusActive') : t('employee.statusInactive')}
              </span>
            </div>
          </div>
        </div>

        {/* Risk Score */}
        <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t('employee.riskScoreLabel')}</span>
            <span className={clsx('text-sm font-medium px-2 py-1 rounded-full', riskConfig.color)}>
              {t(riskConfig.labelKey)}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3">
                <div
                  className={clsx('h-3 rounded-full transition-all', riskConfig.bgColor)}
                  style={{ width: `${employee.risk_score?.score || 0}%` }}
                />
              </div>
            </div>
            <span className="text-2xl font-bold text-gray-900 dark:text-white">{employee.risk_score?.score || 0}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <BookOpen className="h-6 w-6 text-primary-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.risk_score?.total_quizzes_taken || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('employee.quizzesTaken')}</p>
            {employee.risk_score?.quiz_accuracy != null && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{t('employee.accuracyLabel', { percent: Math.round(employee.risk_score.quiz_accuracy) })}</p>
            )}
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Mail className="h-6 w-6 text-warning-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{employee.risk_score?.total_simulations_received || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('employee.simulationsReceived')}</p>
            {employee.risk_score?.simulations_clicked > 0 && (
              <p className="text-xs text-danger-500 mt-1">{employee.risk_score.simulations_clicked} {t('simulation.clicked')}</p>
            )}
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <Award className="h-6 w-6 text-success-600 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {employee.risk_score?.trainings_completed || 0}/{employee.risk_score?.trainings_assigned || 0}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('employee.trainingCompleted')}</p>
          </div>
          <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <AlertTriangle className={clsx(
              'h-6 w-6 mx-auto mb-2',
              employee.risk_score?.requires_remediation ? 'text-danger-600' : 'text-success-600'
            )} />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {employee.risk_score?.requires_remediation ? t('common.yes') : t('common.no')}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{t('employee.needsRemediation')}</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">{t('employee.joined')}</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {employee.date_joined
                ? format(new Date(employee.date_joined), 'MMM d, yyyy')
                : 'N/A'}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">{t('employee.lastActive')}</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {employee.last_login
                ? formatDistanceToNow(new Date(employee.last_login), { addSuffix: true })
                : t('employee.never')}
            </p>
          </div>
        </div>

        <div className="pt-4 border-t">
          <button onClick={onClose} className="btn-secondary w-full">{t('common.close')}</button>
        </div>
      </div>
    </Modal>
  );
}

// Main Component
function CompanyEmployees() {
  const { t } = useTranslation();
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

  // Tab state
  const [activeTab, setActiveTab] = useState('employees');

  // Pending invitations state
  const [pendingInvitations, setPendingInvitations] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  // Modal states
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState(null);
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const [deactivatingEmployee, setDeactivatingEmployee] = useState(null);
  const [deletingEmployee, setDeletingEmployee] = useState(null);
  const [cancellingInvitation, setCancellingInvitation] = useState(null);
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

  const fetchPendingInvitations = useCallback(async () => {
    setPendingLoading(true);
    try {
      const response = await employeesAPI.getPendingInvitations();
      setPendingInvitations(response.data?.results || []);
    } catch (err) {
      console.error('Failed to load pending invitations:', err);
    } finally {
      setPendingLoading(false);
    }
  }, []);

  const handleResendInvitation = async (userId, email) => {
    try {
      await employeesAPI.resendInvitation(userId);
      toast.success(t('employee.invitationResentTo', { email }));
    } catch (err) {
      toast.error(err.response?.data?.error || t('employee.failedToResendInvitation'));
    }
  };

  const handleCancelInvitation = async () => {
    if (!cancellingInvitation) return;
    setActionLoading(true);
    try {
      await employeesAPI.cancelInvitation(cancellingInvitation.id);
      toast.success(t('employee.invitationCancelled'));
      setCancellingInvitation(null);
      fetchPendingInvitations();
    } catch (err) {
      toast.error(err.response?.data?.error || t('employee.failedToCancelInvitation'));
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
    fetchPendingInvitations();
  }, [fetchEmployees, fetchPendingInvitations]);

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
    const newStatus = !deactivatingEmployee.is_active;
    try {
      await companiesAPI.updateUser(companyId, deactivatingEmployee.id, { is_active: newStatus });
      toast.success(newStatus ? t('employee.employeeActivated') : t('employee.employeeDeactivated'));
      setDeactivatingEmployee(null);
      fetchEmployees();
    } catch (err) {
      const message = err.response?.data?.detail || t('employee.failedToUpdateStatus');
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEmployee = async () => {
    if (!deletingEmployee) return;
    setActionLoading(true);
    try {
      await companiesAPI.removeUser(companyId, deletingEmployee.id);
      toast.success(t('employee.employeeDeleted', { name: `${deletingEmployee.first_name} ${deletingEmployee.last_name}` }));
      setDeletingEmployee(null);
      fetchEmployees();
    } catch (err) {
      toast.error(err.response?.data?.detail || t('employee.failedToDeleteEmployee'));
    } finally {
      setActionLoading(false);
    }
  };

  const handleExport = () => {
    if (employees.length === 0) {
      toast.error(t('employee.noEmployeesToExport'));
      return;
    }

    const headers = ['First Name', 'Last Name', 'Email', 'Role', 'Status', 'Risk Score'];
    const rows = employees.map(emp => [
      emp.first_name || '',
      emp.last_name || '',
      emp.email || '',
      emp.role || '',
      emp.is_active ? 'Active' : 'Inactive',
      emp.risk_score?.score ?? 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    toast.success(t('employee.exportedCount', { count: employees.length }));
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('employee.loadingLabel')}</p>
        </div>
      </div>
    );
  }

  if (error && employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchEmployees} className="btn-primary flex items-center gap-2">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('employee.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('employee.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowInviteModal(true)}
            className="btn-primary flex items-center gap-2"
          >
            <UserPlus className="h-4 w-4" />
            {t('employee.inviteEmployee')}
          </button>
          <button onClick={handleExport} className="btn-secondary flex items-center gap-2">
            <Download className="h-4 w-4" />
            {t('employee.export')}
          </button>
          <button onClick={fetchEmployees} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            {t('admin.common.refresh')}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('employees')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'employees'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          )}
        >
          <Users className="h-4 w-4" />
          {t('employee.activeEmployees')}
          <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
            {employees.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('pending')}
          className={clsx(
            'flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            activeTab === 'pending'
              ? 'border-warning-500 text-warning-600'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
          )}
        >
          <Clock className="h-4 w-4" />
          {t('employee.pendingInvitations')}
          {pendingInvitations.length > 0 && (
            <span className="bg-warning-100 text-warning-700 text-xs font-medium px-2 py-0.5 rounded-full">
              {pendingInvitations.length}
            </span>
          )}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Users}
          label={t('employee.totalEmployees')}
          value={stats.total}
          color="primary"
        />
        <StatCard
          icon={UserCheck}
          label={t('employee.activeEmployees')}
          value={stats.active}
          color="success"
        />
        <StatCard
          icon={AlertTriangle}
          label={t('employee.highRisk')}
          value={stats.highRisk}
          color="danger"
          subtext={t('employee.scoreAbove70')}
        />
        <StatCard
          icon={Shield}
          label={t('employee.avgRiskScore')}
          value={stats.avgRisk}
          color={stats.avgRisk <= 30 ? 'success' : stats.avgRisk <= 70 ? 'warning' : 'danger'}
        />
      </div>

      {/* ── Active Employees Tab ── */}
      {activeTab === 'employees' && <>
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('employee.searchPlaceholder')}
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
              {statusFilter === 'ALL' ? t('employee.allStatus') : statusFilter === 'ACTIVE' ? t('employee.statusActive') : t('employee.statusInactive')}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-1 z-20">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <button
                    key={status}
                    onClick={() => { setStatusFilter(status); setShowFilterMenu(false); setCurrentPage(1); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                      statusFilter === status && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    {status === 'ALL' ? t('employee.allStatus') : status === 'ACTIVE' ? t('employee.statusActive') : t('employee.statusInactive')}
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
            <thead className="bg-gray-50 dark:bg-gray-700 border-b">
              <tr>
                <th className="w-12 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedEmployees.size === paginatedEmployees.length && paginatedEmployees.length > 0}
                    onChange={toggleSelectAll}
                    className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600"
                  />
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('first_name')}
                >
                  <div className="flex items-center gap-1">
                    {t('employee.colName')}
                    <SortIndicator column="first_name" />
                  </div>
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colEmail')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colRole')}
                </th>
                <th
                  className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                  onClick={() => handleSort('risk_score')}
                >
                  <div className="flex items-center gap-1">
                    {t('employee.colRiskScore')}
                    <SortIndicator column="risk_score" />
                  </div>
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colQuizzes')}
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colTraining')}
                </th>
                <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colBadges')}
                </th>
                <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colStatus')}
                </th>
                <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  {t('employee.colActions')}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {paginatedEmployees.length > 0 ? (
                paginatedEmployees.map((employee) => {
                  const riskConfig = getRiskConfig(employee.risk_score?.score || 0);
                  return (
                    <tr key={employee.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(employee.id)}
                          onChange={() => toggleSelectEmployee(employee.id)}
                          className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{employee.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('text-xs font-medium px-2 py-1 rounded-full', ROLE_CONFIG[employee.role]?.color)}>
                          {t(ROLE_CONFIG[employee.role]?.labelKey || 'employee.roleEmployee')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
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
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                        {employee.quizzes_completed || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                        {employee.trainings_completed || 0}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-300">
                        {employee.badges_earned || 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className={clsx(
                          'text-xs font-medium px-2 py-1 rounded-full',
                          employee.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                        )}>
                          {employee.is_active ? t('employee.statusActive') : t('employee.statusInactive')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end">
                          <DropdownMenu
                            trigger={<MoreVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
                            items={[
                              { icon: Eye, label: t('admin.common.viewDetails'), onClick: () => setViewingEmployee(employee) },
                              { icon: Edit2, label: t('common.edit'), onClick: () => setEditingEmployee(employee) },
                              { divider: true },
                              {
                                icon: employee.is_active ? UserX : UserCheck,
                                label: employee.is_active ? t('admin.common.deactivate') : t('admin.common.activate'),
                                onClick: () => setDeactivatingEmployee(employee),
                                danger: employee.is_active,
                              },
                              { divider: true },
                              {
                                icon: Trash2,
                                label: t('common.delete'),
                                onClick: () => setDeletingEmployee(employee),
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
                  <td colSpan={10} className="px-4 py-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('employee.noEmployeesFound')}</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {searchQuery || statusFilter !== 'ALL'
                        ? t('employee.adjustFilters')
                        : t('employee.inviteToOrg')}
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
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {t('employee.showingResults', { from: ((currentPage - 1) * itemsPerPage) + 1, to: Math.min(currentPage * itemsPerPage, filteredAndSortedEmployees.length), total: filteredAndSortedEmployees.length })}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {t('employee.pageOf', { page: currentPage, total: totalPages })}
              </span>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>
      </>}

      {/* ── Pending Invitations Tab ── */}
      {activeTab === 'pending' && (
        <div className="card overflow-hidden">
          {pendingLoading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : pendingInvitations.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('employee.noPendingInvitations')}</h3>
              <p className="text-gray-500 dark:text-gray-400">{t('employee.allInvitationsNote')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b">
                  <tr>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.colName')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.colEmail')}</th>
                    <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.colInvited')}</th>
                    <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('employee.colActions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {pendingInvitations.map((inv) => (
                    <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-warning-100 flex items-center justify-center text-warning-600 font-medium text-sm">
                            {(inv.first_name?.[0] || inv.email[0]).toUpperCase()}
                          </div>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {(inv.first_name || inv.last_name)
                              ? `${inv.first_name} ${inv.last_name}`.trim()
                              : '—'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{inv.email}</td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {inv.invitation_sent_at
                          ? formatDistanceToNow(new Date(inv.invitation_sent_at), { addSuffix: true })
                          : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleResendInvitation(inv.id, inv.email)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-primary-600 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                            {t('employee.resend')}
                          </button>
                          <button
                            onClick={() => setCancellingInvitation(inv)}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-danger-600 bg-danger-50 hover:bg-danger-100 rounded-lg transition-colors"
                          >
                            <X className="h-3.5 w-3.5" />
                            {t('common.cancel')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <InviteEmployeesModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        onSuccess={() => { fetchEmployees(); fetchPendingInvitations(); }}
      />

      <EditEmployeeModal
        isOpen={!!editingEmployee}
        onClose={() => setEditingEmployee(null)}
        employee={editingEmployee}
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
        title={deactivatingEmployee?.is_active ? t('employee.deactivateEmployee') : t('employee.activateEmployee')}
        message={
          deactivatingEmployee?.is_active
            ? t('employee.deactivateConfirm', { name: `${deactivatingEmployee?.first_name} ${deactivatingEmployee?.last_name}` })
            : t('employee.activateConfirm', { name: `${deactivatingEmployee?.first_name} ${deactivatingEmployee?.last_name}` })
        }
        confirmText={deactivatingEmployee?.is_active ? t('admin.common.deactivate') : t('admin.common.activate')}
        danger={deactivatingEmployee?.is_active}
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!cancellingInvitation}
        onClose={() => setCancellingInvitation(null)}
        onConfirm={handleCancelInvitation}
        title={t('employee.cancelInvitation')}
        message={t('employee.cancelInvitationConfirm', { email: cancellingInvitation?.email })}
        confirmText={t('employee.cancelInvitation')}
        danger
        loading={actionLoading}
      />

      <ConfirmDialog
        isOpen={!!deletingEmployee}
        onClose={() => setDeletingEmployee(null)}
        onConfirm={handleDeleteEmployee}
        title={t('employee.deleteEmployee')}
        message={t('employee.deleteEmployeeConfirm', { name: `${deletingEmployee?.first_name} ${deletingEmployee?.last_name}` })}
        confirmText={t('common.delete')}
        danger
        loading={actionLoading}
      />
    </div>
  );
}

export default CompanyEmployees;
