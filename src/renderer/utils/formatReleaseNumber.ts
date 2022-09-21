import { IBundleRelease } from '@recative/definitions';

export const formatReleaseNumber = (item: IBundleRelease | undefined) =>
  item ? `b${item.id}.m${item.mediaBuildId}.c${item.codeBuildId}` : '.';
