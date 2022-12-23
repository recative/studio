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
import { FormControl } from 'baseui/form-control';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { ModalManager } from 'utils/hooks/useModalManager';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { useEvent } from 'utils/hooks/useEvent';
import { server } from 'utils/rpc';

export const useAddPermissionModal = ModalManager<unknown, null>(null);

const INITIAL_FORM_VALUE = {
  id: '',
  notes: '',
};

interface IAddPermissionModalProps {
  onDataRefreshRequest: () => void;
}

export const AddPermissionModal: React.FC<IAddPermissionModalProps> = ({
  onDataRefreshRequest,
}) => {
  const [isOpen, , , onClose] = useAddPermissionModal();

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(INITIAL_FORM_VALUE);

  const handleIdChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.id
  );
  const handleNotesChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.notes
  );

  const handleAddPermission = useEvent(async () => {
    await server.addPermission(clonedConfig.id, clonedConfig.notes);
    onDataRefreshRequest();
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
      size={MODAL_SIZE.auto}
    >
      <ModalHeader>Add Permission</ModalHeader>
      <ModalBody>
        <RecativeBlock minWidth="400px">
          <FormControl
            label="ID"
            caption="The unique identity of the permission"
          >
            <Input
              size={INPUT_SIZE.mini}
              value={clonedConfig.id}
              onChange={handleIdChange}
            />
          </FormControl>
          <FormControl
            label="Notes"
            caption="Human readable notes for the permission identity"
          >
            <Input
              size={INPUT_SIZE.mini}
              value={clonedConfig.notes}
              onChange={handleNotesChange}
            />
          </FormControl>
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton onClick={handleAddPermission}>Add</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
