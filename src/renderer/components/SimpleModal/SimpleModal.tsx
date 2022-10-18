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

import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';

export interface ISimpleModalProps<T> {
  onCancel: ((x: T | null) => void) | null;
  onSubmit: ((x: T | null) => void) | null;
}

export const SimpleModalFactory = <T,>(
  head: string | ((x: T | null) => React.ReactNode),
  body: string | ((x: T | null) => React.ReactNode),
  confirm: string | ((x: T | null) => React.ReactNode),
  cancel?: string | ((x: T | null) => React.ReactNode)
) => {
  const useModalManager = ModalManager<T, null>(null);

  const InternalSimpleModal: React.FC<ISimpleModalProps<T>> = ({
    onCancel,
    onSubmit,
  }) => {
    const [isOpen, data, , close] = useModalManager();

    const handleCancel = useEvent(() => {
      close();
      onCancel?.(data);
    });

    const handleSubmit = useEvent(() => {
      close();
      onSubmit?.(data);
    });

    return (
      <Modal
        isOpen={isOpen}
        animate
        autoFocus
        closeable={false}
        size={SIZE.default}
        role={ROLE.dialog}
      >
        <ModalHeader>
          {typeof head === 'string' ? head : head(data)}
        </ModalHeader>
        <ModalBody>{typeof body === 'string' ? head : body(data)}</ModalBody>
        <ModalFooter>
          {cancel && (
            <ModalButton kind={BUTTON_KIND.tertiary} onClick={handleCancel}>
              {typeof cancel === 'string' ? cancel : cancel(data)}
            </ModalButton>
          )}
          <ModalButton onClick={handleSubmit}>
            {typeof confirm === 'string' ? confirm : confirm(data)}
          </ModalButton>
        </ModalFooter>
      </Modal>
    );
  };

  return [React.memo(InternalSimpleModal), useModalManager] as const;
};
