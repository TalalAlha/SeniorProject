import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Target, Clock, CheckCircle, Play, AlertCircle, Calendar, RefreshCw, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import clsx from 'clsx';
import { trainingAPI } from '../../api';

// Status constants matching backend
const TRAINING_STATUS = {
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
};

function EmployeeTraining() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [trainings, setTrainings] = useState([]);
  const [filter, setFilter] = useState('all');

  const fetchTrainings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await trainingAPI.getMyTrainings();
      const data = response.data.results || response.data;
      setTrainings(Array.isArray(data) ? data : []);
    } catch (err) {
      const message = err.response?.data?.detail || 'Failed to load training modules';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrainings();
  }, []);

  const filteredTrainings = trainings.filter((training) => {
    if (filter === 'all') return true;
    if (filter === TRAINING_STATUS.COMPLETED) {
      return [TRAINING_STATUS.COMPLETED, TRAINING_STATUS.PASSED, TRAINING_STATUS.FAILED].includes(training.status);
    }
    return training.status === filter;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case TRAINING_STATUS.COMPLETED:
      case TRAINING_STATUS.PASSED:
        return (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-success-50 text-success-700">
            <CheckCircle className="h-3 w-3" />
            {status === TRAINING_STATUS.PASSED ? 'Passed' : t('training.completed')}
          </span>
        );
      case TRAINING_STATUS.FAILED:
        return (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-danger-50 text-danger-700">
            <XCircle className="h-3 w-3" />
            Failed
          </span>
        );
      case TRAINING_STATUS.IN_PROGRESS:
        return (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
            <Play className="h-3 w-3" />
            {t('training.inProgress')}
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-700">
            <Clock className="h-3 w-3" />
            {t('training.notStarted')}
          </span>
        );
    }
  };

  const getButtonConfig = (status) => {
    switch (status) {
      case TRAINING_STATUS.COMPLETED:
      case TRAINING_STATUS.PASSED:
        return { text: 'Review', className: 'btn-secondary', showIcon: false };
      case TRAINING_STATUS.FAILED:
        return { text: 'Retry', className: 'btn-primary', showIcon: true };
      case TRAINING_STATUS.IN_PROGRESS:
        return { text: 'Continue', className: 'btn-primary', showIcon: true };
      default:
        return { text: 'Start', className: 'btn-primary', showIcon: true };
    }
  };

  const formatDueDate = (dueDate) => {
    if (!dueDate) return null;
    const date = new Date(dueDate);
    const now = new Date();
    const diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: 'Overdue', className: 'text-danger-600' };
    } else if (diffDays === 0) {
      return { text: 'Due today', className: 'text-warning-600' };
    } else if (diffDays <= 3) {
      return { text: `Due in ${diffDays} day${diffDays > 1 ? 's' : ''}`, className: 'text-warning-600' };
    } else {
      return { text: `Due ${date.toLocaleDateString()}`, className: 'text-gray-500' };
    }
  };

  const getAssignmentReasonLabel = (reason) => {
    const reasons = {
      AUTO_HIGH_RISK: 'High Risk',
      AUTO_PHISHING_CLICK: 'Phishing Click',
      MANUAL: 'Assigned',
      CAMPAIGN: 'Campaign',
    };
    return reasons[reason] || reason;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading training modules...</p>
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
          onClick={fetchTrainings}
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
          <h1 className="text-2xl font-bold text-gray-900">{t('training.title')}</h1>
          <p className="text-gray-600 mt-1">Complete training modules to improve your security awareness</p>
        </div>
        <button
          onClick={fetchTrainings}
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
          { key: TRAINING_STATUS.ASSIGNED, label: t('training.notStarted') },
          { key: TRAINING_STATUS.IN_PROGRESS, label: t('training.inProgress') },
          { key: TRAINING_STATUS.COMPLETED, label: t('training.completed') },
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

      {/* Training List */}
      {filteredTrainings.length > 0 ? (
        <div className="space-y-4">
          {filteredTrainings.map((training, index) => {
            const module = training.training_module;
            const buttonConfig = getButtonConfig(training.status);
            const dueInfo = formatDueDate(training.due_date);
            const isCompleted = [TRAINING_STATUS.COMPLETED, TRAINING_STATUS.PASSED].includes(training.status);

            return (
              <div key={training.id} className="card-hover">
                <div className="flex items-center gap-4">
                  {/* Status Icon */}
                  <div className={clsx(
                    'w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0',
                    isCompleted && 'bg-success-100',
                    training.status === TRAINING_STATUS.IN_PROGRESS && 'bg-primary-100',
                    training.status === TRAINING_STATUS.FAILED && 'bg-danger-100',
                    training.status === TRAINING_STATUS.ASSIGNED && 'bg-gray-100'
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-success-600" />
                    ) : training.status === TRAINING_STATUS.FAILED ? (
                      <XCircle className="h-6 w-6 text-danger-600" />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">{index + 1}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 truncate">
                        {module?.title || `Training #${training.id}`}
                      </h3>
                      {getStatusBadge(training.status)}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {module?.duration_minutes && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {module.duration_minutes} min
                        </span>
                      )}

                      {dueInfo && !isCompleted && (
                        <span className={clsx('flex items-center gap-1', dueInfo.className)}>
                          <Calendar className="h-4 w-4" />
                          {dueInfo.text}
                        </span>
                      )}

                      {training.assignment_reason && (
                        <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                          {getAssignmentReasonLabel(training.assignment_reason)}
                        </span>
                      )}

                      {training.quiz_score !== null && (
                        <span className={clsx(
                          'font-medium',
                          training.quiz_score >= 70 ? 'text-success-600' : 'text-danger-600'
                        )}>
                          Score: {training.quiz_score}%
                        </span>
                      )}
                    </div>

                    {/* Progress indicator for content viewed */}
                    {training.status === TRAINING_STATUS.IN_PROGRESS && training.content_viewed && (
                      <p className="text-xs text-primary-600 mt-1">Content viewed - Quiz pending</p>
                    )}
                  </div>

                  {/* Action Button */}
                  <Link
                    to={`/employee/training/${training.id}`}
                    className={clsx('btn flex items-center gap-2 flex-shrink-0', buttonConfig.className)}
                  >
                    {buttonConfig.text}
                    {buttonConfig.showIcon && <Play className="h-4 w-4" />}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No training modules found</h3>
          <p className="text-gray-500">
            {filter === 'all'
              ? 'You have no training modules assigned yet.'
              : `No training modules with status "${filter.replace('_', ' ').toLowerCase()}".`}
          </p>
        </div>
      )}
    </div>
  );
}

export default EmployeeTraining;
