import type { IResourceFile } from '@recative/definitions';

import type { IEditableResource } from '../ResourceEditor';

export const mergeFileConfigurationToManagedFile = <
  T extends IEditableResource | IResourceFile
>(
  file: T,
  files: T[]
) => {
  const mainFileTags = file.tags
    .filter(Boolean)
    .filter((x) => !x.endsWith('!'));

  files.forEach((x) => {
    x.tags = [...x.tags.filter((tag) => tag.endsWith('!')), ...mainFileTags];
    if ('dirty' in x) {
      x.dirty = true;
    }
  });

  return files;
};
