/**
 * SimulationAnalytics — Per-simulation results page (/company/simulations/:id/analytics).
 *
 * Displays real-time analytics for a single phishing simulation campaign:
 *  - Summary cards: total sent, opened, clicked, reported
 *  - Click rate, report rate, no-action rate
 *  - Per-employee result table with status (clicked / reported / no action)
 *  - Filters: search by name/email, filter by result type
 *
 * Auto-refreshes every 15 seconds while the simulation is IN_PROGRESS.
 * Simulation ID is read from the :id URL parameter via useParams().
 *
 * Data source:
 *   GET /api/v1/simulations/campaigns/{id}/analytics/
 *
 * Requires COMPANY_ADMIN role.
 */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Mail,
  MousePointer,
  Flag,
  Clock,
  Users,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
} from 'lucide-react';
import clsx from 'clsx';
import { format, formatDistanceToNow } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { simulationsAPI } from '../../api';

// ─── helpers ────────────────────────────────────────────────────────────────

function RateBar({ value, color = 'bg-blue-500' }) {
  return (
    <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mt-1">
      <div
        className={clsx('h-2 rounded-full transition-all duration-500', color)}
        style={{ width: `${Math.min(100, value)}%` }}
      />
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-blue-100 dark:bg-blue-900/30', iconColor = 'text-blue-600 dark:text-blue-400', barValue, barColor }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <div className={clsx('p-2 rounded-lg', iconBg)}>
          <Icon className={clsx('w-5 h-5', iconColor)} />
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
      </div>
      <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{value}</p>
      {sub && <p className="text-sm text-gray-400 dark:text-gray-500">{sub}</p>}
      {barValue !== undefined && <RateBar value={barValue} color={barColor} />}
    </div>
  );
}

