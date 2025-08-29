import { gameTimers, getData, setData } from './dataStore';
import { AccessDeniedError, InputError, SessionError } from './handler';
import { calculateResult, stateTimer } from './helper';
import {
  Action,
  EmptyObject,
  FinalResults,
  PlayersRank,
  QuizGameInfo,
  QuizGameState
} from './interface';

/**
 * This copies the quiz, so that any edits whilst a game is running does not affect active game
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID of the quiz
 * @param {number} autoStartNum - The number of players to start the game automatically
 * @returns {{ gameId: number }} - The ID for the game or an
 * error message
 */
function adminQuizGameStart(
  quizId : number,
  session : string,
  autoStartNum: number
) : { gameId: number } {
  // Session is empty or invalid (does not refer to valid logged in user session)
  if (!session) {
    throw new SessionError(`Session is empty or invalid 
      (does not refer to valid logged in user session)`);
  }
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Session does not refer to a valid logged in user session');
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
  // autoStartNum is a number greater than 50
  if (autoStartNum > 50) {
    throw new InputError('autoStartNum is a number greater than 50');
  }
  // 10 games that are not in END state currently exist for this quiz
  const quizGames = data.quizGames.filter(
    (game) => game.quiz.quizId === quizId &&
    game.state !== QuizGameState.END
  );
  if (quizGames.length >= 10) {
    throw new InputError('10 games that are not in END state currently exist for this quiz');
  }
  // The quiz does not have any questions in it
  if (quiz.questions.length === 0) {
    throw new InputError('The quiz does not have any questions in it');
  }
  const gameId = data.quizGames.length;
  // Set the result to default values
  const defaultArr: string[] = [];
  const questionResults = quiz.questions.map(question => (
    {
      questionId: question.questionId,
      playersCorrect: defaultArr,
      averageAnswerTime: 0,
      percentCorrect: 0
    }
  ));

  data.quizGames.push({
    quiz: structuredClone(quiz),
    gameId: gameId,
    state: QuizGameState.LOBBY,
    scoreBoard: [],
    autoStartNum,
    active: true,
    atQuestion: 0,
    questionStartTime: null,
    questionResults: questionResults
  });
  setData(data);
  return { gameId };
}

/**
 * This lists all active and inactive games for a certain quiz
 *
 * @param {string} session - The session token for the logged in user
 * @param {number} quizId - The ID of the quiz
 * @returns {{ activeGames: [], inactiveGames: [] }} - The active and inactive games
 */
function adminQuizViewGames(quizId: number, session: string) {
  // Session is empty or invalid (does not refer to valid logged in user session)
  const data = getData();
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Session does not refer to a valid logged in user session');
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
  const games : {activeGames: number[], inactiveGames: number[]} = {
    activeGames: [],
    inactiveGames: [],
  };
  for (const quizGame of data.quizGames) {
    if (quizGame.quiz.quizId === quizId) {
      if (quizGame.state !== QuizGameState.END) {
        games.activeGames.push(quizGame.gameId);
      } else {
        games.inactiveGames.push(quizGame.gameId);
      }
    }
  }

  return games;
}

/**
 * Get the information about a particular game
 *
 * @param {string} session - The session token for the user
 * @param {number} quizId - The Id of the quiz
 * @param {number} gameId - The Id of the game
 * @returns {QuizGameInfo} - The information about the game
 */
function adminGameInfo(
  session: string,
  quizId: number,
  gameId: number
): QuizGameInfo {
  const data = getData();
  // Cheack valid user
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Invalid Session');
  }

  // Check valid quiz
  const quiz = data.quizzes.find(
    (quiz) => quiz.quizId === quizId && quiz.userId === user.userId
  );
  if (!quiz) {
    throw new AccessDeniedError('Invalid quizId');
  }

  // Check if the gameId is valid
  const game = data.quizGames.find(
    game => game.gameId === gameId &&
    game.quiz.quizId === quizId &&
    game.quiz.userId === user.userId
  );
  if (!game) {
    throw new InputError('Invalid gameId');
  }

  // Ensure all the data are extracted from the game quiz not the original quiz
  return {
    state: game.state,
    atQuestion: game.atQuestion,
    players: game.scoreBoard.map(player => player.playerName),
    metadata: {
      quizId: game.quiz.quizId,
      name: game.quiz.name,
      timeCreated: game.quiz.timeCreated,
      timeLastEdited: game.quiz.timeLastEdited,
      description: game.quiz.description,
      numQuestions: game.quiz.numQuestions,
      questions: game.quiz.questions,
      timeLimit: game.quiz.timeLimit,
      thumbnailUrl: game.quiz.thumbnailUrl
    }
  };
}

/**
 * Update the state of a particular quiz game by sending an action command
 *
 * @param {string} session - The session token for the user
 * @param {number} quizId - The Id of the quiz
 * @param {number} gameId - The Id of the game
 * @param {string} action - The action required to be done
 *
 * @returns {EmptyObject} - an empty object
 */
