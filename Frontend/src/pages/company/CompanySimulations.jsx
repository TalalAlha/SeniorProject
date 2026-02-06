import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Mail,
  Send,
  Download,
  MoreVertical,
  Trash2,
  Eye,
  CheckCircle,
  AlertTriangle,
  Flag,
  MousePointer,
  Users,
  RefreshCw,
  AlertCircle,
  X,
  ChevronRight,
  ChevronLeft,
  Filter,
  ChevronDown,
  Loader2,
  FileText,
  Check,
  Clock,
  Play,
  BarChart3,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { simulationsAPI, companiesAPI } from '../../api';
import { useAuth } from '../../contexts';

// Status configuration
const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-700', icon: FileText },
  READY: { label: 'Ready', color: 'bg-primary-50 text-primary-700', icon: Check },
  SENT: { label: 'Sent', color: 'bg-warning-50 text-warning-700', icon: Send },
  ACTIVE: { label: 'Active', color: 'bg-success-50 text-success-700', icon: Play },
  COMPLETED: { label: 'Completed', color: 'bg-primary-100 text-primary-800', icon: CheckCircle },
};

// Modal Component
function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
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
function StatCard({ icon: Icon, label, value, color = 'primary', subtext }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
      <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  );
}

// Create Simulation Modal - Multi-step
function CreateSimulationModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const companyId = user?.company_id || user?.company;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    template: null,
    target_all_employees: false,
    target_employee_ids: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [createdSimulation, setCreatedSimulation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        name: '',
        template: null,
        target_all_employees: false,
        target_employee_ids: [],
      });
      setCreatedSimulation(null);
      fetchTemplates();
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setLoadingTemplates(true);
    try {
      const response = await simulationsAPI.getTemplates();
      setTemplates(response.data?.results || response.data || []);
    } catch (err) {
      toast.error('Failed to load templates');
    } finally {
      setLoadingTemplates(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await companiesAPI.getUsers(companyId, { limit: 200 });
      setEmployees(response.data?.results || response.data || []);
    } catch (err) {
      toast.error('Failed to load employees');
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleSelectAllEmployees = () => {
    setFormData({
      ...formData,
      target_all_employees: true,
      target_employee_ids: employees.map(e => e.id),
    });
  };

  const handleDeselectAllEmployees = () => {
    setFormData({
      ...formData,
      target_all_employees: false,
      target_employee_ids: [],
    });
  };

  const toggleEmployee = (id) => {
    const newIds = formData.target_employee_ids.includes(id)
      ? formData.target_employee_ids.filter(i => i !== id)
      : [...formData.target_employee_ids, id];
    setFormData({
      ...formData,
      target_all_employees: newIds.length === employees.length,
      target_employee_ids: newIds,
    });
  };

  const filteredEmployees = employees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTemplate = templates.find(t => t.id === formData.template);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        template: formData.template,
        target_all_employees: formData.target_all_employees,
        target_employee_ids: formData.target_all_employees ? [] : formData.target_employee_ids,
      };
      const response = await simulationsAPI.create(payload);
      setCreatedSimulation(response.data);
      toast.success('Simulation created successfully');
      setStep(4); // Move to download step
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create simulation';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPackage = async () => {
    if (!createdSimulation) return;
    setLoading(true);
    try {
      const response = await simulationsAPI.generatePackage(createdSimulation.id);
      // Create blob and download
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${createdSimulation.id}-package.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Email package downloaded');
    } catch (err) {
      toast.error('Failed to download package');
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onSuccess();
    onClose();
  };

  const canProceedStep1 = formData.name.trim().length > 0 && formData.template;
  const canProceedStep2 = formData.target_employee_ids.length > 0 || formData.target_all_employees;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Phishing Simulation" size="lg">
      {/* Progress Steps */}
      <div className="flex items-center justify-center mb-8">
        {[1, 2, 3, 4].map((s) => (
          <div key={s} className="flex items-center">
            <div
              className={clsx(
                'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-600'
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div className={clsx('w-12 h-1 mx-1', step > s ? 'bg-primary-600' : 'bg-gray-200')} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mb-6 text-sm text-gray-500">
        {step === 1 && 'Step 1: Basic Info'}
        {step === 2 && 'Step 2: Select Employees'}
        {step === 3 && 'Step 3: Review & Create'}
        {step === 4 && 'Step 4: Download Package'}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <div className="space-y-6">
          <div>
            <label className="label">Simulation Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="input"
              placeholder="e.g., Q1 Phishing Test"
            />
          </div>

          <div>
            <label className="label">Email Template *</label>
            {loadingTemplates ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-primary-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3 max-h-64 overflow-y-auto">
                {templates.map((template) => (
                  <label
                    key={template.id}
                    className={clsx(
                      'flex items-start gap-4 p-4 border rounded-lg cursor-pointer transition-colors',
                      formData.template === template.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    )}
                  >
                    <input
                      type="radio"
                      name="template"
                      checked={formData.template === template.id}
                      onChange={() => setFormData({ ...formData, template: template.id })}
                      className="mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900">{template.name}</p>
                      <p className="text-sm text-gray-500 mt-1">{template.subject || template.description}</p>
                      {template.difficulty && (
                        <span className={clsx(
                          'inline-block mt-2 text-xs px-2 py-0.5 rounded-full',
                          template.difficulty === 'HARD' ? 'bg-danger-100 text-danger-700' :
                          template.difficulty === 'MEDIUM' ? 'bg-warning-100 text-warning-700' :
                          'bg-success-100 text-success-700'
                        )}>
                          {template.difficulty}
                        </span>
                      )}
                    </div>
                  </label>
                ))}
                {templates.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p>No templates available</p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button
              onClick={() => setStep(2)}
              disabled={!canProceedStep1}
              className="btn-primary flex-1 flex items-center justify-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Select Employees */}
      {step === 2 && (
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
            <button onClick={handleSelectAllEmployees} className="btn-secondary text-sm">
              Select All
            </button>
            <button onClick={handleDeselectAllEmployees} className="btn-secondary text-sm">
              Deselect All
            </button>
          </div>

          {/* Selected Count */}
          <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700">
              <strong>{formData.target_employee_ids.length}</strong> of {employees.length} employees selected
            </span>
          </div>

          {/* Employee List */}
          {loadingEmployees ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border rounded-lg divide-y">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map((employee) => (
                  <label
                    key={employee.id}
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.target_employee_ids.includes(employee.id)}
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
          )}

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setStep(1)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setStep(3)}
              disabled={!canProceedStep2}
              className="btn-primary flex items-center gap-2"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review & Create */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900">Simulation Summary</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-medium">{formData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Template</p>
                <p className="font-medium">{selectedTemplate?.name || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Target Employees</p>
                <p className="font-medium">
                  {formData.target_all_employees
                    ? `All employees (${employees.length})`
                    : `${formData.target_employee_ids.length} employees selected`}
                </p>
              </div>
            </div>
          </div>

          {selectedTemplate && (
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-900 mb-2">Template Preview</h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p><span className="text-gray-400">Subject:</span> {selectedTemplate.subject}</p>
                {selectedTemplate.preview_text && (
                  <p className="text-gray-500 text-xs">{selectedTemplate.preview_text}</p>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-warning-50 border border-warning-200 rounded-lg">
            <div className="flex gap-3">
              <AlertTriangle className="h-5 w-5 text-warning-600 flex-shrink-0" />
              <div className="text-sm text-warning-800">
                <p className="font-medium">Important Notes</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>A CSV package will be generated after creation</li>
                  <li>You'll need to send emails manually using your email system</li>
                  <li>Mark as "Sent" once emails are delivered</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <button onClick={() => setStep(2)} className="btn-secondary flex items-center gap-2">
              <ChevronLeft className="h-4 w-4" /> Back
            </button>
            <div className="flex-1" />
            <button
              onClick={handleCreate}
              disabled={loading}
              className="btn-primary flex items-center gap-2"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              Create Simulation
            </button>
          </div>
        </div>
      )}

      {/* Step 4: Download Package */}
      {step === 4 && (
        <div className="space-y-6 text-center">
          <div className="p-4 bg-success-50 rounded-full w-16 h-16 mx-auto flex items-center justify-center">
            <CheckCircle className="h-8 w-8 text-success-600" />
          </div>

          <div>
            <h3 className="text-lg font-semibold text-gray-900">Simulation Created!</h3>
            <p className="text-gray-500 mt-1">Download the email package to send to employees</p>
          </div>

          <button
            onClick={handleDownloadPackage}
            disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download Email Package (CSV)
          </button>

          <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg text-left">
            <h4 className="text-sm font-medium text-primary-800 mb-2">Next Steps:</h4>
            <ol className="text-sm text-primary-700 space-y-1 list-decimal list-inside">
              <li>Import the CSV into your email sending system</li>
              <li>Send emails to the listed recipients</li>
              <li>Return here and mark the simulation as "Sent"</li>
              <li>Monitor results as employees interact with the emails</li>
            </ol>
          </div>

          <button onClick={handleFinish} className="btn-secondary w-full">
            Done
          </button>
        </div>
      )}
    </Modal>
  );
}

// Simulation Details Modal
function SimulationDetailsModal({ isOpen, onClose, simulation, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [markingAsSent, setMarkingAsSent] = useState(false);

  useEffect(() => {
    if (isOpen && simulation) {
      fetchAnalytics();
    }
  }, [isOpen, simulation]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await simulationsAPI.getAnalytics(simulation.id);
      setAnalytics(response.data);
    } catch (err) {
      // Analytics might not be available yet
      setAnalytics(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPackage = async () => {
    setLoading(true);
    try {
      const response = await simulationsAPI.generatePackage(simulation.id);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${simulation.id}-package.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Email package downloaded');
    } catch (err) {
      toast.error('Failed to download package');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsSent = async () => {
    setMarkingAsSent(true);
    try {
      await simulationsAPI.markSent(simulation.id);
      toast.success('Simulation marked as sent');
      onRefresh();
    } catch (err) {
      toast.error('Failed to update simulation');
    } finally {
      setMarkingAsSent(false);
    }
  };

  if (!simulation) return null;

  const status = STATUS_CONFIG[simulation.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  const clickRate = simulation.click_rate ?? (simulation.total_sent > 0 ? simulation.total_clicked / simulation.total_sent : 0);
  const reportRate = simulation.report_rate ?? (simulation.total_sent > 0 ? simulation.total_reported / simulation.total_sent : 0);
  const openRate = simulation.open_rate ?? (simulation.total_sent > 0 ? simulation.total_opened / simulation.total_sent : 0);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={simulation.name} size="xl">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className={clsx('inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full', status.color)}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
              {simulation.template && (
                <span className="text-sm text-gray-500">
                  Template: <strong>{simulation.template.name}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {simulation.status === 'DRAFT' || simulation.status === 'READY' ? (
                <>
                  <button
                    onClick={handleDownloadPackage}
                    disabled={loading}
                    className="btn-secondary flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    Download Package
                  </button>
                  <button
                    onClick={handleMarkAsSent}
                    disabled={markingAsSent}
                    className="btn-primary flex items-center gap-2"
                  >
                    {markingAsSent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                    Mark as Sent
                  </button>
                </>
              ) : null}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard
              icon={Send}
              label="Total Sent"
              value={simulation.total_sent || 0}
              color="primary"
            />
            <StatCard
              icon={Eye}
              label="Opened"
              value={simulation.total_opened || 0}
              color="primary"
              subtext={`${(openRate * 100).toFixed(1)}% rate`}
            />
            <StatCard
              icon={MousePointer}
              label="Clicked"
              value={simulation.total_clicked || 0}
              color={clickRate > 0.3 ? 'danger' : clickRate > 0.1 ? 'warning' : 'success'}
              subtext={`${(clickRate * 100).toFixed(1)}% rate`}
            />
            <StatCard
              icon={Flag}
              label="Reported"
              value={simulation.total_reported || 0}
              color={reportRate > 0.5 ? 'success' : reportRate > 0.2 ? 'warning' : 'danger'}
              subtext={`${(reportRate * 100).toFixed(1)}% rate`}
            />
          </div>

          {/* Rate Visualization */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 mb-4">Performance Overview</h4>
            <div className="space-y-4">
              {/* Click Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Click Rate (Lower is better)</span>
                  <span className={clsx(
                    'font-medium',
                    clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
                  )}>
                    {(clickRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-300',
                      clickRate > 0.3 ? 'bg-danger-500' : clickRate > 0.1 ? 'bg-warning-500' : 'bg-success-500'
                    )}
                    style={{ width: `${Math.min(clickRate * 100, 100)}%` }}
                  />
                </div>
              </div>

              {/* Report Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Report Rate (Higher is better)</span>
                  <span className={clsx(
                    'font-medium',
                    reportRate > 0.5 ? 'text-success-600' : reportRate > 0.2 ? 'text-warning-600' : 'text-danger-600'
                  )}>
                    {(reportRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-300',
                      reportRate > 0.5 ? 'bg-success-500' : reportRate > 0.2 ? 'bg-warning-500' : 'bg-danger-500'
                    )}
                    style={{ width: `${Math.min(reportRate * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Results Table */}
          {analytics?.employee_results && analytics.employee_results.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-3">Employee Results</h4>
              <div className="border rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Employee
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Opened
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Clicked
                      </th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Reported
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.employee_results.map((result, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {result.employee_name || result.email}
                            </p>
                            <p className="text-xs text-gray-500">{result.email}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.opened ? (
                            <CheckCircle className="h-5 w-5 text-success-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.clicked ? (
                            <AlertTriangle className="h-5 w-5 text-danger-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {result.reported ? (
                            <Flag className="h-5 w-5 text-success-600 mx-auto" />
                          ) : (
                            <span className="text-gray-300">-</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {result.last_activity
                            ? formatDistanceToNow(new Date(result.last_activity), { addSuffix: true })
                            : '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="text-xs text-gray-400 pt-4 border-t">
            Created {simulation.created_at && formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Simulation Card Component
function SimulationCard({ simulation, onView, onDelete, onDownload, onMarkSent }) {
  const status = STATUS_CONFIG[simulation.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  const clickRate = simulation.click_rate ?? (simulation.total_sent > 0 ? simulation.total_clicked / simulation.total_sent : 0);
  const reportRate = simulation.report_rate ?? (simulation.total_sent > 0 ? simulation.total_reported / simulation.total_sent : 0);

  const menuItems = [
    { icon: Eye, label: 'View Details', onClick: () => onView(simulation) },
    { icon: Download, label: 'Download Package', onClick: () => onDownload(simulation) },
    (simulation.status === 'DRAFT' || simulation.status === 'READY') && {
      icon: Send,
      label: 'Mark as Sent',
      onClick: () => onMarkSent(simulation),
    },
    { divider: true },
    { icon: Trash2, label: 'Delete', onClick: () => onDelete(simulation), danger: true },
  ].filter(Boolean);

  return (
    <div className="card group">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-lg bg-primary-100">
          <Mail className="h-6 w-6 text-primary-600" />
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

      <button onClick={() => onView(simulation)} className="block text-left w-full">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
          {simulation.name}
        </h3>
      </button>

      {simulation.template && (
        <p className="text-sm text-gray-500 mb-4">
          Template: {simulation.template.name}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Send className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{simulation.total_sent || 0} sent</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Eye className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{simulation.total_opened || 0} opened</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MousePointer className={clsx(
            'h-4 w-4',
            clickRate > 0.3 ? 'text-danger-500' : clickRate > 0.1 ? 'text-warning-500' : 'text-success-500'
          )} />
          <span className={clsx(
            clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
          )}>
            {simulation.total_clicked || 0} clicked
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <Flag className={clsx(
            'h-4 w-4',
            reportRate > 0.5 ? 'text-success-500' : reportRate > 0.2 ? 'text-warning-500' : 'text-gray-400'
          )} />
          <span className={clsx(
            reportRate > 0.5 ? 'text-success-600' : reportRate > 0.2 ? 'text-warning-600' : 'text-gray-600'
          )}>
            {simulation.total_reported || 0} reported
          </span>
        </div>
      </div>

      {/* Rates */}
      {simulation.total_sent > 0 && (
        <div className="flex gap-4 text-xs pt-3 border-t">
          <div>
            <span className="text-gray-400">Click Rate: </span>
            <span className={clsx(
              'font-medium',
              clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
            )}>
              {(clickRate * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-gray-400">Report Rate: </span>
            <span className={clsx(
              'font-medium',
              reportRate > 0.5 ? 'text-success-600' : reportRate > 0.2 ? 'text-warning-600' : 'text-danger-600'
            )}>
              {(reportRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {simulation.created_at && (
        <p className="text-xs text-gray-400 mt-4">
          Created {formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}

// Main Component
function CompanySimulations() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [simulations, setSimulations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [viewingSimulation, setViewingSimulation] = useState(null);
  const [deletingSimulation, setDeletingSimulation] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchSimulations = useCallback(async () => {
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

      const response = await simulationsAPI.list(params);
      setSimulations(response.data?.results || response.data || []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load simulations';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, searchQuery]);

  useEffect(() => {
    fetchSimulations();
  }, [fetchSimulations]);

  const handleDelete = async () => {
    if (!deletingSimulation) return;
    setActionLoading(true);
    try {
      await simulationsAPI.delete(deletingSimulation.id);
      toast.success('Simulation deleted successfully');
      setDeletingSimulation(null);
      fetchSimulations();
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to delete simulation';
      toast.error(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (simulation) => {
    try {
      const response = await simulationsAPI.generatePackage(simulation.id);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${simulation.id}-package.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Email package downloaded');
    } catch (err) {
      toast.error('Failed to download package');
    }
  };

  const handleMarkSent = async (simulation) => {
    try {
      await simulationsAPI.markSent(simulation.id);
      toast.success('Simulation marked as sent');
      fetchSimulations();
    } catch (err) {
      toast.error('Failed to update simulation');
    }
  };

  const filteredSimulations = simulations.filter((s) =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && simulations.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading simulations...</p>
        </div>
      </div>
    );
  }

  if (error && simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchSimulations} className="btn-primary flex items-center gap-2">
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
          <h1 className="text-2xl font-bold text-gray-900">Phishing Simulations</h1>
          <p className="text-gray-600 mt-1">Create and manage phishing email simulations</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSimulations} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            Refresh
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Create Simulation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search simulations..."
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

      {/* Simulation Grid */}
      {filteredSimulations.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSimulations.map((simulation) => (
            <SimulationCard
              key={simulation.id}
              simulation={simulation}
              onView={(s) => setViewingSimulation(s)}
              onDelete={(s) => setDeletingSimulation(s)}
              onDownload={handleDownload}
              onMarkSent={handleMarkSent}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No simulations found</h3>
          <p className="text-gray-500 mb-4">
            {searchQuery || statusFilter !== 'ALL'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first phishing simulation'}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              Create Simulation
            </button>
          )}
        </div>
      )}

      {/* Create Modal */}
      <CreateSimulationModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchSimulations}
      />

      {/* Details Modal */}
      <SimulationDetailsModal
        isOpen={!!viewingSimulation}
        onClose={() => setViewingSimulation(null)}
        simulation={viewingSimulation}
        onRefresh={fetchSimulations}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingSimulation}
        onClose={() => setDeletingSimulation(null)}
        onConfirm={handleDelete}
        title="Delete Simulation"
        message={`Are you sure you want to delete "${deletingSimulation?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        danger
        loading={actionLoading}
      />
    </div>
  );
}

export default CompanySimulations;
