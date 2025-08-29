// Importing request to send http requests to the server
import request from 'sync-request-curl';
import config from '../../src/config.json';

const url = config.url;
const port = config.port;
const version = 'v1';

const SERVER_URL = `${url}:${port}/${version}`;
const TIMEOUT_MS = 5 * 1000;

// Player URL
const PLAYER_URL = `${SERVER_URL}/player`;

export function adminPlayerJoin(
  gameId: number,
  playerName: string
) {
  const res = request('POST', `${PLAYER_URL}/join`, {
    json: { gameId, playerName },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminPlayerStatus(
  playerId: number
) {
  const res = request('GET', `${PLAYER_URL}/${playerId}`, {
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminPlayerQuestionInfo(
  playerId: number,
  questionPosition: number
) {
  const res = request('GET', `${PLAYER_URL}/${playerId}/question/${questionPosition}`, {
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function playerSubmission(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
) {
  const res = request('PUT', `${PLAYER_URL}/${playerId}/question/${questionPosition}/answer`, {
    json: { answerIds },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuestionResults(
  playerId: number,
  questionPosition: number
) {
  const res = request(
    'GET',
    `${SERVER_URL}/player/${playerId}/question/${questionPosition}/results`,
    { timeout: TIMEOUT_MS }
  );

  const body = JSON.parse(res.body.toString());

  if ('error' in body) {
    body.statusCode = res.statusCode;
  }
  return body;
}
