/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
/* eslint-disable no-await-in-loop */
import { nanoid } from 'nanoid';
import { Image, createCanvas } from '@napi-rs/canvas';

import {
  RectWh,
  RectXywhf,
  FinderInput,
  FlippingOption,
  CallbackResult,
  findBestPacking,
} from '@recative/atlas';
import {
  hashObject,
  IResourceItem,
  imageCategoryTag,
  BidirectionalMap,
  getHighestPreloadLevel,
  REDIRECT_URL_EXTENSION_ID,
  TerminalMessageLevel as Level,
} from '@recative/definitions';
import { ResourceProcessor } from '@recative/extension-sdk';

import type { IResourceItemForClient } from '@recative/definitions';
import type {
  IBundleGroup,
  PostProcessedResourceItemForImport,
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface AtlasResourceProcessorConfig {
  enable: string;
}

// For compatibility concern, we need to hardcode this value.
const ATLAS_MAX_DIMENSION_SIZE = 2048;

export const PARSE_RESOURCE_FILE_TO_BE_REFACTORED_TO_DEFINITIONS = <
  T extends
    | PostProcessedResourceItemForImport
    | IResourceItem
    | IResourceItemForClient
>(
  x: T,
  resources: T[]
): T => {
  if ('redirectTo' in x && x.redirectTo) {
    const resource = resources.find((y) => y.id === x.redirectTo);
    if (!resource) {
      throw new TypeError(`Redirected to resource not found`);
    }

    return PARSE_RESOURCE_FILE_TO_BE_REFACTORED_TO_DEFINITIONS(
      resource,
      resources
    );
  }

  return x;
};

export class AtlasResourceProcessor extends ResourceProcessor<
  keyof AtlasResourceProcessorConfig
> {
  static id = '@recative/extension-rs-atlas/AtlasResourceProcessor';

  static label = 'Atlas';

  static resourceConfigUiFields = [
    {
      id: 'enabled',
      type: 'boolean',
      label: 'Add texture to atlas pack',
      title: 'Enable',
    },
  ] as const;

  protected configValidator(
    x: unknown
  ): x is Record<keyof AtlasResourceProcessorConfig, string> {
    return !!x || true;
  }

  private calculateImageEnvelope = (
    resource:
      | IPostProcessedResourceFileForImport
      | IPostProcessedResourceFileForUpload,
    image: Image
  ) => {
    const { width, height } = image;

    const x = Number.parseInt(
      resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ex`],
      10
    );
    const y = Number.parseInt(
      resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ey`],
      10
    );
    const w = Number.parseInt(
      resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ew`],
      10
    );
    const h = Number.parseInt(
      resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~eh`],
      10
    );

    if (
      !Number.isNaN(x) &&
      !Number.isNaN(y) &&
      !Number.isNaN(w) &&
      !Number.isNaN(h)
    ) {
      return new RectXywhf(x, y, w, h);
    }

    const imageData = this.getImageData(image);
    const { data } = imageData;
    const paddings = { top: 0, left: 0, right: width - 1, bottom: height - 1 };

    leftSide: for (let i = 0; i < width; i += 1) {
      for (let j = 0; j < height; j += 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.left = i;
          break leftSide;
        }
      }
    }

    rightSide: for (let i = width - 1; i >= 0; i -= 1) {
      for (let j = height - 1; j >= 0; j -= 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.right = i;
          break rightSide;
        }
      }
    }

    topSide: for (let j = 0; j < height; j += 1) {
      for (let i = 0; i < width; i += 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.top = j;
          break topSide;
        }
      }
    }

    bottomSide: for (let j = height - 1; j >= 0; j -= 1) {
      for (let i = width - 1; i >= 0; i -= 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.bottom = j;
          break bottomSide;
        }
      }
    }

    const numberArray: Array<number> = [];

    for (let j = paddings.top; j <= paddings.bottom; j += 1) {
      for (let i = paddings.left; i <= paddings.right; i += 1) {
        const index = j * width + i;
        numberArray.push(data[index * 4]);
        numberArray.push(data[index * 4 + 1]);
        numberArray.push(data[index * 4 + 2]);
        numberArray.push(data[index * 4 + 3]);
      }
    }

    const result = new RectXywhf(
      paddings.left,
      paddings.top,
      paddings.right - paddings.left,
      paddings.bottom - paddings.top
    );

    resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ex`] =
      result.x.toString();
    resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ey`] =
      result.y.toString();
    resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~ew`] =
      result.w.toString();
    resource.extensionConfigurations[`${AtlasResourceProcessor.id}~~eh`] =
      result.h.toString();

    this.dependency.updateResourceDefinition(resource);

    return result;
  };

  private getImageData = (x: Image) => {
    const canvas = createCanvas(x.width, x.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(x, 0, 0);
    return ctx.getImageData(0, 0, x.width, x.height);
  };

  private generateAtlasImage = async (
    resourceId: string,
    spaceRect: RectWh,
    currentTasks: RectXywhf[],
    resourceToTaskMap: BidirectionalMap<
      IPostProcessedResourceFileForUpload,
      RectXywhf
    >,
    resourceToEnvelopeMap: BidirectionalMap<
      IPostProcessedResourceFileForUpload,
      RectXywhf
    >,
    onPacked: () => void
  ) => {
    const canvas = createCanvas(
      2 ** Math.ceil(Math.log2(spaceRect.w)),
      2 ** Math.ceil(Math.log2(spaceRect.h))
    );
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas context is null!');
    }

    for (let i = 0; i < currentTasks.length; i += 1) {
      onPacked();
      const currentTask = currentTasks[i];
      const rectResource = resourceToTaskMap.get(currentTask);
      if (!rectResource) {
        throw new TypeError(
          'Resource ID not available in the map, this is a bug!'
        );
      }

      const envelopeRect = resourceToEnvelopeMap.get(rectResource);
      if (!envelopeRect) {
        throw new TypeError(
          'Envelope not available in the map, this is a bug!'
        );
      }

      const subImage = new Image();
      subImage.src = await this.getResourceBuffer(rectResource);

      // ctx.fillStyle = getRandomColor();
      // ctx.fillRect(currentTask.x, currentTask.y, currentTask.w, currentTask.h);
      // ctx.fillStyle = 'transparent';
      if (
        currentTask.w === envelopeRect.w &&
        currentTask.h === envelopeRect.h
      ) {
        // Draw directly
        ctx.drawImage(
          subImage,
          envelopeRect.x,
          envelopeRect.y,
          envelopeRect.w,
          envelopeRect.h,
          currentTask.x,
          currentTask.y,
          currentTask.w,
          currentTask.h
        );
      } else if (
        currentTask.w === envelopeRect.h &&
        currentTask.h === envelopeRect.w
      ) {
        // Draw rotated
        ctx.save();
        this.dependency.logToTerminal(
          `:: :: Drawing rotated, ${resourceId} ${envelopeRect.w}x${envelopeRect.h} (${envelopeRect.x}, ${envelopeRect.y}), ${ctx.fillStyle}`,
          Level.Error
        );
        ctx.translate(currentTask.x + currentTask.w, currentTask.y);
        ctx.rotate(Math.PI / 2);
        ctx.drawImage(
          subImage,
          envelopeRect.x,
          envelopeRect.y,
          envelopeRect.w,
          envelopeRect.h,
          0,
          0,
          currentTask.h,
          currentTask.w
        );
        ctx.restore();
      } else {
        throw new TypeError(
          `Wrong image size: Atlas (${envelopeRect.w} x ${envelopeRect.h}), Envelope (${currentTask.w} x ${currentTask.h})`
        );
      }

      // #region Inject Configuration
      rectResource.extensionConfigurations[`${AtlasResourceProcessor.id}~~x`] =
        envelopeRect.x.toString();
      rectResource.extensionConfigurations[`${AtlasResourceProcessor.id}~~y`] =
        envelopeRect.y.toString();
      rectResource.extensionConfigurations[`${AtlasResourceProcessor.id}~~w`] =
        envelopeRect.w.toString();
      rectResource.extensionConfigurations[`${AtlasResourceProcessor.id}~~h`] =
        envelopeRect.h.toString();
      rectResource.extensionConfigurations[`${AtlasResourceProcessor.id}~~f`] =
        envelopeRect.flipped.toString();
      rectResource.url[REDIRECT_URL_EXTENSION_ID] = `redirect://${resourceId}`;
      // #endregion
    }

    const outputBuffer = await canvas.encode('png');

    return { canvas, outputBuffer };
  };

  async beforePublishMediaBundle(
    resources: IPostProcessedResourceFileForUpload[],
    mediaBuildId: number,
    bundleGroups: IBundleGroup[]
  ) {
    // Split files into different based on grouping rules, current rule is
    // hard-coded, based on language of the resource, could support more options
    // via plugin configurations.
    const bundleGroupToFileSetMap = new Map<
      IBundleGroup,
      IPostProcessedResourceFileForUpload[]
    >();

    // Dispatch all texture resources to different groups
    const filteredResources = resources.filter((x) => {
      return (
        x.extensionConfigurations[`${AtlasResourceProcessor.id}~~enabled`] ===
          'yes' && x.tags.includes(imageCategoryTag.id)
      );
    });

    ResourceProcessor.mapBundleGroup(
      filteredResources,
      bundleGroups,
      (resourceGroup, groupDefinition) => {
        bundleGroupToFileSetMap.set(groupDefinition, resourceGroup);
      }
    );

    const groupDefinitions = [...bundleGroupToFileSetMap.keys()];
    const resourceToTaskMap = new BidirectionalMap<
      IPostProcessedResourceFileForUpload,
      RectXywhf
    >();
    const resourceToEnvelopeMap = new BidirectionalMap<
      IPostProcessedResourceFileForUpload,
      RectXywhf
    >();

    // #region Task Summary
    const emptyGroupCount = groupDefinitions.filter((groupKey) => {
      return !bundleGroupToFileSetMap.get(groupKey)?.length;
    }).length;

    this.dependency.logToTerminal(':: :: Task Summary:', Level.Info);
    this.dependency.logToTerminal(
      `:: :: :: Files: ${filteredResources.length} marked / ${resources.length} in total`,
      Level.Info
    );
    this.dependency.logToTerminal(
      `:: :: :: Total Groups: ${bundleGroupToFileSetMap.size}`,
      Level.Info
    );
    if (emptyGroupCount) {
      this.dependency.logToTerminal(
        `:: :: :: Empty Groups: ${emptyGroupCount}`,
        Level.Warning
      );
    }
    // #endregion

    // Build a index of the size of all images.
    const imageSizeQueryForEachGroupTask = await Promise.allSettled(
      groupDefinitions.map(async (groupKey, groupIndex) => {
        const resourceFiles = bundleGroupToFileSetMap.get(groupKey);

        // #region Resource Checkup
        if (!resourceFiles) {
          throw new TypeError(
            'Group value not found based on the key, this is a bug!'
          );
        }
        // #endregion

        const imageSizeQueryResult = await Promise.allSettled(
          resourceFiles.map(async (x) => {
            const buffer = await this.getResourceBuffer(x);
            const image = new Image();
            image.src = buffer;

            const imageEnvelope = this.calculateImageEnvelope(x, image);

            // The image is too large to be packed, will skip.
            if (
              imageEnvelope.w > ATLAS_MAX_DIMENSION_SIZE ||
              imageEnvelope.h > ATLAS_MAX_DIMENSION_SIZE
            ) {
              this.dependency.logToTerminal(
                `:: :: [Group ${groupIndex}] ${x.label} is too large, will skip`,
                Level.Info
              );

              return;
            }

            resourceToEnvelopeMap.set(x, imageEnvelope);
          })
        );

        // #region Failed Image Size Query Report
        const failedMediaQueryTask = imageSizeQueryResult.filter(
          (x) => x.status === 'rejected'
        );

        if (failedMediaQueryTask.length) {
          this.dependency.logToTerminal(
            `:: :: [Group ${groupIndex}] ${failedMediaQueryTask} image size query task failed`,
            Level.Error
          );
        }
        // #endregion
      })
    );

    // #region Failed Image Size Query For Each Group Task Report
    const failedAtlasBoundingTasks = imageSizeQueryForEachGroupTask.filter(
      (x) => x.status === 'rejected'
    );

    if (failedAtlasBoundingTasks.length) {
      this.dependency.logToTerminal(
        `:: :: ${failedAtlasBoundingTasks.length} atlas tasks failed`,
        Level.Error
      );
    }

    this.reportFailedTaskToConsole(failedAtlasBoundingTasks);
    // #endregion

    // Calculating pack for each group of file now.
    const imageGenerationTasks = await Promise.allSettled(
      groupDefinitions.map(async (groupKey, groupIndex) => {
        const filesInGroup = bundleGroupToFileSetMap.get(groupKey);

        // #region Group Initialization and Empty Checkup
        if (!filesInGroup) {
          throw new TypeError(
            'Group value not found based on the key, this is a bug!'
          );
        }

        if (!filesInGroup.length) return;
        // #endregion

        let taskSuccess: boolean | null = null;
        // #region Report Atlas Status Callback
        const reportSuccessful = () => {
          taskSuccess = true;
          return CallbackResult.CONTINUE_PACKING;
        };
        const reportUnsuccessful = () => {
          taskSuccess = false;
          return CallbackResult.ABORT_PACKING;
        };
        // #endregion

        /**
         * Step 1: Let's try to generate the atlas, the task will fail if there's
         * no enough space for all images. If the task failed, we should remove
         * the largest image, and run the task again, to test if the resting
         * images could be packed successfully.
         */
        let currentTask = Array.from(
          filesInGroup
            .map((resource) => {
              const envelope = resourceToEnvelopeMap.get(resource);

              if (!envelope) {
                throw new TypeError(
                  `ResourceToEnvelopeMap don't have the rect, it is a bug!`
                );
              }

              const task = new RectXywhf(
                envelope.x,
                envelope.y,
                envelope.w,
                envelope.h
              );
              resourceToTaskMap.set(resource, task);

              return task;
            })
            .sort((a, b) => a.area() - b.area())
        );
        let nextTask = [] as typeof currentTask;
        let packedFiles = 0;
        let skippedFiles = 0;

        const groupReport = () => {
          const ceased = currentTask.length === 0 && nextTask.length === 0;
          const level = ceased ? Level.Warning : Level.Info;

          this.dependency.logToTerminal(
            `:: :: [Group ${groupIndex}] Group report:`,
            level
          );

          this.dependency.logToTerminal(`:: :: :: Selector:`, level);

          Object.entries(groupKey).forEach(([key, value]) => {
            if (typeof value === 'undefined') {
              this.dependency.logToTerminal(`:: :: :: :: ${key}: [ANY]`, level);
            } else {
              this.dependency.logToTerminal(
                `:: :: :: :: ${key}: ${
                  value.length ? value.join(', ') : '[EMPTY]'
                }`,
                level
              );
            }
          });

          this.dependency.logToTerminal(
            `:: :: :: Total: ${filesInGroup.length} files`,
            level
          );

          if (!ceased) {
            this.dependency.logToTerminal(
              `:: :: :: Packed: ${packedFiles} files`,
              level
            );
          }

          this.dependency.logToTerminal(
            `:: :: :: Skipped: ${skippedFiles} files`,
            level
          );

          if (ceased) {
            this.dependency.logToTerminal(`:: :: :: All files skipped`, level);
          }

          return true;
        };

        const nextTaskIteration = async (): Promise<boolean> => {
          if (currentTask.length === 1) {
            skippedFiles += 1;
          }

          // #region Log Image Detail
          // if (currentTask.length >= 1) {
          //   this.dependency.logToTerminal(
          //     `:: :: [Group ${groupIndex}] ${currentTask.length} packed, ${nextTask.length} remains, ${skippedFiles} skipped`,
          //     Level.Info
          //   );
          //   // this.dependency.logToTerminal(`:: :: Packed images:`, Level.Info);
          //   // currentTask.forEach((x) => {
          //   //   this.dependency.logToTerminal(
          //   //     `:: :: :: ${x.w} x ${x.h} (${x.x}, ${x.y})`,
          //   //     Level.Info
          //   //   );
          //   // });
          // }
          // #endregion

          currentTask = nextTask;
          nextTask = [];

          // eslint-disable-next-line @typescript-eslint/no-use-before-define
          return taskIteration();
        };

        const taskIteration = async (): Promise<boolean> => {
          if (currentTask.length === 0 && nextTask.length === 0) {
            groupReport();

            return true;
          }

          const resourceId = nanoid();
          taskSuccess = null;

          const spaceRect = findBestPacking(
            currentTask,
            new FinderInput(
              ATLAS_MAX_DIMENSION_SIZE,
              -4,
              reportSuccessful,
              reportUnsuccessful,
              // Flipping is enabled by default, this could be a plugin option if
              // we found any use case, but not for now.
              FlippingOption.ENABLED
            )
          );

          if (!taskSuccess) {
            const lastTask = currentTask.pop();

            if (lastTask) {
              nextTask.unshift(lastTask);
            }

            // Task not success, try to start next iteration.
            return taskIteration();
          }

          /**
           * Step 2: Let's read the atlas result, if there's only one image in
           * the atlas pack result, it means this file can get any benefit from
           * data packing, we should skip following resource generation tasks.
           * If there're no image available for currentTask, it means we should
           * stop packing.
           */
          if (currentTask.length === 0) {
            if (nextTask.length > 0) {
              this.dependency.logToTerminal(
                `:: :: [Group ${groupIndex}] ${nextTask.length} resources can not be handled anymore`,
                Level.Error
              );
            }

            return false;
          }

          if (currentTask.length === 1) {
            return nextTaskIteration();
          }

          /**
           * Step 3: The task has finished successfully, we need to generate the
           * resource description and a task hash, this hash is used for compare
           * with previous generated post processed resources, if resource with
           * same record found, we don't need to generate a new image, just
           * reuse the old one is enough.
           */
          const currentResources = currentTask
            .map((x) => resourceToTaskMap.get(x))
            .filter(Boolean) as IPostProcessedResourceFileForUpload[];

          const preloadTriggers = currentResources.flatMap((x) => {
            return x.type !== 'file' ? [] : x.preloadTriggers;
          });

          const resourceIds = currentTask.map(
            (x) => resourceToTaskMap.get(x)?.id
          );

          const resourceDescription: IPostProcessedResourceFileForUpload = {
            type: 'file',
            id: resourceId,
            label: `Recative Atlas Post Processed ${resourceId}`,
            postProcessRecord: {
              mediaBundleId: [mediaBuildId],
              operations: [
                {
                  extensionId: AtlasResourceProcessor.id,
                  // The hash of the atlas task is based on the bounding box of
                  // all atlas images, and the resource id of images to be
                  // packed.
                  // We hope this value is stable enough.
                  postProcessHash: hashObject({
                    rects: currentTask,
                    ids: resourceIds,
                  }),
                },
              ],
            },
            mimeType: 'image/png',
            originalHash: 'unknown',
            convertedHash: { xxHash: 'unknown', md5: 'unknown' },
            url: {},
            cacheToHardDisk: !!currentResources.find((x) => x.cacheToHardDisk),
            preloadLevel: getHighestPreloadLevel(
              currentResources.map((x) => x.preloadLevel)
            ),
            preloadTriggers,
            episodeIds: groupKey.episodeContains ?? [],
            thumbnailSrc: null,
            duration: null,
            importTime: Date.now(),
            removed: false,
            removedTime: -1,
            resourceGroupId: '',
            tags: groupKey.tagContains ?? [],
            extensionConfigurations: {
              [`${AtlasResourceProcessor.id}~~includes`]: currentResources
                .map((x) => x.id)
                .join(','),
            },
          };

          this.addPostProcessRecordToPostprocessResource(
            resourceDescription,
            currentTask,
            mediaBuildId
          );

          // We test if the resource is already generated on previous builds, if
          // generated, we simply copy the config but don't run the file
          // generation task, or we have to build the media.
          const matchedProcessRecord = ResourceProcessor.findPostprocessRecord(
            resources,
            resourceDescription.postProcessRecord
          );

          this.dependency.logToTerminal(
            ` :: :: [Group ${groupIndex}] ${
              matchedProcessRecord
                ? '✔ Cache available'
                : '🐌 Will generate cache'
            }`,
            Level.Info
          );

          if (!matchedProcessRecord) {
            // If the file is not cached, generate the atlas image
            const { canvas, outputBuffer } = await this.generateAtlasImage(
              resourceId,
              spaceRect,
              currentTask,
              resourceToTaskMap,
              resourceToEnvelopeMap,
              () => {
                packedFiles += 1;
              }
            );

            // #region Atlas Report
            this.dependency.logToTerminal(
              `:: :: [Group ${groupIndex}] Atlas result:`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: Space size: ${spaceRect.w} x ${spaceRect.h}`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: Canvas size: ${canvas.width} x ${canvas.height}`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: Resource Id: ${resourceDescription.id}`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: File Name: ${this.getOutputFileName(
                resourceDescription,
                {}
              )}`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: File size: ${outputBuffer.byteLength} bytes`,
              Level.Info
            );
            this.dependency.logToTerminal(
              `:: :: :: Task Detail: ${currentTask.length} packed, ${nextTask.length} remains, ${skippedFiles} skipped`,
              Level.Info
            );
            // #endregion

            // #region Hash Result
            const xxHash = await this.dependency.xxHash(outputBuffer);
            const md5 = await this.dependency.md5Hash(outputBuffer);
            // @ts-ignore: We need to force write this.
            resourceDescription.originalHash = xxHash;
            // @ts-ignore: Ditto.
            resourceDescription.convertedHash.xxHash = xxHash;
            // @ts-ignore: Ditto.
            resourceDescription.convertedHash.md5 = md5;
            // #endregion

            resources.push(resourceDescription);
            await this.writeOutputFile(
              resourceDescription,
              await canvas.encode('png'),
              {}
            );
          } else {
            // the file is already generated, just push the media build id to
            // the post process record.
            matchedProcessRecord.postProcessRecord.mediaBundleId.push(
              mediaBuildId
            );
          }

          if (nextTask.length > 0) {
            return nextTaskIteration();
          }

          return groupReport();
        };

        await taskIteration();
      })
    );

    // #region Report Image Gen
    const failedImageGenerationTasks = imageGenerationTasks.filter(
      (x) => x.status === 'rejected'
    );

    if (failedImageGenerationTasks.length) {
      this.dependency.logToTerminal(
        `:: :: ${failedImageGenerationTasks.length} image query task failed`,
        Level.Error
      );
    }

    this.reportFailedTaskToConsole(failedImageGenerationTasks);
    // #endregion

    return resources as PostProcessedResourceItemForUpload[];
  }

  private reportFailedTaskToConsole(tasks: PromiseSettledResult<unknown>[]) {
    for (let i = 0; i < tasks.length; i += 1) {
      const task = tasks[i];

      if (task.status !== 'rejected') {
        continue;
      }

      this.dependency.logToTerminal(
        `:: :: :: [Task ${i}] ${task.reason}`,
        Level.Error
      );

      if (task.reason instanceof Error) {
        console.error(':: Failed task');
        console.error(':: :: Stack');
        console.error(task.reason.stack);
        console.error(':: :: End');
      }
    }
  }

  beforeFileImported(resources: IPostProcessedResourceFileForImport[]) {
    return resources;
  }

  beforePreviewAssetDelivered(resource: IPostProcessedResourceFileForUpload) {
    return resource;
  }
}
