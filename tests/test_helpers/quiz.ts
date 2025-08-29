import request from 'sync-request-curl';
import config from '../../src/config.json';
import { QuestionBody } from './interface';
// import * as dotenv from 'dotenv';
// dotenv.config();

const port = config.port;
const url = config.url;

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

export function adminQuizList(session: string) {
  const headers = { session };
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/list`, {
    headers,
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizCreate(
  session: string,
  name: string,
  description: string
) {
  const headers = { session };
  const res = request('POST', `${SERVER_URL}/v1/admin/quiz`, {
    json: { name, description },
    headers,
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuestionCreate(
  session: string,
  quizId: number,
  questionBody: QuestionBody
) {
  const res = request(
    'POST',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizInfo(session: string, quizId: number) {
  const headers = { session };
  const res = request('GET', `${SERVER_URL}/v1/admin/quiz/${quizId}`, {
    headers,
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    body.code = res.statusCode;
    // Return full object not just only the code.
  }

  return body;
}

export function adminQuizRemove(session: string, quizId: number) {
  const headers = { session };
  const res = request('DELETE', `${SERVER_URL}/v1/admin/quiz/${quizId}`, {
    headers,
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ([400, 401, 403].includes(res.statusCode)) {
    if (!body.code) {
      body.code = res.statusCode;
    }
    return body;
  }
  return body;
}

export function adminQuestionDelete(
  session: string,
  quizId: number,
  questionId: number
) {
  const res = request(
    'DELETE',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizMove(
  quizId: number,
  questionId: number,
  session: string,
  newPosition: number
) {
  const response = request(
    'PUT',
    SERVER_URL + `/v1/admin/quiz/${quizId}/question/${questionId}/move`,
    {
      headers: { session },
      json: { newPosition },
      timeout: TIMEOUT_MS,
    }
  );

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.code = response.statusCode;
  }
  return returnObj;
}

export function getQuestionSuggestion(session: string, quizId: number) {
  const response = request(
    'GET',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/question/suggestion`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(response.body.toString());
  if ('error' in body) {
    body.statusCode = response.statusCode;
  }

  return body;
}

export function adminQuestionCreateV2(
  session: string,
  quizId: number,
  questionBody: QuestionBody
) {
  const res = request(
    'POST',
    `${SERVER_URL}/v2/admin/quiz/${quizId}/question`,
    {
      headers: { session },
      json: { questionBody },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuestionDeleteV2(
  session: string,
  quizId: number,
  questionId: number
) {
  const res = request(
    'DELETE',
    `${SERVER_URL}/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizThumbnail(
  session: string,
  quizId: number,
  thumbnailUrl: string
) {
  const res = request(
    'PUT',
    `${SERVER_URL}/v1/admin/quiz/${quizId}/thumbnail`,
    {
      headers: { session },
      json: { thumbnailUrl },
      timeout: TIMEOUT_MS,
    }
  );

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizRemoveV2(session: string, quizId: number) {
  const res = request('DELETE', `${SERVER_URL}/v2/admin/quiz/${quizId}`, {
    headers: { session },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminQuizInfoV2(session: string, quizId: number) {
  const headers = { session };
  const res = request('GET', `${SERVER_URL}/v2/admin/quiz/${quizId}`, {
    headers,
    timeout: TIMEOUT_MS,
  });

  // same as adminQuizThumbnail, which is also for iter-3
  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }
  return body;
}

export function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: QuestionBody,
  thumbnailUrl: string
) {
  const res = request(
    'PUT',
    SERVER_URL + `/v2/admin/quiz/${quizId}/question/${questionId}`,
    {
      headers: { session: session },
      json: {
        thumbnailUrl: thumbnailUrl,
        questionBody: questionBody,
      },
      timeout: TIMEOUT_MS,
    }
  );
  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }
  return body;
}
