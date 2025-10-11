interface VerificationSession {
  questionPool: Array<{question: string, options: string[], correctIndex: number}>;
  usedQuestions: number[];
  correctAnswers: number;
  totalAttempts: number;
}

let sessions: Map<string, VerificationSession> = new Map();

export function createSession(sessionId: string, questionPool: Array<{question: string, options: string[], correctIndex: number}>) {
  sessions.set(sessionId, {
    questionPool,
    usedQuestions: [],
    correctAnswers: 0,
    totalAttempts: 0
  });
}

export function getNextQuestion(sessionId: string): {question: string, options: string[], index: number} | null {
  const session = sessions.get(sessionId);
  if (!session) return null;

  const availableQuestions = session.questionPool
    .map((_, index) => index)
    .filter(index => !session.usedQuestions.includes(index));

  if (availableQuestions.length === 0) return null;

  const questionIndex = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
  const question = session.questionPool[questionIndex];
  
  return {
    question: question.question,
    options: question.options,
    index: questionIndex
  };
}

export function submitAnswer(sessionId: string, questionIndex: number, selectedIndex: number): {
  correct: boolean;
  passed: boolean;
  failed: boolean;
  correctAnswers: number;
  totalAttempts: number;
} {
  const session = sessions.get(sessionId);
  if (!session) return { correct: false, passed: false, failed: true, correctAnswers: 0, totalAttempts: 0 };

  session.usedQuestions.push(questionIndex);
  session.totalAttempts++;

  const correct = session.questionPool[questionIndex].correctIndex === selectedIndex;
  if (correct) {
    session.correctAnswers++;
  }

  const passed = session.correctAnswers >= 3;
  const failed = session.usedQuestions.length >= 6 && session.correctAnswers < 3;

  return {
    correct,
    passed,
    failed,
    correctAnswers: session.correctAnswers,
    totalAttempts: session.totalAttempts
  };
}

export function clearSession(sessionId: string) {
  sessions.delete(sessionId);
}