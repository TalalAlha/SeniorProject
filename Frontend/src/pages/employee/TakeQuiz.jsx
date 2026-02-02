import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, ArrowRight, Clock, AlertCircle } from 'lucide-react';
import clsx from 'clsx';

function TakeQuiz() {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [quiz, setQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    // Fetch quiz data
    const fetchQuiz = async () => {
      try {
        // Placeholder data
        setQuiz({
          id: id,
          name: 'Phishing Awareness Basics',
          timeLimit: 15,
          questions: [
            {
              id: 1,
              question: 'What is the most common indicator of a phishing email?',
              options: [
                'Professional formatting',
                'Urgent language demanding immediate action',
                'Company logo in the header',
                'Links to official websites',
              ],
              correct: 1,
            },
            {
              id: 2,
              question: 'What should you do if you receive a suspicious email asking for your password?',
              options: [
                'Reply with your password',
                'Click the link to verify',
                'Report it to IT and delete',
                'Forward it to colleagues',
              ],
              correct: 2,
            },
            {
              id: 3,
              question: 'Which of these URLs is most likely a phishing attempt?',
              options: [
                'https://www.google.com',
                'https://g00gle.com/login',
                'https://mail.google.com',
                'https://accounts.google.com',
              ],
              correct: 1,
            },
          ],
        });
        setTimeLeft(15 * 60);
      } catch (error) {
        console.error('Error fetching quiz:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchQuiz();
  }, [id]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex) => {
    setAnswers((prev) => ({
      ...prev,
      [quiz.questions[currentQuestion].id]: optionIndex,
    }));
  };

  const handleSubmit = () => {
    // Submit quiz answers
    console.log('Submitting answers:', answers);
    navigate('/employee/quizzes');
  };

  if (loading || !quiz) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const question = quiz.questions[currentQuestion];

  return (
    <div className="fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{quiz.name}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {t('quiz.questionOf', { current: currentQuestion + 1, total: quiz.questions.length })}
          </p>
        </div>
        <div className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg',
          timeLeft < 60 ? 'bg-danger-50 text-danger-700' : 'bg-gray-100 text-gray-700'
        )}>
          <Clock className="h-5 w-5" />
          <span className="font-mono font-medium">{formatTime(timeLeft)}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-gray-200 rounded-full h-2 mb-8">
        <div
          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${((currentQuestion + 1) / quiz.questions.length) * 100}%` }}
        />
      </div>

      {/* Question Card */}
      <div className="card mb-6">
        <h2 className="text-lg font-medium text-gray-900 mb-6">{question.question}</h2>
        <div className="space-y-3">
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswer(index)}
              className={clsx(
                'w-full text-left p-4 rounded-lg border-2 transition-colors',
                answers[question.id] === index
                  ? 'border-primary-600 bg-primary-50'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="flex items-center gap-3">
                <span className={clsx(
                  'w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm',
                  answers[question.id] === index
                    ? 'border-primary-600 bg-primary-600 text-white'
                    : 'border-gray-300'
                )}>
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-gray-700">{option}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setCurrentQuestion((prev) => prev - 1)}
          disabled={currentQuestion === 0}
          className="btn-secondary"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          {t('quiz.previousQuestion')}
        </button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={() => setCurrentQuestion((prev) => prev + 1)}
            className="btn-primary"
          >
            {t('quiz.nextQuestion')}
            <ArrowRight className="h-5 w-5 ml-2" />
          </button>
        ) : (
          <button onClick={handleSubmit} className="btn-primary">
            {t('quiz.submitQuiz')}
          </button>
        )}
      </div>
    </div>
  );
}

export default TakeQuiz;
