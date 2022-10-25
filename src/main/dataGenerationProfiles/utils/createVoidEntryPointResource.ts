import { IResourceFile } from '@recative/definitions';
import { ResourceFileForImport } from '@recative/extension-sdk';

export const createVoidEntryPointResource = () => {
  const entryPointResource = new ResourceFileForImport();
  entryPointResource.definition.id = '@RECATIVE_AP';
  entryPointResource.definition.label = 'Recative AP Entrypoint';
  entryPointResource.definition.mimeType = 'text/html';
  entryPointResource.definition.originalHash = '@EMPTY';

  const hash = entryPointResource.definition.convertedHash as Record<
    string,
    string
  >;
  hash.md5 = '@EMPTY';
  hash.xxHash = '@EMPTY';
  delete (entryPointResource.definition as Record<string, unknown>)
    .postProcessedFile;

  delete (entryPointResource.definition as Record<string, unknown>)
    .postProcessedThumbnail;

  return entryPointResource.finalize() as unknown as Promise<IResourceFile>;
};