function adminGameStateUpdate(
  session: string,
  quizId: number,
  gameId: number,
  action: string
): EmptyObject {
  const data = getData();
  // Check valid session
  const user = data.sessions.find((user) => user.session === session);
  if (!user) {
    throw new SessionError('Session does not refer to a valid logged in user session');
  }

  // Check valid quizId
  const quiz = data.quizzes.find(quiz => quiz.quizId === quizId && quiz.userId === user.userId);
  if (!quiz) {
    throw new AccessDeniedError('Quiz ID does not refer to a valid quiz.');
  }

  // Check valid gameId
  const game = data.quizGames.find(game => game.gameId === gameId &&
    game.quiz.quizId === quiz.quizId &&
    game.quiz.userId === user.userId
  );
  if (!game) {
    throw new InputError('Invalid gameId');
  }

  // Check if the action is one of the enums
  if (
    action !== Action.NEXT_QUESTION &&
    action !== Action.SKIP_COUNTDOWN &&
    action !== Action.GO_TO_ANSWER &&
    action !== Action.GO_TO_FINAL_RESULTS &&
    action !== Action.END
  ) {
    throw new InputError('Invalid action string');
  }

  // There are five different types of actions, each action has different conditions
  if (action === Action.NEXT_QUESTION) {
    if (
      game.state !== QuizGameState.LOBBY &&
      game.state !== QuizGameState.ANSWER_SHOW &&
      game.state !== QuizGameState.QUESTION_CLOSE
    ) {
      throw new InputError('Action cannot be applied in the current state');
    } else {
      // Cleanup the result for the previous question
      if (game.atQuestion !== 0 && game.state !== QuizGameState.ANSWER_SHOW) {
        calculateResult(data, gameId);
      }

      // Reset answerTime and correct
      for (const item of game.scoreBoard) {
        item.answerTime = 0;
        item.correct = false;
        item.attempted = false;
      }

      // Update the game state and question position
      game.state = QuizGameState.QUESTION_COUNTDOWN;
      game.atQuestion++;
      // Set a timer for the countdown
      stateTimer(data, 3, gameId, QuizGameState.QUESTION_OPEN);
    }
  } else if (action === Action.SKIP_COUNTDOWN) {
    if (game.state !== QuizGameState.QUESTION_COUNTDOWN) {
      throw new InputError('Action cannot be applied in the current state');
    } else {
      // Update game state
      game.state = QuizGameState.QUESTION_OPEN;
      game.questionStartTime = Math.floor(Date.now() / 1000);
      // Set a new timer for the game
      stateTimer(data, game.quiz.questions[game.atQuestion - 1].timeLimit,
        gameId, QuizGameState.QUESTION_CLOSE);
    }
  } else if (action === Action.GO_TO_ANSWER) {
    if (
      game.state !== QuizGameState.QUESTION_OPEN &&
      game.state !== QuizGameState.QUESTION_CLOSE
    ) {
      throw new InputError('Action cannot be applied in the current state');
    } else {
      calculateResult(data, gameId);
      // Needs to delete the timer
      if (game.state === QuizGameState.QUESTION_OPEN) {
        clearTimeout(gameTimers.get(gameId));
        gameTimers.delete(gameId);
      }
      game.state = QuizGameState.ANSWER_SHOW;
    }
  } else if (action === Action.GO_TO_FINAL_RESULTS) {
    if (
      game.state !== QuizGameState.QUESTION_CLOSE &&
      game.state !== QuizGameState.ANSWER_SHOW
    ) {
      throw new InputError('Action cannot be applied in the current state');
    } else {
      if (game.state !== QuizGameState.ANSWER_SHOW) {
        calculateResult(data, gameId);
      }
      game.state = QuizGameState.FINAL_RESULTS;
      // Set to 0
      game.atQuestion = 0;
    }
  } else {
    if (game.state === QuizGameState.END) {
      throw new InputError('Action cannot be applied in the current state');
    } else {
      // Required to delete the timer
      if (
        game.state === QuizGameState.QUESTION_COUNTDOWN ||
        game.state === QuizGameState.QUESTION_OPEN
      ) {
        clearTimeout(gameTimers.get(gameId));
        gameTimers.delete(gameId);
      }
      game.state = QuizGameState.END;
      // Let the game be inactive
      game.active = false;
      game.atQuestion = 0;
    }
  }

  setData(data);
  return {};
}

/**
 * Provide the final results of a game
 *
 * @param {string} session - The session token of the admin
 * @param {number} quizId - The ID of the quiz
 * @param {number} gameId - The ID of the game
 *
 * @returns {FinalResults} - The final results of a game
 */
function adminGameResult(
  session: string,
  quizId: number,
  gameId: number
): FinalResults {
  const data = getData();

  const user = data.sessions.find(s => s.session === session);
  if (!user) throw new SessionError('Session is empty or invalid');

  const quiz = data.quizzes.find(q => q.quizId === quizId && q.userId === user.userId);
  if (!quiz) {
    throw new AccessDeniedError('Valid session but quiz not owned or does not exist');
  }

  const game = data.quizGames.find(
    g => g.gameId === gameId && g.quiz.quizId === quizId && g.quiz.userId === user.userId
  );
  if (!game) throw new InputError('Game Id does not refer to a valid game within this quiz');

  if (game.state !== QuizGameState.FINAL_RESULTS) {
    throw new InputError('Game is not in FINAL_RESULTS state');
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

export {
  adminQuizGameStart,
  adminQuizViewGames,
  adminGameInfo,
  adminGameStateUpdate,
  adminGameResult
};
