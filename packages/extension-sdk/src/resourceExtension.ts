import { hashObject } from '@recative/definitions';

import type {
  IResourceItem,
  IResourceFile,
  IResourceGroup,
  TerminalMessageLevel,
} from '@recative/definitions';

import type { IConfigUiField } from './settings';

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

export interface IPostProcessedResourceFileForUpload
  extends IPostProcessRelatedData,
    IResourceFile {}

export interface IPostProcessedResourceGroupForUpload
  extends IPostProcessRelatedData,
    IResourceFile {}

export type PostProcessedResourceItemForUpload =
  | IPostProcessedResourceFileForUpload
  | IPostProcessedResourceGroupForUpload;

export interface IPostProcessedResourceFileForImport extends IResourceFile {
  postProcessedFile: string | Buffer;
}

export type PostProcessedResourceItemForImport =
  | IPostProcessedResourceFileForImport
  | IResourceGroup;

export interface InitializeDependency {
  getResourceFilePath: (resource: Pick<IResourceFile, 'id'>) => string;
  writeBufferToPostprocessCache: (
    buffer: Buffer,
    fileName: string
  ) => Promise<string>;
  writeBufferToTemporaryFile: (buffer: Buffer) => Promise<string>;
  updateResourceDefinition: (
    resource:
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport
  ) => Promise<void>;
  readPathAsBuffer: (path: string) => Buffer;
  logToTerminal: (message: string, level: TerminalMessageLevel) => void;
  md5Hash: (x: Buffer) => Promise<string> | string;
  xxHash: (x: Buffer) => Promise<string> | string;
}

export interface IBundleGroup {
  episodeContains?: string[];
  tagContains?: string[];
  tagNotContains?: string[];
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

  protected pluginConfig: Record<ConfigKey, string>;

  constructor(
    pluginConfig: Record<string, string>,
    public dependency: InitializeDependency
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
    const uiFields = Reflect.get(this.constructor, 'configUiFields');

    // TODO: Polish this.
    return Object.keys(uiFields)
      .map((key) => typeof x[key] === 'string')
      .reduce((a, b) => a && b);
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
      this.dependency.getResourceFilePath(resource)
    );
  }

  protected getOutputFileName(
    file: IResourceFile | IPostProcessedResourceFileForUpload,
    additionalData: Record<string, number | string | boolean>
  ): string {
    const pluginKey = Reflect.get(this.constructor, 'id');

    if (typeof pluginKey !== 'string') {
      throw new TypeError('Plugin key should be a string');
    }

    const filePluginConfig: Record<string, string> = {};

    Object.keys(file.pluginConfigurations)
      .filter((x) => x.startsWith(pluginKey))
      .forEach((key) => {
        filePluginConfig[key] = file.pluginConfigurations[key];
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

    return `${file.id}$${pluginConfigHash}$${fileConfigHash}.resource`;
  }

  protected writeOutputFile(
    resource: IResourceFile | IPostProcessedResourceFileForUpload,
    buffer: Buffer,
    additionalData: Record<string, number | string | boolean>
  ): Promise<string> {
    return this.dependency.writeBufferToPostprocessCache(
      buffer,
      this.getOutputFileName(resource, additionalData)
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

  protected static findPostprocessRecord(
    resources: PostProcessedResourceItemForUpload[],
    compareWith: IPostProcessRecord
  ) {
    const compareWithHash = hashObject(compareWith.operations);
    return resources.find(
      (x) => hashObject(x.postProcessRecord.operations) === compareWithHash
    );
  }

  protected static mapBundleGroup<
    T extends
      | PostProcessedResourceItemForUpload
      | PostProcessedResourceItemForImport,
    P
  >(
    resources: T[],
    bundleGroups: IBundleGroup[],
    iterator: (resource: T[], group: IBundleGroup) => P
  ) {
    return bundleGroups.map((group) => {
      const episodeMap = group.episodeContains
        ? new Set(group.episodeContains)
        : null;
      const tagMap = group.tagContains ? new Set(group.tagContains) : null;
      const tagNotMap = group.tagNotContains
        ? new Set(group.tagNotContains)
        : null;

      const filteredResources = resources.filter((resource) => {
        if (resource.type !== 'file') {
          return false;
        }

        // If episode map or tag map is null, it means we this condition could be ignored.
        // If episode map exists but is empty, it means we want it MUST be empty.
        const allResourceEpisodeIdsInEpisodeMap =
          !episodeMap ||
          [...episodeMap].every((x) => resource.episodeIds.includes(x));
        const resourceEpisodeIdsIsEmpty =
          episodeMap?.size === 0 && resource.episodeIds.length === 0;
        const resourceEpisodeIdCondition =
          allResourceEpisodeIdsInEpisodeMap || resourceEpisodeIdsIsEmpty;

        const allResourceTagIdsInTagMap =
          !tagMap || [...tagMap].every((x) => resource.tags.includes(x));
        const resourceTagIdsIsEmpty =
          tagMap?.size === 0 && resource.tags.length === 0;
        const resourceTagIdCondition =
          allResourceTagIdsInTagMap || resourceTagIdsIsEmpty;

        const allResourceTagNotIdsNotInTagMap =
          !tagNotMap || [...tagNotMap].every((x) => !resource.tags.includes(x));
        const resourceTagNotIdsIsEmpty =
          tagNotMap?.size === 0 && resource.tags.length === 0;
        const resourceTagNotIdCondition =
          allResourceTagNotIdsNotInTagMap || resourceTagNotIdsIsEmpty;

        return (
          resourceTagNotIdCondition &&
          resourceEpisodeIdCondition &&
          resourceTagIdCondition
        );
      });

      return iterator(filteredResources, group);
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
    | Promise<PostProcessedResourceItemForUpload[]>
    | PostProcessedResourceItemForUpload[];
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
  ): Promise<IResourceItem[]> | IResourceItem[];
  abstract beforePreviewAssetDelivered(
    resource: IPostProcessedResourceFileForUpload
  ):
    | Promise<PostProcessedResourceItemForUpload>
    | PostProcessedResourceItemForUpload;
}
