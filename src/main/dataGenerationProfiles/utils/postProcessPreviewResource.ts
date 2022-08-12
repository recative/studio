/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { cloneDeep } from 'lodash';
import type {
  IResourceFileForClient,
  IResourceGroupForClient,
  IDetailedResourceGroupForClient,
} from '@recative/definitions';
import type { ResourceProcessor } from '@recative/extension-sdk';

import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';

export const injectByResourceProcessor = async <
  T extends
    | IResourceFileForClient
    | IResourceGroupForClient
    | IDetailedResourceGroupForClient
>(
  resources: T[]
): Promise<T[]> => {
  const resourceProcessorInstances: [string, ResourceProcessor<string>][] =
    Object.entries(getResourceProcessorInstances(''));

  let result = cloneDeep(resources);
  for (const [, instance] of resourceProcessorInstances) {
    const postProcessed = await instance.beforePreviewResourceMetadataDelivered(
      result
    );

    if (postProcessed) {
      result = postProcessed;
    }
  }

  return result;
};
