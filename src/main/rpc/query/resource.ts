/* eslint-disable no-await-in-loop */
import { basename, join as joinPath, parse as parsePath } from 'path';

import PQueue from 'p-queue';
import { nanoid } from 'nanoid';
import { copyFile, writeFile } from 'fs/promises';
import { uniqBy, cloneDeep } from 'lodash';
import { copy, removeSync, existsSync } from 'fs-extra';

import {
  Category,
  groupTags,
  PreloadLevel,
  categoryTags,
  imageCategoryTag,
  textureGroupResourceTag,
  MANAGED_RESOURCE_FILE_KEYS,
  cleanUpResourceListForClient,
} from '@recative/definitions';

import type {
  IResourceFile,
  IResourceGroup,
  IResourceItem,
} from '@recative/definitions';

import { IPostProcessedResourceFileForImport } from '@recative/extension-sdk';
import {
  generateImageThumbnail,
  generateAudioThumbnail,
  generateBase64Thumbnail,
} from '../ffmpeg/thumbnail';
import { preprocessVideo } from '../ffmpeg/preprocessVideo';

import { getDb } from '../db';
import { getMimeType } from '../../utils/getMimeType';
import { getWorkspace } from '../workspace';
import { getReleasedDb } from '../../utils/getReleasedDb';
import { getThumbnailSrc } from '../../utils/getThumbnailSrc';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { getFileHash, getFilePathHash } from '../../utils/getFileHash';
import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';
import { injectResourceUrlForResourceManager } from '../../utils/injectResourceUrl';

import { cleanupLoki } from './utils';

type GroupTag = typeof groupTags[number];

const ffQueue = new PQueue({ concurrency: 3 });

const MEDIA_CATEGORIES = [
  {
    type: Category.Image,
    checker: (mimeType: string) => mimeType.startsWith('image/'),
  },
  {
    type: Category.Video,
    checker: (mimeType: string) => mimeType.startsWith('video/'),
  },
  {
    type: Category.Audio,
    checker: (mimeType: string) => mimeType.startsWith('audio/'),
  },
  {
    type: Category.Subtitle,
    checker: (mimeType: string) => mimeType === 'application/x-subrip',
  },
  {
    type: Category.Triggers,
    checker: (_: string, filePath: string) =>
      filePath.endsWith('.triggers.json'),
  },
  { type: Category.Others, checker: () => true },
] as const;

const BASE_SEARCH_TERM = {
  $or: [{ resourceGroupId: { $eq: '' } }, { type: { $eq: 'group' } }],
};

const searchTermAndResourceTypeQuery = (
  searchTerm?: string,
  baseSearchTerm: object = BASE_SEARCH_TERM
) =>
  searchTerm
    ? {
        $and: [
          {
            $or: [
              { label: { $contains: searchTerm } },
              { id: { $contains: searchTerm } },
            ],
          },
          baseSearchTerm,
        ],
      }
    : baseSearchTerm;

export const getFileCategoryTag = (mimeType: string, filePath: string) => {
  const tag = MEDIA_CATEGORIES.find((description) =>
    description.checker(mimeType, filePath)
  );

  return tag?.type || Category.Others;
};

export const searchTextureResources = async (query = '', limit = 40) => {
  const db = await getDb();

  const searchResult = db.resource.resources
    .chain()
    .find({
      $and: [
        {
          $or: [{ id: { $regex: query } }, { label: { $regex: [query, 'i'] } }],
        },
        {
          $or: [
            {
              type: 'file',
              resourceGroupId: '',
              tags: {
                $containsAny: [imageCategoryTag],
              },
            },
            {
              type: 'group',
              tags: {
                $containsAny: [textureGroupResourceTag],
              },
            },
          ],
        },
      ],
    })
    .limit(limit)
    .data();

  return uniqBy(searchResult, 'id');
};

export const searchFileResources = async (query = '', limit = 40) => {
  const db = await getDb();

  const searchResult = db.resource.resources
    .chain()
    .find({
      $and: [
        {
          $or: [{ id: { $contains: query } }, { label: { $contains: query } }],
        },
        {
          type: 'file',
        },
      ],
    })
    .limit(limit)
    .data();

  return uniqBy(searchResult, 'id');
};

