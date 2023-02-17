import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

import {
  ROLE,
  SIZE,
  Modal,
  ModalBody,
  ModalHeader,
  ModalButton,
  ModalFooter,
} from 'baseui/modal';
import { KIND as BUTTON_KIND } from 'baseui/button';

import { ModalManager } from 'utils/hooks/useModalManager';

export interface IModalManagerPayload {
  extension: string;
  id: string;
  payload: unknown;
}

export const useConfirmExecuteScriptModal = ModalManager<
  IModalManagerPayload,
  null
>(null);

export const ConfirmExecuteScriptModal: React.FC = () => {
  const [isOpen, script, , onClose] = useConfirmExecuteScriptModal();

  const handleSubmitClick = useEvent(async () => {
    if (!script) {
      throw new Error(`No payload available`);
    }

    onClose();
  });

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={SIZE.default}
    >
      <ModalHeader>Scriptlet</ModalHeader>
      <ModalBody>
        Would you like to execute {script?.id ?? 'unknown script'} provided by{' '}
        {script?.extension}?
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleSubmitClick}>Confirm</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
