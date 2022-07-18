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
import { Input } from 'baseui/input';
import { Block } from 'baseui/block';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { FormControl } from 'baseui/form-control';

import { I18Input } from 'components/Input/I18Input';
import { I18Selector } from 'components/Input/I18Selector';
import { I18FormControl, isFinished } from 'components/Input/I18FormControl';
import { AssetSelect, AssetSelectType } from 'components/Input/AssetSelect';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';
import { IEpisode } from '@recative/definitions';

export interface IEditEpisodeModalProps {
  episode: IEpisode | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (result: IEpisode) => void;
}

const modalBodyStyles: StyleObject = {
  boxSizing: 'border-box',
};

export const EditEpisodeModal: React.FC<IEditEpisodeModalProps> = ({
  episode,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [css] = useStyletron();

  const [clonedEpisode, valueChangeCallbacks, , setClonedValue] =
    useFormChangeCallbacks(episode);
  const databaseLocked = useDatabaseLocked();

  React.useEffect(() => {
    setClonedValue(episode);
  }, [setClonedValue, episode]);

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
        <Block
          marginRight="-8px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Block>Episode Detail</Block>
          <Block>
            <I18Selector />
          </Block>
        </Block>
      </ModalHeader>
      <ModalBody className={css(modalBodyStyles)}>
        <I18FormControl
          label="Title"
          caption="Title will be displayed on the header of the website."
          finished={isFinished(clonedEpisode?.label)}
        >
          <I18Input
            disabled={databaseLocked}
            value={clonedEpisode?.label}
            onChange={(event) => valueChangeCallbacks.label?.(event)}
          />
        </I18FormControl>
        <FormControl
          label="Order"
          caption="The order affects the URL of this episode."
        >
          <Input
            disabled={databaseLocked}
            type="number"
            value={clonedEpisode?.order}
            onChange={(event) =>
              valueChangeCallbacks.order?.(
                Math.round(Number.parseFloat(event.currentTarget.value))
              )
            }
          />
        </FormControl>
        <FormControl
          label="Loading Cover"
          caption="The order affects the URL of this episode."
        >
          <AssetSelect
            disabled={databaseLocked}
            type={AssetSelectType.Texture}
            size={SELECT_SIZE.default}
            value={
              clonedEpisode?.largeCoverResourceId
                ? [clonedEpisode.largeCoverResourceId]
                : []
            }
            onChange={(items) => {
              if (items[0]) {
                valueChangeCallbacks.largeCoverResourceId?.(items[0].id || '');
              }
            }}
          />
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          disabled={databaseLocked}
          onClick={() => clonedEpisode && onSubmit(clonedEpisode)}
        >
          Confirm
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
