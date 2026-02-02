import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Award, Trophy, Star, Lock } from 'lucide-react';
import clsx from 'clsx';

function EmployeeBadges() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setBadges([
          { id: 1, name: 'Quick Learner', description: 'Completed first quiz', icon: '🎯', earned: true, date: '2024-01-15' },
          { id: 2, name: 'Security Novice', description: 'Completed 5 quizzes', icon: '🛡️', earned: true, date: '2024-01-20' },
          { id: 3, name: 'Perfect Score', description: 'Get 100% on a quiz', icon: '💯', earned: true, date: '2024-01-22' },
          { id: 4, name: 'Training Master', description: 'Complete all training', icon: '🏆', earned: false },
          { id: 5, name: 'Phishing Detective', description: 'Report 10 phishing emails', icon: '🔍', earned: false },
          { id: 6, name: 'Security Champion', description: 'Maintain low risk score', icon: '👑', earned: false },
        ]);
        setLeaderboard([
          { rank: 1, name: 'Ahmed Mohamed', points: 2500, avatar: 'AM' },
          { rank: 2, name: 'Sara Ali', points: 2350, avatar: 'SA' },
          { rank: 3, name: 'Omar Hassan', points: 2100, avatar: 'OH' },
          { rank: 4, name: 'Fatima Ibrahim', points: 1950, avatar: 'FI' },
          { rank: 5, name: 'You', points: 1250, avatar: 'ME', isCurrentUser: true },
        ]);
      } catch (error) {
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const earnedBadges = badges.filter(b => b.earned);
  const lockedBadges = badges.filter(b => !b.earned);

  return (
    <div className="fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">{t('nav.badges')} & {t('nav.leaderboard')}</h1>
        <p className="text-gray-600 mt-1">Track your achievements and see how you rank</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Badges Section */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earned Badges */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Award className="h-5 w-5 text-warning-500" />
              Earned Badges ({earnedBadges.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {earnedBadges.map((badge) => (
                <div key={badge.id} className="text-center p-4 bg-gradient-to-br from-warning-50 to-warning-100 rounded-lg">
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <h3 className="font-medium text-gray-900">{badge.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{badge.description}</p>
                  <p className="text-xs text-warning-600 mt-2">{badge.date}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Locked Badges */}
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Lock className="h-5 w-5 text-gray-400" />
              Badges to Unlock ({lockedBadges.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {lockedBadges.map((badge) => (
                <div key={badge.id} className="text-center p-4 bg-gray-50 rounded-lg opacity-60">
                  <div className="text-4xl mb-2 grayscale">{badge.icon}</div>
                  <h3 className="font-medium text-gray-600">{badge.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{badge.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="card h-fit">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-warning-500" />
            {t('nav.leaderboard')}
          </h2>
          <div className="space-y-3">
            {leaderboard.map((user) => (
              <div
                key={user.rank}
                className={clsx(
                  'flex items-center gap-3 p-3 rounded-lg',
                  user.isCurrentUser ? 'bg-primary-50 border border-primary-200' : 'bg-gray-50'
                )}
              >
                <span className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                  user.rank === 1 && 'bg-warning-400 text-white',
                  user.rank === 2 && 'bg-gray-300 text-white',
                  user.rank === 3 && 'bg-orange-400 text-white',
                  user.rank > 3 && 'bg-gray-100 text-gray-600'
                )}>
                  {user.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {user.avatar}
                </div>
                <div className="flex-1">
                  <p className={clsx('font-medium', user.isCurrentUser ? 'text-primary-700' : 'text-gray-900')}>
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">{user.points} pts</p>
                </div>
                {user.rank <= 3 && <Star className="h-5 w-5 text-warning-400" />}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmployeeBadges;
