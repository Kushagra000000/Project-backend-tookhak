// tests/v2_adminQuizRemove.test.ts
import { clear } from '../test_helpers/other';
import {
  adminQuizRemoveV2,
  adminQuizInfoV2,
  adminQuizCreate,
  adminQuestionCreateV2
} from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';
import { adminQuizGameStart } from '../test_helpers/game';

beforeEach(() => {
  clear();
});

describe('Testing adminQuizRemove v2', () => {
  let userSession: string;
  let userSession2: string;
  let quizId: number;

  beforeEach(() => {
    userSession = adminAuthRegister('foo@bar.com', 'valid1234', 'Valid', 'User').session;
    userSession2 = adminAuthRegister('foo2@bar.com', 'valid1234', 'Valid', 'User').session;
    quizId = adminQuizCreate(userSession, 'Valid', 'Description').quizId;

    adminQuestionCreateV2(userSession, quizId, {
      question: 'Project backend is ez or not?',
      timeLimit: 10,
      points: 1,
      answerOptions: [
        { answer: 'Yes', correct: true },
        { answer: 'No', correct: false },
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    });
  });

  describe('Checking for valid inputs', () => {
    test('Checking for sucessful quiz remove, rechecking with quizInfo', () => {
      expect(adminQuizRemoveV2(userSession, quizId)).toStrictEqual({});
      expect(adminQuizInfoV2(userSession, quizId).statusCode).toStrictEqual(403);
    });
  });

  describe('Error cases', () => {
    test('Checking for empty sessionId', () => {
      expect(adminQuizRemoveV2('', quizId).statusCode).toStrictEqual(401);
    });

    test('Checking for invalid session Id', () => {
      expect(adminQuizRemoveV2(uuidv4(), quizId).statusCode).toStrictEqual(401);
    });

    test('Checking for invalid quizId', () => {
      expect(adminQuizRemoveV2(userSession, -1).statusCode).toStrictEqual(403);
    });

    test('Session Id not matching quizId', () => {
      expect(adminQuizRemoveV2(userSession2, quizId).statusCode).toStrictEqual(403);
    });

    test('Cannot remove quiz when a game is not in END state', () => {
      // Start a game so it's not in END state (initially LOBBY)
      adminQuizGameStart(quizId, userSession, 0);
      const result = adminQuizRemoveV2(userSession, quizId);
      expect(result.statusCode).toStrictEqual(400);
      // expect(result.error).toStrictEqual(expect.any(String));
    });
  });
});
