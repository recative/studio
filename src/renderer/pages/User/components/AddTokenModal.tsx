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
import { DatePicker } from 'baseui/datepicker';
import { FormControl } from 'baseui/form-control';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { Select, SIZE as SELECT_SIZE } from 'baseui/select';

import { RecativeBlock } from 'components/Block/RecativeBlock';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
  useOnChangeEventWrapperForBaseUiDateValue,
  useOnChangeEventWrapperForBaseUiSelectWithMultipleValue,
} from 'utils/hooks/useFormChangeCallbacks';

const TOKEN_PERMISSIONS = [{ id: 'read' }, { id: 'write' }];

export const useAddTokenModal = ModalManager<unknown, null>(null);

const INITIAL_FORM_VALUE = {
  notes: '',
  expiredAt: new Date(),
  permissions: [] as string[],
};

export const AddTokenModal: React.FC = () => {
  const [isOpen, , , onClose] = useAddTokenModal();

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(INITIAL_FORM_VALUE);

  const handleExpiresAtChange = useOnChangeEventWrapperForBaseUiDateValue(
    valueChangeCallbacks.expiredAt
  );
  const handleNotesChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.notes
  );

  const handlePermissionsChange =
    useOnChangeEventWrapperForBaseUiSelectWithMultipleValue(
      valueChangeCallbacks.permissions
    );

  const permissionValues = React.useMemo(
    () => clonedConfig.permissions.map((id) => ({ id })),
    [clonedConfig.permissions]
  );

  const handleSubmit = useEvent(async () => {
    await server.addToken(
      clonedConfig.expiredAt,
      permissionValues.map((x) => x.id),
      clonedConfig.notes
    );

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
      <ModalHeader>Add Token</ModalHeader>
      <ModalBody>
        <RecativeBlock minWidth="400px">
          <FormControl label="Expires At" caption="When will the token expires">
            <DatePicker
              size={INPUT_SIZE.mini}
              value={clonedConfig.expiredAt}
              onChange={handleExpiresAtChange}
            />
          </FormControl>
          <FormControl
            label="Permissions"
            caption="Allowed permissions for this user"
          >
            <Select
              creatable
              multi
              size={SELECT_SIZE.mini}
              options={TOKEN_PERMISSIONS}
              labelKey="id"
              valueKey="id"
              onChange={handlePermissionsChange}
              value={permissionValues}
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
        <ModalButton onClick={handleSubmit}>Add</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
