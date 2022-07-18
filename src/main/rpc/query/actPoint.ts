import {
  join as joinPath,
  sep as pathSep,
  normalize as normalizePath,
} from 'path';

import { glob } from 'glob';
import { nanoid } from 'nanoid';
import { reject as not, groupBy } from 'lodash';

import { ResolutionMode } from '@recative/definitions';
import type { IActPoint, IWorkspaceConfiguration } from '@recative/definitions';

import { getDb } from '../db';

export class CodeRepositoryPathNotSetError extends Error {
  name = 'CodeRepositoryPathNotSetError';

  constructor() {
    super('Code repository path not set');
  }
}

export const syncActPoints = async (
  workspaceConfiguration: IWorkspaceConfiguration
) => {
  if (!workspaceConfiguration.codeRepositoryPath) {
    throw new CodeRepositoryPathNotSetError();
  }

  const db = await getDb();

  const actPointPaths = await new Promise<string[]>((resolve, reject) => {
    if (!workspaceConfiguration.codeRepositoryPath) {
      resolve([]);
      return;
    }

    glob(
      joinPath(
        workspaceConfiguration.codeRepositoryPath,
        'src/episodes/*/*/index.ts'
      ),
      (error, matches) => {
        if (error) reject(error);
        resolve(matches.map(normalizePath));
      }
    );
  });

  const parsedPaths = actPointPaths.map<IActPoint>((path) => {
    const splitedPath = path.split(pathSep);
    const firstLevelPath = splitedPath[splitedPath.length - 3];
    const secondLevelPath = splitedPath[splitedPath.length - 2];

    return {
      id: nanoid(),
      label: secondLevelPath,
      firstLevelPath,
      secondLevelPath,
      fullPath: `${firstLevelPath}/${secondLevelPath}`,
      entryPoints: {},
      resolutionMode: ResolutionMode.FollowPlayerSetting,
      width: 1000,
      height: 562,
    };
  });

  const existedActPoints = await db.actPoint.actPoints.find({
    fullPath: { $in: parsedPaths.map((path) => path.fullPath) },
  });

  const notExistedActPoints = not(parsedPaths, (parsedPath) =>
    existedActPoints.find((x) => x.fullPath === parsedPath.fullPath)
  ) as IActPoint[];

  db.actPoint.actPoints.insert(notExistedActPoints);

  return [];
};

export const listActPoints = async () => {
  const db = await getDb();

  const actPoints = db.actPoint.actPoints.find({});

  return groupBy(actPoints, 'firstLevelPath') as Record<string, IActPoint[]>;
};

export const getActPoint = async (actPointId: string) => {
  const db = await getDb();

  const actPoint = db.actPoint.actPoints.findOne({
    id: actPointId,
  });

  if (!actPoint) return null;

  return actPoint;
};

export const updateOrInsertActPoint = async (items: IActPoint[]) => {
  const db = await getDb();

  items.forEach((item) => {
    const itemInDb = db.actPoint.actPoints.findOne({ id: item.id });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      db.actPoint.actPoints.update(itemInDb);
    } else {
      // Insert
      db.actPoint.actPoints.insert(item);
    }
  });
};
