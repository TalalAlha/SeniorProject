import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  AlertCircle,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle,
  XCircle,
  User,
  Paperclip,
  RefreshCw,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { campaignsAPI } from '../../api';

function TakeQuiz() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [result, setResult] = useState(null);

  // Time tracking per question
  const questionStartTime = useRef(Date.now());

  const fetchQuizData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const questionsRes = await campaignsAPI.getQuizQuestions(id);
      const data = questionsRes.data;

      setQuizData({
        quiz_id: data.quiz_id,
        campaign_name: data.campaign_name,
        status: data.status,
        total_questions: data.total_questions,
        current_question_index: data.current_question_index,
      });
      setQuestions(data.questions || []);

      // Restore previous answers if quiz was in progress
      const restored = {};
      (data.questions || []).forEach((q) => {
        if (q.answer) {
          restored[q.question_number] = q.answer;
        }
      });
      setAnswers(restored);

      // If quiz was already in progress, resume from where left off
      if (data.current_question_index > 0 && data.status === 'IN_PROGRESS') {
        const resumeIdx = Math.min(
          data.current_question_index,
          (data.questions || []).length - 1
        );
        setCurrentIndex(resumeIdx);
      }

      // If completed, fetch results
      if (data.status === 'COMPLETED') {
        setCompleted(true);
        try {
          const resultRes = await campaignsAPI.getQuizResult(id);
          setResult(resultRes.data.result);
        } catch {
          // Result may not exist yet
        }
      } else if (data.status === 'NOT_STARTED') {
        // Auto-start the quiz
        await campaignsAPI.startQuiz(id);
      }

      questionStartTime.current = Date.now();
    } catch (err) {
      const message =
        err.response?.data?.error ||
        err.response?.data?.detail ||
        'Failed to load quiz';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuizData();
  }, [fetchQuizData]);

  // Reset timer when navigating between questions
  useEffect(() => {
    questionStartTime.current = Date.now();
  }, [currentIndex]);

  const handleAnswer = async (answer) => {
    const question = questions[currentIndex];
    if (!question) return;

    // If already answered with the same value, do nothing
    if (answers[question.question_number] === answer) return;

    // Calculate time spent on this question
    const timeSpent = Math.round((Date.now() - questionStartTime.current) / 1000);

    // Optimistic update
    setAnswers((prev) => ({ ...prev, [question.question_number]: answer }));

    // Submit answer to backend
    try {
      await campaignsAPI.answerQuestion(id, {
        question_number: question.question_number,
        answer,
        time_spent_seconds: timeSpent,
      });
    } catch (err) {
      // Revert on failure
      setAnswers((prev) => {
        const copy = { ...prev };
        delete copy[question.question_number];
        return copy;
      });
      toast.error(err.response?.data?.error || 'Failed to save answer');
    }
  };

  const handleSubmitQuiz = async () => {
    // Check for unanswered questions
    const unanswered = questions.filter(
      (q) => !answers[q.question_number]
    ).length;

    if (unanswered > 0) {
      toast.error(t('quiz.unansweredWarning', { count: unanswered }));
      return;
    }

    if (!window.confirm(t('quiz.confirmSubmit'))) return;

    setSubmitting(true);
    try {
      const res = await campaignsAPI.submitQuiz(id);
      setCompleted(true);
      setResult(res.data.result);
      toast.success(t('quiz.quizComplete'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit quiz');
    } finally {
      setSubmitting(false);
    }
  };

  // ---------- Loading / Error states ----------

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto" />
          <p className="mt-4 text-gray-600">Loading quiz...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <AlertCircle className="h-12 w-12 text-danger-500 mb-4" />
        <p className="text-gray-600 mb-4">{error}</p>
        <button onClick={fetchQuizData} className="btn-primary flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Try Again
        </button>
      </div>
    );
  }

  // ---------- Completed state ----------

  if (completed && result) {
    return (
      <div className="fade-in max-w-2xl mx-auto">
        <div className="card text-center py-10">
          <CheckCircle className="h-16 w-16 text-success-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {t('quiz.quizComplete')}
          </h1>
          <p className="text-gray-500 mb-6">{quizData?.campaign_name}</p>

          {/* Score */}
          <div className="text-5xl font-bold text-primary-600 mb-2">
            {Math.round(result.score)}%
          </div>
          <p className="text-gray-500 mb-8">{t('quiz.yourScore')}</p>

          {/* Stats grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
            <div className="p-4 bg-success-50 rounded-lg">
              <p className="text-2xl font-bold text-success-700">{result.correct_answers}</p>
              <p className="text-xs text-success-600">{t('quiz.answeredCorrectly')}</p>
            </div>
            <div className="p-4 bg-primary-50 rounded-lg">
              <p className="text-2xl font-bold text-primary-700">
                {result.phishing_emails_identified}
              </p>
              <p className="text-xs text-primary-600">{t('quiz.phishingDetected')}</p>
            </div>
            <div className="p-4 bg-danger-50 rounded-lg">
              <p className="text-2xl font-bold text-danger-700">
                {result.phishing_emails_missed}
              </p>
              <p className="text-xs text-danger-600">{t('quiz.phishingMissed')}</p>
            </div>
            <div className="p-4 bg-warning-50 rounded-lg">
              <p className="text-2xl font-bold text-warning-700">
                {result.false_positives}
              </p>
              <p className="text-xs text-warning-600">{t('quiz.falsePositives')}</p>
            </div>
          </div>

          {/* Risk Level */}
          <div className="mb-8">
            <span
              className={clsx(
                'inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium',
                result.risk_level === 'LOW' && 'bg-success-100 text-success-800',
                result.risk_level === 'MEDIUM' && 'bg-warning-100 text-warning-800',
                result.risk_level === 'HIGH' && 'bg-danger-100 text-danger-800',
                result.risk_level === 'CRITICAL' && 'bg-danger-200 text-danger-900'
              )}
            >
              {result.risk_level === 'LOW' || result.risk_level === 'MEDIUM' ? (
                <ShieldCheck className="h-4 w-4" />
              ) : (
                <ShieldAlert className="h-4 w-4" />
              )}
              Risk Level: {result.risk_level}
            </span>
          </div>

          <Link to="/employee/quizzes" className="btn-primary">
            {t('quiz.backToQuizzes')}
          </Link>
        </div>
      </div>
    );
  }

  // ---------- Taking the quiz ----------

  if (questions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Mail className="h-12 w-12 text-gray-300 mb-4" />
        <p className="text-gray-600">No questions found for this quiz.</p>
        <Link to="/employee/quizzes" className="btn-secondary mt-4">
          {t('quiz.backToQuizzes')}
        </Link>
      </div>
    );
  }

  const question = questions[currentIndex];
  const selectedAnswer = answers[question.question_number] || null;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            {quizData?.campaign_name || t('quiz.takeQuiz')}
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('quiz.questionOf', {
              current: currentIndex + 1,
              total: questions.length,
            })}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            {answeredCount}/{questions.length} answered
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{
            width: `${((currentIndex + 1) / questions.length) * 100}%`,
          }}
        />
      </div>

      {/* Prompt */}
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="h-5 w-5 text-primary-600" />
        <p className="text-sm font-medium text-gray-700">
          {t('quiz.identifyEmail')}
        </p>
      </div>

      {/* Email Preview Card */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-6 overflow-hidden">
        {/* Email header */}
        <div className="border-b border-gray-100 px-6 py-4 space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
              <User className="h-5 w-5 text-gray-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {question.email_sender_name}
              </p>
              <p className="text-xs text-gray-500 truncate">
                &lt;{question.email_sender_email}&gt;
              </p>
            </div>
          </div>
          <div>
            <p className="text-sm text-gray-500">{t('quiz.subject')}:</p>
            <p className="text-base font-medium text-gray-900">
              {question.email_subject}
            </p>
          </div>
          {question.has_attachments && question.attachment_names?.length > 0 && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Paperclip className="h-3 w-3" />
              <span>{question.attachment_names.join(', ')}</span>
            </div>
          )}
        </div>

        {/* Email body */}
        <div className="px-6 py-5">
          <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {question.email_body}
          </div>
        </div>

        {/* Links display */}
        {question.links?.length > 0 && (
          <div className="border-t border-gray-100 px-6 py-3">
            <p className="text-xs text-gray-400 mb-1">Links in this email:</p>
            {question.links.map((link, i) => (
              <p key={i} className="text-xs text-blue-600 underline truncate">
                {link}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* Answer Buttons */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <button
          onClick={() => handleAnswer('PHISHING')}
          className={clsx(
            'flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-medium',
            selectedAnswer === 'PHISHING'
              ? 'border-danger-500 bg-danger-50 text-danger-700 shadow-md'
              : 'border-gray-200 text-gray-600 hover:border-danger-300 hover:bg-danger-50/50'
          )}
        >
          <ShieldAlert className="h-6 w-6" />
          <span className="text-lg">{t('quiz.phishing')}</span>
        </button>

        <button
          onClick={() => handleAnswer('LEGITIMATE')}
          className={clsx(
            'flex items-center justify-center gap-3 p-5 rounded-xl border-2 transition-all font-medium',
            selectedAnswer === 'LEGITIMATE'
              ? 'border-success-500 bg-success-50 text-success-700 shadow-md'
              : 'border-gray-200 text-gray-600 hover:border-success-300 hover:bg-success-50/50'
          )}
        >
          <ShieldCheck className="h-6 w-6" />
          <span className="text-lg">{t('quiz.legitimate')}</span>
        </button>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          disabled={currentIndex === 0}
          className="btn-secondary"
        >
          <ArrowLeft className="h-5 w-5 ltr:mr-2 rtl:ml-2" />
          {t('quiz.previousQuestion')}
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="btn-primary"
          >
            {t('quiz.nextQuestion')}
            <ArrowRight className="h-5 w-5 ltr:ml-2 rtl:mr-2" />
          </button>
        ) : (
          <button
            onClick={handleSubmitQuiz}
            disabled={submitting}
            className="btn-primary"
          >
            {submitting ? (
              <>
                <RefreshCw className="h-5 w-5 animate-spin ltr:mr-2 rtl:ml-2" />
                Submitting...
              </>
            ) : (
              t('quiz.submitQuiz')
            )}
          </button>
        )}
      </div>

      {/* Question dots navigator */}
      <div className="flex flex-wrap justify-center gap-2 mt-8">
        {questions.map((q, idx) => (
          <button
            key={q.id}
            onClick={() => setCurrentIndex(idx)}
            className={clsx(
              'w-8 h-8 rounded-full text-xs font-medium transition-colors',
              idx === currentIndex
                ? 'bg-primary-600 text-white'
                : answers[q.question_number]
                  ? 'bg-success-100 text-success-700'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            )}
          >
            {idx + 1}
          </button>
        ))}
      </div>
    </div>
  );
}

export default TakeQuiz;
