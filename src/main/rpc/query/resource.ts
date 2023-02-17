import { basename, parse as parsePath } from 'path';

import console from 'electron-log';
import { nanoid } from 'nanoid';
import { uniqBy } from 'lodash';
import { copy, pathExists, remove } from 'fs-extra';

import {
  Category,
  groupTags,
  categoryTags,
  imageCategoryTag,
  textureGroupResourceTag,
  MANAGED_RESOURCE_FILE_KEYS,
  cleanUpResourceListForClient,
  PreloadLevel,
} from '@recative/definitions';

import type {
  IResourceItem,
  IResourceFile,
  IResourceGroup,
} from '@recative/definitions';

import { getMimeType, ResourceFileForImport } from '@recative/extension-sdk';
import type {
  PostProcessedResourceItemForImport,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

import { cleanupLoki } from './utils/cleanupLoki';
import { importedFileToFile } from './utils/importedFileToFile';

import { getDb } from '../db';

import { getReleasedDb } from '../../utils/getReleasedDb';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { getResourceProcessorInstances } from '../../utils/getResourceProcessorInstances';
import { injectResourceUrlForResourceManager } from '../../utils/injectResourceUrl';

type GroupTag = typeof groupTags[number];

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
          removed: false,
        },
      ],
    })
    .limit(limit)
    .data();

  return uniqBy(searchResult, 'id');
};

export const removeFileFromGroup = async (
  resource: IResourceFile,
  removeManagedFiles = false,
  removedFileIds = [] as string[]
) => {
  const db = await getDb();

  const resourceDb = db.resource.resources;

  // Remove item from original group.
  if (!resource.resourceGroupId) {
    return removedFileIds;
  }

  const targetFile = resourceDb.findOne({ id: resource.id, type: 'file' }) as
    | IResourceFile
    | undefined;

  if (!targetFile) {
    throw new Error('File not found');
  }

  removedFileIds.push(resource.id);

  if (!targetFile?.resourceGroupId) {
    return removedFileIds;
  }

  const originalGroup = resourceDb.findOne({
    id: resource.resourceGroupId,
    type: 'group',
  }) as IResourceGroup | undefined;

  targetFile.resourceGroupId = '';
  resourceDb.update(targetFile);

  if (!originalGroup) {
    console.warn('Group not found');
    return removedFileIds;
  }

  originalGroup.files = originalGroup.files.filter(
    (item) => item !== resource.id
  );

  resourceDb.update(originalGroup);

  if (removeManagedFiles) {
    const managedFiles = resourceDb.find({
      type: 'file',
      managedBy: resource.id,
    }) as IResourceFile[];

    await Promise.all(
      managedFiles.map((managedFile) =>
        removeFileFromGroup(managedFile, removeManagedFiles, removedFileIds)
      )
    );
  }

  return removedFileIds;
};

const removeResourceRecordUpdater = (document: IResourceItem) => {
  document.removed = true;
  document.removedTime = Date.now();
  return document;
};

export const markResourceRecordAsRemoved = async (itemId: string) => {
  const db = await getDb();

  const item = db.resource.resources.findOne({ id: itemId });

  if (!item) {
    console.warn(`${itemId} not found, unable to remove the resource`);
    return null;
  }

  if (item.type === 'group') {
    db.resource.resources.findAndUpdate(
      { resourceGroupId: itemId },
      removeResourceRecordUpdater
    );
  }

  db.resource.resources.findAndUpdate(
    { id: itemId },
    removeResourceRecordUpdater
  );

  if (item.resourceGroupId) {
    return removeFileFromGroup(item, true);
  }

  return null;
};

export const forceRemoveResourceFile = async (itemId: string) => {
  const query = { id: itemId };
  const resourceFilePath = await getResourceFilePath(query);
  const resourceThumbnailPath = await getResourceFilePath(query, true);

  await Promise.all([remove(resourceFilePath), remove(resourceThumbnailPath)]);
};

export const forceRemoveResource = async (itemId: string) => {
  const db = await getDb();

  const item = db.resource.resources.findOne({ id: itemId });

  if (!item) {
    console.warn(`${itemId} not found, unable to remove the resource`);
    return;
  }

  if (item.type === 'group') {
    db.resource.resources.findAndRemove({ resourceGroupId: itemId });
  }

  db.resource.resources.findAndRemove({ id: itemId });

  await forceRemoveResourceFile(itemId);
};

export const removeResources = async (itemIds: string[], hard: boolean) => {
  return Promise.all(
    itemIds.map((itemId) =>
      hard ? forceRemoveResource(itemId) : markResourceRecordAsRemoved(itemId)
    )
  );
};

