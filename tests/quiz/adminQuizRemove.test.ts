import { clear } from '../test_helpers/other';
import { adminQuizRemove, adminQuizCreate, adminQuizInfo } from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  clear();
});

describe('Testing for adminQuizRemove', () => {
  let userSession: string;
  let userSession2: string;
  let quizId: number;

  beforeEach(() => {
    const registerResult =
    adminAuthRegister('foo@bar.com', 'valid1234', 'Valid', 'User') as { session: string };
    userSession = registerResult.session;

    // second user has different email address
    const registerResult2 =
    adminAuthRegister('foo2@bar.com', 'valid1234', 'Valid', 'User') as { session: string };
    userSession2 = registerResult2.session;

    const createResult = adminQuizCreate(userSession, 'Valid', 'Description') as { quizId: number };
    quizId = createResult.quizId; // Created for the first user.
  });

  describe('Removes when all values are valid', () => {
    // test 1
    test('Removes quiz and returns an empty object', () => {
      const result = adminQuizRemove(userSession, quizId);
      expect(result).toStrictEqual({});

      // after removal, the session should be empty,
      const removed = adminQuizInfo(userSession, quizId);
      expect(removed).toStrictEqual({ error: expect.any(String), code: 403 });
    });
  });

  describe('Testing for error cases: ', () => {
    // test 2
    test('Checking for empty session', () => {
      // ' ' for invalid userId (might cause issues, plz check)
      const result = adminQuizRemove('', quizId);
      expect(result).toStrictEqual({ error: expect.any(String), code: 401 });
    });

    // test 3
    test('Testing for invalid session', () => {
      const invalidSession = uuidv4();
      const result = adminQuizRemove(invalidSession, quizId);
      expect(result).toStrictEqual({ error: expect.any(String), code: 401 });
    });

    // test 3
    test('checking for invalid quizId', () => {
      // Removing a non exsisting quizid, -1
      const result = adminQuizRemove(userSession, -1);
      expect(result).toStrictEqual({ error: expect.any(String), code: 403 });
    });

    // test 4
    test('returns error when quizId does not belong to the given user', () => {
      // User_2 id and user_1's quizId
      const result = adminQuizRemove(userSession2, quizId);
      expect(result).toStrictEqual({ error: expect.any(String), code: 403 });
    });
  });
});
