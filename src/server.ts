import express, { json, Request, Response } from 'express';
import { echo } from './backend/newecho';
import morgan from 'morgan';
import config from './config.json';
import cors from 'cors';
import YAML from 'yaml';
import sui from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import process from 'process';
import { clear } from './backend/other';
import {
  adminQuizNameUpdate,
  adminQuizDescriptionUpdate,
  adminQuizCreate,
  adminQuizList,
  adminQuestionCreate,
  adminQuizQuestionUpdate,
  adminQuizInfo,
  adminQuizRemove,
  adminQuestionDelete,
  adminQuizTransfer,
  adminQuizMove,
  getQuestionSuggestion,
  adminQuizThumbnail,
  adminQuizRemoveV2,
  adminQuizInfoV2
} from './backend/quiz';
import {
  adminAuthLogin,
  adminAuthLogout,
  adminAuthRegister,
  adminUserDetails,
  adminUserDetailsUpdate,
  adminUserPasswordUpdate
} from './backend/auth';
import { loadData } from './backend/dataStore';
import {
  adminGameInfo,
  adminQuizGameStart,
  adminQuizViewGames,
  adminGameStateUpdate,
  adminGameResult
} from './backend/game';
import {
  adminPlayerJoin,
  adminPlayerStatus,
  adminPlayerQuestionInfo,
  playerSubmission,
  adminPlayerGameResult,
  adminQuestionResults
} from './backend/player';
import { handleErrors } from './backend/handler';
import { playerAnswerExplanation, addQuizContributors } from './backend/openEnd';

// Set up web app
const app = express();
// Use middleware that allows us to access the JSON body of requests
app.use(json());
// Use middleware that allows for access from other domains
app.use(cors());
// for logging errors (print to terminal)
app.use(morgan('dev'));
// for producing the docs that define the API
const file = fs.readFileSync(path.join(process.cwd(), 'swagger.yaml'), 'utf8');
app.get('/', (req: Request, res: Response) => res.redirect('/docs'));
app.use('/docs', sui.serve, sui.setup(YAML.parse(file), {
  swaggerOptions: { docExpansion: config.expandDocs ? 'full' : 'list' }
}));

const PORT: number = parseInt(process.env.PORT || config.port);
const HOST: string = process.env.IP || '127.0.0.1';

// ====================================================================
//  ================= WORK IS DONE BELOW THIS LINE ===================
// ====================================================================

// ====================================================================

// Example get request
app.get('/echo', (req: Request, res: Response) => {
  const result = echo(req.query.echo as string);
  if ('error' in result) {
    res.status(400);
  }

  return res.json(result);
});

