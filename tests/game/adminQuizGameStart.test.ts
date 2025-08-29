import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminQuizCreate } from '../test_helpers/quiz';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

describe('adminQuizGameStart', () => {
  let userSession : number;
  let quizId : number;
  beforeEach(() => {
    clear();
    userSession = JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'abc@def.com',
        password: "Insecure D0n't know what f0r!",
        nameFirst: 'Abra',
        nameLast: 'Kadabra'
      },
      timeout: TIMEOUT_MS
    }).body.toString()).session;
    quizId = JSON.parse(request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Quiz 1',
        description: 'This is Quiz 1'
      },
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    }).body.toString()).quizId;
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
      });
  });
  test('Session is empty or invalid (does not refer to valid logged in user session) none', () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: '' },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(401);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('Session is empty or invalid (does not refer to valid logged in user session)', () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: (userSession + 1).toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(401);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test(`Valid session is provided, but user is not an owner of 
    this quiz or quiz doesn't exist - doesn't exist`, () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId + 1}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test(`Valid session is provided, but user is not an owner of
     this quiz or quiz doesn't exist - not an owner`, () => {
    const userSession2 = adminAuthRegister(
      'abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz'
    ).session;
    const quizId2 = adminQuizCreate(userSession2.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    request(
      'POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/`, {
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
      }).body.toString();
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('autoStartNum is a number greater than 50', () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 51
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('10 games that are not in END state currently exist for this quiz', () => {
    for (let i = 0; i < 10; i++) {
      request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
        headers: { session: userSession.toString() },
        json: {
          autoStartNum: 3
        },
        timeout: TIMEOUT_MS
      });
    }
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('The quiz does not have any questions in it', () => {
    const quizId2 = adminQuizCreate(userSession.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(400);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('Valid - one quiz', () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
  });
  test('Valid - two of the same quizz', () => {
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
    const req2 = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
  });
  test('Valid - two different quizzes', () => {
    const quizId2 = adminQuizCreate(userSession.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    request(
      'POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/`, {
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
      });

    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
    const req2 = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
  });
  test('Valid - two different quizzes, two different users', () => {
    const userSession2 = adminAuthRegister(
      'abc@defz.com', "Insecurez D0n't know what f0r!", 'Abraz', 'Kadabraz'
    ).session;
    const quizId2 = adminQuizCreate(userSession2.toString(), 'Quiz 2', 'This is Quiz 2').quizId;
    request(
      'POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/question/`, {
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
      });
    const req = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
    const req2 = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`, {
      headers: { session: userSession2.toString() },
      json: {
        autoStartNum: 3
      },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({ gameId: expect.any(Number) });
  });
});
