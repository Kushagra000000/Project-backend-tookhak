import { getData, setData } from './dataStore';
import { addAnswers, checkDuplicates, checkUrlEnd, checkUrlStart } from './helper';
import {
  EmptyObject,
  ErrorObject,
  QuizList,
  QuizInfo,
  QuestionBody,
  AnswerInfo,
  Quiz,
  QuestionInfo,
  QuizGameState,
} from './interface';

import request from 'sync-request-curl'; // For getQuestionsuggestion

// Import errors from handler.ts
import { SessionError, IndexError, AccessDeniedError, InputError } from './handler';

/**
  * Update the description of the relevant quiz.
  *
  * @param {string} session - A given session token of the logged in user
  * @param {integer} quizId - A given quizId
  * @param {string} description - a given description for the quiz to update
  *
  * @returns {EmptyObject | ErrorObject} - an empty object or a specific error message
*/

function adminQuizDescriptionUpdate(
  session: string,
  quizId: number,
  description: string
): EmptyObject {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }
  const userId = user.userId;

  // Quiz ID does not refer to a valid quiz.
  if (!data.quizzes.some((quiz) => quiz.quizId === quizId)) {
    throw new AccessDeniedError('Quiz ID does not refer to a valid quiz.');
  }
  // Quiz ID does not refer to a quiz that this user owns.
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  if (quiz.userId !== userId) {
    throw new AccessDeniedError('Quiz ID does not refer to a quiz that this user owns.');
  }
  // Description is more than 100 characters in length (note: empty strings are OK).
  if (description.length > 100) {
    throw new InputError(`Description is more than 100 characters in length 
      (note: empty strings are OK).`);
  }

  const index = data.quizzes.findIndex(
    (quiz) => quiz.userId === userId && quiz.quizId === quizId
  );
  data.quizzes[index].description = description;
  data.quizzes[index].timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  return {};
}

/**
  * Update the name of the relevant quiz.
  *
  * @param {string} session - A given session token of the logged in user
  * @param {integer} quizId - A given quizId
  * @param {string} name - a given name for the quiz to update
  *
  * @returns {EmptyObject | ErrorObject} - an empty object or an error message
*/

function adminQuizNameUpdate(
  session: string,
  quizId: number,
  name: string
): EmptyObject {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }

  const userId = user.userId;

  // Quiz ID does not refer to a valid quiz.
  if (!data.quizzes.some((quiz) => quiz.quizId === quizId)) {
    throw new AccessDeniedError('Quiz ID does not refer to a valid quiz.');
  }
  // Quiz ID does not refer to a quiz that this user owns.
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  if (quiz.userId !== userId) {
    throw new AccessDeniedError('Quiz ID does not refer to a quiz that this user owns.');
  }
  // Name contains invalid characters. Valid characters are alphanumeric and spaces.
  // regex from https://regex101.com/library/hI9cR2
  if (!name.match(/^[a-zA-Z0-9 ]*$/)) {
    throw new InputError(`Name contains invalid characters. 
      Valid characters are alphanumeric and spaces.`);
  }
  // Name is either less than 3 characters long or more than 30 characters long.
  if (name.length < 3) {
    throw new InputError('Name is too short (less than 3 characters)');
  }
  if (name.length > 30) {
    throw new InputError('Name is too long (greater than 30 characters)');
  }
  // Name is already used by the current logged in user for another quiz.
  if (
    getData().quizzes.find((quiz) => {
      return quiz.userId === userId && quiz.name === name;
    })
  ) {
    throw new InputError('Name is already used by the current logged in user for another quiz.');
  }

  const index = data.quizzes.findIndex(
    (quiz) => quiz.userId === userId && quiz.quizId === quizId
  );
  data.quizzes[index].name = name;
  data.quizzes[index].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Provide a list of all quizzes that are owned by the currently logged
 * in user.
 *
 * @param {string} session - The session of the logged in user
 *
 * @returns {{ quizzes: QuizList[] }}
 * The list of quizzes owned by the user
 */
