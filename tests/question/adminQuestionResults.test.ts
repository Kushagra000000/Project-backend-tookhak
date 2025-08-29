import { clear } from '../test_helpers/other';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminQuizCreate, adminQuestionCreateV2 } from '../test_helpers/quiz';
import { adminQuizGameStart, adminGameStateUpdate } from '../test_helpers/game';
import {
  adminPlayerJoin,
  playerSubmission,
  adminPlayerQuestionInfo,
  adminQuestionResults
} from '../test_helpers/player';
import { Action } from '../test_helpers/interface';

// also ask can I use any or do I find the type and change?
describe('Testing for adminQuestionResults (Iteration 3)', () => {
  let session: string;
  let quizId: number;
  let questionId: number;
  let gameId: number;
  let playerId: number;

  beforeEach(() => {
    clear();
    session = adminAuthRegister('foo@bar.com', 'pass1234', 'Alice', 'Smith').session;
    quizId = adminQuizCreate(session, 'TestQuiz', 'Description...').quizId;
    questionId = adminQuestionCreateV2(session, quizId, {
      question: 'Is this a question?',
      timeLimit: 5,
      points: 3,
      answerOptions: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: true }
      ],
      thumbnailUrl: 'https://words.jpg' // from adinQuizQuestionUpdate.test.ts
    }).questionId;

    adminQuestionCreateV2(session, quizId, {
      question: 'Is this also an question?',
      timeLimit: 5,
      points: 3,
      answerOptions: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: true }
      ],
      thumbnailUrl: 'https://words.jpg' // from adinQuizQuestionUpdate.test.ts
    });

    // create based on admin game start or something similar
    gameId = adminQuizGameStart(quizId, session, 0).gameId;
    playerId = adminPlayerJoin(gameId, 'Alice').playerId;

    adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
  });

  describe('Testing for error cases', () => {
    // 1.
    test('Checking for invalid player id', () => {
      const res = adminQuestionResults(playerId + 1, 1) as any;
      expect(res.statusCode).toStrictEqual(400);
      expect(res.error).toEqual(expect.any(String));
    });

    // 2.
    test('Chekcing for invalid question position (out of bounds )', () => {
      const res = adminQuestionResults(playerId, -1) as any;
      expect(res.statusCode).toStrictEqual(400);
      expect(res.error).toEqual(expect.any(String));
    });

    // 3.
    test('Checking for incorrect state of the game (not showanswwers)', () => {
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_FINAL_RESULTS);
      const res = adminQuestionResults(playerId, 1) as any;

      expect(res.statusCode).toStrictEqual(400);
      expect(res.error).toEqual(expect.any(String));
    });

    // 4.
    test('Checking for mismatch in game and question', () => {
      const res = adminQuestionResults(playerId, 2) as any;
      expect(res.statusCode).toStrictEqual(400);
      expect(res.error).toEqual(expect.any(String));
    });
  });

  describe('Valid test cases', () => {
    // 5.
    test('Testing when all provided values are correct', () => {
      // get answerId, to compare
      const qInfo = adminPlayerQuestionInfo(playerId, 1);
      const answerIds = qInfo.answerOptions.map((opt: any) => opt.answerId);

      // Simulate submission of answer
      // 1. We're simulating a correct response
      playerSubmission(playerId, 1, answerIds);
      // Check the status after updating the game.
      adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);

      const result = adminQuestionResults(playerId, 1) as any;
      expect(result).toStrictEqual({
        questionId,
        playersCorrect: ['Alice'],
        averageAnswerTime: expect.any(Number),
        percentCorrect: 100
      });
    });
  });
});
