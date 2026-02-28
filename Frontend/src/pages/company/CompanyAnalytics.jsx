import { useState, useEffect, useMemo, useCallback } from 'react';
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
  { key: '7d', label: '7 Days' },
  { key: '30d', label: '30 Days' },
  { key: '90d', label: '90 Days' },
];

const RISK_COLORS = {
  LOW: '#22c55e',
  MEDIUM: '#eab308',
  HIGH: '#f97316',
  CRITICAL: '#ef4444',
};

const RISK_LABELS = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

const ROWS_PER_PAGE = 10;

// ── Helpers ────────────────────────────────────────────────

function getRiskColor(score) {
  if (score < 30) return 'text-success-600';
  if (score < 60) return 'text-warning-600';
  if (score < 80) return 'text-orange-600';
  return 'text-danger-600';
}

function getRiskBg(score) {
  if (score < 30) return 'bg-success-50 text-success-700';
  if (score < 60) return 'bg-warning-50 text-warning-700';
  if (score < 80) return 'bg-orange-100 text-orange-700';
  return 'bg-danger-50 text-danger-700';
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
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
    orange: 'bg-orange-100 text-orange-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-500">{label}</p>
          <p className={clsx('text-3xl font-bold mt-1', color === 'danger' ? 'text-danger-600' : 'text-gray-900')}>
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
      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
      onClick={() => onSort(sortKey)}
    >
      <div className="flex items-center gap-1">
        {label}
        <span className="inline-flex flex-col">
          <ChevronUp className={clsx('h-3 w-3 -mb-1', active && currentDir === 'asc' ? 'text-primary-600' : 'text-gray-300')} />
          <ChevronDown className={clsx('h-3 w-3', active && currentDir === 'desc' ? 'text-primary-600' : 'text-gray-300')} />
        </span>
      </div>
    </th>
  );
}

function Pagination({ page, totalPages, onPageChange }) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t">
      <p className="text-sm text-gray-500">
        Page {page} of {totalPages}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1 rounded hover:bg-gray-100 disabled:opacity-40"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// Category config for module icons
const MODULE_CATEGORY_CONFIG = {
  EMAIL_SECURITY: { icon: Mail, iconColor: 'text-blue-600', bgColor: 'bg-blue-50', label: 'Email Security' },
  MOBILE_SECURITY: { icon: Smartphone, iconColor: 'text-green-600', bgColor: 'bg-green-50', label: 'Mobile Security' },
  SOCIAL_ENGINEERING: { icon: Phone, iconColor: 'text-purple-600', bgColor: 'bg-purple-50', label: 'Social Engineering' },
};

