import log from 'electron-log';
import { readFile } from 'fs/promises';

import { PostProcessedResourceItemForImport } from '@recative/extension-sdk';

import { getDb } from '../db';
import { getResourceFilePath } from '../../utils/getResourceFile';
import { getResourceProcessorInstances } from '../../utils/getExtensionInstances';

export const migration = async () => {
  const db = await getDb();

  const resourceProcessorInstances = Object.entries(
    await getResourceProcessorInstances('')
  );

  const resources = db.resource.resources.find({
    type: 'file',
    mimeType: 'image/png',
  });

  log.log('::: Migrating resources', resources.length);

  let preprocessedFiles: PostProcessedResourceItemForImport[] =
    await Promise.all(
      resources.map(async (x) => ({
        ...x,
        postProcessedFile: await readFile(await getResourceFilePath(x)),
        postProcessedThumbnail: null,
      }))
    );

  for (let i = 0; i < resourceProcessorInstances.length; i += 1) {
    log.log(
      `:: :: Migrating Plugin ${i + 1} of ${resourceProcessorInstances.length}`
    );
    const [id, processor] = resourceProcessorInstances[i];

    if (id !== '@recative/extension-rs-atlas/TextureAnalysisProcessor') {
      continue;
    }

    const processedFiles = await processor.beforeFileImported(
      preprocessedFiles
    );

    if (processedFiles) {
      preprocessedFiles = processedFiles;
    }
  }

  log.log(`:: :: Cleaning up`);
  const metadataForImport = await Promise.all(
    preprocessedFiles.map(async (resource) => {
      if (resource.type !== 'file') {
        return resource;
      }

      const originalFile = db.resource.resources.findOne({ id: resource.id });

      if (!originalFile || originalFile.type !== 'file') {
        throw new TypeError('Unable to find file');
      }

      const { postProcessedFile, ...metadata } = resource;

      return { ...originalFile, ...metadata };
    })
  );

  db.resource.resources.update(metadataForImport);
};
