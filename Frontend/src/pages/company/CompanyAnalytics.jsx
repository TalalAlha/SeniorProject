import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  TrendingDown,
  TrendingUp,
  Target,
  Download,
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  MousePointerClick,
  BookOpen,
  Search,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  Mail,
  Smartphone,
  Phone,
  Check,
  UserPlus,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format } from 'date-fns';
import { analyticsAPI, campaignsAPI, simulationsAPI, trainingAPI } from '../../api';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
} from 'recharts';

// ── Constants ──────────────────────────────────────────────

const PERIODS = [
  { key: '7d', labelKey: 'analytics.7days' },
  { key: '30d', labelKey: 'analytics.30days' },
  { key: '90d', labelKey: 'analytics.90days' },
];

const RISK_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_LABEL_KEYS = {
  LOW: 'analytics.low',
  MEDIUM: 'analytics.medium',
  HIGH: 'analytics.high',
  CRITICAL: 'analytics.critical',
};

const ROWS_PER_PAGE = 10;

// ── Helpers ────────────────────────────────────────────────

function getRiskColor(score) {
  if (score < 30) return 'text-success-600';
  if (score < 60) return 'text-warning-600';
  if (score < 80) return 'text-orange-600 dark:text-orange-400';
  return 'text-danger-600';
}

function getRiskBg(score) {
  if (score < 30) return 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300';
  if (score < 60) return 'bg-warning-50 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300';
  if (score < 80) return 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400';
  return 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300';
}

function formatPct(value) {
  if (value == null) return '0%';
  const n = typeof value === 'number' && value <= 1 ? value * 100 : value;
  return `${Math.round(n)}%`;
}

function formatDate(d) {
  if (!d) return '—';
  try {
    return format(new Date(d), 'MMM d, yyyy');
  } catch {
    return d;
  }
}

function formatShortDate(d) {
  if (!d) return '';
  try {
    return format(new Date(d), 'MMM d');
  } catch {
    return d;
  }
}

/**
 * Fill a dateMap with entries for every day in [startDate, endDate].
 * Missing days get the provided defaults. Keys are ISO strings (YYYY-MM-DD).
 */
