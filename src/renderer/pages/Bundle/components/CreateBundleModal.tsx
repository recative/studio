import * as React from 'react';

import { useStyletron } from 'styletron-react';
import { atom } from 'jotai';

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
import { useToggleAtom } from 'utils/hooks/useToggleAtom';

import { BundleOptionItem } from './BundleOptionItem';

export interface ICreateBundleModalProps {
  onSubmit: () => void;
}

const ulStyles = {
  paddingLeft: '0',
  paddingRight: '0',
  listStyle: 'none',
};

const showBundleOptionModalAtom = atom(false);

export const useCreateBundleModal = () => {
  return useToggleAtom(showBundleOptionModalAtom);
};

export const CreateBundleModal: React.FC<ICreateBundleModalProps> = ({
  onSubmit,
}) => {
  const [css] = useStyletron();
  const [showBundleOption, , onClose] = useToggleAtom(
    showBundleOptionModalAtom
  );

  return (
    <Modal
      onClose={onClose}
      isOpen={showBundleOption}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Create Bundle</ModalHeader>
      <ModalBody>
        <ul className={css(ulStyles)}>
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
          <BundleOptionItem title="Hello" description="World" />
        </ul>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton kind={BUTTON_KIND.primary} onClick={onSubmit}>
          OK
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
