import type {
  IActPoint,
  IResourceItemForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';
import { IPostProcessedResourceFileForUpload } from '@recative/extension-sdk';

export type InjectApEntryPointsFunction = (
  x: IActPoint[]
) => Promise<IActPoint[]> | IActPoint[];
export type InjectResourceUrlsFunction = <
  T extends
    | IDetailedResourceItemForClient
    | IResourceItemForClient
    | IPostProcessedResourceFileForUpload
>(
  x: T[]
) => Promise<T[]> | T[];

export declare abstract class ClientProfile {
  injectApEntryPoints: InjectApEntryPointsFunction;

  injectResourceUrls: InjectResourceUrlsFunction;
}
