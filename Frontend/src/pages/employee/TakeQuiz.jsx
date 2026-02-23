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
  MoreVertical,
  ExternalLink,
  AlertTriangle,
  Download,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { campaignsAPI } from '../../api';

// ── Email rendering helpers ──────────────────────────────────────────────────

/** Detect Arabic characters in a string */
const isArabicText = (text = '') => /[\u0600-\u06FF]/.test(text);

/**
 * Return a realistic-looking date/time string, slightly offset per question
 * so consecutive emails don't all show the same time.
 */
const formatEmailDate = (index = 0) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - (75 + index * 47));
  return d.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Wrap currency amounts and time-period phrases in styled React nodes.
 * Amounts   → bold dark gray
 * Deadlines → bold blue
 */
const enhanceInlineText = (text) => {
  if (!text) return text;
  const pattern =
    /(\$[\d,]+(?:\.\d{2})?|[\d,]+\s*ريال|\d+\s*(?:business\s+)?(?:hours?|days?|ساعة|يوم|أيام))/gi;
  const parts = text.split(pattern);
  return parts.map((part, i) => {
    if (/^\$/.test(part) || /ريال/.test(part)) {
      return (
        <strong key={i} className="font-bold text-gray-900">
          {part}
        </strong>
      );
    }
    if (/\d+\s*(?:business\s+)?(?:hours?|days?|ساعة|يوم|أيام)/i.test(part)) {
      return (
        <strong key={i} className="font-semibold text-blue-700">
          {part}
        </strong>
      );
    }
    return part;
  });
};

/** Urgency keyword patterns */
const URGENCY_PATTERNS = [
  /urgent/i,
  /immediate/i,
  /action\s+required/i,
  /within\s+24\s+hours?/i,
  /عاجل/,
  /فوري/,
  /خلال\s+24\s+ساعة/,
];

/**
 * Render email body paragraphs and, when actionable link keywords are
 * detected, append a centered CTA button at the end.
 * Text is never split or modified — it displays exactly as received.
 */
const formatEmailBody = (body = '', isRtl = false) => {
  if (!body) return null;

  // Keyword-based detection: does this email ask the reader to take action?
  const hasLink = isRtl
    ? /رابط|انقر|اضغط|تحقق|حدث/.test(body)
    : /\blink\b|\bclick\b|\bverify\b|\bupdate\b|\bconfirm\b|\breschedule\b/i.test(body);

  const paragraphs = body.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => {
        const lines = para.split('\n');
        return (
          <p key={idx} className="leading-relaxed">
            {lines.map((line, li) => (
              <span key={li}>
                {enhanceInlineText(line)}
                {li < lines.length - 1 && <br />}
              </span>
            ))}
          </p>
        );
      })}

      {hasLink && (
        <div className="flex justify-center pt-4 pb-2">
          <div
            className={`inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-blue-600 via-blue-700 to-blue-800 text-white rounded-xl shadow-xl cursor-default select-none border border-blue-500/30 ${isRtl ? 'flex-row-reverse' : ''}`}
          >
            <ExternalLink className="h-5 w-5 flex-shrink-0" />
            <span className="font-semibold text-lg">
              {isRtl ? 'انقر هنا' : 'Click Here'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

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
  const isArabic = isArabicText(
    (question.email_body || '') + (question.email_subject || '')
  );

  // Urgency: any urgency keyword in body or subject
  const isUrgent = URGENCY_PATTERNS.some(
    (p) =>
      p.test(question.email_body || '') || p.test(question.email_subject || '')
  );

  // Deterministic fake attachment for phishing emails that have no real attachment
  const showFakeAttachment =
    question.email_type === 'PHISHING' &&
    !question.has_attachments &&
    (question.question_number || 0) % 2 === 0;

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

      {/* Email Client — Gmail-style */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 mb-6">

        {/* ── Toolbar ── */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2.5 flex items-center justify-between overflow-hidden rounded-t-xl">
          <div className="flex items-center gap-1.5 text-sm text-gray-500 font-medium">
            <Mail className="h-4 w-4" />
            <span>Inbox</span>
          </div>
          <MoreVertical className="h-4 w-4 text-gray-400" />
        </div>

        {/* ── Urgency badge (shown only when email contains urgency keywords) ── */}
        {isUrgent && (
          <div className="px-6 pt-4 pb-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              {isArabic ? 'عاجل' : 'Urgent'}
            </div>
          </div>
        )}

        {/* ── Sender row ── */}
        <div className="px-6 pb-5 border-b border-gray-100">
          <div className="flex items-start gap-3">
            {/* Initials avatar */}
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0 select-none">
              {(question.email_sender_name || '?').charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold text-gray-900 truncate">
                  {question.email_sender_name}
                </p>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatEmailDate(currentIndex)}
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate">
                &lt;{question.email_sender_email}&gt;
              </p>
              <p className="text-xs text-gray-400 mt-0.5">to me</p>
            </div>
          </div>

          {/* Attachments */}
          {question.has_attachments && question.attachment_names?.length > 0 && (
            <div className="mt-4">
              <p className="text-[11px] text-gray-400 uppercase tracking-wide font-medium mb-2">
                Attachments
              </p>
              <div className="flex flex-wrap gap-2">
                {question.attachment_names.map((name, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 rounded-lg text-xs text-gray-700"
                  >
                    <Paperclip className="h-3 w-3 text-gray-500 flex-shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Email body ── */}
        <div
          className={`px-6 py-6 ${isArabic ? 'text-right' : ''}`}
          dir={isArabic ? 'rtl' : 'ltr'}
          style={{
            fontFamily: 'system-ui, -apple-system, "Segoe UI", Arial, sans-serif',
            fontSize: '15px',
            lineHeight: '1.65',
            color: '#374151',
          }}
        >
          {formatEmailBody(question.email_body, isArabic)}

          {/* Fake attachment pill for phishing emails without a real attachment */}
          {showFakeAttachment && (
            <div
              className={`mt-5 inline-flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg cursor-default select-none max-w-xs ${isArabic ? 'flex-row-reverse' : ''}`}
            >
              <Paperclip className="h-5 w-5 text-gray-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-700">
                  {isArabic ? 'فاتورة.pdf' : 'Invoice.pdf'}
                </p>
                <p className="text-xs text-gray-400">245 KB</p>
              </div>
              <Download className="h-4 w-4 text-gray-400 flex-shrink-0" />
            </div>
          )}
        </div>
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
