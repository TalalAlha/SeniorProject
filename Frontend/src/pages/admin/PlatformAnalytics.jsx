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
  Loader2,
  Building2,
  Users,
  Mail,
  Activity,
  Shield,
} from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { analyticsAPI, companiesAPI, campaignsAPI, simulationsAPI } from '../../api';
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
  { key: 'all', label: 'All Time' },
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

function getRiskBarColor(score) {
  if (score < 30) return 'bg-success-500';
  if (score < 60) return 'bg-warning-500';
  if (score < 80) return 'bg-orange-500';
  return 'bg-danger-500';
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

// ── Sub-components ─────────────────────────────────────────

function MetricCard({ label, value, icon: Icon, color = 'primary', trend, trendValue, subtitle }) {
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
          {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
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
      className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100"
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

function PlatformAnalytics() {
  // State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('all');
  const [activeTab, setActiveTab] = useState('companies');
  const [exporting, setExporting] = useState(null);

  // Data
  const [overview, setOverview] = useState(null);
  const [trends, setTrends] = useState(null);
  const [riskDist, setRiskDist] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [highRiskEmployees, setHighRiskEmployees] = useState([]);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [recentSimulations, setRecentSimulations] = useState([]);

  // Table state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');
  const [page, setPage] = useState(1);

  // ── Data fetching ──

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const periodParam = period === 'all' ? {} : { period };

      const [overviewRes, trendsRes, riskDistRes, companiesRes, highRiskRes, campaignsRes, simulationsRes] =
        await Promise.all([
          analyticsAPI.getOverview(periodParam).catch(() => ({ data: null })),
          analyticsAPI.getTrends(periodParam).catch(() => ({ data: null })),
          analyticsAPI.getRiskDistribution().catch(() => ({ data: null })),
          companiesAPI.list({ ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
          analyticsAPI.getHighRiskEmployees().catch(() => ({ data: { results: [] } })),
          campaignsAPI.list({ limit: 20, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
          simulationsAPI.list({ limit: 20, ordering: '-created_at' }).catch(() => ({ data: { results: [] } })),
        ]);

      setOverview(overviewRes.data);
      setTrends(trendsRes.data);
      setRiskDist(riskDistRes.data);
      setCompanies(companiesRes.data?.results || companiesRes.data || []);
      setHighRiskEmployees(highRiskRes.data?.results || highRiskRes.data || []);
      setRecentCampaigns(campaignsRes.data?.results || campaignsRes.data || []);
      setRecentSimulations(simulationsRes.data?.results || simulationsRes.data || []);
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
    const scores = trends?.average_risk_scores;
    if (!scores?.length) return [];
    return scores.map((point) => ({
      date: formatShortDate(point.date),
      score: point.value ?? 0,
    }));
  }, [trends]);

  const riskDistData = useMemo(() => {
    // Prefer dedicated risk distribution endpoint, fall back to overview counts
    const src = riskDist || overview;
    if (!src) return [];

    const dist = {
      LOW: src.low_risk ?? src.low_risk_count ?? 0,
      MEDIUM: src.medium_risk ?? src.medium_risk_count ?? 0,
      HIGH: src.high_risk ?? src.high_risk_count ?? 0,
      CRITICAL: src.critical_risk ?? src.critical_risk_count ?? 0,
    };
    const entries = Object.entries(dist).filter(([, count]) => count > 0);
    if (entries.length === 0) return [];
    return entries.map(([level, count]) => ({
      name: RISK_LABELS[level] || level,
      value: count,
      level,
    }));
  }, [riskDist, overview]);

  const riskDistTotal = useMemo(
    () => riskDistData.reduce((sum, d) => sum + d.value, 0),
    [riskDistData]
  );

  const activityBarData = useMemo(() => {
    const dateMap = {};
    (trends?.quiz_completions || []).forEach((point) => {
      const key = String(point.date);
      if (!dateMap[key]) dateMap[key] = { date: formatShortDate(point.date), completions: 0, clicks: 0 };
      dateMap[key].completions = point.count ?? point.value ?? 0;
    });
    (trends?.simulation_click_rates || []).forEach((point) => {
      const key = String(point.date);
      if (!dateMap[key]) dateMap[key] = { date: formatShortDate(point.date), completions: 0, clicks: 0 };
      dateMap[key].clicks = point.count ?? point.value ?? 0;
    });
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }, [trends]);

  const topCompaniesData = useMemo(() => {
    // Sort companies by lowest average risk score (best performers)
    // We infer risk score from company stats if available
    return [...companies]
      .filter((c) => c.is_active)
      .sort((a, b) => {
        const aScore = a.average_risk_score ?? a.avg_risk_score ?? 100;
        const bScore = b.average_risk_score ?? b.avg_risk_score ?? 100;
        return aScore - bScore;
      })
      .slice(0, 10)
      .map((c) => ({
        name: c.name?.length > 20 ? c.name.substring(0, 20) + '...' : c.name,
        fullName: c.name,
        score: Math.round(c.average_risk_score ?? c.avg_risk_score ?? 0),
        users: c.total_users || 0,
      }));
  }, [companies]);

  // ── Activity feed ──

  const activityFeed = useMemo(() => {
    const items = [];

    for (const campaign of recentCampaigns) {
      items.push({
        type: 'CAMPAIGN',
        title: campaign.name,
        description: `Campaign ${campaign.status?.toLowerCase() || 'created'} - ${campaign.assigned_count || campaign.total_employees || 0} employees`,
        timestamp: campaign.created_at,
        icon: Target,
        iconBg: 'bg-primary-100',
        iconText: 'text-primary-600',
      });
    }

    for (const sim of recentSimulations) {
      items.push({
        type: 'SIMULATION',
        title: sim.name,
        description: `Simulation ${sim.status?.toLowerCase() || 'created'} - ${sim.target_count || sim.total_sent || 0} targets`,
        timestamp: sim.created_at,
        icon: Mail,
        iconBg: 'bg-warning-50',
        iconText: 'text-warning-600',
      });
    }

    for (const company of companies.slice(0, 5)) {
      items.push({
        type: 'COMPANY',
        title: company.name,
        description: `Company registered - ${company.total_users || 0} users`,
        timestamp: company.created_at,
        icon: Building2,
        iconBg: 'bg-success-50',
        iconText: 'text-success-600',
      });
    }

    items.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    return items.slice(0, 20);
  }, [recentCampaigns, recentSimulations, companies]);

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
    if (activeTab === 'companies') data = [...companies];
    else if (activeTab === 'risk') data = [...highRiskEmployees];
    else {
      // activity tab - use activityFeed
      data = [...activityFeed];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter((item) => {
        const name =
          item.name || item.employee_name || item.title || `${item.first_name || ''} ${item.last_name || ''}`;
        const email = item.email || item.employee_email || '';
        return name.toLowerCase().includes(q) || email.toLowerCase().includes(q);
      });
    }

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

  function handleExportCompanies() {
    if (companies.length === 0) {
      toast.error('No data to export');
      return;
    }
    setExporting('companies');
    const headers = ['Company', 'Users', 'Avg Risk Score', 'Industry', 'Country', 'Status', 'Created'];
    const rows = companies.map((c) => [
      c.name || '',
      c.total_users || 0,
      c.average_risk_score != null ? Math.round(c.average_risk_score) : 'N/A',
      c.industry || '',
      c.country || '',
      c.is_active ? 'Active' : 'Inactive',
      c.created_at ? format(new Date(c.created_at), 'yyyy-MM-dd') : '',
    ]);
    downloadCSV(rows, headers, `platform-companies-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${companies.length} companies`);
    setExporting(null);
  }

  function handleExportRisk() {
    if (highRiskEmployees.length === 0) {
      toast.error('No data to export');
      return;
    }
    setExporting('risk');
    const headers = ['Employee', 'Email', 'Risk Score', 'Risk Level', 'Phishing Clicks', 'Needs Training'];
    const rows = highRiskEmployees.map((emp) => [
      emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim(),
      emp.employee_email || emp.email || '',
      emp.risk_score,
      emp.risk_level || (emp.risk_score >= 80 ? 'CRITICAL' : 'HIGH'),
      emp.phishing_emails_missed || 0,
      emp.requires_remediation ? 'Yes' : 'No',
    ]);
    downloadCSV(rows, headers, `high-risk-employees-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success(`Exported ${highRiskEmployees.length} employees`);
    setExporting(null);
  }

  function handleExportActivity() {
    if (activityFeed.length === 0) {
      toast.error('No data to export');
      return;
    }
    setExporting('activity');
    const headers = ['Type', 'Title', 'Description', 'Timestamp'];
    const rows = activityFeed.map((item) => [
      item.type,
      item.title,
      item.description,
      item.timestamp ? format(new Date(item.timestamp), 'yyyy-MM-dd HH:mm') : '',
    ]);
    downloadCSV(rows, headers, `platform-activity-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    toast.success('Activity exported');
    setExporting(null);
  }

  const handleExport = () => {
    if (activeTab === 'companies') handleExportCompanies();
    else if (activeTab === 'risk') handleExportRisk();
    else handleExportActivity();
  };

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

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || period;

  // ── Render ──

  return (
    <div className="fade-in space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="text-gray-600 mt-1">Platform-wide security awareness metrics{period !== 'all' ? ` - Last ${periodLabel}` : ''}</p>
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
          label="Platform Avg Risk Score"
          value={avgRisk?.toFixed?.(1) ?? '0'}
          icon={AlertTriangle}
          color={riskColor}
          subtitle={`${overview?.total_employees || 0} employees assessed`}
        />
        <MetricCard
          label="Campaign Completion"
          value={formatPct(completionRate)}
          icon={Target}
          color="primary"
          subtitle={`${overview?.completed_campaigns || 0} of ${overview?.total_campaigns || 0} campaigns`}
        />
        <MetricCard
          label="Simulation Click Rate"
          value={formatPct(clickRate)}
          icon={MousePointerClick}
          color={clickColor}
          subtitle="Lower is better"
        />
        <MetricCard
          label="Training Completion"
          value={formatPct(trainingRate)}
          icon={BookOpen}
          color={trainingColor}
          subtitle={`${overview?.trainings_completed || 0} of ${overview?.total_trainings_assigned || 0} trainings`}
        />
      </div>

      {/* ── Charts Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Risk Score Trend */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Risk Score Trends</h3>
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
                  name="Avg Risk Score"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Campaign vs Simulation Activity</h3>
          {activityBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityBarData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip content={<ChartTooltip />} />
                <Legend />
                <Bar dataKey="completions" name="Campaign Completions" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="clicks" name="Simulation Clicks" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No activity data available
            </div>
          )}
        </div>

        {/* Chart 4: Top Performing Companies (Horizontal Bar) */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Companies</h3>
          {topCompaniesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={topCompaniesData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-white rounded-lg shadow-lg border p-3 text-sm">
                        <p className="font-medium">{d.fullName}</p>
                        <p>Risk Score: {d.score}</p>
                        <p>Users: {d.users}</p>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="score" name="Risk Score" radius={[0, 4, 4, 0]}>
                  {topCompaniesData.map((entry, i) => (
                    <Cell
                      key={i}
                      fill={entry.score <= 30 ? '#22c55e' : entry.score <= 60 ? '#eab308' : entry.score <= 80 ? '#f97316' : '#ef4444'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">
              No company data available
            </div>
          )}
        </div>
      </div>

      {/* ── Data Tables ── */}
      <div className="card p-0">
        {/* Tab Navigation */}
        <div className="flex border-b">
          {[
            { key: 'companies', label: 'Companies Overview' },
            { key: 'risk', label: 'Risk Insights' },
            { key: 'activity', label: 'Platform Activity' },
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
            <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="input ps-9 py-2 text-sm"
            />
          </div>
          <button
            onClick={handleExport}
            disabled={!!exporting}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Export CSV
          </button>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          {/* ── Tab 1: Companies Overview ── */}
          {activeTab === 'companies' && (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <SortHeader label="Company" sortKey="name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <SortHeader label="Users" sortKey="total_users" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">Avg Risk Score</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Industry</th>
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Status</th>
                  <SortHeader label="Created" sortKey="created_at" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {pagedData.length > 0 ? (
                  pagedData.map((c) => {
                    const risk = c.average_risk_score ?? c.avg_risk_score ?? null;
                    return (
                      <tr key={c.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center flex-shrink-0">
                              <Building2 className="h-4 w-4 text-primary-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{c.name}</p>
                              <p className="text-xs text-gray-400 truncate">{c.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-gray-900">{c.total_users || 0}</span>
                        </td>
                        <td className="px-4 py-3">
                          {risk != null ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div
                                  className={clsx('h-2 rounded-full transition-all', getRiskBarColor(risk))}
                                  style={{ width: `${Math.min(risk, 100)}%` }}
                                />
                              </div>
                              <span className={clsx('text-xs font-medium px-1.5 py-0.5 rounded-full', getRiskBg(risk))}>
                                {Math.round(risk)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">N/A</span>
                          )}
                        </td>
                        <td className="px-4 py-3 hidden lg:table-cell">
                          <span className="text-sm text-gray-600">{c.industry || '—'}</span>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={clsx(
                            'inline-flex items-center text-xs font-medium px-2 py-1 rounded-full',
                            c.is_active ? 'bg-success-50 text-success-700' : 'bg-gray-100 text-gray-600'
                          )}>
                            {c.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{formatDate(c.created_at)}</td>
                        <td className="px-4 py-3">
                          <a
                            href="/admin/companies"
                            className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                      {searchQuery ? 'No companies match your search' : 'No companies found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}

          {/* ── Tab 2: Risk Insights ── */}
          {activeTab === 'risk' && (
            <>
              {/* Risk summary cards */}
              <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 border-b">
                <div className="p-3 bg-danger-50 rounded-lg">
                  <p className="text-xs text-danger-600 font-medium">High Risk Companies</p>
                  <p className="text-xl font-bold text-danger-700 mt-1">
                    {companies.filter((c) => (c.average_risk_score ?? 0) > 60).length}
                  </p>
                  <p className="text-xs text-danger-500 mt-0.5">Avg risk score &gt; 60</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs text-orange-600 font-medium">Critical Risk Employees</p>
                  <p className="text-xl font-bold text-orange-700 mt-1">
                    {overview?.critical_risk_count || 0}
                  </p>
                  <p className="text-xs text-orange-500 mt-0.5">Risk score &gt; 80</p>
                </div>
                <div className="p-3 bg-warning-50 rounded-lg">
                  <p className="text-xs text-warning-600 font-medium">High Risk Employees</p>
                  <p className="text-xl font-bold text-warning-700 mt-1">
                    {overview?.high_risk_count || 0}
                  </p>
                  <p className="text-xs text-warning-500 mt-0.5">Risk score 60-80</p>
                </div>
                <div className="p-3 bg-success-50 rounded-lg">
                  <p className="text-xs text-success-600 font-medium">Low Risk Employees</p>
                  <p className="text-xl font-bold text-success-700 mt-1">
                    {overview?.low_risk_count || 0}
                  </p>
                  <p className="text-xs text-success-500 mt-0.5">Risk score &lt; 30</p>
                </div>
              </div>

              {/* High risk employees table */}
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <SortHeader label="Employee" sortKey="employee_name" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">Email</th>
                    <SortHeader label="Risk Score" sortKey="risk_score" currentSort={sortKey} currentDir={sortDir} onSort={handleSort} />
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase hidden md:table-cell">Phishing Clicks</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase hidden lg:table-cell">Credentials Entered</th>
                    <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase">Needs Training</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {pagedData.length > 0 ? (
                    pagedData.map((emp, idx) => (
                      <tr key={emp.employee_id || emp.id || idx} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-danger-50 flex items-center justify-center flex-shrink-0">
                              <AlertTriangle className="h-4 w-4 text-danger-500" />
                            </div>
                            <span className="font-medium text-gray-900">
                              {emp.employee_name || `${emp.first_name || ''} ${emp.last_name || ''}`.trim() || '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-600 text-sm">{emp.employee_email || emp.email || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={clsx('inline-flex px-2 py-0.5 rounded-full text-xs font-medium', getRiskBg(emp.risk_score))}>
                            {emp.risk_score} - {emp.risk_level || (emp.risk_score >= 80 ? 'CRITICAL' : 'HIGH')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden md:table-cell">
                          {emp.phishing_emails_missed || 0}
                        </td>
                        <td className="px-4 py-3 text-gray-600 hidden lg:table-cell">
                          {emp.credentials_entered || 0}
                        </td>
                        <td className="px-4 py-3">
                          {emp.requires_remediation ? (
                            <span className="text-danger-600 text-sm font-medium">Yes ({emp.trainings_pending || 0} pending)</span>
                          ) : (
                            <span className="text-success-600 text-sm">No</span>
                          )}
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
            </>
          )}

          {/* ── Tab 3: Platform Activity ── */}
          {activeTab === 'activity' && (
            <div className="divide-y">
              {pagedData.length > 0 ? (
                pagedData.map((item, idx) => {
                  const Icon = item.icon || Activity;
                  return (
                    <div key={idx} className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors">
                      <div className={clsx('p-2 rounded-lg flex-shrink-0', item.iconBg || 'bg-gray-100')}>
                        <Icon className={clsx('h-4 w-4', item.iconText || 'text-gray-600')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                          <span className={clsx(
                            'text-xs px-2 py-0.5 rounded-full font-medium',
                            item.type === 'CAMPAIGN' ? 'bg-primary-50 text-primary-700' :
                            item.type === 'SIMULATION' ? 'bg-warning-50 text-warning-700' :
                            'bg-success-50 text-success-700'
                          )}>
                            {item.type}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>
                      </div>
                      <div className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                        {item.timestamp ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true }) : '—'}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="px-4 py-8 text-center text-gray-500">
                  {searchQuery ? 'No activity matches your search' : 'No recent activity'}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Pagination */}
        <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
      </div>

      {/* ── Export Reports Section ── */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
        <div className="flex flex-wrap gap-3">
          {[
            { key: 'companies', label: 'Export Companies', handler: handleExportCompanies },
            { key: 'risk', label: 'Export Risk Data', handler: handleExportRisk },
            { key: 'activity', label: 'Export Activity', handler: handleExportActivity },
          ].map((btn) => (
            <button
              key={btn.key}
              onClick={btn.handler}
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
    </div>
  );
}

export default PlatformAnalytics;