function adminQuizList(session: string): { quizzes: QuizList[] } {
  const data = getData();

  const userSession = data.sessions.find((user) => user.session === session);
  if (!userSession) {
    throw new SessionError('Invalid Session');
  }

  // Use the filter function to find a quiz array only with the logged in user.
  const userQuizzes = data.quizzes.filter(
    (quiz) => (quiz.userId === userSession.userId) ||
    (quiz.contributors.some(u => u === userSession.userId))
  );

  // Use the map function to create an array with the required format
  const quizList = userQuizzes.map((quiz) => ({
    quizId: quiz.quizId,
    name: quiz.name,
  }));

  return { quizzes: quizList };
}

/**
 * Given basic details about a new quiz, create one for the logged in user.
 *
 * @param {string} session - A token for the logged in user
 * @param {string} name - Name of the quiz
 * @param {string} description - a given description for the quiz to update
 *
 * @return {{ quizId: number }} - the ID of the quiz created
 */
function adminQuizCreate(
  session: string,
  name: string,
  description: string
): { quizId: number } {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }

  // Check if the name contains any invalid characters
  if (/[^a-zA-Z0-9 ]/.test(name)) {
    throw new InputError('Name contains invalid characters');
  }

  // Check the length of the name
  if (name.length < 3 || name.length > 30) {
    throw new InputError('Name must be between 3 to 30 characters long');
  }

  // Use some function to check if name is used
  if (
    data.quizzes.some(
      (quiz) => quiz.userId === user.userId && quiz.name === name
    )
  ) {
    throw new InputError('Name has already been used');
  }

  // Check the length of the description
  if (description.length > 100) {
    throw new InputError('Description needs to be 100 characters or less');
  }

  // Generate a unique quizId
  let quizId = 0;
  while (quizId === 0 || data.quizzes.some((quiz) => quiz.quizId === quizId)) {
    quizId = Date.now() + Math.floor(Math.random() * 1000);
  }

  // Formula is from diary.js (week 3 lab)
  const timeCreated = Math.floor(Date.now() / 1000);

  const questions: QuestionInfo[] = [];
  const newQuiz: Quiz = {
    userId: user.userId,
    contributors: [],
    quizId: quizId,
    name: name,
    description: description,
    timeCreated: timeCreated,
    timeLastEdited: timeCreated,
    numQuestions: 0,
    questions,
    timeLimit: 0,
    thumbnailUrl: ''
  };

  data.quizzes.push(newQuiz);
  setData(data);
  return { quizId: quizId };
}

function adminQuizRemove(
  session: string,
  quizId: number
): EmptyObject { // removed the error object
  if (!session) {
    throw new SessionError('Empty session');
  }

  const data = getData();
  const user = data.sessions.find(u => u.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Invalid quiz id');
  }

  if (quiz.userId !== user.userId) {
    throw new AccessDeniedError('Quiz Id and session do not match');
  }

  data.quizzes = data.quizzes.filter(q => q.quizId !== quizId);
  setData(data);
  return {};
}

/**
 * Given a particular quiz, permanently remove the quiz.
 *
 * @param {string} session - Current session token
 * @param {number} quizId - A given quizId
 *
 * @return {EmptyObject | ErrorObject} - empty object or an error message
 */
function adminQuizRemoveV2(
  session: string,
  quizId: number
): EmptyObject | ErrorObject {
  if (!session) {
    throw new SessionError('Empty session');
  }

  const data = getData();

  const user = data.sessions.find(u => u.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }

  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Invalid quiz id');
  }

  if (quiz.userId !== user.userId) {
    throw new AccessDeniedError('Quiz Id and session do not match');
  }

  // New one for version 2
  if (data.quizGames.some(game => game.state !== QuizGameState.END &&
    game.quiz.quizId === quiz.quizId && game.quiz.userId === user.userId)) {
    throw new InputError('Any game for this quiz is not in END state');
  }

  // Remove the quiz.
  data.quizzes = data.quizzes.filter(q => q.quizId !== quizId);
  setData(data);

  return {};
}

