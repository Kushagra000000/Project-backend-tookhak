import { clear } from '../test_helpers/other';
import { adminQuizInfoV2, adminQuizCreate, adminQuizThumbnail } from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  clear();
});

describe('Test cases for adminQuizInfo_v2', () => {
  let userSession: string;
  let userSession2: string;
  let quizId: number;

  beforeEach(() => {
    userSession = adminAuthRegister('foo@bar.com', 'valid1234', 'Valid', 'User').session;
    userSession2 = adminAuthRegister('foo2@bar.com', 'valid1234', 'Valid', 'User').session;
    quizId = adminQuizCreate(userSession, 'Valid', 'Description').quizId;
    // same variable name as adminQuizCreate.test.ts, keep things more uniform
  });

  describe('Valid usage', () => {
    // 1.
    test('returns correct quiz info object', () => {
      adminQuizThumbnail(userSession, quizId, 'http://google.com/some/image/path.jpg');
      const info = adminQuizInfoV2(userSession, quizId);
      expect(info).toStrictEqual({
        quizId,
        name: 'Valid',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      });
    });
  });

  describe('Checking for errors', () => {
    // 2.
    test('Checking for Empty session (401)', () => {
      // similar to adminQuizInfo.test.ts
      expect(adminQuizInfoV2('', quizId).statusCode).toStrictEqual(401);
    });

    // 3.
    test('Checking for invalid sessino (401)', () => {
      expect(adminQuizInfoV2(uuidv4(), quizId).statusCode).toStrictEqual(401);
    });

    // 4.
    test('Checking for invalid quizID (403)', () => {
      expect(adminQuizInfoV2(userSession, -1).statusCode).toStrictEqual(403);
    });

    // 5.
    test('Check mismatch of session and quizId, when both are valid (403)', () => {
      expect(adminQuizInfoV2(userSession2, quizId).statusCode).toStrictEqual(403);
    });
  });
});
