/**
 * EmployeeBadges — Gamification badges page for employees (/employee/badges).
 *
 * Displays the employee's badge collection:
 *  - Summary stats: earned count, locked count, total available
 *  - Filter tabs: All / Earned / Locked
 *  - Badges grouped by rarity (Common → Legendary) using RARITY_CONFIG
 *  - Each badge card shows rarity, points, earned date or lock state
 *  - Clicking a badge opens a modal with full details and unlock requirements
 *  - Sidebar leaderboard showing top badge earners in the company
 *
 * Note: RARITY_CONFIG uses the labelKey pattern (not label) so rarity names can be
 * translated inside the component via t(config.labelKey).
 *
 * Data sources:
 *   GET /api/v1/gamification/my-badges/   → earned and available badges
 *   GET /api/v1/gamification/leaderboard/ → company badge leaderboard
 *
 * Requires EMPLOYEE role.
 */
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Trophy, Star, Lock, RefreshCw, AlertCircle, X } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { gamificationAPI } from '../../api';

// Rarity order and styling
const RARITY_CONFIG = {
  COMMON: { order: 1, labelKey: 'badge.rarityCommon', color: 'gray', bgClass: 'bg-gray-100 dark:bg-gray-700', textClass: 'text-gray-600 dark:text-gray-300', borderClass: 'border-gray-300 dark:border-gray-600' },
  UNCOMMON: { order: 2, labelKey: 'badge.rarityUncommon', color: 'green', bgClass: 'bg-green-100 dark:bg-green-900/30', textClass: 'text-green-600 dark:text-green-400', borderClass: 'border-green-300 dark:border-green-600' },
  RARE: { order: 3, labelKey: 'badge.rarityRare', color: 'blue', bgClass: 'bg-blue-100 dark:bg-blue-900/30', textClass: 'text-blue-600 dark:text-blue-400', borderClass: 'border-blue-300 dark:border-blue-600' },
  EPIC: { order: 4, labelKey: 'badge.rarityEpic', color: 'purple', bgClass: 'bg-purple-100 dark:bg-purple-900/30', textClass: 'text-purple-600 dark:text-purple-400', borderClass: 'border-purple-300 dark:border-purple-600' },
  LEGENDARY: { order: 5, labelKey: 'badge.rarityLegendary', color: 'yellow', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30', textClass: 'text-yellow-600 dark:text-yellow-400', borderClass: 'border-yellow-400 dark:border-yellow-600' },
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
      const message = err.response?.data?.detail || t('badge.loadingBadges');
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
          <p className="mt-4 text-gray-600 dark:text-gray-300">{t('badge.loadingBadges')}</p>
        </div>
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
          {t('admin.common.tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('nav.badges')} & {t('nav.leaderboard')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 mt-1">{t('badge.subtitle')}</p>
        </div>
        <button onClick={fetchData} className="btn-secondary flex items-center gap-2 self-start">
          <RefreshCw className="h-4 w-4" />
          {t('admin.common.refresh')}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="card text-center">
              <Award className="h-8 w-8 text-warning-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{earnedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('badge.earned')}</p>
            </div>
            <div className="card text-center">
              <Lock className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{lockedCount}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('badge.locked')}</p>
            </div>
            <div className="card text-center">
              <Trophy className="h-8 w-8 text-primary-500 mx-auto mb-2" />
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{allBadges.length}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('badge.total')}</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: t('common.all'), count: processedBadges.length },
              { key: 'earned', label: t('badge.earned'), count: earnedCount },
              { key: 'locked', label: t('badge.locked'), count: lockedCount },
            ].map(({ key, label, count }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={clsx(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
                  filter === key
                    ? 'bg-primary-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
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
                      {t(config.labelKey)} {t('nav.badges')} ({badges.length})
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
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 opacity-60'
                          )}
                        >
                          <div className="relative inline-block">
                            <div className={clsx('text-4xl mb-2', !badge.earned && 'grayscale')}>
                              {badge.icon || '🏅'}
                            </div>
                            {!badge.earned && (
                              <Lock className="absolute -bottom-1 -right-1 h-4 w-4 text-gray-400 bg-white dark:bg-gray-800 rounded-full p-0.5" />
                            )}
                          </div>
                          <h3 className={clsx('font-medium', badge.earned ? 'text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400')}>
                            {badge.name}
                          </h3>
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 line-clamp-2">{badge.description}</p>
                          {badge.earned && badge.awarded_at && (
                            <p className={clsx('text-xs mt-2', config.textClass)}>
                              {t('badge.earnedOn', { date: formatDate(badge.awarded_at) })}
                            </p>
                          )}
                          {badge.points_awarded > 0 && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">+{badge.points_awarded} pts</p>
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
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('badge.noBadgesFound')}</h3>
              <p className="text-gray-500 dark:text-gray-400">
                {filter === 'earned'
                  ? t('badge.noBadgesEarned')
                  : filter === 'locked'
                  ? t('badge.allBadgesUnlocked')
                  : t('badge.noBadgesAvailable')}
              </p>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card h-fit">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
                    user.is_current_user ? 'bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-700' : 'bg-gray-50 dark:bg-gray-700'
                  )}
                >
                  <span
                    className={clsx(
                      'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                      index === 0 && 'bg-warning-400 text-white',
                      index === 1 && 'bg-gray-300 text-white',
                      index === 2 && 'bg-orange-400 text-white',
                      index > 2 && 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                    )}
                  >
                    {user.rank || index + 1}
                  </span>
                  <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-medium">
                    {user.avatar || user.name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={clsx(
                        'font-medium truncate',
                        user.is_current_user ? 'text-primary-700 dark:text-primary-300' : 'text-gray-900 dark:text-white'
                      )}
                    >
                      {user.name || user.employee_name || 'Anonymous'}
                      {user.is_current_user && ` ${t('badge.you')}`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.points || user.total_points || 0} pts</p>
                  </div>
                  {index < 3 && <Star className="h-5 w-5 text-warning-400" />}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Trophy className="h-8 w-8 text-gray-300 mx-auto mb-2" />
              <p>{t('badge.noLeaderboardData')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Badge Details Modal */}
      {selectedBadge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl dark:shadow-gray-900/50 max-w-md w-full p-6 relative">
            <button
              onClick={() => setSelectedBadge(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
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

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{selectedBadge.name}</h3>

              <span
                className={clsx(
                  'inline-block px-3 py-1 rounded-full text-xs font-medium mb-4',
                  RARITY_CONFIG[selectedBadge.rarity]?.bgClass || 'bg-gray-100',
                  RARITY_CONFIG[selectedBadge.rarity]?.textClass || 'text-gray-600'
                )}
              >
                {t(RARITY_CONFIG[selectedBadge.rarity]?.labelKey || 'badge.rarityCommon')}
              </span>

              <p className="text-gray-600 dark:text-gray-300 mb-4">{selectedBadge.description}</p>

              <div className="flex justify-center gap-4 text-sm">
                <div className="text-center">
                  <p className="font-bold text-primary-600 dark:text-primary-400">{selectedBadge.points_awarded || 0}</p>
                  <p className="text-gray-500 dark:text-gray-400">{t('badge.pointsLabel')}</p>
                </div>
              </div>

              {selectedBadge.earned ? (
                <div className="mt-6 p-4 bg-success-50 dark:bg-success-900/20 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-success-700 dark:text-success-300">
                    <Award className="h-5 w-5" />
                    <span className="font-medium">{t('badge.badgeEarned')}</span>
                  </div>
                  {selectedBadge.awarded_at && (
                    <p className="text-sm text-success-600 dark:text-success-400 mt-1">
                      {t('badge.earnedOnDate', { date: formatDate(selectedBadge.awarded_at) })}
                    </p>
                  )}
                </div>
              ) : (
                <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                    <Lock className="h-5 w-5" />
                    <span className="font-medium">{t('badge.badgeLocked')}</span>
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                    {t('badge.unlockRequirements')}
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