/**
 * Get all of the relevant information about the current quiz.
 *
 * @param {string} session - A token for the logged in user
 * @param {integer} quizId - A given quizId
 *
 * @return { quiz:
* {
*      quizId: {number},
*      name: {string},
*      timeCreated: {number},
*      timeLastEdited: {number},
*      description: {string},
*      numQuestions: {number},
*      questions: {QuestionInfo[]},
*      timeLimit: {number}
* }  | ErrorObject }  - The quizObject or the errorObject
*/
function adminQuizInfo(
  session: string,
  quizId: number
): QuizInfo {
  if (!session) {
    throw new SessionError('Empty session');
  }

  const data = getData();
  const user = data.sessions.find(u => u.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Invalid quiz Id');
  }

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  // Added due the interface changes in iteration 3
  const questions = quiz.questions.map(item => ({
    questionId: item.questionId,
    question: item.question,
    answerOptions: item.answerOptions,
    timeLimit: item.timeLimit,
    points: item.points
  }));

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    description: quiz.description,
    numQuestions: quiz.numQuestions,
    questions,
    timeLimit: quiz.timeLimit,
  };
}

/**
 * Get all of the relevant information about the current quiz with a thumbnail.
 *
 * @param {string} session - Current session token
 * @param {number} quizId - A given quizId
 *
 * @throw error or ...
 * @return {QuizInfo} - empty object or an error message
 */
function adminQuizInfoV2(
  session: string,
  quizId: number
): QuizInfo {
  if (!session) {
    throw new SessionError('Empty session');
  }
  const data = getData();
  const user = data.sessions.find(u => u.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }
  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Invalid quiz id');
  }

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  return {
    quizId: quiz.quizId,
    name: quiz.name,
    description: quiz.description,
    timeCreated: quiz.timeCreated,
    timeLastEdited: quiz.timeLastEdited,
    numQuestions: quiz.numQuestions,
    questions: quiz.questions,
    timeLimit: quiz.timeLimit,
    thumbnailUrl: quiz.thumbnailUrl,
  };
}

/**
 * Create a new stub question for a particular quiz.
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The quizId for the quiz
 * @param {QuestionBody} questionBody - The information about the question to be created
 *
 * @returns {{ questionId: number }} - The ID for the question created
 */
function adminQuestionCreate(
  session: string,
  quizId: number,
  questionBody: QuestionBody
): { questionId: number } {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }

  const quiz = data.quizzes.find(
    (quiz) => quiz.quizId === quizId
  );
  if (!quiz) {
    throw new AccessDeniedError('Invalid quizId');
  }

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  // Question string is less than 5 characters in length or greater than 50 characters in length
  if (questionBody.question.length < 5 || questionBody.question.length > 50) {
    throw new InputError('Invalid number of characters for a question');
  }

  // The question has more than 6 answers or less than 2 answers
  if (
    questionBody.answerOptions.length < 2 ||
    questionBody.answerOptions.length > 6
  ) {
    throw new InputError('Invalid number of answers');
  }

  // The question timeLimit is not a positive number
  if (questionBody.timeLimit <= 0) {
    throw new InputError('Negative time limit');
  }

  // The sum of the question timeLimits in the quiz exceeds 3 minutes
  if (quiz.timeLimit + questionBody.timeLimit > 180) {
    throw new InputError('Total time limit is greater than 3 miniutes');
  }

  // The points awarded for the question are less than 1 or greater than 10
  if (questionBody.points < 1 || questionBody.points > 10) {
    throw new InputError('Question can only have points between 1 and 10');
  }

  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  if (
    questionBody.answerOptions.some(
      (option) => option.answer.length < 1 || option.answer.length > 30
    )
  ) {
    throw new InputError('Invalid number of characters for an answer');
  }

  // Any answer strings are duplicates of one another (within the same question)
  if (checkDuplicates(questionBody.answerOptions)) {
    throw new InputError('Some answers strings are duplicates of one another');
  }

  // There are no correct answers
  if (!questionBody.answerOptions.some((option) => option.correct === true)) {
    throw new InputError('There are no correct answers');
  }

  // The following error handling is only required for the v2 route
  if (questionBody.thumbnailUrl !== undefined) {
    if (questionBody.thumbnailUrl === '') {
      throw new InputError('URL is empty');
    }

    if (!checkUrlEnd(questionBody.thumbnailUrl)) {
      throw new InputError('The URL does not end with the correct file types');
    }

    if (!checkUrlStart(questionBody.thumbnailUrl)) {
      throw new InputError('The URL does not start with the correct substrings');
    }
  }

  quiz.numQuestions++;
  quiz.timeLimit += questionBody.timeLimit;

  // Create the answers for the question
  const answers: AnswerInfo[] = addAnswers(questionBody.answerOptions);

  // Generate a unique questionId
  let questionId = 0;
  while (
    quiz.questions.some((question) => question.questionId === questionId) ||
    questionId === 0
  ) {
    questionId = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  const newQuestion: QuestionInfo = {
    questionId,
    question: questionBody.question,
    timeLimit: questionBody.timeLimit,
    points: questionBody.points,
    answerOptions: answers,
  };

  // Only for v2 route
  if (questionBody.thumbnailUrl) {
    newQuestion.thumbnailUrl = questionBody.thumbnailUrl;
  }

  quiz.questions.push(newQuestion);

  // The timeLastEdited is set as the same as the created time
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return { questionId };
}

