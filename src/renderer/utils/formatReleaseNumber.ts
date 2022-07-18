import { IBundleRelease } from '@recative/definitions';

export const formatReleaseNumber = (item: IBundleRelease) =>
  `b${item.id}.m${item.mediaBuildId}.c${item.codeBuildId}`;
