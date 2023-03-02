import {
  IAsset,
  IEpisode,
  IActPoint,
  IDataSlot,
  IResourceItem,
  IResourceFile,
  IResourceGroup,
  ISimpleRelease,
  IBundleRelease,
  ISeriesMetadata,
} from '@recative/definitions';
import { IBundleProfile, IDeployProfile } from '@recative/extension-sdk';

import type {
  ISetting,
  PostProcessedResourceItemForUpload,
} from '@recative/extension-sdk';

export interface ICollectionDbConfigItem<T> {
  type: 'collection';
  autoupdate: boolean;
  indices: string[];
  key: string;
  __makeLinterHappy?: T;
}

export interface IViewDbConfigItem<T> {
  type: 'view';
  target: string;
  // In align with the original type definition.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any;
  __makeLinterHappy?: T;
}

function asCollection<P>(
  x: ICollectionDbConfigItem<P>
): ICollectionDbConfigItem<P>;
function asCollection<P>(x: IViewDbConfigItem<P>): IViewDbConfigItem<P>;
// Typing for function overwrite should be any
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function asCollection<P>(x: any): any {
  // Some trick to make linter happy again
  return x as P;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ExtractDatabaseInstanceType<T extends Record<string, any>> = {
  [Key in keyof T]: {
    [K in keyof T[Key]['config']]: T[Key]['config'][K] extends ICollectionDbConfigItem<
      infer D
    >
      ? // eslint-disable-next-line @typescript-eslint/no-explicit-any
        Collection<D extends Record<any, any> ? D : never>
      : T[Key]['config'][K] extends IViewDbConfigItem<infer E>
      ? DynamicView<E extends object ? E : never>
      : never;
  } & {
    $db: Loki;
  };
};

export const DB_CONFIG = {
  resource: {
    file: 'resource.json',
    config: {
      resources: asCollection<IResourceItem>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'label', 'type', 'resourceGroupId', 'importTime'],
        key: 'id',
      }),
      postProcessed: asCollection<PostProcessedResourceItemForUpload>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'label', 'type', 'resourceGroupId', 'importTime'],
        key: 'id',
      }),
      files: asCollection<IResourceFile>({
        type: 'view',
        target: 'resources',
        query: {
          type: { $eq: 'file' },
        },
      }),
      groups: asCollection<IResourceGroup>({
        type: 'view',
        target: 'resources',
        query: {
          type: { $eq: 'group' },
        },
      }),
    },
  },
  cloud: {
    file: 'cloud.json',
    config: {
      dataSlots: asCollection<IDataSlot>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'slug', 'notes', 'createTime', 'updateTime'],
        key: 'id',
      }),
    },
  },
  actPoint: {
    file: 'act-point.json',
    config: {
      actPoints: asCollection<IActPoint>({
        type: 'collection',
        autoupdate: true,
        indices: [
          'id',
          'label',
          'firstLevelPath',
          'secondLevelPath',
          'fullPath',
        ],
        key: 'id',
      }),
    },
  },
  episode: {
    file: 'episode.json',
    config: {
      assets: asCollection<IAsset>({
        type: 'collection',
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
        key: 'id',
      }),
      episodes: asCollection<IEpisode>({
        type: 'collection',
        autoupdate: true,
        key: 'id',
        indices: ['id', 'label', 'order', 'largeCoverResourceId', 'createTime'],
      }),
    },
  },
  release: {
    file: 'release.json',
    config: {
      mediaReleases: asCollection<ISimpleRelease>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'committer', 'commitTime', 'notes'],
        key: 'id',
      }),
      codeReleases: asCollection<ISimpleRelease>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'committer', 'commitTime', 'notes'],
        key: 'id',
      }),
      bundleReleases: asCollection<IBundleRelease>({
        type: 'collection',
        autoupdate: true,
        indices: [
          'id',
          'codeBuildId',
          'mediaBuildId',
          'committer',
          'commitTime',
          'notes',
        ],
        key: 'id',
      }),
    },
  },
  series: {
    file: 'series.json',
    config: {
      metadata: asCollection<ISeriesMetadata>({
        type: 'collection',
        autoupdate: true,
        indices: [],
        key: 'id',
      }),
    },
  },
  setting: {
    file: 'setting.json',
    config: {
      setting: asCollection<ISetting>({
        type: 'collection',
        autoupdate: true,
        indices: ['key', 'value'],
        key: 'key',
      }),
      bundleProfiles: asCollection<IBundleProfile>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'label', 'packageId'],
        key: 'id',
      }),
      deployProfiles: asCollection<IDeployProfile>({
        type: 'collection',
        autoupdate: true,
        indices: ['id', 'label'],
        key: 'id',
      }),
    },
  },
};

export interface IDbInstance<T>
  extends ExtractDatabaseInstanceType<typeof DB_CONFIG> {
  path: string;
  additionalData: T;
}
