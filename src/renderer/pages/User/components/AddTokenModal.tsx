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

import { RecativeBlock } from 'components/Block/RecativeBlock';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForBaseUiDateValue,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { ModalManager } from 'utils/hooks/useModalManager';

export const useAddTokenModal = ModalManager<unknown, null>(null);

const INITIAL_FORM_VALUE = {
  token: '',
  notes: '',
  expiredAt: new Date(),
};

export const AddTokenModal: React.FC = () => {
  const [isOpen, , , onClose] = useAddTokenModal();

  const [clonedConfig, valueChangeCallbacks, ,] =
    useFormChangeCallbacks(INITIAL_FORM_VALUE);

  const handleTokenChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.token
  );
  const handleExpiresAtChange = useOnChangeEventWrapperForBaseUiDateValue(
    valueChangeCallbacks.expiredAt
  );
  const handleNotesChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.notes
  );

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
          <FormControl label="Token" caption="The content of the token">
            <Input
              size={INPUT_SIZE.mini}
              value={clonedConfig.token}
              onChange={handleTokenChange}
            />
          </FormControl>
          <FormControl label="Expires At" caption="When will the token expires">
            <DatePicker
              size={INPUT_SIZE.mini}
              value={clonedConfig.expiredAt}
              onChange={handleExpiresAtChange}
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
        <ModalButton>Add</ModalButton>
      </ModalFooter>
    </Modal>
  );
};
