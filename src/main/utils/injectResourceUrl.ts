import {
  IResourceItemForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';
import { IBundleProfile } from '@recative/extension-sdk';

import {
  DESKTOP_SHELL_KEY,
  RESOURCE_MANAGER_KEY,
  MOBILE_SHELL_BUILD_IN_KEY,
} from './buildInResourceUploaderKeys';

const DESKTOP_SHELL_URL_PATTERN = 'recative://media/$resourceId';
const MOBILE_SHELL_BUILD_IN_URL_PATTERN =
  '/bundle/resource/$resourceId.resource';

const constructResourceManagerUrlPattern = (
  resourceHostName = 'localhost:9999',
  resourceProtocol = 'http'
) => {
  return `${resourceProtocol}://${resourceHostName}/resource/$resourceId/binary`;
};

export const injectResourceUrl = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  resources: T[],
  pattern = constructResourceManagerUrlPattern('localhost:9999', 'http'),
  key = RESOURCE_MANAGER_KEY,
  filter: (x: T) => boolean = () => true
): T[] => {
  return resources.map((resource) => {
    const filterResult = filter(resource);
    if (resource.type === 'file' && filterResult) {
      const url = pattern.replaceAll('$resourceId', resource.id);

      return {
        ...resource,
        url: {
          ...resource.url,
          [key]: url,
        },
      };
    }
    if (resource.type === 'group') {
      return {
        ...resource,
        files: resource.files.map((file) => {
          if (typeof file === 'string') {
            return file;
          }

          const internalFilterResult = filter(resource);

          if (!internalFilterResult) {
            return file;
          }

          const url = pattern.replaceAll('$resourceId', file.id);
          return {
            ...file,
            url: {
              ...file.url,
              [key]: url,
            },
          };
        }),
      };
    }
    return resource;
  }) as T[];
};

export const injectResourceUrlForResourceManager = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  resources: T[],
  resourceHost: string,
  resourceProtocol: string
): T[] => {
  const step0 = injectResourceUrl(
    resources,
    constructResourceManagerUrlPattern(resourceHost, resourceProtocol)
  );
  const step1 = injectResourceUrl(
    step0,
    'http://localhost:12453/notExists',
    '@recative/uploader-extension-error/not-exists'
  );

  return step1;
};

export const injectResourceUrlForBundleProfile = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  resources: T[],
  resourceHost: string,
  resourceProtocol: string,
  profile: IBundleProfile
): T[] => {
  const step0 = injectResourceUrl(
    resources,
    constructResourceManagerUrlPattern(resourceHost, resourceProtocol)
  );
  const step1 = injectResourceUrl(
    step0,
    'http://localhost:12453/notExists',
    '@recative/uploader-extension-error/not-exists'
  );

  return step1;
};

export const injectResourceUrlForPlayerShells = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  resources: T[]
): T[] => {
  let result = resources;
  result = injectResourceUrl(
    resources,
    DESKTOP_SHELL_URL_PATTERN,
    DESKTOP_SHELL_KEY
  );
  result = injectResourceUrl(
    result,
    MOBILE_SHELL_BUILD_IN_URL_PATTERN,
    MOBILE_SHELL_BUILD_IN_KEY,
    (x) => x.type !== 'file' || x.cacheToHardDisk
  );

  return result;
};
