import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { BookOpen, Clock, CheckCircle, AlertCircle, Play } from 'lucide-react';
import clsx from 'clsx';

function EmployeeQuizzes() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [quizzes, setQuizzes] = useState([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    // Fetch quizzes from API
    const fetchQuizzes = async () => {
      try {
        // Placeholder data
        setQuizzes([
          { id: 1, name: 'Phishing Awareness Basics', questions: 10, timeLimit: 15, status: 'completed', score: 85, passingScore: 70 },
          { id: 2, name: 'Email Security Quiz', questions: 15, timeLimit: 20, status: 'pending', passingScore: 70 },
          { id: 3, name: 'Social Engineering Detection', questions: 12, timeLimit: 18, status: 'in_progress', passingScore: 75 },
          { id: 4, name: 'Password Best Practices', questions: 8, timeLimit: 10, status: 'completed', score: 100, passingScore: 70 },
          { id: 5, name: 'Safe Browsing Habits', questions: 10, timeLimit: 15, status: 'pending', passingScore: 70 },
        ]);
      } catch (error) {
        console.error('Error fetching quizzes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();
  }, []);

  const filteredQuizzes = quizzes.filter((quiz) => {
    if (filter === 'all') return true;
    return quiz.status === filter;
  });

  const getStatusBadge = (status, score, passingScore) => {
    if (status === 'completed') {
      const passed = score >= passingScore;
      return (
        <span className={clsx(
          'flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full',
          passed ? 'bg-success-50 text-success-700' : 'bg-danger-50 text-danger-700'
        )}>
          {passed ? <CheckCircle className="h-3 w-3" /> : <AlertCircle className="h-3 w-3" />}
          {passed ? t('quiz.passed') : t('quiz.failed')} ({score}%)
        </span>
      );
    }
    if (status === 'in_progress') {
      return (
        <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-primary-50 text-primary-700">
          <Play className="h-3 w-3" />
          {t('training.inProgress')}
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
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
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {['all', 'pending', 'in_progress', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={clsx(
              'px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              filter === status
                ? 'bg-primary-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            )}
          >
            {status === 'all' ? t('common.all') : status === 'in_progress' ? t('training.inProgress') : status === 'pending' ? t('training.notStarted') : t('training.completed')}
          </button>
        ))}
      </div>

      {/* Quiz List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQuizzes.map((quiz) => (
          <div key={quiz.id} className="card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 rounded-lg bg-primary-100">
                <BookOpen className="h-6 w-6 text-primary-600" />
              </div>
              {getStatusBadge(quiz.status, quiz.score, quiz.passingScore)}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{quiz.name}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
              <span>{quiz.questions} {t('quiz.questions')}</span>
              <span>•</span>
              <span><Clock className="h-4 w-4 inline mr-1" />{quiz.timeLimit} min</span>
            </div>
            <Link
              to={`/employee/quizzes/${quiz.id}`}
              className={clsx(
                'btn w-full',
                quiz.status === 'completed'
                  ? 'btn-secondary'
                  : 'btn-primary'
              )}
            >
              {quiz.status === 'completed' ? t('common.view') : quiz.status === 'in_progress' ? 'Continue' : t('quiz.startQuiz')}
            </Link>
          </div>
        ))}
      </div>

      {filteredQuizzes.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">{t('common.noData')}</p>
        </div>
      )}
    </div>
  );
}

export default EmployeeQuizzes;
