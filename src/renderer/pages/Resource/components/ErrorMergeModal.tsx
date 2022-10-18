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

import { ModalManager } from 'utils/hooks/useModalManager';

export const useErrorMergeModal = ModalManager<string, null>(null);

export const ErrorMergeModal: React.FC = () => {
  const [isOpen, message, , onClose] = useErrorMergeModal();
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
