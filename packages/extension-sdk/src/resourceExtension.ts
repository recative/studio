import { pathExists } from 'fs-extra';
import { hashObject } from '@recative/definitions';
import { TerminalMessageLevel } from '@recative/studio-definitions';

import type {
  IResourceItem,
  IResourceFile,
  IResourceGroup,
  IResourceItemForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';

import { Zip } from './zip';
import { getFilePath } from './getFilePath';
import { getFileBuffer } from './getFileBuffer';
import type { imageThumbnail } from './canvas';
import type { IConfigUiField } from './settings';
import type { ffmpeg, ffprobe, waveform, screenshot } from './ffmpeg';

export interface IPostProcessOperation {
  extensionId: string;
  postProcessHash: string;
}

export interface IPostProcessRecord {
  mediaBundleId: number[];
  operations: IPostProcessOperation[];
}

export interface IPostProcessRelatedData {
  postProcessRecord: IPostProcessRecord;
}

export interface IPostProcessedResourceFileRelatedData {
  fileName: string;
}

export interface IPostProcessedResourceFileForUpload
  extends IPostProcessRelatedData,
    IResourceFile,
    IPostProcessedResourceFileRelatedData {}

export interface IPostProcessedResourceGroupForUpload
  extends IPostProcessRelatedData,
    IResourceFile {}

export type PostProcessedResourceItemForUpload =
  | IPostProcessedResourceFileForUpload
  | IPostProcessedResourceGroupForUpload;

export interface IPostProcessedResourceFileForImport
  extends Omit<IResourceFile, 'thumbnailSrc'> {
  postProcessedFile: string | Buffer;
  postProcessedThumbnail: string | Buffer | null;
}

export type PostProcessedResourceItemForImport =
  | IPostProcessedResourceFileForImport
  | IResourceGroup;

export interface IResourceExtensionDependency {
  getResourceFilePath: (resource: Pick<IResourceFile, 'id'>) => Promise<string>;
  writeBufferToPostprocessCache: (
    buffer: Buffer,
    fileName: string
  ) => Promise<string>;
  writeBufferToResource: (buffer: Buffer, fileName: string) => Promise<string>;
  writeBufferToTemporaryFile: (buffer: Buffer) => Promise<string>;
  createTemporaryZip: () => Zip;
  updateResourceDefinition: (
    resource:
      | IResourceFile
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport
  ) => Promise<void>;
  insertPostProcessedFileDefinition: (
    resource:
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport,
    eraseMediaBuildId?: number | null
  ) => Promise<void>;
  updatePostProcessedFileDefinition: (
    resource:
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport
  ) => Promise<void>;
  readPathAsBuffer: (path: string) => Promise<Buffer>;
  logToTerminal: (message: string, level?: TerminalMessageLevel) => void;
  md5Hash: (x: Buffer) => Promise<string> | string;
  xxHash: (x: Buffer) => Promise<string> | string;
  ffmpeg: typeof ffmpeg;
  ffprobe: typeof ffprobe;
  waveform: typeof waveform;
  screenshot: typeof screenshot;
  getFilePath: typeof getFilePath;
  getFileBuffer: typeof getFileBuffer;
  imageThumbnail: typeof imageThumbnail;
}

export interface IBundleGroup {
  episodeContains?: string[];
  episodeIsEmpty?: boolean;
  episodeIs?: string[];
  tagContains?: string[];
  tagIsEmpty?: boolean;
  tagNotContains?: string[];
}

interface IGroupCreateResult {
  group: IResourceGroup;
  files: (IResourceFile | IPostProcessedResourceFileForImport)[];
}

export abstract class ResourceProcessor<ConfigKey extends string> {
  static id: string;

  static label: string;

  static resourceConfigUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  /** Not implemented */
  static pluginConfigUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  static nonMergeableResourceExtensionConfiguration: string[] = [];

  protected pluginConfig: Record<ConfigKey, string>;

  constructor(
    pluginConfig: Record<string, string>,
    public dependency: IResourceExtensionDependency
  ) {
    if (this.configValidator(pluginConfig)) {
      this.pluginConfig = pluginConfig;
    } else {
      throw new Error('Invalid configuration');
    }
  }

  protected configValidator(
    x: Record<string, string>
  ): x is Record<ConfigKey, string> {
    const uiFields = Reflect.get(
      this.constructor,
      'resourceConfigUiFields'
    ) as IConfigUiField[];
    const pluginId = Reflect.get(this.constructor, 'id');

    // TODO: Polish this.
    return uiFields
      .map((field) => {
        const valid = typeof x[field.id] === 'string';

        if (!valid) {
          this.dependency.logToTerminal(
            `:: [${pluginId}] ${field.id} is not a string`,
            TerminalMessageLevel.Warning
          );
        }

        return valid;
      })
      .reduce((a, b) => a && b, true);
  }

  protected async getResourceFilePath(
    resource: IPostProcessedResourceFileForImport | IResourceFile
  ) {
    if ('postProcessedFile' in resource) {
      if (typeof resource.postProcessedFile === 'string') {
        return resource.postProcessedFile;
      }
      return this.dependency.writeBufferToTemporaryFile(
        resource.postProcessedFile
      );
    }
    return this.dependency.getResourceFilePath(resource);
  }

  protected async getResourceBuffer(
    resource: IPostProcessedResourceFileForImport | IResourceFile
  ) {
    if ('postProcessedFile' in resource) {
      if (typeof resource.postProcessedFile === 'string') {
        return this.dependency.readPathAsBuffer(resource.postProcessedFile);
      }

      return resource.postProcessedFile;
    }
    return this.dependency.readPathAsBuffer(
      await this.dependency.getResourceFilePath(resource)
    );
  }

  protected getOutputFileName(
    file:
      | IResourceFile
      | IPostProcessedResourceFileForUpload
      | IPostProcessedResourceFileForImport,
    additionalData: Record<string, number | string | boolean>
  ): string {
    const pluginKey = Reflect.get(this.constructor, 'id');

    if (typeof pluginKey !== 'string') {
      throw new TypeError('Plugin key should be a string');
    }

    const filePluginConfig: Record<string, string> = {};

    Object.keys(file.extensionConfigurations)
      .filter((x) => x.startsWith(pluginKey))
      .forEach((key) => {
        filePluginConfig[key] = file.extensionConfigurations[key];
      });

    const pluginConfigHash = hashObject({
      ...this.pluginConfig,
      additionalData,
    });
    const fileConfigHash = hashObject(filePluginConfig);

    if ('postProcessRecord' in file) {
      const postProcessHash = hashObject(file.postProcessRecord);

      return `${file.id}$${postProcessHash}$${pluginConfigHash}$${fileConfigHash}.resource`;
    }

    return `${file.id}.resource`;
  }

  protected async writeOutputFile(
    resource:
      | IPostProcessedResourceFileForImport
      | IPostProcessedResourceFileForUpload,
    buffer: Buffer,
    additionalData: Record<string, number | string | boolean>,
    mediaBuildId: number | null = null
  ): Promise<string> {
    const fileName = this.getOutputFileName(resource, additionalData);

    if ('postProcessRecord' in resource) {
      resource.fileName = fileName;
      await this.dependency.insertPostProcessedFileDefinition(
        resource,
        mediaBuildId
      );
      return this.dependency.writeBufferToPostprocessCache(
        buffer,
        this.getOutputFileName(resource, additionalData)
      );
    }

    return this.dependency.writeBufferToResource(
      buffer,
      `${resource.id}.resource`
    );
  }

  protected addPostProcessRecordToPostprocessResource(
    resource: PostProcessedResourceItemForUpload,
    postProcessHash: string | object,
    mediaBundleId: number
  ): PostProcessedResourceItemForUpload {
    const truePostProcessHash =
      typeof postProcessHash === 'string'
        ? postProcessHash
        : hashObject(postProcessHash);
    const extensionId = Reflect.get(this.constructor, 'id') as string;

    const operationRecord = {
      extensionId,
      postProcessHash: truePostProcessHash,
    };

    resource.postProcessRecord.operations.push(operationRecord);
    resource.postProcessRecord.mediaBundleId.push(mediaBundleId);
    // Deduplicate mediaBundleId
    resource.postProcessRecord.mediaBundleId = [
      ...new Set(resource.postProcessRecord.mediaBundleId),
    ];

    return resource;
  }

  protected async findPostprocessRecord(
    resources: PostProcessedResourceItemForUpload[],
    compareWith: IPostProcessRecord
  ) {
    const compareWithHash = hashObject(compareWith.operations);

    for (let i = 0; i < resources.length; i += 1) {
      const x = resources[i];
      const valid =
        hashObject(x.postProcessRecord.operations) === compareWithHash &&
        (await pathExists(await this.dependency.getResourceFilePath(x)));

      if (valid) {
        return x;
      }
    }

    return undefined;
  }

  protected static mapBundleGroup<
    T extends
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport,
    P
  >(
    resources: T[],
    bundleGroups: IBundleGroup[],
    iterator: (resource: T[], group: IBundleGroup, groupId: number) => P,
    deduplicate = false
  ) {
    const resourceSet = new Set<T>();

    let groupId = -1;
    return bundleGroups.map((group) => {
      const filteredResources = resources.filter((resource) => {
        if (resource.type !== 'file') {
          return false;
        }

        if (resourceSet.has(resource)) {
          return false;
        }

        const allResourceEpisodeIdsInQuery =
          !group.episodeContains ||
          group.episodeContains.every((x) => resource.episodeIds.includes(x));

        const allResourceEpisodeEqQuery =
          !group.episodeIs ||
          group.episodeIs.sort().join() === resource.episodeIds.sort().join();

        const allResourceTagIdsInQuery =
          !group.tagContains ||
          group.tagContains.every((x) => resource.tags.includes(x));

        const allResourceTagNotIdsNotInQuery =
          !group.tagNotContains ||
          group.tagNotContains.every((x) => !resource.tags.includes(x));

        const tagIsEmpty =
          group.tagIsEmpty === undefined ||
          (group.tagIsEmpty && resource.tags.length === 0);

        const episodeIsEmpty =
          group.episodeIsEmpty === undefined ||
          (group.episodeIsEmpty && resource.episodeIds.length === 0);

        return (
          allResourceTagNotIdsNotInQuery &&
          allResourceEpisodeIdsInQuery &&
          allResourceTagIdsInQuery &&
          allResourceEpisodeEqQuery &&
          tagIsEmpty &&
          episodeIsEmpty
        );
      });

      if (deduplicate) {
        filteredResources.forEach((resource) => {
          resourceSet.add(resource);
        });
      }

      groupId += 1;
      return iterator(filteredResources, group, groupId);
    });
  }

  /**
   * While the media bundle is being published, we have a chance to
   * process all the resources we have, like building atlas, compatibility
   * checking, etc.
   * If new file is generated, developers should:
   * * Push the id of this plugin into the `postProcessedBy` field of the
   * resource file;
   * * Put the file into the `postProcessedPath` which is passed into the
   * method, the output file name MUST be acquired from;
   * * Assign a post process hash to mark your post processing configuration.
   * `ResourceProcessor.getOutputFileName`, or ap-studio will throw an
   * error;
   * * Compare the post process hash with the one in the `postProcessRecord`
   * and decide if run the post processing again for this build, or use existed
   * one.
   *
   * You may want to:
   * * **Merge multiple file into one file**: create a new resource, and
   *   add a `redirectTo` field to merged files, `core-manager` will
   *   handle other things properly.
   * * **Split a file**: features like convert file to different format,
   *   for different browsers.
   *
   * It's okay to inject variables into `pluginConfig` if needed, since
   * it's not controlled, so please follow the common rule to build the
   * key name: `${pluginId}~~${keyName}`.
   * @param resources All resources to be published, groups included.
   */
  abstract beforePublishMediaBundle(
    resources: PostProcessedResourceItemForUpload[],
    mediaBuildId: number,
    bundleGroups: IBundleGroup[]
  ):
    | Promise<PostProcessedResourceItemForUpload[] | null>
    | PostProcessedResourceItemForUpload[]
    | null;

  abstract beforePublishApplicationBundle(
    resources: (PostProcessedResourceItemForUpload | IResourceItem)[],
    profileType: string
  ):
    | null
    | Promise<null>
    | Promise<(PostProcessedResourceItemForUpload | IResourceItem)[]>
    | (PostProcessedResourceItemForUpload | IResourceItem)[];
  /**
   * While a file is imported, we have a chance to make some magic into
   * the file for various of purposes, like image optimization, format
   * conversion, etc.
   *
   * If new file is generated, developers should add a `postProcessedFile`
   * field to the resource file description, the value could be a `string`,
   * or a `Buffer`:
   * * If the value is a `string`, ap-studio will treat as a path, and copy
   *   the result to resource path, please make sure the file is stored
   *   in the temporary path of the OS, since the operating system could
   *   handle the file cleanup work.
   * * If the value is a `Buffer`, ap-studio will save the content to the
   *   resource path.
   *
   * A file could be modified directly or convert to a group if necessary.
   *
   * @param resources Resources being processed, the file may be modified
   *                  by other plugins, so group may occurred.
   */
  abstract beforeFileImported(
    resources: PostProcessedResourceItemForImport[]
  ):
    | Promise<PostProcessedResourceItemForImport[] | null>
    | PostProcessedResourceItemForImport[]
    | null;
  abstract afterGroupCreated(
    files: (IResourceFile | IPostProcessedResourceFileForImport)[],
    newGroup: IResourceGroup
  ): Promise<IGroupCreateResult | null> | IGroupCreateResult | null;
  abstract beforePreviewResourceMetadataDelivered<
    T extends
      | IResourceItemForClient
      | IDetailedResourceItemForClient
      | IPostProcessedResourceFileForUpload
  >(resource: T[]): Promise<T[] | null> | T[] | null;
  abstract beforePreviewResourceBinaryDelivered<
    T extends
      | IResourceItemForClient
      | IDetailedResourceItemForClient
      | IPostProcessedResourceFileForUpload
  >(resource: T, resources: T[]): Promise<Buffer | null> | Buffer | null;
}
