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

import { useUploader } from 'utils/hooks/useUploader';
import { ModalManager } from 'utils/hooks/useModalManager';
import { IResourceFile } from '@recative/definitions';
import { fileUploaderOverrides } from './ReplaceFileModal';

export interface IReplaceFileModalProps {
  /**
   * The old file to be replaced and new file created by resource extensions.
   */
  onReplaced: (oldFileId: string, newFiles: IResourceFile[]) => void;
}

export const useReplaceFileModalForGroupModal = ModalManager<string, undefined>(
  undefined
);

/**
 * A modal to help user replace their files, base-ui allows user to drop multiple
 * file but we'll only use the first file here, since only one fill could be
 * replaced.
 */
export const ReplaceFileModalForGroupModal: React.FC<IReplaceFileModalProps> =
  ({ onReplaced }) => {
    const [error, setError] = React.useState<string | undefined>(undefined);

    const [isOpen, fileId, , onClose] = useReplaceFileModalForGroupModal();

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

        const resources = await internalHandleDrop(
          [acceptedFiles[0]],
          rejectedFiles,
          event
        );

        if (!fileId) {
          throw new TypeError(`File id not defined, this is not allowed`);
        }

        onReplaced(
          fileId,
          // It's safe to filter these file since on the server side, we add all
          // files to the group of replaced file, and no new group will be created.
          resources.filter((x) => x.type === 'file') as IResourceFile[]
        );
      },
      [fileId, internalHandleDrop, onReplaced]
    );

    React.useLayoutEffect(() => {
      if (isOpen) {
        setError(undefined);
      }
    }, [isOpen]);

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
        <ModalHeader>Replace File in Group</ModalHeader>
        <ModalBody>
          <RecativeBlock paddingBottom="4px">
            <FileUploader
              errorMessage={internalError ?? error}
              onDrop={handleDrop}
              overrides={fileUploaderOverrides}
              progressAmount={progressAmount}
              progressMessage={progressMessage}
            />
          </RecativeBlock>
        </ModalBody>
        <ModalFooter>
          <ModalButton disabled={isUploading} onClick={onClose}>
            OK
          </ModalButton>
        </ModalFooter>
      </Modal>
    );
  };
