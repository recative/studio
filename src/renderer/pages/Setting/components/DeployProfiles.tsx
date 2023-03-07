import * as React from 'react';
import { nanoid } from 'nanoid';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { ParagraphLarge } from 'baseui/typography';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { EmptySpace } from 'components/EmptyState/EmptyState';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { BundleProfileListItem } from './BundleProfileListItem';
import {
  EditDeployProfileItemModal,
  useEditDeployProfileItemModal,
} from './EditDeployProfileItemModal';
import {
  ConfirmRemoveDeployProfileModal,
  useConfirmRemoveDeployProfileModal,
} from './ConfirmRemoveDeployProfileModal';

const profileListStyles = {
  paddingLeft: 0,
} as const;

export const DeployProfiles = () => {
  const [css] = useStyletron();
  const [profiles, profilesActions] = useAsync(server.listDeployProfile);
  const [, , openEditDeployProfileItemModal] = useEditDeployProfileItemModal();

  React.useEffect(() => {
    void profilesActions.execute();
  }, [profilesActions, profilesActions.execute]);

  const handleAddProfile = useEvent(() => {
    void openEditDeployProfileItemModal(nanoid());
  });

  const handleRemoveProfile = useEvent(async (x: string | null) => {
    if (!x) return;
    await server.removeDeployProfile(x);
    await profilesActions.execute();
  });

  const [, , openConfirmDeployBundleProfileItemModal] =
    useConfirmRemoveDeployProfileModal();

  const handleOpenEditBundleProfileItemModal = useEvent((id: string) => {
    return openEditDeployProfileItemModal(id);
  });

  const handleOpenConfirmRemoveBundleProfileItemModal = useEvent(
    (id: string) => {
      return openConfirmDeployBundleProfileItemModal(id);
    }
  );

  if (profiles.status === 'not-executed') {
    return null;
  }

  return (
    <RecativeBlock>
      <RecativeBlock
        display="flex"
        justifyContent="space-between"
        alignItems="center"
      >
        <ParagraphLarge>Deploy Profiles</ParagraphLarge>
        <RecativeBlock>
          <SmallIconButton title="Add Profile" onClick={handleAddProfile}>
            <AddIconOutline width={16} />
          </SmallIconButton>
        </RecativeBlock>
      </RecativeBlock>
      <ul className={css(profileListStyles)}>
        {profiles.result?.length ? (
          profiles.result.map((profile) => (
            <BundleProfileListItem
              key={profile.id}
              id={profile.id}
              label={profile.label}
              onEditButtonClick={handleOpenEditBundleProfileItemModal}
              onRemoveButtonClick={
                handleOpenConfirmRemoveBundleProfileItemModal
              }
            />
          ))
        ) : (
          <EmptySpace
            title="Empty"
            content="Press the add button to create a new deployment profiles"
          />
        )}
      </ul>

      <EditDeployProfileItemModal onSubmit={profilesActions.execute} />
      <ConfirmRemoveDeployProfileModal
        onSubmit={handleRemoveProfile}
        onCancel={null}
      />
    </RecativeBlock>
  );
};
