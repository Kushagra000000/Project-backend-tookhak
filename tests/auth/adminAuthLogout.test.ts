// Importing adminAuthRegister and adminUserDetails from auth.ts in helpers dir
import {
  adminAuthRegister,
  adminAuthLogout,
  adminUserDetails,
} from '../test_helpers/auth';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';

// Import uuidv4 from uuid
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  // Clears the state of the dataStore before each test.
  clear();
});

describe('Testing if the function deletes the proper sessions', () => {
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

  test('testing for removing one session', () => {
    expect(adminAuthLogout(session1.session)).toStrictEqual({});
    expect(adminUserDetails(session1.session)).toStrictEqual({
      error: expect.any(String),
      statusCode: 401,
    });
  });

  test('testing for removing multiple sessions', () => {
    expect(adminAuthLogout(session1.session)).toStrictEqual({});
    expect(adminUserDetails(session1.session)).toStrictEqual({
      error: expect.any(String),
      statusCode: 401,
    });
    expect(adminAuthLogout(session2.session)).toStrictEqual({});
    expect(adminUserDetails(session2.session)).toStrictEqual({
      error: expect.any(String),
      statusCode: 401,
    });
  });
});

describe('SessionId validation errors', () => {
  test('testing for no active sessions', () => {
    expect(adminAuthLogout('qhdeiuh928109213')).toStrictEqual({
      error: expect.any(String),
      statusCode: 401,
    });
  });

  describe("testing for sessionId's that dont exist or invalid", () => {
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
      { sessionId: uuidv4() },
      { sessionId: 'jiuhiuhiuhd029083' },
      { sessionId: '' },
    ])('Testing for sessionId=$sessionId', ({ sessionId }) => {
      expect(sessionId).not.toStrictEqual(session1.session);
      expect(sessionId).not.toStrictEqual(session2.session);
      expect(adminAuthLogout(sessionId)).toStrictEqual({
        error: expect.any(String),
        statusCode: 401,
      });
    });
  });
});
