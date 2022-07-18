import * as React from 'react';
import { atom, useAtom } from 'jotai';

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

const INITIALIZE_ERROR_MODAL_OPEN = atom(false);
const ERROR_MESSAGE = atom<React.ReactNode>(<></>);

export const useInitializeError = () => {
  const [, setIsOpen] = useAtom(INITIALIZE_ERROR_MODAL_OPEN);
  const [, setErrorMessage] = useAtom(ERROR_MESSAGE);

  const open = React.useCallback(
    (message: React.ReactNode) => {
      setErrorMessage(message);
      setIsOpen(true);
    },
    [setErrorMessage, setIsOpen]
  );

  const close = React.useCallback(() => {
    setErrorMessage(<></>);
    setIsOpen(false);
  }, [setErrorMessage, setIsOpen]);

  return [open, close] as const;
};

export const InitializeErrorModal: React.FC = () => {
  const [isOpen] = useAtom(INITIALIZE_ERROR_MODAL_OPEN);
  const [errorMessage] = useAtom(ERROR_MESSAGE);
  const [, onClose] = useInitializeError();

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
      <ModalHeader>Server Error</ModalHeader>
      <ModalBody>{errorMessage}</ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          OK
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
