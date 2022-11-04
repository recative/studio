import { glob } from 'glob';
import { stat } from 'fs/promises';
import { join, basename } from 'path';

import { localStorage } from '../../utils/localStorage';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';

import { getSeriesId } from './series';

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
