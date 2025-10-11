import { json } from '@sveltejs/kit';
import { generateVerificationQuestions } from '$lib/services/llm';
import { createSession, getNextQuestion } from '$lib/server/verification-session';
import { randomUUID } from 'crypto';

export async function GET({ locals, cookies }) {
  const session = await locals.auth();
  
  if (!session?.user?.email) {
    return json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const questions = await generateVerificationQuestions();
    const sessionId = randomUUID();
    
    // Create verification session with question pool
    createSession(sessionId, questions);
    cookies.set('verification-session', sessionId, { path: '/', httpOnly: true });
    
    // Get first question
    const firstQuestion = getNextQuestion(sessionId);
    
    if (!firstQuestion) {
      throw new Error('Failed to get first question');
    }
    
    // Debug: Log all correct answers
    console.log('🔍 Parent Verification - Question Pool:');
    questions.forEach((q, index) => {
      console.log(`Q${index + 1}: ${q.question}`);
      console.log(`Answer: ${q.options[q.correctIndex]} (index: ${q.correctIndex})`);
    });
    
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