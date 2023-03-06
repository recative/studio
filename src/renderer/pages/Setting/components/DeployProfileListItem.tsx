import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ListItem } from 'baseui/list';
import { LabelSmall } from 'baseui/typography';

import { SmallIconButton } from 'components/Button/SmallIconButton';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { useEditDeployProfileItemModal } from './EditDeployProfileItemModal';
import { useConfirmRemoveDeployProfileModal } from './ConfirmRemoveDeployProfileModal';

export interface IProfileListItemProps {
  id: string;
  label: string;
}

const listItemOverrides = {
  Content: {
    style: {
      marginLeft: '8px',
      paddingLeft: '4px',
      paddingRight: '4px',
      minHeight: '48px',
    },
  },
} as const;

export const DeployProfileListItem: React.FC<IProfileListItemProps> = ({
  id,
  label,
}) => {
  const [, , openEditDeployProfileItemModal] = useEditDeployProfileItemModal();
  const [, , openConfirmRemoveDeployProfileItemModal] =
    useConfirmRemoveDeployProfileModal();

  const handleOpenModal = React.useCallback(() => {
    return openEditDeployProfileItemModal(id);
  }, [id, openEditDeployProfileItemModal]);

  const handleRemove = React.useCallback(() => {
    return openConfirmRemoveDeployProfileItemModal(id);
  }, [id, openConfirmRemoveDeployProfileItemModal]);

  const listItemEnhancer = React.useCallback(
    () => (
      <RecativeBlock>
        <SmallIconButton title="Remove">
          <TrashIconOutline width={14} onClick={handleRemove} />
        </SmallIconButton>
        <SmallIconButton title="Edit">
          <EditIconOutline width={14} onClick={handleOpenModal} />
        </SmallIconButton>
      </RecativeBlock>
    ),
    [handleOpenModal, handleRemove]
  );

  return (
    <ListItem endEnhancer={listItemEnhancer} overrides={listItemOverrides}>
      <LabelSmall>{label}</LabelSmall>
    </ListItem>
  );
};
