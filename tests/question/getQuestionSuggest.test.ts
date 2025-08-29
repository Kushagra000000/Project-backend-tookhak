import { getQuestionSuggestion } from '../test_helpers/quiz';
import { adminQuizCreate } from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';
import { clear } from '../test_helpers/other';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('getQuestionSuggestion', () => {
  let session: string;
  let quizId: number;

  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'User').session;
    quizId = adminQuizCreate(session, 'Kushagra', 'Jojo bizzare adventure').quizId;
  });

  test('Checking for valid inputs', () => {
    const result = getQuestionSuggestion(session, quizId);
    expect(result).toStrictEqual({ question: expect.any(String) });
  });

  // 2.
  test('Checking for invalid user/session id', () => {
    const invalidSession = uuidv4();
    const result = getQuestionSuggestion(invalidSession, quizId);
    expect(result).toStrictEqual({ error: expect.any(String), statusCode: 401 });
  });

  // 3.
  test('Checking when invlaid quizId', () => {
    const invalidQuizId = quizId + 1000; // not work if this quizId already there!
    const result = getQuestionSuggestion(session, invalidQuizId);
    expect(result).toStrictEqual({ error: expect.any(String), statusCode: 403 });
  });
});
// comment, for git commit to work!
