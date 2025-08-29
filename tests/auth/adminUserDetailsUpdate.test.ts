import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';
import { updateUserField } from '../test_helpers/auth';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

beforeEach(() => {
  clear();
});

describe('adminUserDetailsUpdate - Valid Cases', () => {
  let session: string;

  beforeEach(() => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'newemail@foo.com',
        password: 'valid1234',
        nameFirst: 'validfirst',
        nameLast: 'validlast',
      },
      timeout: TIMEOUT_MS,
    });
    session = JSON.parse(res.body.toString()).session;
  });

  test('correct return type', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/details', {
      headers: { session },
      json: {
        email: 'newemail@foo.com',
        nameFirst: 'validfirst',
        nameLast: 'validlast',
      },
      timeout: TIMEOUT_MS,
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({});
  });

  test('updates reflected in user details', () => {
    request('PUT', SERVER_URL + '/v1/admin/user/details', {
      headers: { session },
      json: {
        email: 'updated@foo.com',
        nameFirst: 'NewFirst',
        nameLast: 'NewLast',
      },
      timeout: TIMEOUT_MS,
    });

    const detailsRes = request('GET', SERVER_URL + '/v1/admin/user/details', {
      headers: { session },
      timeout: TIMEOUT_MS,
    });

    expect(JSON.parse(detailsRes.body.toString())).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'NewFirst NewLast',
        email: 'updated@foo.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });
});

test('Invalid session', () => {
  const result = updateUserField('', 'email', 'foobar');

  expect(result).toHaveProperty('error');
});

describe('adminUserDetailsUpdate - Email Validation Errors', () => {
  test('email already used', () => {
    // already used email address
    request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'taken@foo.com',
        password: 'pass1234',
        nameFirst: 'User',
        nameLast: 'Taken',
      },
      timeout: TIMEOUT_MS,
    });

    const res2 = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'temp@foo.com',
        password: 'pass1234',
        nameFirst: 'User',
        nameLast: 'Temp',
      },
      timeout: TIMEOUT_MS,
    });
    const session = JSON.parse(res2.body.toString()).session;

    const updateRes = request('PUT', SERVER_URL + '/v1/admin/user/details', {
      headers: { session },
      json: {
        email: 'taken@foo.com',
        nameFirst: 'Test',
        nameLast: 'User',
      },
      timeout: TIMEOUT_MS,
    });

    expect(JSON.parse(updateRes.body.toString())).toHaveProperty('error');
  });

  test('Invalid email format should return error', () => {
    const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'test@foo.com',
        password: 'pass12345',
        nameFirst: 'Test',
        nameLast: 'User',
      },
      timeout: TIMEOUT_MS,
    });
    const session = JSON.parse(res.body.toString()).session;

    const result = updateUserField(session, 'email', 'foobar');

    expect(result).toHaveProperty('error');
  });
});

describe('adminUserDetailsUpdate - Name Validation Errors', () => {
  const invalidNames = [
    { type: 'nameLast', values: ['last99', 'last99!', 'A', 'A'.repeat(21)] },
    { type: 'nameFirst', values: ['valid123', 'valid@123', 'A', 'A'.repeat(21)] },
  ];

  invalidNames.forEach(({ type, values }) => {
    values.forEach((value) => {
      test(`invalid ${type}: ${value}`, () => {
        const res = request('POST', SERVER_URL + '/v1/admin/auth/register', {
          json: {
            email: 'valid@foo.com',
            password: 'pass1234',
            nameFirst: 'Valid',
            nameLast: 'User',
          },
          timeout: TIMEOUT_MS,
        });
        const session = JSON.parse(res.body.toString()).session;

        const result = updateUserField(session, type, value);

        expect(result).toHaveProperty('error');
      });
    });
  });
});
