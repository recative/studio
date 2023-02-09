import * as React from 'react';

import { useStyletron } from 'baseui';

import {
  ROLE,
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  SIZE as MODAL_SIZE,
} from 'baseui/modal';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { ButtonGroup, MODE as BUTTON_GROUP_MODE } from 'baseui/button-group';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { MergeModeUseNewIconOutline } from 'components/Icons/MergeModeUseNewIconOutline';
import { MergeModeUseOldIconOutline } from 'components/Icons/MergeModeUseOldIconOutline';
import { MergeModeReplaceIconOutline } from 'components/Icons/MergeModeReplaceIconOutline';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { ModalManager } from 'utils/hooks/useModalManager';

export const useSelectSyncModeModal = ModalManager<void, null>(null);

interface IReplaceIconContentProps {
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  title: string;
}

const ReplaceIconContent: React.FC<IReplaceIconContentProps> = ({
  Icon,
  title,
}) => {
  return (
    <RecativeBlock>
      <RecativeBlock marginTop="4px">
        <Icon width={40} />
      </RecativeBlock>
      <RecativeBlock
        fontWeight="bold"
        marginTop="4px"
        fontSize="0.8em"
        lineHeight="1.2em"
      >
        {title}
      </RecativeBlock>
    </RecativeBlock>
  );
};

const buttonStyles = {
  width: '0',
  flex: '1 1 0',
};

export const SelectSyncModeModal: React.FC = () => {
  const [css] = useStyletron();
  const [selected, setSelected] = React.useState<number>(-1);

  const [isOpen, , , onClose] = useSelectSyncModeModal();

  const handleSubmit = useEvent(() => {});

  const handleModeChange = useEvent((_, index: number) => {
    setSelected(index);
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
      <ModalHeader>Select Synchronization Mode</ModalHeader>
      <ModalBody>
        <RecativeBlock maxWidth="400px">
          Please choose a synchronization mode for the task. It is important to
          note that once the task is initiated, it cannot be interrupted until
          all work has been completed.
          <RecativeBlock marginTop="32px">
            <ButtonGroup
              mode={BUTTON_GROUP_MODE.radio}
              selected={selected}
              onClick={handleModeChange}
            >
              <Button className={css(buttonStyles)}>
                <ReplaceIconContent
                  Icon={MergeModeUseNewIconOutline}
                  title="Use New Records"
                />
              </Button>
              <Button className={css(buttonStyles)}>
                <ReplaceIconContent
                  Icon={MergeModeUseOldIconOutline}
                  title="Use Old Records"
                />
              </Button>
              <Button className={css(buttonStyles)}>
                <ReplaceIconContent
                  Icon={MergeModeReplaceIconOutline}
                  title="Replace Old Database"
                />
              </Button>
            </ButtonGroup>
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
