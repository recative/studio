import log from 'electron-log';
import { pick } from 'lodash';
import { join } from 'path';
import { emptyDir } from 'fs-extra';

import { Category } from '@recative/definitions';
import type { IConfigUiField, IScript } from '@recative/extension-sdk';

import { cloneDeep } from '../../utils/cloneDeep';
import { extensions } from '../../extensions';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';

interface IExtensionDescription {
  id: string;
  label: string;
  iconId?: string;
  extensionConfigUiFields?: IConfigUiField[];
  profileConfigUiFields?: IConfigUiField[];
  resourceConfigUiFields?: IConfigUiField[];
  nonMergeableResourceExtensionConfiguration?: string[];
  acceptedFileCategory?: Category;
  scripts?: IScript[];
}

const extensionMetadata = {
  uploader: [] as IExtensionDescription[],
  resourceProcessor: [] as IExtensionDescription[],
  bundler: [] as IExtensionDescription[],
  scriptlet: [] as IExtensionDescription[],
  deployer: [] as IExtensionDescription[],
} as const;

extensions.forEach((extension) => {
  if ('uploader' in extension && extension.uploader) {
    const uploaders = extension.uploader.map((item) => {
      const clonedConfig = cloneDeep(
        pick(item, ['id', 'label', 'configUiFields'])
      );

      const result = {
        id: clonedConfig.id,
        label: clonedConfig.label,
        acceptedFileCategory: item.acceptedFileCategory,
        extensionConfigUiFields: [
          {
            id: 'acceptedFileType',
            type: 'groupedBoolean',
            label: 'Accepted File',
            ids: item.acceptedFileCategory.map((x) => `##${x}`),
            labels: item.acceptedFileCategory.map((x) => x.split(':')[1]),
          } as const,
          ...clonedConfig.configUiFields,
        ],
      };

      return result;
    });

    extensionMetadata.uploader.push(...(uploaders as any));
  }

  if ('resourceProcessor' in extension && extension.resourceProcessor) {
    const extensionList = extension.resourceProcessor.map((item) => {
      const description = cloneDeep(
        pick(item, [
          'id',
          'label',
          'extensionConfigUiFields',
          'resourceConfigUiFields',
          'nonMergeableResourceExtensionConfiguration',
        ])
      );

      return description;
    });
    extensionMetadata.resourceProcessor.push(
      ...(extensionList as IExtensionDescription[])
    );
  }

  if ('bundler' in extension && extension.bundler) {
    const extensionList = extension.bundler.map((item) => {
      const description = cloneDeep(
        pick(item, [
          'id',
          'label',
          'iconId',
          'profileConfigUiFields',
          'extensionConfigUiFields',
        ])
      );

      return description;
    });
    extensionMetadata.bundler.push(
      ...(extensionList as IExtensionDescription[])
    );
  }

  if ('deployer' in extension && extension.deployer) {
    const extensionList = extension.deployer.map((item) => {
      const description = cloneDeep(pick(item, ['id', 'label']));

      return description;
    });
    extensionMetadata.deployer.push(
      ...(extensionList as IExtensionDescription[])
    );
  }

  if ('scriptlet' in extension && extension.scriptlet) {
    const extensionList = extension.scriptlet.map((item) => {
      const description = cloneDeep(
        pick(item, ['id', 'label', 'extensionConfigUiFields', 'scripts'])
      );

      return description;
    });
    extensionMetadata.scriptlet.push(
      ...(extensionList as IExtensionDescription[])
    );
  }
});

export const getExtensionMetadata = () => {
  return extensionMetadata;
};

export const purgePostProcessRecords = async () => {
  const workspace = getWorkspace();
  const postProcessedPath = join(workspace.mediaPath, 'post-processed');
  const db = await getDb();
  log.log(`:: Purging post-processed records from ${postProcessedPath}`);
  db.resource.postProcessed.removeWhere((x) => !!x);
  await emptyDir(postProcessedPath);
  log.log(`:: Done ${postProcessedPath}`);
};
