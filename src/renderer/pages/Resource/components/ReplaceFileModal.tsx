import * as React from 'react';

import { RecativeBlock } from 'components/Block/Block';
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
import type { FileUploaderOverrides, StyleProps } from 'baseui/file-uploader';

import type { IResourceFile } from '@recative/definitions';

import { uploadSingleFile } from '../utils/uploadSingleFile';

export interface IReplaceFileModalProps {
  isOpen: boolean;
  fileId?: string;
  multipleFileError?: boolean;
  onReplaced: (file: IResourceFile) => void;
  onClose: () => void;
}

const fileUploaderOverrides: FileUploaderOverrides<StyleProps> = {
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
      }

      if (!fileId) {
        setError('Please select a file to replace');
      }

      const resource = await uploadSingleFile(files[0], fileId);
      onReplaced(resource[0] as IResourceFile);
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
