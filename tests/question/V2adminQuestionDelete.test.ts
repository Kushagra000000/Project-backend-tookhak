import { QuestionBody } from '../test_helpers/interface';
import {
  adminQuestionCreateV2,
  adminQuestionDeleteV2,
  adminQuizCreate,
  adminQuizInfoV2
} from '../test_helpers/quiz';
import { adminQuizGameStart } from '../test_helpers/game';
import { adminAuthRegister } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';
import { v4 as uuidv4 } from 'uuid';
import slync from 'slync';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('Delete a quiz question', () => {
  let session: string;
  let quizId: number;
  let questionBody: QuestionBody;
  let questionId: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    questionBody = {
      question: 'Who is the Monarch of England',
      timeLimit: 4,
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
    questionId = adminQuestionCreateV2(session, quizId, questionBody).questionId;
  });

  describe('Error cases that should return 401', () => {
    test('Empty session', () => {
      expect(adminQuestionDeleteV2('', quizId, questionId).statusCode).toStrictEqual(401);
    });

    test('Invalid session', () => {
      expect(adminQuestionDeleteV2(uuidv4(), quizId, questionId).statusCode).toStrictEqual(401);
    });
  });

  describe('Invalid cases that should return 403', () => {
    test('Valid session, but quiz does not exist', () => {
      expect(adminQuestionDeleteV2(session, quizId + 1, questionId).statusCode).toStrictEqual(403);
    });

    test('Valid session, but user is not the owner of the quiz', () => {
      const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
        'ValidA', 'ValidA').session;
      expect(adminQuestionDeleteV2(session2, quizId, questionId).statusCode).toStrictEqual(403);
    });
  });

  describe('Invalid cases that should return 400', () => {
    test('Question Id does not refer to a valid question within this quiz', () => {
      expect(adminQuestionDeleteV2(session, quizId, questionId + 1).statusCode).toStrictEqual(400);
    });

    test('Some game for the quiz is not in END state', () => {
      // A game for the quiz should be in LOBBY state
      adminQuizGameStart(quizId, session, 5);
      expect(adminQuestionDeleteV2(session, quizId, questionId).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return type', () => {
      expect(adminQuestionDeleteV2(session, quizId, questionId)).toStrictEqual({});
    });

    test('Side effects (the quiz info is correctly updated)', () => {
      // Before the delete
      const info = adminQuizInfoV2(session, quizId);
      expect(info).toStrictEqual({
        quizId: quizId,
        name: 'validName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz 1',
        numQuestions: 1,
        questions: [
          {
            questionId: questionId,
            question: questionBody.question,
            timeLimit: questionBody.timeLimit,
            points: questionBody.points,
            answerOptions: [
              {
                answerId: expect.any(Number),
                answer: expect.any(String),
                colour: expect.any(String),
                correct: expect.any(Boolean)
              },
              {
                answerId: expect.any(Number),
                answer: expect.any(String),
                colour: expect.any(String),
                correct: expect.any(Boolean)
              }
            ],
            thumbnailUrl: 'http://google.com/some/image/path.jpg'
          }
        ],
        timeLimit: questionBody.timeLimit,
        thumbnailUrl: ''
      });

      // Wait for 1 second
      slync(1000);
      adminQuestionDeleteV2(session, quizId, questionId);
      // After the delete, the questions array should be empty (Only one question)
      const info2 = adminQuizInfoV2(session, quizId);
      expect(info2).toStrictEqual({
        quizId: quizId,
        name: 'validName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz 1',
        numQuestions: 0,
        questions: [],
        timeLimit: 0,
        thumbnailUrl: ''
      });

      // Check if timeLastEdited is updated
      expect(info2.timeLastEdited).toBeGreaterThan(info.timeLastEdited);
    });
  });
});
