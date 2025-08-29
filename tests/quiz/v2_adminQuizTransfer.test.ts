import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';
import { adminQuestionCreateV2, adminQuizCreate } from '../test_helpers/quiz';
import { adminQuizGameStart } from '../test_helpers/game';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5000;

beforeEach(() => {
  clear();
});

describe('/v2/admin/quiz/:quizid/transfer - Valid and Invalid Cases', () => {
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
        description: 'Test transfer v2',
      },
      headers: { session: ownerSession },
      timeout: TIMEOUT_MS,
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;
  });

  test('Successful transfer (v2)', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('Fails with invalid session', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: '' },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails with non-existent quiz', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/99999/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if quiz is not owned by user', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: otherSession },
      json: {
        userEmail: 'owner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails with non-existent userEmail', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'ghost@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if transferring to current user', () => {
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'owner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if the target user already has the quiz', () => {
    adminQuizCreate(otherSession, 'Transfer Quiz', 'Invalid tranfer');
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if any game for the quiz is not in END state', () => {
    const questionBody = {
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
    adminQuestionCreateV2(ownerSession, quizId, questionBody);
    adminQuizGameStart(quizId, ownerSession, 0);
    const res = request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/transfer`, {
      headers: { session: ownerSession },
      json: {
        userEmail: 'newowner@foo.com'
      },
      timeout: TIMEOUT_MS
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });
});
