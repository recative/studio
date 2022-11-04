import fetch from 'node-fetch';
import jwtDecode from 'jwt-decode';

import { localStorage } from '../../utils/localStorage';

interface IUserLoginResponse {
  id: number;
  name: string;
  email: string;
  label: string;
  active: boolean;
  token: string;
}

interface IToken {
  id: number;
  name: string;
  label: string;
  iat: number;
  expiresIn: number;
}

export const localLogout = async () => {
  localStorage.removeItem('@recative/auth-service/id');
  localStorage.removeItem('@recative/auth-service/name');
  localStorage.removeItem('@recative/auth-service/token');
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

  const token = localStorage.getItem('@recative/auth-service/token');
  const id = Number.parseInt(
    localStorage.getItem('@recative/auth-service/id') || '-1',
    10
  );
  const name = localStorage.getItem('@recative/auth-service/name') || '';
  const label = localStorage.getItem('@recative/auth-service/label') || '';
  const host = localStorage.getItem('@recative/auth-service/host') || '';

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
    Authorization: localStorage.getItem('@recative/auth-service/token'),
  };
};

const getRequestUrl = (pathName: string) => {
  const server = localStorage.getItem('@recative/auth-service/host');

  if (!server) {
    throw new TypeError('Service not available');
  }
  const requestUrl = new URL(server);
  requestUrl.pathname = pathName;

  return requestUrl.toString();
};

export const userLogin = async (
  email: string,
  password: string,
  actServer: string
) => {
  try {
    const requestUrl = new URL(actServer);
    requestUrl.pathname = '/admin/user/token';

    const response = await fetch(requestUrl.toString(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!response.ok) {
      throw new Error('Request failed');
    }

    const body = (await response.json()) as IUserLoginResponse;
    const { id, name, token, label } = body;

    const data: IToken = jwtDecode(token);

    if (typeof token === 'string') {
      localStorage.setItem('@recative/auth-service/host', actServer);
      localStorage.setItem('@recative/auth-service/id', id.toString());
      localStorage.setItem('@recative/auth-service/name', name);
      localStorage.setItem('@recative/auth-service/token', token);
      localStorage.setItem('@recative/auth-service/label', label);
      localStorage.setItem(
        '@recative/auth-service/expires',
        data.expiresIn.toString()
      );

      return { token, ...data };
    }

    throw new Error('Invalid response');
  } catch (error) {
    if (error instanceof Error) {
      return { code: error.name || error.message };
    }
    return { code: 'UNKNOWN_ERROR' };
  }
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
