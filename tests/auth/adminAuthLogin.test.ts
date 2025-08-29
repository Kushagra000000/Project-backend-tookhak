import { adminAuthRegister, adminAuthLogin, adminUserDetails } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When there is one user', () => {
  let session: string;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
  });

  // Test two cases, one for empty input and one for non-existing email
  test.each([
    { email: '', password: 'userpass1' },
    { email: 'Invalid@bar.com', password: 'userpass1' }
  ])('Test for invalid emails', ({ email, password }) => {
    expect(adminAuthLogin(email, password).statusCode).toStrictEqual(400);
  });

  // Test two cases, one for empty input and one for incorrect password
  test.each([
    { email: 'foo@bar.com', password: '' },
    { email: 'foo@bar.com', password: 'wrongPassword1' }
  ])('Correct email but incorrect password', ({ email, password }) => {
    expect(adminAuthLogin(email, password).statusCode).toStrictEqual(400);

    // numFailedPasswordsSinceLastLogin should increase by 1.
    expect(adminUserDetails(session).user).toStrictEqual({
      userId: expect.any(Number),
      name: 'Valid Valid',
      email: 'foo@bar.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 1,
    });
  });

  test('Login successfully', () => {
    expect(adminAuthLogin('foo@bar.com', 'userpass1'))
      .toStrictEqual({ session: expect.any(String) });
    // numSuccessfulLogins should increase by 1.
    expect(adminUserDetails(session).user).toStrictEqual({
      userId: expect.any(Number),
      name: 'Valid Valid',
      email: 'foo@bar.com',
      numSuccessfulLogins: 2,
      numFailedPasswordsSinceLastLogin: 0,
    });
  });

  test('Multiple successful logins', () => {
    adminAuthLogin('foo@bar.com', 'userpass1');
    adminAuthLogin('foo@bar.com', 'userpass1');
    adminAuthLogin('foo@bar.com', 'userpass1');

    // numSuccessfulLogins should increase by 3.
    expect(adminUserDetails(session).user).toStrictEqual({
      userId: expect.any(Number),
      name: 'Valid Valid',
      email: 'foo@bar.com',
      numSuccessfulLogins: 4,
      numFailedPasswordsSinceLastLogin: 0,
    });
  });

  test('Login successfully after a few unsuccessful logins', () => {
    adminAuthLogin('foo@bar.com', 'invalid');
    adminAuthLogin('foo@bar.com', 'invalid');
    adminAuthLogin('foo@bar.com', 'invalid');
    // numFailedPasswordsSinceLastLogin should increase by 3.
    expect(adminUserDetails(session).user).toStrictEqual({
      userId: expect.any(Number),
      name: 'Valid Valid',
      email: 'foo@bar.com',
      numSuccessfulLogins: 1,
      numFailedPasswordsSinceLastLogin: 3,
    });

    adminAuthLogin('foo@bar.com', 'userpass1');
    // numSuccessfulLogins should increase by 1 and
    // numFailedPasswordsSinceLastLogin should be 0
    expect(adminUserDetails(session).user).toStrictEqual({
      userId: expect.any(Number),
      name: 'Valid Valid',
      email: 'foo@bar.com',
      numSuccessfulLogins: 2,
      numFailedPasswordsSinceLastLogin: 0,
    });
  });
});

test('Multiple users can login successfully', () => {
  const session1 = adminAuthRegister('foo1@bar.com', 'userpass1',
    'ValidA', 'ValidA').session;
  const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
    'ValidB', 'ValidB').session;
  const session3 = adminAuthRegister('foo3@bar.com', 'userpass3',
    'ValidC', 'ValidC').session;

  expect(adminAuthLogin('foo1@bar.com', 'userpass1'))
    .toStrictEqual({ session: expect.any(String) });
  // numSuccessfulLogins should increase by 1
  expect(adminUserDetails(session1).user).toStrictEqual({
    userId: expect.any(Number),
    name: 'ValidA ValidA',
    email: 'foo1@bar.com',
    numSuccessfulLogins: 2,
    numFailedPasswordsSinceLastLogin: 0,
  });

  expect(adminAuthLogin('foo2@bar.com', 'userpass2'))
    .toStrictEqual({ session: expect.any(String) });
  // numSuccessfulLogins should increase by 1
  expect(adminUserDetails(session2).user).toStrictEqual({
    userId: expect.any(Number),
    name: 'ValidB ValidB',
    email: 'foo2@bar.com',
    numSuccessfulLogins: 2,
    numFailedPasswordsSinceLastLogin: 0,
  });

  expect(adminAuthLogin('foo3@bar.com', 'userpass3'))
    .toStrictEqual({ session: expect.any(String) });
  // numSuccessfulLogins should increase by 1
  expect(adminUserDetails(session3).user).toStrictEqual({
    userId: expect.any(Number),
    name: 'ValidC ValidC',
    email: 'foo3@bar.com',
    numSuccessfulLogins: 2,
    numFailedPasswordsSinceLastLogin: 0,
  });
});
