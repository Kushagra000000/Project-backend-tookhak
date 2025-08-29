// Importing request to send http requests to the server
import request from 'sync-request-curl';
import config from '../../src/config.json';

const url = config.url;
const port = config.port;
const version = 'v1';

const SERVER_URL = `${url}:${port}/${version}`;
const TIMEOUT_MS = 5 * 1000;

// Admin Auth URL
const AUTH_URL = `${SERVER_URL}/admin/auth`;

// Admin User URL
const USER_URL = `${SERVER_URL}/admin/user`;

export function adminAuthRegister(
  email: string,
  password: string,
  nameFirst: string,
  nameLast: string
) {
  const requestObj = {
    email: email,
    password: password,
    nameFirst: nameFirst,
    nameLast: nameLast,
  };

  const response = request('POST', AUTH_URL + '/register', {
    json: requestObj,
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.statusCode = response.statusCode;
  }
  return returnObj;
}

export function adminUserDetails(session: string) {
  const response = request('GET', USER_URL + '/details', {
    headers: { session: session },
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.statusCode = response.statusCode;
  }
  return returnObj;
}

export function adminAuthLogin(
  email: string,
  password: string
) {
  const res = request('POST', `${AUTH_URL}/login`, {
    json: { email, password },
    timeout: TIMEOUT_MS,
  });

  const body = JSON.parse(res.body.toString());
  if ('error' in body) {
    body.statusCode = res.statusCode;
  }

  return body;
}

export function adminAuthLogout(session: string) {
  const response = request('POST', AUTH_URL + '/logout', {
    headers: { session: session },
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.statusCode = response.statusCode;
  }
  return returnObj;
}

export function adminUserDetailsUpdate(
  session: string,
  email: string,
  nameFirst: string,
  nameLast: string
) {
  const response = request('PUT', USER_URL + '/details', {
    headers: { session },
    json: {
      email,
      nameFirst,
      nameLast,
    },
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.statusCode = response.statusCode;
  }

  return returnObj;
}

export function updateUserField(
  session: string,
  type: string,
  value: string
) {
  // Default values
  let email = 'valid@foo.com';
  let nameFirst = 'Valid';
  let nameLast = 'User';

  // Update only the relevant field
  if (type === 'email') {
    email = value;
  } else if (type === 'nameFirst') {
    nameFirst = value;
  } else if (type === 'nameLast') {
    nameLast = value;
  }

  const res = request('PUT', `${SERVER_URL}/admin/user/details`, {
    headers: { session },
    json: { email, nameFirst, nameLast },
    timeout: TIMEOUT_MS,
  });

  const result = JSON.parse(res.body.toString());
  result.statusCode = res.statusCode;

  return result;
}

export function adminUserPasswordUpdate(
  session: string,
  oldPassword: string,
  newPassword: string
) {
  const response = request('PUT', USER_URL + '/password', {
    headers: { session },
    json: {
      oldPassword,
      newPassword,
    },
    timeout: TIMEOUT_MS,
  });

  const returnObj = JSON.parse(response.body.toString());

  if ('error' in returnObj) {
    returnObj.statusCode = response.statusCode;
  }

  return returnObj;
}
