import * as React from 'react';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';

export interface IErrorSplitModalProps {
  isOpen: boolean;
  message?: string | null;
  onClose: () => void;
}

export const ErrorSplitModal: React.FC<IErrorSplitModalProps> = ({
  isOpen,
  message,
  onClose,
}) => {
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
      <ModalHeader>Merge Group</ModalHeader>
      <ModalBody>{message}</ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose}>Okay</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
