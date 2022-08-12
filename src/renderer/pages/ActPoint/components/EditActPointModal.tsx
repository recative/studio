import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { RadioGroup, Radio } from 'baseui/radio';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import { FormControl } from 'baseui/form-control';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';
import { ResolutionMode } from '@recative/definitions';
import type { IActPoint } from '@recative/definitions';

const TIMES_MARK_STYLES = {
  marginLeft: '12px',
  marginRight: '12px',
  fontSize: '1.8em',
  lineHeight: '0',
};

export interface IEditActPointModalProps {
  actPoint: IActPoint | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (x: IActPoint) => void;
}

const modalBodyStyles: StyleObject = {
  boxSizing: 'border-box',
};

const InternalEditActPointModal: React.FC<IEditActPointModalProps> = ({
  actPoint,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [css] = useStyletron();

  const [clonedActPoint, valueChangeCallbacks] =
    useFormChangeCallbacks(actPoint);
  const databaseLocked = useDatabaseLocked();

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      role={ROLE.dialog}
      size={SIZE.default}
    >
      <ModalHeader>
        <RecativeBlock>
          <RecativeBlock>Act Point Detail</RecativeBlock>
        </RecativeBlock>
      </ModalHeader>
      <ModalBody className={css(modalBodyStyles)}>
        <FormControl label="Resolution Mode">
          <RadioGroup
            value={clonedActPoint?.resolutionMode}
            onChange={(e) =>
              valueChangeCallbacks?.resolutionMode?.(e.currentTarget.value)
            }
            name="resolutionMode"
          >
            <Radio value={ResolutionMode.FollowPlayerSetting}>
              Follow Player Setting
            </Radio>
            <Radio value={ResolutionMode.FollowWindowSize}>
              Follow Window Size
            </Radio>
            <Radio value={ResolutionMode.FixedSize}>Fixed Size</Radio>
          </RadioGroup>
        </FormControl>
        <RecativeBlock
          display={
            clonedActPoint?.resolutionMode === ResolutionMode.FixedSize
              ? 'block'
              : 'none'
          }
        >
          <FormControl label="Resolution Dimensions">
            <RecativeBlock display="flex" alignItems="center" maxWidth="60%">
              <Input
                disabled={databaseLocked}
                type="number"
                value={clonedActPoint?.width}
                size={INPUT_SIZE.compact}
                onChange={(event) =>
                  valueChangeCallbacks.width?.(
                    Math.round(Number.parseFloat(event.currentTarget.value))
                  )
                }
              />
              <span className={css(TIMES_MARK_STYLES)}> × </span>
              <Input
                disabled={databaseLocked}
                type="number"
                value={clonedActPoint?.height}
                size={INPUT_SIZE.compact}
                onChange={(event) =>
                  valueChangeCallbacks.height?.(
                    Math.round(Number.parseFloat(event.currentTarget.value))
                  )
                }
              />
            </RecativeBlock>
          </FormControl>
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          disabled={databaseLocked}
          onClick={() => clonedActPoint && onSubmit(clonedActPoint)}
        >
          Confirm
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};

export const EditActPointModal = React.memo(InternalEditActPointModal);
