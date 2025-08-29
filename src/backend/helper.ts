// Import isAlpha and isEmail from validtor.js
import { isAlpha, isEmail } from 'validator';

// Import getData from dataStore.js
import { gameTimers, getData, setData } from './dataStore';
import {
  AnswerBody,
  AnswerInfo,
  Colour,
  DataStore,
  QuizGameState
} from './interface';

// Importing hash function
import { createHash } from 'crypto';

/**
 * Checks if the input string is a name.
 *
 * @param {string} string - input string
 *
 * @returns {boolean} - true when the string is a name
 *                      false when the string is not a name
 */

function isName(string: string): boolean {
  for (const char of string) {
    if (!isAlpha(char) && ![' ', "'", '-'].includes(char)) {
      return false;
    }
  }
  return true;
}

/**
 * Checks if the input string contains atleast one letter.
 *
 * @param {string} string - input string
 *
 * @returns {boolean} - true when the string has atleast one letter
 *                      false when there are no letters
 */

function containsLetter(string: string): boolean {
  for (const char of string.toLowerCase()) {
    if (char >= 'a' && char <= 'z') {
      return true;
    }
  }
  return false;
}

/**
 * Checks if the input string contains atleast one number.
 *
 * @param {string} string - input string
 *
 * @returns {boolean} - true when the string has atleast one number
 *                      false when there are no numbers
 */

function containsNumber(string: string): boolean {
  return /\d/.test(string);
}

/**
 * Checks if the input email exists.
 *
 * @param {string} email - input email
 *
 * @returns {boolean} - true when the email is unique
 *                      false when the email alredy exists
 */

function doesEmailExist(email: string): boolean {
  const data = getData();

  return data.users.some((user) => {
    return user.email === email;
  });
}

/**
 * Checks if the given string is a valid name of proper length
 *
 * @param {string} name - input string
 *
 * @returns {boolean} - true if the name is valid
 *                      false if the name is invalid
 */
function checkName(name: string): boolean {
  if (name.length < 2 || name.length > 20) {
    return false;
  } else if (!isName(name)) {
    return false;
  }
  return true;
}

/**
 * Checks if the given string is a valid email
 *
 * @param {string} email - input string
 *
 * @returns {boolean} - true if the email is valid
 *                      false if the email is invalid
 */
function checkEmail(email: string): boolean {
  if (!isEmail(email)) {
    return false;
  } else if (doesEmailExist(email)) {
    return false;
  }
  return true;
}

/**
 * Checks if the given string is a valid password
 *
 * @param {string} password - input string
 *
 * @returns {boolean} - true if the password is valid
 *                      false if the password is invalid
 */
function checkPassword(password: string): boolean {
  if (password.length < 8) {
    return false;
  } else if (!containsLetter(password)) {
    return false;
  } else if (!containsNumber(password)) {
    return false;
  }
  return true;
}

/**
 * check if any answer strings are duplicates of one another (within the same question)
 *
 * @param answerOptions - The array that contains the basic information about the answers
 *
 * @returns {boolean} - true if there are duplicates, false if there aren't any.
 */
function checkDuplicates(answerOptions: AnswerBody[]): boolean {
  const answers: string[] = answerOptions.map(option => option.answer);
  return new Set(answers).size !== answers.length;
}

/**
 * Create the answers for the question
 *
 * @param {AnswerBody[]} answerOptions - The array that contains the
 * basic information about the answers
 *
 * @returns {AnswerInfo[]} - The array that contains the more detailed information about
 * the answers
 */
function addAnswers(answerOptions: AnswerBody[]): AnswerInfo[] {
  const answers: AnswerInfo[] = [];
  for (const item of answerOptions) {
    // Generate a random colour for the answer
    const colourArray: Colour[] =
    ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'pink'];

    const answerInfo = {
      answerId: answers.length,
      answer: item.answer,
      colour: colourArray[Math.floor(Math.random() * colourArray.length)],
      correct: item.correct
    };
    answers.push(answerInfo);
  }

  return answers;
}

/**
 * Check if the url ends with the correct substring
 *
 * @param {string} thumbnailUrl - An URL string for the image
 * @returns {boolean} - true or false
 */
function checkUrlEnd(thumbnailUrl: string): boolean {
  const lowerCaseUrl = thumbnailUrl.toLowerCase();

  return lowerCaseUrl.endsWith('.png') ||
  lowerCaseUrl.endsWith('.jpg') ||
  lowerCaseUrl.endsWith('.jpeg');
}

