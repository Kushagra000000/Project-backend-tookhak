import { clear } from '../test_helpers/other';
import { adminQuizInfo, adminQuizCreate } from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  clear();
});

describe('Test cases for adminQuizInfo', () => {
  let userSession: string;
  let userSession2: string;
  let quizId: number;

  beforeEach(() => {
    //  repeats before each, for less repetiitive code
    const registerResult =
    adminAuthRegister('foo@bar.com', 'valid1234', 'Valid', 'User') as { session: string };
    userSession = registerResult.session;

    const registerResult2 =
    adminAuthRegister('foo2@bar.com', 'valid1234', 'Valid', 'User') as { session: string };
    userSession2 = registerResult2.session;

    const createResult = adminQuizCreate(userSession, 'Valid', 'Description') as { quizId: number };
    quizId = createResult.quizId;
    // same variable name as adminQuizCreate.test.ts, keep things more uniform
  });

  describe('Valid usage', () => {
    // 1.
    test('Check correct return types of the function adminQuizInfo', () => {
      const info = adminQuizInfo(userSession, quizId);
      expect(info).toStrictEqual({
        quizId: quizId,
        name: 'Valid',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Description',
        numQuestions: 0,
        questions: [],
        timeLimit: 0
      });
    });
  });

  describe('Checking for errors', () => {
    // 2.
    test('Checking for Empty session', () => {
      // -1 as incorrect/invalid session won't work with typescript
      // use empty case
      const info = adminQuizInfo('', quizId);
      expect(info).toStrictEqual({ error: expect.any(String), code: 401 });
    });

    // 3.
    test('Checking for invalid session', () => {
      const invalidSession = uuidv4(); // for both adminQuizInfo and .tostrictequal
      const info = adminQuizInfo(invalidSession, quizId);
      expect(info).toStrictEqual({ error: expect.any(String), code: 401 });
    });

    // 4.
    test('Checking for invalid quiz id', () => {
      const info = adminQuizInfo(userSession, -1);
      expect(info).toStrictEqual({ error: expect.any(String), code: 403 });
    });

    // 4.
    test('Check mismatch of session and quizId, when both are valid', () => {
      // Create another user for another session.
      const info = adminQuizInfo(userSession2, quizId);
      // quizId belongs to first session.
      expect(info).toStrictEqual({ error: expect.any(String), code: 403 });
    });
  });
});
