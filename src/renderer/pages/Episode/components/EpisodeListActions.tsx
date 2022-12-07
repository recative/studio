import * as React from 'react';

import { IEpisode } from '@recative/definitions';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';

import { useEvent } from 'utils/hooks/useEvent';

import { server } from 'utils/rpc';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { useEditEpisodeModal } from './EditEpisodeModal';

export interface IEpisodeListActionsProps {
  episode: IEpisode;
  onRefreshEpisodeListRequest: () => void;
}

export const EpisodeListActions: React.FC<IEpisodeListActionsProps> = ({
  episode,
  onRefreshEpisodeListRequest,
}) => {
  const databaseLocked = useDatabaseLocked();

  const [, , openEditEpisodeModal] = useEditEpisodeModal();

  const handleAddAssetClick = useEvent(async () => {
    const asset = await server.addEmptyAsset(episode.id);
    onRefreshEpisodeListRequest();
    return asset;
  });

  const handleEditEpisodeClick = useEvent(() => {
    if (episode) openEditEpisodeModal(episode);
  });

  return (
    <RecativeBlock width="100%" textAlign="right">
      <SmallIconButton title="Edit Episode" disabled={databaseLocked}>
        <EditIconOutline width={16} onClick={handleEditEpisodeClick} />
      </SmallIconButton>
      <SmallIconButton title="Add Episode" disabled={databaseLocked}>
        <AddIconOutline width={16} onClick={handleAddAssetClick} />
      </SmallIconButton>
    </RecativeBlock>
  );
};
