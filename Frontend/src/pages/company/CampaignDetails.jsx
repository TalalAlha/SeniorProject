import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Users,
  Calendar,
  Target,
  BarChart3,
  Play,
  Pause,
  Edit2,
  Trash2,
  UserPlus,
  RefreshCw,
  AlertCircle,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Download,
  MoreVertical,
  X,
  Loader2,
  Search,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { campaignsAPI, companiesAPI } from '../../api';
import { useAuth } from '../../contexts';

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit2 },
  ACTIVE: { label: 'Active', color: 'bg-success-50 text-success-700', icon: Play },
  PAUSED: { label: 'Paused', color: 'bg-warning-50 text-warning-700', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-primary-50 text-primary-700', icon: CheckCircle },
};

// Employee quiz status
const QUIZ_STATUS = {
  NOT_STARTED: { label: 'Not Started', color: 'bg-gray-100 text-gray-600', icon: Clock },
  IN_PROGRESS: { label: 'In Progress', color: 'bg-warning-50 text-warning-600', icon: Clock },
  COMPLETED: { label: 'Completed', color: 'bg-success-50 text-success-600', icon: CheckCircle },
  FAILED: { label: 'Failed', color: 'bg-danger-50 text-danger-600', icon: XCircle },
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
          <div className="p-6">{children}</div>
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

// Stat Card
function StatCard({ title, value, subtitle, icon: Icon, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="p-4 bg-white rounded-lg border border-gray-200">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
        </div>
        <div className={clsx('p-2 rounded-lg', colorClasses[color])}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

// Assign Employees Modal
function AssignEmployeesModal({ isOpen, onClose, campaign, onSuccess, alreadyAssignedIds = new Set() }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  const companyId = user?.company_id || user?.company;

  useEffect(() => {
    if (isOpen && campaign && companyId) {
      setAssignedIds(new Set());
      fetchEmployees();
    }
  }, [isOpen, campaign, companyId]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const employeesRes = await companiesAPI.getUsers(companyId, { limit: 100 });
      const employeeList = employeesRes.data?.results || employeesRes.data || [];
      setEmployees(employeeList);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id) => {
    if (alreadyAssignedIds.has(id)) return;
    const newSet = new Set(assignedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAssignedIds(newSet);
  };

  const handleSave = async () => {
    if (assignedIds.size === 0) {
      toast.error('Select at least one employee to assign');
      return;
    }
    setSaving(true);
    try {
      await campaignsAPI.assignEmployees(campaign.id, Array.from(assignedIds));
      toast.success(`Assigned ${assignedIds.size} employee(s) to campaign`);
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to assign employees');
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectableFiltered = filteredEmployees.filter(e => !alreadyAssignedIds.has(e.id));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Assign Employees" size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input pl-10"
            />
          </div>

          <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700">
              <strong>{assignedIds.size}</strong> new employee(s) selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setAssignedIds(new Set(selectableFiltered.map(e => e.id)))}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Select All
              </button>
              <button
                onClick={() => setAssignedIds(new Set())}
                className="text-sm text-primary-600 hover:text-primary-700"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
            {filteredEmployees.map((employee) => {
              const isAlready = alreadyAssignedIds.has(employee.id);
              return (
                <label
                  key={employee.id}
                  className={clsx(
                    'flex items-center gap-4 p-4',
                    isAlready
                      ? 'bg-gray-50 opacity-60 cursor-not-allowed'
                      : 'hover:bg-gray-50 cursor-pointer'
                  )}
                >
                  <input
                    type="checkbox"
                    checked={isAlready || assignedIds.has(employee.id)}
                    disabled={isAlready}
                    onChange={() => toggleEmployee(employee.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <div className="flex-1 min-w-0">
                    <p className={clsx('font-medium', isAlready ? 'text-gray-400' : 'text-gray-900')}>
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                  </div>
                  {isAlready && (
                    <span className="shrink-0 text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                      Already Assigned
                    </span>
                  )}
                </label>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={handleSave}
              disabled={saving || assignedIds.size === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign ({assignedIds.size})
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Edit Campaign Modal
function EditCampaignModal({ isOpen, onClose, campaign, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    num_emails: 10,
    phishing_ratio: 0.5,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        num_emails: campaign.num_emails || 10,
        phishing_ratio: campaign.phishing_ratio || 0.5,
      });
    }
  }, [campaign]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await campaignsAPI.update(campaign.id, formData);
      toast.success('Campaign updated successfully');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to update campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Campaign" size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="label">Campaign Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            required
          />
        </div>

        <div>
          <label className="label">Number of Emails: {formData.num_emails}</label>
          <input
            type="range"
            min="5"
            max="20"
            value={formData.num_emails}
            onChange={(e) => setFormData({ ...formData, num_emails: parseInt(e.target.value) })}
            className="w-full"
            disabled={campaign?.status === 'ACTIVE'}
          />
        </div>

        <div>
          <label className="label">Phishing Ratio: {Math.round(formData.phishing_ratio * 100)}%</label>
          <input
            type="range"
            min="0.3"
            max="0.7"
            step="0.1"
            value={formData.phishing_ratio}
            onChange={(e) => setFormData({ ...formData, phishing_ratio: parseFloat(e.target.value) })}
            className="w-full"
            disabled={campaign?.status === 'ACTIVE'}
          />
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            Save Changes
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Main Component
function CampaignDetails() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [assignedEmployees, setAssignedEmployees] = useState([]);

  // Modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaignData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [campaignRes, statsRes, assignedRes] = await Promise.all([
        campaignsAPI.get(id),
        campaignsAPI.getStatistics(id).catch(() => ({ data: null })),
        campaignsAPI.getAssignedEmployees(id).catch(() => ({ data: [] })),
      ]);

      setCampaign(campaignRes.data);
      setStatistics(statsRes.data);

      const assigned = Array.isArray(assignedRes.data)
        ? assignedRes.data
        : (assignedRes.data?.results || []);
      setAssignedEmployees(assigned);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load campaign';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCampaignData();
  }, [id]);

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await campaignsAPI.delete(id);
      toast.success('Campaign deleted');
      navigate('/company/campaigns');
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to delete campaign');
    } finally {
      setActionLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExport = () => {
    toast.success('Export functionality coming soon');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error || 'Campaign not found'}</p>
        <button onClick={() => navigate('/company/campaigns')} className="btn-primary">
          Back to Campaigns
        </button>
      </div>
    );
  }

  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  // Build set of already-assigned employee IDs for the modal
  const alreadyAssignedIds = new Set(assignedEmployees.map(e => e.employee_id || e.id));

  // Calculate statistics
  const totalAssigned = assignedEmployees.length || campaign.total_participants || 0;
  const totalCompleted = campaign.completed_participants || 0;
  const avgScore = campaign.average_score || statistics?.avg_score || 0;
  const completionRate = totalAssigned > 0 ? Math.round((totalCompleted / totalAssigned) * 100) : 0;

  return (
    <div className="fade-in space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/company/campaigns')}
        className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
      >
        <ArrowLeft className="h-5 w-5 mr-2" />
        {t('common.back')} to Campaigns
      </button>

      {/* Header Card */}
      <div className="card">
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-4 bg-primary-100 rounded-xl">
              <Target className="h-8 w-8 text-primary-600" />
            </div>
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-bold text-gray-900">{campaign.name}</h1>
                <span className={clsx('inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full', status.color)}>
                  <StatusIcon className="h-4 w-4" />
                  {status.label}
                </span>
              </div>
              <p className="text-gray-500">
                Created {campaign.created_at ? formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true }) : 'recently'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchCampaignData} className="btn-secondary flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Refresh
            </button>
            <button onClick={() => setShowEditModal(true)} className="btn-secondary flex items-center gap-2">
              <Edit2 className="h-4 w-4" />
              Edit
            </button>
            <button onClick={() => setShowAssignModal(true)} className="btn-secondary flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Assign
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete
            </button>
          </div>
        </div>

        {/* Campaign Config */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t">
          <div>
            <p className="text-sm text-gray-500">Total Emails</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <Mail className="h-5 w-5 text-primary-600" />
              {campaign.num_emails || 10}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Phishing Ratio</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <AlertTriangle className="h-5 w-5 text-warning-600" />
              {Math.round((campaign.phishing_ratio || 0.5) * 100)}%
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Assigned Employees</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <Users className="h-5 w-5 text-primary-600" />
              {totalAssigned}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Completion Rate</p>
            <p className="text-xl font-semibold text-gray-900 flex items-center gap-2 mt-1">
              <TrendingUp className="h-5 w-5 text-success-600" />
              {completionRate}%
            </p>
          </div>
        </div>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Assigned"
          value={totalAssigned}
          subtitle="employees"
          icon={Users}
          color="primary"
        />
        <StatCard
          title="Completed"
          value={totalCompleted}
          subtitle={`${completionRate}% completion`}
          icon={CheckCircle}
          color="success"
        />
        <StatCard
          title="Average Score"
          value={`${Math.round(avgScore)}%`}
          subtitle="across all quizzes"
          icon={BarChart3}
          color={avgScore >= 70 ? 'success' : avgScore >= 50 ? 'warning' : 'danger'}
        />
        <StatCard
          title="In Progress"
          value={totalAssigned - totalCompleted}
          subtitle="pending completion"
          icon={Clock}
          color="warning"
        />
      </div>

      {/* Employees Table */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">Assigned Employees</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAssignModal(true)} className="btn-secondary text-sm">
              <UserPlus className="h-4 w-4 mr-1" />
              Manage
            </button>
            <button onClick={handleExport} className="btn-secondary text-sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>

        {assignedEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Employee</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Score</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignedEmployees.map((employee) => {
                  const quizStatus = QUIZ_STATUS[employee.quiz_status] || QUIZ_STATUS.NOT_STARTED;
                  const QuizIcon = quizStatus.icon;
                  const progress = employee.progress || 0;
                  const score = employee.score;

                  return (
                    <tr key={employee.id || employee.employee_id} className="hover:bg-gray-50">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-sm">
                            {employee.first_name?.[0]}{employee.last_name?.[0]}
                          </div>
                          <span className="font-medium text-gray-900">
                            {employee.first_name} {employee.last_name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-gray-500">{employee.email}</td>
                      <td className="py-3 px-4">
                        <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', quizStatus.color)}>
                          <QuizIcon className="h-3 w-3" />
                          {quizStatus.label}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        {score !== undefined && score !== null ? (
                          <span className={clsx(
                            'font-medium',
                            score >= 70 ? 'text-success-600' : score >= 50 ? 'text-warning-600' : 'text-danger-600'
                          )}>
                            {Math.round(score)}%
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full"
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-500">{progress}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No employees assigned</h3>
            <p className="text-gray-500 mb-4">Assign employees to start tracking their progress</p>
            <button onClick={() => setShowAssignModal(true)} className="btn-primary">
              <UserPlus className="h-5 w-5 mr-2" />
              Assign Employees
            </button>
          </div>
        )}
      </div>

      {/* Statistics Card (if available) */}
      {statistics && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Campaign Analytics</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {statistics.question_stats && statistics.question_stats.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Question Performance</h3>
                <div className="space-y-2">
                  {statistics.question_stats.slice(0, 5).map((q, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600 truncate flex-1 mr-2">Q{idx + 1}</span>
                      <span className={clsx(
                        'font-medium',
                        q.accuracy >= 70 ? 'text-success-600' : q.accuracy >= 50 ? 'text-warning-600' : 'text-danger-600'
                      )}>
                        {Math.round(q.accuracy || 0)}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {statistics.completion_by_day && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-3">Completion Trend</h3>
                <p className="text-sm text-gray-500">Analytics visualization coming soon</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <EditCampaignModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        campaign={campaign}
        onSuccess={fetchCampaignData}
      />

      <AssignEmployeesModal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        campaign={campaign}
        onSuccess={fetchCampaignData}
        alreadyAssignedIds={alreadyAssignedIds}
      />

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${campaign.name}"? This action cannot be undone and will remove all associated data.`}
        confirmText="Delete"
        danger
        loading={actionLoading}
      />

    </div>
  );
}

export default CampaignDetails;
