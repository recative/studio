import * as React from 'react';
import {
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalButton,
  ROLE,
} from 'baseui/modal';

export interface IBundleReleaseSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BundleReleaseSuccessModal: React.VFC<IBundleReleaseSuccessModalProps> =
  ({ isOpen, onClose }) => {
    return (
      <Modal
        onClose={onClose}
        closeable
        isOpen={isOpen}
        animate
        autoFocus
        role={ROLE.dialog}
      >
        <ModalHeader>Success</ModalHeader>
        <ModalBody>Your bundle release was generated successfully.</ModalBody>
        <ModalFooter>
          <ModalButton onClick={onClose}>Okay</ModalButton>
        </ModalFooter>
      </Modal>
    );
  };
