import fetch from 'node-fetch';
import { h32 } from 'xxhashjs';
import { faker } from '@faker-js/faker';

import { localStorage } from '../../utils/localStorage';

const HOST_KEY = '@recative/auth-service/host';
const TOKEN_KEY = '@recative/auth-service/token';
const LABEL_KEY = '@recative/auth-service/label';
const SESSION_ID_KEY = '@recative/auth-service/session';
const HASH_KEY = '@recative/auth-service/hash';
const EXPIRES_KEY = '@recative/auth-service/expires';

export const userLogout = async () => {
  localStorage.removeItem(LABEL_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(HASH_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
};

export const getUserData = () => {
  const expires = Number.parseInt(
    localStorage.getItem(EXPIRES_KEY) || '-1',
    10
  );

  if (Date.now() > expires) {
    userLogout();
    return null;
  }

  const token = localStorage.getItem(TOKEN_KEY);
  const label = localStorage.getItem(LABEL_KEY) || '';
  const host = localStorage.getItem(HOST_KEY) || '';

  if (!token) return null;

  return {
    token,
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
  const host = localStorage.getItem(HOST_KEY);

  if (!host) {
    throw new TypeError('Service not available');
  }
  const requestUrl = new URL(pathName, host);

  return requestUrl.toString();
};

class RequestNotOkError extends Error {
  name = 'RequestKnownError';

  constructor(
    public path: string,
    public body: Record<string, unknown> | undefined,
    public code: string,
    public response: string
  ) {
    super(
      `Request failed with code: ${code}.\n\nRequest URL:\n${path}\n\nRequest body:\n ${response}\n`
    );
  }
}

class RequestKnownError extends Error {
  name = 'RequestKnownError';

  constructor(
    public path: string,
    public body: Record<string, unknown> | undefined,
    public message: string,
    public code: string
  ) {
    super(message);
  }
}

class RequestUnknownError extends Error {
  name = 'RequestUnknownError';

  constructor(
    public path: string,
    public body: Record<string, unknown> | undefined,
    public unknownObject: unknown
  ) {
    super(`Unable to process the request.`);
  }
}

const requestFactory =
  (method: string) =>
  async <T>(pathName: string, body?: Record<string, unknown>) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const host = localStorage.getItem(HOST_KEY);

    if (!host) throw new TypeError(`Host not found`);

    const request = await fetch(getRequestUrl(pathName), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-InternalAuthorization': token || '',
      },
      body: JSON.stringify(body),
    });

    try {
      if (!request.ok) {
        throw new RequestNotOkError(
          request.url,
          body,
          request.statusText,
          await request.text()
        );
      }

      return request.json() as T;
    } catch (error) {
      if (error instanceof Error) {
        throw new RequestKnownError(
          request.url,
          body,
          error.message,
          error.name
        );
      }
      throw new RequestUnknownError(request.url, body, error);
    }
  };

const get = requestFactory('GET');
const post = requestFactory('POST');

interface ITokenResponse {
  token: string;
  admin_permission: string[];
  comment: string;
  expired_at: string;
  is_valid: boolean;
  host: string;
}

export const validToken = async (token = localStorage.getItem(TOKEN_KEY)) => {
  const response = await get<ITokenResponse>(`/admin/token/${token}`);

  if (!response.is_valid) {
    throw new TypeError(
      `The token provided is not valid. It may have expired, be malformed, or not be recognized by the system. Please check the token and try again.`
    );
  }

  return response;
};

const capitalizeFirstLetter = (string: string) => {
  return string.charAt(0).toUpperCase() + string.slice(1);
};

export const userLogin = async (token: string, actServer: string) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(HOST_KEY, actServer);

  const response = await validToken(token);

  const tokenHash = h32(token, 0x1bf52).toNumber();
  faker.seed(tokenHash);
  const adj = capitalizeFirstLetter(faker.hacker.adjective());
  const n = faker.science.chemicalElement().name;

  localStorage.setItem(LABEL_KEY, response.comment);
  localStorage.setItem(EXPIRES_KEY, response.expired_at);
  localStorage.setItem(HASH_KEY, tokenHash.toString(16));
  localStorage.setItem(SESSION_ID_KEY, `${adj} ${n}`);

  return {
    ...response,
    host: actServer,
  };
};

export const getLastLoginCredential = () => {
  return {
    token: localStorage.getItem(TOKEN_KEY),
    host: localStorage.getItem(HOST_KEY),
    tokenHash: localStorage.getItem(HASH_KEY),
    sessionId: localStorage.getItem(SESSION_ID_KEY),
    expiresAt: localStorage.getItem(EXPIRES_KEY),
    label: localStorage.getItem(LABEL_KEY),
  };
};

export const getStorages = async () => {
  return get<string[]>(`/admin/storages`);
};

interface IPermissionResponse {
  id: string;
  comment: string;
}

export const getPermissions = async () => {
  return get<IPermissionResponse[]>(`/admin/permissions`);
};

export const addPermission = async (id: string, comment: string) => {
  return post(`/admin/permission`, {
    id,
    comment,
  });
};
