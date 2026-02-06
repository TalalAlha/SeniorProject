import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  Plus,
  Search,
  Target,
  Calendar,
  Users,
  MoreVertical,
  Edit2,
  Trash2,
  Play,
  Pause,
  UserPlus,
  BarChart3,
  RefreshCw,
  AlertCircle,
  X,
  Check,
  Mail,
  Filter,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { campaignsAPI, employeesAPI } from '../../api';
import { useAuth } from '../../contexts';

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: Edit2 },
  ACTIVE: { label: 'Active', color: 'bg-success-50 text-success-700', icon: Play },
  PAUSED: { label: 'Paused', color: 'bg-warning-50 text-warning-700', icon: Pause },
  COMPLETED: { label: 'Completed', color: 'bg-primary-50 text-primary-700', icon: Check },
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

// Create/Edit Campaign Modal
function CampaignFormModal({ isOpen, onClose, campaign, onSuccess }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    num_emails: 10,
    phishing_ratio: 0.5,
  });

  useEffect(() => {
    if (campaign) {
      setFormData({
        name: campaign.name || '',
        description: campaign.description || '',
        num_emails: campaign.num_emails || 10,
        phishing_ratio: campaign.phishing_ratio || 0.5,
      });
    } else {
      setFormData({ name: '', description: '', num_emails: 10, phishing_ratio: 0.5 });
    }
  }, [campaign, isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        ...formData,
        ...(!campaign && user?.company ? { company: user.company } : {}),
      };

      if (campaign) {
        await campaignsAPI.update(campaign.id, payload);
        toast.success('Campaign updated successfully');
      } else {
        await campaignsAPI.create(payload);
        toast.success('Campaign created successfully');
      }
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to save campaign';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const phishingCount = Math.round(formData.num_emails * formData.phishing_ratio);
  const legitimateCount = formData.num_emails - phishingCount;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={campaign ? 'Edit Campaign' : 'Create Campaign'} size="md">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Campaign Name */}
        <div>
          <label className="label">Campaign Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="input"
            placeholder="e.g., Q1 Security Awareness"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="label">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            className="input min-h-[80px] resize-y"
            placeholder="Brief description of this campaign's purpose"
            rows={3}
          />
        </div>

        {/* Number of Emails */}
        <div>
          <label className="label">Number of Emails</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="5"
              max="20"
              value={formData.num_emails}
              onChange={(e) => setFormData({ ...formData, num_emails: parseInt(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="w-12 text-center font-medium text-gray-900">{formData.num_emails}</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Total emails to be sent per employee</p>
        </div>

        {/* Phishing Ratio */}
        <div>
          <label className="label">Phishing Ratio</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0.3"
              max="0.7"
              step="0.1"
              value={formData.phishing_ratio}
              onChange={(e) => setFormData({ ...formData, phishing_ratio: parseFloat(e.target.value) })}
              className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
            />
            <span className="w-12 text-center font-medium text-gray-900">{Math.round(formData.phishing_ratio * 100)}%</span>
          </div>
          <p className="text-sm text-gray-500 mt-1">Percentage of phishing emails vs legitimate emails</p>
        </div>

        {/* Preview */}
        <div className="p-4 bg-gray-50 rounded-lg">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Campaign Preview</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-danger-100 rounded-lg">
                <Mail className="h-5 w-5 text-danger-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Phishing Emails</p>
                <p className="text-lg font-semibold text-danger-600">{phishingCount}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-success-50 rounded-lg">
                <Mail className="h-5 w-5 text-success-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Legitimate Emails</p>
                <p className="text-lg font-semibold text-success-600">{legitimateCount}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">
            Cancel
          </button>
          <button type="submit" disabled={loading} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {campaign ? 'Update Campaign' : 'Create Campaign'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

// Assign Employees Modal
function AssignEmployeesModal({ isOpen, onClose, campaign, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [assignedIds, setAssignedIds] = useState(new Set());
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen && campaign) {
      fetchEmployees();
    }
  }, [isOpen, campaign]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const [employeesRes, assignedRes] = await Promise.all([
        employeesAPI.list({ limit: 100 }),
        campaignsAPI.getAssignedEmployees(campaign.id).catch(() => ({ data: [] })),
      ]);

      const employeeList = employeesRes.data?.results || employeesRes.data || [];
      const assignedList = assignedRes.data?.results || assignedRes.data || [];

      setEmployees(employeeList);
      setAssignedIds(new Set(assignedList.map(e => e.id || e.employee_id)));
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployee = (id) => {
    const newSet = new Set(assignedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setAssignedIds(newSet);
  };

  const selectAll = () => {
    setAssignedIds(new Set(filteredEmployees.map(e => e.id)));
  };

  const deselectAll = () => {
    setAssignedIds(new Set());
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await campaignsAPI.assignEmployees(campaign.id, Array.from(assignedIds));
      toast.success(`Assigned ${assignedIds.size} employees to campaign`);
      onSuccess();
      onClose();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to assign employees';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Assign Employees - ${campaign?.name}`} size="lg">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-4">
          {/* Search and Actions */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="input pl-10"
              />
            </div>
            <button onClick={selectAll} className="btn-secondary text-sm">
              Select All
            </button>
            <button onClick={deselectAll} className="btn-secondary text-sm">
              Deselect All
            </button>
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700">
              <strong>{assignedIds.size}</strong> of {employees.length} employees selected
            </span>
          </div>

          {/* Employee List */}
          <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
            {filteredEmployees.length > 0 ? (
              filteredEmployees.map((employee) => (
                <label
                  key={employee.id}
                  className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={assignedIds.has(employee.id)}
                    onChange={() => toggleEmployee(employee.id)}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900">
                      {employee.first_name} {employee.last_name}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{employee.email}</p>
                  </div>
                  {employee.department && (
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                      {employee.department}
                    </span>
                  )}
                </label>
              ))
            ) : (
              <div className="p-8 text-center text-gray-500">
                <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                <p>No employees found</p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving || assignedIds.size === 0}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Assign {assignedIds.size} Employees
            </button>
          </div>
        </div>
      )}
    </Modal>
  );
}

// Campaign Card Component
function CampaignCard({ campaign, onEdit, onDelete, onActivate, onAssign }) {
  const { t } = useTranslation();
  const status = STATUS_CONFIG[campaign.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  const progress = campaign.total_assigned > 0
    ? Math.round((campaign.total_completed / campaign.total_assigned) * 100)
    : 0;

  const menuItems = [
    { icon: BarChart3, label: 'View Details', onClick: () => {} },
    { icon: Edit2, label: 'Edit', onClick: () => onEdit(campaign) },
    { icon: UserPlus, label: 'Assign Employees', onClick: () => onAssign(campaign) },
    { divider: true },
    campaign.status === 'DRAFT' && {
      icon: Play,
      label: 'Activate',
      onClick: () => onActivate(campaign),
    },
    campaign.status === 'ACTIVE' && {
      icon: Pause,
      label: 'Pause',
      onClick: () => onActivate(campaign),
    },
    { divider: true },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete(campaign), danger: true },
  ].filter(Boolean);

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary-100">
          <Target className="h-6 w-6 text-primary-600" />
        </div>
        <div className="flex items-center gap-2">
          <span className={clsx('inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full', status.color)}>
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
          <DropdownMenu
            trigger={<MoreVertical className="h-5 w-5 text-gray-400" />}
            items={menuItems}
          />
        </div>
      </div>

      <Link to={`/company/campaigns/${campaign.id}`} className="block">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {campaign.name}
        </h3>
      </Link>

      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
        <span className="flex items-center gap-1">
          <Users className="h-4 w-4" />
          {campaign.total_assigned || 0} assigned
        </span>
        <span className="flex items-center gap-1">
          <Mail className="h-4 w-4" />
          {campaign.num_emails || 0} emails
        </span>
      </div>

      {campaign.avg_score !== undefined && campaign.avg_score !== null && (
        <div className="flex items-center gap-2 text-sm mb-4">
          <span className="text-gray-500">Avg Score:</span>
          <span className={clsx(
            'font-medium',
            campaign.avg_score >= 70 ? 'text-success-600' : campaign.avg_score >= 50 ? 'text-warning-600' : 'text-danger-600'
          )}>
            {Math.round(campaign.avg_score)}%
          </span>
        </div>
      )}

      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">{t('training.progress')}</span>
          <span className="font-medium">{campaign.total_completed || 0}/{campaign.total_assigned || 0}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {campaign.created_at && (
        <p className="text-xs text-gray-400 mt-4">
          Created {formatDistanceToNow(new Date(campaign.created_at), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}

// Main Campaign List Component
function CampaignList() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [deletingCampaign, setDeletingCampaign] = useState(null);
  const [activatingCampaign, setActivatingCampaign] = useState(null);
  const [assigningCampaign, setAssigningCampaign] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (statusFilter !== 'ALL') {
        params.status = statusFilter;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await campaignsAPI.list(params);
      setCampaigns(response.data?.results || response.data || []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load campaigns';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async () => {
    if (!deletingCampaign) return;
    setActionLoading(true);
    try {
      await campaignsAPI.delete(deletingCampaign.id);
      toast.success('Campaign deleted successfully');
      setDeletingCampaign(null);
      fetchCampaigns();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete campaign';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActivate = async () => {
    if (!activatingCampaign) return;
    setActionLoading(true);
    try {
      if (activatingCampaign.status === 'ACTIVE') {
        await campaignsAPI.deactivate(activatingCampaign.id);
        toast.success('Campaign paused');
      } else {
        await campaignsAPI.activate(activatingCampaign.id);
        toast.success('Campaign activated');
      }
      setActivatingCampaign(null);
      fetchCampaigns();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to update campaign status';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredCampaigns = campaigns.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && campaigns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  if (error && campaigns.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchCampaigns} className="btn-primary flex items-center gap-2">
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
          <h1 className="text-2xl font-bold text-gray-900">{t('campaign.title')}</h1>
          <p className="text-gray-600 mt-1">Manage your security awareness campaigns</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchCampaigns} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('campaign.createCampaign')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder={`${t('common.search')} campaigns...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input pl-10"
          />
        </div>

        {/* Status Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="btn-secondary flex items-center gap-2 min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {statusFilter === 'ALL' ? 'All Status' : STATUS_CONFIG[statusFilter]?.label}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-20">
                <button
                  onClick={() => { setStatusFilter('ALL'); setShowFilterMenu(false); }}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50',
                    statusFilter === 'ALL' && 'bg-primary-50 text-primary-700'
                  )}
                >
                  All Status
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => { setStatusFilter(key); setShowFilterMenu(false); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2',
                      statusFilter === key && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    <config.icon className="h-4 w-4" />
                    {config.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Campaign Grid */}
      {filteredCampaigns.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <CampaignCard
              key={campaign.id}
              campaign={campaign}
              onEdit={(c) => setEditingCampaign(c)}
              onDelete={(c) => setDeletingCampaign(c)}
              onActivate={(c) => setActivatingCampaign(c)}
              onAssign={(c) => setAssigningCampaign(c)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first campaign'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Create Campaign
            </button>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <CampaignFormModal
        isOpen={showCreateModal || !!editingCampaign}
        onClose={() => {
          setShowCreateModal(false);
          setEditingCampaign(null);
        }}
        campaign={editingCampaign}
        onSuccess={fetchCampaigns}
      />

      {/* Assign Employees Modal */}
      <AssignEmployeesModal
        isOpen={!!assigningCampaign}
        onClose={() => setAssigningCampaign(null)}
        campaign={assigningCampaign}
        onSuccess={fetchCampaigns}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingCampaign}
        onClose={() => setDeletingCampaign(null)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${deletingCampaign?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
        loading={actionLoading}
      />

      {/* Activate Confirmation */}
      <ConfirmDialog
        isOpen={!!activatingCampaign}
        onClose={() => setActivatingCampaign(null)}
        onConfirm={handleActivate}
        title={activatingCampaign?.status === 'ACTIVE' ? 'Pause Campaign' : 'Activate Campaign'}
        message={
          activatingCampaign?.status === 'ACTIVE'
            ? `Are you sure you want to pause "${activatingCampaign?.name}"?`
            : `Are you sure you want to activate "${activatingCampaign?.name}"? Emails will start being sent to assigned employees.`
        }
        confirmText={activatingCampaign?.status === 'ACTIVE' ? 'Pause' : 'Activate'}
        loading={actionLoading}
      />
    </div>
  );
}

export default CampaignList;
