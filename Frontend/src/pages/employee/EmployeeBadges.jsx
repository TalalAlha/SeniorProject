import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Trophy, Star, Lock, RefreshCw, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { gamificationAPI } from '../../api';

// Rarity order and styling
const RARITY_CONFIG = {
  COMMON: { order: 1, label: 'Common', color: 'gray', bgClass: 'bg-gray-100', textClass: 'text-gray-600', borderClass: 'border-gray-300' },
  UNCOMMON: { order: 2, label: 'Uncommon', color: 'green', bgClass: 'bg-green-100', textClass: 'text-green-600', borderClass: 'border-green-300' },
  RARE: { order: 3, label: 'Rare', color: 'blue', bgClass: 'bg-blue-100', textClass: 'text-blue-600', borderClass: 'border-blue-300' },
  EPIC: { order: 4, label: 'Epic', color: 'purple', bgClass: 'bg-purple-100', textClass: 'text-purple-600', borderClass: 'border-purple-300' },
  LEGENDARY: { order: 5, label: 'Legendary', color: 'yellow', bgClass: 'bg-yellow-100', textClass: 'text-yellow-600', borderClass: 'border-yellow-400' },
};

function EmployeeBadges() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allBadges, setAllBadges] = useState([]);
  const [earnedBadgeIds, setEarnedBadgeIds] = useState(new Set());
  const [earnedBadgesData, setEarnedBadgesData] = useState({});
  const [leaderboard, setLeaderboard] = useState([]);
  const [filter, setFilter] = useState('all');
  const [selectedBadge, setSelectedBadge] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch all badges and earned badges in parallel
      const [allBadgesRes, myBadgesRes, leaderboardRes] = await Promise.all([
        gamificationAPI.getAllBadges(),
        gamificationAPI.getMyBadges(),
        gamificationAPI.getLeaderboard().catch(() => ({ data: { results: [] } })),
      ]);

      // Process all badges
      const allBadgesData = allBadgesRes.data.results || allBadgesRes.data || [];
      setAllBadges(Array.isArray(allBadgesData) ? allBadgesData : []);

      // Process earned badges
      const myBadgesData = myBadgesRes.data.results || myBadgesRes.data || [];
      const earnedIds = new Set();
      const earnedData = {};

      if (Array.isArray(myBadgesData)) {
        myBadgesData.forEach((item) => {
          const badgeId = item.badge?.id || item.id;
          earnedIds.add(badgeId);
          earnedData[badgeId] = {
            awarded_at: item.awarded_at,
            points_awarded: item.points_awarded,
            badge: item.badge || item,
          };
        });
      }

      setEarnedBadgeIds(earnedIds);
      setEarnedBadgesData(earnedData);

      // Process leaderboard
      const leaderboardData = leaderboardRes.data.results || leaderboardRes.data || [];
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load badges';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Combine badge data with earned status
  const processedBadges = allBadges.map((badge) => {
    const isEarned = earnedBadgeIds.has(badge.id);
    const earnedInfo = earnedBadgesData[badge.id];
    return {
      ...badge,
      earned: isEarned,
      awarded_at: earnedInfo?.awarded_at,
      points_awarded: earnedInfo?.points_awarded || badge.points_awarded,
    };
  });

  // Filter badges
  const filteredBadges = processedBadges.filter((badge) => {
    if (filter === 'all') return true;
    if (filter === 'earned') return badge.earned;
    if (filter === 'locked') return !badge.earned;
    return true;
  });

  // Group badges by rarity
  const groupedBadges = filteredBadges.reduce((groups, badge) => {
    const rarity = badge.rarity || 'COMMON';
    if (!groups[rarity]) {
      groups[rarity] = [];
    }
    groups[rarity].push(badge);
    return groups;
  }, {});

  // Sort rarity groups
  const sortedRarities = Object.keys(groupedBadges).sort(
    (a, b) => (RARITY_CONFIG[a]?.order || 99) - (RARITY_CONFIG[b]?.order || 99)
  );

  const earnedCount = processedBadges.filter((b) => b.earned).length;
  const lockedCount = processedBadges.filter((b) => !b.earned).length;

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading badges...</p>
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
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {t('nav.badges')} & {t('nav.leaderboard')}
          </h1>
          <p className="text-gray-600 mt-1">Track your achievements and see how you rank</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <Award className="h-8 w-8 text-warning-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{earnedCount}</p>
              <p className="text-sm text-gray-500">Earned</p>
            </div>
            <div className="card text-center">
              <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{lockedCount}</p>
              <p className="text-sm text-gray-500">Locked</p>
            </div>
            <div className="card text-center">
              <Trophy className="h-8 w-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900">{allBadges.length}</p>
              <p className="text-sm text-gray-500">Total</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: t('common.all'), count: processedBadges.length },
              { key: 'earned', label: 'Earned', count: earnedCount },
              { key: 'locked', label: 'Locked', count: lockedCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {label} ({count})
              </button>
            ))}
          </div>

          {/* Badges by Rarity */}
          {filteredBadges.length > 0 ? (
            <div className="space-y-6">
              {sortedRarities.map((rarity) => {
                const config = RARITY_CONFIG[rarity] || RARITY_CONFIG.COMMON;
                const badges = groupedBadges[rarity];

                return (
                  <div key={rarity} className="card">
                    <h2 className={clsx('text-lg font-semibold mb-4 flex items-center gap-2', config.textClass)}>
                      <Star className="h-5 w-5" />
                      {config.label} Badges ({badges.length})
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {badges.map((badge) => (
                        <button
                          key={badge.id}
                          onClick={() => setSelectedBadge(badge)}
                          className={clsx(
                            'text-center p-4 rounded-lg border-2 transition-all hover:scale-105 cursor-pointer',
                            badge.earned
                              ? `bg-gradient-to-br from-${config.color}-50 to-${config.color}-100 ${config.borderClass}`
                              : 'bg-gray-50 border-gray-200 opacity-60'
                          )}
                        >
                          <div className="relative inline-block">
                            <div className={clsx('text-4xl mb-2', !badge.earned && 'grayscale')}>
                              {badge.icon || '🏅'}
                            </div>
                            {!badge.earned && (
                              <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-gray-400 bg-white rounded-full p-0.5" />
                            )}
                          </div>
                          <h3 className={clsx('font-medium', badge.earned ? 'text-gray-900' : 'text-gray-500')}>
                            {badge.name}
                          </h3>
                          <p className="text-xs text-gray-400 mt-1 line-clamp-2">{badge.description}</p>
                          {badge.earned && badge.awarded_at && (
                            <p className={clsx('text-xs mt-2', config.textClass)}>
                              Earned {formatDate(badge.awarded_at)}
                            </p>
                          )}
                          {badge.points_awarded > 0 && (
                            <p className="text-xs text-gray-500 mt-1">+{badge.points_awarded} pts</p>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="card text-center py-12">
              <Award className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No badges found</h3>
              <p className="text-gray-500">
                {filter === 'earned'
                  ? 'You haven\'t earned any badges yet. Complete quizzes and training to earn badges!'
                  : filter === 'locked'
                  ? 'All badges have been unlocked!'
                  : 'No badges available.'}
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning-500" />
            {t('nav.leaderboard')}
          </h2>
          {leaderboard.length > 0 ? (
            <div className="space-y-3">
              {leaderboard.slice(0, 10).map((user, index) => (
                <div
                  key={user.id || index}
                  className={clsx(
                    'flex items-center gap-3 p-3 rounded-lg',
                    user.is_current_user ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                  )}
                >
                  <span
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      index === 0 && 'bg-warning-400 text-white',
                      index === 1 && 'bg-gray-300 text-white',
                      index === 2 && 'bg-orange-400 text-white',
                      index > 2 && 'bg-gray-100 text-gray-600'
                    )}
                  >
                    {user.rank || index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {user.avatar || user.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        'font-medium truncate',
                        user.is_current_user ? 'text-primary-700' : 'text-gray-900'
                      )}
                    >
                      {user.name || user.employee_name || 'Anonymous'}
                      {user.is_current_user && ' (You)'}
                    </p>
                    <p className="text-xs text-gray-500">{user.points || user.total_points || 0} pts</p>
                  </div>
                  {index < 3 && <Star className="h-5 w-5 text-warning-400" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>No leaderboard data available</p>
            </div>
          )}
        </div>
      </div>

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="text-center">
              <div
                className={clsx(
                  'text-6xl mb-4',
                  !selectedBadge.earned && 'grayscale opacity-50'
                )}
              >
                {selectedBadge.icon || '🏅'}
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{selectedBadge.name}</h3>

              <span
                className={clsx(
                  'inline-block px-3 py-1 rounded-full text-xs font-medium mb-4',
                  RARITY_CONFIG[selectedBadge.rarity]?.bgClass || 'bg-gray-100',
                  RARITY_CONFIG[selectedBadge.rarity]?.textClass || 'text-gray-600'
                )}
              >
                {RARITY_CONFIG[selectedBadge.rarity]?.label || 'Common'}
              </span>

              <p className="text-gray-600 mb-4">{selectedBadge.description}</p>

              <div className="flex justify-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-primary-600">{selectedBadge.points_awarded || 0}</p>
                  <p className="text-gray-500">Points</p>
                </div>
              </div>

              {selectedBadge.earned ? (
                <div className="mt-6 p-4 bg-success-50 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-success-700">
                    <Award className="h-5 w-5" />
                    <span className="font-medium">Badge Earned!</span>
                  </div>
                  {selectedBadge.awarded_at && (
                    <p className="text-sm text-success-600 mt-1">
                      on {formatDate(selectedBadge.awarded_at)}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 p-4 bg-gray-100 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">Badge Locked</span>
                  </div>
                  <p className="text-sm text-gray-400 mt-1">
                    Complete the requirements to unlock this badge
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EmployeeBadges;
