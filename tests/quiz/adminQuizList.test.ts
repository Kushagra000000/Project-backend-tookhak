import { adminAuthRegister } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';
import { adminQuizList, adminQuizCreate } from '../test_helpers/quiz';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

test('When a user does not create any quizzes', () => {
  const session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
  expect(adminQuizList(session)).toStrictEqual({ quizzes: [] });
});

describe('When a user creates one quiz', () => {
  let session: string;
  let quizId: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
  });

  test('Empty session', () => {
    expect(adminQuizList('').statusCode).toStrictEqual(401);
  });

  test('Invalid session', () => {
    expect(adminQuizList(uuidv4()).statusCode).toStrictEqual(401);
  });

  test('Check if the correct details are returned', () => {
    expect(adminQuizList(session)).toStrictEqual({
      quizzes: [{ quizId: quizId, name: 'validName' }]
    });
  });

  test('Quiz not owned by the logged in user', () => {
    const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
      'ValidA', 'ValidA').session;
    // Expect an empty array since the logged in user does not own any quizzes.
    expect(adminQuizList(session2)).toStrictEqual({ quizzes: [] });
  });

  test('One user and multiple quizzes', () => {
    const quizId2 = adminQuizCreate(session, 'validName2', 'Quiz 2').quizId;

    const quizList = adminQuizList(session).quizzes;
    // Uses toContainEqual because order does not matter and it can check if the
    // array contains the following objects
    expect(quizList).toContainEqual({ quizId: quizId, name: 'validName' });
    expect(quizList).toContainEqual({ quizId: quizId2, name: 'validName2' });
    expect(quizList.length).toStrictEqual(2);
  });
});

test('Multiple users and multiple quizzes', () => {
  const session1 = adminAuthRegister('foo1@bar.com', 'userpass1',
    'ValidA', 'ValidA').session;
  const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
    'ValidB', 'ValidB').session;
  const quizId1 = adminQuizCreate(session1, 'validName1', 'Quiz 1').quizId;
  const quizId2 = adminQuizCreate(session1, 'validName2', 'Quiz 2').quizId;
  const quizId3 = adminQuizCreate(session2, 'validName3', 'Quiz 3').quizId;
  const quizId4 = adminQuizCreate(session2, 'validName4', 'Quiz 4').quizId;

  const quizList1 = adminQuizList(session1).quizzes;
  // Uses toContainEqual because order does not matter and it can check if the
  // array contains the following objects
  expect(quizList1).toContainEqual({ quizId: quizId1, name: 'validName1' });
  expect(quizList1).toContainEqual({ quizId: quizId2, name: 'validName2' });
  expect(quizList1.length).toStrictEqual(2);

  const quizList2 = adminQuizList(session2).quizzes;
  // Uses toContainEqual because order does not matter and it can check if the
  // array contains the following objects
  expect(quizList2).toContainEqual({ quizId: quizId3, name: 'validName3' });
  expect(quizList2).toContainEqual({ quizId: quizId4, name: 'validName4' });
  expect(quizList2.length).toStrictEqual(2);
});
