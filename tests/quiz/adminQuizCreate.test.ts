import { adminQuizCreate, adminQuizInfo } from '../test_helpers/quiz';
import { clear } from '../test_helpers/other';
import { adminAuthRegister } from '../test_helpers/auth';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When there is one user', () => {
  let userSession: string;
  beforeEach(() => {
    userSession = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
  });

  describe('Error cases that should return 401', () => {
    test('Empty session', () => {
      expect(adminQuizCreate('', 'validName', 'Quiz 1').statusCode).toStrictEqual(401);
    });

    test('Invalid session', () => {
      expect(adminQuizCreate(uuidv4(), 'validName', 'Quiz 1').statusCode).toStrictEqual(401);
    });
  });

  describe('Error cases that should return 400', () => {
    test('Name with invalid characters', () => {
      expect(adminQuizCreate(userSession, 'invalid^1', 'Quiz 1').statusCode).toStrictEqual(400);
    });

    test.each([
      { name: '', description: 'Quiz 1' },
      { name: 'a', description: 'Quiz 1' },
      { name: 'b', description: 'Quiz 1' },
    ])('Name less than 3 characters', ({ name, description }) => {
      expect(adminQuizCreate(userSession, name, description).statusCode).toStrictEqual(400);
    });

    test('Name more than 30 characters', () => {
      expect(adminQuizCreate(userSession,
        'qwertyuiopasdfghjklzxcvbnm123456789', 'Quiz 1').statusCode).toStrictEqual(400);
    });

    test('Name already used by another quiz owned by the user', () => {
      adminQuizCreate(userSession, 'valid', 'Quiz 1');
      expect(adminQuizCreate(userSession, 'valid', 'Quiz 1').statusCode).toStrictEqual(400);
    });

    test('Description is more than 100 characters', () => {
      // Create a very long description
      const description = 'x'.repeat(101);

      expect(adminQuizCreate(userSession, 'valid', description).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Check if a quiz is created correctly', () => {
      const quiz = adminQuizCreate(userSession, 'valid', '');
      // Check if the return value (quizId) is correct or not
      expect(quiz).toStrictEqual({ quizId: expect.any(Number) });

      const quizId = quiz.quizId;

      // Check the side effects (if data is updated correctly after quiz created)
      expect(adminQuizInfo(userSession, quizId)).toStrictEqual({
        quizId: quizId,
        name: 'valid',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: '',
        numQuestions: 0,
        questions: [],
        timeLimit: 0
      });
    });

    test('Can create multiple quizzes correctly', () => {
      const quiz1 = adminQuizCreate(userSession, 'valid1', 'Quiz 1');
      const quiz2 = adminQuizCreate(userSession, 'valid2', 'Quiz 2');
      expect(quiz2).toStrictEqual({ quizId: expect.any(Number) });

      const quizId1 = quiz1.quizId;
      const quizId2 = quiz2.quizId;

      expect(adminQuizInfo(userSession, quizId2)).toStrictEqual({
        quizId: quizId2,
        name: 'valid2',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz 2',
        numQuestions: 0,
        questions: [],
        timeLimit: 0
      });

      // Ensure the uniqueness of quizIds
      expect(quizId1).not.toStrictEqual(quizId2);
    });

    test('See if another user can create a quiz with the same quiz name', () => {
      // Created by the user already exist
      const quizId1 = adminQuizCreate(userSession, 'valid1', 'Quiz 1').quizId;

      const userSession2 = adminAuthRegister('foo2@bar.com', 'userpass1', 'ValidB', 'ValidB')
        .session;
      // Create a new quiz by the new user, using the same quiz name.
      const quiz2 = adminQuizCreate(userSession2, 'valid1', 'Quiz 2');
      expect(quiz2).toStrictEqual({ quizId: expect.any(Number) });

      const quizId2 = quiz2.quizId;
      expect(adminQuizInfo(userSession2, quizId2)).toStrictEqual({
        quizId: quizId2,
        name: 'valid1',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz 2',
        numQuestions: 0,
        questions: [],
        timeLimit: 0
      });

      // Check if two quizIds are different
      expect(quizId1).not.toStrictEqual(quizId2);
    });
  });
});

test('Can create quizzes for different users', () => {
  const userSession1 = adminAuthRegister('foo@bar.com', 'userpass1',
    'Valid', 'Valid').session;
  const userSession2 = adminAuthRegister('foo2@bar.com', 'userpass1',
    'ValidB', 'ValidB').session;

  const quizId1 = adminQuizCreate(userSession1, 'valid1', 'Quiz 1').quizId;
  const quiz2 = adminQuizCreate(userSession1, 'valid2', 'Quiz 2');
  expect(quiz2).toStrictEqual({ quizId: expect.any(Number) });

  const quizId2 = quiz2.quizId;
  expect(adminQuizInfo(userSession1, quizId2)).toStrictEqual({
    quizId: quizId2,
    name: 'valid2',
    timeCreated: expect.any(Number),
    timeLastEdited: expect.any(Number),
    description: 'Quiz 2',
    numQuestions: 0,
    questions: [],
    timeLimit: 0
  });

  // Ensure the uniqueness of quizIds
  expect(quizId1).not.toStrictEqual(quizId2);

  const quizId3 = adminQuizCreate(userSession2, 'valid3', 'Quiz 3').quizId;
  const quiz4 = adminQuizCreate(userSession2, 'valid4', 'Quiz 4');
  expect(quiz4).toStrictEqual({ quizId: expect.any(Number) });

  const quizId4 = quiz4.quizId;
  expect(adminQuizInfo(userSession2, quizId4)).toStrictEqual({
    quizId: quizId4,
    name: 'valid4',
    timeCreated: expect.any(Number),
    timeLastEdited: expect.any(Number),
    description: 'Quiz 4',
    numQuestions: 0,
    questions: [],
    timeLimit: 0
  });

  // Ensure the uniqueness of quizIds
  expect(quizId3).not.toStrictEqual(quizId4);

  // Ensure that quizIds are unique across different users
  expect(quizId2).not.toStrictEqual(quizId4);
});
