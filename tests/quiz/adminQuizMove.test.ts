// Importing adminAuthRegister and adminAuthLogout from auth.js
import { adminAuthRegister } from '../test_helpers/auth';

// Importing adminQuizMove from quiz.js
import {
  adminQuizMove,
  adminQuizCreate,
  adminQuestionCreate,
  adminQuizInfo,
} from '../test_helpers/quiz';

// Import uuidv4 from uuid
import { v4 as uuidv4 } from 'uuid';

// Importing clear from other.js
import { clear } from '../test_helpers/other';

beforeEach(() => {
  // Clears the state of the dataStore before each test.
  clear();
});

describe('Valid testcases', () => {
  let session: { session: string };
  let quiz: { quizId: number };
  let questions: { questionId: number }[] = [];

  const questionBody1 = {
    question: 'Who is the Monarch of England',
    timeLimit: 4,
    points: 5,
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
  const questionBody3 = {
    question: 'What am I doing with my life?',
    timeLimit: 4,
    points: 5,
    answerOptions: [
      {
        answer: 'Wasting',
        correct: true,
      },
      {
        answer: 'Achieveing my dreams',
        correct: false,
      },
    ],
  };

  beforeEach(() => {
    questions = [];
    session = adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    quiz = adminQuizCreate(session.session, 'Quiz 1', 'Lorem ipsum dolor');
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody1)
    );
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody2)
    );
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody3)
    );
  });

  test('correct return type', () => {
    expect(
      adminQuizMove(quiz.quizId, questions[0].questionId, session.session, 1)
    ).toStrictEqual({});
  });

  test('check if a single move works', () => {
    adminQuizMove(quiz.quizId, questions[0].questionId, session.session, 1);

    expect(adminQuizInfo(session.session, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Lorem ipsum dolor',
      numQuestions: 3,
      questions: [
        {
          questionId: questions[1].questionId,
          question: 'What are the first three letters of the alphabet',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: false
            },
            {
              answerId: expect.any(Number),
              answer: 'ABC',
              colour: expect.any(String),
              correct: true
            }
          ]
        },
        {
          questionId: questions[0].questionId,
          question: 'Who is the Monarch of England',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'ABC',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: questions[2].questionId,
          question: 'What am I doing with my life?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Wasting',
              colour: expect.any(String),
              correct: true,
            },
            {
              answerId: expect.any(Number),
              answer: 'Achieveing my dreams',
              colour: expect.any(String),
              correct: false,
            },
          ],
        }
      ],
      timeLimit: 12
    });
  });

  test('check if multiple moves work', () => {
    adminQuizMove(quiz.quizId, questions[0].questionId, session.session, 1);
    adminQuizMove(quiz.quizId, questions[1].questionId, session.session, 2);

    expect(adminQuizInfo(session.session, quiz.quizId)).toStrictEqual({
      quizId: quiz.quizId,
      name: 'Quiz 1',
      timeCreated: expect.any(Number),
      timeLastEdited: expect.any(Number),
      description: 'Lorem ipsum dolor',
      numQuestions: 3,
      questions: [
        {
          questionId: questions[0].questionId,
          question: 'Who is the Monarch of England',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: true
            },
            {
              answerId: expect.any(Number),
              answer: 'ABC',
              colour: expect.any(String),
              correct: false
            }
          ]
        },
        {
          questionId: questions[2].questionId,
          question: 'What am I doing with my life?',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Wasting',
              colour: expect.any(String),
              correct: true,
            },
            {
              answerId: expect.any(Number),
              answer: 'Achieveing my dreams',
              colour: expect.any(String),
              correct: false,
            },
          ],
        },
        {
          questionId: questions[1].questionId,
          question: 'What are the first three letters of the alphabet',
          timeLimit: 4,
          points: 5,
          answerOptions: [
            {
              answerId: expect.any(Number),
              answer: 'Prince Charles',
              colour: expect.any(String),
              correct: false
            },
            {
              answerId: expect.any(Number),
              answer: 'ABC',
              colour: expect.any(String),
              correct: true
            }
          ]
        }
      ],
      timeLimit: 12
    });
  });
});

