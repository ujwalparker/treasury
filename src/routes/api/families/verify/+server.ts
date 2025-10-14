import { json } from '@sveltejs/kit';
import { generateVerificationQuestions } from '$lib/services/llm';
import { createSession, getNextQuestion, submitAnswer, clearSession } from '$lib/server/verification-session';
import { randomUUID } from 'crypto';

// GET /api/verify-parent - Get first verification question
export async function GET({ locals, cookies }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const questions = await generateVerificationQuestions();

    console.log('Generated questions:\n', questions);
    const sessionId = randomUUID();
    
    createSession(sessionId, questions);
    cookies.set('verification-session', sessionId, { path: '/', httpOnly: true });
    
    const firstQuestion = getNextQuestion(sessionId);
    
    if (!firstQuestion) {
      throw new Error('Failed to get first question');
    }
    
    return json({
      question: firstQuestion.question,
      options: firstQuestion.options,
      questionIndex: firstQuestion.index
    });
    
  } catch (error) {
    console.error('Question generation error:', error);
    return json({ error: 'Failed to generate questions' }, { status: 500 });
  }
}

// POST /api/verify-parent - Submit answer
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
