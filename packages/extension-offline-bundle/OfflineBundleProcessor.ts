import log from 'electron-log';
import { nanoid } from 'nanoid';
import {
  ResourceProcessor,
  TerminalMessageLevel as Level,
} from '@recative/extension-sdk';

import {
  Category,
  hashObject,
  PreloadLevel,
  IResourceItem,
} from '@recative/definitions';
import type {
  IBundleGroup,
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';
import { pathExists } from 'fs-extra';

export interface OfflineBundleConfig {
  enable: string;
}

export class OfflineBundleProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-offline-bundle/OfflineBundleProcessor';

  static label = 'Offline Bundle';

  static resourceConfigUiFields = [] as const;

  async beforePublishMediaBundle(
    resources: IPostProcessedResourceFileForUpload[],
    mediaBuildId: number,
    bundleGroups: IBundleGroup[]
  ) {
    let totalTasks = 0;
    let cachedTasks = 0;
    let skippedTasks = 0;
    let successfulTasks = 0;
    let failedTasks = 0;
    const failRecords: Record<string, Error> = {};

    const tasks = await Promise.all(
      ResourceProcessor.mapBundleGroup(
        resources,
        bundleGroups,
        async (resource, group) => {
          totalTasks += 1;
          const files: IPostProcessedResourceFileForUpload[] = resource.filter(
            (x) =>
              x.type === 'file' &&
              // We should not include the bundle file since it will cause
              // circular 0bundling.
              !(
                `${OfflineBundleProcessor.id}~~includes` in
                x.extensionConfigurations
              )
          );

          if (!files.length) {
            skippedTasks += 1;
            return null;
          }

          if (group.episodeIsEmpty) {
            skippedTasks += 1;
            return null;
          }

          const resourceId = nanoid();

          const entryIds = files.map((x) => x.id).sort();
          const groupHash = hashObject({
            files: entryIds,
          });

          const resourceDescription: IPostProcessedResourceFileForUpload = {
            type: 'file',
            id: resourceId,
            fileName: '',
            label: `Recative Offline Bundle ${resourceId}`,
            postProcessRecord: {
              mediaBundleId: [mediaBuildId],
              operations: [
                {
                  extensionId: OfflineBundleProcessor.id,
                  postProcessHash: groupHash,
                },
              ],
            },
            mimeType: 'application/zip',
            originalHash: 'unknown',
            convertedHash: { xxHash: 'unknown', md5: 'unknown' },
            managedBy: null,
            url: {},
            cacheToHardDisk: false,
            preloadLevel: PreloadLevel.None,
            preloadTriggers: [],
            episodeIds: [
              ...(group.episodeIs ?? []),
              ...(group.episodeContains ?? []),
            ],
            thumbnailSrc: null,
            duration: null,
            importTime: Date.now(),
            removed: false,
            removedTime: -1,
            resourceGroupId: '',
            tags: [...(group.tagContains ?? []), Category.Others],
            extensionConfigurations: {
              [`${OfflineBundleProcessor.id}~~includes`]: entryIds.join(','),
            },
          };

          this.addPostProcessRecordToPostprocessResource(
            resourceDescription,
            entryIds,
            mediaBuildId
          );

          const matchedProcessRecord = ResourceProcessor.findPostprocessRecord(
            resources,
            resourceDescription.postProcessRecord
          );

          if (matchedProcessRecord) {
            cachedTasks += 1;
            matchedProcessRecord.postProcessRecord.mediaBundleId.push(
              mediaBuildId
            );

            this.dependency.logToTerminal(
              `:: :: ${resourceId} is already cached`,
              Level.Info
            );

            return null;
          }

          return {
            files,
            resourceDescription,
            groupHash,
            group,
          };
        }
      )
    );

    this.dependency.logToTerminal(`:: :: Offline Task Summary:`, Level.Info);
    this.dependency.logToTerminal(
      `:: :: :: Total tasks: ${totalTasks}`,
      Level.Info
    );
    this.dependency.logToTerminal(
      `:: :: :: Empty groups: ${skippedTasks}`,
      Level.Info
    );
    this.dependency.logToTerminal(
      `:: :: :: Cached tasks: ${cachedTasks}`,
      Level.Info
    );

    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i];
      if (!task) continue;

      const { files, resourceDescription, group } = task;

      try {
        this.dependency.logToTerminal(
          `:: :: [Group ${i}] Group summary:`,
          Level.Info
        );
        this.dependency.logToTerminal(`:: :: :: Selectors:`, Level.Info);
        Object.entries(group).forEach(([key, value]) => {
          this.dependency.logToTerminal(
            `:: :: :: :: ${key}: ${value}`,
            Level.Info
          );
        });
        this.dependency.logToTerminal(`:: :: :: File:`, Level.Info);
        this.dependency.logToTerminal(
          `:: :: :: :: ID: ${resourceDescription.id}`,
          Level.Info
        );
        this.dependency.logToTerminal(
          `:: :: :: :: Included: ${files.length} files`,
          Level.Info
        );

        const zip = this.dependency.createTemporaryZip();

        const fileList = await Promise.all(
          files.map(async (x) => {
            const from = this.dependency.getResourceFilePath(x);

            if (!(await pathExists(from))) {
              this.dependency.logToTerminal(
                `:: :: :: :: Error: File not found: ${x.label} (${x.id})`,
                Level.Error
              );
              throw new Error(`File not found: ${from}`);
            }

            return {
              from,
              to: `${x.id}.resource`,
            };
          })
        );

        await zip.appendFileList(fileList, true);

        const buffer = await zip.done();

        this.dependency.logToTerminal(
          `:: :: :: :: File Size: ${buffer.byteLength} bytes`,
          Level.Info
        );

        // #region Hash Result
        const xxHash = await this.dependency.xxHash(buffer);
        const md5 = await this.dependency.md5Hash(buffer);
        // @ts-ignore: We need to force write this.
        resourceDescription.originalHash = xxHash;
        // @ts-ignore: Ditto.
        resourceDescription.convertedHash.xxHash = xxHash;
        // @ts-ignore: Ditto.
        resourceDescription.convertedHash.md5 = md5;
        // #endregion

        resources.push(resourceDescription);
        await this.writeOutputFile(resourceDescription, buffer, {});

        successfulTasks += 1;

        this.dependency.logToTerminal(
          `:: :: :: :: File Name: ${this.getOutputFileName(
            resourceDescription,
            {}
          )}`,
          Level.Info
        );
        this.dependency.logToTerminal(
          `:: :: :: :: Process Hash: ${resourceDescription.postProcessRecord.operations
            .map((x) => x.postProcessHash)
            .join(' -> ')}`,
          Level.Info
        );
      } catch (e) {
        failedTasks += 1;

        if (e instanceof Error) {
          failRecords[resourceDescription.id] = e;
        }

        throw e;
      }
    }

    this.dependency.logToTerminal(
      ':: :: Offline Task Final Summary:',
      Level.Info
    );
    const errors = Object.entries(failRecords);
    if (errors.length) {
      this.dependency.logToTerminal(
        `:: :: :: ${errors.length} tasks failed`,
        Level.Error
      );

      errors.forEach(([id, error]) => {
        if ('message' in error) {
          this.dependency.logToTerminal(
            `:: :: :: :: [${id}] ${error.message}`,
            Level.Error
          );

          log.error(error);
        } else {
          this.dependency.logToTerminal(
            `:: :: :: :: [${id}] ${JSON.stringify(error)}`,
            Level.Error
          );
        }
      });
    } else {
      this.dependency.logToTerminal(
        `:: :: :: Total: ${totalTasks}`,
        Level.Info
      );
      this.dependency.logToTerminal(
        `:: :: :: Cached: ${cachedTasks}`,
        Level.Info
      );
      this.dependency.logToTerminal(
        `:: :: :: Skipped: ${skippedTasks}`,
        Level.Info
      );
      this.dependency.logToTerminal(
        `:: :: :: Successful: ${successfulTasks}`,
        Level.Info
      );
      this.dependency.logToTerminal(
        `:: :: :: Failed: ${failedTasks}`,
        Level.Info
      );
    }

    return resources;
  }

  afterGroupCreated() {
    return null;
  }

  beforePublishApplicationBundle(
    resources: (PostProcessedResourceItemForUpload | IResourceItem)[]
  ) {
    const bundles = resources.filter(
      (x) =>
        x.type === 'file' &&
        `${OfflineBundleProcessor.id}~~includes` in x.extensionConfigurations
    );

    for (let i = 0; i < bundles.length; i += 1) {
      const bundleResource = bundles[i];

      if (bundleResource.type !== 'file') {
        throw new TypeError(
          `Expected file type, got ${bundleResource.type}, this is a bug`
        );
      }

      const resourceIds = new Set(
        bundleResource.extensionConfigurations[
          `${OfflineBundleProcessor.id}~~includes`
        ]
          .split(',')
          .filter(Boolean)
      );

      const bundleResources = resources.filter((x) => resourceIds.has(x.id));

      for (let j = 0; j < bundleResources.length; j += 1) {
        const resource = bundleResources[j];
        if (resource.type !== 'file') {
          throw new TypeError(
            `Expected file type, got ${resource.type}, this is a bug`
          );
        }

        resource.url[
          `@recative/extension-offline-bundle/OfflineBundleProcessor`
        ] = `http://localhost:34652/${bundleResource.id}/${resource.id}.resource`;
      }
    }

    return resources;
  }

  beforeFileImported(resources: IPostProcessedResourceFileForImport[]) {
    return resources;
  }

  beforePreviewResourceBinaryDelivered() {
    return null;
  }

  beforePreviewResourceMetadataDelivered() {
    return null;
  }
}
