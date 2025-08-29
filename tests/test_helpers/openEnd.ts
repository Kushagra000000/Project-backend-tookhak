import request from 'sync-request-curl';
import config from '../../src/config.json';

const url = config.url;
const port = config.port;
const version = 'v1';

const SERVER_URL = `${url}:${port}/${version}`;

const PLAYER_URL = `${SERVER_URL}/player`;

const QUIZ_URL = `${SERVER_URL}/admin/quiz`;
const TIMEOUT_MS = 5 * 1000;

export function playerAnswerExplanation(
  playerId: number,
  questionPosition: number
) {
  const res = request(
    'GET',
    `${PLAYER_URL}/${playerId}/question/${questionPosition}/explanation`,
    { timeout: TIMEOUT_MS }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function addQuizContributor(
  session: string,
  quizId: number,
  email: string
) {
  const response = request('POST', QUIZ_URL + `/${quizId}/contributor`, {
    json: { email: email },
    headers: { session: session },
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.code = response.statusCode;
  }
  return returnObj;
}
