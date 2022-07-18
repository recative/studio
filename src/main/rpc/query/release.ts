import spawn from 'cross-spawn';
import { flatten, uniqBy } from 'lodash';
import { ensureDir, writeJSON, copy, existsSync } from 'fs-extra';

import type { Collection } from 'lokijs';

import {
  TaskLockedError,
  WorkspaceNotReadyError,
  cleanUpResourceListForClient,
  TerminalMessageLevel as Level,
} from '@recative/definitions';
import type { ISimpleRelease, IBundleRelease } from '@recative/definitions';

import {
  logToTerminal,
  wrapTaskFunction,
  newTerminalSession,
} from './terminal';
import { getBuildPath } from './setting';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';
import { archiverGlob } from '../../utils/archiver';

const listRelease = <T extends ISimpleRelease | IBundleRelease>(
  collection: Collection<T>,
  itemIds: string[] | null = null
) => {
  const releases = collection
    .chain()
    .find(itemIds ? { id: { $in: itemIds } } : {})
    .simplesort('id', true)
    .data() as T[];

  return releases;
};

export const listCodeRelease = async (itemIds: string[] | null = null) => {
  const db = await getDb();
  return listRelease(db.release.codeReleases, itemIds);
};

export const listMediaRelease = async (itemIds: string[] | null = null) => {
  const db = await getDb();
  return listRelease(db.release.mediaReleases, itemIds);
};

export const listBundleRelease = async (itemIds: string[] | null = null) => {
  const db = await getDb();
  return listRelease(db.release.bundleReleases, itemIds);
};

export const listBundles = async () => {
  const db = await getDb();

  return {
    code: listRelease(db.release.codeReleases),
    media: listRelease(db.release.mediaReleases),
    bundle: listRelease(db.release.bundleReleases),
  };
};

const updateOrInsertRelease = <T extends ISimpleRelease | IBundleRelease>(
  collection: Collection<T>,
  items: T[]
) => {
  items.forEach((item) => {
    const itemInDb = collection.findOne({ id: { $eq: item.id } });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      collection.update(itemInDb);
    } else {
      // Insert
      collection.insert(item);
    }
  });
};

export const updateOrInsertCodeRelease = async (items: ISimpleRelease[]) => {
  const db = await getDb();

  updateOrInsertRelease(db.release.codeReleases, items);
};

export const updateOrInsertMediaRelease = async (items: ISimpleRelease[]) => {
  const db = await getDb();

  updateOrInsertRelease(db.release.mediaReleases, items);
};

export const updateOrInsertBundleRelease = async (items: IBundleRelease[]) => {
  const db = await getDb();

  updateOrInsertRelease(db.release.bundleReleases, items);
};

let buildingLock = false;

export const buildCode = async (terminalId: string) => {
  const config = getWorkspace();
  if (buildingLock) throw new TaskLockedError();

  buildingLock = true;

  const { codeRepositoryPath } = config;

  if (!codeRepositoryPath) {
    throw new WorkspaceNotReadyError();
  }

  const processExitCode = await new Promise((resolve) => {
    const childProcess = spawn('yarn', ['build'], {
      cwd: codeRepositoryPath,
    });

    childProcess.on('close', (code) => {
      resolve(code);
    });

    childProcess.stdout?.on('data', (data) =>
      logToTerminal(terminalId, data.toString(), Level.Info)
    );
    childProcess.stderr?.on('data', (data) =>
      logToTerminal(terminalId, data.toString(), Level.Error)
    );
  });

  if (processExitCode !== 0) {
    buildingLock = false;
    return false;
  }

  buildingLock = false;

  return true;
};

export const bundleBuild = async (notes: string, terminalId: string) => {
  const config = getWorkspace();
  const buildPath = await getBuildPath();
  const db = await getDb();
  let buildId = (db.release.codeReleases.max('id') + 1) as number;

  if (buildId === -Infinity) {
    buildId = 0;
  }
  const { files, promise, archive } = archiverGlob(
    `${buildPath}/code-${buildId.toString().padStart(4, '0')}.zip`,
    'dist/**/*',
    config.codeRepositoryPath
  );

  archive.on('progress', (progress) => {
    logToTerminal(
      terminalId,
      `Zipping file ${Math.round(
        (progress.entries.processed / files.length) * 100
      )}%, ${progress.fs.processedBytes} bytes, ${
        progress.entries.processed
      } files`,
      Level.Info
    );
  });

  await promise;

  updateOrInsertCodeRelease([
    {
      id: buildId,
      committer: 'Default User',
      commitTime: Date.now(),
      notes,
    },
  ]);

  return buildId;
};

export const bundleDb = async (terminalId: string) => {
  const buildPath = await getBuildPath();
  const config = getWorkspace();
  const db = await getDb();
  let buildId = (db.release.mediaReleases.max('id') + 1) as number;

  if (buildId === -Infinity) {
    buildId = 0;
  }

  logToTerminal(terminalId, `Creating database bundle`, Level.Info);

  const { promise } = archiverGlob(
    `${buildPath}/db-${buildId.toString().padStart(4, '0')}.zip`,
    '**/*',
    config.dbPath
  );

  logToTerminal(terminalId, `Done!`, Level.Info);

  await promise;
};

let copyResourcesLock = false;