/**
 * Update the relevant details of a particular question within a quiz.
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The quizId for the quiz
 * @param {number} questionId - The questionId for the relevant question
 * @param {QuestionBody} questionBody - The information about the question to be created
 *
 * @returns {EmptyObject | ErrorObject} - an empty object
 * or a specific error message
 */
function adminQuizQuestionUpdate(
  quizId: number,
  questionId: number,
  session: string,
  questionBody: QuestionBody
): EmptyObject {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }

  // Quiz ID does not refer to a valid quiz.
  if (!data.quizzes.some((quiz) => quiz.quizId === quizId)) {
    throw new AccessDeniedError('Quiz ID does not refer to a valid quiz.');
  }
  // Quiz ID does not refer to a quiz that this user owns.
  const quiz = data.quizzes.find((quiz) => quiz.quizId === quizId);

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  const question = quiz.questions.find(
    (question) => question.questionId === questionId
  );

  // Question Id does not refer to a valid question within this quiz
  if (!question) {
    throw new InputError('Question Id does not refer to a valid question within this quiz');
  }

  // Question string is less than 5 characters in length or greater than 50 characters in length
  if (questionBody.question.length < 5) {
    throw new InputError('Question string is less than 5 characters in length');
  }
  if (questionBody.question.length > 50) {
    throw new InputError('Question string is greater than 50 characters in length');
  }

  // The question has more than 6 answers or less than 2 answers
  if (questionBody.answerOptions.length < 2) {
    throw new InputError('The question has less than 2 answers');
  }
  if (questionBody.answerOptions.length > 6) {
    throw new InputError('The question has more than 6 answers');
  }

  // The question timeLimit is not a positive number
  // ? accepts infinity ?
  if (questionBody.timeLimit <= 0) {
    throw new InputError('The question timeLimit is not a positive number');
  }

  // If this question were to be updated, the sum of the question
  // timeLimits in the quiz exceeds 3 minutes
  const time: number = quiz.questions.reduce((acc, question) => {
    if (question.questionId === questionId) {
      return acc + questionBody.timeLimit;
    }
    return acc + question.timeLimit;
  }, 0);
  if (time > 180) {
    throw new InputError('The sum of the question timeLimits in the quiz exceeds 3 minutes');
  }

  // The points awarded for the question are less than 1 or greater than 10
  if (questionBody.points < 1) {
    throw new InputError('The points awarded for the question are less than 1');
  }
  if (questionBody.points > 10) {
    throw new InputError('The points awarded for the question are greater than 10');
  }

  // The length of any answer is shorter than 1 character long, or longer than 30 characters long
  for (const question of questionBody.answerOptions) {
    if (question.answer.length < 1) {
      throw new InputError('The length of any answer is shorter than 1 character long');
    } else if (question.answer.length > 30) {
      throw new InputError('The length of any answer is longer than 30 characters long');
    }
  }

  // Any answer strings are duplicates of one another (within the same question)
  if (checkDuplicates(questionBody.answerOptions)) {
    throw new InputError('Some answers strings are duplicates of one another');
  }

  // There are no correct answers
  if (!questionBody.answerOptions.some((option) => option.correct === true)) {
    throw new InputError('There are no correct answers');
  }

  // The following error handling is only required for the v2 route
  if (questionBody.thumbnailUrl !== undefined) {
    if (questionBody.thumbnailUrl === '') {
      throw new InputError('URL is empty');
    }

    if (!checkUrlEnd(questionBody.thumbnailUrl)) {
      throw new InputError('The URL does not end with the correct file types');
    }

    if (!checkUrlStart(questionBody.thumbnailUrl)) {
      throw new InputError('The URL does not start with the correct substrings');
    }
  }

  const questionAnswers: AnswerInfo[] = addAnswers(questionBody.answerOptions);

  // * note time is calculated when the quiz is checked to not be longer than 180
  question.answerOptions = questionAnswers;
  question.question = questionBody.question;
  question.points = questionBody.points;
  question.timeLimit = questionBody.timeLimit;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  quiz.timeLimit = time;
  // Only for v2 route
  if (questionBody.thumbnailUrl) {
    question.thumbnailUrl = questionBody.thumbnailUrl;
  }
  setData(data);
  return {};
}

