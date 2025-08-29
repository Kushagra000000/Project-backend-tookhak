
// Import definition for Response data type
import { Response } from 'express';

// This error is thrown when there are issues during registration
export class RegisterError extends Error { }

// This error is thrown when the provided session is invalid or does not exist
export class SessionError extends Error { }

// This error is thrown when access to a resource is denied
export class AccessDeniedError extends Error { }

// This error is raised when the index for questions/players is invalid
export class IndexError extends Error { }

// This error is raised when the input is incorrect
export class InputError extends Error { }

// This error is thrown when there are any issues with gameId or status
export class GameError extends Error { }

// This error is thrown when the playerId is invalid or does not exist or when
// player name is invalid
export class PlayerError extends Error { }

export function handleErrors(res: Response, callback: () => any): Response {
  try {
    callback();
  } catch (e) {
    if (e instanceof RegisterError) {
      return res.status(400).json({ error: e.message });
    } else if (e instanceof SessionError) {
      return res.status(401).json({ error: e.message });
    } else if (e instanceof AccessDeniedError) {
      return res.status(403).json({ error: e.message });
    } else if (e instanceof IndexError) {
      return res.status(400).json({ error: e.message });
    } else if (e instanceof InputError) {
      return res.status(400).json({ error: e.message });
    } else if (e instanceof GameError) {
      return res.status(400).json({ error: e.message });
    } else if (e instanceof PlayerError) {
      return res.status(400).json({ error: e.message });
    }
  }
}
