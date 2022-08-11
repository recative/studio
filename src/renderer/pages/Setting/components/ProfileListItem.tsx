import * as React from 'react';

import { Block } from 'baseui/block';
import { ListItem } from 'baseui/list';
import { LabelSmall } from 'baseui/typography';

import { SmallIconButton } from 'components/Button/SmallIconButton';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { useEditBundleProfileItemModal } from './EditBundleProfileItemModal';

export interface IProfileListItemProps {
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

export const ProfileListItem: React.FC<IProfileListItemProps> = ({ label }) => {
  const [, openEditBundleProfileItemModal] = useEditBundleProfileItemModal();

  const listItemEnhancer = React.useCallback(
    () => (
      <Block>
        <SmallIconButton title="Remove">
          <TrashIconOutline width={14} />
        </SmallIconButton>
        <SmallIconButton title="Edit">
          <EditIconOutline
            width={14}
            onClick={openEditBundleProfileItemModal}
          />
        </SmallIconButton>
      </Block>
    ),
    [openEditBundleProfileItemModal]
  );

  return (
    <ListItem endEnhancer={listItemEnhancer} overrides={listItemOverrides}>
      <LabelSmall>{label}</LabelSmall>
    </ListItem>
  );
};
