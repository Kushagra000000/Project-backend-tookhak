// Importing adminPlayerJoin from player.ts in helpers dir
import { adminPlayerJoin } from '../test_helpers/player';

// Importing adminAuthRegister from auth.ts in helpers dir
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizCreate and adminQuestionCreate from quiz.ts in helpers dir
import { adminQuizCreate, adminQuestionCreate } from '../test_helpers/quiz';

// Importing adminQuizGameStart and adminGameStateUpdate from game.ts in helpers dir
import { adminQuizGameStart, adminGameStateUpdate, adminGameInfo } from '../test_helpers/game';

// Importing Action from interface.ts in helpers dir
import { Action } from '../test_helpers/interface';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';
import { QuizGameState } from '../../src/backend/interface';

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
    expect(adminPlayerJoin(gameId, 'f1r3nz4r')).toStrictEqual({ playerId: expect.any(Number) });
  });
  test('testing when no name is given', () => {
    expect(adminPlayerJoin(gameId, '')).toStrictEqual({ playerId: expect.any(Number) });
  });

  test('Multiple join', () => {
    const id1 = adminPlayerJoin(gameId, '').playerId;
    const id2 = adminPlayerJoin(gameId, '').playerId;
    expect(id1).not.toStrictEqual(id2);
  });

  test('Start the game automatically when the autoStartNum is reached', () => {
    const gameId2 = adminQuizGameStart(quizId, sessionId, 1).gameId;
    adminPlayerJoin(gameId2, '');
    expect(adminGameInfo(sessionId, quizId, gameId2).state)
      .toStrictEqual(QuizGameState.QUESTION_COUNTDOWN);
  });
});

// Name Validation
describe('Name validation', () => {
  test.each([{ name: 'rex\'' }, { name: 'r@7' }, { name: 'br*ke' }])(
    'testing invalid name=$name',
    ({ name }) => {
      expect(adminPlayerJoin(gameId, name)).toStrictEqual({
        error: expect.any(String),
        statusCode: 400,
      });
    }
  );

  test('testing name already exists', () => {
    adminPlayerJoin(gameId, 'Bob');
    expect(adminPlayerJoin(gameId, 'Bob')).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});

// Game State Validation
describe('Game state validation', () => {
  test('testing invalid gameId', () => {
    expect(adminPlayerJoin(123, 'Bob')).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });

  test('test when game is not in LOBBY state', () => {
    adminGameStateUpdate(sessionId, quizId, gameId, Action.NEXT_QUESTION);
    expect(adminPlayerJoin(gameId, 'Bob')).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});
