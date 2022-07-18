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
import { Block } from 'baseui/block';
import { KIND as BUTTON_KIND } from 'baseui/button';

export interface IConfirmRemoveModalProps {
  isOpen: boolean;
  isHard: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const ConfirmRemoveModal: React.FC<IConfirmRemoveModalProps> = ({
  isOpen,
  isHard,
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
      <ModalHeader>Remove Resource</ModalHeader>
      <ModalBody>
        {!isHard && (
          <Block>
            The selected file will be marked as deleted and will no longer be
            available.
          </Block>
        )}
        {isHard && (
          <Block color="negative">
            The selected file will be permanently deleted, including the
            database record nor the files on the hard disk; this operation is
            irreversible.
          </Block>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary}>Cancel</ModalButton>
        <ModalButton onClick={onSubmit}>Remove</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
