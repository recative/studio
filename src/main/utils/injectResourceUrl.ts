import {
  IResourceItemForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';

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
  key = RESOURCE_MANAGER_KEY
): T[] => {
  return resources.map((resource) => {
    if (resource.type === 'file') {
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

export const injectResourceUrlForPlayerShells = <
  T extends IDetailedResourceItemForClient | IResourceItemForClient
>(
  resources: T[]
): T[] => {
  const step0 = injectResourceUrl(
    resources,
    DESKTOP_SHELL_URL_PATTERN,
    DESKTOP_SHELL_KEY
  );
  const step1 = injectResourceUrl(
    step0,
    MOBILE_SHELL_BUILD_IN_URL_PATTERN,
    MOBILE_SHELL_BUILD_IN_KEY
  );

  return step1;
};
