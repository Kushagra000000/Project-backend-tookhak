// Importing adminAuthRegister and adminUserDetails from auth.js
import { adminAuthRegister, adminUserDetails } from '../test_helpers/auth';

// Import uuidv4 from uuid
import { v4 as uuidv4 } from 'uuid';

// Importing clear from other.js
import { clear } from '../test_helpers/other';

beforeEach(() => {
  // Clears the state of the dataStore before each test.
  clear();
});

describe('Valid testcases', () => {
  test('valid return type', () => {
    const session1 = adminAuthRegister(
      'foo@bar.com',
      'valid123',
      'valid',
      'valid'
    );
    expect(adminUserDetails(session1.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: expect.any(String),
        email: expect.any(String),
        numSuccessfulLogins: expect.any(Number),
        numFailedPasswordsSinceLastLogin: expect.any(Number),
      },
    });
  });

  test('view single user', () => {
    const session1 = adminAuthRegister(
      'foo@bar.com',
      'valid123',
      'valid',
      'valid'
    );
    expect(adminUserDetails(session1.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'valid valid',
        email: 'foo@bar.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });

  test('view multiple users', () => {
    const session1 = adminAuthRegister(
      'foo@bar.com',
      'valid123',
      'valid',
      'valid'
    );
    const session2 = adminAuthRegister(
      'bar@foo.com',
      'valid12345',
      'another valid',
      'another valid'
    );
    expect(adminUserDetails(session1.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'valid valid',
        email: 'foo@bar.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
    expect(adminUserDetails(session2.session)).toStrictEqual({
      user: {
        userId: expect.any(Number),
        name: 'another valid another valid',
        email: 'bar@foo.com',
        numSuccessfulLogins: 1,
        numFailedPasswordsSinceLastLogin: 0,
      },
    });
  });
});

describe('UserId validation errors', () => {
  test('testing for no registered users', () => {
    expect(adminUserDetails('kjdW9280DDQWBhdiwhu8')).toStrictEqual({
      error: expect.any(String),
      statusCode: 401,
    });
  });

  describe("testing for userId's that dont exist or invalid", () => {
    let session1: { session: string };
    let session2: { session: string };
    beforeEach(() => {
      session1 = adminAuthRegister('foo@bar.com', 'valid123', 'valid', 'valid');
      session2 = adminAuthRegister(
        'bar@foo.com',
        'valid12345',
        'another valid',
        'another valid'
      );
    });

    test.each([
      { session: uuidv4() },
      { session: '1201khdqwjhAIWb982019' },
      { session: '' },
    ])('Testing for session=$session', ({ session }) => {
      expect(session).not.toStrictEqual(session1.session);
      expect(session).not.toStrictEqual(session2.session);
      expect(adminUserDetails(session)).toStrictEqual({
        error: expect.any(String),
        statusCode: 401,
      });
    });
  });
});
