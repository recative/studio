import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { FileUploader } from 'baseui/file-uploader';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalButton,
  ModalFooter,
  ROLE,
  SIZE,
} from 'baseui/modal';
import type { FileUploaderOverrides } from 'baseui/file-uploader';

import { useUploader } from 'utils/hooks/useUploader';
import { ModalManager } from 'utils/hooks/useModalManager';
import { getSelectedId } from '../utils/getSelectedId';

export interface IReplaceFileModalProps {
  onRefreshResourceListRequest: () => void;
}

export const fileUploaderOverrides: FileUploaderOverrides = {
  Root: {
    style: {
      width: '--webkit-fill-available',
    },
  },
  FileDragAndDrop: {
    style: {
      height: '320px',
      justifyContent: 'center',
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
};

export const useReplaceFileModal = ModalManager<unknown, null>(null);

/**
 * A modal to help user replace their files, base-ui allows user to drop multiple
 * file but we'll only use the first file here, since only one fill could be
 * replaced.
 */
export const ReplaceFileModal: React.FC<IReplaceFileModalProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [error, setError] = React.useState<string | undefined>(undefined);

  const [isOpen, , , internalOnClose] = useReplaceFileModal();

  const [fileId, setSelectedResource] = React.useState<string | undefined>(
    undefined
  );
  const [multipleFileError, setMultipleFileError] =
    React.useState<boolean>(false);

  React.useLayoutEffect(() => {
    if (isOpen) {
      const files = getSelectedId();

      setMultipleFileError(files.length > 1);
      setSelectedResource(files[0]);
    }
  }, [isOpen]);

  const onClose = React.useCallback(() => {
    internalOnClose();
    setSelectedResource(undefined);
    setMultipleFileError(false);
  }, [internalOnClose]);

  const {
    isUploading,
    error: internalError,
    handleDrop: internalHandleDrop,
    progressAmount,
    progressMessage,
  } = useUploader(undefined, onClose, fileId);

  const handleDrop = React.useCallback<
    (
      accepted: File[],
      rejected: File[],
      event: React.DragEvent<HTMLElement>
    ) => unknown
  >(
    async (acceptedFiles, rejectedFiles, event) => {
      if (acceptedFiles.length !== 1) {
        setError('Please select a single file');
        return;
      }

      if (!fileId) {
        setError('Please select a file to replace');
        return;
      }

      await internalHandleDrop([acceptedFiles[0]], rejectedFiles, event);

      onRefreshResourceListRequest();
    },
    [fileId, internalHandleDrop, onRefreshResourceListRequest]
  );

  React.useLayoutEffect(() => {
    if (isOpen) {
      setError(undefined);
    }
  }, [isOpen]);

  let errorElement: React.ReactNode = null;

  if (multipleFileError) {
    errorElement = (
      <RecativeBlock>
        Unable to replace multiple file at the same time.
      </RecativeBlock>
    );
  } else if (!fileId) {
    errorElement = (
      <RecativeBlock>Please select a file to replace.</RecativeBlock>
    );
  }

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={!isUploading}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Replace File</ModalHeader>
      <ModalBody>
        {errorElement || (
          <RecativeBlock paddingBottom="4px">
            <FileUploader
              errorMessage={internalError ?? error}
              onDrop={handleDrop}
              overrides={fileUploaderOverrides}
              progressAmount={progressAmount}
              progressMessage={progressMessage}
            />
          </RecativeBlock>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton disabled={isUploading} onClick={onClose}>
          OK
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
