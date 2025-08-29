export type EmptyObject = Record<never, never>;

export interface QuizList {
  quizId: number,
  name: string
}

interface AnswerBody {
  answer: string,
  correct: boolean
}

export type Colour = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';

export interface QuestionBody {
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: AnswerBody[],
  thumbnailUrl?: string
}

export enum QuizGameState {
  LOBBY = 'LOBBY',
  QUESTION_COUNTDOWN = 'QUESTION_COUNTDOWN',
  QUESTION_OPEN = 'QUESTION_OPEN',
  QUESTION_CLOSE = 'QUESTION_CLOSE',
  ANSWER_SHOW = 'ANSWER_SHOW',
  FINAL_RESULTS = 'FINAL_RESULTS',
  END = 'END'
}

export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}
