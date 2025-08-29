import { getData, setData } from './dataStore';
import { PlayerError, GameError, IndexError, InputError } from './handler';
import { checkAnswers, randomName, stateTimer } from './helper';
import {
  Player,
  QuizGameState,
  PlayerStatus,
  QuestionInfo,
  EmptyObject,
  PlayersRank,
  FinalResults,
  QuestionResult
} from './interface';

/**
 * Allows a guest user to join an active game as a player
 *
 * @param {number} gameId - Game Id of the active game that the player is
 *                          trying to join
 * @param {string} name - Name of the player
 *
 * @returns {playerId: number} - Object containing player Id
 */
function adminPlayerJoin(gameId: number, name: string): { playerId: number } {
  const data = getData();
  const regex = /^[a-zA-Z0-9\s]+$/;

  const playerName = name === '' ? randomName() : name;

  if (!regex.test(playerName)) throw new PlayerError('Name is invalid');
  if (data.players.some((p) => p.name === playerName && p.gameId === gameId)) {
    throw new PlayerError('Someone already has the name');
  }

  const game = data.quizGames.find((g) => g.gameId === gameId);

  if (!game) throw new GameError('Game does not exist');
  if (game.state !== QuizGameState.LOBBY) {
    throw new GameError('Game is not in LOBBY');
  }

  let id = 0;
  while (id === 0 || data.players.some(player => player.playerId === id)) {
    id = Date.now() * 1000 + Math.floor(Math.random() * 1000);
  }

  const player: Player = {
    playerId: id,
    gameId: gameId,
    name: playerName,
    score: 0,
  };

  // Update the game structure
  game.scoreBoard.push({
    playerName: playerName,
    score: 0,
    answerTime: 0,
    correct: false,
    attempted: false
  });

  // Set autostart
  if (game.scoreBoard.length === game.autoStartNum && game.autoStartNum !== 0) {
    game.state = QuizGameState.QUESTION_COUNTDOWN;
    game.atQuestion++;
    // Set a countdown timer
    stateTimer(data, 3, gameId, QuizGameState.QUESTION_OPEN);
  }

  data.players.push(player);
  setData(data);
  return { playerId: id };
}

/**
 * Function to get the status of the player in the current game
 *
 * @param {number} gameId - Player Id of the player
 *
 * @returns {PlayerStatus} - Object containing player status info
 */
function adminPlayerStatus(playerId: number): PlayerStatus {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);

  if (!player) throw new PlayerError('Player does not exist');

  const game = data.quizGames.find((g) => g.gameId === player.gameId);

  const playerStatus: PlayerStatus = {
    state: game.state,
    numQuestions: game.quiz.numQuestions,
    atQuestion: game.atQuestion
  };

  return playerStatus;
}

/**
 * Function to get the info of the question the player is currently at
 *
 * @param {number} gameId - Player Id of the player
 * @param {number} questionPosition - Position of the question in the quiz
 *
 * @returns {QuestionInfo} - Object containing question info
 */
function adminPlayerQuestionInfo(
  playerId: number,
  questionPosition: number
): QuestionInfo {
  const data = getData();
  const player = data.players.find((p) => p.playerId === playerId);

  if (!player) {
    throw new PlayerError('Player does not exist');
  }

  const game = data.quizGames.find((g) => g.gameId === player.gameId);

  if (questionPosition > game.quiz.numQuestions || questionPosition <= 0) {
    throw new IndexError('Question position is out of bounds');
  }

  if (game.state === QuizGameState.LOBBY) {
    throw new GameError('Game has not started yet');
  } else if (game.state === QuizGameState.QUESTION_COUNTDOWN) {
    throw new GameError('Game is on countdown');
  } else if (game.state === QuizGameState.FINAL_RESULTS) {
    throw new GameError('Cannot access question');
  } else if (game.state === QuizGameState.END) {
    throw new GameError('Game has ended');
  }

  if (game.atQuestion !== questionPosition) {
    throw new IndexError(
      'Accessing a different question to that of the current game'
    );
  }

  const question = game.quiz.questions[questionPosition - 1];
  const answers = question.answerOptions.map(answer => ({
    answerId: answer.answerId,
    answer: answer.answer,
    colour: answer.colour
  }));

  const questionInfo = {
    questionId: question.questionId,
    question: question.question,
    timeLimit: question.timeLimit,
    thumbnailUrl: question.thumbnailUrl,
    points: question.points,
    answerOptions: answers
  };

  return questionInfo;
}

