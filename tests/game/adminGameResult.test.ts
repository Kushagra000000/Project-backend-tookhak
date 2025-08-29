
import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';
import { adminPlayerJoin } from '../test_helpers/player';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5000;

describe('/v1/admin/quiz/:quizid/game/:gameid/results', () => {
  let session : string;
  let quizId : number;
  let gameId : number;

  beforeEach(() => {
    clear();

    const reg = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'admin@example.com',
        password: 'pass1234',
        nameFirst: 'admin',
        nameLast: 'newfoo',
      },
      timeout: TIMEOUT_MS,
    });
    session = JSON.parse(reg.body.toString()).session;

    const qz = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
      headers: { session },
      json: { name: 'Maths', description: 'Quick maths' },
      timeout: TIMEOUT_MS,
    });
    quizId = JSON.parse(qz.body.toString()).quizId;

    request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/question`, {
      headers: { session },
      json: {
        questionBody: {
          question: '2 + 2 = ?',
          timeLimit: 5,
          points: 10,
          answerOptions: [
            { answer: '3', correct: false },
            { answer: '4', correct: true },
          ],
        },
      },
      timeout: TIMEOUT_MS,
    });

    const gm = request('POST',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/start`,
      {
        headers: { session },
        json: { autoStartNum: 0 },
        timeout: TIMEOUT_MS,
      });
    gameId = JSON.parse(gm.body.toString()).gameId;

    adminPlayerJoin(gameId, '');
    adminPlayerJoin(gameId, '');
  });

  const advanceToFinalResults = () => {
    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session },
      json: { action: 'NEXT_QUESTION' },
      timeout: TIMEOUT_MS,
    });

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session },
      json: { action: 'SKIP_COUNTDOWN' },
      timeout: TIMEOUT_MS,
    });

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session },
      json: { action: 'GO_TO_ANSWER' },
      timeout: TIMEOUT_MS,
    });

    request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
      headers: { session },
      json: { action: 'GO_TO_FINAL_RESULTS' },
      timeout: TIMEOUT_MS,
    });
  };

  test('Returns final results successfully', () => {
    advanceToFinalResults();

    const res = request('GET',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}/results`,
      { headers: { session }, timeout: TIMEOUT_MS });

    expect(res.statusCode).toBe(200);

    const body = JSON.parse(res.body.toString());
    expect(body).toHaveProperty('usersRankedByScore');
    expect(body).toHaveProperty('questionResults');
    expect(Array.isArray(body.usersRankedByScore)).toBe(true);
    expect(Array.isArray(body.questionResults)).toBe(true);
  });

  test('Fails if session is missing', () => {
    advanceToFinalResults();

    const res = request('GET',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}/results`,
      { headers: { session: '' }, timeout: TIMEOUT_MS });

    expect(res.statusCode).toBe(401);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if game is not in FINAL_RESULTS', () => {
    const gm = request('POST',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/start`,
      { headers: { session }, json: { autoStartNum: 0 }, timeout: TIMEOUT_MS });
    const newGameId = JSON.parse(gm.body.toString()).gameId;

    const res = request('GET',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${newGameId}/results`,
      { headers: { session }, timeout: TIMEOUT_MS });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails for invalid gameId', () => {
    advanceToFinalResults();

    const res = request('GET',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/9999/results`,
      { headers: { session }, timeout: TIMEOUT_MS });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails if session is valid but user does not own the quiz', () => {
    advanceToFinalResults();

    const reg = request('POST', `${SERVER_URL}/v1/admin/auth/register`, {
      json: {
        email: 'intruder@example.com',
        password: 'pass1234',
        nameFirst: 'Intruder',
        nameLast: 'User',
      },
      timeout: TIMEOUT_MS,
    });
    const badSession = JSON.parse(reg.body.toString()).session;

    const res = request('GET',
      `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}/results`,
      { headers: { session: badSession }, timeout: TIMEOUT_MS });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });
});
