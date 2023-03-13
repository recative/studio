import { h32 } from 'xxhashjs';
import { join } from 'path';
import { fileSync } from 'tmp';
import { createHash } from 'crypto';
import { ensureDirSync } from 'fs-extra';
import { readFile, writeFile } from 'fs/promises';

import {
  Zip,
  ffmpeg,
  ffprobe,
  waveform,
  screenshot,
  getFilePath,
  getFileBuffer,
  imageThumbnail,
} from '@recative/extension-sdk';
import type {
  Uploader,
  ResourceProcessor,
  IResourceExtensionDependency,
  PostProcessedResourceItemForUpload,
  PostProcessedResourceItemForImport,
} from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import { Category, IResourceFile } from '@recative/definitions';

import { getDb } from '../rpc/db';
import { extensions } from '../extensions';
import { cleanupLoki } from '../rpc/query/utils/cleanupLoki';
import { getWorkspace } from '../rpc/workspace';
import { logToTerminal } from '../rpc/query/terminal';

import { getExtensionConfig } from './getExtensionConfig';
import { getResourceFilePath } from './getResourceFile';
import { writePathToResource } from './writePathToResource';
import { writeBufferToResource } from './writeBufferToResource';
import { insertPostProcessedFileDefinition } from './insertPostProcessedFileDefinition';
import { updatePostProcessedFileDefinition } from './updatePostProcessedFileDefinition';

const resourceProcessorDependencies: IResourceExtensionDependency = {
  getResourceFilePath,
  writePathToResource,
  writeBufferToResource,
  writeBufferToPostprocessCache: async (buffer: Buffer, fileName: string) => {
    const workspace = getWorkspace();
    const postProcessedPath = join(workspace.mediaPath, 'post-processed');
    ensureDirSync(postProcessedPath);
    const filePath = join(postProcessedPath, fileName);
    await writeFile(filePath, buffer);
    return filePath;
  },
  writeBufferToTemporaryFile: async (buffer: Buffer) => {
    const file = fileSync();
    await writeFile(file.name, buffer);

    return file.name;
  },
  updateResourceDefinition: async (
    resource:
      | IResourceFile
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport
  ) => {
    const db = await getDb();

    const resourceId = resource.id;

    const resourceDefinition = db.resource.resources.findOne({
      id: resourceId,
    });

    if (!resourceDefinition) {
      throw new Error(`Resource ${resourceId} not found`);
    }

    Object.keys(cleanupLoki(resourceDefinition)).forEach((x) => {
      if (x === 'fileName') return;
      if (x === 'postProcessRecord') return;

      if (x in resource) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (resourceDefinition as any)[x] = (resource as any)[x];
      }
    });

    db.resource.resources.update(resourceDefinition);
  },
  insertPostProcessedFileDefinition,
  updatePostProcessedFileDefinition,
  readPathAsBuffer: (path: string) => readFile(path) as Promise<Buffer>,
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logToTerminal: logToTerminal as any,
  createTemporaryZip: () => new Zip(fileSync().name),
  md5Hash: (x: Buffer) => {
    return createHash('md5').update(x).digest('hex');
  },
  xxHash: (x: Buffer) => h32(x, 0x1bf52).toString(16),
  ffmpeg,
  ffprobe,
  waveform,
  screenshot,
  getFilePath,
  getFileBuffer,
  imageThumbnail,
};

/**
 * Initialize all necessary resource processor instances.
 * @returns A map of uploader instances.
 */
export const getResourceProcessorInstances = async (terminalId: string) => {
  const projectResourceProcessor: Record<
    string,
    ResourceProcessor<string>
  > = {};
  extensions.forEach((extension) => {
    const extensionResourceProcessor = extension.resourceProcessor;

    extensionResourceProcessor?.forEach((ResourceProcessorClass) => {
      projectResourceProcessor[ResourceProcessorClass.id] =
        // @ts-ignore
        new ResourceProcessorClass({}, { ...resourceProcessorDependencies });

      projectResourceProcessor[
        ResourceProcessorClass.id
      ].dependency.logToTerminal = (
        message: string | [string, string],
        logLevel?: TerminalMessageLevel
      ) => {
        logToTerminal(terminalId, message, logLevel);
      };
    });
  });

  return projectResourceProcessor;
};

/**
 * Initialize all necessary uploader instances.
 * @param categories Categories of resources.
 * @returns A map of uploader instances.
 */
export const getUploaderInstances = async (
  categories: Category[],
  uploadProfileIds: string[]
) => {
  const db = await getDb();

  const uploadProfiles = db.setting.uploadProfile.find({
    id: { $in: uploadProfileIds },
  });

  const extensionIds = new Set(
    uploadProfiles.map((x) => x.uploaderExtensionId)
  );

  const ProjectUploader: Record<string, typeof Uploader<string>> = {};

  extensions.forEach((extension) => {
    const extensionUploader = extension.uploader;

    extensionUploader
      ?.filter((x) => extensionIds?.has(x.id) ?? true)
      .forEach((UploaderClass) => {
        for (let i = 0; i < UploaderClass.acceptedFileCategory.length; i += 1) {
          const category = UploaderClass.acceptedFileCategory[i];

          if (!categories.includes(category)) continue;

          ProjectUploader[UploaderClass.id] = UploaderClass;

          break;
        }
      });
  });

  const result: Record<
    string,
    { uploader: Uploader<string>; fileCategory: string[] }
  > = {};

  uploadProfiles.map(async (profile) => {
    const UploaderClass = ProjectUploader[profile.uploaderExtensionId];

    if (!UploaderClass) return;

    let matchedCategories = 0;

    const extensionConfig = await getExtensionConfig(
      profile.extensionConfigurations
    );

    for (let i = 0; i < UploaderClass.acceptedFileCategory.length; i += 1) {
      const category = UploaderClass.acceptedFileCategory[i];

      const categoryValue = Object.entries(
        profile.extensionConfigurations
      ).find(([key]) => key === `${UploaderClass.id}~~##${category}`)?.[1];

      if (categoryValue !== 'yes') continue;

      matchedCategories += 1;
    }

    if (matchedCategories > 0) {
      result[profile.id] = {
        // @ts-ignore
        uploader: new UploaderClass(extensionConfig[UploaderClass.id]),
        fileCategory: UploaderClass.acceptedFileCategory,
      };
    }
  });

  return result;
};