/**
 * Check if the url starts with the correct substring
 *
 * @param {string} thumbnailUrl - An URL string for the image
 * @returns {boolean} - true or false
 */
function checkUrlStart(thumbnailUrl: string): boolean {
  return thumbnailUrl.startsWith('http://') || thumbnailUrl.startsWith('https://');
}

/**
 * Creates a hashed output of the data
 *
 * @param {string} data - Data to be hashed
 * @returns {string} - Hashed data
 */
function hash(data: string): string {
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Creates a random string of the format [5 letters][3 numbers] such that there
 * are no repeating letters or numbers.
 *
 * @param None
 * @returns {string} - Generated name
 */
function randomName(): string {
  const letters = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';

  let name = '';

  for (let i = 0; i < 5; i++) {
    let letter = '';
    while (name.includes(letter) || letter === '') {
      letter = letters[Math.floor(Math.random() * letters.length)];
    }
    name += letter;
  }

  for (let i = 0; i < 3; i++) {
    let number = '';
    while (name.includes(number) || number === '') {
      number = numbers[Math.floor(Math.random() * numbers.length)];
    }
    name += number;
  }

  return name;
}

/**
 * Calculates the result of a game
 *
 * @param data - The data for the the project
 * @param gameId - The ID of the game
 *
 * @returns {undefined} - Nothing
 */
function calculateResult(data: DataStore, gameId: number): undefined {
  const game = data.quizGames.find(g => g.gameId === gameId);
  const question = game.quiz.questions[game.atQuestion - 1];
  const questionId = question.questionId;
  const questionResult = game.questionResults.find(result => result.questionId === questionId);

  // Update the questionResults
  const correctAnswers = game.scoreBoard.filter(player => player.correct === true);
  questionResult.playersCorrect = correctAnswers.map(player => player.playerName).sort();

  // Calculate percentage
  questionResult.percentCorrect = Math.round(correctAnswers.length /
    game.scoreBoard.length * 100);

  // Calculate average time
  const hasAnswer = game.scoreBoard.filter(player => player.attempted === true);
  if (hasAnswer.length !== 0) {
    questionResult.averageAnswerTime = Math.round(
      hasAnswer.reduce((sum, item) => sum + item.answerTime, 0) / hasAnswer.length
    );
  }

  // Update the scoreBoard
  const sortByAnswerTime = correctAnswers.sort((a, b) => a.answerTime - b.answerTime);
  for (let i = 0; i < sortByAnswerTime.length; i++) {
    sortByAnswerTime[i].score += Math.round(question.points * (1 / (i + 1)));
  }

  setData(data);
}

/**
 * Set the timers for automatic transition
 *
 * @param {DataStore} data - The data for the project
 * @param {number} time - The delayed time
 * @param {number} gameId - The ID of the game
 * @param {QuizGameState} newState - The state after the delayed time
 *
 * @returns {None} - Nothing
 */
function stateTimer(
  data: DataStore,
  time: number,
  gameId: number,
  newState: QuizGameState
) {
  const game = data.quizGames.find((g) => g.gameId === gameId);
  // Remove the existing timer before adding the next timer;
  if (gameTimers.has(gameId)) {
    clearTimeout(gameTimers.get(gameId));
    gameTimers.delete(gameId);
  }

  let timer;
  if (newState === QuizGameState.QUESTION_OPEN) {
    timer = setTimeout(() => {
      game.state = newState;
      game.questionStartTime = Math.floor(Date.now() / 1000);
      setData(data);

      stateTimer(data, game.quiz.questions[game.atQuestion - 1].timeLimit,
        gameId, QuizGameState.QUESTION_CLOSE);
    }, time * 1000);
    gameTimers.set(gameId, timer);
  } else {
    timer = setTimeout(() => {
      game.state = newState;
      game.questionStartTime = Math.floor(Date.now() / 1000);
      setData(data);
    }, time * 1000);
    gameTimers.set(gameId, timer);
  }
}

function checkAnswers(
  answers: number[],
  correctAnswers: number[]
): boolean {
  if (answers.length !== correctAnswers.length) {
    return false;
  }

  for (let i = 0; i < answers.length; i++) {
    if (answers[i] !== correctAnswers[i]) {
      return false;
    }
  }

  return true;
}

export {
  containsLetter,
  containsNumber,
  isName,
  checkName,
  checkEmail,
  checkPassword,
  checkDuplicates,
  addAnswers,
  checkUrlEnd,
  checkUrlStart,
  hash,
  randomName,
  calculateResult,
  stateTimer,
  checkAnswers,
  doesEmailExist
};
