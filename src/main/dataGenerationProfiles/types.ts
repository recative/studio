import type {
  IActPoint,
  IResourceItemForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';

export type InjectApEntryPointsFunction = (
  x: IActPoint[]
) => Promise<IActPoint[]> | IActPoint[];
export type InjectResourceUrlsFunction = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  x: T[]
) => Promise<T[]> | T[];

export declare abstract class ClientProfile {
  injectApEntryPoints: InjectApEntryPointsFunction;

  injectResourceUrls: InjectResourceUrlsFunction;
}
