import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

describe('adminQuizDescriptionUpdate', () => {
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
  });

  test('userId is not a valid user.', () => {
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: 'Something Wack',
      },
      headers: { session: (userSession + 1).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(401);
  });
  test('Quiz ID does not refer to a valid quiz.', () => {
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId + 1}/description`, {
      json: {
        description: 'Something Wack',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(403);
  });
  test('Quiz ID does not refer to a quiz that this user owns.', () => {
    const userSession2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'abc@defg.com',
        password: "Insecure D0't know what f0r!",
        nameFirst: 'Abrag',
        nameLast: 'Kadabrag'
      },
      timeout: TIMEOUT_MS
    }).body.toString()).session;
    const quizId2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Quiz 1',
        description: 'This is Quiz 1'
      },
      headers: { session: userSession2.toString() },
      timeout: TIMEOUT_MS
    }).body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/description`, {
      json: {
        description: 'Something Wack',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(403);
  });
  test('Description is more than 100 characters in length (note: empty strings are OK).', () => {
    const part = 'OneHundredCharactersIsThisLongAccodingTo';
    const description = part + part + part;
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: description,
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
      error: expect.any(String)
    });
    expect(res.statusCode).toStrictEqual(400);
  });
  test('Valid - one user, one quizz', () => {
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: 'Valid Name',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
    });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Valid - one user, two quizzes', () => {
    const quizId2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Quiz 2',
        description: 'This is Quiz 2'
      },
      headers: { session: userSession.toString() },
      timeout: TIMEOUT_MS
    }).body.toString()).quizId;
    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: 'Valid Name',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
    });
    expect(res.statusCode).toStrictEqual(200);

    const res2 = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/description`, {
      json: {
        description: 'Valid Name2',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res2.body.toString())).toStrictEqual({
    });
    expect(res2.statusCode).toStrictEqual(200);
  });
  test('Valid - two user, one quizz', () => {
    // seeing if adding a user randomly breaks it
    const userSession2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'abc@defg.com',
        password: 'Insecure D0n know what f0r!',
        nameFirst: 'Abrag',
        nameLast: 'Kadabrag'
      },
      timeout: TIMEOUT_MS
    }).body.toString()).session;
    expect(JSON.parse(request('GET', SERVER_URL + '/v1/admin/quiz/list', {
      headers: { session: userSession2.toString() }
    }).body.toString())).toStrictEqual({ quizzes: [] });

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: 'Valid Name',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
    });
    expect(res.statusCode).toStrictEqual(200);
  });
  test('Valid - two user, two quizzes', () => {
    const userSession2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'abc@defg.com',
        password: "Insecure D0't know what f0r!",
        nameFirst: 'Abrag',
        nameLast: 'Kadabrag'
      },
      timeout: TIMEOUT_MS
    }).body.toString()).session;
    const quizId2 = JSON.parse(request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Quiz 1',
        description: 'This is Quiz 1'
      },
      headers: { session: userSession2.toString() },
      timeout: TIMEOUT_MS
    }).body.toString()).quizId;

    const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/description`, {
      json: {
        description: 'Valid Name',
      },
      headers: { session: (userSession).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({
    });
    expect(res.statusCode).toStrictEqual(200);

    const res2 = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId2}/description`, {
      json: {
        description: 'Valid Name',
      },
      headers: { session: (userSession2).toString() },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res2.body.toString())).toStrictEqual({
    });
    expect(res2.statusCode).toStrictEqual(200);
  });
});
