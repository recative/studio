import Loki from 'lokijs';
import type { Collection, DynamicView } from 'lokijs';

import { join as joinPath } from 'path';
import { ensureDir } from 'fs-extra';

import type {
  IAsset,
  IEpisode,
  ISetting,
  IActPoint,
  IDataSlot,
  IResourceItem,
  IResourceFile,
  IResourceGroup,
  ISimpleRelease,
  IBundleRelease,
  ISeriesMetadata,
  PostProcessedResourceItemForUpload,
} from '@recative/definitions';

import { LokiWorkspaceLockSafeFsAdapter } from '../utils/LokiWorkspaceLockSafeFsAdapter';

export interface IMediaDatabase {
  path: string;
  resource: {
    $db: Loki;
    files: DynamicView<IResourceFile>;
    groups: DynamicView<IResourceGroup>;
    resources: Collection<IResourceFile | IResourceGroup>;
    postProcessed: Collection<PostProcessedResourceItemForUpload>;
  };
  cloud: {
    $db: Loki;
    dataSlots: Collection<IDataSlot>;
  };
  series: {
    $db: Loki;
    metadata: Collection<ISeriesMetadata>;
  };
  setting: {
    $db: Loki;
    setting: Collection<ISetting>;
  };
  episode: {
    $db: Loki;
    episodes: Collection<IEpisode>;
    assets: Collection<IAsset>;
  };
  actPoint: {
    $db: Loki;
    actPoints: Collection<IActPoint>;
  };
  release: {
    $db: Loki;
    mediaReleases: Collection<ISimpleRelease>;
    codeReleases: Collection<ISimpleRelease>;
    bundleReleases: Collection<IBundleRelease>;
  };
}

export const getTable = (dbPath: string, jsonPath: string): Promise<Loki> => {
  const adapter = new LokiWorkspaceLockSafeFsAdapter();
  return new Promise((resolve) => {
    let db: Loki | null = null;

    const handleAutoload = () => resolve(db as unknown as Loki);

    db = new Loki(joinPath(dbPath, jsonPath), {
      adapter,
      autoload: true,
      autoloadCallback: handleAutoload,
      autosave: true,
      autosaveInterval: 500,
      autosaveCallback: () => {},
    });
  });
};

let currentDb: IMediaDatabase | null = null;

export const getDb = async (
  yamlPath: string | null = null,
  temporary = false
) => {
  const trueRootPath = temporary
    ? yamlPath
    : yamlPath || currentDb?.path || null;

  if (!trueRootPath) {
    throw new TypeError('Root path not defined, no previous path cached');
  }

  if (currentDb && currentDb.path === trueRootPath && !temporary) {
    return currentDb;
  }

  ensureDir(trueRootPath);

  const [
    resourceDb,
    cloudDb,
    actPointDb,
    episodeDb,
    releaseDb,
    seriesDb,
    settingDb,
  ] = await Promise.all([
    getTable(trueRootPath, 'resource.json'),
    getTable(trueRootPath, 'cloud.json'),
    getTable(trueRootPath, 'act-point.json'),
    getTable(trueRootPath, 'episode.json'),
    getTable(trueRootPath, 'release.json'),
    getTable(trueRootPath, 'series.json'),
    getTable(trueRootPath, 'setting.json'),
  ]);

  const resourceCollection = resourceDb.addCollection<IResourceItem>(
    'resources',
    {
      autoupdate: true,
      indices: ['id', 'label', 'type', 'resourceGroupId', 'importTime'],
    }
  );

  const postProcessedResourceCollection =
    resourceDb.addCollection<PostProcessedResourceItemForUpload>(
      'postProcessedResources',
      {
        autoupdate: true,
        indices: ['id', 'label', 'type', 'resourceGroupId', 'importTime'],
      }
    );

  const filesView = resourceCollection.addDynamicView('files');
  filesView.applyFind({
    type: { $eq: 'file' },
  });

  const groupsView = resourceCollection.addDynamicView('groups');
  filesView.applyFind({
    type: { $eq: 'group' },
  });

  const dataSlotCollection = cloudDb.addCollection<IDataSlot>('dataSlots', {
    autoupdate: true,
    indices: ['id', 'slug', 'notes', 'createTime', 'updateTime'],
  });

  const metadataCollection = seriesDb.addCollection<ISeriesMetadata>(
    'metadata',
    {
      autoupdate: true,
    }
  );

  const actPointCollection = actPointDb.addCollection<IActPoint>('actPoints', {
    autoupdate: true,
    indices: ['id', 'label', 'firstLevelPath', 'secondLevelPath', 'fullPath'],
  });

  const assetsTable = episodeDb.addCollection<IAsset>('assets', {
    autoupdate: true,
    indices: [
      'id',
      'order',
      'episodeId',
      'contentId',
      'notes',
      'createTime',
      'updateTime',
    ],
  });

  const episodesTable = episodeDb.addCollection<IEpisode>('episodes', {
    autoupdate: true,
    indices: ['id', 'label', 'order', 'largeCoverResourceId', 'createTime'],
  });

  const mediaReleasesCollection = releaseDb.addCollection<ISimpleRelease>(
    'media',
    {
      autoupdate: true,
      indices: ['id', 'committer', 'commitTime', 'notes'],
    }
  );

  const codeReleasesCollection = releaseDb.addCollection<ISimpleRelease>(
    'code',
    {
      autoupdate: true,
      indices: ['id', 'committer', 'commitTime', 'notes'],
    }
  );

  const bundleReleasesCollection = releaseDb.addCollection<IBundleRelease>(
    'bundle',
    {
      autoupdate: true,
      indices: [
        'id',
        'codeBuildId',
        'mediaBuildId',
        'committer',
        'commitTime',
        'notes',
      ],
    }
  );

  const settingCollection = releaseDb.addCollection<ISetting>('setting', {
    autoupdate: true,
    indices: ['key', 'value'],
  });

  const newDb = {
    path: trueRootPath,
    resource: {
      $db: resourceDb,
      files: filesView as DynamicView<IResourceFile>,
      groups: groupsView as DynamicView<IResourceGroup>,
      resources: resourceCollection,
      postProcessed: postProcessedResourceCollection,
    },
    cloud: {
      $db: cloudDb,
      dataSlots: dataSlotCollection,
    },
    series: {
      $db: seriesDb,
      metadata: metadataCollection,
    },
    episode: {
      $db: episodeDb,
      episodes: episodesTable,
      assets: assetsTable,
    },
    actPoint: {
      $db: actPointDb,
      actPoints: actPointCollection,
    },
    release: {
      $db: releaseDb,
      mediaReleases: mediaReleasesCollection,
      codeReleases: codeReleasesCollection,
      bundleReleases: bundleReleasesCollection,
    },
    setting: {
      $db: settingDb,
      setting: settingCollection,
    },
  };

  if (!temporary) {
    currentDb = newDb;
  }

  newDb.resource.resources.find({ type: 'file' }).forEach((data) => {
    if (data.type === 'file' && !data.pluginConfigurations) {
      console.log('migrated', data.id);
      data.pluginConfigurations = {};
      newDb.resource.resources.update(data);
    }
  });

  newDb.resource.postProcessed.find({}).forEach((data) => {
    console.log('Removing', data.id);
    newDb.resource.postProcessed.remove(data);
  });

  return newDb;
};

export const setupDb = async (yamlPath: string) => {
  await getDb(yamlPath);
};
