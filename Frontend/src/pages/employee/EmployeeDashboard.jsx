/**
 * EmployeeDashboard — Main landing page for employees (/employee/dashboard).
 *
 * Displays a personalised security awareness overview:
 *  - Risk score gauge (0–100) with colour-coded level (Low / Medium / High / Critical)
 *  - Quick-stat cards: pending quizzes, pending training, badges earned, leaderboard rank
 *  - Score breakdown: quiz accuracy vs simulation click rate
 *  - Recent badges earned (up to 3, with link to full badges page)
 *  - Quick action links to Quizzes, Training, Leaderboard, and Badges pages
 *
 * Note: RISK_CONFIG is defined outside the component using the labelKey pattern so that
 * translation keys can be resolved inside the RiskScoreGauge sub-component via t().
 *
 * Data sources:
 *   GET /api/v1/training/my-risk-score/   → RiskScore (quiz/simulation/training stats)
 *   GET /api/v1/gamification/my-badges/   → earned badges list
 *   GET /api/v1/gamification/leaderboard/ → leaderboard position
 *
 * Requires EMPLOYEE role.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  Target,
  Award,
  Trophy,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts';
import { trainingAPI, campaignsAPI, gamificationAPI } from '../../api';
import HelpTooltip from '../../components/common/HelpTooltip';
import clsx from 'clsx';
import { useTheme } from '../../contexts/ThemeContext';

// Risk score configuration
const RISK_CONFIG = {
  LOW: { min: 0, max: 30, labelKey: 'dashboard.riskLevels.low', color: 'success', bgColor: 'bg-success-500', textColor: 'text-success-600' },
  MEDIUM: { min: 31, max: 60, labelKey: 'dashboard.riskLevels.medium', color: 'warning', bgColor: 'bg-warning-500', textColor: 'text-warning-600' },
  HIGH: { min: 61, max: 80, labelKey: 'dashboard.riskLevels.high', color: 'orange', bgColor: 'bg-orange-500', textColor: 'text-orange-600' },
  CRITICAL: { min: 81, max: 100, labelKey: 'dashboard.riskLevels.critical', color: 'danger', bgColor: 'bg-danger-500', textColor: 'text-danger-600' },
};

// Circular Progress Gauge Component
function RiskScoreGauge({ score, riskLevel, requiresRemediation, isNewUser }) {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const radius = 80;
  const strokeWidth = 12;
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const config = RISK_CONFIG[riskLevel] || RISK_CONFIG.LOW;

  const getStrokeColor = () => {
    if (isNewUser) return '#9ca3af'; // gray for new users
    switch (riskLevel) {
      case 'LOW': return '#22c55e';
      case 'MEDIUM': return '#eab308';
      case 'HIGH': return '#f97316';
      case 'CRITICAL': return '#ef4444';
      default: return '#22c55e';
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg height={radius * 2} width={radius * 2} className="transform -rotate-90">
          {/* Background circle */}
          <circle
            stroke={isDark ? '#374151' : '#e5e7eb'}
            fill="transparent"
            strokeWidth={strokeWidth}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
          {/* Progress circle */}
          <circle
            stroke={getStrokeColor()}
            fill="transparent"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset, transition: 'stroke-dashoffset 0.5s ease-in-out' }}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={clsx('text-4xl font-bold', isNewUser ? 'text-gray-400 dark:text-gray-500' : config.textColor)}>{score}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">/ 100</span>
        </div>
      </div>
      <div className="mt-4 text-center">
        {isNewUser ? (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300">
            {t('dashboard.notYetEstablished')}
          </span>
        ) : (
          <span className={clsx('inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium',
            riskLevel === 'LOW' && 'bg-success-100 text-success-700',
            riskLevel === 'MEDIUM' && 'bg-warning-100 text-warning-700',
            riskLevel === 'HIGH' && 'bg-orange-100 text-orange-700',
            riskLevel === 'CRITICAL' && 'bg-danger-100 text-danger-700'
          )}>
            <AlertTriangle className="h-4 w-4" />
            {t(config.labelKey)}
          </span>
        )}
      </div>
      {isNewUser && (
        <p className="mt-3 text-sm text-gray-500 dark:text-gray-400 text-center">
          {t('dashboard.completeFirstQuiz')}
        </p>
      )}
      {requiresRemediation && !isNewUser && (
        <div className="mt-3 p-3 bg-danger-50 border border-danger-200 rounded-lg text-sm text-danger-700 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <span>{t('dashboard.actionRequired')}</span>
        </div>
      )}
    </div>
  );
}