export const removeResource = async (itemId: string, hard: boolean) => {
  const db = await getDb();
  const workspaceConfiguration = getWorkspace();

  const item = db.resource.resources.findOne({ id: itemId });

  if (!item) return;

  if (item.type === 'group') {
    await Promise.all(item.files.map((file) => removeResource(file, hard)));
  }

  if (hard) {
    db.resource.resources.remove(item);
    if (item.type === 'file') {
      const filePath = getResourceFilePath({ id: itemId });
      removeSync(filePath);

      if (item.thumbnailSrc) {
        const thumbnailPath = joinPath(
          workspaceConfiguration.mediaPath,
          basename(item.thumbnailSrc)
        );
        removeSync(thumbnailPath);
      }
    }
  } else {
    item.removed = true;
    item.removedTime = Date.now();
    db.resource.resources.update(item);
  }

  await Promise.all(
    db.resource.resources
      .find({ managedBy: item.id })
      .map((x) => removeResource(x.id, hard))
  );
};

export const removeFileFromGroup = async (resource: IResourceFile) => {
  const db = await getDb();

  const resourceDb = db.resource.resources;

  // Remove item from original group.
  if (resource.resourceGroupId) {
    const targetFile = resourceDb.findOne({ id: resource.id, type: 'file' }) as
      | IResourceFile
      | undefined;
    const originalGroup = resourceDb.findOne({
      id: resource.resourceGroupId,
      type: 'group',
    }) as IResourceGroup | undefined;

    if (!targetFile) {
      throw new Error('File not found');
    }

    if (!originalGroup) {
      throw new Error('Group not found');
    }

    targetFile.resourceGroupId = '';
    resourceDb.update(targetFile);

    originalGroup.files = originalGroup.files.filter(
      (item) => item !== resource.id
    );

    resourceDb.update(originalGroup);
  }
};

export const addFileToGroup = async (
  resource: IResourceFile,
  groupId: string
) => {
  const db = await getDb();

  const resourceDb = db.resource.resources;

  // Add new group id.
  const targetFile = resourceDb.findOne({ id: resource.id, type: 'file' }) as
    | IResourceFile
    | undefined;
  const targetGroup = resourceDb.findOne({
    id: groupId,
    type: 'group',
  }) as IResourceGroup | undefined;

  if (!targetFile) {
    throw new Error('File not found');
  }

  if (!targetGroup) {
    throw new Error('Group not found');
  }

  await removeFileFromGroup(resource);

  targetFile.resourceGroupId = groupId;
  resourceDb.update(targetFile);

  targetGroup.files = [
    ...targetGroup.files.filter((r) => r !== resource.id),
    resource.id,
  ];
  resourceDb.update(targetGroup);
};

export const getResource = async (
  resourceId: string,
  excludeRemoved = true,
  bundleReleaseId?: number
) => {
  const db = await getReleasedDb(bundleReleaseId);

  const resource = (db.resource.resources.findOne({
    id: resourceId,
    removed: excludeRemoved ? false : undefined,
  }) ??
    db.resource.postProcessed.findOne({
      id: resourceId,
    })) as IResourceItem;

  if (!resource) return null;

  return resource;
};

type Mutable<Type> = {
  -readonly [Key in keyof Type]: Type[Key];
};

const updateManagedResources = async (item: IResourceItem) => {
  if (item.type !== 'file') {
    return;
  }

  const db = await getDb();

  db.resource.resources
    .find({
      type: 'file',
      managedBy: item.id,
    })
    .forEach((managedItem) => {
      MANAGED_RESOURCE_FILE_KEYS.forEach((key) => {
        if (key === 'tags') {
          managedItem[key] = item[key].filter((x) => !x.endsWith('!'));
        } else {
          (managedItem as any)[key] = item[key];
        }
      });

      db.resource.resources.update(managedItem);
    });
};

/**
 * Update or replace a resource item, this method will check if the file is
 * already available not by checking the id of it, if existed, an update will be
 * executed.
 * @param items The items to be updated or inserted.
 * @param replaceFileId If you want to replace a file instead of insert or
 *                      update it, you can specify the file id here.
 */
