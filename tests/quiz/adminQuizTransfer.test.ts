import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clear();
});

describe('/v1/admin/quiz/:quizid/transfer - Valid and Invalid Cases', () => {
  let ownerSession: string;
  let otherSession: string;
  let quizId: number;

  beforeEach(() => {
    // Register two users
    const res1 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'owner@foo.com',
        password: 'pass1234',
        nameFirst: 'Owner',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS,
    });
    ownerSession = JSON.parse(res1.body.toString()).session;

    const res2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'newowner@foo.com',
        password: 'pass1234',
        nameFirst: 'New',
        nameLast: 'Owner'
      },
      timeout: TIMEOUT_MS,
    });
    otherSession = JSON.parse(res2.body.toString()).session;

    // Create quiz with owner
    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      json: {
        name: 'Transfer Quiz',
        description: 'Test transfer feature',
      },
      headers: { session: ownerSession },
      timeout: TIMEOUT_MS,
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;
  });

  test('Successful transfer', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({});
    expect(res.statusCode).toBe(200);
  });

  test('Invalid session - empty', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session: '' },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
    expect(res.statusCode).toBe(401);
  });

  test('Invalid session - random token', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session: 'invalid-session' },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
    expect(res.statusCode).toBe(401);
  });

  test('Quiz does not exist', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/99999/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
    expect(res.statusCode).toBe(403);
  });

  test('Quiz exists but not owned by user', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session: otherSession },
      json: {
        userEmail: 'owner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
    expect(res.statusCode).toBe(403);
  });

  test('Target user does not exist', () => {
    const res = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'nonexistent@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
    expect(res.statusCode).toBe(400);
  });
});