export const copyMedia = async (notes: string, terminalId: string) => {
  const config = getWorkspace();
  const buildPath = await getBuildPath();

  if (copyResourcesLock) throw new TaskLockedError();

  copyResourcesLock = true;

  const db = await getDb();

  let buildId = (db.release.mediaReleases.max('id') + 1) as number;

  if (buildId === -Infinity) {
    buildId = 0;
  }

  const resourceDir = `${buildPath}/resource-${buildId
    .toString()
    .padStart(4, '0')}`;
  const binaryDir = `${resourceDir}/binary`;
  const metadataDir = `${resourceDir}/metadata`;
  const metadataByIdDir = `${metadataDir}/id`;
  const metadataByLabelDir = `${metadataDir}/label`;

  await Promise.all([
    ensureDir(binaryDir),
    ensureDir(metadataByIdDir),
    ensureDir(metadataByLabelDir),
  ]);

  // const resources = db.resource.resources.find({ removed: false });

  // await Promise.all(
  //   resources.map(async (resource) => {
  //     await writeJSON(`${metadataByIdDir}/${resource.id}.json`, resource);
  //     await writeJSON(`${metadataByLabelDir}/${resource.label}.json`, resource);

  //     const from = `${config.mediaPath}/${resource.id}.resource`;
  //     const to = `${binaryDir}/${resource.id}.resource`;
  //     if (existsSync(from)) {
  //       await copy(from, to);
  //       logToTerminal(terminalId, `File copied: ${from}`, Level.Info);
  //     } else {
  //       logToTerminal(
  //         terminalId,
  //         `File not exists: ${from} for ${resource.label}(${resource.id})`,
  //         Level.Warning
  //       );
  //     }
  //   })
  // );

  const resourceList = db.resource.resources.find({
    removed: false,
  });

  await writeJSON(
    `${metadataDir}/resources.json`,
    cleanUpResourceListForClient(resourceList)
  );

  updateOrInsertMediaRelease([
    {
      id: buildId,
      committer: 'Default User',
      commitTime: Date.now(),
      notes,
    },
  ]);

  return buildId;
};

export const createBundleRelease = async (
  mediaBuildId: number,
  codeBuildId: number,
  notes: string
) => {
  const db = await getDb();
  let buildId = (db.release.bundleReleases.max('id') + 1) as number;

  if (buildId === -Infinity) {
    buildId = 0;
  }

  await updateOrInsertBundleRelease([
    {
      id: buildId,
      mediaBuildId,
      codeBuildId,
      notes,
      committer: 'Default User',
      commitTime: Date.now(),
    },
  ]);

  return buildId;
};

export const searchRelease = async (query: string, type: 'media' | 'code') => {
  const db = await getDb();

  const nQuery = Number.parseInt(query, 10);
  const table =
    type === 'media' ? ('mediaReleases' as const) : ('codeReleases' as const);
  const searchResult = db.release[table]
    .chain()
    .find({
      $or: [
        { notes: { $contains: query } },
        Number.isNaN(nQuery) ? undefined : { id: nQuery },
      ],
    })
    .limit(10)
    .data();

  return uniqBy(searchResult, 'id');
};

/**
 * Creating media release.
 *
 * Available steps are:
 * - `Building Database`
 * - `Copying Media`
 *
 * @param notes Some information for the human.
 * @param terminalId Output information to which terminal.
 */
export const createMediaRelease = async (
  notes: string,
  terminalId = 'createMediaRelease'
) => {
  if (terminalId === 'createMediaRelease') {
    newTerminalSession(terminalId, ['Building Database', 'Copying Media']);
  }

  await wrapTaskFunction(terminalId, 'Building Database', async () => {
    return bundleDb(terminalId);
  })();

  await wrapTaskFunction(terminalId, 'Copying Media', async () => {
    return copyMedia(notes, terminalId);
  })();
};

/**
 * Creating code release.
 *
 * Available steps are:
 * - `Building Code`
 * - `Bundling Artifacts`
 *
 * @param notes Some information for the human.
 * @param terminalId Output information to which terminal.
 */
export const createCodeRelease = async (
  notes: string,
  terminalId = 'createCodeRelease'
) => {
  if (terminalId === 'createCodeRelease') {
    newTerminalSession(terminalId, ['Building Code', 'Bundling Artifacts']);
  }

  await wrapTaskFunction(terminalId, 'Building Code', async () => {
    return buildCode(terminalId);
  })();

  await wrapTaskFunction(terminalId, 'Bundling Artifacts', async () => {
    return bundleBuild(notes, terminalId);
  })();
};

let fastBuildLock = false;

/**
 * Builds the latest code and database bundles.
 *
 * Available steps are:
 * - `Creating Code Bundle`
 *    - `Building Code`
 *    - `Bundling Artifacts`
 * - `Creating Media Bundle`
 *    - `Building Database`
 *    - `Copying Media`
 *
 * @param ifBuildMediaBundle If true, builds a media release.
 * @param ifCreateCodeBundle If true, builds a code release.
 * @param notes Some information for the human.
 * @param terminalId Output information to which terminal.
 * @return The index of the release.
 */
export const fastRelease = async (
  ifBuildMediaBundle: boolean,
  ifCreateCodeBundle: boolean,
  notes: string,
  terminalId = 'fastRelease'
) => {
  if (fastBuildLock) throw new TaskLockedError();

  fastBuildLock = true;

  if (terminalId === 'fastRelease') {
    newTerminalSession(terminalId, [
      'Creating Media Bundle',
      'Creating Code Bundle',
    ]);
  }

  const db = await getDb();

  await wrapTaskFunction(terminalId, 'Creating Media Bundle', async () => {
    if (ifBuildMediaBundle) {
      await createMediaRelease(notes, terminalId);
    }
  })();

  await wrapTaskFunction(terminalId, 'Creating Code Bundle', async () => {
    if (ifCreateCodeBundle) {
      await createCodeRelease(notes, terminalId);
    }
  })();

  const codeBuildId = db.release.codeReleases.max('id');
  const dbBuildId = db.release.mediaReleases.max('id');

  fastBuildLock = false;

  return createBundleRelease(dbBuildId, codeBuildId, notes);
};
