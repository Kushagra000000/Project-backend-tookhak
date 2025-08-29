import { adminAuthRegister } from '../test_helpers/auth';
import { clear } from '../test_helpers/other';
import { adminQuizCreate, adminQuizInfoV2, adminQuizThumbnail } from '../test_helpers/quiz';
import { v4 as uuidv4 } from 'uuid';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When a quiz is created', () => {
  let session: string;
  let quizId: number;
  let thumbnailUrl: string;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    thumbnailUrl = 'http://google.com/some/image/path.jpg';
  });

  describe('Invalid cases that should return 401', () => {
    test('Empty Session', () => {
      expect(adminQuizThumbnail('', quizId, thumbnailUrl).statusCode).toStrictEqual(401);
    });

    test('Invalid Session', () => {
      expect(adminQuizThumbnail(uuidv4(), quizId, thumbnailUrl).statusCode).toStrictEqual(401);
    });
  });

  describe('Invalid cases that should return 403', () => {
    test('Valid session, but quiz does not exist', () => {
      expect(adminQuizThumbnail(session, quizId + 1, thumbnailUrl).statusCode)
        .toStrictEqual(403);
    });

    test('Valid session, but user is not the owner of the quiz', () => {
      const session2 = adminAuthRegister('foo2@bar.com', 'userpass2',
        'ValidA', 'ValidA').session;
      expect(adminQuizThumbnail(session2, quizId, thumbnailUrl).statusCode).toStrictEqual(403);
    });
  });

  describe('Invalid cases that should return 400', () => {
    test('ThumbnailUrl does not end with png, jpg or jpeg', () => {
      thumbnailUrl = 'http://google.com/some/image/path.pdf';
      expect(adminQuizThumbnail(session, quizId, thumbnailUrl).statusCode).toStrictEqual(400);
    });

    test('ThumbnailUrl does not start with http:// or https://', () => {
      thumbnailUrl = 'www//google.com/some/image/path.png';
      expect(adminQuizThumbnail(session, quizId, thumbnailUrl).statusCode).toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return', () => {
      expect(adminQuizThumbnail(session, quizId, thumbnailUrl)).toStrictEqual({});
    });

    test('The end string of thumbnailUrl should be case insensitive', () => {
      thumbnailUrl = 'http://google.com/some/image/path.JPG';
      expect(adminQuizThumbnail(session, quizId, thumbnailUrl))
        .toStrictEqual({});
    });

    test('Check the side effects', () => {
      adminQuizThumbnail(session, quizId, thumbnailUrl);
      expect(adminQuizInfoV2(session, quizId).thumbnailUrl)
        .toStrictEqual('http://google.com/some/image/path.jpg');
    });
  });
});
