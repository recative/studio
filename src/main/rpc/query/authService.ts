import fetch from 'node-fetch';
// import jwtDecode from 'jwt-decode';

import { localStorage } from '../../utils/localStorage';

interface IToken {
  id: number;
  name: string;
  label: string;
  iat: number;
  expiresIn: number;
}

const HOST_KEY = '@recative/auth-service/host';
const TOKEN_KEY = '@recative/auth-service/host';

export const localLogout = async () => {
  localStorage.removeItem('@recative/auth-service/name');
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem('@recative/auth-service/label');
  localStorage.removeItem('@recative/auth-service/expires');
};

export const getUserData = () => {
  const expires = Number.parseInt(
    localStorage.getItem('@recative/auth-service/expires') || '-1',
    10
  );

  if (Date.now() > expires) {
    localLogout();
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const id = Number.parseInt(
    localStorage.getItem('@recative/auth-service/id') || '-1',
    10
  );
  const name = localStorage.getItem('@recative/auth-service/name') || '';
  const label = localStorage.getItem('@recative/auth-service/label') || '';
  const host = localStorage.getItem(HOST_KEY) || '';

  if (!token) return null;

  return {
    token,
    id,
    name,
    label,
    host,
  };
};

export const getTokenHeader = () => {
  return {
    Authorization: localStorage.getItem(TOKEN_KEY),
  };
};

const getRequestUrl = (pathName: string) => {
  const server = localStorage.getItem(HOST_KEY);

  if (!server) {
    throw new TypeError('Service not available');
  }
  const requestUrl = new URL(server);
  requestUrl.pathname = pathName;

  return requestUrl.toString();
};

class RequestError extends Error {
  name = 'RequestError';

  constructor(
    public path: string,
    public body?: Record<string, unknown>,
    message = `Unable to process the request.`,
    public internalErrorName?: string,
    public unknownObject?: unknown
  ) {
    super(message);
  }
}

const requestFactory =
  (method: string) =>
  async <T>(path: string, body?: Record<string, unknown>) => {
    try {
      const response = await fetch(getRequestUrl(path), {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Request failed');
      }

      return response.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new RequestError(path, body, error.message, error.name);
      }
      throw new RequestError(
        path,
        body,
        `Unable to process the request.`,
        undefined,
        error
      );
    }
  };

const get = requestFactory('GET');
// const post = requestFactory('POST');

export const userLogin = async (token: string, actServer: string) => {
  localStorage.setItem(HOST_KEY, token);

  const response = await get('/admin/tokens');
  localStorage.setItem(HOST_KEY, actServer);
  localStorage.setItem(TOKEN_KEY, token);
  // localStorage.setItem('@recative/auth-service/name', name);
  // localStorage.setItem('@recative/auth-service/label', label);
  // localStorage.setItem(
  //   '@recative/auth-service/expires',
  //   data.expiresIn.toString()
  // );

  return { token, response };
};

export const userLogout = async () => {
  try {
    const url = getRequestUrl('/admin/user/token');
    const request = await fetch(url, {
      method: 'DELETE',
    });

    if (!request.ok) {
      throw new Error('Request failed');
    }

    localLogout();
    return { code: 'SUCCESS' };
  } catch (error) {
    return { code: 'ERROR' };
  }
};
