/* eslint-disable no-case-declarations */
import {
  IDetailedResourceItemForClient,
  IResourceItemForClient,
  REDIRECT_URL_EXTENSION_ID,
} from '@recative/definitions';

import type { IResourceItem } from '@recative/definitions';
import type {
  IBundleProfile,
  PostProcessedResourceItemForUpload,
} from '@recative/extension-sdk';

export const ifResourceIncludedInBundle = (
  resource:
    | IResourceItem
    | IResourceItemForClient
    | IDetailedResourceItemForClient
    | PostProcessedResourceItemForUpload,
  mediaReleaseId: number,
  profile: IBundleProfile
) => {
  if (resource.type === 'group') {
    return false;
  }

  if (resource.removed) {
    return false;
  }

  if (profile.offlineAvailability === 'bare') {
    return false;
  }

  const resourceHasRedirectUrl = REDIRECT_URL_EXTENSION_ID in resource.url;
  const resourceHasRedirectKey = !!resource.redirectTo;

  const resourceRedirected = resourceHasRedirectUrl || resourceHasRedirectKey;

  const isPostProcessed = 'postProcessRecord' in resource;
  const includedPostProcessed =
    'postProcessRecord' in resource &&
    resource.postProcessRecord.mediaBundleId.includes(mediaReleaseId);

  const validPostProcessed = !isPostProcessed || includedPostProcessed;

  switch (profile.offlineAvailability) {
    case 'partial':
      const resourceDoNotHaveAnyEpisode = resource.episodeIds.length === 0;
      const { cacheToHardDisk } = resource;

      return (
        resourceDoNotHaveAnyEpisode &&
        cacheToHardDisk &&
        !resourceRedirected &&
        validPostProcessed
      );
    case 'full':
      return !resourceRedirected && validPostProcessed;
    default:
      throw new TypeError(
        `Invalid offline availability: ${profile.offlineAvailability}`
      );
  }
};