export const updateOrInsertResources = async (
  items: IResourceItem[],
  replaceFileId?: string
) => {
  let trueItems: IResourceItem[] = items;

  const db = await getDb();

  let replacedFile: IResourceItem | null = null;

  if (replaceFileId) {
    replacedFile = await getResource(replaceFileId);

    if (!replacedFile) {
      throw new TypeError(`Resource with id "${replaceFileId}" not found`);
    }

    if (replacedFile.type !== 'file') {
      throw new TypeError(`Resource with id "${replaceFileId}" is not a file`);
    }

    // This is a weak way to make sure replaced file and new file are in the same type
    const matchedNewItem = items.find(
      (item) =>
        item.type === 'file' &&
        item.mimeType.split('/')[0] ===
          (replacedFile as IResourceFile).mimeType.split('/')[0]
    ) as IResourceFile;

    if (!matchedNewItem) {
      throw new TypeError(
        `Resource with id "${replaceFileId}" is not a file with the same mimeType`
      );
    }

    const clonedOldResource = cleanupLoki(cloneDeep(replacedFile)) as Mutable<
      typeof replacedFile
    >;

    clonedOldResource.id = matchedNewItem.id;
    clonedOldResource.url = {};
    clonedOldResource.duration = matchedNewItem.duration;
    clonedOldResource.mimeType = matchedNewItem.mimeType;
    clonedOldResource.thumbnailSrc = matchedNewItem.thumbnailSrc;
    clonedOldResource.importTime = matchedNewItem.importTime;
    clonedOldResource.originalHash = matchedNewItem.originalHash;
    clonedOldResource.convertedHash = matchedNewItem.convertedHash;

    removeResource(replaceFileId, false);
    removeFileFromGroup(replacedFile);
    trueItems = [clonedOldResource];
  }

  trueItems.forEach((item) => {
    const itemInDb = db.resource.resources.findOne({ id: item.id });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      db.resource.resources.update(itemInDb);
      updateManagedResources(item);
    } else {
      // Insert
      db.resource.resources.insert(item);
    }
  });

  if (replaceFileId && replacedFile && replacedFile.resourceGroupId) {
    const nextResource = await getResource(trueItems[0].id);

    if (!nextResource) {
      throw new TypeError('File was not inserted successfully');
    }

    if (nextResource.type !== 'file') {
      throw new TypeError('Resource is not a file');
    }

    addFileToGroup(nextResource, replacedFile.resourceGroupId);
  }
};

export const listAllResources = async (
  hideFileInGroup?: boolean,
  searchTerm?: string
): Promise<IResourceItem[]> => {
  const db = await getDb();
  const result = db.resource.resources
    .chain()
    .find(
      hideFileInGroup
        ? {
            removed: false,
            ...searchTermAndResourceTypeQuery(searchTerm),
          }
        : {
            removed: false,
          }
    )
    .simplesort('importTime', { desc: true })
    .data();

  return result;
};

export const listAllDetailedResourcesForClient = async (
  replaceUrl = false,
  resourceHostName = 'localhost:9999',
  resourceProtocol = 'http'
) => {
  const resources = await listAllResources();
  const cleanedResources = cleanUpResourceListForClient(resources, false);
  if (!replaceUrl) return cleanedResources;
  return injectResourceUrlForResourceManager(
    cleanedResources,
    resourceHostName,
    resourceProtocol
  );
};

export const filterResourceByEpisodeId = async (
  episodeIds: string[],
  searchTerm?: string
): Promise<IResourceItem[]> => {
  const db = await getDb();
  const emptyIdsQuery =
    episodeIds[0] === 'empty' ? { $size: 0 } : { $containsAny: episodeIds };

  const resourceGroups = new Set(
    db.resource.resources
      .chain()
      .find({
        removed: false,
        episodeIds: emptyIdsQuery,
        type: { $eq: 'file' },
      })
      .simplesort('importTime', { desc: true })
      .data()
      .map((resource) => resource.resourceGroupId)
      .filter(
        ((x) => x !== undefined) as (x: string | undefined) => x is string
      )
  );

  const result = db.resource.resources
    .chain()
    .find({
      removed: false,
      ...searchTermAndResourceTypeQuery(searchTerm, {
        $or: [
          {
            resourceGroupId: { $eq: '' },
            episodeIds: emptyIdsQuery,
          },
          {
            type: { $eq: 'group' },
            id: { $in: Array.from(resourceGroups) },
          },
        ],
      }),
    })
    .simplesort('importTime', { desc: true })
    .data();

  return result;
};

export const filterResourceByTag = async (
  tags: string[],
  searchTerm?: string
): Promise<IResourceItem[]> => {
  const q = {
    removed: false,
    tags: { $containsAny: tags },
    ...searchTermAndResourceTypeQuery(searchTerm),
  };

  const db = await getDb();
  const result = db.resource.resources
    .chain()
    .find(q)
    .simplesort('importTime', { desc: true })
    .data();

  return result;
};

export const listGroups = async (groupId: string[]) => {
  const db = await getDb();

  const groups = db.resource.resources.find({
    removed: false,
    type: 'group',
    id: { $in: groupId },
  }) as IResourceGroup[];

  return groups;
};

export const listFiles = async (fileId: string[]) => {
  const db = await getDb();

  const files = db.resource.resources.find({
    type: 'file',
    removed: false,
    id: { $in: fileId },
  }) as IResourceFile[];

  return files;
};

