import * as React from 'react';

import {
  ROLE,
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  SIZE as MODAL_SIZE,
} from 'baseui/modal';
import { KIND as BUTTON_KIND } from 'baseui/button';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForBooleanType,
} from 'utils/hooks/useFormChangeCallbacks';
import { Checkbox } from 'baseui/checkbox';
import { useTerminalModal } from 'components/Terminal/TerminalModal';

export const useConfirmCreateBackupModal = ModalManager<unknown, null>(null);

const INITIAL_FORM_VALUE = {
  doPublish: true,
};

export const ConfirmCreateBackupModal: React.FC = () => {
  const [, , openTerminal] = useTerminalModal();
  const [isOpen, , , onClose] = useConfirmCreateBackupModal();

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(INITIAL_FORM_VALUE);

  const handlePublishChange = useOnChangeEventWrapperForBooleanType(
    valueChangeCallbacks.doPublish
  );

  const handleSubmit = useEvent(() => {
    onClose();
    openTerminal('createDatabaseBackup');
    server.uploadDatabaseBackup(clonedConfig.doPublish);
  });

  return (
    <Modal
      animate
      autoFocus
      isOpen={isOpen}
      closeable={false}
      onClose={onClose}
      role={ROLE.dialog}
      size={MODAL_SIZE.auto}
    >
      <ModalHeader>Backup Database</ModalHeader>
      <ModalBody>
        <RecativeBlock maxWidth="400px">
          Would you like to create a backup of your database to the cloud server
          now?
          <RecativeBlock marginTop="12px">
            <Checkbox
              checked={clonedConfig.doPublish}
              onChange={handlePublishChange}
            >
              <RecativeBlock fontWeight="normal" fontSize="14px">
                Publish all media resource before backing up
              </RecativeBlock>
            </Checkbox>
          </RecativeBlock>
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleSubmit}>Add</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
