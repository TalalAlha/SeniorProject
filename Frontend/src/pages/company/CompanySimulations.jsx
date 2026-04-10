/**
 * CompanySimulations — Phishing simulation management page (/company/simulations).
 *
 * Displays a list of all simulation campaigns for the company and allows admins to:
 *  - View simulation status (Draft / In Progress / Sent / Completed)
 *  - Launch a new simulation via a 3-step modal wizard:
 *      Step 1: Select a phishing email template
 *      Step 2: Choose target employees (individual or all, with optional admin inclusion)
 *      Step 3: Review summary and confirm launch
 *  - Send simulations immediately (triggers real email delivery via SendGrid)
 *  - Navigate to per-simulation analytics (/company/simulations/:id/analytics)
 *  - Delete simulations with confirmation
 *
 * Key behaviour:
 *  - Simulation emails are sent server-side via simulationsAPI.send(id)
 *  - After sending, status transitions from DRAFT → IN_PROGRESS
 *  - Analytics auto-refresh every 15 seconds on the analytics sub-page
 *
 * Data sources:
 *   GET    /api/v1/simulations/campaigns/        → simulation list
 *   GET    /api/v1/simulations/templates/        → available templates
 *   GET    /api/v1/employees/                    → employee list for targeting
 *   POST   /api/v1/simulations/campaigns/        → create simulation
 *   POST   /api/v1/simulations/campaigns/{id}/send/ → send emails
 *   DELETE /api/v1/simulations/campaigns/{id}/   → delete simulation
 *
 * Requires COMPANY_ADMIN role.
 */
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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

// Status configuration (labelKey for i18n)
const STATUS_CONFIG = {
  DRAFT: { labelKey: 'campaign.status.draft', color: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200', icon: FileText },
  READY: { labelKey: 'simulation.statusReady', color: 'bg-primary-50 text-primary-700', icon: Check },
  SCHEDULED: { labelKey: 'simulation.statusScheduled', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400', icon: Clock },
  SENT: { labelKey: 'simulation.statusSent', color: 'bg-warning-50 text-warning-700', icon: Send },
  IN_PROGRESS: { labelKey: 'simulation.statusInProgress', color: 'bg-warning-50 text-warning-700', icon: Play },
  ACTIVE: { labelKey: 'campaign.status.active', color: 'bg-success-50 text-success-700', icon: Play },
  COMPLETED: { labelKey: 'campaign.status.completed', color: 'bg-primary-100 text-primary-800', icon: CheckCircle },
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
function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, confirmText = 'Confirm', danger = false, loading = false }) {
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
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg transition-colors">
        {trigger}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-1 z-20">
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
    <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
      <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
        <p className="text-xl font-bold text-gray-900 dark:text-white">{value}</p>
        {subtext && <p className="text-xs text-gray-400 dark:text-gray-500">{subtext}</p>}
      </div>
    </div>
  );
}

