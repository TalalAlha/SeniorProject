/**
 * InteractiveLessonWrapper — HOC that integrates interactive lesson components
 * with the backend training API (progress load, auto-save, completion tracking).
 *
 * Used by TopicTraining (public) and TakeTraining (employee) to wrap each
 * PhishAware_VX_XX lesson component without the lesson knowing about API calls.
 */
import { useState, useEffect, useRef } from 'react';
import { trainingAPI } from '../../api';

/**
 * Wraps interactive lesson components with backend integration.
 * Handles: progress loading, debounced auto-save, and completion tracking.
 *
 * Props:
 *   LessonComponent  – the interactive component to render
 *   lessonType       – 'phishing' | 'vishing' | 'smishing'
 *   language         – 'ar' | 'en'
 *   onComplete       – optional callback called after backend saves completion
 */
function InteractiveLessonWrapper({ LessonComponent, lessonType, language, onComplete }) {
  const [loading, setLoading] = useState(true);
  const [initialScene, setInitialScene] = useState(0);
  const startTime = useRef(Date.now());
  const saveTimeout = useRef(null);

  useEffect(() => {
    loadProgress();
    return () => {
      if (saveTimeout.current) clearTimeout(saveTimeout.current);
    };
  }, [lessonType, language]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadProgress = async () => {
    try {
      const res = await trainingAPI.getInteractiveProgress(lessonType, language);
      setInitialScene(res.data.current_scene || 0);
    } catch {
      // Not authenticated or other error – start from beginning
      setInitialScene(0);
    } finally {
      setLoading(false);
    }
  };

  const handleSceneChange = (sceneIndex, totalScenes) => {
    if (saveTimeout.current) clearTimeout(saveTimeout.current);

    saveTimeout.current = setTimeout(async () => {
      const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);
      try {
        await trainingAPI.saveInteractiveProgress({
          lesson_type: lessonType,
          language,
          current_scene: sceneIndex,
          total_scenes: totalScenes,
          time_spent: timeSpent,
        });
      } catch {
        // Silent fail – progress save is best-effort
      }
    }, 2000);
  };

  const handleComplete = async (quizResults) => {
    const timeSpent = Math.floor((Date.now() - startTime.current) / 1000);

    try {
      const res = await trainingAPI.completeInteractiveLesson({
        lesson_type: lessonType,
        language,
        quiz_score: quizResults.score,
        quiz_total: quizResults.total,
        quiz_answers: quizResults.answers || {},
        time_spent: timeSpent,
        total_scenes: quizResults.total_scenes,
      });

      if (onComplete) onComplete(res.data);
    } catch {
      if (onComplete) onComplete({ quiz_score: quizResults.score, quiz_total: quizResults.total });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">
            {language === 'ar' ? 'جاري التحميل...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <LessonComponent
      initialScene={initialScene}
      onSceneChange={handleSceneChange}
      onComplete={handleComplete}
    />
  );
}

export default InteractiveLessonWrapper;
