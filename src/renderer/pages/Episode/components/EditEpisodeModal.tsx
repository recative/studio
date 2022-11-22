import * as React from 'react';

import { useStyletron } from 'styletron-react';
import type { StyleObject } from 'styletron-react';

import type { IEpisode } from '@recative/definitions';

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
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { FormControl } from 'baseui/form-control';

import { I18Input } from 'components/Input/I18Input';
import { I18Selector } from 'components/Input/I18Selector';
import { I18FormControl, isFinished } from 'components/Input/I18FormControl';
import { AssetSelect, AssetSelectType } from 'components/Input/AssetSelect';

import { server } from 'utils/rpc';
import { ModalManager } from 'utils/hooks/useModalManager';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';

export interface IEditEpisodeModalProps {
  onRefreshEpisodeListRequest: () => void;
}

const modalBodyStyles: StyleObject = {
  boxSizing: 'border-box',
};

export const useEditEpisodeModal = ModalManager<IEpisode, null>(null);

export const EditEpisodeModal: React.FC<IEditEpisodeModalProps> = ({
  onRefreshEpisodeListRequest,
}) => {
  const [isOpen, episode, , onClose] = useEditEpisodeModal();
  const [css] = useStyletron();

  const [clonedEpisode, valueChangeCallbacks, , setClonedValue] =
    useFormChangeCallbacks(episode);
  const databaseLocked = useDatabaseLocked();

  React.useEffect(() => {
    setClonedValue(episode);
  }, [setClonedValue, episode]);

  const handleSubmitEditEpisodeModal = React.useCallback(async () => {
    if (!clonedEpisode) return;
    await server.updateOrInsertEpisodes([clonedEpisode]);
    onRefreshEpisodeListRequest();
    onClose();
  }, [clonedEpisode, onClose, onRefreshEpisodeListRequest]);

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
        <RecativeBlock
          marginRight="-8px"
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <RecativeBlock>Episode Detail</RecativeBlock>
          <RecativeBlock>
            <I18Selector />
          </RecativeBlock>
        </RecativeBlock>
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
          onClick={handleSubmitEditEpisodeModal}
        >
          Confirm
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
