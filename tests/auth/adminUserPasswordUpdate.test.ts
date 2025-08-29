import { port, url } from '../../src/config.json';
import request from 'sync-request-curl';
import { clear } from '../test_helpers/other';

const SERVER_URL = `${url}:${port}`;
const TIMEOUT_MS = 5 * 1000;

describe('adminUserPasswordUpdate', () => {
  let session: string;

  beforeEach(() => {
    clear();
    session = JSON.parse(request('POST', SERVER_URL + '/v1/admin/auth/register', {
      json: {
        email: 'user@foo.com',
        password: 'OldPass123',
        nameFirst: 'Valid',
        nameLast: 'User',
      },
      timeout: TIMEOUT_MS
    }).body.toString()).session;
  });

  test('Invalid session - empty string', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session: '' },
      json: {
        oldPassword: 'OldPass123',
        newPassword: 'NewPass123',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(401); // fixed from 400 to 401
  });

  test('Invalid session - random string', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session: 'invalid-session' },
      json: {
        oldPassword: 'OldPass123',
        newPassword: 'NewPass123',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(401); // fixed from 400 to 401
  });

  test('Incorrect old password', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'WrongPass',
        newPassword: 'NewPass123',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(400);
  });

  test('New password same as old', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'OldPass123',
        newPassword: 'OldPass123',
      },
      timeout: TIMEOUT_MS
    });
    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(400);
  });

  test('New password already used before', () => {
    request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'OldPass123',
        newPassword: 'NewPass456',
      },
      timeout: TIMEOUT_MS
    });

    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'NewPass456',
        newPassword: 'OldPass123',
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(400);
  });

  test.each([
    { newPassword: 'short1', reason: 'too short' },
    { newPassword: 'OnlyLetters', reason: 'no numbers' },
    { newPassword: '12345678', reason: 'no letters' },
    { newPassword: '', reason: 'empty' },
    { newPassword: '        ', reason: 'only spaces' },
  ])('Invalid new password: $reason', ({ newPassword }) => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'OldPass123',
        newPassword,
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({ error: expect.any(String) });
    expect(res.statusCode).toBe(400);
  });

  test('Successful password update', () => {
    const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
      headers: { session },
      json: {
        oldPassword: 'OldPass123',
        newPassword: 'NewPass456',
      },
      timeout: TIMEOUT_MS
    });

    expect(JSON.parse(res.body.toString())).toStrictEqual({});
    expect(res.statusCode).toBe(200);
  });

  test('Multiple successful password updates', () => {
    const passwords = ['NewPass1A', 'NewPass2B', 'NewPass3C'];

    let currentPassword = 'OldPass123';
    for (const nextPassword of passwords) {
      const res = request('PUT', SERVER_URL + '/v1/admin/user/password', {
        headers: { session },
        json: {
          oldPassword: currentPassword,
          newPassword: nextPassword,
        },
        timeout: TIMEOUT_MS
      });

      expect(JSON.parse(res.body.toString())).toStrictEqual({});
      expect(res.statusCode).toBe(200);

      currentPassword = nextPassword;
    }
  });
});