const STATUS_CONFIG = {
  PENDING:      { label: 'Pending',           color: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',   Icon: Clock },
  SENT:         { label: 'No Action (Safe)',  color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',   Icon: ShieldCheck },
  was_clicked:  { label: 'Clicked',           color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',     Icon: MousePointer },
  was_reported: { label: 'Reported',          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400', Icon: Flag },
};

function employeeStatusKey(r) {
  if (r.was_reported) return 'was_reported';
  if (r.was_clicked)  return 'was_clicked';
  return 'SENT'; // received but took no action — positive
}

function RiskBadge({ level }) {
  const colors = {
    LOW:      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    MEDIUM:   'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
    HIGH:     'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
    CRITICAL: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
  };
  const Icon = level === 'LOW' || level === 'MEDIUM' ? ShieldCheck : ShieldAlert;
  return (
    <span className={clsx('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium', colors[level] || 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300')}>
      <Icon className="w-3 h-3" />
      {level}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SimulationAnalytics() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [analytics, setAnalytics] = useState(null);
  const [results, setResults]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter]       = useState('ALL');

  const intervalRef = useRef(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    setError(null);
    try {
      const [analyticsRes, resultsRes] = await Promise.all([
        simulationsAPI.getAnalytics(id),
        simulationsAPI.getResults(id),
      ]);
      setAnalytics(analyticsRes.data);
      setResults(resultsRes.data);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load analytics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Auto-refresh every 15 seconds while campaign is active
    intervalRef.current = setInterval(() => fetchData(true), 15000);
    return () => clearInterval(intervalRef.current);
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-500 dark:text-gray-400">Loading analytics…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="w-12 h-12 text-red-400 dark:text-red-300 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={() => fetchData()} className="btn-primary">Retry</button>
      </div>
    );
  }

  const a = analytics || {};
  const r = results?.results || [];

  // ── Filter rows ──────────────────────────────────────────────────────────
  const filtered = r.filter((row) => {
    if (filter === 'ALL')     return true;
    if (filter === 'CLICKED') return row.was_clicked;
    if (filter === 'SAFE')    return !row.was_clicked;
    return true;
  });

  const total = a.total_sent || 0;

  return (
    <div className="fade-in space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <button
            onClick={() => navigate('/company/simulations')}
            className="flex items-center text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-100 mb-2 text-sm"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Simulations
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{a.campaign_name || 'Simulation Analytics'}</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {a.template_name}
            {a.attack_vector && <span className="mx-2">·</span>}
            {a.attack_vector}
            {a.difficulty   && <span className="mx-2">·</span>}
            {a.difficulty}
          </p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={clsx('h-4 w-4', refreshing && 'animate-spin')} />
          Refresh
        </button>
      </div>

      {/* Status badge */}
      {a.status && (
        <div className="flex items-center gap-2">
          <span className={clsx(
            'px-3 py-1 rounded-full text-sm font-medium',
            a.status === 'IN_PROGRESS' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' :
            a.status === 'COMPLETED'   ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400'   :
            'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          )}>
            {a.status === 'IN_PROGRESS' ? '🟢 Live – tracking in real time' : a.status}
          </span>
          {a.sent_at && (
            <span className="text-sm text-gray-400 dark:text-gray-500">
              Started {formatDistanceToNow(new Date(a.sent_at), { addSuffix: true })}
            </span>
          )}
        </div>
      )}

      {/* ── Stat Cards ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Mail}
          label="Emails Sent"
          value={a.total_sent ?? 0}
          sub={`of ${a.total_targeted ?? 0} targeted`}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400"
        />
        <StatCard
          icon={MousePointer}
          label="Clicked (Failed)"
          value={a.total_clicked ?? 0}
          sub={`${a.click_rate ?? 0}% click rate`}
          iconBg="bg-red-100 dark:bg-red-900/30" iconColor="text-red-600 dark:text-red-400"
          barValue={a.click_rate} barColor="bg-red-400"
        />
        <StatCard
          icon={ShieldCheck}
          label="No Action (Safe)"
          value={a.no_action_count ?? 0}
          sub={`${a.no_action_rate ?? 0}% cautious rate`}
          iconBg="bg-blue-100 dark:bg-blue-900/30" iconColor="text-blue-600 dark:text-blue-400"
          barValue={a.no_action_rate} barColor="bg-blue-400"
        />
      </div>

      {/* ── Employee Results Table ──────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Employee Results</h2>
            <span className="text-sm text-gray-400 dark:text-gray-500">({filtered.length} / {r.length})</span>
          </div>

          {/* Filter tabs */}
          <div className="flex gap-2 flex-wrap text-sm">
            {['ALL', 'CLICKED', 'SAFE'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1 rounded-full font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>{t('simulation.noResultsYet')}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Employee</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Risk</th>
                  <th className="px-5 py-3 text-left font-medium text-gray-500 dark:text-gray-400">Timeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {filtered.map((row) => {
                  const sk = employeeStatusKey(row);
                  const sc = STATUS_CONFIG[sk] || STATUS_CONFIG.SENT;
                  const { Icon: StatusIcon } = sc;

                  const latestTime =
                    row.reported_at || row.clicked_at || row.first_opened_at || row.sent_at;

                  return (
                    <tr key={row.employee_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      {/* Employee */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-semibold text-xs shrink-0">
                            {(row.employee_name || row.employee_email || '?')[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{row.employee_name || '—'}</p>
                            <p className="text-gray-400 dark:text-gray-500 text-xs">{row.employee_email}</p>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span className={clsx('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', sc.color)}>
                          <StatusIcon className="w-3.5 h-3.5 shrink-0" />
                          {sc.label}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="px-5 py-4">
                        <RiskBadge level={row.risk_level || 'LOW'} />
                      </td>

                      {/* Timeline */}
                      <td className="px-5 py-4 text-gray-500 dark:text-gray-400 text-xs">
                        {latestTime ? (
                          <div>
                            <p>{format(new Date(latestTime), 'dd MMM HH:mm')}</p>
                            {row.time_to_click_seconds && (
                              <p className="text-red-400 dark:text-red-300">
                                Clicked in {Math.round(row.time_to_click_seconds / 60)}m
                              </p>
                            )}
                            {row.was_reported && row.reported_at && (
                              <p className="text-green-600 dark:text-green-400">✓ Reported</p>
                            )}
                          </div>
                        ) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Rate Summary ─────────────────────────────────────────────────── */}
      {total > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary-600" />
            Rate Summary
          </h3>
          <div className="space-y-4">
            {[
              { label: 'Click Rate',     value: a.click_rate,     color: 'bg-red-400',  note: 'Clicked the phishing link – lower is better' },
              { label: 'No Action Rate', value: a.no_action_rate, color: 'bg-blue-400', note: 'Took no action – higher is better' },
            ].map(({ label, value, color, note }) => (
              <div key={label}>
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300 mb-1">
                  <span>{label} <span className="text-gray-400 dark:text-gray-500 text-xs">– {note}</span></span>
                  <span className="font-semibold">{value ?? 0}%</span>
                </div>
                <RateBar value={value ?? 0} color={color} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
