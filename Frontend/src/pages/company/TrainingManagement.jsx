/**
 * TrainingManagement — Training module and assignment management page (/company/training).
 *
 * Allows company admins to:
 *  - Browse available training modules (Email Security, Mobile Security, Social Engineering)
 *  - View module details (content type, difficulty, duration, pass rate)
 *  - Assign modules to individual or multiple employees
 *  - Track employee training status (Assigned / In Progress / Completed / Passed / Failed)
 *  - Filter assignments by status, module, and search query
 *
 * Sub-components (defined in this file):
 *  - AssignTrainingModal — employee multi-select with due date picker
 *
 * Bulk assignment uses POST /api/v1/training/assign/ with employee_ids + training_module_id.
 * The server auto-prevents duplicate assignments (already ASSIGNED or IN_PROGRESS).
 *
 * Data sources:
 *   GET  /api/v1/training/modules/          → available training modules
 *   GET  /api/v1/training/assignments/      → all company training assignments
 *   POST /api/v1/training/assign/           → bulk assign training
 *
 * Requires COMPANY_ADMIN role.
 */
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BookOpen, Users, Clock, CheckCircle, X, Calendar,
  RefreshCw, AlertCircle, Mail, Smartphone, Phone,
  UserPlus, TrendingUp, Eye, Search, Filter, ChevronDown,
  Award,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { formatDistanceToNow } from 'date-fns';
import { trainingAPI, companiesAPI } from '../../api';
import { useAuth } from '../../contexts';

const STATUS_COLORS = {
  ASSIGNED: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200',
  IN_PROGRESS: 'bg-primary-50 text-primary-700',
  COMPLETED: 'bg-success-50 text-success-700',
  PASSED: 'bg-success-50 text-success-700',
  FAILED: 'bg-danger-50 text-danger-700',
  EXPIRED: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400',
};

const CATEGORY_CONFIG = {
  EMAIL_SECURITY: {
    labelKey: 'training.categoryEmailSecurity',
    icon: Mail,
    iconColor: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-50 dark:bg-blue-900/20',
  },
  MOBILE_SECURITY: {
    labelKey: 'training.categoryMobileSecurity',
    icon: Smartphone,
    iconColor: 'text-green-600 dark:text-green-400',
    bgColor: 'bg-green-50 dark:bg-green-900/20',
  },
  SOCIAL_ENGINEERING: {
    labelKey: 'training.categorySocialEngineering',
    icon: Phone,
    iconColor: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-50 dark:bg-purple-900/20',
  },
};

