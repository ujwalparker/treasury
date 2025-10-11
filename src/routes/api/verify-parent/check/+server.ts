import { json } from '@sveltejs/kit';
import { submitAnswer, getNextQuestion, clearSession } from '$lib/server/verification-session';

export async function POST({ locals, request, cookies }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { questionIndex, selectedIndex } = await request.json();
    const sessionId = cookies.get('verification-session');
    
    if (!sessionId) {
      return json({ error: 'No verification session' }, { status: 400 });
    }
    
    const result = submitAnswer(sessionId, questionIndex, selectedIndex);
    
    if (result.passed) {
      clearSession(sessionId);
      cookies.delete('verification-session', { path: '/' });
      return json({ correct: result.correct, passed: true });
    }
    
    if (result.failed) {
      clearSession(sessionId);
      cookies.delete('verification-session', { path: '/' });
      return json({ correct: result.correct, failed: true });
    }
    
    // Get next question if not passed or failed
    const nextQuestion = getNextQuestion(sessionId);
    
    return json({
      correct: result.correct,
      nextQuestion: nextQuestion ? {
        question: nextQuestion.question,
        options: nextQuestion.options,
        questionIndex: nextQuestion.index
      } : null,
      correctAnswers: result.correctAnswers,
      totalAttempts: result.totalAttempts
    });
    
  } catch (error) {
    console.error('Answer verification error:', error);
    return json({ error: 'Verification failed' }, { status: 500 });
  }
}