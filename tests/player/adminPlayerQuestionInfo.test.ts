// Importing adminPlayerJoin and adminPlayerQuestionInfo from player.ts in helpers dir
import { adminPlayerJoin, adminPlayerQuestionInfo } from '../test_helpers/player';

// Importing adminAuthRegister from auth.ts in helpers dir
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizCreate and adminQuestionCreateV2 from quiz.ts in helpers dir
import { adminQuizCreate, adminQuestionCreateV2 } from '../test_helpers/quiz';

// Importing adminQuizGameStart and adminGameStateUpdate from game.ts in helpers dir
import { adminQuizGameStart, adminGameStateUpdate } from '../test_helpers/game';

// Importing Action from interface.ts in helpers dir
import { Action, QuestionBody } from '../test_helpers/interface';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';

let sessionId: string;
let quizId: number;
const questionIds: number[] = [];
let gameId: number;

const questionBody1: QuestionBody = {
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
  thumbnailUrl: 'http://google.com/some/image/path.jpg',
};

const questionBody2: QuestionBody = {
  question: 'I want your ugly',
  timeLimit: 4,
  points: 5,
  answerOptions: [
    {
      answer: 'I want your desire',
      correct: true,
    },
    {
      answer: 'I want your happiness',
      correct: false,
    },
  ],
  thumbnailUrl: 'http://google.com/some/image/path.jpg',
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
  questionIds.push(
    adminQuestionCreateV2(sessionId, quizId, questionBody1).questionId
  );
  questionIds.push(
    adminQuestionCreateV2(sessionId, quizId, questionBody2).questionId
  );
  gameId = adminQuizGameStart(quizId, sessionId, 0).gameId;
});

// Valid testcases
describe('Valid testcases', () => {
  test('correct response', () => {
    const playerId = adminPlayerJoin(gameId, 'f1r3nz4r').playerId;
    adminGameStateUpdate(sessionId, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(sessionId, quizId, gameId, Action.SKIP_COUNTDOWN);
    expect(adminPlayerQuestionInfo(playerId, 1)).toStrictEqual({
      questionId: questionIds[0],
      question: 'Gaga ooh lala',
      timeLimit: 4,
      points: 5,
      answerOptions: [
        {
          answerId: expect.any(Number),
          answer: 'Want your bad romance',
          colour: expect.any(String),
        },
        {
          answerId: expect.any(Number),
          answer: 'Want your good romance',
          colour: expect.any(String),
        },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    });
  });
});

// PlayerId Validation
describe('PlayerId validation', () => {
  test('testing player doesnt exist', () => {
    expect(adminPlayerQuestionInfo(123, 1)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});

// Question Position Validation
describe('Question position validation', () => {
  test.each([{ questionPos: -10 }, { questionPos: 10 }])(
    'testing invalid questionPos=$questionPos',
    ({ questionPos }) => {
      const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
      expect(adminPlayerQuestionInfo(playerId, questionPos)).toStrictEqual({
        error: expect.any(String),
        statusCode: 400,
      });
    }
  );
});

// Game State Validation
describe('Game state validation', () => {
  test('testing question position that the game is currently not on', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    adminGameStateUpdate(sessionId, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(sessionId, quizId, gameId, Action.SKIP_COUNTDOWN);
    expect(adminPlayerQuestionInfo(playerId, 2)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });

  test('test when game is in LOBBY state', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    expect(adminPlayerQuestionInfo(playerId, 1)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });

  test('test when game is in QUESTION_COUNTDOWN state', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    adminGameStateUpdate(sessionId, quizId, gameId, Action.NEXT_QUESTION);
    expect(adminPlayerQuestionInfo(playerId, 1)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });

  test('test when game is in FINAL_RESULTS state', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    adminGameStateUpdate(sessionId, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(sessionId, quizId, gameId, Action.SKIP_COUNTDOWN);
    adminGameStateUpdate(sessionId, quizId, gameId, Action.GO_TO_ANSWER);
    adminGameStateUpdate(sessionId, quizId, gameId, Action.GO_TO_FINAL_RESULTS);
    expect(adminPlayerQuestionInfo(playerId, 1)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });

  test('test when game is in END state', () => {
    const playerId = adminPlayerJoin(gameId, 'Bob').playerId;
    adminGameStateUpdate(sessionId, quizId, gameId, Action.END);
    expect(adminPlayerQuestionInfo(playerId, 1)).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});