/**
 * HTTP layer for adminAuthRegister()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.post('/v1/admin/auth/register', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const { email, password, nameFirst, nameLast } = req.body;
    const result = adminAuthRegister(email, password, nameFirst, nameLast);
    return res.json(result);
  });
});

// adminAuthLogin
app.post('/v1/admin/auth/login', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const { email, password } = req.body;
    const result = adminAuthLogin(email, password);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminAuthLogout()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.post('/v1/admin/auth/logout', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const result = adminAuthLogout(session);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminUserDetails()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.get('/v1/admin/user/details', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const result = adminUserDetails(session);
    return res.json(result);
  });
});

// adminUserDetailsUpdate
app.put('/v1/admin/user/details', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const { email, nameFirst, nameLast } = req.body;
    return res.json(adminUserDetailsUpdate(session, email, nameFirst, nameLast));
  });
});

// adminUserPasswordUpdate
app.put('/v1/admin/user/password', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const { oldPassword, newPassword } = req.body;
    return res.json(adminUserPasswordUpdate(session, oldPassword, newPassword));
  });
});

// adminQuizList
app.get('/v1/admin/quiz/list', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const result = adminQuizList(session);
    return res.json(result);
  });
});

// adminQuizCreate
app.post('/v1/admin/quiz', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const { name, description } = req.body;
    const result = adminQuizCreate(session, name, description);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminQuizRemove()
 *
 * @param {req} Request - request object for express
 * @param {res} Response - REsponse object for express
 *
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.delete('/v1/admin/quiz/:quizId', (req, res) =>
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = Number(req.params.quizId);
    const result = adminQuizRemove(session, quizId);
    return res.json(result);
  })
);

/**
 * HTTP layer for adminQuizRemoveV2()
 *
 * @param {req} Request - request object for express
 * @param {res} Response - REsponse object for express
 *
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.delete('/v2/admin/quiz/:quizid', (req, res) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid, 10);
    return res.json(adminQuizRemoveV2(session, quizId));
  });
});

/**
 * HTTP layer for adminQuizInfo()
 *
 * @param {req} Request - request object for express
 * @param {res} Response - REsponse object for express
 *
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.get('/v1/admin/quiz/:quizId', (req, res) =>
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = Number(req.params.quizId);
    const info = adminQuizInfo(session, quizId);
    return res.json(info);
  })
);

/**
 * HTTP layer for adminQuizInfoV2()
 *
 * @param {req} Request - request object for express
 * @param {res} Response - REsponse object for express
 *
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.get('/v2/admin/quiz/:quizid', (req, res) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid, 10);
    return res.json(adminQuizInfoV2(session, quizId));
  });
});

/**
 * HTTP layer for adminQuestionResults()
 *
 * @param {req} Request - request object for express
 * @param {res} Response - REsponse object for express
 *
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.get(
  '/v1/player/:playerId/question/:questionPosition/results',
  (req, res) =>
    handleErrors(res, () => {
      const playerId = parseInt(req.params.playerId as string, 10);
      const questionPosition = parseInt(req.params.questionPosition as string, 10);
      return res.json(adminQuestionResults(playerId, questionPosition));
    })
);

/**
 * HTTP layer for adminQuizNameUpdate()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.put('/v1/admin/quiz/:quizid/name', (req: Request, res: Response) => {
  handleErrors(res, () => {
    res.json(adminQuizNameUpdate(
      req.header('session'),
      parseInt(req.params.quizid as string),
      req.body.name
    ));
  });
});

/**
 * HTTP layer for addQuizContributor()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.post('/v1/admin/quiz/:quizid/contributor', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const { email } = req.body;
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const result = addQuizContributors(session, quizId, email);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminQuizDescriptionUpdate()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.put('/v1/admin/quiz/:quizid/description', (req: Request, res: Response) => {
  handleErrors(res, () => {
    res.json(adminQuizDescriptionUpdate(
      req.header('session'),
      parseInt(req.params.quizid as string),
      req.body.description
    ));
  });
});

// adminQuizTransfer
app.post('/v1/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const { userEmail } = req.body;
    return res.json(adminQuizTransfer(session, quizId, userEmail));
  });
});

// adminQuestionCreate
app.post('/v1/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const { questionBody } = req.body;
    return res.json(adminQuestionCreate(session, quizId, questionBody));
  });
});

// getQuestionSuggestion
app.get('/v1/admin/quiz/:quizId/question/suggestion', (req: Request, res: Response) => {
  const session = req.header('session') as string;
  const quizId = Number(req.params.quizId);
  handleErrors(res, () => {
    return res.json(getQuestionSuggestion(session, quizId));
  });
});

/**
 * HTTP layer for adminQuizQuestionUpdate()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.put('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  handleErrors(res, () => {
    adminQuizQuestionUpdate(
      parseInt(req.params.quizid),
      parseInt(req.params.questionid),
      req.header('session'),
      req.body.questionBody
    );
    res.json({});
  });
});

/**
 * HTTP layer for adminQuizQuestionUpdate() (v2)
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.put('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  handleErrors(res, () => {
    adminQuizQuestionUpdate(
      parseInt(req.params.quizid),
      parseInt(req.params.questionid),
      req.header('session'),
      req.body.questionBody
    );
    res.json({});
  });
});

/**
 * HTTP layer for adminQuizViewGames()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express -
 * status of either 200, 400, 401 or 403 depending on success with json body changing accordingly
 */
app.get('/v1/admin/quiz/:quizid/games', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    return res.json(adminQuizViewGames(quizId, session));
  });
});

// adminQuestionDelete
app.delete('/v1/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    return res.json(adminQuestionDelete(session, quizId, questionId));
  });
});

