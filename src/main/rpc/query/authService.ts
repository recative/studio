import fetch from 'node-fetch';
import { h32 } from 'xxhashjs';
import { faker } from '@faker-js/faker';
import { v4 as uuidV4 } from 'uuid';

import { localStorage } from '../../utils/localStorage';

import { getDb } from '../db';

const HOST_KEY = '@recative/auth-service/host';
const TOKEN_KEY = '@recative/auth-service/token';
const PERMISSIONS_KEY = '@recative/auth-service/tokenType';
const LABEL_KEY = '@recative/auth-service/label';
const SESSION_ID_KEY = '@recative/auth-service/session';
const HASH_KEY = '@recative/auth-service/hash';
const EXPIRES_KEY = '@recative/auth-service/expires';

export const userLogout = async () => {
  localStorage.removeItem(LABEL_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  localStorage.removeItem(HASH_KEY);
  localStorage.removeItem(SESSION_ID_KEY);
  localStorage.removeItem(PERMISSIONS_KEY);
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
  async <T>(
    pathName: string,
    body?: Record<string, unknown>,
    header?: Record<string, string>
  ) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const host = localStorage.getItem(HOST_KEY);

    if (!host) throw new TypeError(`Host not found`);

    const request = await fetch(getRequestUrl(pathName), {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-InternalAuthorization': token || '',
        ...header,
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

      if (request.status === 204) {
        return null as T;
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
const put = requestFactory('PUT');
const del = requestFactory('DELETE');

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
  localStorage.setItem(
    PERMISSIONS_KEY,
    JSON.stringify(response.admin_permission)
  );

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
    permissions: JSON.parse(localStorage.getItem(PERMISSIONS_KEY) ?? '[]'),
  };
};

interface IPermissionResponse {
  id: string;
  comment: string;
}

export const getPermissions = async () => {
  return get<IPermissionResponse[]>(`/admin/permissions`);
};

export const addPermission = async (id: string, comment: string) => {
  return post<null>(`/admin/permission`, {
    id,
    comment,
  });
};

export interface IToken {
  token: string;
  admin_permission: string[];
  comment: string;
  expired_at: string;
  is_valid: boolean;
  type: string;
}

export const getTokens = async () => {
  return get<IToken[]>(`/admin/tokens`);
};

export const addToken = async (
  expiredAt: Date,
  permissions: string[],
  comment: string
) => {
  return post(`/admin/token`, {
    comment,
    admin_permission: permissions,
    is_valid: true,
    token: uuidV4(),
    expiredAt: expiredAt.toISOString(),
  });
};

export const deleteToken = (token: string) => {
  return del<null>(`/admin/token/${token}`);
};

export interface IStorage {
  key: string;
  value: string;
  need_permissions: string[];
  need_permission_count: number;
  comment: string;
}

export const getStorages = async () => {
  return get<IStorage[]>('/admin/storages');
};

export const addStorage = async (
  key: string,
  value: string,
  permissions: string[],
  permissionCount: number,
  notes: string
) => {
  return post<null>('/admin/storage', {
    key,
    value,
    need_permissions: permissions,
    need_permission_count: permissionCount,
    comment: notes,
  });
};

export const updateStorage = async (
  key: string,
  value: string,
  permissions: string[],
  permissionCount: number,
  notes: string
) => {
  return put<null>(`/admin/storage/${key}`, {
    key,
    value,
    need_permissions: permissions,
    need_permission_count: permissionCount,
    comment: notes,
  });
};

export const getStorage = async (key: string) => {
  return get<IStorage>(`/admin/storage/${key}`);
};

export const syncPermissions = async () => {
  const db = await getDb();

  const episodes = db.episode.episodes.find({});
  const series = db.series.metadata.findOne({});
  const seriesId = series?.id;
  const seriesLabel = series?.title?.en ?? 'Unknown Series';

  const existedPermissionIds = new Set(
    (await getPermissions()).map((x) => x.id)
  );

  const requiredPermissionIds = episodes
    .map((x) => ({
      permissionId: `@${seriesId}/${x.id}`,
      episodeLabel: x.label.en,
    }))
    .filter((x) => !existedPermissionIds.has(x.permissionId));

  await Promise.allSettled(
    requiredPermissionIds.map(({ permissionId, episodeLabel }) => {
      return addPermission(permissionId, `Permission for ${episodeLabel}`);
    })
  );

  if (!existedPermissionIds.has(`@${seriesId}/database`)) {
    await addPermission(
      `@${seriesId}/database`,
      `Access permission for ${seriesLabel}`
    );
  }
};

export const deletePermission = (permission: string) => {
  return del<null>(`/admin/permission/${permission}`);
};