// ─── Training Card (mirrors SimulationCard design) ───────────────────────────
function TrainingCard({ module, onViewDetails, onAssign, isAr }) {
  const { t } = useTranslation();

  const assigned = module.times_assigned || 0;
  const completed = module.times_completed || 0;
  const passed = module.times_passed || 0;
  const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
  const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;

  const cat = CATEGORY_CONFIG[module.category] || {
    labelKey: null,
    label: module.category || 'Training',
    icon: BookOpen,
    iconColor: 'text-primary-600',
    bgColor: 'bg-primary-50',
  };
  const CategoryIcon = cat.icon;
  const catLabel = cat.labelKey ? t(cat.labelKey) : cat.label;
  const title = isAr && module.title_ar ? module.title_ar : module.title;

  return (
    <div className="card group">
      {/* Header: icon + status badge */}
      <div className="flex items-start justify-between mb-4">
        <div className={clsx('p-3 rounded-lg', cat.bgColor)}>
          <CategoryIcon className={clsx('h-6 w-6', cat.iconColor)} />
        </div>
        <span className={clsx(
          'inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          module.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200'
        )}>
          {module.is_active ? t('common.active') : t('common.inactive')}
        </span>
      </div>

      {/* Title — clickable, opens details */}
      <button
        onClick={() => onViewDetails(module)}
        className="block text-left w-full"
      >
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-primary-600 transition-colors line-clamp-2">
          {title}
        </h3>
      </button>

      {/* Category subtitle */}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{catLabel}</p>

      {/* Stats — 2-column grid (mirrors sent/clicked) */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="flex items-center gap-2 text-sm">
          <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-gray-600 dark:text-gray-300">{assigned} {t('training.assigned')}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <CheckCircle className={clsx(
            'h-4 w-4',
            completionRate >= 70 ? 'text-success-500' : completionRate >= 40 ? 'text-warning-500' : 'text-gray-400 dark:text-gray-500'
          )} />
          <span className={clsx(
            completionRate >= 70 ? 'text-success-600' : completionRate >= 40 ? 'text-warning-600' : 'text-gray-600 dark:text-gray-300'
          )}>
            {completed} {t('training.completed')}
          </span>
        </div>
      </div>

      {/* Rates row — mirrors "Click Rate:" line */}
      <div className="flex gap-4 text-xs pt-3 border-t">
        <div>
          <span className="text-gray-400 dark:text-gray-500">{t('training.completionRate')}: </span>
          <span className={clsx(
            'font-medium',
            completionRate >= 70 ? 'text-success-600' : completionRate >= 40 ? 'text-warning-600' : 'text-gray-600 dark:text-gray-300'
          )}>
            {completionRate}%
          </span>
        </div>
        <div>
          <span className="text-gray-400 dark:text-gray-500">{t('training.passRate')}: </span>
          <span className={clsx(
            'font-medium',
            passRate >= 70 ? 'text-success-600' : passRate >= 40 ? 'text-warning-600' : 'text-gray-600 dark:text-gray-300'
          )}>
            {passRate}%
          </span>
        </div>
      </div>

      {/* CTA button — mirrors "View Analytics" */}
      <button
        onClick={() => onViewDetails(module)}
        className="mt-4 w-full btn-primary flex items-center justify-center gap-2 text-sm py-2"
      >
        <Eye className="h-4 w-4" />
        {t('training.viewDetails')}
      </button>

      {/* Duration footnote — mirrors created timestamp */}
      <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
        <Clock className="h-3 w-3 inline me-1" />
        {module.duration_minutes} {t('training.duration')}
      </p>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
function TrainingManagement() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isAr = i18n.language === 'ar';
  const companyId = user?.company_id || user?.company;

  const [modules, setModules] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search / filter
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  // Assign modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedModule, setSelectedModule] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [selectedEmployees, setSelectedEmployees] = useState(new Set());
  const [dueDate, setDueDate] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [pendingAssignedIds, setPendingAssignedIds] = useState(new Set());
  const [completedAssignedIds, setCompletedAssignedIds] = useState(new Set());
  const [pendingWarning, setPendingWarning] = useState(false);
  const [warningEmployees, setWarningEmployees] = useState([]);

  // Details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsModule, setDetailsModule] = useState(null);

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

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredModules = modules.filter((m) => {
    const title = isAr && m.title_ar ? m.title_ar : m.title;
    const matchesSearch = title?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || m.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const handleViewDetails = (module) => {
    setDetailsModule(module);
    setShowDetailsModal(true);
  };

  const openAssignModal = async (module = null) => {
    setSelectedModule(module);
    setSelectedEmployees(new Set());
    setDueDate('');
    setPendingWarning(false);
    setWarningEmployees([]);
    setShowModal(true);

    if (module) {
      const moduleAssignments = assignments.filter(
        (a) => a.training_module === module.id || a.module === module.id
      );
      const incompleteStatuses = ['ASSIGNED', 'IN_PROGRESS'];
      setPendingAssignedIds(new Set(
        moduleAssignments.filter(a => incompleteStatuses.includes(a.status)).map(a => a.employee)
      ));
      setCompletedAssignedIds(new Set(
        moduleAssignments.filter(a => !incompleteStatuses.includes(a.status)).map(a => a.employee)
      ));
    } else {
      setPendingAssignedIds(new Set());
      setCompletedAssignedIds(new Set());
    }

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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllEmployees = () => {
    const allIds = employees.map((e) => e.id);
    if (selectedEmployees.size === allIds.length) {
      setSelectedEmployees(new Set());
    } else {
      setSelectedEmployees(new Set(allIds));
    }
  };

  const handleAssign = async (forceAssign = false) => {
    if (!selectedModule) { toast.error(t('training.selectModule')); return; }
    if (selectedEmployees.size === 0) { toast.error(t('training.selectEmployees')); return; }

    setAssignLoading(true);
    try {
      const payload = {
        training_module_id: selectedModule.id,
        employee_ids: Array.from(selectedEmployees),
        assignment_reason: 'MANUAL_ADMIN',
        force_assign: forceAssign,
      };
      if (dueDate) payload.due_date = `${dueDate}T23:59:59Z`;

      const res = await trainingAPI.bulkAssign(payload);

      // Backend returned a warning about incomplete assignments
      if (res.data.warning) {
        setPendingWarning(true);
        setWarningEmployees(res.data.pending_employees || []);
        return;
      }

      const { assigned, skipped } = res.data;
      if (assigned > 0) toast.success(t('training.assignSuccess', { count: assigned }));
      if (skipped > 0) toast(t('training.assignSkipped', { count: skipped }), { icon: 'ℹ️' });

      setShowModal(false);
      setPendingWarning(false);
      setWarningEmployees([]);
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
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('common.tryAgain') || 'Try Again'}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">

      {/* ── Header ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('training.management')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('training.managementDesc')}</p>
        </div>
        <div className="flex gap-3">
          <button onClick={fetchData} className="btn-secondary flex items-center gap-2">
            <RefreshCw className={clsx('h-4 w-4', loading && 'animate-spin')} />
            {t('admin.common.refresh')}
          </button>
          <button onClick={() => openAssignModal()} className="btn-primary flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            {t('training.assignTraining')}
          </button>
        </div>
      </div>

      {/* ── Search + Category Filter (mirrors simulations) ──────── */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder={t('training.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input ps-10 w-full"
          />
        </div>

        {/* Category dropdown filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="btn-secondary flex items-center gap-2 min-w-[160px] justify-between"
          >
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              {categoryFilter === 'ALL'
                ? t('training.allCategories')
                : (CATEGORY_CONFIG[categoryFilter]?.labelKey ? t(CATEGORY_CONFIG[categoryFilter].labelKey) : categoryFilter)}
            </div>
            <ChevronDown className="h-4 w-4" />
          </button>
          {showFilterMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowFilterMenu(false)} />
              <div className="absolute end-0 mt-1 w-52 bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border border-gray-200 dark:border-gray-700 py-1 z-20">
                <button
                  onClick={() => { setCategoryFilter('ALL'); setShowFilterMenu(false); }}
                  className={clsx(
                    'w-full px-4 py-2 text-start text-sm hover:bg-gray-50 dark:hover:bg-gray-700',
                    categoryFilter === 'ALL' && 'bg-primary-50 text-primary-700'
                  )}
                >
                  {t('training.allCategories')}
                </button>
                {Object.entries(CATEGORY_CONFIG).map(([key, config]) => {
                  const Icon = config.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => { setCategoryFilter(key); setShowFilterMenu(false); }}
                      className={clsx(
                        'w-full px-4 py-2 text-start text-sm hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2',
                        categoryFilter === key && 'bg-primary-50 text-primary-700'
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {t(config.labelKey)}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Module Cards Grid ───────────────────────────────────── */}
      {filteredModules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => (
            <TrainingCard
              key={module.id}
              module={module}
              onViewDetails={handleViewDetails}
              onAssign={openAssignModal}
              isAr={isAr}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 dark:text-gray-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('training.noModules')}</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {searchQuery || categoryFilter !== 'ALL'
              ? t('training.adjustFilters')
              : t('training.seedCommand')}
          </p>
        </div>
      )}

      {/* ── Assignments Table ───────────────────────────────────── */}
      {assignments.length > 0 && (
        <div className="card overflow-hidden">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('training.assigned')} {t('training.title')}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.employee')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.module')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.status')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.score')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.assignedDate')}</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.dueDate')}</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm">
                      <div className="font-medium text-gray-900 dark:text-white">{a.employee_name || a.employee_email}</div>
                      {a.employee_name && <div className="text-gray-500 dark:text-gray-400 text-xs">{a.employee_email}</div>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200">
                      {isAr ? a.training_title_ar || a.training_title : a.training_title}
                    </td>
                    <td className="px-4 py-3">
                      <span className={clsx(
                        'text-xs font-medium px-2 py-1 rounded-full',
                        STATUS_COLORS[a.status] || STATUS_COLORS.ASSIGNED
                      )}>
                        {a.status === 'ASSIGNED' ? t('training.statusAssigned') : a.status === 'IN_PROGRESS' ? t('training.statusInProgress') : a.status === 'COMPLETED' ? t('training.statusCompleted') : a.status === 'PASSED' ? t('training.statusPassed') : a.status === 'FAILED' ? t('training.statusFailed') : a.status === 'EXPIRED' ? t('training.statusExpired') : a.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {a.quiz_score !== null && a.quiz_score !== undefined ? (
                        <span className={clsx('font-medium', a.passed ? 'text-success-600' : 'text-danger-600')}>
                          {Math.round(a.quiz_score)}%
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {a.assigned_at ? new Date(a.assigned_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {a.due_date ? new Date(a.due_date).toLocaleDateString() : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Module Details Modal ─────────────────────────────────── */}
      {showDetailsModal && detailsModule && (() => {
        const assigned = detailsModule.times_assigned || 0;
        const completed = detailsModule.times_completed || 0;
        const passed = detailsModule.times_passed || 0;
        const completionRate = assigned > 0 ? Math.round((completed / assigned) * 100) : 0;
        const passRate = completed > 0 ? Math.round((passed / completed) * 100) : 0;
        const moduleAssignments = assignments.filter(
          (a) => a.training_module === detailsModule.id || a.module === detailsModule.id
        );
        const cat = CATEGORY_CONFIG[detailsModule.category] || {
          labelKey: null,
          label: detailsModule.category || 'Training',
          icon: BookOpen,
          iconColor: 'text-primary-600',
          bgColor: 'bg-primary-50',
        };
        const CatIcon = cat.icon;
        const catLabelDetail = cat.labelKey ? t(cat.labelKey) : cat.label;

        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-3xl w-full max-h-[90vh] overflow-y-auto">

              {/* Header */}
              <div className="sticky top-0 bg-white dark:bg-gray-800 border-b p-6 flex items-start justify-between z-10">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={clsx('p-3 rounded-lg shrink-0', cat.bgColor)}>
                    <CatIcon className={clsx('h-6 w-6', cat.iconColor)} />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {isAr && detailsModule.title_ar ? detailsModule.title_ar : detailsModule.title}
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{catLabelDetail}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg ms-4 shrink-0"
                >
                  <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">

                {/* Stats grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('training.duration')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{detailsModule.duration_minutes}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">min</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('training.assigned')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{assigned}</p>
                  </div>
                  <div className="bg-success-50 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('training.completed')}</p>
                    <p className="text-2xl font-bold text-success-700">{completed}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{completionRate}%</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{t('training.passRate')}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{passRate}%</p>
                  </div>
                </div>

                {/* Description */}
                {(detailsModule.description || detailsModule.description_ar) && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('training.description')}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                      {isAr && detailsModule.description_ar
                        ? detailsModule.description_ar
                        : detailsModule.description}
                    </p>
                  </div>
                )}

                {/* Learning Objectives */}
                {detailsModule.objectives?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('training.learningObjectives')}</h3>
                    <ul className="space-y-2">
                      {detailsModule.objectives.map((obj, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="h-5 w-5 text-success-600 mt-0.5 shrink-0" />
                          <span className="text-sm text-gray-700 dark:text-gray-200">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Topics */}
                {detailsModule.topics?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('training.topicsCovered')}</h3>
                    <div className="flex flex-wrap gap-2">
                      {detailsModule.topics.map((topic, i) => (
                        <span key={i} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm font-medium">
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Assigned Employees */}
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-3">{t('training.assignedEmployees')}</h3>
                  {moduleAssignments.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                          <tr>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.employee')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.status')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.score')}</th>
                            <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('training.completed')}</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {moduleAssignments.map((a) => (
                            <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                              <td className="px-4 py-3 text-sm">
                                <div className="font-medium text-gray-900 dark:text-white">{a.employee_name || a.employee_email}</div>
                                {a.employee_name && <div className="text-xs text-gray-500 dark:text-gray-400">{a.employee_email}</div>}
                              </td>
                              <td className="px-4 py-3">
                                <span className={clsx(
                                  'text-xs font-medium px-2 py-1 rounded-full',
                                  STATUS_COLORS[a.status] || STATUS_COLORS.ASSIGNED
                                )}>
                                  {a.status === 'ASSIGNED' ? t('training.statusAssigned') : a.status === 'IN_PROGRESS' ? t('training.statusInProgress') : a.status === 'COMPLETED' ? t('training.statusCompleted') : a.status === 'PASSED' ? t('training.statusPassed') : a.status === 'FAILED' ? t('training.statusFailed') : a.status === 'EXPIRED' ? t('training.statusExpired') : a.status}
                                </span>
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {a.quiz_score !== null && a.quiz_score !== undefined ? (
                                  <span className={clsx('font-medium', a.passed ? 'text-success-600' : 'text-danger-600')}>
                                    {Math.round(a.quiz_score)}%
                                  </span>
                                ) : (
                                  <span className="text-gray-400 dark:text-gray-500">-</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                {a.completed_at ? new Date(a.completed_at).toLocaleDateString() : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8 border rounded-lg">
                      {t('training.noEmployeesAssigned')}
                    </p>
                  )}
                </div>

              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-gray-50 dark:bg-gray-700 border-t p-6 flex gap-3">
                <button
                  onClick={() => { setShowDetailsModal(false); openAssignModal(detailsModule); }}
                  className="flex-1 btn-primary flex items-center justify-center gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  {t('training.assignTraining')}
                </button>
                <button onClick={() => setShowDetailsModal(false)} className="btn-secondary px-6">
                  {t('common.close') || 'Close'}
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* ── Assign Modal ─────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('training.assignTraining')}</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
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
                    setSelectedEmployees(new Set());
                    setPendingWarning(false);
                    setWarningEmployees([]);
                    if (mod) {
                      const moduleAssignments = assignments.filter(
                        (a) => a.training_module === mod.id || a.module === mod.id
                      );
                      const incompleteStatuses = ['ASSIGNED', 'IN_PROGRESS'];
                      setPendingAssignedIds(new Set(
                        moduleAssignments.filter(a => incompleteStatuses.includes(a.status)).map(a => a.employee)
                      ));
                      setCompletedAssignedIds(new Set(
                        moduleAssignments.filter(a => !incompleteStatuses.includes(a.status)).map(a => a.employee)
                      ));
                    } else {
                      setPendingAssignedIds(new Set());
                      setCompletedAssignedIds(new Set());
                    }
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
                    {selectedEmployees.size === employees.length
                      ? t('common.deselectAll') || 'Deselect All'
                      : t('training.selectAll')}
                  </button>
                </div>

                {employeesLoading ? (
                  <div className="flex justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                  </div>
                ) : (
                  <div className="border rounded-lg max-h-48 overflow-y-auto divide-y">
                    {employees.map((emp) => {
                      const isPending = pendingAssignedIds.has(emp.id);
                      const isCompleted = completedAssignedIds.has(emp.id);
                      return (
                        <label
                          key={emp.id}
                          className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedEmployees.has(emp.id)}
                            onChange={() => toggleEmployee(emp.id)}
                            className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-sm font-medium truncate text-gray-900 dark:text-white">
                              {emp.first_name} {emp.last_name}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{emp.email}</div>
                          </div>
                          {isPending && (
                            <span className="text-xs px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-full font-medium whitespace-nowrap">
                              {t('training.statusInProgress')}
                            </span>
                          )}
                          {isCompleted && (
                            <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium whitespace-nowrap">
                              {t('training.statusCompleted')}
                            </span>
                          )}
                        </label>
                      );
                    })}
                    {employees.length === 0 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">{t('training.noEmployeesLabel')}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Due Date */}
              <div>
                <label className="label mb-1">{t('training.dueDate')}</label>
                <div className="relative">
                  <Calendar className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
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

            {/* Warning banner for incomplete assignments */}
            {pendingWarning && warningEmployees.length > 0 && (
              <div className="mx-6 mb-2 rounded-lg border border-yellow-300 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 p-4">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">
                  {t('training.warningInProgress', { count: warningEmployees.length })}
                </p>
                <ul className="text-xs text-yellow-700 dark:text-yellow-400 space-y-1 mb-3 max-h-24 overflow-y-auto">
                  {warningEmployees.map((emp) => (
                    <li key={emp.id}>• {emp.name} ({emp.email})</li>
                  ))}
                </ul>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mb-3">
                  {t('training.warningMessage')}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAssign(true)}
                    disabled={assignLoading}
                    className="btn-primary text-sm py-1.5 px-4 flex items-center gap-1.5"
                  >
                    {assignLoading
                      ? <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      : <UserPlus className="h-3.5 w-3.5" />}
                    {t('training.assignAnyway')}
                  </button>
                  <button
                    onClick={() => { setPendingWarning(false); setWarningEmployees([]); }}
                    className="btn-secondary text-sm py-1.5 px-4"
                  >
                    {t('common.cancel') || 'Cancel'}
                  </button>
                </div>
              </div>
            )}

            {!pendingWarning && (
              <div className="flex gap-3 p-6 border-t">
                <button onClick={() => setShowModal(false)} className="btn-secondary flex-1">
                  {t('common.cancel') || 'Cancel'}
                </button>
                <button
                  onClick={() => handleAssign(false)}
                  disabled={assignLoading || !selectedModule || selectedEmployees.size === 0}
                  className={clsx(
                    'btn-primary flex-1 flex items-center justify-center gap-2',
                    (assignLoading || !selectedModule || selectedEmployees.size === 0) && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {assignLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
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
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default TrainingManagement;
