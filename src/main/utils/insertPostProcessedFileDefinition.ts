import type {
  PostProcessedResourceItemForUpload,
  PostProcessedResourceItemForImport,
} from '@recative/extension-sdk';

import { getDb } from '../rpc/db';
import { cloneDeep } from './cloneDeep';
import { importedFileToFile } from '../rpc/query/utils/importedFileToFile';

export const insertPostProcessedFileDefinition = async (
  resource:
    | PostProcessedResourceItemForUpload
    | PostProcessedResourceItemForImport,
  eraseMediaBuildId: number | null = null
) => {
  const db = await getDb();

  const resourceId = resource.id;

  const resourceDefinition = db.resource.resources.findOne({
    id: resourceId,
  });

  if (resourceDefinition) {
    throw new Error(`Resource ${resourceId} already existed`);
  }

  const clonedResource = cloneDeep(resource);
  if ('postProcessRecord' in clonedResource) {
    clonedResource.postProcessRecord.mediaBundleId =
      clonedResource.postProcessRecord.mediaBundleId.filter(
        (x) => x !== eraseMediaBuildId
      );

    // Here're two extra cleanup to prevent some extension blow up the database.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (clonedResource as any).postProcessedThumbnail;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (clonedResource as any).postProcessedFile;

    db.resource.postProcessed.insert(clonedResource);
  } else if ('postProcessedThumbnail' in clonedResource) {
    db.resource.resources.insert(await importedFileToFile(clonedResource));
  } else {
    db.resource.resources.insert(clonedResource);
  }
};
