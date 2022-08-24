import * as React from 'react';
import { useAtom } from 'jotai';
import { useGetSet } from 'react-use';
import { flatten } from 'lodash';

import { FileUploader } from 'baseui/file-uploader';
import type { FileUploaderOverrides } from 'baseui/file-uploader';

import { IResourceItem } from '@recative/definitions';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';
import { uploadSingleFile } from '../utils/uploadSingleFile';

const fileUploaderOverrides: FileUploaderOverrides = {
  ContentMessage: {
    style: ({ $theme }) => ({
      fontSize: $theme.typography.LabelSmall.fontSize,
    }),
  },
  FileDragAndDrop: {
    style: {
      padding: '36px 8px',
    },
  },
};

interface IUploaderProps {
  disabled?: boolean;
  onProgressChange: () => void;
  onFinished?: (x: IResourceItem[], containGroup: boolean) => void;
}

export const Uploader: React.FC<IUploaderProps> = ({
  disabled,
  onProgressChange,
  onFinished,
}) => {
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);
  const [getProgress, setProgress] = useGetSet(-1);

  if (!workspaceConfiguration) {
    return <>Workspace is not ready, unable to initialize uploader</>;
  }

  return (
    <FileUploader
      disabled={disabled}
      overrides={fileUploaderOverrides}
      progressAmount={getProgress() === -1 ? undefined : getProgress()}
      progressMessage={getProgress() !== -1 ? `Importing Files...` : ''}
      onDrop={async (acceptedFiles) => {
        setProgress(0);
        let taskFinished = 0;
        let containGroup = false;
        const files = await Promise.all(
          acceptedFiles.map(async (file) => {
            const result = await uploadSingleFile(file);

            if (result.find((x) => x.type === 'group')) {
              containGroup = true;
            }

            taskFinished += 1;
            setProgress(
              Math.round((taskFinished / acceptedFiles.length) * 100)
            );
            onProgressChange();

            return result;
          })
        );

        onFinished?.(flatten(files), containGroup);
        setProgress(-1);
      }}
    />
  );
};
