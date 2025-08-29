import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';
import { adminPlayerJoin } from '../test_helpers/player';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5000;

describe('/v1/player/:playerid/game/results', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;

  beforeEach(() => {
    clear();

    const regRes = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'admin@foo.com',
        password: 'pass1234',
        nameFirst: 'Admin',
        nameLast: 'User'
      },
      timeout: TIMEOUT_MS,
    });
    session = JSON.parse(regRes.body.toString()).session;

    const quizRes = request('POST', SERVER_URL + '/v1/admin/quiz', {
      headers: { session },
      json: {
        name: 'Player Quiz',
        description: 'Quiz for player test'
      },
      timeout: TIMEOUT_MS,
    });
    quizId = JSON.parse(quizRes.body.toString()).quizId;

    request('POST', `${SERVER_URL}/v2/admin/quiz/${quizId}/question`, {
      headers: { session },
      json: {
        questionBody: {
          question: 'Who is the Monarch of England',
          timeLimit: 1,
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
        }
      },
      timeout: TIMEOUT_MS,
    });

    const gameRes = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session },
      json: { autoStartNum: 0 },
      timeout: TIMEOUT_MS,
    });
    gameId = JSON.parse(gameRes.body.toString()).gameId;

    playerId = adminPlayerJoin(gameId, 'PlayerOne').playerId;
    adminPlayerJoin(gameId, '');

    ['NEXT_QUESTION', 'SKIP_COUNTDOWN', 'GO_TO_ANSWER', 'GO_TO_FINAL_RESULTS'].forEach(action => {
      request('PUT', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/${gameId}`, {
        headers: { session },
        json: { action },
        timeout: TIMEOUT_MS,
      });
    });
  });

  test('Successfully returns game results for valid player', () => {
    const res = request('GET', `${SERVER_URL}/v1/player/${playerId}/game/results`, {
      timeout: TIMEOUT_MS,
    });

    const body = JSON.parse(res.body.toString());
    expect(res.statusCode).toBe(200);
    expect(body).toHaveProperty('usersRankedByScore');
    expect(body).toHaveProperty('questionResults');
    expect(Array.isArray(body.usersRankedByScore)).toBe(true);
    expect(Array.isArray(body.questionResults)).toBe(true);
  });

  test('Fails with invalid playerId', () => {
    const res = request('GET', `${SERVER_URL}/v1/player/9999/game/results`, {
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });

  test('Fails when game is not in FINAL_RESULTS state', () => {
    const newGame = request('POST', `${SERVER_URL}/v1/admin/quiz/${quizId}/game/start`, {
      headers: { session },
      json: { autoStartNum: 0 },
      timeout: TIMEOUT_MS,
    });
    const notFinalGameId = JSON.parse(newGame.body.toString()).gameId;

    const secondPlayerId = adminPlayerJoin(notFinalGameId, '').playerId;

    const res = request('GET', `${SERVER_URL}/v1/player/${secondPlayerId}/game/results`, {
      timeout: TIMEOUT_MS,
    });

    expect(res.statusCode).toBe(400);
    expect(JSON.parse(res.body.toString())).toHaveProperty('error');
  });
});