/**
 * HTTP layer for adminQuizMove()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.put('/v1/admin/quiz/:quizid/question/:questionid/move', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    const { newPosition } = req.body;
    const result = adminQuizMove(session, quizId, questionId, newPosition);
    return res.json(result);
  });
});

// adminQuizGameStart
app.post('/v1/admin/quiz/:quizid/game/start', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid);
  const autoStartNum = req.body.autoStartNum;

  handleErrors(res, () => {
    const result = adminQuizGameStart(quizId, session, autoStartNum);
    res.json(result);
  });
});

// clear
app.delete('/v1/clear', (req: Request, res: Response) => {
  clear();
  return res.json({});
});

// adminQuestionCreate (v2)
app.post('/v2/admin/quiz/:quizid/question', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const { questionBody } = req.body;
    return res.json(adminQuestionCreate(session, quizId, questionBody));
  });
});

app.put('/v1/admin/quiz/:quizid/thumbnail', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const { thumbnailUrl } = req.body;
    const result = adminQuizThumbnail(session, quizId, thumbnailUrl);
    return res.json(result);
  });
});

// adminQuestionDelete (v2)
app.delete('/v2/admin/quiz/:quizid/question/:questionid', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid as string);
    const questionId = parseInt(req.params.questionid as string);
    return res.json(adminQuestionDelete(session, quizId, questionId));
  });
});

// adminGameInfo
app.get('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid as string);
  const gameId = parseInt(req.params.gameid as string);

  handleErrors(res, () => {
    return res.json(adminGameInfo(session, quizId, gameId));
  });
});

// adminQuizTransfer (v2)
app.post('/v2/admin/quiz/:quizid/transfer', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const { userEmail } = req.body;

    const result = adminQuizTransfer(session, quizId, userEmail);

    return res.json(result); // or just `res.json({})`
  });
});

// adminGameStateUpdate
app.put('/v1/admin/quiz/:quizid/game/:gameid', (req: Request, res: Response) => {
  const session = req.header('session');
  const quizId = parseInt(req.params.quizid as string);
  const gameId = parseInt(req.params.gameid as string);
  const { action } = req.body;
  handleErrors(res, () => {
    return res.json(adminGameStateUpdate(session, quizId, gameId, action));
  });
});

// adminGameResult
app.get('/v1/admin/quiz/:quizid/game/:gameid/results', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const session = req.header('session');
    const quizId = parseInt(req.params.quizid);
    const gameId = parseInt(req.params.gameid);

    const result = adminGameResult(session, quizId, gameId);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminPlayerJoin()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.post('/v1/player/join', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const { gameId, playerName } = req.body;
    const result = adminPlayerJoin(gameId, playerName);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminPlayerStatus()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.get('/v1/player/:playerid', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const playerId = parseInt(req.params.playerid as string);
    const result = adminPlayerStatus(playerId);
    return res.json(result);
  });
});

/**
 * HTTP layer for adminPlayerQuestionInfo()
 *
 * @param {req} Request - Request object for express
 * @param {res} Response - Response object for express
 * @returns {{ res }} - The required response object for express
 */
app.get('/v1/player/:playerid/question/:questionposition', (req: Request, res: Response) => {
  handleErrors(res, () => {
    const playerId = parseInt(req.params.playerid as string);
    const questionPosition = parseInt(req.params.questionposition as string);
    const result = adminPlayerQuestionInfo(playerId, questionPosition);
    return res.json(result);
  });
});

app.put('/v1/player/:playerid/question/:questionposition/answer', (req: Request, res: Response) => {
  const playerId = parseInt(req.params.playerid as string);
  const questionPosition = parseInt(req.params.questionposition as string);
  const { answerIds } = req.body;

  handleErrors(res, () => {
    return res.json(playerSubmission(playerId, questionPosition, answerIds));
  });
});

// adminPlayerGameResult
app.get(
  '/v1/player/:playerid/game/results',
  (req, res) => handleErrors(res, () => {
    const playerId = Number(req.params.playerid);
    const results = adminPlayerGameResult(playerId);
    return res.status(200).json(results);
  })
);

// playerAnswerExplanation
app.get('/v1/player/:playerid/question/:questionposition/explanation',
  (req: Request, res: Response) => {
    const playerId = parseInt(req.params.playerid as string);
    const questionPosition = parseInt(req.params.questionposition as string);
    handleErrors(res, () => {
      return res.json(playerAnswerExplanation(playerId, questionPosition));
    });
  });

// ====================================================================
//  ================= WORK IS DONE ABOVE THIS LINE ===================
// ====================================================================

app.use((req: Request, res: Response) => {
  const error = `
    Route not found - This could be because:
      0. You have defined routes below (not above) this middleware in server.ts
      1. You have not implemented the route ${req.method} ${req.path}
      2. There is a typo in either your test or server, e.g. /posts/list in one
         and, incorrectly, /post/list in the other
      3. You are using ts-node (instead of ts-node-dev) to start your server and
         have forgotten to manually restart to load the new changes
      4. You've forgotten a leading slash (/), e.g. you have posts/list instead
         of /posts/list in your server.ts or test file
  `;
  res.status(404).json({ error });
});

// start server
const server = app.listen(PORT, HOST, () => {
  // DO NOT CHANGE THIS LINE
  console.log(`⚡️ Server started on port ${PORT} at ${HOST}`);
  loadData();
});

// For coverage, handle Ctrl+C gracefully
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Shutting down server gracefully.');
    process.exit();
  });
});
