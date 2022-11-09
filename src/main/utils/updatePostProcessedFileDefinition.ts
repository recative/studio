import type {
  PostProcessedResourceItemForUpload,
  PostProcessedResourceItemForImport,
} from '@recative/extension-sdk';

import { getDb } from '../rpc/db';
import { cleanupLoki } from '../rpc/query/utils';

export const updatePostProcessedFileDefinition = async (
  resource:
    | PostProcessedResourceItemForUpload
    | PostProcessedResourceItemForImport
) => {
  const db = await getDb();

  const resourceId = resource.id;

  const resourceDefinition = db.resource.postProcessed.findOne({
    id: resourceId,
  });

  if (!resourceDefinition) {
    throw new Error(`Resource ${resourceId} not found`);
  }

  // Here're two extra cleanup to prevent some extension blow up the database.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (resourceDefinition as any).postProcessedThumbnail;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  delete (resourceDefinition as any).postProcessedFile;

  Object.keys(cleanupLoki(resourceDefinition)).forEach((x) => {
    if (x in resource) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (resourceDefinition as any)[x] = (resource as any)[x];
    }
  });

  db.resource.postProcessed.update(resourceDefinition);
};
