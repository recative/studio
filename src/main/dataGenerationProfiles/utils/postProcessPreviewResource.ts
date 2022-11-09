import { Draft, produce } from 'immer';
import type {
  IResourceFileForClient,
  IResourceGroupForClient,
} from '@recative/definitions';
import type { ResourceProcessor } from '@recative/extension-sdk';

import { PerformanceLog } from '../../utils/performanceLog';
import { getResourceProcessorInstances } from '../../utils/getResourceProcessorInstances';

export const injectByResourceProcessor = async <
  T extends IResourceFileForClient | IResourceGroupForClient
>(
  resources: T[]
): Promise<T[]> => {
  const logPerformance = PerformanceLog('inject-brp');
  const resourceProcessorInstances: [string, ResourceProcessor<string>][] =
    Object.entries(getResourceProcessorInstances(''));

  let result = resources;

  for (const [extensionKey, instance] of resourceProcessorInstances) {
    result = await produce(result, async (draft: Draft<T[]>) => {
      return (
        (await instance.beforePreviewResourceMetadataDelivered(draft)) ?? draft
      );
    });

    const splittedKey = extensionKey.split('/');
    logPerformance(`b4PvDeliver - ${splittedKey[splittedKey.length - 1]}`);
  }

  return result;
};