export const addFileToGroup = async (
  resource: IResourceFile,
  groupId: string,
  bypassManagedByCheck = false
): Promise<Set<string>> => {
  if (resource.resourceGroupId === groupId) {
    return new Set();
  }

  const db = await getDb();

  const resourceDb = db.resource.resources;

  const resourceAdded = new Set<string>();

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

  if ((resource as IResourceItem).type === 'group') {
    throw new TypeError(`Resource could not be a group.`);
  }

  if (
    targetFile.managedBy &&
    targetFile.managedBy !== targetFile.id &&
    !bypassManagedByCheck
  ) {
    const managerFile = resourceDb.findOne({
      id: targetFile.managedBy,
      type: 'file',
    }) as IResourceFile | undefined;

    if (!managerFile) {
      throw new TypeError(`Manager file not found`);
    }

    return addFileToGroup(managerFile, groupId);
  }

  if (!targetGroup) {
    throw new Error('Group not found');
  }

  if (resource.resourceGroupId && resource.resourceGroupId !== groupId) {
    await removeFileFromGroup(resource, false);
  }

  targetFile.resourceGroupId = groupId;
  resourceDb.update(targetFile);

  resourceAdded.add(targetFile.id);

  targetGroup.files = [
    ...targetGroup.files.filter((r) => r !== resource.id),
    resource.id,
  ];
  resourceDb.update(targetGroup);

  const managedFiles = (
    resourceDb.find({
      type: 'file',
      managedBy: resource.id,
    }) as IResourceFile[]
  ).filter((x) => x.id !== resource.id);

  managedFiles.forEach((x) => resourceAdded.add(x.id));

  const operatedManagedFiles = (
    await Promise.all(
      managedFiles.map(async (managedFile) => {
        if (managedFile.resourceGroupId !== groupId) {
          return addFileToGroup(managedFile, groupId, true);
        }

        return new Set<string>();
      })
    )
  ).filter(Boolean);

  operatedManagedFiles.forEach((set) =>
    set.forEach((x) => resourceAdded.add(x))
  );

  return resourceAdded;
};

