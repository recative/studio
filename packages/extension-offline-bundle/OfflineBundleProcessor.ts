/* eslint-disable no-await-in-loop */
import { nanoid } from 'nanoid';
import { ResourceProcessor } from '@recative/extension-sdk';

import {
  hashObject,
  IDetailedResourceGroupForClient,
  IResourceFileForClient,
  IResourceGroupForClient,
  PreloadLevel,
  TerminalMessageLevel as Level,
} from '@recative/definitions';
import type {
  IBundleGroup,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

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
          const files = resource.filter(
            (x) =>
              x.type === 'file' &&
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
            tags: [...(group.tagContains ?? [])],
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
        const zip = this.dependency.createTemporaryZip();

        const fileList = files.map((x) => ({
          from: this.dependency.getResourceFilePath(x),
          to: `${x.id}.resource`,
        }));

        await zip.appendFileList(fileList);

        const buffer = await zip.done();

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
          `:: :: :: :: File Name: ${resourceDescription.fileName}`,
          Level.Info
        );
        this.dependency.logToTerminal(
          `:: :: :: :: Included: ${files.length} files`,
          Level.Info
        );
        this.dependency.logToTerminal(
          `:: :: :: :: Process Hash: ${resourceDescription.postProcessRecord.operations
            .map((x) => x.postProcessHash)
            .join(' -> ')}`,
          Level.Info
        );
        this.dependency.logToTerminal(
          `:: :: :: :: File Size: ${buffer.byteLength} bytes`,
          Level.Info
        );
      } catch (e) {
        failedTasks += 1;

        if (e instanceof Error) {
          failRecords[resourceDescription.id] = e;
        }
      }
    }

    this.dependency.logToTerminal(':: :: Task Summary:', Level.Info);
    const errors = Object.entries(failRecords);
    if (errors.length) {
      this.dependency.logToTerminal(
        `:: :: :: ${errors.length} tasks failed`,
        Level.Error
      );

      errors.forEach(([id, reason]) => {
        if ('reason' in reason) {
          this.dependency.logToTerminal(
            `:: :: :: :: [${id}] ${reason.message}`,
            Level.Error
          );

          console.error(reason);
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
