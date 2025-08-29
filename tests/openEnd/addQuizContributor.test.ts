// Importing adminAuthRegister from auth.ts in helpers dir
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizCreate and adminQuestionCreate from quiz.ts in helpers dir
import {
  adminQuizCreate,
  adminQuestionCreateV2,
  adminQuizInfoV2,
  adminQuizThumbnail,
  adminQuizList,
  adminQuestionDeleteV2,
  adminQuizInfo,
  adminQuizMove,
  adminQuizQuestionUpdate,
  getQuestionSuggestion,
} from '../test_helpers/quiz';

// Importing clear from other.ts in helpers dir
import { clear } from '../test_helpers/other';

// Importing addQuizContributor from openEnd.ts in helpers dir
import { addQuizContributor } from '../test_helpers/openEnd';

let sessions: string[];
let quizzes: number[];
let questions: number[];

const questionBody1 = {
  question: 'Who is the Monarch of England',
  timeLimit: 4,
  points: 5,
  thumbnailUrl: 'http://google.com/some/image/path.jpg',
  answerOptions: [
    {
      answer: 'Prince Charles',
      correct: true,
    },
    {
      answer: 'ABC',
      correct: false,
    },
  ],
};

const questionBody2 = {
  question: 'What are the first three letters of the alphabet',
  timeLimit: 4,
  points: 5,
  answerOptions: [
    {
      answer: 'Prince Charles',
      correct: false,
    },
    {
      answer: 'ABC',
      correct: true,
    },
  ],
};

beforeEach(() => {
  // Reset the state of our data so that each tests can run independently
  clear();
  sessions = [];
  quizzes = [];
  questions = [];
  sessions.push(
    adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid').session
  );
  sessions.push(
    adminAuthRegister('bar@foo.com', 'valid12345', 'Sir valid', 'the valid')
      .session
  );
  quizzes.push(
    adminQuizCreate(sessions[0], 'Owner test', 'Add contributors dingus').quizId
  );
  quizzes.push(
    adminQuizCreate(sessions[1], 'Contributor test', 'Nocomm').quizId
  );
  adminQuizThumbnail(
    sessions[0],
    quizzes[0],
    'http://google.com/some/image/path.jpg'
  );
  questions.push(
    adminQuestionCreateV2(sessions[0], quizzes[0], questionBody1).questionId
  );
});

// Valid testcases
describe('Valid testcases', () => {
  test('successfully added contributor', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com')
    ).toStrictEqual({});
  });
  test('successfully added multiple contributors', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com')
    ).toStrictEqual({});
    sessions.push(
      adminAuthRegister('sir@foo.com', 'fool1234rf', 'sir foo', 'the third')
        .sessionId
    );
    sessions.push(
      adminAuthRegister('sir@bar.com', 'fool14234rf', 'sir bar', 'the fourth')
        .sessionId
    );
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'sir@foo.com')
    ).toStrictEqual({});
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'sir@bar.com')
    ).toStrictEqual({});
  });
  test('successfully view the created quiz as a contributor (quizInfo)', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    const info = adminQuizInfoV2(sessions[1], quizzes[0]);
    expect(info).toStrictEqual({
      quizId: quizzes[0],
      name: 'Owner test',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Add contributors dingus',
      numQuestions: 1,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
      questions: [
        {
          question: 'Who is the Monarch of England',
          questionId: expect.any(Number),
          timeLimit: 4,
          points: 5,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          answerOptions: [
            {
              answer: 'Prince Charles',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: true,
            },
            {
              answer: 'ABC',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: false,
            },
          ],
        },
      ],
      timeLimit: 4,
    });
  });
  test('successfully view the created quiz as a contributor (quizInfoV2)', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    expect(adminQuizInfo(sessions[1], quizzes[0])).toStrictEqual({
      quizId: quizzes[0],
      name: 'Owner test',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Add contributors dingus',
      numQuestions: 1,
      questions: [
        {
          question: 'Who is the Monarch of England',
          questionId: expect.any(Number),
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answer: 'Prince Charles',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: true,
            },
            {
              answer: 'ABC',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: false,
            },
          ],
        },
      ],
      timeLimit: 4,
    });
    const info = adminQuizInfoV2(sessions[1], quizzes[0]);
    expect(info).toStrictEqual({
      quizId: quizzes[0],
      name: 'Owner test',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Add contributors dingus',
      numQuestions: 1,
      questions: [
        {
          question: 'Who is the Monarch of England',
          questionId: expect.any(Number),
          timeLimit: 4,
          points: 5,
          thumbnailUrl: 'http://google.com/some/image/path.jpg',
          answerOptions: [
            {
              answer: 'Prince Charles',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: true,
            },
            {
              answer: 'ABC',
              answerId: expect.any(Number),
              colour: expect.any(String),
              correct: false,
            },
          ],
        },
      ],
      timeLimit: 4,
      thumbnailUrl: 'http://google.com/some/image/path.jpg',
    });
  });
  test('successfully view quizzes', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    expect(adminQuizList(sessions[1])).toStrictEqual({
      quizzes: [
        { quizId: expect.any(Number), name: 'Owner test' },
        { quizId: expect.any(Number), name: 'Contributor test' },
      ],
    });
  });
  test('successfully add question', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    expect(
      adminQuestionCreateV2(sessions[1], quizzes[0], questionBody2)
    ).toStrictEqual({ questionId: expect.any(Number) });
  });
  test('successfully delete question', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    expect(
      adminQuestionDeleteV2(sessions[1], quizzes[0], questions[0])
    ).toStrictEqual({});
  });
  test('successfully update question', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    expect(
      adminQuizQuestionUpdate(
        quizzes[0],
        questions[0],
        sessions[1],
        questionBody2,
        'http://google.com/some/image/path.jpg'
      )
    ).toStrictEqual({});
  });
  test('successfully move a question', () => {
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    questions.push(
      adminQuestionCreateV2(sessions[1], quizzes[0], questionBody2).questionId
    );
    expect(
      adminQuizMove(quizzes[0], questions[1], sessions[1], 0)
    ).toStrictEqual({});
  });
  test('successfully get a question suggestion', () => {
    expect(getQuestionSuggestion(sessions[1], quizzes[0])).toStrictEqual({
      error: expect.any(String),
      statusCode: 403,
    });
    addQuizContributor(sessions[0], quizzes[0], 'bar@foo.com');
    const result = getQuestionSuggestion(sessions[1], quizzes[0]);
    expect(result).toStrictEqual({ question: expect.any(String) });
  });
});

// Quiz validation
describe('Quiz validation', () => {
  test('invalid quiz', () => {
    expect(
      addQuizContributor(sessions[0], 187263, 'bar@foo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 403,
    });
  });

  test('owner does not own quiz', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[1], 'barfoo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 403,
    });
  });
});

// Contributor validation
describe('Contributor validation', () => {
  test('invalid email', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'barfoo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 400,
    });
  });

  test('contributor email is invalid', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'barfoo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 400,
    });
  });
  test('contributor does not exist', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'sir@bar.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 400,
    });
  });
  test('contributor is the owner themselves', () => {
    expect(
      addQuizContributor(sessions[0], quizzes[0], 'foo@bar.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 400,
    });
  });
});

// Owner validation
describe('Owner validation', () => {
  test('invalid session', () => {
    expect(
      addQuizContributor('iug09384ukgh', quizzes[0], 'bar@foo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 401,
    });
  });
  test('user doesnt own the quiz', () => {
    expect(
      addQuizContributor(sessions[1], quizzes[0], 'bar@foo.com')
    ).toStrictEqual({
      error: expect.any(String),
      code: 403,
    });
  });
});
