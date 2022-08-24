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

import type { IResourceFile } from '@recative/definitions';

import { uploadSingleFile } from '../utils/uploadSingleFile';

export interface IReplaceFileModalProps {
  isOpen: boolean;
  fileId?: string;
  multipleFileError?: boolean;
  /**
   * The old file to be replaced and new file created by resource extensions.
   */
  onReplaced: (oldFileId: string, newFiles: IResourceFile[]) => void;
  onClose: () => void;
}

const fileUploaderOverrides: FileUploaderOverrides = {
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
};

/**
 * A modal to help user replace their files, base-ui allows user to drop multiple
 * file but we'll only use the first file here, since only one fill could be
 * replaced.
 */
export const ReplaceFileModal: React.FC<IReplaceFileModalProps> = ({
  isOpen,
  onReplaced,
  onClose,
  fileId,
  multipleFileError,
}) => {
  const [error, setError] = React.useState<string | undefined>(undefined);

  const handleDrop = React.useCallback(
    async (files: File[]) => {
      if (files.length !== 1) {
        setError('Please select a single file');
        return;
      }

      if (!fileId) {
        setError('Please select a file to replace');
        return;
      }

      const resources = await uploadSingleFile(files[0], fileId);

      onReplaced(
        fileId,
        // It's safe to filter these file since on the server side, we add all
        // files to the group of replaced file, and no new group will be created.
        resources.filter((x) => x.type === 'file') as IResourceFile[]
      );
      onClose();
    },
    [fileId, onReplaced, onClose]
  );

  React.useEffect(() => {
    setError(undefined);
  }, [error]);

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
      closeable
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Replace File</ModalHeader>
      <ModalBody>
        {errorElement || (
          <RecativeBlock paddingBottom="4px">
            <FileUploader
              errorMessage={error}
              onDrop={handleDrop}
              overrides={fileUploaderOverrides}
            />
          </RecativeBlock>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose}>OK</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