describe('New position validation', () => {
  let session: { session: string };
  let quiz: { quizId: number };
  let questions: { questionId: number }[] = [];

  const questionBody1 = {
    question: 'Who is the Monarch of England',
    timeLimit: 4,
    points: 5,
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
    question: 'What the first three letters of the alphabet',
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
    questions = [];
    session = adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    quiz = adminQuizCreate(session.session, 'Quiz 1', 'Lorem ipsum dolor');
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody1)
    );
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody2)
    );
  });
  test.each([{ newPosition: -10 }, { newPosition: 10 }, { newPosition: 0 }])(
    'testing invalid newPosition=$newPosition',
    ({ newPosition }) => {
      expect(
        adminQuizMove(
          quiz.quizId,
          questions[0].questionId,
          session.session,
          newPosition
        )
      ).toStrictEqual({
        error: expect.any(String),
        code: 400,
      });
    }
  );
  test('moving to the same position', () => {
    expect(
      adminQuizMove(
        quiz.quizId,
        questions[0].questionId,
        session.session,
        0
      )
    ).toStrictEqual({
      error: expect.any(String),
      code: 400,
    });
  });
});

describe('QuestionId validation', () => {
  let session: { session: string };
  let quiz: { quizId: number };
  let questions: { questionId: number }[] = [];

  const questionBody1 = {
    question: 'Who is the Monarch of England',
    timeLimit: 4,
    points: 5,
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
    question: 'What the first three letters of the alphabet',
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
    questions = [];
    session = adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    quiz = adminQuizCreate(session.session, 'Quiz 1', 'Lorem ipsum dolor');
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody1)
    );
    questions.push(
      adminQuestionCreate(session.session, quiz.quizId, questionBody2)
    );
  });

  test.each([{ questionId: -10 }, { questionId: 10 }])(
    'testing invalid questionId=$questionId',
    ({ questionId }) => {
      expect(
        adminQuizMove(quiz.quizId, questionId, session.session, 1)
      ).toStrictEqual({
        error: expect.any(String),
        code: 400,
      });
    }
  );
});

describe('Session validation', () => {
  let session1: { session: string };
  let quiz1: { quizId: number };

  beforeEach(() => {
    session1 = adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    quiz1 = adminQuizCreate(session1.session, 'Quiz 1', 'Lorem ipsum dolor');
  });

  test('passing an empty sesion', () => {
    expect(adminQuizMove(quiz1.quizId, 0, '', 1)).toStrictEqual({
      error: expect.any(String),
      code: 401,
    });
  });

  test("passing in a sessionId that doesn't exist", () => {
    expect(adminQuizMove(quiz1.quizId, 0, uuidv4(), 1)).toStrictEqual({
      error: expect.any(String),
      code: 401,
    });
  });
});

describe('Quiz ID validation', () => {
  let session1: { session: string };
  let session2: { session: string };
  let quiz2: { quizId: number };

  beforeEach(() => {
    session1 = adminAuthRegister('foo@bar.com', 'valid1234', 'valid', 'valid');
    session2 = adminAuthRegister(
      'bar@foo.com',
      'valid12345',
      'anothervalid',
      'anothervalid'
    );
    quiz2 = adminQuizCreate(session2.session, 'Quiz 2', 'Lorem ipsum dolor');
  });

  test.each([{ quizId: -10 }, { quizId: 10 }])(
    'testing invalid quizId=$quizId',
    ({ quizId }) => {
      expect(adminQuizMove(quizId, 0, session1.session, 1)).toStrictEqual({
        error: expect.any(String),
        code: 403,
      });
    }
  );

  test('accessing another persons quiz', () => {
    expect(adminQuizMove(quiz2.quizId, 0, session1.session, 1)).toStrictEqual({
      error: expect.any(String),
      code: 403,
    });
  });
});