/**
 * Delete a particular question from a quiz
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID for the quiz that the user owns
 * @param {number} questionId - The ID for the question to be deleted
 * @returns { EmptyObject } - An empty object
 */
function adminQuestionDelete(
  session: string,
  quizId: number,
  questionId: number
): EmptyObject {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }

  const quiz = data.quizzes.find(
    (quiz) => quiz.quizId === quizId
  );
  if (!quiz) {
    throw new AccessDeniedError('Invalid quizId');
  }

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  const question = quiz.questions.find(
    (question) => question.questionId === questionId
  );
  if (!question) {
    throw new InputError('Question Id does not refer to a valid question within this quiz');
  }

  // V2 route only
  if (data.quizGames.some(
    game => game.state !== QuizGameState.END &&
    game.quiz.quizId === quiz.quizId && game.quiz.userId === user.userId)
  ) {
    throw new InputError('Some game for the quiz is not in END state');
  }

  // Everything is valid
  quiz.numQuestions--;
  quiz.timeLimit -= question.timeLimit;
  quiz.questions = quiz.questions.filter(
    (question) => question.questionId !== questionId
  );
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);
  return {};
}

/**
 * Transfer ownership of a quiz to a different user based on their email
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID for the quiz
 * @param {string} targetEmail - The email of the target user
 * @returns {EmptyObject | ErrorObject} - An empty object or an error message
 */

function adminQuizTransfer(
  session: string,
  quizId: number,
  userEmail: string
): EmptyObject {
  const data = getData();

  const sessionUser = data.sessions.find(s => s.session === session);
  if (!sessionUser) {
    throw new SessionError('Invalid session');
  }

  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Quiz does not exist');
  }

  if (quiz.userId !== sessionUser.userId) {
    throw new AccessDeniedError('User does not own this quiz');
  }

  const targetUser = data.users.find(u => u.email === userEmail);
  if (!targetUser) {
    throw new InputError('Target user does not exist');
  }

  if (sessionUser.userId === targetUser.userId) {
    throw new InputError('userEmail is the current logged in user');
  }

  const duplicateName = data.quizzes.some(
    q => q.name === quiz.name && q.userId === targetUser.userId
  );
  if (duplicateName) {
    throw new InputError(
      'Quiz ID refers to a quiz that has a name that is already used by the target user'
    );
  }

  // V2 route only
  if (data.quizGames.some(
    game => game.state !== QuizGameState.END &&
    game.quiz.quizId === quizId && game.quiz.userId === sessionUser.userId)
  ) {
    throw new InputError('Some game for the quiz is not in END state');
  }

  quiz.userId = targetUser.userId;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  return {};
}

