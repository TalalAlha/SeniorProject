import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Users, Clock, CheckCircle, X, Calendar,
  RefreshCw, AlertCircle, Mail, Smartphone, Phone,
  UserPlus, Award,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { trainingAPI, companiesAPI } from '../../api';
import { useAuth } from '../../contexts';

const STATUS_COLORS = {
  ASSIGNED: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-primary-50 text-primary-700',
  COMPLETED: 'bg-success-50 text-success-700',
  PASSED: 'bg-success-50 text-success-700',
  FAILED: 'bg-danger-50 text-danger-700',
  EXPIRED: 'bg-gray-100 text-gray-500',
};

function TrainingManagement() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';
  const companyId = user?.company_id || user?.company;

  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Assign modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [dueDate, setDueDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [modulesRes, assignmentsRes] = await Promise.all([
        trainingAPI.getModules(),
        trainingAPI.getAssignments(),
      ]);
      setModules(modulesRes.data?.results || modulesRes.data || []);
      setAssignments(assignmentsRes.data?.results || assignmentsRes.data || []);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Failed to load training data';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'EMAIL_SECURITY':
        return <Mail className="h-6 w-6 text-blue-600" />;
      case 'MOBILE_SECURITY':
        return <Smartphone className="h-6 w-6 text-green-600" />;
      case 'SOCIAL_ENGINEERING':
        return <Phone className="h-6 w-6 text-purple-600" />;
      default:
        return <BookOpen className="h-6 w-6 text-primary-600" />;
    }
  };

  const getCategoryBg = (category) => {
    switch (category) {
      case 'EMAIL_SECURITY': return 'bg-blue-50';
      case 'MOBILE_SECURITY': return 'bg-green-50';
      case 'SOCIAL_ENGINEERING': return 'bg-purple-50';
      default: return 'bg-primary-50';
    }
  };

  const openAssignModal = async (module = null) => {
    setSelectedModule(module);
    setSelectedEmployees(new Set());
    setDueDate('');
    setShowModal(true);

    if (!employees.length && companyId) {
      setEmployeesLoading(true);
      try {
        const res = await companiesAPI.getUsers(companyId, { role: 'EMPLOYEE' });
        const data = res.data?.results || res.data || [];
        setEmployees(Array.isArray(data) ? data : []);
      } catch {
        toast.error('Failed to load employees');
      } finally {
        setEmployeesLoading(false);
      }
    }
  };

  const toggleEmployee = (id) => {
    setSelectedEmployees((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllEmployees = () => {
    if (selectedEmployees.size === employees.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(employees.map((e) => e.id)));
    }
  };

  const handleAssign = async () => {
    if (!selectedModule) {
      toast.error(t('training.selectModule'));
      return;
    }
    if (selectedEmployees.size === 0) {
      toast.error(t('training.selectEmployees'));
      return;
    }

    setAssignLoading(true);
    try {
      const payload = {
        training_module_id: selectedModule.id,
        employee_ids: Array.from(selectedEmployees),
        assignment_reason: 'MANUAL_ADMIN',
      };
      if (dueDate) {
        payload.due_date = `${dueDate}T23:59:59Z`;
      }

      const res = await trainingAPI.bulkAssign(payload);
      const { assigned, skipped } = res.data;

      if (assigned > 0) {
        toast.success(t('training.assignSuccess', { count: assigned }));
      }
      if (skipped > 0) {
        toast(t('training.assignSkipped', { count: skipped }), { icon: 'ℹ️' });
      }

      setShowModal(false);
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to assign training');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common.tryAgain') || 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('training.management')}</h1>
          <p className="text-gray-600 mt-1">{t('training.managementDesc')}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
          </button>
          <button onClick={() => openAssignModal()} className="btn-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('training.assignTraining')}
          </button>
        </div>
      </div>

      {/* Module Cards */}
      {modules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((module) => {
            const completionRate = module.times_assigned > 0
              ? Math.round((module.times_completed / module.times_assigned) * 100)
              : 0;
            const passRate = module.times_completed > 0
              ? Math.round((module.times_passed / module.times_completed) * 100)
              : 0;

            return (
              <div key={module.id} className="card-hover">
                <div className="flex items-start justify-between mb-4">
                  <div className={clsx('p-3 rounded-lg', getCategoryBg(module.category))}>
                    {getCategoryIcon(module.category)}
                  </div>
                  <span className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    module.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-700'
                  )}>
                    {module.is_active ? t('common.active') || 'Active' : 'Inactive'}
                  </span>
                </div>

                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {isAr && module.title_ar ? module.title_ar : module.title}
                </h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">
                  {isAr && module.description_ar ? module.description_ar : module.description}
                </p>

                <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {module.duration_minutes} {t('training.duration') || 'min'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {module.times_assigned} {t('training.assigned')}
                  </span>
                  <span className="flex items-center gap-1">
                    <Award className="h-4 w-4" />
                    {passRate}% {t('training.passRate')}
                  </span>
                </div>

                {/* Completion progress */}
                <div className="space-y-1 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">{t('training.completionRate')}</span>
                    <span className="font-medium">{completionRate}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1.5">
                    <div
                      className="bg-success-500 h-1.5 rounded-full transition-all"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>

                <button
                  onClick={() => openAssignModal(module)}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {t('training.assign')}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 card">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">{t('training.noModules')}</h3>
          <p className="text-gray-500">Run the seed command to create training modules.</p>
        </div>
      )}

      {/* Assignments Table */}
      {assignments.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('training.assigned')} {t('training.title')}</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.employee')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.module')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.status')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.score')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.assignedDate')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">{t('training.dueDate')}</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900">{a.employee_name || a.employee_email}</div>
                      {a.employee_name && (
                        <div className="text-gray-500 text-xs">{a.employee_email}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {isAr ? a.training_title_ar || a.training_title : a.training_title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        STATUS_COLORS[a.status] || STATUS_COLORS.ASSIGNED
                      )}>
                        {a.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.quiz_score !== null && a.quiz_score !== undefined ? (
                        <span className={clsx(
                          'font-medium',
                          a.passed ? 'text-success-600' : 'text-danger-600'
                        )}>
                          {Math.round(a.quiz_score)}%
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">{t('training.assignTraining')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Module Selection */}
              <div>
                <label className="label mb-1">{t('training.selectModule')}</label>
                <select
                  value={selectedModule?.id || ''}
                  onChange={(e) => {
                    const mod = modules.find((m) => m.id === parseInt(e.target.value));
                    setSelectedModule(mod || null);
                  }}
                  className="input w-full"
                >
                  <option value="">{t('training.selectModule')}...</option>
                  {modules.map((m) => (
                    <option key={m.id} value={m.id}>
                      {isAr && m.title_ar ? m.title_ar : m.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Employee Selection */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label">{t('training.selectEmployees')}</label>
                  <button
                    type="button"
                    onClick={toggleAllEmployees}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    {selectedEmployees.size === employees.length ? t('common.deselectAll') || 'Deselect All' : t('training.selectAll')}
                  </button>
                </div>

                {employeesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                    {employees.map((emp) => (
                      <label
                        key={emp.id}
                        className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEmployees.has(emp.id)}
                          onChange={() => toggleEmployee(emp.id)}
                          className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {emp.first_name} {emp.last_name}
                          </div>
                          <div className="text-xs text-gray-500 truncate">{emp.email}</div>
                        </div>
                      </label>
                    ))}
                    {employees.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No employees found</p>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="label mb-1">{t('training.dueDate')}</label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="input w-full ps-10"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 p-6 border-t">
              <button
                onClick={() => setShowModal(false)}
                className="btn-secondary flex-1"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                onClick={handleAssign}
                disabled={assignLoading || !selectedModule || selectedEmployees.size === 0}
                className={clsx(
                  'btn-primary flex-1 flex items-center justify-center gap-2',
                  (assignLoading || !selectedModule || selectedEmployees.size === 0) && 'opacity-50 cursor-not-allowed'
                )}
              >
                {assignLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    {t('training.assigning')}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    {t('training.assign')} ({selectedEmployees.size})
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TrainingManagement;
