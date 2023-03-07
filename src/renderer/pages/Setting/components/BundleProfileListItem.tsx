import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ListItem } from 'baseui/list';
import { LabelSmall } from 'baseui/typography';

import { SmallIconButton } from 'components/Button/SmallIconButton';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { useEvent } from 'utils/hooks/useEvent';

export interface IProfileListItemProps {
  id: string;
  label: string;
  onRemoveButtonClick: (id: string) => void;
  onEditButtonClick: (id: string) => void;
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

export const BundleProfileListItem: React.FC<IProfileListItemProps> = ({
  id,
  label,
  onRemoveButtonClick,
  onEditButtonClick,
}) => {
  const handleRemoveButtonClick = useEvent(() => {
    onRemoveButtonClick(id);
  });

  const handleEditButtonClick = useEvent(() => {
    onEditButtonClick(id);
  });

  const listItemEnhancer = React.useCallback(
    () => (
      <RecativeBlock>
        <SmallIconButton title="Remove">
          <TrashIconOutline width={14} onClick={handleRemoveButtonClick} />
        </SmallIconButton>
        <SmallIconButton title="Edit">
          <EditIconOutline width={14} onClick={handleEditButtonClick} />
        </SmallIconButton>
      </RecativeBlock>
    ),
    [onEditButtonClick, onRemoveButtonClick]
  );

  return (
    <ListItem endEnhancer={listItemEnhancer} overrides={listItemOverrides}>
      <LabelSmall>{label}</LabelSmall>
    </ListItem>
  );
};