/**
 * Move a question inside of a quiz
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID for the quiz that the user owns
 * @param {number} questionId - The ID for the question to be moved
 * @param {number} newPosition - The new position for the question
 *
 * @returns { EmptyObject } - An empty object or a spcific error message
 */
function adminQuizMove(
  session: string,
  quizId: number,
  questionId: number,
  newPosition: number
): EmptyObject {
  const data = getData();

  const quizIndex = data.quizzes.findIndex((quiz) => quiz.quizId === quizId);
  const user = data.sessions.find((s) => s.session === session);

  if (!user) throw new SessionError('Session is invalid or does not exist');

  if (quizIndex === -1) throw new AccessDeniedError('Quiz does not exist');

  const quiz = data.quizzes[quizIndex];

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  const questionIndex = data.quizzes[quizIndex].questions.findIndex(
    (q) => q.questionId === questionId
  );

  if (questionIndex === -1) throw new IndexError('Question does not exist');

  if (newPosition < 0 || newPosition >= data.quizzes[quizIndex].questions.length) {
    throw new IndexError('Question cannot be moved to the position given');
  }

  if (newPosition === questionIndex) {
    throw new IndexError('Question cant be moved to where it already exists');
  }

  const [question] = data.quizzes[quizIndex].questions.splice(questionIndex, 1);
  data.quizzes[quizIndex].questions.splice(newPosition, 0, question);

  data.quizzes[quizIndex].timeLastEdited = Math.floor(Date.now() / 1000);

  setData(data);

  return {};
}

/**
 * Get a suggested question from the LLM API
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID of the quiz
 * @returns {{ question: string }} - The suggested question or an
 * error message
 */
function getQuestionSuggestion(
  session: string,
  quizId: number
): { question: string } {
  const data = getData();

  const user = data.sessions.find((s) => s.session === session);
  if (!user) throw new SessionError('Invalid Session');

  const quiz = data.quizzes.find(q => q.quizId === quizId);
  if (!quiz) throw new AccessDeniedError('Quiz does not exist or not belonged to the user');

  if (quiz.userId !== user.userId) {
    if ((!quiz.contributors.some(u => u === user.userId))) {
      throw new AccessDeniedError('User is not an owner or a contributor');
    }
  }

  // Make prompts based ont he details of the quiz, name and description
  const prompt =
  `Generate a quiz question for quiz named "${quiz.name}" about "${quiz.description}".`;

  const token = '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';

  const res = request('POST',
    'https://router.huggingface.co/hf-inference/models/google/flan-t5-large', {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      json: { inputs: prompt }
    });

  // Extract the question from the generated text
  const body = JSON.parse(res.body.toString());
  const text = body[0].generated_text.trim();

  return { question: text };
}

/**
 * Update the thumbnail for the quiz.
 *
 * @param {string} session - The session token for the user
 * @param {number} quizId - The ID of the quiz
 * @param {string} thumbnailUrl - The URL of the picture
 *
 * @returns {EmptyObject} - an empty object
 */
function adminQuizThumbnail(
  session: string,
  quizId: number,
  thumbnailUrl: string
): EmptyObject {
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid session');
  }

  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId && quiz.userId === user.userId);
  if (!quiz) {
    throw new AccessDeniedError('Invalid quizId');
  }

  // Handles the url errors
  if (!checkUrlEnd(thumbnailUrl)) {
    throw new InputError('The URL does not end with the correct file types');
  }

  if (!checkUrlStart(thumbnailUrl)) {
    throw new InputError('The URL does not start with the correct substrings');
  }

  // Correct inputs
  quiz.thumbnailUrl = thumbnailUrl;
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  return {};
}

export {
  adminQuizQuestionUpdate,
  adminQuizDescriptionUpdate,
  adminQuizNameUpdate,
  adminQuizList,
  adminQuizCreate,
  adminQuizRemove,
  adminQuizInfo,
  adminQuestionCreate,
  adminQuestionDelete,
  adminQuizTransfer,
  adminQuizMove,
  getQuestionSuggestion,
  adminQuizThumbnail,
  adminQuizRemoveV2,
  adminQuizInfoV2
};
