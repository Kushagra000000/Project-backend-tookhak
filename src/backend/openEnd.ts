import {
  PlayerError,
  GameError,
  InputError,
  AccessDeniedError,
  SessionError,
} from './handler';//
import { isEmail } from 'validator';
import { EmptyObject, QuizGameState } from './interface';
import { getData, setData } from './dataStore';
import request from 'sync-request-curl';
import { doesEmailExist } from './helper';

/**
 * Provide an explanation on the answers
 *
 * @param {number} playerId - The ID of the player
 * @param {number} questionPosition - The position of the question
 *
 * @returns {explanation: string} - The explanation on why the answers are correct
 */
export function playerAnswerExplanation(
  playerId: number,
  questionPosition: number
): { explanation: string } {
  const data = getData();

  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) throw new PlayerError('Player does not exist');

  const game = data.quizGames.find((g) => g.gameId === player.gameId);
  if (questionPosition <= 0 || questionPosition > game.quiz.numQuestions) {
    throw new InputError('Invalid question position');
  }

  if (game.state !== QuizGameState.ANSWER_SHOW) {
    throw new GameError('Invalid game state');
  }

  if (game.atQuestion !== questionPosition) {
    throw new InputError('Game is not on this quesiton');
  }

  // Get the question and the correct answers
  const questionObj = game.quiz.questions[questionPosition - 1];
  const question = questionObj.question;
  const correctAnswers = questionObj.answerOptions.filter(
    (answer) => answer.correct === true
  );
  const answers = correctAnswers.map((item) => item.answer);

  let prompt: string =
    `Given the question: ${question}` +
    'Please explain why the following answers(s) are correct with details: ';

  for (const answer of answers) {
    prompt += `${answer} `;
  }

  const token = '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';

  // Send a request the LLM
  const res = request(
    'POST',
    'https://router.huggingface.co/hf-inference/models/google/flan-t5-large',
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      json: { inputs: prompt },
    }
  );

  // Let the response to have good format
  const body = JSON.parse(res.body.toString());
  const text = body[0].generated_text.trim();

  return { explanation: text };
}

/**
 * Allows a user to add contributors to a quiz.
 *
 * @params {string} session - session for the owner of the quiz
 * @params {number} quizId - ID of the quiz
 * @params {string} email - email for the person who wants to collaborate
 *
 * @returns {EmptyObject}
 */
export function addQuizContributors(
  session: string,
  quizId: number,
  email: string
): EmptyObject {
  const data = getData();

  const sessionUser = data.sessions.find((s) => s.session === session);
  if (!sessionUser) {
    throw new SessionError('Invalid session');
  }

  const quiz = data.quizzes.find((q) => q.quizId === quizId);
  if (!quiz) {
    throw new AccessDeniedError('Quiz does not exist');
  }

  if (quiz.userId !== sessionUser.userId) {
    throw new AccessDeniedError('User does not own this quiz');
  }

  if (!isEmail(email)) {
    throw new InputError('Email is invalid');
  }

  if (!doesEmailExist(email)) {
    throw new InputError('Target user does not exist');
  }

  const targetUser = data.users.find((u) => u.email === email);
  if (sessionUser.userId === targetUser.userId) {
    throw new InputError('userEmail is the current logged in user');
  }

  quiz.contributors.push(targetUser.userId);
  quiz.timeLastEdited = Math.floor(Date.now() / 1000);
  setData(data);

  return {};
}
