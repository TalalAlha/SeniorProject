/**
 * TakeTraining — Interactive training module page for employees (/employee/training/:id).
 *
 * Shows the interactive lesson for the assigned remediation training. The
 * lesson component (PhishAware V4-V6 employee variants) drives the entire
 * flow including its own internal quiz; completion is reported back via the
 * onComplete callback wired through InteractiveLessonWrapper.
 *
 * If the assignment is already in PASSED / FAILED / COMPLETED status, a
 * results summary is shown instead of re-running the lesson.
 *
 * Training ID is read from the :id URL parameter via useParams().
 *
 * API calls:
 *   GET  /api/v1/training/my-assignments/{id}/         → training + module details
 *   POST /api/v1/training/my-assignments/{id}/start/   → mark as IN_PROGRESS
 *   (interactive completion endpoints are called from InteractiveLessonWrapper)
 *
 * Requires EMPLOYEE role.
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, CheckCircle, XCircle, AlertCircle, RefreshCw, Award,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { trainingAPI } from '../../api';
import InteractiveLessonWrapper from '../../components/training/InteractiveLessonWrapper';

// Interactive components – employee portal
import PhishAwareV4AR from '../../components/training/interactive/employee/PhishAware_V4_AR';
import PhishAwareV4EN from '../../components/training/interactive/employee/PhishAware_V4_EN';
import PhishAwareV5AR from '../../components/training/interactive/employee/PhishAware_V5_AR';
import PhishAwareV5EN from '../../components/training/interactive/employee/PhishAware_V5_EN';
import PhishAwareV6AR from '../../components/training/interactive/employee/PhishAware_V6_AR';
import PhishAwareV6EN from '../../components/training/interactive/employee/PhishAware_V6_EN';

// Maps TrainingModule.category → interactive lesson type
const CATEGORY_TO_LESSON = {
  EMAIL_SECURITY: 'phishing',
  SOCIAL_ENGINEERING: 'vishing',
  MOBILE_SECURITY: 'smishing',
};

const interactiveMap = {
  phishing: { ar: PhishAwareV4AR, en: PhishAwareV4EN },
  vishing:  { ar: PhishAwareV5AR, en: PhishAwareV5EN },
  smishing: { ar: PhishAwareV6AR, en: PhishAwareV6EN },
};

function TakeTraining() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [quizResult, setQuizResult] = useState(null);

  const fetchAssignment = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await trainingAPI.getAssignment(id);
      const data = res.data;
      setAssignment(data);

      // Auto-start if status is ASSIGNED
      if (data.status === 'ASSIGNED') {
        try {
          await trainingAPI.startTraining(id);
        } catch {
          // May fail if already started, ignore
        }
      }

      // If already completed, prepare the results view
      if (['PASSED', 'FAILED', 'COMPLETED'].includes(data.status)) {
        setQuizResult({
          score: parseFloat(data.quiz_score) || 0,
          passed: data.passed,
          correct: data.correct_answers || 0,
          total: data.total_questions || 0,
          passing_score: data.training_module?.passing_score || 80,
        });
      }
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to load training');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchAssignment();
  }, [fetchAssignment]);

  // Helper to get bilingual text
  const getModuleField = (field, fieldAr) => {
    const module = assignment?.training_module;
    if (!module) return '';
    return isAr && module[fieldAr] ? module[fieldAr] : module[field];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">{t('training.startTraining')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
        <div className="flex gap-3">
          <Link to="/employee/training" className="btn-secondary">
            {t('training.backToTraining')}
          </Link>
          <button onClick={fetchAssignment} className="btn-primary flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            {t('common.tryAgain') || 'Try Again'}
          </button>
        </div>
      </div>
    );
  }

  // ── Derive interactive component from assignment ──────────────────────────
  const lessonType = assignment
    ? CATEGORY_TO_LESSON[assignment.training_module?.category]
    : null;
  const lang = isAr ? 'ar' : 'en';
  const InteractiveComponent = lessonType ? interactiveMap[lessonType]?.[lang] : null;

  // ==================== RESULTS (already-completed assignments) ====================
  const isCompleted = assignment && ['PASSED', 'FAILED', 'COMPLETED'].includes(assignment.status);

  if (isCompleted && quizResult) {
    const score = Math.round(quizResult.score);
    const passed = quizResult.passed;
    const passingScore = quizResult.passing_score || assignment?.training_module?.passing_score || 80;

    return (
      <div className="fade-in max-w-3xl mx-auto space-y-6">
        <Link
          to="/employee/training"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('training.backToTraining')}
        </Link>

        <div className="card text-center py-10">
          {passed ? (
            <Award className="h-16 w-16 text-success-500 mx-auto mb-4" />
          ) : (
            <XCircle className="h-16 w-16 text-danger-500 mx-auto mb-4" />
          )}

          <div className={clsx(
            'text-5xl font-bold mb-2',
            passed ? 'text-success-600' : 'text-danger-600'
          )}>
            {score}%
          </div>

          {quizResult.total > 0 && (
            <p className="text-gray-500 dark:text-gray-400 mb-3">
              {quizResult.correct}/{quizResult.total} {t('training.correctAnswers')}
            </p>
          )}

          <span className={clsx(
            'inline-block px-4 py-2 rounded-full text-sm font-medium',
            passed
              ? 'bg-success-100 dark:bg-success-500/20 text-success-800 dark:text-success-500'
              : 'bg-danger-100 dark:bg-danger-500/20 text-danger-800 dark:text-danger-500'
          )}>
            {passed ? t('training.passed') : t('training.failed')}
          </span>

          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
            {t('training.passingScore')}: {passingScore}%
          </p>
        </div>

        <Link
          to="/employee/training"
          className="btn-primary w-full flex items-center justify-center gap-2 py-3"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('training.backToTraining')}
        </Link>
      </div>
    );
  }

  // ==================== Interactive lesson (the actual training) ====================
  if (!InteractiveComponent) {
    // Defensive: training module's category isn't mapped to an interactive lesson.
    return (
      <div className="fade-in max-w-2xl mx-auto py-12 text-center">
        <AlertCircle className="h-12 w-12 text-warning-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          {getModuleField('title', 'title_ar') || t('training.title')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('training.noModules')}
        </p>
        <Link to="/employee/training" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          {t('training.backToTraining')}
        </Link>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div className="mb-4">
        <Link
          to="/employee/training"
          className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('training.backToTraining')}
        </Link>
      </div>
      <InteractiveLessonWrapper
        LessonComponent={InteractiveComponent}
        lessonType={lessonType}
        language={lang}
        onComplete={(result) => {
          if (result?.passed === true) {
            toast.success(isAr ? '✅ نجحت! تم احتساب التدريب مكتملاً.' : '✅ Passed! Training marked as complete.');
          } else if (result?.passed === false) {
            toast.error(isAr ? '❌ لم تنجح. يمكنك إعادة المحاولة عبر المسار المعتاد.' : '❌ Not passed. You can retry via the standard path.');
          }
          navigate('/employee/training');
        }}
      />
    </div>
  );
}

export default TakeTraining;
