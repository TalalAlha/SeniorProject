import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  BookOpen,
  Target,
  Award,
  Clock,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../../contexts';
import { analyticsAPI, quizzesAPI, trainingAPI } from '../../api';
import clsx from 'clsx';

function StatCard({ title, value, icon: Icon, trend, trendValue, color = 'primary' }) {
  const colorClasses = {
    primary: 'bg-primary-100 text-primary-600',
    success: 'bg-success-50 text-success-600',
    warning: 'bg-warning-50 text-warning-600',
    danger: 'bg-danger-50 text-danger-600',
  };

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {trend && (
            <div className="flex items-center mt-2">
              {trend === 'up' ? (
                <TrendingUp className="h-4 w-4 text-success-500 mr-1" />
              ) : (
                <TrendingDown className="h-4 w-4 text-danger-500 mr-1" />
              )}
              <span
                className={clsx(
                  'text-sm',
                  trend === 'up' ? 'text-success-600' : 'text-danger-600'
                )}
              >
                {trendValue}
              </span>
            </div>
          )}
        </div>
        <div className={clsx('p-3 rounded-lg', colorClasses[color])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function EmployeeDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Fetch dashboard data
    const fetchData = async () => {
      try {
        // In a real app, you'd fetch this from the API
        // const response = await analyticsAPI.getDashboardStats();
        // setStats(response.data);

        // Placeholder data for now
        setStats({
          riskScore: 35,
          completedQuizzes: 8,
          totalQuizzes: 12,
          completedTraining: 5,
          totalTraining: 8,
          badges: 3,
          points: 1250,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getRiskLevel = (score) => {
    if (score <= 30) return { label: t('employee.riskLevels.low'), color: 'success' };
    if (score <= 60) return { label: t('employee.riskLevels.medium'), color: 'warning' };
    return { label: t('employee.riskLevels.high'), color: 'danger' };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const riskLevel = getRiskLevel(stats?.riskScore || 0);

  return (
    <div className="fade-in space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('dashboard.welcome')}, {user?.first_name}!
        </h1>
        <p className="text-gray-600 mt-1">
          Here's an overview of your security awareness progress.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.riskScore')}
          value={`${stats?.riskScore}%`}
          icon={AlertTriangle}
          color={riskLevel.color}
        />
        <StatCard
          title={t('dashboard.completedQuizzes')}
          value={`${stats?.completedQuizzes}/${stats?.totalQuizzes}`}
          icon={BookOpen}
          color="primary"
          trend="up"
          trendValue="+2 this week"
        />
        <StatCard
          title={t('dashboard.completedTraining')}
          value={`${stats?.completedTraining}/${stats?.totalTraining}`}
          icon={Target}
          color="success"
        />
        <StatCard
          title={t('nav.badges')}
          value={stats?.badges}
          icon={Award}
          color="warning"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Assigned Tasks */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.assignedTasks')}
            </h2>
            <Link
              to="/employee/quizzes"
              className="text-primary-600 hover:text-primary-700 text-sm font-medium"
            >
              {t('common.view')} {t('common.all')}
            </Link>
          </div>
          <div className="space-y-4">
            {[
              { name: 'Phishing Awareness Quiz', type: 'Quiz', due: '2 days', status: 'pending' },
              { name: 'Email Security Training', type: 'Training', due: '5 days', status: 'in_progress' },
              { name: 'Social Engineering Test', type: 'Quiz', due: '1 week', status: 'pending' },
            ].map((task, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={clsx(
                      'p-2 rounded-lg',
                      task.type === 'Quiz' ? 'bg-primary-100' : 'bg-success-50'
                    )}
                  >
                    {task.type === 'Quiz' ? (
                      <BookOpen className="h-5 w-5 text-primary-600" />
                    ) : (
                      <Target className="h-5 w-5 text-success-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{task.name}</p>
                    <p className="text-sm text-gray-500">
                      <Clock className="h-3 w-3 inline mr-1" />
                      Due in {task.due}
                    </p>
                  </div>
                </div>
                <span
                  className={clsx(
                    'text-xs font-medium px-2 py-1 rounded-full',
                    task.status === 'pending'
                      ? 'bg-warning-50 text-warning-700'
                      : 'bg-primary-50 text-primary-700'
                  )}
                >
                  {task.status === 'pending' ? 'Pending' : 'In Progress'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.recentActivity')}
            </h2>
          </div>
          <div className="space-y-4">
            {[
              { action: 'Completed Quiz', item: 'Password Security', time: '2 hours ago', icon: CheckCircle, color: 'success' },
              { action: 'Started Training', item: 'Phishing Detection', time: '1 day ago', icon: Target, color: 'primary' },
              { action: 'Earned Badge', item: 'Quick Learner', time: '2 days ago', icon: Award, color: 'warning' },
              { action: 'Completed Quiz', item: 'Basic Security', time: '3 days ago', icon: CheckCircle, color: 'success' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center gap-3">
                <div
                  className={clsx(
                    'p-2 rounded-lg',
                    activity.color === 'success' && 'bg-success-50',
                    activity.color === 'primary' && 'bg-primary-100',
                    activity.color === 'warning' && 'bg-warning-50'
                  )}
                >
                  <activity.icon
                    className={clsx(
                      'h-5 w-5',
                      activity.color === 'success' && 'text-success-600',
                      activity.color === 'primary' && 'text-primary-600',
                      activity.color === 'warning' && 'text-warning-600'
                    )}
                  />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{activity.action}</p>
                  <p className="text-xs text-gray-500">{activity.item}</p>
                </div>
                <span className="text-xs text-gray-400">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          to="/employee/quizzes"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary-100">
              <BookOpen className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('quiz.takeQuiz')}</p>
              <p className="text-sm text-gray-500">4 quizzes available</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/employee/training"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-success-50">
              <Target className="h-6 w-6 text-success-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('training.continueTraining')}</p>
              <p className="text-sm text-gray-500">3 modules in progress</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>

        <Link
          to="/employee/badges"
          className="card-hover flex items-center justify-between group"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-warning-50">
              <Award className="h-6 w-6 text-warning-600" />
            </div>
            <div>
              <p className="font-medium text-gray-900">{t('nav.leaderboard')}</p>
              <p className="text-sm text-gray-500">Rank #12 in company</p>
            </div>
          </div>
          <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
        </Link>
      </div>
    </div>
  );
}

export default EmployeeDashboard;
