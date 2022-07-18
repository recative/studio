import fs from 'fs';

import git from 'isomorphic-git';
import { h32 } from 'xxhashjs';

type Walker = ReturnType<typeof git.TREE>;

const IGNORE_PATH_LIST = ['node_modules', '.git', '.yarn', 'dist'];

export const gitDiff = (walkerA: Walker, walkerB: Walker, dir: string) => {
  return git.walk({
    fs,
    dir,
    trees: [walkerA, walkerB],
    map: async (filepath, [A, B]) => {
      // ignore directories
      if (filepath === '.') {
        return undefined;
      }
      if ((await A?.type()) === 'tree' || (await B?.type()) === 'tree') {
        return undefined;
      }
      if (
        IGNORE_PATH_LIST.map((path) => filepath.startsWith(path)).filter(
          Boolean
        ).length > 0
      ) {
        return undefined;
      }
      // generate ids
      const Aoid = await A?.oid();
      const Boid = await B?.oid();

      // determine modification type
      let type = 'equal';
      if (Aoid !== Boid) {
        type = 'modify';
      }
      if (Aoid === undefined) {
        type = 'add';
      }
      if (Boid === undefined) {
        type = 'remove';
      }
      if (Aoid === undefined && Boid === undefined) {
        return undefined;
      }

      return {
        path: `/${filepath}`,
        type,
      };
    },
  });
};

export const hashTree = async (walker: Walker, dir: string) => {
  const objectIds = await git.walk({
    fs,
    dir,
    trees: [walker],
    map: async (filepath, [A]) => {
      if (filepath === '.') {
        return undefined;
      }
      if (
        IGNORE_PATH_LIST.map((path) => filepath.startsWith(path)).filter(
          Boolean
        ).length > 0
      ) {
        return undefined;
      }

      return A?.oid();
    },
  });

  return h32(objectIds.join('.'), 0x1bf52).toString(16);
};
