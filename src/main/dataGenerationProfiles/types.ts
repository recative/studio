import { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';

import type { IResourceItemForClient } from '@recative/definitions';

export type InjectApEntryPointsFunction = <
  T extends IResourceItemForClient | IPostProcessedResourceFileForUpload
>(
  x: T[]
) => Promise<T[]> | T[];

export type InjectResourceUrlsFunction = <
  T extends IResourceItemForClient | IPostProcessedResourceFileForUpload
>(
  x: T[]
) => Promise<T[]> | T[];

export declare abstract class ClientProfile {
  injectApEntryPoints: InjectApEntryPointsFunction;

  injectResourceUrls: InjectResourceUrlsFunction;
}
