import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

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

import { ModalManager } from 'utils/hooks/useModalManager';
import { server } from 'utils/rpc';

import { getSelectedId } from '../utils/getSelectedId';

export const useConfirmSplitModal = ModalManager<unknown, null>(null);

export interface IConfirmSplitModalProps {
  onRefreshResourceListRequest: () => void;
}

export const ConfirmSplitModal: React.FC<IConfirmSplitModalProps> = ({
  onRefreshResourceListRequest,
}) => {
  const [isOpen, , , onClose] = useConfirmSplitModal();

  const handleSplitGroups = useEvent(async () => {
    const selectedIds = getSelectedId();
    if (selectedIds.length) {
      await server.splitGroup(getSelectedId());
      onClose();
      onRefreshResourceListRequest();
    }
  });

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
        <ModalButton onClick={handleSplitGroups}>Split Groups</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
