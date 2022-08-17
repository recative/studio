import jwt_decode from 'jwt-decode';

import { glob } from 'glob';
import { stat } from 'fs/promises';
import { join, basename } from 'path';

import { OpenAPI, AdminService } from '../../../api';

import { localStorage } from '../../utils/localStorage';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';

import { getSeriesId } from './series';

interface IToken {
  expiresIn: number;
  id: number;
  name: string;
  label: string;
  iat: number;
}

const localSettingKeysArr = [
  'resourceHost',
  'apHost',
  'contentProtocol',
  'playerUiModulePathOverride',
  'buildPathOverride',
] as const;
const localSettingKeys = new Set<string>(localSettingKeysArr);

export const getLocalSettings = async () => {
  const seriesId = await getSeriesId();
  const result = {} as Record<typeof localSettingKeysArr[number], string>;

  localSettingKeys.forEach((key) => {
    result[key as typeof localSettingKeysArr[number]] =
      localStorage.getItem(`@recative/ap-studio/settings/${seriesId}/${key}`) ||
      '';
  });

  return result;
};

export const getSettings = async (): Promise<Record<string, string>> => {
  const db = await getDb();
  const seriesId = await getSeriesId();

  const setting = db.setting.setting.find();

  const result: Record<string, string> = {};

  setting.forEach((item) => {
    result[item.key] = item.value;
  });

  localSettingKeys.forEach((key) => {
    result[key] =
      localStorage.getItem(`@recative/ap-studio/settings/${seriesId}/${key}`) ||
      '';
  });

  return result;
};

export const setSettings = async (x: Record<string, string>) => {
  const seriesId = await getSeriesId();

  Object.keys(x).forEach((key) => {
    if (localSettingKeys.has(key)) {
      localStorage.setItem(
        `@recative/ap-studio/settings/${seriesId}/${key}`,
        x[key]
      );

      delete x[key];
    }
  });

  const db = await getDb();

  Object.entries(x).forEach(([key, value]) => {
    const item = db.setting.setting.findOne({ key });

    if (!item) {
      db.setting.setting.insert({ key, value });
    } else {
      item.value = value;
      db.setting.setting.update(item);
    }
  });
};

export const getSettingItem = async (key: string) => {
  const db = await getDb();
  const seriesId = await getSeriesId();

  if (localSettingKeys.has(key)) {
    return localStorage.getItem(
      `@recative/ap-studio/settings/${seriesId}/${key}`
    );
  }

  const item = db.setting.setting.findOne({ key })?.value ?? null;

  return item;
};

export const getBuildPath = async () => {
  const buildPathOverride = await getSettingItem('buildPathOverride');
  if (buildPathOverride) return buildPathOverride;

  const workspace = getWorkspace();
  const { buildPath } = workspace;

  return buildPath;
};

OpenAPI.BASE = localStorage.getItem('openapi-base') || 'https://localhost:3000';
OpenAPI.TOKEN =
  localStorage.getItem('act-server-token') || 'https://localhost:3000';

export const setActServerBase = (x: string) => {
  OpenAPI.BASE = x;
};

export const localLogout = async () => {
  localStorage.removeItem('act-server-token');
  localStorage.removeItem('act-server-id');
  localStorage.removeItem('act-server-name');
  localStorage.removeItem('act-server-label');
  localStorage.removeItem('act-server-expires');
};

export const getUserData = () => {
  const expires = Number.parseInt(
    localStorage.getItem('act-server-expires') || '-1',
    10
  );

  if (Date.now() > expires) {
    localLogout();
    return null;
  }

  const token = localStorage.getItem('act-server-token');
  const id = Number.parseInt(localStorage.getItem('act-server-id') || '-1', 10);
  const name = localStorage.getItem('act-server-name') || '';
  const label = localStorage.getItem('act-server-label') || '';
  const host = localStorage.getItem('act-server-host') || '';

  if (!token) return null;

  return {
    token,
    id,
    name,
    label,
    host,
  };
};

export const getFileListFromAssetsPath = (globRule: string) => {
  const workspace = getWorkspace();
  const { assetsPath } = workspace;

  const files = glob.sync(globRule, { cwd: assetsPath });

  return Promise.all(
    files.map(async (x) => ({
      updateTime: (await stat(join(assetsPath, x))).mtime,
      fileName: basename(x),
    }))
  );
};

export const userLogin = async (
  email: string,
  password: string,
  actServer: string
) => {
  try {
    OpenAPI.BASE = actServer;
    const token = await AdminService.postToken({
      email,
      password,
    });
    if (typeof token === 'string') {
      OpenAPI.TOKEN = token;

      const data: IToken = jwt_decode(token);

      localStorage.setItem('act-server-host', actServer);
      localStorage.setItem('act-server-token', token);
      localStorage.setItem('act-server-name', data.name);
      localStorage.setItem('act-server-id', data.id.toString());
      localStorage.setItem('act-server-label', data.label);
      localStorage.setItem('act-server-expires', data.expiresIn.toString());

      return { token, ...data };
    }
    return { code: token.code || 'UNKNOWN_ERROR' };
  } catch (error) {
    console.error(error);
    if (error instanceof Error) {
      return { code: error.name || error.message };
    }
    return { code: 'UNKNOWN_ERROR' };
  }
};

export const userLogout = async () => {
  try {
    await AdminService.deleteToken();
    localLogout();
    OpenAPI.TOKEN = undefined;
    return { code: 'SUCCESS' };
  } catch (error) {
    return { code: 'ERROR' };
  }
};
