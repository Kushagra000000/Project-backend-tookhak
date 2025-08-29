// Importing adminPlayerJoin and adminPlayerStatus from player.ts in helpers dir
import { adminPlayerJoin } from '../test_helpers/player';

// Importing adminAuthRegister from auth.ts in helpers dir
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizCreate and adminQuestionCreate from quiz.ts in helpers dir
import { adminQuizCreate, adminQuestionCreateV2 } from '../test_helpers/quiz';

// Importing adminQuizGameStart from game.ts in helpers dir
import { adminGameStateUpdate, adminQuizGameStart } from '../test_helpers/game';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';
import { Action } from '../test_helpers/interface';
import { playerAnswerExplanation } from '../test_helpers/openEnd';

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
});

describe('When a game started', () => {
  let session: string;
  let quizId: number;
  let gameId: number;
  let playerId: number;
  beforeEach(() => {
    session = adminAuthRegister('foo@bar.com', 'userpass1', 'Valid', 'Valid').session;
    quizId = adminQuizCreate(session, 'validName', 'Quiz 1').quizId;
    const questionBody1 = {
      question: 'Which of the following elements are alkali metals?',
      timeLimit: 2,
      points: 5,
      answerOptions: [
        {
          answer: 'Sodium',
          correct: true
        },
        {
          answer: 'Potassium',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    const questionBody2 = {
      question: 'Is this a valid question?',
      timeLimit: 2,
      points: 10,
      answerOptions: [
        {
          answer: 'Yes',
          correct: true
        },
        {
          answer: 'No',
          correct: true
        }
      ],
      thumbnailUrl: 'http://google.com/some/image/path.jpg'
    };
    adminQuestionCreateV2(session, quizId, questionBody1);
    adminQuestionCreateV2(session, quizId, questionBody2);
    gameId = adminQuizGameStart(quizId, session, 0).gameId;
    playerId = adminPlayerJoin(gameId, 'Valid123').playerId;

    adminGameStateUpdate(session, quizId, gameId, Action.NEXT_QUESTION);
    adminGameStateUpdate(session, quizId, gameId, Action.SKIP_COUNTDOWN);
    adminGameStateUpdate(session, quizId, gameId, Action.GO_TO_ANSWER);
  });

  describe('Error cases', () => {
    test('PlayerId does not exist', () => {
      expect(playerAnswerExplanation(playerId + 1, 1).statusCode)
        .toStrictEqual(400);
    });

    test('If question position is not valid for the game this player is in', () => {
      expect(playerAnswerExplanation(playerId, -1).statusCode)
        .toStrictEqual(400);
    });

    test('Game is not in QUESTION_OPEN state', () => {
      adminGameStateUpdate(session, quizId, gameId, Action.END);
      expect(playerAnswerExplanation(playerId, 1).statusCode)
        .toStrictEqual(400);
    });

    test('If game is not currently on this question', () => {
      expect(playerAnswerExplanation(playerId, 2).statusCode)
        .toStrictEqual(400);
    });
  });

  describe('Valid cases', () => {
    test('Correct return', () => {
      expect(playerAnswerExplanation(playerId, 1))
        .toStrictEqual({ explanation: expect.any(String) });
    });
  });
});
