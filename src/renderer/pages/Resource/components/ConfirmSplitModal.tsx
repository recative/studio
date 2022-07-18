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
import { KIND as BUTTON_KIND } from 'baseui/button';

export interface IConfirmSplitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ConfirmSplitModal: React.FC<IConfirmSplitModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
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
      <ModalHeader>Split Group</ModalHeader>
      <ModalBody>
        The selected groups will be split into separate resource files, this
        operation cannot be undone.
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary}>Cancel</ModalButton>
        <ModalButton onClick={onSubmit}>Split Groups</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
