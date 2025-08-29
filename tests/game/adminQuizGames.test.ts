import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { adminAuthRegister } from '../test_helpers/auth';
import { adminQuizCreate } from '../test_helpers/quiz';
import { clear } from '../test_helpers/other';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

describe('GET /v1/admin/quiz/{quizid}/games', () => {
  let userSession: number;
  let quizId: number;
  let gameId: number;
  beforeEach(() => {
    clear();
    userSession = adminAuthRegister(
      'abc@def.com', "Insecure D0n't know what f0r!", 'Abra', 'Kadabra'
    ).session;
    quizId = adminQuizCreate(
      userSession.toString(), 'Quiz 1', 'This is Quiz 1'
    ).quizId;

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
    gameId = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;
  });

  test('invalid - empty session', () => {
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: '' },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(401);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('invalid - invalid session', () => {
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: '' },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(401);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('Valid session is provided, but user is not an owner of this quiz', () => {
    const userSession2 = adminAuthRegister(
      'abcg@def.com', "Insecure D0n't know what f0r!", 'Abrag', 'Kadabrag'
    ).session;
    const quizId2 = adminQuizCreate(
      userSession2.toString(), 'Quiz 2', 'This is Quiz 2'
    ).quizId;
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId2}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });
  test('Valid session is provided, but quiz doesn\'t exist', () => {
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId + 1}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(403);
    expect(JSON.parse(req.body.toString())).toStrictEqual({ error: expect.any(String) });
  });

  test('valid - inactive quiz', () => {
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
      ],
      inactiveGames: [
        gameId
      ]
    });
  });
  test('valid - active quiz', () => {
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId
      ],
      inactiveGames: [

      ]
    });
  });
  test('valid - quiz with no games', () => {
    clear();
    userSession = adminAuthRegister(
      'abc@def.com', "Insecure D0n't know what f0r!", 'Abra', 'Kadabra'
    ).session;
    quizId = adminQuizCreate(
      userSession.toString(), 'Quiz 1', 'This is Quiz 1'
    ).quizId;

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
    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
      ],
      inactiveGames: [
      ]
    });
  });
  test('valid - one active one inactive', () => {
    const gameId2 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId2
      ],
      inactiveGames: [
        gameId
      ]
    });
  });
  test('valid - one active two inactive', () => {
    const gameId2 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    const gameId3 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });
    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId2}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId3
      ],
      inactiveGames: [
        gameId,
        gameId2
      ]
    });
  });
  test('valid - two active one inactive', () => {
    const gameId2 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    const gameId3 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId2, gameId3
      ],
      inactiveGames: [
        gameId,
      ]
    });
  });
  test('valid - two active two inactive', () => {
    const gameId2 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    const gameId3 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    const gameId4 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId2}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId3, gameId4
      ],
      inactiveGames: [
        gameId, gameId2
      ]
    });
  });
  test('valid - two active two inactive - made by two separate users', () => {
    const userSession2 = adminAuthRegister(
      'abcg@def.com', "Insecure D0n't know what f0r!", 'Abrag', 'Kadabrag'
    ).session;
    const quizId2 = adminQuizCreate(
      userSession2.toString(), 'Quiz 1', 'This is Quiz 1'
    ).quizId;

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
    const gameId4 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`,
      {
        headers: { session: userSession2.toString() },
        json: {
          autoStartNum: 3,
        },
        timeout: TIMEOUT_MS
      }).body.toString()).gameId;

    const gameId3 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/start`,
      {
        headers: { session: userSession2.toString() },
        json: {
          autoStartNum: 3,
        },
        timeout: TIMEOUT_MS
      }).body.toString()).gameId;

    const gameId2 = JSON.parse(request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session: userSession.toString() },
      json: {
        autoStartNum: 3,
      },
      timeout: TIMEOUT_MS
    }).body.toString()).gameId;

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/game/${gameId3}`, {
      headers: { session: userSession2.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session: userSession.toString() },
      json: {
        action: 'END'
      },
      timeout: TIMEOUT_MS
    });

    const req = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/games`, {
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req.statusCode).toStrictEqual(200);
    expect(JSON.parse(req.body.toString())).toStrictEqual({
      activeGames: [
        gameId2
      ],
      inactiveGames: [
        gameId
      ]
    });

    const req2 = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId2}/games`, {
      headers: { session: userSession2.toString() },
      timeout: TIMEOUT_MS
    });
    expect(req2.statusCode).toStrictEqual(200);
    expect(JSON.parse(req2.body.toString())).toStrictEqual({
      activeGames: [
        gameId4
      ],
      inactiveGames: [
        gameId3
      ]
    });
  });
});