// Modal for assigning training — fetches real modules, multi-select, calls bulkAssign
function AssignTrainingModal({ isOpen, onClose, employee, onSuccess }) {
  const [modules, setModules] = useState([]);
  const [modulesLoading, setModulesLoading] = useState(false);
  const [selectedModules, setSelectedModules] = useState(new Set());
  const [assigning, setAssigning] = useState(false);

  // Load modules whenever modal opens
  useEffect(() => {
    if (!isOpen) return;
    setSelectedModules(new Set());
    setModulesLoading(true);
    trainingAPI.getModules()
      .then((res) => setModules(res.data?.results || res.data || []))
      .catch(() => toast.error('Failed to load training modules'))
      .finally(() => setModulesLoading(false));
  }, [isOpen]);

  const toggleModule = (id) => {
    setSelectedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleAssign = async () => {
    if (selectedModules.size === 0) {
      toast.error('Please select at least one training module');
      return;
    }
    setAssigning(true);
    let totalAssigned = 0;
    let totalSkipped = 0;
    try {
      await Promise.all(
        Array.from(selectedModules).map(async (moduleId) => {
          const res = await trainingAPI.bulkAssign({
            training_module_id: moduleId,
            employee_ids: [employee.id],
            assignment_reason: 'REMEDIATION',
          });
          totalAssigned += res.data?.assigned || 0;
          totalSkipped += res.data?.skipped || 0;
        })
      );
      if (totalAssigned > 0) {
        toast.success(
          `Assigned ${totalAssigned} module${totalAssigned !== 1 ? 's' : ''} to ${employee.first_name} ${employee.last_name}`
        );
      }
      if (totalSkipped > 0) {
        toast(`${totalSkipped} module${totalSkipped !== 1 ? 's' : ''} already assigned — skipped`, { icon: 'ℹ️' });
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} />
        <div className="relative bg-white rounded-xl shadow-xl w-full max-w-lg">

          {/* Header */}
          <div className="flex items-start justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Assign Training</h2>
              <p className="text-sm text-gray-500 mt-1">
                Select modules for{' '}
                <span className="font-medium text-gray-900">{employeeName}</span>
                {' '}·{' '}
                <span className={clsx('font-semibold', getRiskColor(employee.risk_score))}>
                  Risk Score: {employee.risk_score}
                </span>
              </p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg ms-4 shrink-0">
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Module List */}
          <div className="p-6 space-y-3">
            {modulesLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
              </div>
            ) : modules.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-6">No training modules available</p>
            ) : (
              modules.map((module) => {
                const cat = MODULE_CATEGORY_CONFIG[module.category] || {
                  icon: BookOpen,
                  iconColor: 'text-primary-600',
                  bgColor: 'bg-primary-50',
                  label: module.category || 'Training',
                };
                const CatIcon = cat.icon;
                const isSelected = selectedModules.has(module.id);

                return (
                  <div
                    key={module.id}
                    onClick={() => toggleModule(module.id)}
                    className={clsx(
                      'border-2 rounded-lg p-4 cursor-pointer transition-all',
                      isSelected
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    )}
                  >
                    <div className="flex items-start gap-3">
                      {/* Custom checkbox */}
                      <div className={clsx(
                        'w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors',
                        isSelected ? 'bg-primary-600 border-primary-600' : 'border-gray-300 bg-white'
                      )}>
                        {isSelected && <Check className="h-3 w-3 text-white" />}
                      </div>

                      {/* Icon */}
                      <div className={clsx('p-2 rounded-lg shrink-0', cat.bgColor)}>
                        <CatIcon className={clsx('h-5 w-5', cat.iconColor)} />
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 leading-tight">{module.title}</p>
                        <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                          <span>{cat.label}</span>
                          <span>·</span>
                          <span>{module.duration_minutes} min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t bg-gray-50 rounded-b-xl">
            <button onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              onClick={handleAssign}
              disabled={assigning || selectedModules.size === 0 || modulesLoading}
              className={clsx(
                'btn-primary flex-1 flex items-center justify-center gap-2',
                (assigning || selectedModules.size === 0 || modulesLoading) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {assigning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Assigning...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4" />
                  {selectedModules.size === 0
                    ? 'Select Modules'
                    : `Assign ${selectedModules.size} Module${selectedModules.size !== 1 ? 's' : ''}`}
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
    <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
      <p className="font-medium text-gray-900 mb-1">{label}</p>
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
      name: RISK_LABELS[level] || level,
      value: count,
      level,
    }));
  }, [overview]);

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
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  // ── Error state ──

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchAnalytics} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
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
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || period;

  // ── Render ──

  return (
    <div className="fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics & Reports</h1>
          <p className="text-gray-600 mt-1">Last {periodLabel}</p>
        </div>
        <button
          onClick={fetchAnalytics}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
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
                : 'bg-white text-gray-700 border hover:bg-gray-50'
            )}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          label="Avg Risk Score"
          value={avgRisk?.toFixed?.(1) ?? '0'}
          icon={AlertTriangle}
          color={riskColor}
        />
        <MetricCard
          label="Campaign Completion"
          value={formatPct(completionRate)}
          icon={Target}
          color="primary"
        />
        <MetricCard
          label="Simulation Click Rate"
          value={formatPct(clickRate)}
          icon={MousePointerClick}
          color={clickColor}
        />
        <MetricCard
          label="Training Completion"
          value={formatPct(trainingRate)}
          icon={BookOpen}
          color={trainingColor}
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Risk Score Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Risk Score Over Time</h3>
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
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No trend data available
            </div>
          )}
        </div>

        {/* Chart 2: Risk Distribution Donut */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Level Distribution</h3>
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
                      <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
                        <p className="font-medium">{d.name}</p>
                        <p>{d.value} employees ({pct}%)</p>
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
                  employees
                </text>
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No distribution data available
            </div>
          )}
        </div>

        {/* Chart 3: Campaign vs Simulation Activity */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Training Activity</h3>
          {activityBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="completions" name="Training Completions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name="Simulation Clicks" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No activity data available
            </div>
          )}
        </div>

        {/* Chart 4: Training Effectiveness */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Training Completion Rates</h3>
          {trainingBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trainingBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 12 }} />
                <Tooltip
                  content={<ChartTooltip formatter={(v) => `${Math.round(v)}%`} />}
                />
                <Bar dataKey="rate" name="Completion Rate" radius={[0, 4, 4, 0]}>
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
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No training data available
            </div>
          )}
        </div>
      </div>

      {/* ── Data Tables ── */}
      <div className="card p-0">
        {/* Tab Navigation */}
        <div className="flex border-b">
          {[
            { key: 'campaigns', label: 'Recent Campaigns' },
            { key: 'simulations', label: 'Recent Simulations' },
            { key: 'highrisk', label: 'High Risk Employees' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={clsx(
                'px-6 py-3 text-sm font-medium transition-colors border-b-2 -mb-px',
                activeTab === tab.key
                  ? 'text-primary-600 border-primary-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search & Export Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
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
            Export CSV
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {activeTab === 'campaigns' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Campaign Name" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completion</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                  <SortHeader label="Created" sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedData.length > 0 ? (
                  pagedData.map((c) => {
                    const progress = c.progress ?? c.completion_rate ?? 0;
                    const progressPct = progress <= 1 ? progress * 100 : progress;
                    const avgScore = c.average_score ?? null;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{c.name}</td>
                        <td className="px-4 py-3 text-gray-600">{c.total_participants ?? '—'}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(progressPct, 100)}%` }}
                              />
                            </div>
                            <span className="text-sm text-gray-600">{Math.round(progressPct)}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {avgScore != null ? (
                            <span className={clsx('font-medium', getRiskColor(avgScore))}>
                              {Math.round(avgScore)}
                            </span>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => window.location.href = `/company/campaigns/${c.id}`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No campaigns match your search' : 'No campaigns found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'simulations' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Simulation Name" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Targets</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Open Rate</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Click Rate</th>
                  <SortHeader label="Date" sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedData.length > 0 ? (
                  pagedData.map((s) => {
                    const cr = s.click_rate ?? 0;
                    const crPct = cr <= 1 ? cr * 100 : cr;
                    const openR = s.open_rate ?? 0;
                    const openPct = openR <= 1 ? openR * 100 : openR;
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                        <td className="px-4 py-3 text-gray-600">{s.target_count ?? s.total_targets ?? '—'}</td>
                        <td className="px-4 py-3 text-gray-600">{Math.round(openPct)}%</td>
                        <td className="px-4 py-3">
                          <span className={clsx('font-medium', crPct > 30 ? 'text-danger-600' : 'text-gray-900')}>
                            {Math.round(crPct)}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(s.created_at)}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => window.location.href = `/company/simulations`}
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No simulations match your search' : 'No simulations found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {activeTab === 'highrisk' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Employee Name" sortKey="last_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <SortHeader label="Risk Score" sortKey="risk_score" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Quiz</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Needs Training</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedData.length > 0 ? (
                  pagedData.map((emp) => (
                    <tr key={emp.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{emp.employee_email || emp.email}</td>
                      <td className="px-4 py-3">
                        <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', getRiskBg(emp.risk_score))}>
                          {emp.risk_score} - {emp.risk_level || (emp.risk_score >= 80 ? 'CRITICAL' : 'HIGH')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(emp.last_quiz_date)}</td>
                      <td className="px-4 py-3">
                        {emp.requires_remediation ? (
                          <span className="text-danger-600 text-sm font-medium">Yes</span>
                        ) : (
                          <span className="text-success-600 text-sm">No</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setAssignModal({ open: true, employee: emp })}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          Assign Training
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No employees match your search' : 'No high-risk employees found'}
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
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'campaigns', label: 'Export Campaigns' },
            { key: 'simulations', label: 'Export Simulations' },
            { key: 'risk_scores', label: 'Export Risk Scores' },
            { key: 'training', label: 'Export Training' },
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
