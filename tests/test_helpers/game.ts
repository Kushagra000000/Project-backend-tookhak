import request from 'sync-request-curl';
import config from '../../src/config.json';

const port = config.port;
const url = config.url;

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

export function adminQuizGameStart(
  quizId : number,
  session : string,
  autoStartNum: number
) {
  const res = request('POST', SERVER_URL + `/v1/admin/quiz/${quizId}/game/start`, {
    headers: { session },
    json: { autoStartNum },
    timeout: TIMEOUT_MS
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminGameInfo(
  session: string,
  quizId: number,
  gameId: number
) {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
    headers: { session },
    timeout: TIMEOUT_MS
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminGameStateUpdate(
  session: string,
  quizId: number,
  gameId: number,
  action: string
) {
  const res = request('PUT', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}`, {
    headers: { session },
    json: { action },
    timeout: TIMEOUT_MS
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminGameResult(
  session: string,
  quizId: number,
  gameId: number
) {
  const res = request('GET', SERVER_URL + `/v1/admin/quiz/${quizId}/game/${gameId}/results`, {
    headers: { session },
    timeout: TIMEOUT_MS
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}