function fillDateRange(dateMap, startDate, endDate, defaults = {}) {
  if (!startDate || !endDate) return dateMap;
  const filled = { ...dateMap };
  const cur = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T00:00:00');
  while (cur <= end) {
    const key = cur.toISOString().split('T')[0];
    if (!filled[key]) {
      filled[key] = { date: formatShortDate(key), ...defaults };
    }
    cur.setDate(cur.getDate() + 1);
  }
  return filled;
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ── Sub-components ─────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color = 'primary', trend, trendValue }) {
  const iconBg = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
    orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
          <p className={clsx('text-3xl font-bold mt-1', color === 'danger' ? 'text-danger-600' : 'text-gray-900 dark:text-white')}>
            {value}
          </p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500 mr-1" />
              )}
              <span className={clsx('text-sm', trend === 'up' ? 'text-success-600' : 'text-danger-600')}>
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-lg', iconBg[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function SortHeader({ label, sortKey, currentSort, currentDir, onSort }) {
  const active = currentSort === sortKey;
  return (
    <th
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-gray-600"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col">
          <ChevronUp className={clsx('h-3 w-3 -mb-1', active && currentDir === 'asc' ? 'text-primary-600' : 'text-gray-300 dark:text-gray-500')} />
          <ChevronDown className={clsx('h-3 w-3', active && currentDir === 'desc' ? 'text-primary-600' : 'text-gray-300 dark:text-gray-500')} />
        </span>
      </div>
    </th>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useTranslation();
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t dark:border-gray-700">
      <p className="text-sm text-gray-500 dark:text-gray-400">
        {t('analytics.pageOf', { page, total: totalPages })}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-600 disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Category config for module icons
const MODULE_CATEGORY_CONFIG = {
  EMAIL_SECURITY: { icon: Mail, iconColor: 'text-blue-600 dark:text-blue-400', bgColor: 'bg-blue-50 dark:bg-blue-900/20', labelKey: 'training.categoryEmailSecurity' },
  MOBILE_SECURITY: { icon: Smartphone, iconColor: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-50 dark:bg-green-900/20', labelKey: 'training.categoryMobileSecurity' },
  SOCIAL_ENGINEERING: { icon: Phone, iconColor: 'text-purple-600 dark:text-purple-400', bgColor: 'bg-purple-50 dark:bg-purple-900/20', labelKey: 'training.categorySocialEngineering' },
};

// Status badge config for existing assignments shown inside the modal
const ASSIGNMENT_STATUS_UI = {
  ASSIGNED:    { labelKey: 'training.inQueue',         badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',    blocked: true  },
  IN_PROGRESS: { labelKey: 'training.statusInProgress', badge: 'bg-warning-100 dark:bg-warning-900/20 text-warning-700 dark:text-warning-300', blocked: true  },
  COMPLETED:   { labelKey: 'training.statusCompleted',  badge: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300', blocked: false },
  PASSED:      { labelKey: 'training.statusPassed',     badge: 'bg-success-50 dark:bg-success-900/20 text-success-700 dark:text-success-300', blocked: false },
  FAILED:      { labelKey: 'training.statusFailed',     badge: 'bg-danger-50 dark:bg-danger-900/20 text-danger-700 dark:text-danger-300',  blocked: false },
  EXPIRED:     { labelKey: 'training.statusExpired',    badge: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',     blocked: false },
};

// Modal for assigning training — fetches real modules + employee's existing assignments
function AssignTrainingModal({ isOpen, onClose, employee, onSuccess }) {
  const { t } = useTranslation();
  const [modules, setModules] = useState([]);
  const [existingAssignments, setExistingAssignments] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [selectedModules, setSelectedModules] = useState(new Set());
  const [assigning, setAssigning] = useState(false);

  // Load modules + this employee's assignments whenever the modal opens
  const loadData = useCallback(() => {
    if (!employee?.employee_id) return;
    setSelectedModules(new Set());
    setExistingAssignments([]);
    setLoadError(null);
    setDataLoading(true);
    Promise.all([
      trainingAPI.getModules(),
      trainingAPI.getAssignments({ employee: employee.employee_id }),
    ])
      .then(([modulesRes, assignmentsRes]) => {
        setModules(modulesRes.data?.results || modulesRes.data || []);
        setExistingAssignments(assignmentsRes.data?.results || assignmentsRes.data || []);
      })
      .catch((err) => {
        const msg = err.response?.data?.detail || 'Failed to load training data';
        setLoadError(msg);
      })
      .finally(() => setDataLoading(false));
  }, [employee?.employee_id]);

  useEffect(() => {
    if (!isOpen) return;
    loadData();
  }, [isOpen, loadData]);

  // Return the most-relevant existing assignment for a module
  // Priority: active (blocked) first, then any finished one
  const getAssignmentFor = (moduleId) => {
    const active = existingAssignments.find(
      (a) => a.training_module === moduleId && ['ASSIGNED', 'IN_PROGRESS'].includes(a.status)
    );
    if (active) return active;
    // Return last finished assignment (COMPLETED/PASSED/FAILED/EXPIRED)
    return existingAssignments
      .filter((a) => a.training_module === moduleId)
      .sort((a, b) => new Date(b.assigned_at) - new Date(a.assigned_at))[0] || null;
  };

  const toggleModule = (moduleId, blocked) => {
    if (blocked) return;
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(moduleId)) next.delete(moduleId); else next.add(moduleId);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedModules.size === 0) {
      toast.error('Please select at least one training module');
      return;
    }
    setAssigning(true);
    try {
      const res = await trainingAPI.bulkAssign({
        training_module_ids: Array.from(selectedModules),
        employee_ids: [employee.employee_id],
        assignment_reason: 'MANUAL_ADMIN',
      });
      const totalAssigned = res.data?.assigned || 0;
      const totalSkipped = res.data?.skipped || 0;
      const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_name || 'Employee';
      if (totalAssigned > 0) {
        toast.success(`Assigned ${totalAssigned} module${totalAssigned !== 1 ? 's' : ''} to ${employeeName}`);
      }
      if (totalSkipped > 0) {
        toast(`${totalSkipped} module${totalSkipped !== 1 ? 's' : ''} already active — skipped`, { icon: 'ℹ️' });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(err.response?.data?.detail || err.response?.data?.error || 'Failed to assign training');
    } finally {
      setAssigning(false);
    }
  };

  if (!isOpen || !employee) return null;

  const employeeName = `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || employee.employee_name || 'Employee';
  // Selectables = modules that are not currently blocked
  const selectableCount = modules.filter((m) => {
    const a = getAssignmentFor(m.id);
    return !a || !ASSIGNMENT_STATUS_UI[a.status]?.blocked;
  }).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 w-full max-w-lg">

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b dark:border-gray-700">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{t('analytics.assignTraining')}</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                <span className="font-medium text-gray-900 dark:text-white">{employeeName}</span>
                {' · '}
                <span className={clsx('font-semibold', getRiskColor(employee.risk_score))}>
                  {t('analytics.riskScoreLabel')}: {employee.risk_score}
                </span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg ms-4 shrink-0">
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Module List */}
          <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
            {dataLoading ? (
              <div className="flex items-center justify-center py-10 gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
                <span className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.loadingModules')}</span>
              </div>
            ) : loadError ? (
              <div className="text-center py-8">
                <AlertCircle className="h-10 w-10 text-danger-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white mb-1">{t('analytics.failedToLoadModules')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{loadError}</p>
                <button onClick={loadData} className="btn-secondary text-sm">
                  {t('admin.common.tryAgain')}
                </button>
              </div>
            ) : modules.length === 0 ? (
              <div className="text-center py-8">
                <AlertTriangle className="h-10 w-10 text-warning-500 mx-auto mb-3" />
                <p className="font-medium text-gray-900 dark:text-white mb-1">{t('analytics.noModulesFound')}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  {t('analytics.seedFirst')}
                </p>
                <button
                  onClick={() => { onClose(); window.location.href = '/company/training'; }}
                  className="btn-primary text-sm"
                >
                  {t('analytics.goToTraining')}
                </button>
              </div>
            ) : (
              modules.map((module) => {
                const cat = MODULE_CATEGORY_CONFIG[module.category] || {
                  icon: BookOpen,
                  iconColor: 'text-primary-600',
                  bgColor: 'bg-primary-50',
                  labelKey: null,
                  label: module.category || 'Training',
                };
                const CatIcon = cat.icon;
                const assignment = getAssignmentFor(module.id);
                const statusUi = assignment ? ASSIGNMENT_STATUS_UI[assignment.status] : null;
                const blocked = statusUi?.blocked ?? false;
                const isSelected = selectedModules.has(module.id);

                return (
                  <div
                    key={module.id}
                    onClick={() => toggleModule(module.id, blocked)}
                    className={clsx(
                      'border-2 rounded-lg p-4 transition-all',
                      blocked
                        ? 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 cursor-not-allowed opacity-70'
                        : isSelected
                          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 cursor-pointer'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Checkbox (greyed out when blocked) */}
                      <div className={clsx(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        blocked
                          ? 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'
                          : isSelected
                            ? 'bg-primary-600 border-primary-600'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'
                      )}>
                        {isSelected && !blocked && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Category icon */}
                      <div className={clsx('p-2 rounded-lg shrink-0', cat.bgColor)}>
                        <CatIcon className={clsx('h-5 w-5', cat.iconColor)} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-gray-900 dark:text-white leading-tight">{module.title}</p>
                          {statusUi && (
                            <span className={clsx('text-xs px-2 py-0.5 rounded-full font-medium', statusUi.badge)}>
                              {t(statusUi.labelKey)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{cat.labelKey ? t(cat.labelKey) : cat.label}</span>
                          <span>·</span>
                          <span>{module.duration_minutes} min</span>
                        </div>
                        {/* Contextual hint */}
                        {blocked && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {t('analytics.cannotAssign')}
                          </p>
                        )}
                        {!blocked && assignment && (
                          <p className="text-xs text-primary-600 mt-1">
                            {t('analytics.previouslyAssigned', { status: statusUi?.labelKey ? t(statusUi.labelKey).toLowerCase() : 'assigned' })}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-b-xl">
            <button onClick={onClose} className="btn-secondary flex-1">
              {t('common.cancel')}
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || selectedModules.size === 0 || dataLoading}
              className={clsx(
                'btn-primary flex-1 flex items-center justify-center gap-2',
                (assigning || selectedModules.size === 0 || dataLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('training.assigning')}
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {selectedModules.size === 0
                    ? selectableCount === 0 ? t('analytics.allActive') : t('analytics.selectModules')
                    : t('analytics.assignModules', { count: selectedModules.size })}
                </>
              )}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// Custom Recharts tooltip
function ChartTooltip({ active, payload, label, formatter }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border p-3 text-sm">
      <p className="font-medium text-gray-900 dark:text-white mb-1">{label}</p>
      {payload.map((entry, i) => (
        <p key={i} style={{ color: entry.color || entry.stroke }}>
          {entry.name}: {formatter ? formatter(entry.value) : entry.value}
        </p>
      ))}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────

function CompanyAnalytics() {
  const { t } = useTranslation();
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('30d');
  const [activeTab, setActiveTab] = useState('campaigns');
  const [exporting, setExporting] = useState(null);

  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [campaigns, setCampaigns] = useState([]);
  const [simulations, setSimulations] = useState([]);
  const [highRiskEmployees, setHighRiskEmployees] = useState([]);
  const [trainingEffectiveness, setTrainingEffectiveness] = useState([]);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // Modal state
  const [assignModal, setAssignModal] = useState({ open: false, employee: null });

  // ── Data fetching ──

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, trendsRes, campaignsRes, simulationsRes, highRiskRes, trainingRes] =
        await Promise.all([
          analyticsAPI.getOverview({ period }).catch(() => ({ data: null })),
          analyticsAPI.getTrends({ period }).catch(() => ({ data: null })),
          campaignsAPI.list({ limit: 20, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
          simulationsAPI.list({ limit: 20, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
          analyticsAPI.getHighRiskEmployees().catch(() => ({ data: { results: [] } })),
          analyticsAPI.getTrainingEffectiveness().catch(() => ({ data: [] })),
        ]);

      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setCampaigns(campaignsRes.data?.results || campaignsRes.data || []);
      setSimulations(simulationsRes.data?.results || simulationsRes.data || []);
      setHighRiskEmployees(highRiskRes.data?.results || highRiskRes.data || []);
      setTrainingEffectiveness(
        Array.isArray(trainingRes.data)
          ? trainingRes.data
          : trainingRes.data?.module_stats || trainingRes.data?.results || []
      );
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load analytics data';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  // Reset table state when tab changes
  useEffect(() => {
    setSearchQuery('');
    setSortKey(null);
    setSortDir('asc');
    setPage(1);
  }, [activeTab]);

  // ── Derived chart data ──

  const trendLineData = useMemo(() => {
    // Backend returns average_risk_scores as [{date, value}, ...]
    const scores = trends?.average_risk_scores;
    if (!scores?.length) return [];
    const dateMap = {};
    scores.forEach((point) => {
      const key = String(point.date);
      dateMap[key] = { date: formatShortDate(point.date), score: point.value ?? 0 };
    });
    const filled = fillDateRange(dateMap, trends?.start_date, trends?.end_date, { score: 0 });
    return Object.entries(filled)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, v]) => ({ ...v, date: v.date || formatShortDate(v.date) }));
  }, [trends]);

  const riskDistData = useMemo(() => {
    if (!overview) return [];
    // Backend returns flat fields: low_risk_count, medium_risk_count, etc.
    const dist = {
      LOW: overview.low_risk_count ?? 0,
      MEDIUM: overview.medium_risk_count ?? 0,
      HIGH: overview.high_risk_count ?? 0,
      CRITICAL: overview.critical_risk_count ?? 0,
    };
    const entries = Object.entries(dist).filter(([, count]) => count > 0);
    if (entries.length === 0) return [];
    return entries.map(([level, count]) => ({
      name: t(RISK_LABEL_KEYS[level] || level),
      value: count,
      level,
    }));
  }, [overview, t]);

  const riskDistTotal = useMemo(
    () => riskDistData.reduce((sum, d) => sum + d.value, 0),
    [riskDistData]
  );

  const activityBarData = useMemo(() => {
    // Backend returns quiz_completions, simulation_click_rates, training_completions as [{date, value, count?}, ...]
    // Merge all datasets by date
    const dateMap = {};
    (trends?.quiz_completions || []).forEach((point) => {
      const key = String(point.date);
      if (!dateMap[key]) dateMap[key] = { date: formatShortDate(point.date), completions: 0, clicks: 0 };
      dateMap[key].completions += (point.count ?? point.value ?? 0);
    });
    (trends?.training_completions || []).forEach((point) => {
      const key = String(point.date);
      if (!dateMap[key]) dateMap[key] = { date: formatShortDate(point.date), completions: 0, clicks: 0 };
      dateMap[key].completions += (point.count ?? point.value ?? 0);
    });
    (trends?.simulation_click_rates || []).forEach((point) => {
      const key = String(point.date);
      if (!dateMap[key]) dateMap[key] = { date: formatShortDate(point.date), completions: 0, clicks: 0 };
      dateMap[key].clicks = point.count ?? point.value ?? 0;
    });
    // Fill in empty dates across the full period range
    const filled = fillDateRange(dateMap, trends?.start_date, trends?.end_date, { completions: 0, clicks: 0 });
    const trendData = Object.entries(filled)
      .sort(([a], [b]) => a.localeCompare(b))  // sort by ISO date key (YYYY-MM-DD)
      .map(([, v]) => v);

    if (trendData.length > 0) return trendData;

    // Fallback: build from campaigns list
    if (campaigns.length > 0) {
      return campaigns.slice(0, 10).map((c) => ({
        date: c.name,
        completions: c.completed_participants ?? 0,
        clicks: 0,
      }));
    }

    return [];
  }, [trends, campaigns]);

  const trainingBarData = useMemo(() => {
    if (!trainingEffectiveness?.length) return [];
    return trainingEffectiveness.map((t) => ({
      name: t.module_title || t.name || t.title || `Module ${t.module_id || t.id}`,
      rate: typeof t.completion_rate === 'number'
        ? (t.completion_rate <= 1 ? t.completion_rate * 100 : t.completion_rate)
        : 0,
    }));
  }, [trainingEffectiveness]);

  // ── Table helpers ──

  const handleSort = useCallback(
    (key) => {
      if (sortKey === key) {
        setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
      } else {
        setSortKey(key);
        setSortDir('asc');
      }
      setPage(1);
    },
    [sortKey]
  );

  function getTableData() {
    let data = [];
    if (activeTab === 'campaigns') data = [...campaigns];
    else if (activeTab === 'simulations') data = [...simulations];
    else data = [...highRiskEmployees];

    // Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const name =
          item.name || item.employee_name || `${item.first_name || ''} ${item.last_name || ''}`;
        const email = item.email || item.employee_email || '';
        return (
          name.toLowerCase().includes(q) ||
          email.toLowerCase().includes(q)
        );
      });
    }

    // Sort
    if (sortKey) {
      data.sort((a, b) => {
        let aVal = a[sortKey];
        let bVal = b[sortKey];
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        if (aVal < bVal) return sortDir === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return data;
  }

  const tableData = getTableData();
  const totalPages = Math.ceil(tableData.length / ROWS_PER_PAGE) || 1;
  const pagedData = tableData.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // ── Export handlers ──

  async function handleExport(type) {
    setExporting(type);
    try {
      const res = await analyticsAPI.exportCSV({ export_type: type, period });
      const blob = res.data instanceof Blob ? res.data : new Blob([res.data], { type: 'text/csv' });
      downloadBlob(blob, `phishaware-${type}-${period}.csv`);
      toast.success('Report exported successfully');
    } catch {
      toast.error('Failed to export report');
    } finally {
      setExporting(null);
    }
  }

  // ── Loading state ──

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('analytics.loadingAnalytics')}</p>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  // ── Metric values ──

  const avgRisk = overview?.average_risk_score ?? 0;
  const completionRate = overview?.campaign_completion_rate ?? 0;
  const clickRate = overview?.overall_click_rate ?? 0;
  const trainingRate = overview?.training_completion_rate ?? 0;

  const riskColor = avgRisk >= 80 ? 'danger' : avgRisk >= 60 ? 'orange' : avgRisk >= 30 ? 'warning' : 'success';
  const clickColor = (clickRate > 0.3 || clickRate > 30) ? 'danger' : 'success';
  const trainingColor = (trainingRate > 0.7 || trainingRate > 70) ? 'success' : 'warning';

  // Period label for display
  const periodLabelKey = PERIODS.find((p) => p.key === period)?.labelKey;
  const periodLabel = periodLabelKey ? t(periodLabelKey) : period;

  // ── Render ──

  return (
    <div className="fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('analytics.title')}</h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('analytics.lastPeriodLabel', { label: periodLabel })}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className="h-4 w-4" />
          {t('analytics.refresh')}
        </button>
      </div>

      {/* ── Period Selector ── */}
      <div className="flex flex-wrap gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.key}
            onClick={() => setPeriod(p.key)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              period === p.key
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border hover:bg-gray-50 dark:hover:bg-gray-700'
            )}
          >
            {t(p.labelKey)}
          </button>
        ))}
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label={t('analytics.avgRiskScore')}
          value={avgRisk?.toFixed?.(1) ?? '0'}
          icon={AlertTriangle}
          color={riskColor}
        />
        <MetricCard
          label={t('analytics.campaignCompletion')}
          value={formatPct(completionRate)}
          icon={Target}
          color="primary"
        />
        <MetricCard
          label={t('analytics.simulationClickRate')}
          value={formatPct(clickRate)}
          icon={MousePointerClick}
          color={clickColor}
        />
        <MetricCard
          label={t('analytics.trainingCompletion')}
          value={formatPct(trainingRate)}
          icon={BookOpen}
          color={trainingColor}
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Risk Score Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.avgRiskScoreOverTime')}</h3>
          {trendLineData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendLineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  name="Risk Score"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              {t('analytics.noTrendData')}
            </div>
          )}
        </div>

        {/* Chart 2: Risk Distribution Donut */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.riskLevelDistribution')}</h3>
          {riskDistData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={riskDistData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskDistData.map((entry) => (
                    <Cell key={entry.level} fill={RISK_COLORS[entry.level] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    const pct = riskDistTotal > 0 ? ((d.value / riskDistTotal) * 100).toFixed(1) : 0;
                    return (
                      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg dark:shadow-gray-900/50 border p-3 text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p>{d.value} {t('analytics.employees')} ({pct}%)</p>
                      </div>
                    );
                  }}
                />
                <Legend />
                {/* Center text */}
                <text x="50%" y="47%" textAnchor="middle" className="fill-gray-900 text-2xl font-bold">
                  {riskDistTotal}
                </text>
                <text x="50%" y="56%" textAnchor="middle" className="fill-gray-500 text-xs">
                  {t('analytics.employees')}
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              {t('analytics.noDistributionData')}
            </div>
          )}
        </div>

        {/* Chart 3: Campaign vs Simulation Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.securityTrainingActivity')}</h3>
          {activityBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="completions" name={t('analytics.trainingCompletions')} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name={t('analytics.simulationClicks')} fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              {t('analytics.noActivityData')}
            </div>
          )}
        </div>

        {/* Chart 4: Training Effectiveness */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.trainingCompletionRates')}</h3>
          {trainingBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trainingBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={<ChartTooltip formatter={(v) => `${Math.round(v)}%`} />}
                />
                <Bar dataKey="rate" name={t('analytics.completionRate')} radius={[0, 4, 4, 0]}>
                  {trainingBarData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.rate >= 70 ? '#22c55e' : entry.rate >= 40 ? '#eab308' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400 dark:text-gray-500">
              {t('analytics.noTrainingData')}
            </div>
          )}
        </div>
      </div>

      {/* ── Data Tables ── */}
      <div className="card p-0">
        {/* Tab Navigation */}
        <div className="flex border-b dark:border-gray-700">
          {[
            { key: 'campaigns', label: t('analytics.recentCampaigns') },
            { key: 'simulations', label: t('analytics.recentSimulations') },
            { key: 'highrisk', label: t('analytics.highRiskEmployees') },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 dark:text-gray-400 border-transparent hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b dark:border-gray-700">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder={t('common.search') + '...'}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="input pl-9 py-2 text-sm"
            />
          </div>
          <button
            onClick={() => handleExport(activeTab)}
            disabled={!!exporting}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {exporting === activeTab ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {t('admin.common.exportCsv')}
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeTab === 'campaigns' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortHeader label={t('analytics.campaignName')} sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.assigned')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.completion')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.avgScore')}</th>
                  <SortHeader label={t('analytics.created')} sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {pagedData.length > 0 ? (
                  pagedData.map((c) => {
                    const progress = c.progress ?? c.completion_rate ?? 0;
                    const progressPct = progress <= 1 ? progress * 100 : progress;
                    const avgScore = c.average_score ?? null;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{c.total_participants ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progressPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600 dark:text-gray-300">{Math.round(progressPct)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {avgScore != null ? (
                            <span className={clsx('font-medium', getRiskColor(avgScore))}>
                              {Math.round(avgScore)}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => window.location.href = `/company/campaigns/${c.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {t('common.view')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? t('analytics.noCampaignsMatch') : t('analytics.noCampaignsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'simulations' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortHeader label={t('analytics.simulationName')} sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.targets')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.openRate')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.clickRate')}</th>
                  <SortHeader label={t('analytics.date')} sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {pagedData.length > 0 ? (
                  pagedData.map((s) => {
                    const cr = s.click_rate ?? 0;
                    const crPct = cr <= 1 ? cr * 100 : cr;
                    const openR = s.open_rate ?? 0;
                    const openPct = openR <= 1 ? openR * 100 : openR;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{s.target_count ?? s.total_targets ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{Math.round(openPct)}%</td>
                        <td className="px-4 py-3">
                          <span className={clsx('font-medium', crPct > 30 ? 'text-danger-600' : 'text-gray-900 dark:text-white')}>
                            {Math.round(crPct)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => window.location.href = `/company/simulations`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            {t('common.view')}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? t('analytics.noSimulationsMatch') : t('analytics.noSimulationsFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'highrisk' && (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <SortHeader label={t('analytics.employeeName')} sortKey="last_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.email')}</th>
                  <SortHeader label={t('analytics.riskScore')} sortKey="risk_score" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.lastQuiz')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.needsTraining')}</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('analytics.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {pagedData.length > 0 ? (
                  pagedData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                        {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{emp.employee_email || emp.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', getRiskBg(emp.risk_score))}>
                          {emp.risk_score} - {emp.risk_level || (emp.risk_score >= 80 ? 'CRITICAL' : 'HIGH')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 text-sm">{formatDate(emp.last_quiz_date)}</td>
                      <td className="px-4 py-3">
                        {emp.requires_remediation ? (
                          <span className="text-danger-600 text-sm font-medium">{t('common.yes')}</span>
                        ) : (
                          <span className="text-success-600 text-sm">{t('common.no')}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setAssignModal({ open: true, employee: emp })}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          {t('analytics.assignTraining')}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {searchQuery ? t('analytics.noEmployeesMatch') : t('analytics.noHighRiskFound')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ── Export Actions ── */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('analytics.exportReports')}</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'campaigns', label: t('analytics.exportCampaigns') },
            { key: 'simulations', label: t('analytics.exportSimulations') },
            { key: 'risk_scores', label: t('analytics.exportRiskScores') },
            { key: 'training', label: t('analytics.exportTraining') },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={() => handleExport(btn.key)}
              disabled={!!exporting}
              className="btn-secondary flex items-center gap-2"
            >
              {exporting === btn.key ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {btn.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Assign Training Modal ── */}
      <AssignTrainingModal
        isOpen={assignModal.open}
        onClose={() => setAssignModal({ open: false, employee: null })}
        employee={assignModal.employee}
        onSuccess={fetchAnalytics}
      />
    </div>
  );
}

export default CompanyAnalytics;
