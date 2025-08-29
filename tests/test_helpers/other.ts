// Importing request to send http requests to the server
import request from 'sync-request-curl';
import config from '../../src/config.json';

// Importing the interface for type checking
import { EmptyObject } from './interface';

const url = config.url;
const port = config.port;
const version = 'v1';

const SERVER_URL = `${url}:${port}/${version}`;
const TIMEOUT_MS = 5 * 1000;

export function clear(): EmptyObject {
  const response = request('DELETE', SERVER_URL + '/clear', { timeout: TIMEOUT_MS });
  return JSON.parse(response.body.toString());
}
