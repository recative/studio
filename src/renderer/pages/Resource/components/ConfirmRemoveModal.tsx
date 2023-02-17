import * as React from 'react';

import { useAtom } from 'jotai';
import { useEvent } from 'utils/hooks/useEvent';
import { useGetSet } from 'react-use';
import { useKeyboardEvent } from '@react-hookz/web';

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

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { ModalManager } from 'utils/hooks/useModalManager';
import { useKeyPressed } from 'utils/hooks/useKeyPressed';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { server } from 'utils/rpc';

import { getSelectedId } from '../utils/getSelectedId';

export interface IConfirmRemoveModalProps {
  onRefreshResourceListRequest: () => void;
}

export const useConfirmRemoveModal = ModalManager<unknown, null>(null);

export const ConfirmRemoveModal: React.FC<IConfirmRemoveModalProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [isOpen, , onOpen, onClose] = useConfirmRemoveModal();

  const [isHard, setIsHardRemove] = useGetSet<boolean>(false);
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const shiftPressed = useKeyPressed('Shift');

  const handleRemoveResourceModalOpen = useEvent(() => {
    setIsHardRemove(shiftPressed);
    return onOpen(0);
  });

  const handleRemoveResourceConfirmed = useEvent(async () => {
    if (!workspaceConfiguration) return;

    await server.removeResources(getSelectedId(), isHard());
    setIsHardRemove(false);
    onClose();
    onRefreshResourceListRequest();
  });

  useKeyboardEvent('Delete', handleRemoveResourceModalOpen);

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Remove Resource</ModalHeader>
      <ModalBody>
        {!isHard() && (
          <RecativeBlock>
            The selected file will be marked as deleted and will no longer be
            available.
          </RecativeBlock>
        )}
        {isHard() && (
          <RecativeBlock color="negative">
            The selected file will be <strong>permanently deleted</strong>,
            including the database record nor the files on the hard disk; this
            operation is irreversible.
          </RecativeBlock>
        )}
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleRemoveResourceConfirmed}>
          Remove
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