export const getGroup = async (groupId: string) => {
  const db = await getDb();

  const group = db.resource.resources.findOne({
    type: 'group',
    id: groupId,
    removed: false,
  }) as IResourceGroup;

  if (!group) return null;
  if (group.type !== 'group') return null;

  const files = db.resource.resources.find({
    id: {
      $in: group.files,
    },
  }) as IResourceFile[];

  return { group, files };
};

export const splitGroup = async (groupIds: string[]) => {
  const db = await getDb();

  const groups = await listGroups(groupIds);

  const fileIds: string[] = [];

  groups.forEach((group) => {
    fileIds.push(...group.files);
  });

  const files = await listFiles(fileIds);

  files.forEach((file) => {
    file.resourceGroupId = '';

    db.resource.resources.update(file);
  });

  groups.forEach((group) => {
    db.resource.resources.remove(group);
  });
};

export const updateFilesOfGroup = async (groupId: string, files: string[]) => {
  const db = await getDb();

  const resourceDb = db.resource.resources;

  const group = resourceDb.findOne({
    id: groupId,
    type: 'group',
  }) as IResourceGroup | undefined;

  if (!group) {
    throw new TypeError('Group not found');
  }

  group.files = files;

  resourceDb.update(group);
};

export interface ResourceWithDetailedFileList {
  group: IResourceGroup | null;
  files: IResourceFile[];
}

export const getResourceWithDetailedFileList = async (
  itemId: string
): Promise<ResourceWithDetailedFileList | null> => {
  const db = await getDb();

  const result = db.resource.resources.findOne({ id: itemId });

  if (!result) return null;

  if (result.type === 'file') {
    return { group: null, files: [result as IResourceFile] };
  }

  const files = await listFiles(result.files);

  return { group: result as IResourceGroup, files };
};

export const listFlattenResource = async (itemIds: string[]) => {
  const [files, groups] = await Promise.all([
    await listFiles(itemIds),
    await listGroups(itemIds),
  ]);

  const filesInGroups: string[] = [];
  groups.forEach((group) => {
    filesInGroups.push(...group.files);
  });

  const filesInGroup = await listFiles(filesInGroups);

  const flattenResources = Array.from(new Set([...filesInGroup, ...files]));

  return { flatten: flattenResources, files, groups };
};

export const mergeResources = async (itemIds: string[], tag: GroupTag) => {
  const db = await getDb();
  const { flatten: flattenResources, groups } = await listFlattenResource(
    itemIds
  );

  if (!flattenResources.length) return;

  const newGroup: IResourceGroup = {
    type: 'group',
    id: nanoid(),
    label: flattenResources[0].label
      ? `${flattenResources[0].label} and more`
      : 'Untitled Group',
    thumbnailSrc: flattenResources[0].thumbnailSrc,
    tags: [tag.id],
    importTime: Date.now(),
    files: flattenResources.map((x) => x.id),
    removed: false,
    removedTime: -1,
  };

  updateOrInsertResources([newGroup]);

  groups.forEach((group) => {
    db.resource.resources.remove(group);
  });
  flattenResources.forEach((file) => {
    file.resourceGroupId = newGroup.id;
    db.resource.resources.update(file);
  });

  const resourceProcessorInstances = Object.entries(
    await getResourceProcessorInstances('')
  );

  // Preprocessing the resources
  let postProcessedGroup = newGroup;
  let postProcessedFiles: (
    | IPostProcessedResourceFileForImport
    | IResourceFile
  )[] = flattenResources;
  for (let i = 0; i < resourceProcessorInstances.length; i += 1) {
    const [, processor] = resourceProcessorInstances[i];

    const processedFiles = await processor.afterGroupCreated(
      postProcessedFiles,
      postProcessedGroup
    );

    if (processedFiles) {
      postProcessedGroup = processedFiles.group;
      postProcessedFiles = processedFiles.files;
    }
  }

  const allItems: IResourceItem[] = [postProcessedGroup];
  await Promise.all(
    postProcessedFiles.map(async (file) => {
      let item: IResourceFile;

      if ('postProcessedFile' in file) {
        const { postProcessedFile, ...resourceDefinition } = file;

        if (typeof postProcessedFile === 'string') {
          await copyFile(postProcessedFile, getResourceFilePath(file));
        } else {
          await writeFile(getResourceFilePath(file), postProcessedFile);
        }

        item = resourceDefinition;
      } else {
        item = file;
      }

      if (!allItems.find((x) => x.id === item.id)) {
        allItems.push(item);
      }
    })
  );

  await updateOrInsertResources(allItems);
};

