export interface ErrorObject {
  error: string;
  code?: number;
}

export type EmptyObject = Record<never, never>;

export interface QuizList {
  quizId: number,
  name: string
}

export interface QuizInfo {
  quizId: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  numQuestions: number,
  questions: QuestionInfo[],
  timeLimit: number,
  thumbnailUrl?: string
}

export interface UserDetail {
  userId: number,
  name: string,
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number
}

export interface AnswerBody {
  answer: string,
  correct: boolean
}

export interface QuestionBody {
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: AnswerBody[],
  thumbnailUrl?: string
}

export interface QuestionInfo {
  questionId: number,
  question: string,
  timeLimit: number,
  points: number,
  answerOptions: AnswerInfo[],
  thumbnailUrl?: string
}

export type Colour = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange' | 'pink';

export interface AnswerInfo {
  answerId: number,
  answer: string,
  colour: Colour,
  correct?: boolean
}

export interface Quiz {
  userId: number,
  contributors: number[],
  quizId: number,
  name: string,
  description: string,
  timeCreated: number,
  timeLastEdited: number,
  numQuestions: number,
  questions: QuestionInfo[],
  timeLimit: number,
  thumbnailUrl?: string
}

interface User {
  userId: number,
  nameFirst: string,
  nameLast: string
  email: string,
  numSuccessfulLogins: number,
  numFailedPasswordsSinceLastLogin: number
  password: string
  previousPasswords: string[]
}

export interface Session {
  session: string,
  userId: number
}

export interface DataStore {
  users: User[],
  quizzes: Quiz[],
  sessions: Session[],
  quizGames: Game[]
  players: Player[]
}

export interface Player {
  playerId: number,
  gameId: number,
  name: string,
  score: number
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

export interface QuizGameInfo {
  state: QuizGameState,
  atQuestion: number,
  players: string[],
  metadata: QuizInfo
}

export enum Action {
  NEXT_QUESTION = 'NEXT_QUESTION',
  SKIP_COUNTDOWN = 'SKIP_COUNTDOWN',
  GO_TO_ANSWER = 'GO_TO_ANSWER',
  GO_TO_FINAL_RESULTS = 'GO_TO_FINAL_RESULTS',
  END = 'END'
}

export interface PlayerScore {
  playerName: string,
  score: number,
  answerTime: number,
  correct: boolean,
  attempted: boolean
}

export interface QuestionResult {
  questionId: number,
  playersCorrect: string[],
  averageAnswerTime: number,
  percentCorrect: number
}

export interface Game {
  gameId: number,
  quiz: Quiz,
  state: QuizGameState,
  scoreBoard: PlayerScore[],
  autoStartNum: number,
  active: boolean,
  atQuestion: number,
  questionStartTime: number,
  questionResults: QuestionResult[]
}

export interface PlayerStatus {
  state: QuizGameState,
  numQuestions: number,
  atQuestion: number
}

export interface PlayersRank {
  playerName: string,
  score: number
}

export interface FinalResults {
  usersRankedByScore: PlayersRank[],
  questionResults: QuestionResult[]
}
