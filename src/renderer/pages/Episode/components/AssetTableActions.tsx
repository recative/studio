import * as React from 'react';

import { IAsset } from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { TrashIconOutline } from 'components/Icons/TrashIconOutline';

import { useEvent } from 'utils/hooks/useEvent';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useEditAssetModal } from '../hooks/useEditAssetModal';

export interface IAssetTableActionsProps {
  asset: IAsset;
}

export const AssetTableActions: React.FC<IAssetTableActionsProps> = ({
  asset,
}) => {
  const databaseLocked = useDatabaseLocked();
  const [, , openEditAssetModal] = useEditAssetModal();

  const handleOpenEditEpisodeModal = useEvent(() => {
    return openEditAssetModal(asset);
  });

  return (
    <RecativeBlock width="100%" textAlign="right">
      <SmallIconButton title="Delete Asset" disabled={databaseLocked}>
        <TrashIconOutline width={16} onClick={handleOpenEditEpisodeModal} />
      </SmallIconButton>
      <SmallIconButton title="Edit Asset" disabled={databaseLocked}>
        <EditIconOutline width={16} onClick={handleOpenEditEpisodeModal} />
      </SmallIconButton>
    </RecativeBlock>
  );
};