export const updateResourceLabel = async (itemId: string, label: string) => {
  const db = await getDb();

  const group = db.resource.resources.findOne({ id: itemId });

  if (group) {
    group.label = label;
    db.resource.resources.update(group);
  }
};

export const removeResources = async (itemIds: string[], hard: boolean) => {
  return Promise.all(itemIds.map((itemId) => removeResource(itemId, hard)));
};

export const listBrokenResource = async () => {
  const db = await getDb();

  const resources = db.resource.resources.find({
    type: 'file',
    removed: false,
  });

  return resources.filter((resource) => {
    return !existsSync(getResourceFilePath(resource));
  });
};

export const replaceResourceFile = async (
  filePath: string,
  resource: IResourceFile
) => {
  await copy(filePath, getResourceFilePath(resource));
};

export const eraseResourceUrl = async (extensionId: string) => {
  const db = await getDb();

  const files = db.resource.resources.find({
    type: 'file',
  }) as IResourceFile[];

  files.forEach((file) => {
    if (!file.url) return;
    if (extensionId in file.url) {
      delete file.url[extensionId];
      db.resource.resources.update(file);
    }
  });
};

export const getAllImageResource = async () => {
  const db = await getDb();

  return db.resource.resources
    .find({})
    .filter((x) => x.type === 'file' && x.mimeType.startsWith('image/'));
};

export const replaceThumbnail = async (
  resourceId: string,
  thumbnailBase64: string
) => {
  const workspace = getWorkspace();

  const thumbnailFileName = `${resourceId}-thumbnail.png`;
  const thumbnailPath = joinPath(workspace.mediaPath, thumbnailFileName);

  return generateBase64Thumbnail(thumbnailBase64, thumbnailPath);
};

export const importFile = async (
  filePath: string,
  thumbnailBase64: string | null = null,
  replaceFileId?: string
): Promise<IResourceItem[]> => {
  const workspace = getWorkspace();
  const mimeType = await getMimeType(filePath);
  const category = getFileCategoryTag(mimeType, filePath);
  const categoryTag = categoryTags.find((tag) => tag.id === category);

  const replacedFile = replaceFileId ? await getResource(replaceFileId) : null;
  if (replacedFile && replacedFile.type !== 'file') {
    throw new TypeError('Resource is not a file');
  }

  if (replaceFileId && !replacedFile) {
    throw new TypeError('Resource not found');
  }

  const id = nanoid();
  const thumbnailFileName = `${id}-thumbnail.png`;
  const hash = await getFilePathHash(filePath);

  const thumbnailPath = joinPath(workspace.mediaPath, thumbnailFileName);

  let preprocessedMetadata: IResourceItem[] | null = null;

  const result = await ffQueue.add(async () => {
    let generatedThumbnail = true;

    try {
      if (thumbnailBase64) {
        await generateBase64Thumbnail(thumbnailBase64, thumbnailPath);
      } else if (category === Category.Image) {
        await generateImageThumbnail(filePath, thumbnailPath);
      } else if (category === Category.Video) {
        // await generateVideoThumbnail(filePath, thumbnailPath);
        preprocessedMetadata = await preprocessVideo(
          filePath,
          workspace.mediaPath,
          hash
        );
      } else if (category === Category.Audio) {
        await generateAudioThumbnail(filePath, thumbnailPath);
      } else {
        generatedThumbnail = false;
      }
    } catch (e) {
      if (e instanceof Error && e.message !== 'No output specified') {
        // Nope, I just don't want to do anything ¯\_(ツ)_/¯
        generatedThumbnail = false;
      }
    } finally {
      if (!preprocessedMetadata) {
        await copy(filePath, getResourceFilePath({ id }));
      }
    }

    if (preprocessedMetadata) {
      updateOrInsertResources(preprocessedMetadata, replaceFileId);
      return preprocessedMetadata;
    }

    const metadata: IResourceFile = {
      type: 'file',
      id,
      label: parsePath(filePath).name,
      episodeIds: [],
      mimeType,
      originalHash: hash,
      convertedHash: await getFileHash({ id }),
      url: {},
      managedBy: null,
      cacheToHardDisk: false,
      preloadLevel: PreloadLevel.None,
      preloadTriggers: [],
      tags: categoryTag ? [categoryTag.id] : [],
      thumbnailSrc: generatedThumbnail
        ? getThumbnailSrc(thumbnailFileName)
        : null,
      duration: null,
      resourceGroupId: '',
      importTime: Date.now(),
      removed: false,
      removedTime: -1,
      extensionConfigurations: {},
    };

    updateOrInsertResources([metadata], replaceFileId);

    return [metadata];
  });

  return result;
};
