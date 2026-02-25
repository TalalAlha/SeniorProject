import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Trophy, Medal, Award, RefreshCw, AlertCircle, TrendingUp, Users, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { gamificationAPI } from '../../api';

const PERIODS = {
  weekly: { key: 'weekly', label: 'Weekly' },
  monthly: { key: 'monthly', label: 'Monthly' },
  all_time: { key: 'all_time', label: 'All Time' },
};

function EmployeeLeaderboard() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('weekly');
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [myPosition, setMyPosition] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [leaderboardRes, positionRes] = await Promise.all([
        gamificationAPI.getLeaderboard({ period: selectedPeriod, limit: 50 }),
        gamificationAPI.getMyPosition().catch(() => ({ data: null })),
      ]);

      setLeaderboardData(leaderboardRes.data);
      setMyPosition(positionRes.data);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load leaderboard';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedPeriod]);

  const entries = leaderboardData?.entries || [];
  const totalParticipants = leaderboardData?.total_participants || 0;
  const userRank = leaderboardData?.user_rank || myPosition?.[selectedPeriod]?.rank;
  const userPoints = leaderboardData?.user_points || myPosition?.[selectedPeriod]?.points;

  const getInitials = (employee) => {
    if (!employee) return 'U';
    const first = employee.first_name?.[0] || '';
    const last = employee.last_name?.[0] || '';
    return (first + last).toUpperCase() || 'U';
  };

  const getFullName = (employee) => {
    if (!employee) return 'Anonymous';
    return `${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Anonymous';
  };

  const getRankStyle = (rank) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg';
      case 2:
        return 'bg-gradient-to-br from-gray-300 to-gray-500 text-white shadow-lg';
      case 3:
        return 'bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getRankIcon = (rank) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5" />;
      case 2:
        return <Medal className="h-5 w-5" />;
      case 3:
        return <Award className="h-5 w-5" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading leaderboard...</p>
        </div>
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
          <h1 className="text-2xl font-bold text-gray-900">{t('nav.leaderboard')}</h1>
          <p className="text-gray-600 mt-1">See how you rank against other employees</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Your Position Card */}
      {myPosition && (
        <div className="card bg-gradient-to-r from-primary-50 to-primary-100 border border-primary-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary-600" />
            Your Position
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {Object.entries(PERIODS).map(([key, { label }]) => {
              const position = myPosition[key];
              if (!position) return null;
              return (
                <div
                  key={key}
                  className={clsx(
                    'text-center p-4 rounded-lg transition-all cursor-pointer',
                    selectedPeriod === key
                      ? 'bg-white shadow-md border-2 border-primary-400'
                      : 'bg-white/50 hover:bg-white'
                  )}
                  onClick={() => setSelectedPeriod(key)}
                >
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className="text-2xl font-bold text-primary-600">#{position.rank || '-'}</p>
                  <p className="text-sm text-gray-600">{position.points || 0} pts</p>
                  <p className="text-xs text-gray-400">of {position.total || totalParticipants}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Period Tabs */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(PERIODS).map(([key, { label }]) => {
          const position = myPosition?.[key];
          return (
            <button
              key={key}
              onClick={() => setSelectedPeriod(key)}
              className={clsx(
                'px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2',
                selectedPeriod === key
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              )}
            >
              {label}
              {position?.rank && (
                <span
                  className={clsx(
                    'px-2 py-0.5 rounded-full text-xs',
                    selectedPeriod === key ? 'bg-primary-500 text-white' : 'bg-gray-200 text-gray-600'
                  )}
                >
                  #{position.rank}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card text-center">
          <Users className="h-6 w-6 text-primary-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{totalParticipants}</p>
          <p className="text-xs text-gray-500">Participants</p>
        </div>
        <div className="card text-center">
          <Trophy className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">#{userRank || '-'}</p>
          <p className="text-xs text-gray-500">Your Rank</p>
        </div>
        <div className="card text-center">
          <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{userPoints || 0}</p>
          <p className="text-xs text-gray-500">Your Points</p>
        </div>
        <div className="card text-center">
          <Award className="h-6 w-6 text-purple-500 mx-auto mb-2" />
          <p className="text-xl font-bold text-gray-900">{PERIODS[selectedPeriod].label}</p>
          <p className="text-xs text-gray-500">Period</p>
        </div>
      </div>

      {/* Top 3 Podium */}
      {entries.length >= 3 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-6 text-center">Top Performers</h2>
          <div className="flex items-end justify-center gap-4 mb-4">
            {/* 2nd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg">
                {getInitials(entries[1]?.employee)}
              </div>
              <div className="bg-gray-200 rounded-t-lg w-24 h-20 flex flex-col items-center justify-center">
                <Medal className="h-6 w-6 text-gray-500 mb-1" />
                <span className="text-xl font-bold text-gray-700">2</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 text-center truncate w-24">
                {getFullName(entries[1]?.employee)}
              </p>
              <p className="text-xs text-gray-500">{entries[1]?.points || 0} pts</p>
            </div>

            {/* 1st Place */}
            <div className="flex flex-col items-center -mt-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center text-white font-bold text-xl mb-2 shadow-xl ring-4 ring-yellow-200">
                {getInitials(entries[0]?.employee)}
              </div>
              <div className="bg-yellow-400 rounded-t-lg w-28 h-28 flex flex-col items-center justify-center">
                <Trophy className="h-8 w-8 text-yellow-700 mb-1" />
                <span className="text-2xl font-bold text-yellow-800">1</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 text-center truncate w-28">
                {getFullName(entries[0]?.employee)}
              </p>
              <p className="text-xs text-gray-500">{entries[0]?.points || 0} pts</p>
            </div>

            {/* 3rd Place */}
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-lg mb-2 shadow-lg">
                {getInitials(entries[2]?.employee)}
              </div>
              <div className="bg-orange-300 rounded-t-lg w-24 h-16 flex flex-col items-center justify-center">
                <Award className="h-5 w-5 text-orange-600 mb-1" />
                <span className="text-lg font-bold text-orange-700">3</span>
              </div>
              <p className="text-sm font-medium text-gray-900 mt-2 text-center truncate w-24">
                {getFullName(entries[2]?.employee)}
              </p>
              <p className="text-xs text-gray-500">{entries[2]?.points || 0} pts</p>
            </div>
          </div>
        </div>
      )}

      {/* Points Scoring Formula */}
      <div className="card bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200">
        <h2 className="text-base font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Info className="h-4 w-4 text-blue-500" />
          {t('leaderboard.howQuizPointsWork')}
        </h2>
        <div className="grid grid-cols-3 gap-3 text-center text-sm">
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-lg font-bold text-green-600">30</p>
            <p className="text-xs text-gray-500">{t('leaderboard.basePoints')}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-lg font-bold text-blue-600">+{t('leaderboard.scoreMultiplied')}</p>
            <p className="text-xs text-gray-500">{t('leaderboard.performanceBonus')}</p>
          </div>
          <div className="bg-white rounded-lg p-3 border border-blue-100">
            <p className="text-xs text-gray-600 leading-relaxed">
              {t('leaderboard.example')}: 80% = 30 + 56 = <span className="font-bold text-purple-600">86</span> {t('leaderboard.points')}
            </p>
          </div>
        </div>
      </div>

      {/* Full Leaderboard */}
      <div className="card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-warning-500" />
          {PERIODS[selectedPeriod].label} Rankings
        </h2>

        {entries.length > 0 ? (
          <div className="space-y-2">
            {entries.map((entry, index) => {
              const rank = entry.rank || index + 1;
              const isCurrentUser = entry.is_current_user || entry.employee?.is_current_user;

              return (
                <div
                  key={entry.employee?.id || index}
                  className={clsx(
                    'flex items-center gap-4 p-4 rounded-lg transition-all',
                    isCurrentUser
                      ? 'bg-primary-50 border-2 border-primary-300 shadow-sm'
                      : rank <= 3
                      ? 'bg-gradient-to-r from-gray-50 to-transparent'
                      : 'bg-gray-50 hover:bg-gray-100'
                  )}
                >
                  {/* Rank */}
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm',
                      getRankStyle(rank)
                    )}
                  >
                    {getRankIcon(rank) || rank}
                  </div>

                  {/* Avatar */}
                  <div
                    className={clsx(
                      'w-12 h-12 rounded-full flex items-center justify-center font-medium text-lg',
                      isCurrentUser
                        ? 'bg-primary-200 text-primary-700'
                        : 'bg-gray-200 text-gray-600'
                    )}
                  >
                    {getInitials(entry.employee)}
                  </div>

                  {/* Name & Email */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        'font-medium truncate',
                        isCurrentUser ? 'text-primary-700' : 'text-gray-900'
                      )}
                    >
                      {getFullName(entry.employee)}
                      {isCurrentUser && <span className="text-primary-500 ml-2">(You)</span>}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {entry.employee?.email || ''}
                    </p>
                  </div>

                  {/* Badges */}
                  {entry.badge_count > 0 && (
                    <div className="hidden sm:flex items-center gap-1 text-gray-500">
                      <Award className="h-4 w-4" />
                      <span className="text-sm">{entry.badge_count}</span>
                    </div>
                  )}

                  {/* Points */}
                  <div className="text-right">
                    <p className={clsx('font-bold', isCurrentUser ? 'text-primary-600' : 'text-gray-900')}>
                      {entry.points || 0}
                    </p>
                    <p className="text-xs text-gray-500">points</p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No rankings yet</h3>
            <p className="text-gray-500">
              Complete quizzes and training to appear on the leaderboard!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default EmployeeLeaderboard;
