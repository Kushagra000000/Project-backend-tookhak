import {
  adminQuestionCreateV2,
  adminQuizCreate
} from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminQuizGameStart, adminGameStateUpdate, adminGameResult } from '../test_helpers/game';
import { clear } from '../test_helpers/other';
import { Action } from '../test_helpers/interface';
import { adminPlayerJoin, playerSubmission } from '../test_helpers/player';
import slync from 'slync';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When a player joins an existing game', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;
  let playerId2: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    const questionBody1 = {
      question: 'Who is the Monarch of England',
      timeLimit: 2,
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
      timeLimit: 2,
      points: 10,
      answerOptions: [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'No',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    adminQuestionCreateV2(session, quizId, questionBody1);
    adminQuestionCreateV2(session, quizId, questionBody2);
    gameId = adminQuizGameStart(quizId, session, 0).gameId;
    playerId = adminPlayerJoin(gameId, 'Valid123').playerId;
    playerId2 = adminPlayerJoin(gameId, 'Valid456').playerId;

    // Update the game state to QUESTION_OPEN
    adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
  });

  describe('Error cases', () => {
    test('PlayerId does not exist', () => {
      expect(playerSubmission(playerId + 1, 1, [0]).statusCode)
        .toStrictEqual(400);
    });

    test('If question position is not valid for the game this player is in', () => {
      expect(playerSubmission(playerId, -1, [0]).statusCode)
        .toStrictEqual(400);
    });

    test('Game is not in QUESTION_OPEN state', () => {
      adminGameStateUpdate(session, quizId, gameId, Action.END);
      expect(playerSubmission(playerId, 1, [0]).statusCode)
        .toStrictEqual(400);
    });

    test('If game is not currently on this question', () => {
      expect(playerSubmission(playerId, 2, [0]).statusCode)
        .toStrictEqual(400);
    });

    test('Answer IDs are not valid for this particular question', () => {
      expect(playerSubmission(playerId, 1, [0 + 1 + 1000]).statusCode)
        .toStrictEqual(400);
    });

    test('There are duplicate answer IDs provided', () => {
      expect(playerSubmission(playerId, 1, [0, 0]).statusCode)
        .toStrictEqual(400);
    });

    test('Less than 1 answer ID was submitted', () => {
      expect(playerSubmission(playerId, 1, []).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return type', () => {
      expect(playerSubmission(playerId, 1, [0])).toStrictEqual({});
    });

    test('Side effects', () => {
      expect(playerSubmission(playerId, 1, [0])).toStrictEqual({});
      slync(1000);

      expect(playerSubmission(playerId2, 1, [0])).toStrictEqual({});
      slync(1500);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_FINAL_RESULTS);

      expect(adminGameResult(session, quizId, gameId).usersRankedByScore)
        .toStrictEqual([
          {
            playerName: 'Valid123',
            score: expect.any(Number)
          },
          {
            playerName: 'Valid456',
            score: expect.any(Number)
          }
        ]);
    });

    test('Multiple submissions', () => {
      expect(playerSubmission(playerId, 1, [0])).toStrictEqual({});
      expect(playerSubmission(playerId, 1, [0])).toStrictEqual({});
      expect(playerSubmission(playerId, 1, [1])).toStrictEqual({});
    });

    test('Answer two questions', () => {
      playerSubmission(playerId, 1, [0]);
      slync(2500);
      adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
      adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);

      expect(playerSubmission(playerId, 2, [0])).toStrictEqual({});
      expect(playerSubmission(playerId2, 2, [0, 1])).toStrictEqual({});

      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_FINAL_RESULTS);
      expect(adminGameResult(session, quizId, gameId).usersRankedByScore)
        .toStrictEqual([
          {
            playerName: 'Valid456',
            score: expect.any(Number)
          },
          {
            playerName: 'Valid123',
            score: expect.any(Number)
          }
        ]);
    });
  });
});
