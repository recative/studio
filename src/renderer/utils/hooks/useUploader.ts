import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useGetSet, useInterval } from 'react-use';

import { flatten } from 'lodash';

import { IResourceItem } from '@recative/definitions';

import { server } from 'utils/rpc';

export const useUploader = (
  onProgressChange?: () => void,
  onFinished?: (x: IResourceItem[], containGroup: boolean) => void,
  replacedFileId?: string
) => {
  const [error, setError] = React.useState<string | undefined>(undefined);

  const [isUploading, setIsUploading] = React.useState(false);
  const [getCurrentFileIndex, setCurrentFileIndex] = useGetSet(-1);
  const [getCurrentFilePath, setCurrentFilePath] = useGetSet<string | null>(
    null
  );
  const [getTotalFiles, setTotalFiles] = useGetSet(-1);

  const [currentProgress, currentProgressActions] = useAsync(async () => {
    const filePath = getCurrentFilePath();

    if (filePath === null) {
      return undefined;
    }

    const progress = await server.getImportProgress(filePath);

    return {
      text: progress.text,
      progress: Math.round(
        ((getCurrentFileIndex() + progress.progress) / getTotalFiles()) * 100
      ),
    };
  });

  useInterval(currentProgressActions.execute, isUploading ? 500 : null);

  const handleDrop = React.useCallback<
    (
      accepted: File[],
      rejected: File[],
      event: React.DragEvent<HTMLElement>
    ) => Promise<IResourceItem[]>
  >(
    async (acceptedFiles) => {
      setCurrentFileIndex(0);
      setTotalFiles(acceptedFiles.length);
      setIsUploading(true);
      let taskFinished = 0;
      let containGroup = false;

      const files: IResourceItem[] = [];

      for (let i = 0; i < acceptedFiles.length; i += 1) {
        const file = acceptedFiles[i];

        setCurrentFilePath(file.path);
        try {
          const result = await server.importFile(file.path, replacedFileId);

          if (result.find((x) => x.type === 'group')) {
            containGroup = true;
          }

          taskFinished += 1;
          setCurrentFileIndex(taskFinished);
          onProgressChange?.();
          server.removeImportProgress(file.path);

          files.push(...result);
        } catch (e) {
          setError(e instanceof Error ? e.message : `${e}`);
          break;
        }
      }

      onFinished?.(flatten(files), containGroup);
      setIsUploading(false);
      setCurrentFileIndex(-1);
      currentProgressActions.reset();

      return files;
    },
    [
      currentProgressActions,
      onFinished,
      onProgressChange,
      replacedFileId,
      setCurrentFileIndex,
      setCurrentFilePath,
      setTotalFiles,
    ]
  );

  const progressAmount = React.useMemo(() => {
    return isUploading ? currentProgress?.result?.progress : undefined;
  }, [currentProgress?.result?.progress, isUploading]);

  const progressMessage = React.useMemo(() => {
    return isUploading ? currentProgress?.result?.text : undefined;
  }, [currentProgress?.result?.text, isUploading]);

  return {
    error,
    isUploading,
    handleDrop,
    progressAmount,
    progressMessage,
  };
};