// Quick Stat Card Component
function QuickStatCard({ title, value, subtitle, icon: Icon, color, linkTo, linkText }) {
  const colorClasses = {
    primary: 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400',
    success: 'bg-success-50 dark:bg-success-900/20 text-success-600 dark:text-success-400',
    warning: 'bg-warning-50 dark:bg-warning-900/20 text-warning-600 dark:text-warning-400',
    danger: 'bg-danger-50 dark:bg-danger-900/20 text-danger-600 dark:text-danger-400',
    purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">{title}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{value}</p>
      {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{subtitle}</p>}
      {linkTo && (
        <Link
          to={linkTo}
          className="mt-3 inline-flex items-center gap-1 text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          {linkText}
          <ArrowRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

function EmployeeDashboard() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const lang = i18n.language?.startsWith('ar') ? 'ar' : 'en';
  const localizedBadgeName = (badge) => {
    if (!badge) return '';
    return lang === 'ar' ? (badge.name_ar || badge.name || '') : (badge.name || '');
  };
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    riskScore: null,
    pendingQuizzes: 0,
    inProgressQuizzes: 0,
    pendingTraining: 0,
    earnedBadges: [],
    leaderboardPosition: null,
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel - handle risk score 404 gracefully
      const DEFAULT_RISK_SCORE = {
        score: 50,
        risk_level: 'MEDIUM',
        quiz_accuracy: 0,
        simulation_click_rate: 0,
        requires_remediation: false,
        is_new_user: true,
      };

      const [
        riskScoreRes,
        pendingQuizzesRes,
        inProgressQuizzesRes,
        pendingTrainingRes,
        badgesRes,
        positionRes,
      ] = await Promise.all([
        trainingAPI.getMyRiskScore().catch((err) => {
          // 404 means new user with no risk score yet - use defaults
          if (err.response?.status === 404) {
            return { data: DEFAULT_RISK_SCORE };
          }
          // Other errors - still don't block the dashboard
          return { data: DEFAULT_RISK_SCORE };
        }),
        campaignsAPI.getMyQuizzes({ status: 'NOT_STARTED' }).catch(() => ({ data: { results: [] } })),
        campaignsAPI.getMyQuizzes({ status: 'IN_PROGRESS' }).catch(() => ({ data: { results: [] } })),
        trainingAPI.getMyTrainings({ status: 'ASSIGNED' }).catch(() => ({ data: { results: [] } })),
        gamificationAPI.getMyBadges().catch(() => ({ data: { results: [] } })),
        gamificationAPI.getMyPosition().catch(() => ({ data: null })),
      ]);

      // Process data
      const pendingQuizzes = pendingQuizzesRes.data?.results || pendingQuizzesRes.data || [];
      const inProgressQuizzes = inProgressQuizzesRes.data?.results || inProgressQuizzesRes.data || [];
      const pendingTraining = pendingTrainingRes.data?.results || pendingTrainingRes.data || [];
      const badges = badgesRes.data?.results || badgesRes.data || [];

      setDashboardData({
        riskScore: riskScoreRes.data,
        pendingQuizzes: Array.isArray(pendingQuizzes) ? pendingQuizzes.length : 0,
        inProgressQuizzes: Array.isArray(inProgressQuizzes) ? inProgressQuizzes.length : 0,
        pendingTraining: Array.isArray(pendingTraining) ? pendingTraining.length : 0,
        earnedBadges: Array.isArray(badges) ? badges.slice(0, 3) : [],
        leaderboardPosition: positionRes.data,
      });
    } catch (err) {
      const message = err.response?.data?.detail || t('dashboard.loadingDashboard');
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('dashboard.loadingDashboard')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-300 mb-4">{error}</p>
        <button onClick={fetchDashboardData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  const { riskScore, pendingQuizzes, inProgressQuizzes, pendingTraining, earnedBadges, leaderboardPosition } = dashboardData;
  const weeklyRank = leaderboardPosition?.weekly?.rank;
  const weeklyPoints = leaderboardPosition?.weekly?.points || 0;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t('dashboard.welcome')}, {user?.first_name || 'there'}!
            </h1>
            <HelpTooltip i18nKey="tooltips.employeeDashboard" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-1">
            {t('dashboard.subtitle')}
          </p>
        </div>
        <button onClick={fetchDashboardData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.refresh')}
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Card - Large */}
        <div className="card lg:row-span-2">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.riskScore')}</h2>
            <AlertTriangle className={clsx('h-5 w-5',
              riskScore?.risk_level === 'LOW' && 'text-success-500',
              riskScore?.risk_level === 'MEDIUM' && 'text-warning-500',
              riskScore?.risk_level === 'HIGH' && 'text-orange-500',
              riskScore?.risk_level === 'CRITICAL' && 'text-danger-500',
              !riskScore?.risk_level && 'text-gray-400'
            )} />
          </div>

          <RiskScoreGauge
            score={riskScore?.score || 50}
            riskLevel={riskScore?.risk_level || 'MEDIUM'}
            requiresRemediation={riskScore?.requires_remediation}
            isNewUser={riskScore?.is_new_user}
          />

          {/* Score Breakdown */}
          {!riskScore?.is_new_user && (
            <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-700 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('analytics.quizAccuracy') || 'Quiz Accuracy'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(riskScore?.quiz_accuracy || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('analytics.simulationClickRate') || 'Simulation Click Rate'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {Math.round(riskScore?.simulation_click_rate || 0)}%
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('dashboard.quizzesTaken') || 'Quizzes Taken'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {riskScore?.total_quizzes_taken || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('dashboard.simulationsReceived') || 'Simulations Received'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {riskScore?.total_simulations_received || 0}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 dark:text-gray-400">{t('dashboard.trainingsCompleted') || 'Trainings Completed'}</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {riskScore?.trainings_completed || 0}
                  {riskScore?.trainings_assigned ? ` / ${riskScore.trainings_assigned}` : ''}
                </span>
              </div>
              {riskScore?.pending_trainings > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500 dark:text-gray-400">{t('dashboard.pendingTraining') || 'Pending Training'}</span>
                  <span className="font-medium text-warning-600 dark:text-warning-400">
                    {riskScore.pending_trainings}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats - 2x2 Grid */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          <QuickStatCard
            title={t('dashboard.pendingQuizzes')}
            value={pendingQuizzes + inProgressQuizzes}
            subtitle={inProgressQuizzes > 0 ? t('dashboard.inProgressCount', { count: inProgressQuizzes }) : null}
            icon={BookOpen}
            color="primary"
            linkTo="/employee/quizzes"
            linkText={t('quiz.takeQuiz')}
          />
          <QuickStatCard
            title={t('dashboard.pendingTraining')}
            value={pendingTraining}
            subtitle={t('dashboard.modulesAssigned')}
            icon={Target}
            color="success"
            linkTo="/employee/training"
            linkText={t('training.startTraining')}
          />
          <QuickStatCard
            title={t('dashboard.badgesEarned')}
            value={earnedBadges.length}
            subtitle={t('dashboard.achievementsUnlocked')}
            icon={Award}
            color="warning"
            linkTo="/employee/badges"
            linkText={t('admin.common.viewAll')}
          />
          <QuickStatCard
            title={t('dashboard.leaderboardRank')}
            value={weeklyRank ? `#${weeklyRank}` : '-'}
            subtitle={t('dashboard.pointsThisWeek', { count: weeklyPoints })}
            icon={Trophy}
            color="purple"
            linkTo="/employee/leaderboard"
            linkText={t('dashboard.viewRankings')}
          />
        </div>

        {/* Recent Badges */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('dashboard.recentBadges')}</h2>
            <Link
              to="/employee/badges"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
            >
              {t('admin.common.viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {earnedBadges.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {earnedBadges.map((item, index) => {
                const badge = item.badge || item;
                return (
                  <div
                    key={badge.id || index}
                    className="flex items-center gap-3 p-3 bg-gradient-to-r from-warning-50 to-warning-100 dark:from-warning-900/20 dark:to-warning-800/20 rounded-lg"
                  >
                    <div className="text-3xl">{badge.icon || '🏅'}</div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white truncate">{localizedBadgeName(badge)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {item.awarded_at ? t('dashboard.earnedOn', { date: formatDate(item.awarded_at) }) : t('dashboard.recentlyEarned')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Award className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
              <p>{t('dashboard.noBadgesYet')}</p>
              <p className="text-sm">{t('dashboard.completeForBadges')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/employee/quizzes"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100 dark:bg-primary-900/30">
              <BookOpen className="h-6 w-6 text-primary-600 dark:text-primary-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('quiz.takeQuiz')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pendingQuizzes + inProgressQuizzes > 0
                  ? t('dashboard.quizzesAvailable', { count: pendingQuizzes + inProgressQuizzes })
                  : t('dashboard.noQuizzesPending')}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/employee/training"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50 dark:bg-success-900/20">
              <Target className="h-6 w-6 text-success-600 dark:text-success-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('training.continueTraining')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {pendingTraining > 0
                  ? t('dashboard.modulesPending', { count: pendingTraining })
                  : t('dashboard.allTrainingComplete')}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/employee/leaderboard"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <Trophy className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{t('nav.leaderboard')}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {weeklyRank ? t('dashboard.rankThisWeek', { rank: weeklyRank }) : t('dashboard.viewRankings')}
              </p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