// Create Simulation Modal - Multi-step
function CreateSimulationModal({ isOpen, onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const companyId = user?.company_id || user?.company;
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState(false);
  const [sentCount, setSentCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    template: null,
    target_all_employees: false,
    target_employee_ids: [],
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [includeAdmins, setIncludeAdmins] = useState(false);
  const [createdSimulation, setCreatedSimulation] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFormData({
        name: '',
        description: '',
        template: null,
        target_all_employees: false,
        target_employee_ids: [],
      });
      setCreatedSimulation(null);
      setSending(false);
      setSendSuccess(false);
      setSentCount(0);
      setErrorMessage('');
      setIncludeAdmins(false);
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
    // Only select from the currently visible (filtered-by-role) list
    const visibleIds = (includeAdmins ? employees : employees.filter(e => e.role === 'EMPLOYEE')).map(e => e.id);
    setFormData({
      ...formData,
      target_all_employees: !includeAdmins,
      target_employee_ids: visibleIds,
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
    const employeeOnlyIds = employees.filter(e => e.role === 'EMPLOYEE').map(e => e.id);
    setFormData({
      ...formData,
      target_all_employees: !includeAdmins && employeeOnlyIds.every(id => newIds.includes(id)) && newIds.every(id => employeeOnlyIds.includes(id)),
      target_employee_ids: newIds,
    });
  };

  const visibleEmployees = includeAdmins
    ? employees
    : employees.filter(e => e.role === 'EMPLOYEE');

  const filteredEmployees = visibleEmployees.filter(e =>
    `${e.first_name} ${e.last_name} ${e.email}`.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedTemplate = templates.find(t => t.id === formData.template);

  const handleCreate = async () => {
    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        company: companyId,
        template: formData.template,
        target_all_employees: formData.target_all_employees,
        target_employee_ids: formData.target_all_employees ? [] : formData.target_employee_ids,
      };
      const response = await simulationsAPI.create(payload);
      const newSimulation = response.data;
      setCreatedSimulation(newSimulation);
      setStep(4);
      setSending(true);

      // Automatically send emails
      try {
        const sendResponse = await simulationsAPI.send(newSimulation.id);
        const count = sendResponse.data?.emails_sent ?? sendResponse.data?.simulations_created ?? 0;
        setSentCount(count);
        setSendSuccess(true);
        onSuccess();
      } catch (sendErr) {
        const msg = sendErr.response?.data?.error || sendErr.response?.data?.detail || 'Failed to send emails';
        setErrorMessage(msg);
        setSendSuccess(false);
      } finally {
        setSending(false);
      }
    } catch (err) {
      const message = err.response?.data?.detail || err.response?.data?.name?.[0] || 'Failed to create simulation';
      toast.error(message);
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
                step >= s ? 'bg-primary-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
              )}
            >
              {step > s ? <Check className="h-4 w-4" /> : s}
            </div>
            {s < 4 && (
              <div className={clsx('w-12 h-1 mx-1', step > s ? 'bg-primary-600' : 'bg-gray-200 dark:bg-gray-600')} />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-center mb-6 text-sm text-gray-500 dark:text-gray-400">
        {step === 1 && 'Step 1: Basic Info'}
        {step === 2 && 'Step 2: Select Employees'}
        {step === 3 && 'Step 3: Review & Create'}
        {step === 4 && 'Step 4: Send Emails'}
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
            <label className="label">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="input min-h-[80px] resize-y"
              placeholder="Brief description of this simulation"
              rows={3}
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
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
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
                      <p className="font-medium text-gray-900 dark:text-white">{template.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{template.subject || template.description}</p>
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
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <FileText className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                    <p>{t('simulation.noTemplatesAvailable')}</p>
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
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
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

          {/* Include admins toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={includeAdmins}
              onChange={(e) => {
                setIncludeAdmins(e.target.checked);
                // Deselect any previously selected admins when hiding them
                if (!e.target.checked) {
                  const employeeIds = employees.filter(emp => emp.role === 'EMPLOYEE').map(emp => emp.id);
                  setFormData(prev => ({
                    ...prev,
                    target_employee_ids: prev.target_employee_ids.filter(id => employeeIds.includes(id)),
                  }));
                }
              }}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
            />
            Include admin users (for testing)
          </label>

          {/* Warning when admins are selected */}
          {includeAdmins && formData.target_employee_ids.some(id => employees.find(e => e.id === id)?.role !== 'EMPLOYEE') && (
            <div className="flex gap-2 p-3 bg-warning-50 border border-warning-200 rounded-lg text-sm text-warning-800">
              <AlertTriangle className="h-4 w-4 text-warning-600 flex-shrink-0 mt-0.5" />
              <span>{t('simulation.adminWarning')}</span>
            </div>
          )}

          {/* Selected Count */}
          <div className="flex items-center justify-between px-4 py-2 bg-primary-50 rounded-lg">
            <span className="text-sm text-primary-700">
              <strong>{formData.target_employee_ids.length}</strong> of {visibleEmployees.length} {includeAdmins ? 'users' : 'employees'} selected
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
                    className="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.target_employee_ids.includes(employee.id)}
                      onChange={() => toggleEmployee(employee.id)}
                      className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {employee.first_name} {employee.last_name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{employee.email}</p>
                    </div>
                    {employee.department && (
                      <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-600 dark:text-gray-300">
                        {employee.department}
                      </span>
                    )}
                  </label>
                ))
              ) : (
                <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                  <Users className="h-8 w-8 mx-auto mb-2 text-gray-300 dark:text-gray-500" />
                  <p>{t('employee.noEmployeesFound')}</p>
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
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Simulation Summary</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="font-medium">{formData.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Template</p>
                <p className="font-medium">{selectedTemplate?.name || 'N/A'}</p>
              </div>
              {formData.description && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">Description</p>
                  <p className="font-medium">{formData.description}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Target Employees</p>
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
              <h4 className="font-medium text-gray-900 dark:text-white mb-2">Template Preview</h4>
              <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                <p><span className="text-gray-400 dark:text-gray-500">Subject:</span> {selectedTemplate.subject}</p>
                {selectedTemplate.preview_text && (
                  <p className="text-gray-500 dark:text-gray-400 text-xs">{selectedTemplate.preview_text}</p>
                )}
              </div>
            </div>
          )}

          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 rounded-lg">
            <div className="flex gap-3">
              <Send className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">Emails will be sent automatically</p>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                  <li>{t('simulation.emailsSentNote1')}</li>
                  <li>{t('simulation.emailsSentNote2')}</li>
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

      {/* Step 4: Auto Send */}
      {step === 4 && (
        <div className="text-center py-8">
          {sending ? (
            <div>
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Sending Emails...</h3>
              <p className="text-gray-500 dark:text-gray-400">Please wait while we send phishing emails to employees</p>
            </div>
          ) : sendSuccess ? (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-success-50 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-success-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-success-700 mb-2">Simulation Launched!</h3>
                <p className="text-gray-600 dark:text-gray-300">
                  {sentCount > 0 ? `Emails sent to ${sentCount} employee${sentCount !== 1 ? 's' : ''}` : 'Emails are being delivered to employees'}
                </p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => { onClose(); navigate(`/company/simulations/${createdSimulation?.id}/analytics`); }}
                  className="btn-primary flex items-center gap-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </button>
                <button onClick={handleFinish} className="btn-secondary">
                  Back to List
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="w-20 h-20 bg-danger-50 rounded-full flex items-center justify-center mx-auto">
                <AlertCircle className="w-10 h-10 text-danger-600" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-danger-700 mb-2">Launch Failed</h3>
                <p className="text-gray-600 dark:text-gray-300">{errorMessage || 'Failed to send emails. Please try again.'}</p>
              </div>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={async () => {
                    if (!createdSimulation) return;
                    setSending(true);
                    setErrorMessage('');
                    try {
                      const sendResponse = await simulationsAPI.send(createdSimulation.id);
                      const count = sendResponse.data?.emails_sent ?? sendResponse.data?.simulations_created ?? 0;
                      setSentCount(count);
                      setSendSuccess(true);
                      onSuccess();
                    } catch (sendErr) {
                      const msg = sendErr.response?.data?.error || sendErr.response?.data?.detail || 'Failed to send emails';
                      setErrorMessage(msg);
                    } finally {
                      setSending(false);
                    }
                  }}
                  className="btn-primary"
                >
                  Retry
                </button>
                <button onClick={handleFinish} className="btn-secondary">
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// Simulation Details Modal
function SimulationDetailsModal({ isOpen, onClose, simulation, onRefresh }) {
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const [employeeResults, setEmployeeResults] = useState([]);
  const [markingAsSent, setMarkingAsSent] = useState(false);

  useEffect(() => {
    if (isOpen && simulation) {
      fetchData();
    }
  }, [isOpen, simulation]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, resultsRes] = await Promise.all([
        simulationsAPI.getAnalytics(simulation.id).catch(() => ({ data: null })),
        simulationsAPI.getResults(simulation.id).catch(() => ({ data: null })),
      ]);
      setAnalytics(analyticsRes.data);
      setEmployeeResults(resultsRes.data?.results || []);
    } catch (err) {
      setAnalytics(null);
      setEmployeeResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPackage = async () => {
    setDownloading(true);
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
      setDownloading(false);
    }
  };

  const handleMarkAsSent = async () => {
    setMarkingAsSent(true);
    try {
      await simulationsAPI.markSent(simulation.id);
      toast.success('Simulation marked as sent');
      fetchData();
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

  const clickRate = simulation.click_rate != null ? simulation.click_rate / 100 : (simulation.total_sent > 0 ? simulation.total_clicked / simulation.total_sent : 0);

  const canMarkSent = ['DRAFT', 'READY', 'SCHEDULED'].includes(simulation.status);
  const canDownload = ['DRAFT', 'READY', 'SCHEDULED'].includes(simulation.status);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={simulation.name} size="full">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className={clsx('inline-flex items-center gap-1 text-sm font-medium px-3 py-1 rounded-full', status.color)}>
                <StatusIcon className="h-4 w-4" />
                {status.label}
              </span>
              {(simulation.template_name || simulation.template?.name) && (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  Template: <strong>{simulation.template_name || simulation.template?.name}</strong>
                </span>
              )}
            </div>
            <div className="flex gap-2">
              {canDownload && (
                <button
                  onClick={handleDownloadPackage}
                  disabled={downloading}
                  className="btn-secondary flex items-center gap-2"
                >
                  {downloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  {downloading ? 'Downloading...' : 'Download Package'}
                </button>
              )}
              {canMarkSent && (
                <button
                  onClick={handleMarkAsSent}
                  disabled={markingAsSent}
                  className="btn-primary flex items-center gap-2"
                >
                  {markingAsSent ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  Mark as Sent
                </button>
              )}
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              icon={Send}
              label="Total Sent"
              value={simulation.total_sent || 0}
              color="primary"
            />
            <StatCard
              icon={MousePointer}
              label="Clicked"
              value={simulation.total_clicked || 0}
              color={clickRate > 0.3 ? 'danger' : clickRate > 0.1 ? 'warning' : 'success'}
              subtext={`${(clickRate * 100).toFixed(1)}% rate`}
            />
          </div>

          {/* Rate Visualization */}
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-4">Performance Overview</h4>
            <div className="space-y-4">
              {/* Click Rate Bar */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-300">Click Rate (Lower is better)</span>
                  <span className={clsx(
                    'font-medium',
                    clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
                  )}>
                    {(clickRate * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                  <div
                    className={clsx(
                      'h-2 rounded-full transition-all duration-300',
                      clickRate > 0.3 ? 'bg-danger-500' : clickRate > 0.1 ? 'bg-warning-500' : 'bg-success-500'
                    )}
                    style={{ width: `${Math.min(clickRate * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Employee Results Table */}
          {employeeResults.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-3">
                Employee Results ({employeeResults.length})
              </h4>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Employee
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Clicked
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Risk
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Last Activity
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {employeeResults.map((result) => {
                        const lastActivity = result.clicked_at || result.sent_at;
                        const riskColors = {
                          LOW: 'bg-success-50 text-success-700',
                          MEDIUM: 'bg-warning-50 text-warning-700',
                          HIGH: 'bg-orange-50 text-orange-700 dark:text-orange-400',
                          CRITICAL: 'bg-danger-50 text-danger-700',
                        };
                        const statusColors = {
                          SENT: 'bg-success-50 text-success-700',
                          PENDING: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
                          DELIVERED: 'bg-primary-50 text-primary-700',
                          FAILED: 'bg-danger-50 text-danger-700',
                        };
                        return (
                          <tr key={result.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {result.employee_name || 'Unknown'}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{result.employee_email}</p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={clsx(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                statusColors[result.email_status] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              )}>
                                {result.email_status}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {result.was_clicked ? (
                                <AlertTriangle className="h-5 w-5 text-danger-600 mx-auto" />
                              ) : (
                                <span className="text-gray-300 dark:text-gray-500">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={clsx(
                                'text-xs font-medium px-2 py-0.5 rounded-full',
                                riskColors[result.risk_level] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              )}>
                                {result.risk_level}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                              {lastActivity
                                ? formatDistanceToNow(new Date(lastActivity), { addSuffix: true })
                                : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Created/Updated Info */}
          <div className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t">
            Created {simulation.created_at && formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
          </div>
        </div>
      )}
    </Modal>
  );
}

// Simulation Card Component
function SimulationCard({ simulation, onView, onDelete, onDownload, onMarkSent, onAnalytics }) {
  const { t } = useTranslation();
  const status = STATUS_CONFIG[simulation.status] || STATUS_CONFIG.DRAFT;
  const StatusIcon = status.icon;

  const clickRate = simulation.click_rate != null ? simulation.click_rate / 100 : (simulation.total_sent > 0 ? simulation.total_clicked / simulation.total_sent : 0);

  const canViewAnalytics = ['IN_PROGRESS', 'COMPLETED', 'PAUSED'].includes(simulation.status);

  const menuItems = [
    { icon: Eye, label: t('common.view'), onClick: () => onView(simulation) },
    canViewAnalytics && { icon: BarChart3, label: t('simulation.viewAnalytics'), onClick: () => onAnalytics(simulation.id) },
    { icon: Download, label: t('simulation.generatePackage'), onClick: () => onDownload(simulation.id) },
    ['DRAFT', 'READY', 'SCHEDULED'].includes(simulation.status) && {
      icon: Send,
      label: t('simulation.statusSent'),
      onClick: () => onMarkSent(simulation.id),
    },
    { divider: true },
    { icon: Trash2, label: t('common.delete'), onClick: () => onDelete(simulation.id), danger: true },
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
            {t(status.labelKey)}
          </span>
          <DropdownMenu
            trigger={<MoreVertical className="h-5 w-5 text-gray-400 dark:text-gray-500" />}
            items={menuItems}
          />
        </div>
      </div>

      <button onClick={() => onView(simulation)} className="block text-left w-full">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors">
          {simulation.name}
        </h3>
      </button>

      {(simulation.template_name || simulation.template?.name) && (
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('simulation.template')}: {simulation.template_name || simulation.template?.name}
        </p>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Send className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-600 dark:text-gray-300">{simulation.total_sent || 0} {t('simulation.sent')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <MousePointer className={clsx(
            'h-4 w-4',
            clickRate > 0.3 ? 'text-danger-500' : clickRate > 0.1 ? 'text-warning-500' : 'text-success-500'
          )} />
          <span className={clsx(
            clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
          )}>
            {simulation.total_clicked || 0} {t('simulation.clicked')}
          </span>
        </div>
      </div>

      {/* Rates */}
      {simulation.total_sent > 0 && (
        <div className="flex gap-4 text-xs pt-3 border-t">
          <div>
            <span className="text-gray-400 dark:text-gray-500">{t('dashboard.clickRate')}: </span>
            <span className={clsx(
              'font-medium',
              clickRate > 0.3 ? 'text-danger-600' : clickRate > 0.1 ? 'text-warning-600' : 'text-success-600'
            )}>
              {(clickRate * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      )}

      {/* View Analytics CTA for active/completed simulations */}
      {canViewAnalytics && (
        <button
          onClick={() => onAnalytics(simulation.id)}
          className="mt-4 w-full btn-primary flex items-center justify-center gap-2 text-sm py-2"
        >
          <BarChart3 className="h-4 w-4" />
          {t('simulation.viewAnalytics')}
        </button>
      )}

      {simulation.created_at && !canViewAnalytics && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-4">
          Created {formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
        </p>
      )}
      {simulation.created_at && canViewAnalytics && (
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
          Created {formatDistanceToNow(new Date(simulation.created_at), { addSuffix: true })}
        </p>
      )}
    </div>
  );
}

// Main Component
function CompanySimulations() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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

  const handleDownload = async (simulationId) => {
    try {
      const response = await simulationsAPI.generatePackage(simulationId);
      const blob = new Blob([response.data], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `simulation-${simulationId}-package.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('Email package downloaded');
    } catch (err) {
      toast.error('Failed to download package');
    }
  };

  const handleMarkSent = async (simulationId) => {
    try {
      await simulationsAPI.markSent(simulationId);
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">Loading simulations...</p>
        </div>
      </div>
    );
  }

  if (error && simulations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchSimulations} className="btn-primary flex items-center gap-2">
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('simulation.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('simulation.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchSimulations} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            {t('admin.common.refresh')}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn-primary flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {t('simulation.createSimulation')}
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('simulation.searchPlaceholder')}
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
              {statusFilter === 'ALL' ? t('simulation.allStatus') : t(STATUS_CONFIG[statusFilter]?.labelKey)}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute right-0 mt-1 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={() => { setStatusFilter('ALL'); setShowFilterMenu(false); }}
                  className={clsx(
                    'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                    statusFilter === 'ALL' && 'bg-primary-50 text-primary-700'
                  )}
                >
                  {t('simulation.allStatus')}
                </button>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => { setStatusFilter(key); setShowFilterMenu(false); }}
                    className={clsx(
                      'w-full px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2',
                      statusFilter === key && 'bg-primary-50 text-primary-700'
                    )}
                  >
                    <config.icon className="h-4 w-4" />
                    {t(config.labelKey)}
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
              onDelete={(id) => setDeletingSimulation(simulations.find(s => s.id === id))}
              onDownload={handleDownload}
              onMarkSent={handleMarkSent}
              onAnalytics={(id) => navigate(`/company/simulations/${id}/analytics`)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Mail className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('simulation.noSimulations')}</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchQuery || statusFilter !== 'ALL'
              ? t('simulation.adjustFilters')
              : t('simulation.getStarted')}
          </p>
          {!searchQuery && statusFilter === 'ALL' && (
            <button onClick={() => setShowCreateModal(true)} className="btn-primary">
              <Plus className="h-5 w-5 mr-2" />
              {t('simulation.createSimulation')}
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
        title={t('simulation.deleteSimulation')}
        message={t('simulation.deleteConfirm', { name: deletingSimulation?.name })}
        confirmText="Delete"
        danger
        loading={actionLoading}
      />
    </div>
  );
}

export default CompanySimulations;
