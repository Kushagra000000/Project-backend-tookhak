import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminQuizCreate } from '../test_helpers/quiz';
import { clear } from '../test_helpers/other';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;
const error = { error: expect.any(String) };

describe('adminQuizQuestionUpdate', () => {
  let userSession : number;
  let quizId : number;
  let questionId : number;
  beforeEach(() => {
    clear();
    userSession = adminAuthRegister(
      'abc@def.com', "Insecure D0n't know what f0r!", 'Abra', 'Kadabra'
    ).session;
    quizId = adminQuizCreate(
      userSession.toString(), 'Quiz 1', 'This is Quiz 1'
    ).quizId;

    questionId = JSON.parse(
      request(
        'POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question/`, {
          headers: { session: userSession.toString() },
          json: {
            questionBody: {
              question: 'Who is the Monarch of England?',
              timeLimit: 4,
              points: 5,
              answerOptions: [
                {
                  answer: 'Prince Zharles',
                  correct: true
                },
                {
                  answer: 'Prince Zarry',
                  correct: false
                },
              ]
            }
          },
          timeout: TIMEOUT_MS
        }).body.toString()).questionId;
  });
  test('Question Id does not refer to a valid question within this quiz', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId + 1}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(
    `Question string is less than 5 characters in length or greater than 50 characters in length
     - less than 5`, () => {
      const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
        headers: { session: userSession.toString() },
        json: {
          questionBody: {
            question: 'Whoz',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answer: 'Prince Charlez',
                correct: true
              },
              {
                answer: 'Prince Harry',
                correct: false
              },
            ]
          }
        },
        timeout: TIMEOUT_MS
      });
      expect(req.statusCode).toStrictEqual(400);
      expect(JSON.parse(req.body.toString())).toStrictEqual(error);
    });
  test(`Question string is less than 5 characters in length or greater than 50 characters in length
     - greater than 50`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'abrakadabraandformylasttrickimbouttoreachinmybagbru',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charlez',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`The question has more than 6 answers or less than 2 answers
     - less than two answers`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'abrakadabraandformylasttrickimbouttoreachinmybagbru',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charlez',
              correct: true
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test('The question has more than 6 answers or less than 2 answers - more than 6 answers', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'abrakadabraandformylasttrickimbouttoreachinmybagbru',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charlez',
              correct: true
            },
            {
              answer: 'Prince arry',
              correct: false
            },
            {
              answer: 'Prince barry',
              correct: false
            },
            {
              answer: 'Prince carry',
              correct: false
            },
            {
              answer: 'Prince darry',
              correct: false
            },
            {
              answer: 'Prince earry',
              correct: false
            },
            {
              answer: 'Prince farry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test('The question timeLimit is not a positive number', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: -4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`If this question were to be updated, 
    the sum of the question timeLimits in the quiz exceeds 3 minutes`, () => {
    questionId = JSON.parse(
      request(
        'POST', SERVER_URL + `/v1/admin/quiz/${quizId}/question/`, {
          headers: { session: userSession.toString() },
          json: {
            questionBody: {
              question: 'Who is the Monarch of England?',
              timeLimit: 4,
              points: 5,
              answerOptions: [
                {
                  answer: 'Prince Zharles',
                  correct: true
                },
                {
                  answer: 'Prince Zarry',
                  correct: false
                },
              ]
            }
          },
          timeout: TIMEOUT_MS
        }).body.toString()).questionId;
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 180,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`The points awarded for the question are less than 1 or greater than 10
     - less than 1`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 0,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`The points awarded for the question are less than 1 
    or greater than 10 - greater than 10`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 11,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`The length of any answer is shorter than 1 character long, or longer than 30 
    characters long - shorter than 1`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: '',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`The length of any answer is shorter than 1 character long, or longer than 30 
    characters long - longer than 30`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'abrakdabralongerthancharactersb',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test('Any answer strings are duplicates of one another (within the same question)', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Charles',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test('There are no correct answers', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: false
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test('Session is empty or invalid (does not refer to valid logged in user session)', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId
    }`, {
      headers: { session: (userSession + 1).toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(401);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`Valid session is provided, but user is not an owner 
    of this quiz or quiz doesn't exist - doesn't exist`, () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId + 1}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  });
  test(`Valid session is provided, but user is not an owner of 
    this quiz or quiz doesn't exist - doesn't own`, () => {
    const userSession2 = adminAuthRegister(
      'abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz'
    ).session;
    const quizId2 = adminQuizCreate(userSession2.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual(error);
  }
  );
  test('Valid - one user, one quiz, two options', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});
    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - one user, one quiz, three options', () => {
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
            {
              answer: 'Prince Karry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Karry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - one user, multiple quizzes', () => {
    adminQuizCreate(userSession.toString(), 'Quiz 2', 'This is Quiz 2');
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
            {
              answer: 'Prince Karry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Karry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - two users, one quiz', () => {
    adminAuthRegister('abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz');
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - two users, two quizzes', () => {
    const userSession2 = adminAuthRegister(
      'abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz'
    ).session;
    adminQuizCreate(userSession2.toString(), 'Quiz 2', 'This is Quiz 2');
    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - one user, two questions updated', () => {
    const quizId2 = adminQuizCreate(userSession.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    const questionId2 = JSON.parse(request('POST',
      SERVER_URL + `/v1/admin/quiz/${quizId2}/question`, {
        headers: { session: userSession.toString() },
        json: {
          questionBody: {
            question: 'Who is the Monarch of England?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answer: 'Prince Zharles',
                correct: true
              },
              {
                answer: 'Prince Zarry',
                correct: false
              },
            ]
          }
        },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const req2 = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/${questionId2}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?2',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles2',
              correct: true
            },
            {
              answer: 'Prince Harry2',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({});
  });
  test('Valid - two users, two questions updated', () => {
    const userSession2 = adminAuthRegister(
      'abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz'
    ).session;
    const quizId2 = adminQuizCreate(userSession2.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    const questionId2 = JSON.parse(request('POST',
      SERVER_URL + `/v1/admin/quiz/${quizId2}/question`, {
        headers: { session: userSession2.toString() },
        json: {
          questionBody: {
            question: 'Who is the Monarch of England?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answer: 'Prince Zharles',
                correct: true
              },
              {
                answer: 'Prince Zarry',
                correct: false
              },
            ]
          }
        },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 2,
          points: 3,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const req2 = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/${questionId2}`, {
      headers: { session: userSession2.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?2',
          timeLimit: 2,
          points: 3,
          answerOptions: [
            {
              answer: 'Prince Charles2',
              correct: true
            },
            {
              answer: 'Prince Harry2',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({});

    const questionList = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}`,
      { headers: { session: userSession.toString() } }).body.toString());
    expect(questionList).toStrictEqual({
      quizId: quizId,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId,
          question: 'Who is the Monarch of England?',
          timeLimit: 2,
          points: 3,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));

    const questionList2 = JSON.parse(request('GET', SERVER_URL + `/v1/admin/quiz/${quizId2}`,
      { headers: { session: userSession2.toString() } }).body.toString());
    expect(questionList2).toStrictEqual({
      quizId: quizId2,
      name: expect.any(String),
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: expect.any(String),
      numQuestions: 1,
      questions: [
        {
          questionId: questionId2,
          question: 'Who is the Monarch of England?2',
          timeLimit: 2,
          points: 3,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles2',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'Prince Harry2',
              colour: expect.any(String),
              correct: false
            },
          ]
        }
      ],
      timeLimit: expect.any(Number)
    });
    expect(parseInt(questionList2.timeLastEdited))
      .toBeGreaterThanOrEqual(Math.floor(Date.now() / 1000) - 1);
    expect(parseInt(questionList2.timeLastEdited))
      .toBeLessThanOrEqual(Math.floor(Date.now() / 1000));
  });
  test('Valid - one quiz, two questions', () => {
    const questionId2 = JSON.parse(request('POST',
      SERVER_URL + `/v1/admin/quiz/${quizId}/question`, {
        headers: { session: userSession.toString() },
        json: {
          questionBody: {
            question: 'Who is the Monarch of England?',
            timeLimit: 4,
            points: 5,
            answerOptions: [
              {
                answer: 'Prince Zharles',
                correct: true
              },
              {
                answer: 'Prince Zarry',
                correct: false
              },
            ]
          }
        },
        timeout: TIMEOUT_MS
      }).body.toString()).questionId;

    const req = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              correct: true
            },
            {
              answer: 'Prince Harry',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({});

    const req2 = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId2}`, {
      headers: { session: userSession.toString() },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England?2',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles2',
              correct: true
            },
            {
              answer: 'Prince Harry2',
              correct: false
            },
          ]
        }
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({});
  });
});
