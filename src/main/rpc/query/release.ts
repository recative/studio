import spawn from 'cross-spawn';
import { uniqBy } from 'lodash';
import { ensureDir, writeJSON, remove } from 'fs-extra';

import type { Collection } from 'lokijs';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import {
  TaskLockedError,
  WorkspaceNotReadyError,
  cleanUpResourceListForClient,
} from '@recative/definitions';

import type { ISimpleRelease, IBundleRelease } from '@recative/definitions';

import {
  logToTerminal,
  wrapTaskFunction,
  newTerminalSession,
} from './terminal';
import { getBuildPath } from './setting';
import { postProcessResource } from './publishPostProcessResource';

import { getResourceFilePath } from '../../utils/getResourceFile';

import { getWorkspace } from '../workspace';
import { getDb, saveAllDatabase } from '../db';

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

export const bundleBuild = async (
  notes: string,
  terminalId: string
): Promise<number> => {
  const config = getWorkspace();
  const buildPath = await getBuildPath();
  const db = await getDb();
  let buildId = (db.release.codeReleases.max('id') + 1) as number;

  if (buildId === -Infinity) {
    buildId = 0;
  }

  const outputPath = `${buildPath}/code-${buildId
    .toString()
    .padStart(4, '0')}.zip`;

  logToTerminal(terminalId, `:: Output: ${outputPath}`, Level.Info);

  const zip = new Zip(outputPath);
  await zip.appendGlob('dist/**/*', config.codeRepositoryPath);

  await zip.done();
  logToTerminal(terminalId, `:: Done!`, Level.Info);

  await updateOrInsertCodeRelease([
    {
      id: buildId,
      committer: 'Default User',
      commitTime: Date.now(),
      deprecated: false,
      notes,
    },
  ]);

  return buildId;
};

export const bundleDb = async (mediaReleaseId: number, terminalId: string) => {
  const buildPath = await getBuildPath();
  const config = getWorkspace();

  logToTerminal(terminalId, `Creating database bundle`, Level.Info);

  logToTerminal(terminalId, `:: Syncing local cache to hard disk`, Level.Info);
  const db = await getDb();
  await saveAllDatabase(db);

  const outputPath = `${buildPath}/db-${mediaReleaseId
    .toString()
    .padStart(4, '0')}.zip`;

  logToTerminal(terminalId, `:: Output: ${outputPath}`, Level.Info);

  const zip = new Zip(outputPath);
  await zip.appendGlob('**/*', config.dbPath);

  await zip.done();

  logToTerminal(terminalId, `:: Done!`, Level.Info);
};

let copyResourcesLock = false;

