import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, AlertCircle, Play, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { campaignsAPI } from '../../api';

// Status constants matching backend
const QUIZ_STATUS = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
};

function EmployeeQuizzes() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await campaignsAPI.getMyQuizzes();
      const data = response.data.results || response.data;
      setQuizzes(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load quizzes';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (filter === 'all') return true;
    return quiz.status === filter;
  });

  const getStatusBadge = (status, progressPercentage) => {
    if (status === QUIZ_STATUS.COMPLETED) {
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-success-50 text-success-700">
          <CheckCircle className="h-3 w-3" />
          {t('training.completed')}
        </span>
      );
    }
    if (status === QUIZ_STATUS.IN_PROGRESS) {
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
          <Play className="h-3 w-3" />
          {t('training.inProgress')} ({progressPercentage}%)
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
        <Clock className="h-3 w-3" />
        {t('training.notStarted')}
      </span>
    );
  };

  const getButtonText = (status) => {
    switch (status) {
      case QUIZ_STATUS.COMPLETED:
        return t('common.view');
      case QUIZ_STATUS.IN_PROGRESS:
        return 'Continue';
      default:
        return t('quiz.startQuiz');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading quizzes...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button
          onClick={fetchQuizzes}
          className="btn-primary flex items-center gap-2"
        >
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
          <h1 className="text-2xl font-bold text-gray-900">{t('quiz.title')}</h1>
          <p className="text-gray-600 mt-1">Complete quizzes to test your security knowledge</p>
        </div>
        <button
          onClick={fetchQuizzes}
          className="btn-secondary flex items-center gap-2 self-start"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: t('common.all') },
          { key: QUIZ_STATUS.NOT_STARTED, label: t('training.notStarted') },
          { key: QUIZ_STATUS.IN_PROGRESS, label: t('training.inProgress') },
          { key: QUIZ_STATUS.COMPLETED, label: t('training.completed') },
        ].map(({ key, label }) => (
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
            {label}
          </button>
        ))}
      </div>

      {/* Quiz List */}
      {filteredQuizzes.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="card-hover">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 rounded-lg bg-primary-100">
                  <BookOpen className="h-6 w-6 text-primary-600" />
                </div>
                {getStatusBadge(quiz.status, quiz.progress_percentage)}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {quiz.campaign_name || 'Security Quiz'}
              </h3>

              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span>{quiz.total_questions} {t('quiz.questions')}</span>
                {quiz.status === QUIZ_STATUS.IN_PROGRESS && (
                  <>
                    <span>•</span>
                    <span>
                      {quiz.current_question_index}/{quiz.total_questions} answered
                    </span>
                  </>
                )}
              </div>

              {/* Progress bar for in-progress quizzes */}
              {quiz.status === QUIZ_STATUS.IN_PROGRESS && (
                <div className="mb-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-primary-600 h-2 rounded-full transition-all"
                      style={{ width: `${quiz.progress_percentage}%` }}
                    />
                  </div>
                </div>
              )}

              <Link
                to={`/employee/quizzes/${quiz.id}`}
                className={clsx(
                  'btn w-full',
                  quiz.status === QUIZ_STATUS.COMPLETED
                    ? 'btn-secondary'
                    : 'btn-primary'
                )}
              >
                {getButtonText(quiz.status)}
              </Link>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'You have no quizzes assigned yet.'
              : `No quizzes with status "${filter.replace('_', ' ').toLowerCase()}".`}
          </p>
        </div>
      )}
    </div>
  );
}

export default EmployeeQuizzes;
