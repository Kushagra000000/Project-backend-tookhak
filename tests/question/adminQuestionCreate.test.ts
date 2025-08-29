import { QuestionBody, Colour } from '../test_helpers/interface';
import {
  adminQuestionCreate,
  adminQuizCreate,
  adminQuizInfo
} from '../test_helpers/quiz';
import { adminAuthRegister } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';
import { v4 as uuidv4 } from 'uuid';
import slync from 'slync';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('Create a quiz question', () => {
  let session: string;
  let quizId: number;
  let questionBody: QuestionBody;
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
      ]
    };
  });

  const colours: Colour[] = ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];

  describe('Invalid cases that should return 401', () => {
    test('Empty Session', () => {
      expect(adminQuestionCreate('', quizId, questionBody).statusCode).toStrictEqual(401);
    });

    test('Invalid Session', () => {
      expect(adminQuestionCreate(uuidv4(), quizId, questionBody).statusCode).toStrictEqual(401);
    });
  });

  describe('Invalid cases that should return 403', () => {
    test('Valid session, but quiz does not exist', () => {
      expect(adminQuestionCreate(session, quizId + 1, questionBody).statusCode).toStrictEqual(403);
    });

    test('Valid session, but user is not the owner of the quiz', () => {
      const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
        'ValidA', 'ValidA').session;
      expect(adminQuestionCreate(session2, quizId, questionBody).statusCode).toStrictEqual(403);
    });
  });

  describe('Invalid cases that should return 400', () => {
    test.each([
      { question: '' },
      { question: 'a' },
      { question: 'ab' },
      { question: 'abc' },
      { question: 'abcd' }
    ])('Question string is less than 5 characters in length', ({ question }) => {
      questionBody.question = question;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('Question string is more than 50 characters in length', () => {
      // 70 characters long
      questionBody.question = 'invalid'.repeat(10);
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The question has more than 6 answers', () => {
      // Add another five answers to the existing 2 answers
      for (let i = 0; i < 5; i++) {
        questionBody.answerOptions.push({ answer: `ABC${i}`, correct: false });
      }

      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The question has less than 2 answers', () => {
      // Remove an answer
      questionBody.answerOptions = [{
        answer: 'Prince Charles',
        correct: true
      }];

      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The question timeLimit is not a positive number', () => {
      // Give a negative number
      questionBody.timeLimit = -1;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The sum of the question timeLimits in the quiz exceeds 3 minutes', () => {
      // 3 minutes is equal to 180 seconds
      questionBody.timeLimit = 181;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The points awarded for the question are less than 1', () => {
      // No points
      questionBody.points = 0;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The points awarded for the question are greater than 10', () => {
      questionBody.points = 11;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The length of any answer is shorter than 1 character long', () => {
      questionBody.answerOptions[1].answer = '';
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('The length of any answer is longer than 30 characters long', () => {
      questionBody.answerOptions[1].answer =
      'qwertyuiopasdfghjklzxcvbnm123456';
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('Any answer strings are duplicates of one another (within the same question)', () => {
      questionBody.answerOptions = [
        {
          answer: 'Same',
          correct: true
        },
        {
          answer: 'Same',
          correct: true
        }
      ];
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });

    test('There are no correct answers', () => {
      // Set all answers correctness to false
      questionBody.answerOptions[0].correct = false;
      expect(adminQuestionCreate(session, quizId, questionBody).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return type', () => {
      expect(adminQuestionCreate(session, quizId, questionBody))
        .toStrictEqual({ questionId: expect.any(Number) });
    });

    test('Side effects (The question is correctly created and is inside the quiz)', () => {
      slync(1000);
      const questionId = adminQuestionCreate(session, quizId, questionBody).questionId;

      // Check if the information of the quiz except answers are correct
      const info = adminQuizInfo(session, quizId);
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
            ]
          }
        ],
        timeLimit: questionBody.timeLimit
      });

      // Check edit time
      expect(info.timeLastEdited).toBeGreaterThan(info.timeCreated);

      // Use toContainEqual to check the outputs of the answers
      const answers = info.questions[0].answerOptions;
      expect(answers).toContainEqual(
        {
          answerId: expect.any(Number),
          answer: 'Prince Charles',
          colour: expect.any(String),
          correct: true
        }
      );
      expect(answers).toContainEqual(
        {
          answerId: expect.any(Number),
          answer: 'ABC',
          colour: expect.any(String),
          correct: false
        }
      );

      // Check if the colour is any of the 7 colours
      expect(colours).toContainEqual(answers[0].colour);
      expect(colours).toContainEqual(answers[1].colour);

      // Uniqueness of answerId.
      expect(answers[0].answerId).not.toStrictEqual(answers[1].answerId);
    });

    test('Multiple questions added', () => {
      slync(1000);
      const questionBody2: QuestionBody = {
        question: 'Is this question valid',
        timeLimit: 10,
        points: 10,
        answerOptions: [
          {
            answer: 'valid',
            correct: true
          },
          {
            answer: 'ABC',
            correct: false
          }
        ]
      };

      const questionId1 = adminQuestionCreate(session, quizId, questionBody).questionId;
      const questionId2 = adminQuestionCreate(session, quizId, questionBody2).questionId;
      // Uniqueness of questionIds
      expect(questionId1).not.toStrictEqual(questionId2);

      // Check if the numQuestions and timeLimit are correct.
      const info = adminQuizInfo(session, quizId);
      expect(info).toStrictEqual({
        quizId: quizId,
        name: 'validName',
        timeCreated: expect.any(Number),
        timeLastEdited: expect.any(Number),
        description: 'Quiz 1',
        numQuestions: 2,
        questions: [
          {
            questionId: expect.any(Number),
            question: expect.any(String),
            timeLimit: expect.any(Number),
            points: expect.any(Number),
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
            ]
          },
          {
            questionId: expect.any(Number),
            question: expect.any(String),
            timeLimit: expect.any(Number),
            points: expect.any(Number),
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
            ]
          }
        ],
        timeLimit: questionBody.timeLimit + questionBody2.timeLimit
      });

      // Check edit time
      expect(info.timeLastEdited).toBeGreaterThan(info.timeCreated);

      // Check if both questions are created correctly.
      const questions = adminQuizInfo(session, quizId).questions;
      // The answeroptions fields are in any because the array can be in any order
      expect(questions).toContainEqual(
        {
          questionId: questionId1,
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
          ]
        }
      );
      expect(questions).toContainEqual(
        {
          questionId: questionId2,
          question: questionBody2.question,
          timeLimit: questionBody2.timeLimit,
          points: questionBody2.points,
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
          ]
        }
      );
    });
  });
});
