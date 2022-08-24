import * as React from 'react';
import { useAtom } from 'jotai';

import { FileUploader } from 'baseui/file-uploader';
import { SIZE as BUTTON_SIZE } from 'baseui/button';
import type { FileUploaderOverrides } from 'baseui/file-uploader';

import { IResourceItem } from '@recative/definitions';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';
import { useUploader } from 'utils/hooks/useUploader';

const fileUploaderOverrides: FileUploaderOverrides = {
  ContentMessage: {
    style: ({ $theme }) => ({
      maxWidth: '160px',
      fontSize: $theme.typography.LabelXSmall.fontSize,
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    }),
  },
  ButtonComponent: {
    props: {
      size: BUTTON_SIZE.mini,
      overrides: {
        BaseButton: {
          style: {
            marginTop: '12px',
            borderRadius: '0',
          },
        },
      },
    },
  },
  CancelButtonComponent: {
    props: {
      overrides: {
        BaseButton: {
          style: {
            display: 'none',
          },
        },
      },
    },
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

  const { error, handleDrop, progressAmount, progressMessage } = useUploader(
    onProgressChange,
    onFinished,
    undefined
  );

  if (!workspaceConfiguration) {
    return <>Workspace is not ready, unable to initialize uploader</>;
  }

  return (
    <FileUploader
      disabled={disabled}
      overrides={fileUploaderOverrides}
      errorMessage={error}
      progressAmount={progressAmount}
      progressMessage={progressMessage}
      onDrop={handleDrop}
    />
  );
};
