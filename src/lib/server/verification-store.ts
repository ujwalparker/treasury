let storedAnswers: number[] = [];

export function setAnswers(answers: number[]) {
  storedAnswers = answers;
}

export function getAnswers(): number[] {
  return storedAnswers;
}