export const getResource = async (
  resourceId: string,
  bundleReleaseId?: number
) => {
  const db = await getReleasedDb(bundleReleaseId);

  const resource = (db.resource.resources.findOne({
    id: resourceId,
  }) ??
    db.resource.postProcessed.findOne({
      id: resourceId,
    })) as IResourceItem;

  return resource ?? null;
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
          managedItem[key] = [
            ...managedItem[key].filter((x) => x?.endsWith('!')),
            ...item[key].filter((x) => !x?.endsWith('!')),
          ];
        } else {
          // TypeScript can't detect the type of item[key] here.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
 */
export const updateOrInsertResources = async (items: IResourceItem[]) => {
  const db = await getDb();

  await Promise.allSettled(
    items.map(async (item) => {
      // Here're two extra cleanup to prevent some extension blow up the database.
      const { postProcessedThumbnail, postProcessedFile, ...clonedResource } =
        item as unknown as IPostProcessedResourceFileForImport;

      const itemInDb = db.resource.resources.findOne({ id: item.id });
      const targetResource = clonedResource as IResourceItem;

      if (itemInDb) {
        // Update
        Object.assign(itemInDb, targetResource);
        db.resource.resources.update(itemInDb);
        await updateManagedResources(targetResource);
      } else {
        // Insert
        db.resource.resources.insert(targetResource);
      }
    })
  );
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

export const filterResourcePreloadLevel = async (
  preloadLevel: PreloadLevel,
  searchTerm?: string
): Promise<IResourceItem[]> => {
  const db = await getDb();

  const resourceGroups = new Set(
    db.resource.resources
      .chain()
      .find({
        removed: false,
        preloadLevel,
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
            preloadLevel,
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

export const filterGhostFiles = async (): Promise<IResourceItem[]> => {
  const db = await getDb();

  const resourceGroups = new Set(
    db.resource.resources
      .chain()
      .find({
        removed: false,
        type: 'group',
      })
      .data()
      .map((x) => x.id)
  );

  const result = db.resource.resources
    .chain()
    .find({
      removed: false,
      type: 'file',
      resourceGroupId: {
        $nin: [...resourceGroups],
      },
    })
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

  await updateOrInsertResources([newGroup]);

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
      const item =
        'postProcessedFile' in file ? await importedFileToFile(file) : file;

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

export const listBrokenResource = async () => {
  const db = await getDb();

  const resources = db.resource.resources.find({
    type: 'file',
    removed: false,
  });

  const result: IResourceItem[] = [];

  for (let i = 0; i < resources.length; i += 1) {
    const resource = resources[i];

    if (!(await pathExists(await getResourceFilePath(resource)))) {
      result.push(resource);
    }
  }

  return result;
};

export const replaceResourceFile = async (
  filePath: string,
  resource: IResourceFile
) => {
  await copy(filePath, await getResourceFilePath(resource));
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

interface IProgressReport {
  text: string;
  /**
   * The range of this value is [0, 1].
   */
  progress: number;
}

// The key is file path.
const importProgressCache = new Map<string, IProgressReport>();

export const getImportProgress = (filePath: string) => {
  return (
    importProgressCache.get(filePath) ?? {
      text: 'Not running',
      progress: 0,
    }
  );
};

export const removeImportProgress = (filePath: string) => {
  importProgressCache.delete(filePath);
};

export const importFile = async (
  filePath: string,
  replaceFileId?: string
): Promise<IResourceItem[]> => {
  importProgressCache.set(filePath, {
    text: `Analysing ${basename(filePath)}`,
    progress: 0,
  });

  const mimeType = await getMimeType(filePath);
  const category = getFileCategoryTag(mimeType, filePath);
  const categoryTag = categoryTags.find((tag) => tag.id === category);

  const replacedFile = replaceFileId ? await getResource(replaceFileId) : null;

  if (replacedFile && replacedFile.type !== 'file') {
    throw new TypeError(
      `Unable to replace the file, Resource with id "${replaceFileId}" is not a file`
    );
  }

  if (replaceFileId && !replacedFile) {
    throw new TypeError(
      `Unable to replace the file, resource with id "${replaceFileId}" not found`
    );
  }

  const importedFile = new ResourceFileForImport();

  importedFile.definition.label = parsePath(filePath).name;
  if (replacedFile) {
    await importedFile.cloneFrom(cleanupLoki(replacedFile));
  }
  await importedFile.addFile(filePath);

  if (replacedFile) {
    // This is a weak way to make sure replaced file and new file are in the same type
    const newFileMimePrefix = importedFile.definition.mimeType.split('/')[0];
    const replacedFileMimePrefix = replacedFile.mimeType.split('/')[0];
    const itemIsMatched = replacedFileMimePrefix === newFileMimePrefix;

    if (!itemIsMatched) {
      throw new TypeError(
        `Resource with id "${replaceFileId}" is not a file with the same mimeType, old file: ${replacedFile.mimeType}, new file: ${importedFile.definition.mimeType}, they don't have the same prefix`
      );
    }
  }

  importProgressCache.set(filePath, {
    text: `Initializing ${basename(filePath)}`,
    progress: 0,
  });

  if (categoryTag) {
    importedFile.definition.tags = [categoryTag.id];
  }

  let preprocessedFiles: PostProcessedResourceItemForImport[] = [
    await importedFile.finalize(),
  ];

  const resourceProcessorInstances = Object.entries(
    await getResourceProcessorInstances('')
  );

  for (let i = 0; i < resourceProcessorInstances.length; i += 1) {
    importProgressCache.set(filePath, {
      text: `Processing ${basename(filePath)}`,
      progress: i / resourceProcessorInstances.length,
    });

    const [, processor] = resourceProcessorInstances[i];

    const processedFiles = await processor.beforeFileImported(
      preprocessedFiles
    );

    if (processedFiles) {
      preprocessedFiles = processedFiles;
    }
  }

  importProgressCache.set(filePath, {
    text: `Finalizing ${basename(filePath)}`,
    progress: 1,
  });

  if (replacedFile && replaceFileId) {
    const replacedFileGroupId = replacedFile.resourceGroupId;

    await markResourceRecordAsRemoved(replaceFileId);
    await removeFileFromGroup(replacedFile, true);

    if (replacedFileGroupId) {
      preprocessedFiles = preprocessedFiles.filter((x) => x.type === 'file');

      for (let i = 0; i < preprocessedFiles.length; i += 1) {
        const resource = preprocessedFiles[i];

        resource.resourceGroupId = replacedFileGroupId;
      }
    }
  }

  const groupMap = new Map<string, IResourceGroup>();
  const fileMap = new Map<string, IResourceFile>();

  for (let i = 0; i < preprocessedFiles.length; i += 1) {
    const resourceDefinition = preprocessedFiles[i];

    if (resourceDefinition.type === 'group') {
      groupMap.set(resourceDefinition.id, resourceDefinition);
    } else if (resourceDefinition.type === 'file') {
      fileMap.set(
        resourceDefinition.id,
        await importedFileToFile(resourceDefinition)
      );
    }
  }

  for (const [, postProcessedGroup] of groupMap) {
    const convertedFiles = [...fileMap.values()];
    const postProcessedFiles = convertedFiles.filter(
      (x) => x.type === 'file' && x.resourceGroupId === postProcessedGroup.id
    ) as (IPostProcessedResourceFileForImport | IResourceFile)[];

    for (let i = 0; i < resourceProcessorInstances.length; i += 1) {
      const [, processor] = resourceProcessorInstances[i];

      const processedFiles = await processor.afterGroupCreated(
        postProcessedFiles,
        postProcessedGroup
      );

      if (!processedFiles) continue;

      groupMap.set(processedFiles.group.id, processedFiles.group);

      for (let j = 0; j < processedFiles.files.length; j += 1) {
        const postProcessedFile = processedFiles.files[j];

        fileMap.set(
          postProcessedFile.id,
          await importedFileToFile(postProcessedFile)
        );
      }
    }
  }

  const metadataForImport = [...groupMap.values(), ...fileMap.values()];

  await updateOrInsertResources(metadataForImport);

  return metadataForImport;
};
