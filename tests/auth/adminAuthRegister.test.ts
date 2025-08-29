// Importing adminAuthRegister and adminUserDetails from auth.ts in helpers dir
import { adminAuthRegister, adminUserDetails } from '../test_helpers/auth';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';

beforeEach(() => {
  // Clears the state of the dataStore before each test.
  clear();
});

// Test group for valid registration
describe('Valid testcases', () => {
  test('correct return type', () => {
    const response = adminAuthRegister(
      'foo@bar.com',
      'valid1234',
      'valid',
      'valid'
    );
    expect(response).toStrictEqual({
      session: expect.any(String)
    });
  });

  test('a user was created properly', () => {
    const response = adminAuthRegister(
      'foo@bar.com',
      'valid1234',
      'valid',
      'valid'
    );
    expect(adminUserDetails(response.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'valid valid',
        email: 'foo@bar.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });

  test('multiple users were created properly', () => {
    const response1 = adminAuthRegister(
      'foo@bar.com',
      'valid1234',
      'valid',
      'valid'
    );
    const response2 = adminAuthRegister(
      'bar@foo.com',
      'valid12345',
      'another valid',
      'another valid'
    );
    expect(adminUserDetails(response1.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'valid valid',
        email: 'foo@bar.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
    expect(adminUserDetails(response2.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'another valid another valid',
        email: 'bar@foo.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      }
    });
  });
});

// Test group for checking valid email
describe('Testing email validation errors', () => {
  test.each([
    { email: 'foobar.com' },
    { email: 'foo@barspa' },
    { email: 'foobar' },
    { email: 'foo.bar' },
  ])('testing invalid email=$email', ({ email }) => {
    expect(
      adminAuthRegister(email, 'valid1234', 'valid', 'valid')
    ).toStrictEqual({ error: expect.any(String), statusCode: 400 });
  });

  test('email already in use', () => {
    adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    expect(
      adminAuthRegister(
        'foo@bar.com',
        'valid12345',
        'anothervalid',
        'anothervalid'
      )
    ).toStrictEqual({ error: expect.any(String), statusCode: 400 });
  });
});

// Test group for validating password
describe('Testing password validation errors', () => {
  test('password is less than 8 letters', () => {
    expect(
      adminAuthRegister('foo@bar.com', 'valid', 'valid', 'valid')
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
  test('password does not contain atleast one letter', () => {
    expect(
      adminAuthRegister('foo@bar.com', 'validpass', 'valid', 'valid')
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
  test('password does not contain atleast one number', () => {
    expect(
      adminAuthRegister('foo@bar.com', '12345678', 'valid', 'valid')
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});

// Test group for validating first name
describe('Testing first name validation errors', () => {
  test('Testing for first name less than 2 characters', () => {
    expect(
      adminAuthRegister('foo@bar.com', 'valid123', 'v', 'valid')
    ).toStrictEqual({ error: expect.any(String), statusCode: 400 });
  });
  test('Testing for first name more than 20 characters', () => {
    expect(
      adminAuthRegister(
        'foo@bar.com',
        'valid123',
        'longnamethatwillcauseerror',
        'valid'
      )
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
  test('Testing for first name with forbidden characters', () => {
    expect(
      adminAuthRegister('foo@bar.com', 'valid123', 'v4l!d', 'valid')
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});

// Test group for validating last name
describe('Testing last name validation errors', () => {
  test('Testing for last name less than 2 characters', () => {
    expect(adminAuthRegister('foo@bar.com', 'valid123', 'valid', 'v')).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
  test('Testing for last name more than 20 characters', () => {
    expect(
      adminAuthRegister(
        'foo@bar.com',
        'valid123',
        'valid',
        'longnamethatwillcauseerror'
      )
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
  test('Testing for last name with forbidden characters', () => {
    expect(
      adminAuthRegister('foo@bar.com', 'valid123', 'valid', 'v4l!d')
    ).toStrictEqual({
      error: expect.any(String),
      statusCode: 400,
    });
  });
});
