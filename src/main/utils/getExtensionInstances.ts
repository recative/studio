import md5 from 'md5';
import { h32 } from 'xxhashjs';
import { join } from 'path';
import { fileSync } from 'tmp';
import { ensureDirSync } from 'fs-extra';
import { readFile, writeFile } from 'fs/promises';

import type { Uploader, ResourceProcessor } from '@recative/definitions';

import { Category } from '@recative/definitions';

import { getDb } from '../rpc/db';
import { extensions } from '../extensions';
import { getWorkspace } from '../rpc/workspace';
import { logToTerminal } from '../rpc/query/terminal';

import { getResourceFilePath } from './getResourceFile';

const resourceProcessorDependencies = {
  getResourceFilePath,
  writeBufferToPostprocessCache: (buffer: Buffer, fileName: string) => {
    const workspace = getWorkspace();
    const postProcessedPath = join(workspace.mediaPath, 'post-processed');
    ensureDirSync(postProcessedPath);
    const filePath = join(postProcessedPath, fileName);
    return writeFile(filePath, buffer);
  },
  writeBufferToTemporaryFile: (buffer: Buffer) => {
    const file = fileSync();
    return writeFile(file.name, buffer);
  },
  readPathAsBuffer: (path: string) => readFile(path),
  logToTerminal,
  md5Hash: (x: Buffer) => md5(x),
  xxHash: (x: Buffer) => h32(x, 0x1bf52).toString(16),
};

const getExtensionConfig = async () => {
  const db = await getDb();

  const settings = db.setting.setting.find();

  const result: Record<string, Record<string, string>> = {};

  settings.forEach((setting) => {
    const [uploaderId, settingKey] = setting.key.split('~~');

    if (!uploaderId || settingKey === undefined) return;

    if (!result[uploaderId]) result[uploaderId] = {};
    result[uploaderId][settingKey] = setting.value;
  });

  return result;
};

/**
 * Initialize all necessary resource processor instances.
 * @returns A map of uploader instances.
 */
export const getResourceProcessorInstances = async () => {
  // const extensionConfig = await getExtensionConfig();
  const projectResourceProcessor: Record<
    string,
    ResourceProcessor<string>
  > = {};
  extensions.forEach((extension) => {
    const extensionResourceProcessor = extension.resourceProcessor;

    extensionResourceProcessor?.forEach((ResourceProcessorClass) => {
      projectResourceProcessor[ResourceProcessorClass.id] =
        // @ts-ignore
        new ResourceProcessorClass({}, resourceProcessorDependencies);
    });
  });

  return projectResourceProcessor;
};

/**
 * Initialize all necessary uploader instances.
 * @param categories Categories of resources.
 * @returns A map of uploader instances.
 */
export const getUploaderInstances = async (categories: Category[]) => {
  const db = await getDb();

  const extensionConfig = await getExtensionConfig();
  const projectUploader: Record<
    string,
    { uploader: Uploader<string>; fileCategory: string[] }
  > = {};

  const settings = db.setting.setting.find();

  extensions.forEach((extension) => {
    const extensionUploader = extension.uploader;

    extensionUploader?.forEach((UploaderClass) => {
      if (!(UploaderClass.id in extensionConfig)) return;

      for (let i = 0; i < UploaderClass.acceptedFileCategory.length; i += 1) {
        const category = UploaderClass.acceptedFileCategory[i];

        if (!categories.includes(category)) continue;

        const categoryValue = settings.find(
          (setting) => setting.key === `${UploaderClass.id}~~##${category}`
        )?.value;

        if (categoryValue !== 'yes') continue;

        projectUploader[UploaderClass.id] = {
          // @ts-ignore
          uploader: new UploaderClass(extensionConfig[UploaderClass.id]),
          fileCategory: UploaderClass.acceptedFileCategory,
        };

        break;
      }
    });
  });

  return projectUploader;
};
