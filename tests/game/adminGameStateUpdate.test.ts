import {
  adminQuestionCreateV2,
  adminQuizCreate
} from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminGameInfo, adminGameStateUpdate, adminQuizGameStart } from '../test_helpers/game';
import { clear } from '../test_helpers/other';
import { v4 as uuidv4 } from 'uuid';
import { Action } from '../test_helpers/interface';
import { QuizGameState } from '../test_helpers/interface';
import slync from 'slync';
import { adminPlayerJoin } from '../test_helpers/player';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('Create a few quiz questions and start a game', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    const questionBody1 = {
      question: 'Who is the Monarch of England',
      timeLimit: 1,
      points: 5,
      answerOptions: [
        {
          answer: 'Prince Charles',
          correct: true
        },
        {
          answer: 'ABC',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const questionBody2 = {
      question: 'Is this a valid question?',
      timeLimit: 1,
      points: 5,
      answerOptions: [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'No',
          correct: false
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    adminQuestionCreateV2(session, quizId, questionBody1);
    adminQuestionCreateV2(session, quizId, questionBody2);
    gameId = adminQuizGameStart(quizId, session, 30).gameId;
    adminPlayerJoin(gameId, '');
  });

  describe('Invalid cases that should return 401', () => {
    test('Empty Session', () => {
      expect(adminGameStateUpdate('', quizId, gameId, Action.NEXT_QUESTION).statusCode)
        .toStrictEqual(401);
    });

    test('Invalid Session', () => {
      expect(adminGameStateUpdate(uuidv4(), quizId, gameId, Action.NEXT_QUESTION).statusCode)
        .toStrictEqual(401);
    });
  });

  describe('Invalid cases that should return 403', () => {
    test('Valid session, but quiz does not exist', () => {
      expect(adminGameStateUpdate(session, quizId + 1, gameId, Action.NEXT_QUESTION).statusCode)
        .toStrictEqual(403);
    });

    test('Valid session, but user is not the owner of the quiz', () => {
      const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
        'ValidA', 'ValidA').session;
      expect(adminGameStateUpdate(session2, quizId, gameId, Action.NEXT_QUESTION).statusCode)
        .toStrictEqual(403);
    });
  });

  describe('Invalid cases that should return 400', () => {
    test('Game Id does not refer to a valid game within this quiz', () => {
      expect(adminGameStateUpdate(session, quizId, gameId + 1, Action.NEXT_QUESTION).statusCode)
        .toStrictEqual(400);
    });

    test('Action provided is not a valid Action enum', () => {
      expect(adminGameStateUpdate(session, quizId, gameId, 'INVALID_ACTION').statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.GO_TO_ANSWER },
      { action: Action.GO_TO_FINAL_RESULTS },
      { action: Action.SKIP_COUNTDOWN }
    ])('Action enum cannot be applied in LOBBY state', ({ action }) => {
      adminGameInfo(session, quizId, gameId);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.GO_TO_ANSWER },
      { action: Action.GO_TO_FINAL_RESULTS },
      { action: Action.NEXT_QUESTION }
    ])('Action enum cannot be applied in Question_countdown state', ({ action }) => {
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.SKIP_COUNTDOWN },
      { action: Action.GO_TO_FINAL_RESULTS },
      { action: Action.NEXT_QUESTION }
    ])('Action enum cannot be applied in Question_open state', ({ action }) => {
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.GO_TO_ANSWER },
      { action: Action.SKIP_COUNTDOWN }
    ])('Action enum cannot be applied in Answer_show state', ({ action }) => {
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.GO_TO_ANSWER },
      { action: Action.GO_TO_FINAL_RESULTS },
      { action: Action.NEXT_QUESTION },
      { action: Action.SKIP_COUNTDOWN }
    ])('Action enum cannot be applied in FINAL_RESULTS state', ({ action }) => {
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_FINAL_RESULTS);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });

    test.each([
      { action: Action.GO_TO_ANSWER },
      { action: Action.GO_TO_FINAL_RESULTS },
      { action: Action.NEXT_QUESTION },
      { action: Action.SKIP_COUNTDOWN },
      { action: Action.END }
    ])('Action enum cannot be applied in END state', ({ action }) => {
      adminGameStateUpdate(session, quizId, gameId, Action.END);
      expect(adminGameStateUpdate(session, quizId, gameId, action).statusCode)
        .toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return type', () => {
      expect(adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION))
        .toStrictEqual({});
    });

    test.each([
      { action: Action.END, state: QuizGameState.END },
      { action: Action.NEXT_QUESTION, state: QuizGameState.QUESTION_COUNTDOWN }
    ])('Check the side effects (Game is in Lobby state)', ({ action, state }) => {
      adminGameStateUpdate(session, quizId, gameId, action);
      expect(adminGameInfo(session, quizId, gameId).state).toStrictEqual(state);
    });

    test.each([
      { action: Action.END, state: QuizGameState.END },
      { action: Action.SKIP_COUNTDOWN, state: QuizGameState.QUESTION_OPEN }
    ])('Check the side effects (Game is in QUESTION_COUNTDOWN state)', ({ action, state }) => {
      // Ensure the game is in QUESTION_COUNTDOWN state
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);

      adminGameStateUpdate(session, quizId, gameId, action);
      expect(adminGameInfo(session, quizId, gameId).state).toStrictEqual(state);
    });

    test.each([
      { action: Action.END, state: QuizGameState.END },
      { action: Action.GO_TO_ANSWER, state: QuizGameState.ANSWER_SHOW }
    ])('Check the side effects (Game is in QUESTION_OPEN state)', ({ action, state }) => {
      // Ensure the game is in QUESTION_OPEN state
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);

      adminGameStateUpdate(session, quizId, gameId, action);
      expect(adminGameInfo(session, quizId, gameId).state).toStrictEqual(state);
    });

    test.each([
      { action: Action.END, state: QuizGameState.END },
      { action: Action.NEXT_QUESTION, state: QuizGameState.QUESTION_COUNTDOWN },
      { action: Action.GO_TO_FINAL_RESULTS, state: QuizGameState.FINAL_RESULTS }
    ])('Check the side effects (Game is in ANSWER_SHOW state)', ({ action, state }) => {
      // Ensure the game is in ANSWER_SHOW state
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);

      adminGameStateUpdate(session, quizId, gameId, action);
      expect(adminGameInfo(session, quizId, gameId).state).toStrictEqual(state);
    });

    test('Check the side effects (Game is in FINAL_RESULTS state)', () => {
      // Ensure the game is in FINAL_RESULTS state
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_FINAL_RESULTS);

      adminGameStateUpdate(session, quizId, gameId, Action.END);
      expect(adminGameInfo(session, quizId, gameId).state).toStrictEqual(QuizGameState.END);
    });

    test('Check if the state will be automatically updated', () => {
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      expect(adminGameInfo(session, quizId, gameId).state)
        .toStrictEqual(QuizGameState.QUESTION_COUNTDOWN);

      // Wait for 3.5 seconds
      slync(3500);

      // Check again
      expect(adminGameInfo(session, quizId, gameId).state)
        .toStrictEqual(QuizGameState.QUESTION_OPEN);

      // Wait until the question closes
      slync(2500);

      expect(adminGameInfo(session, quizId, gameId).state)
        .toStrictEqual(QuizGameState.QUESTION_CLOSE);
    });
  });
});