/**
 * Player submits answers(s) for a question
 *
 * @param {number} playerId - The ID of the player
 * @param {number} questionPosition - The position of the question
 * @param {number} answerIds - The Ids of the answers
 * @returns {EmptyObject} - an Empty object
 */
function playerSubmission(
  playerId: number,
  questionPosition: number,
  answerIds: number[]
): EmptyObject {
  const data = getData();

  const player = data.players.find((p) => p.playerId === playerId);
  if (!player) throw new PlayerError('Player does not exist');

  const game = data.quizGames.find(g => g.gameId === player.gameId);
  if (questionPosition <= 0 || questionPosition > game.quiz.numQuestions) {
    throw new InputError('Invalid question position');
  }

  if (game.state !== QuizGameState.QUESTION_OPEN) {
    throw new GameError('Invalid game state');
  }

  if (game.atQuestion !== questionPosition) {
    throw new InputError('Game is not on this quesiton');
  }

  const question = game.quiz.questions[questionPosition - 1];
  const answers = question.answerOptions.map(answer => answer.answerId);
  for (const answerId of answerIds) {
    if (!answers.includes(answerId)) {
      throw new InputError('Answer IDs are not valid for this particular question');
    }
  }

  if (new Set(answerIds).size !== answerIds.length) {
    throw new InputError('Duplicate answerIds');
  }

  if (answerIds.length < 1) {
    throw new InputError('No answers provided');
  }

  // Everything correct
  const timeStamp = Math.floor(Date.now() / 1000);
  const correctAnswers = question.answerOptions.filter(a => a.correct === true);
  const correctAnswerIds = correctAnswers.map(answer => answer.answerId);

  const playerScore = game.scoreBoard.find(item => item.playerName === player.name);
  playerScore.answerTime = timeStamp - game.questionStartTime;
  playerScore.correct = checkAnswers(answerIds, correctAnswerIds);
  playerScore.attempted = true;

  return {};
}

/**
 * Get the results of a game
 *
 * @param playerId - The Id of the player
 * @returns {FinalResults} - The result of a game
 */
function adminPlayerGameResult(playerId: number): FinalResults {
  const data = getData();

  const player = data.players.find(p => p.playerId === playerId);
  if (!player) {
    throw new InputError('Invalid playerId');
  }

  const game = data.quizGames.find(g => g.gameId === player.gameId);

  if (game.state !== QuizGameState.FINAL_RESULTS) {
    throw new InputError('Game not in FINAL_RESULTS state');
  }

  const usersRankedByScore: PlayersRank[] = game.scoreBoard.map((g) => ({
    playerName: g.playerName,
    score: g.score
  }));

  return {
    usersRankedByScore: usersRankedByScore.sort((a, b) => b.score - a.score),
    questionResults: game.questionResults,
  };
}

/**
 *
 * @param playerId - ID of the player
 * @param questionPosition - unique index of each question
 * @returns QuestionResult
 * @throws (PlayerError, InputError, GameError), basically an error object
 */
function adminQuestionResults(
  playerId: number,
  questionPosition: number
): QuestionResult {
  const data = getData();
  const player = data.players.find(p => p.playerId === playerId);
  if (!player) {
    throw new PlayerError('Player does not exist');
  }

  const game = data.quizGames.find(g => g.gameId === player.gameId);

  // check if question position is valid or no. ? remove if adminQuestionResults already does this.
  if (questionPosition <= 0 || questionPosition > game.quiz.numQuestions) {
    throw new InputError('Invalid question position');
  }

  // questionid and game match
  if (game.atQuestion !== questionPosition) {
    throw new InputError('Game is not on this question');
  }

  // checking the state of the game
  if (game.state !== QuizGameState.ANSWER_SHOW) {
    throw new GameError('Game is not in ANSWER_SHOW state');
  }

  // get results!
  const result = game.questionResults.find(
    qr => qr.questionId === game.quiz.questions[questionPosition - 1].questionId
  );

  return result;
}

export {
  adminPlayerJoin,
  adminPlayerStatus,
  adminPlayerQuestionInfo,
  playerSubmission,
  adminPlayerGameResult,
  adminQuestionResults
};
