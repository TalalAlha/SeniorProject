import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, ArrowRight, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Play, Award,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { trainingAPI } from '../../api';

const STAGES = { VIDEO: 'VIDEO', QUIZ: 'QUIZ', RESULTS: 'RESULTS' };

function TakeTraining() {
  const { t, i18n } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [assignment, setAssignment] = useState(null);
  const [stage, setStage] = useState(STAGES.VIDEO);
  const [videoWatched, setVideoWatched] = useState(false);

  // Quiz state
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);
  const [quizLoading, setQuizLoading] = useState(false);

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

      // If content already viewed and not completed, jump to quiz
      if (data.content_viewed && !['PASSED', 'FAILED', 'COMPLETED'].includes(data.status)) {
        setVideoWatched(true);
        setStage(STAGES.QUIZ);
        const quizRes = await trainingAPI.getQuiz(id);
        setQuestions(quizRes.data.questions || []);
      }

      // If already completed, show results
      if (['PASSED', 'FAILED', 'COMPLETED'].includes(data.status)) {
        setVideoWatched(true);
        setStage(STAGES.RESULTS);
        setQuizResult({
          score: parseFloat(data.quiz_score) || 0,
          passed: data.passed,
          correct: data.correct_answers || 0,
          total: data.total_questions || 0,
          passing_score: data.training_module?.passing_score || 80,
          results: null,
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

  const handleProceedToQuiz = async () => {
    setQuizLoading(true);
    try {
      await trainingAPI.viewContent(id);
      const quizRes = await trainingAPI.getQuiz(id);
      setQuestions(quizRes.data.questions || []);
      setStage(STAGES.QUIZ);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to load quiz');
    } finally {
      setQuizLoading(false);
    }
  };

  const handleSelectAnswer = (questionId, optionIndex) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleSubmitQuiz = async () => {
    const unanswered = questions.filter((q) => answers[q.id] === undefined).length;
    if (unanswered > 0) {
      toast.error(t('training.unansweredWarning', { count: unanswered }));
      return;
    }

    if (!window.confirm(t('training.confirmSubmit'))) return;

    setSubmitting(true);
    try {
      const formattedAnswers = {};
      Object.entries(answers).forEach(([qId, selectedIdx]) => {
        formattedAnswers[qId] = selectedIdx;
      });

      const res = await trainingAPI.submitQuiz(id, formattedAnswers);
      setQuizResult(res.data);
      setStage(STAGES.RESULTS);
      toast.success(t('training.quizSubmitted'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

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
          <p className="mt-4 text-gray-600">{t('training.startTraining')}...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
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

  // ==================== VIDEO STAGE ====================
  if (stage === STAGES.VIDEO) {
    return (
      <div className="fade-in max-w-3xl mx-auto space-y-6">
        {/* Back link */}
        <Link
          to="/employee/training"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 text-sm"
        >
          <ArrowLeft className="h-4 w-4" />
          {t('training.backToTraining')}
        </Link>

        {/* Title */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {getModuleField('title', 'title_ar')}
          </h1>
          <p className="text-gray-600 mt-2">
            {getModuleField('description', 'description_ar')}
          </p>
        </div>

        {/* Video */}
        <div className="card p-0 overflow-hidden">
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <iframe
              className="absolute inset-0 w-full h-full"
              src={assignment.training_module?.video_url}
              title="Training Video"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>

        {/* Checkbox */}
        <label className="flex items-center gap-3 cursor-pointer card">
          <input
            type="checkbox"
            checked={videoWatched}
            onChange={(e) => setVideoWatched(e.target.checked)}
            className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
          />
          <span className="text-gray-700 font-medium">{t('training.videoWatched')}</span>
        </label>

        {/* Take Quiz button */}
        <button
          disabled={!videoWatched || quizLoading}
          onClick={handleProceedToQuiz}
          className={clsx(
            'btn-primary w-full flex items-center justify-center gap-2 py-3 text-lg',
            (!videoWatched || quizLoading) && 'opacity-50 cursor-not-allowed'
          )}
        >
          {quizLoading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              {t('common.loading') || 'Loading...'}
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              {t('training.takeQuiz')}
            </>
          )}
        </button>
      </div>
    );
  }

  // ==================== QUIZ STAGE ====================
  if (stage === STAGES.QUIZ && questions.length > 0) {
    const currentQ = questions[currentIndex];
    const totalQuestions = questions.length;
    const answeredCount = Object.keys(answers).length;
    const progress = ((currentIndex + 1) / totalQuestions) * 100;

    const qText = isAr && currentQ.question_text_ar
      ? currentQ.question_text_ar
      : currentQ.question_text;

    const opts = isAr && currentQ.options_ar?.length
      ? currentQ.options_ar
      : currentQ.options;

    const isLastQuestion = currentIndex === totalQuestions - 1;
    const allAnswered = answeredCount === totalQuestions;

    return (
      <div className="fade-in max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            {getModuleField('title', 'title_ar')}
          </h1>
          <span className="text-sm text-gray-500">
            {t('training.questionOf', { current: currentIndex + 1, total: totalQuestions })}
          </span>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-primary-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Question card */}
        <div className="card">
          <p className="text-lg font-medium text-gray-900 mb-6">{qText}</p>

          <div className="space-y-3">
            {opts.map((option, idx) => {
              const isSelected = answers[currentQ.id] === idx;
              const optionLetter = String.fromCharCode(65 + idx); // A, B, C, D

              return (
                <button
                  key={idx}
                  onClick={() => handleSelectAnswer(currentQ.id, idx)}
                  className={clsx(
                    'w-full text-start p-4 rounded-lg border-2 transition-all flex items-start gap-3',
                    isSelected
                      ? 'border-primary-500 bg-primary-50 text-primary-900'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                  )}
                >
                  <span className={clsx(
                    'flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold',
                    isSelected
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-600'
                  )}>
                    {optionLetter}
                  </span>
                  <span className="pt-1">{option}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Question dot navigator */}
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {questions.map((q, idx) => {
            const isAnswered = answers[q.id] !== undefined;
            const isCurrent = idx === currentIndex;

            return (
              <button
                key={q.id}
                onClick={() => setCurrentIndex(idx)}
                className={clsx(
                  'w-8 h-8 rounded-full text-xs font-medium transition-all',
                  isCurrent && 'ring-2 ring-primary-600 ring-offset-2',
                  isAnswered && !isCurrent && 'bg-success-500 text-white',
                  !isAnswered && !isCurrent && 'bg-gray-200 text-gray-600',
                  isCurrent && isAnswered && 'bg-success-500 text-white',
                  isCurrent && !isAnswered && 'bg-primary-600 text-white',
                )}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className={clsx(
              'btn-secondary flex items-center gap-2',
              currentIndex === 0 && 'opacity-50 cursor-not-allowed'
            )}
          >
            <ArrowLeft className="h-4 w-4" />
            {t('training.previousQuestion')}
          </button>

          {isLastQuestion ? (
            <button
              onClick={handleSubmitQuiz}
              disabled={submitting || !allAnswered}
              className={clsx(
                'btn-primary flex items-center gap-2',
                (submitting || !allAnswered) && 'opacity-50 cursor-not-allowed'
              )}
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {t('training.submitQuiz')}...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  {t('training.submitQuiz')}
                  {!allAnswered && ` (${answeredCount}/${totalQuestions})`}
                </>
              )}
            </button>
          ) : (
            <button
              onClick={() => setCurrentIndex((prev) => Math.min(totalQuestions - 1, prev + 1))}
              className="btn-primary flex items-center gap-2"
            >
              {t('training.nextQuestion')}
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ==================== RESULTS STAGE ====================
  if (stage === STAGES.RESULTS && quizResult) {
    const score = Math.round(quizResult.score);
    const passed = quizResult.passed;
    const passingScore = quizResult.passing_score || assignment?.training_module?.passing_score || 80;

    return (
      <div className="fade-in max-w-3xl mx-auto space-y-6">
        {/* Score hero */}
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

          <p className="text-gray-500 mb-3">
            {quizResult.correct}/{quizResult.total} {t('training.correctAnswers')}
          </p>

          <span className={clsx(
            'inline-block px-4 py-2 rounded-full text-sm font-medium',
            passed ? 'bg-success-100 text-success-800' : 'bg-danger-100 text-danger-800'
          )}>
            {passed ? t('training.passed') : t('training.failed')}
          </span>

          <p className="text-sm text-gray-500 mt-3">
            {t('training.passingScore')}: {passingScore}%
          </p>

          {quizResult.risk_score_before !== null && quizResult.risk_score_after !== null && (
            <p className="text-sm text-gray-500 mt-2">
              Risk Score: {quizResult.risk_score_before} → {quizResult.risk_score_after}
            </p>
          )}
        </div>

        {/* Per-question review */}
        {quizResult.results && quizResult.results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('training.review')}
            </h2>

            {quizResult.results.map((r, idx) => {
              const question = questions.find((q) => q.id === r.question_id);
              const qText = question
                ? (isAr && question.question_text_ar ? question.question_text_ar : question.question_text)
                : `Question ${idx + 1}`;
              const opts = question
                ? (isAr && question.options_ar?.length ? question.options_ar : question.options)
                : [];
              const explanation = isAr && question?.explanation_ar
                ? question.explanation_ar
                : r.explanation;

              return (
                <div key={r.question_id} className="card">
                  <div className="flex items-start gap-3 mb-3">
                    {r.is_correct ? (
                      <CheckCircle className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-danger-500 flex-shrink-0 mt-0.5" />
                    )}
                    <p className="font-medium text-gray-900">
                      {idx + 1}. {qText}
                    </p>
                  </div>

                  <div className="space-y-2 ms-8">
                    {opts.map((opt, optIdx) => {
                      const isCorrect = optIdx === r.correct_answer;
                      const isUserAnswer = optIdx === r.selected;
                      const isWrong = isUserAnswer && !r.is_correct;

                      return (
                        <div
                          key={optIdx}
                          className={clsx(
                            'p-3 rounded-lg border text-sm flex items-center justify-between',
                            isCorrect && 'border-success-500 bg-success-50',
                            isWrong && 'border-danger-500 bg-danger-50',
                            !isCorrect && !isWrong && 'border-gray-200',
                          )}
                        >
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-gray-500">
                              {String.fromCharCode(65 + optIdx)}.
                            </span>
                            {opt}
                          </span>
                          {isCorrect && <CheckCircle className="h-4 w-4 text-success-600 flex-shrink-0" />}
                          {isWrong && <XCircle className="h-4 w-4 text-danger-600 flex-shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {explanation && (
                    <div className="ms-8 mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
                      {explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Back button */}
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

  // Fallback
  return (
    <div className="text-center py-12">
      <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-4" />
      <p className="text-gray-600">{t('training.noModules')}</p>
      <Link to="/employee/training" className="btn-primary mt-4 inline-block">
        {t('training.backToTraining')}
      </Link>
    </div>
  );
}

export default TakeTraining;
