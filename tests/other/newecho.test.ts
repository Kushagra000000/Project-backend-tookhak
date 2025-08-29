// Do not delete this file
import request from 'sync-request-curl';
import config from '../../src/config.json';

const port = config.port;
const url = config.url;

describe('HTTP tests using Jest', () => {
  test('Test successful echo', () => {
    const res = request(
      'GET',
      `${url}:${port}/echo`,
      {
        qs: {
          echo: 'Hello',
        },
        // adding a timeout will help you spot when your server hangs
        timeout: 100
      }
    );
    const bodyObj = JSON.parse(res.body as string);
    expect(bodyObj.value).toEqual('Hello');
  });

  test('Test invalid echo', () => {
    const res = request(
      'GET',
      `${url}:${port}/echo`,
      {
        qs: {
          echo: 'echo',
        },
        timeout: 100
      }
    );
    expect(res.statusCode).toStrictEqual(400);
  });
});

test('Accessing a page that doesnt exist', () => {
  const res = request('POST', `${url}:${port}/wahoo`, { timeout: 5000 });
  const bodyObj = JSON.parse(res.body as string);
  bodyObj.code = res.statusCode;
  expect(bodyObj).toStrictEqual({ error: expect.any(String), code: 404 });
});
