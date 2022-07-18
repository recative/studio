import * as React from 'react';

import { Block } from 'baseui/block';
import { Input } from 'baseui/input';
import { FormControl } from 'baseui/form-control';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Checkbox, LABEL_PLACEMENT } from 'baseui/checkbox';
import {
  Modal,
  ModalBody,
  ModalHeader,
  ModalFooter,
  ModalButton,
  ROLE,
  SIZE,
} from 'baseui/modal';

import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';

export interface IPublishFormValue {
  ifBuildDbRelease: boolean;
  ifCreateCodeBundle: boolean;
  notes: string;
}

export interface IFastPublishFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (x: IPublishFormValue) => void;
}

const INITIAL_FORM_VALUE: IPublishFormValue = {
  ifBuildDbRelease: false,
  ifCreateCodeBundle: false,
  notes: '',
};

const usePublishFormValues = () => {
  const [formValue, setFormValue] = useFormChangeCallbacks(INITIAL_FORM_VALUE);

  return { formValue, setFormValue };
};

export const FastPublishFormModal: React.FC<IFastPublishFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { formValue, setFormValue } = usePublishFormValues();

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
      <ModalHeader>Fast Publish</ModalHeader>
      <ModalBody>
        <Block>
          <FormControl label="Publish Type">
            <Block>
              <Checkbox
                checked={formValue?.ifBuildDbRelease || false}
                onChange={(event) =>
                  setFormValue?.ifBuildDbRelease(event.currentTarget.checked)
                }
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Create Media Release
              </Checkbox>
              <Checkbox
                checked={formValue?.ifCreateCodeBundle || false}
                onChange={(event) =>
                  setFormValue?.ifCreateCodeBundle(event.currentTarget.checked)
                }
                labelPlacement={LABEL_PLACEMENT.right}
              >
                Create Code Release
              </Checkbox>
            </Block>
          </FormControl>
          <FormControl label="Notes">
            <Input
              value={formValue?.notes || ''}
              onChange={(event) =>
                setFormValue?.notes(event.currentTarget.value)
              }
            />
          </FormControl>
        </Block>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton
          onClick={() => {
            onSubmit(formValue);
            onClose();
          }}
        >
          Publish
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
