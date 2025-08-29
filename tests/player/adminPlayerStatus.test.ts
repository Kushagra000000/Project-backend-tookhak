// Importing adminPlayerJoin and adminPlayerStatus from player.ts in helpers dir
import { adminPlayerJoin, adminPlayerStatus } from '../test_helpers/player';

// Importing adminAuthRegister from auth.ts in helpers dir
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizCreate and adminQuestionCreate from quiz.ts in helpers dir
import { adminQuizCreate, adminQuestionCreate } from '../test_helpers/quiz';

// Importing adminQuizGameStart from game.ts in helpers dir
import { adminQuizGameStart } from '../test_helpers/game';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';

let sessionId: string;
let quizId: number;
const questionIds: number[] = [];
let gameId: number;

const questionBody1 = {
  question: 'Gaga ooh lala',
  timeLimit: 4,
  points: 5,
  answerOptions: [
    {
      answer: 'Want your bad romance',
      correct: true,
    },
    {
      answer: 'Want your good romance',
      correct: false,
    },
  ],
};

beforeEach(() => {
  // Clears the state of the dataStore before each test.
  clear();
  sessionId = adminAuthRegister(
    'foo@bar.com',
    'valid1234',
    'valid',
    'valid'
  ).session;
  quizId = adminQuizCreate(
    sessionId,
    'Rah rah rah ah ah',
    'Roma roma ma'
  ).quizId;
  questionIds.push(adminQuestionCreate(sessionId, quizId, questionBody1));
  gameId = adminQuizGameStart(quizId, sessionId, 0).gameId;
});

// Valid testcases
describe('Valid testcases', () => {
  test('correct response type', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    expect(adminPlayerStatus(playerId)).toStrictEqual({
      state: expect.any(String),
      numQuestions: expect.any(Number),
      atQuestion: expect.any(Number),
    });
  });
});

// PlayerId Validation
describe('PlayerId validation', () => {
  test('testing player doesnt exist', () => {
    expect(adminPlayerStatus(123)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});