export const copyMedia = async (mediaReleaseId: number, terminalId: string) => {
  const buildPath = await getBuildPath();

  if (copyResourcesLock) throw new TaskLockedError();

  copyResourcesLock = true;

  const db = await getDb();

  const resourceId = mediaReleaseId.toString().padStart(4, '0');

  logToTerminal(terminalId, `Copying media database`);
  const resourceDir = `${buildPath}/resource-${resourceId}`;
  const binaryDir = `${resourceDir}/binary`;
  const metadataDir = `${resourceDir}/metadata`;
  const metadataByIdDir = `${metadataDir}/id`;
  const metadataByLabelDir = `${metadataDir}/label`;

  await Promise.all([
    ensureDir(binaryDir),
    ensureDir(metadataByIdDir),
    ensureDir(metadataByLabelDir),
  ]);

  const resourceList = db.resource.resources.find({
    removed: false,
  });

  await writeJSON(
    `${metadataDir}/resources.json`,
    cleanUpResourceListForClient(resourceList)
  );

  copyResourcesLock = false;

  logToTerminal(terminalId, `:: Done!`);

  return mediaReleaseId;
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
      deprecated: false,
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
    .simplesort('commitTime', { desc: true })
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
  terminalId = 'createMediaRelease',
  abortController = new AbortController()
) => {
  if (terminalId === 'createMediaRelease') {
    newTerminalSession(terminalId, [
      'Postprocessing Resource',
      'Building Database',
      'Copying Media',
      'Writing Release Record',
    ]);
  }

  const db = await getDb();

  let mediaReleaseId = (db.release.mediaReleases.max('id') + 1) as number;

  if (mediaReleaseId === -Infinity) {
    mediaReleaseId = 0;
  }

  await wrapTaskFunction(
    terminalId,
    'Postprocessing Resource',
    async () => {
      logToTerminal(terminalId, `Postprocessing media`);
      await postProcessResource(mediaReleaseId, terminalId);
    },
    abortController
  )();

  await wrapTaskFunction(
    terminalId,
    'Building Database',
    async () => {
      return bundleDb(mediaReleaseId, terminalId);
    },
    abortController
  )();

  await wrapTaskFunction(
    terminalId,
    'Copying Media',
    async () => {
      return copyMedia(mediaReleaseId, terminalId);
    },
    abortController
  )();

  await wrapTaskFunction(
    terminalId,
    'Writing Release Record',
    async () => {
      logToTerminal(terminalId, `Writing release record`);
      await updateOrInsertMediaRelease([
        {
          id: mediaReleaseId,
          committer: 'Default User',
          commitTime: Date.now(),
          deprecated: false,
          notes,
        },
      ]);
      logToTerminal(terminalId, `:: Done!`);
    },
    abortController
  )();

  return mediaReleaseId;
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

  return wrapTaskFunction(terminalId, 'Bundling Artifacts', async () => {
    return bundleBuild(notes, terminalId);
  })();
};

export const cleanupPostProcessedFiles = async (
  terminalId = 'deprecateRelease'
) => {
  const db = await getDb();

  logToTerminal(terminalId, 'Cleanings up post-processed files');

  const deprecatedReleases = new Set(
    db.release.mediaReleases.find({ deprecated: true }).map((x) => x.id)
  );

  const deprecatedResources = db.resource.postProcessed
    .find({ removed: false })
    .filter((x) =>
      x.postProcessRecord.mediaBundleId.every((id) =>
        deprecatedReleases.has(id)
      )
    );

  for (let i = 0; i < deprecatedResources.length; i += 1) {
    const deprecatedResource = deprecatedResources[i];
    logToTerminal(terminalId, `:: Removing ${deprecatedResource.label}`);

    const resourcePath = await getResourceFilePath(deprecatedResource, false);
    const thumbnailPath = await getResourceFilePath(deprecatedResource, true);

    await remove(resourcePath);
    await remove(thumbnailPath);

    deprecatedResource.removed = true;
    deprecatedResource.removedTime = Date.now();
    db.resource.postProcessed.update(deprecatedResource);
  }

  return deprecatedResources;
};

export const deprecateRelease = async (
  id: number,
  type: 'media' | 'code' | 'bundle',
  terminalId = 'deprecateRelease'
) => {
  if (terminalId === 'deprecateRelease') {
    newTerminalSession(terminalId, [
      'Updating Metadata',
      'Cleaning up resources',
    ]);
  }

  const db = await getDb();

  await wrapTaskFunction(terminalId, 'Updating Metadata', async () => {
    logToTerminal(terminalId, 'Cleanings up metadata');
    if (type === 'media') {
      db.release.mediaReleases.findAndUpdate({ id }, (x) => {
        x.deprecated = true;
        return x;
      });

      db.release.bundleReleases.findAndUpdate({ mediaBuildId: id }, (x) => {
        x.deprecated = true;
        return x;
      });
    }

    if (type === 'code') {
      db.release.codeReleases.findAndUpdate({ id }, (x) => {
        x.deprecated = true;
        return x;
      });
      db.release.bundleReleases.findAndUpdate({ codeBuildId: id }, (x) => {
        x.deprecated = true;
        return x;
      });
    }

    if (type === 'bundle') {
      db.release.bundleReleases.findAndUpdate({ id }, (x) => {
        x.deprecated = true;
        return x;
      });
    }
  })();

  await wrapTaskFunction(terminalId, 'Cleaning up resources', async () => {
    return cleanupPostProcessedFiles(terminalId);
  })();
};
