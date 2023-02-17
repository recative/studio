import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import type { IEditableResourceFile } from '@recative/definitions';

import { server } from 'utils/rpc';

const DEFAULT_RESULT = {
  group: null,
  files: [] as IEditableResourceFile[],
};

export const useEditableResourceDefinition = (
  isOpen: boolean,
  selectedFileId: string | null
) => {
  const [selectedFile, selectedFileActions] = useAsync(async () => {
    if (!selectedFileId) return null;

    const { files, group } =
      (await server.getResourceWithDetailedFileList(selectedFileId)) ??
      DEFAULT_RESULT;

    const convertedFiles = files.map(
      (file) =>
        ({
          ...file,
          dirty: false,
        } as IEditableResourceFile)
    );

    return {
      files: convertedFiles,
      group,
    };
  });

  React.useEffect(() => {
    if (isOpen && selectedFileId) {
      void selectedFileActions.execute();
    } else {
      selectedFileActions.reset();
    }
  }, [isOpen, selectedFileId, selectedFileActions]);

  return selectedFile.result ?? DEFAULT_RESULT;
};
