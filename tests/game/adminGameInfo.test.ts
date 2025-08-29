import { QuestionBody, QuizGameState } from '../test_helpers/interface';
import {
  adminQuestionCreateV2,
  adminQuizCreate,
  adminQuizThumbnail
} from '../test_helpers/quiz';
import { adminGameInfo, adminQuizGameStart } from '../test_helpers/game';
import { adminAuthRegister } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When there is a game for a quiz that has a question', () => {
  let session: string;
  let quizId: number;
  let questionBody1: QuestionBody;
  let questionId: number;
  let gameId: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    questionBody1 = {
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
    questionId = adminQuestionCreateV2(session, quizId, questionBody1).questionId;
    adminQuizThumbnail(session, quizId, 'http://google.com/some/image/path.png');
    gameId = adminQuizGameStart(quizId, session, 30).gameId;
  });

  describe('Error cases that should return 401', () => {
    test('Empty session', () => {
      expect(adminGameInfo('', quizId, gameId).statusCode).toStrictEqual(401);
    });

    test('Invalid session', () => {
      expect(adminGameInfo(uuidv4(), quizId, gameId).statusCode).toStrictEqual(401);
    });
  });

  describe('Invalid cases that should return 403', () => {
    test('Valid session, but quiz does not exist', () => {
      expect(adminGameInfo(session, quizId + 1, gameId).statusCode).toStrictEqual(403);
    });

    test('Valid session, but user is not the owner of the quiz', () => {
      const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
        'ValidA', 'ValidA').session;
      expect(adminGameInfo(session2, quizId, gameId).statusCode).toStrictEqual(403);
    });
  });

  describe('Invalid cases that should return 400', () => {
    test('Game Id does not refer to a valid game for this quiz', () => {
      expect(adminGameInfo(session, quizId, gameId + 1).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return', () => {
      expect(adminGameInfo(session, quizId, gameId)).toStrictEqual({
        state: QuizGameState.LOBBY,
        atQuestion: 0,
        players: [],
        metadata: {
          quizId: quizId,
          name: 'validName',
          description: 'Quiz 1',
          timeCreated: expect.any(Number),
          timeLastEdited: expect.any(Number),
          numQuestions: 1,
          questions: [
            {
              questionId: questionId,
              question: 'Who is the Monarch of England',
              timeLimit: 4,
              points: 5,
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
          timeLimit: 4,
          thumbnailUrl: 'http://google.com/some/image/path.png'
        }
      });
    });

    test('Game Info will not change even if the original quiz has changed', () => {
      const info = adminGameInfo(session, quizId, gameId);
      // The original quiz added a new question
      const questionBody2 = {
        question: 'Is this a valid question?',
        timeLimit: 4,
        points: 5,
        answerOptions: [
          {
            answer: 'Yes',
            correct: true
          },
          {
            answer: 'No',
            correct: false
          }
        ],
        thumbnailUrl: 'http://google.com/some/image/path.jpg'
      };
      expect(adminQuestionCreateV2(session, quizId, questionBody2))
        .toStrictEqual({ questionId: expect.any(Number) });
      const info2 = adminGameInfo(session, quizId, gameId);
      // Nothing should change
      expect(info2).toStrictEqual(info);
    });
  });
});
