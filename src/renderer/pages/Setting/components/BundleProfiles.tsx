import * as React from 'react';
import { nanoid } from 'nanoid';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { ParagraphLarge } from 'baseui/typography';

import { EmptySpace } from 'components/EmptyState/EmptyState';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';

import { BundleProfileListItem } from './BundleProfileListItem';
import {
  EditBundleProfileItemModal,
  useEditBundleProfileItemModal,
} from './EditBundleProfileItemModal';
import {
  ConfirmRemoveBundleProfileModal,
  useConfirmRemoveBundleProfileModal,
} from './ConfirmRemoveBundleProfileModal';

const profileListStyles = {
  paddingLeft: 0,
} as const;

export const BundleProfiles = () => {
  const [css] = useStyletron();
  const [profiles, profilesActions] = useAsync(server.listBundleProfile);
  const [, , openEditBundleProfileItemModal] = useEditBundleProfileItemModal();

  React.useEffect(() => {
    void profilesActions.execute();
  }, [profilesActions, profilesActions.execute]);

  const handleAddProfile = useEvent(() => {
    void openEditBundleProfileItemModal(nanoid());
  });

  const handleRemoveProfile = useEvent(async (x: string | null) => {
    if (!x) return;
    await server.removeBundleProfile(x);
    await profilesActions.execute();
  });

  const [, , openConfirmRemoveBundleProfileItemModal] =
    useConfirmRemoveBundleProfileModal();

  const handleOpenEditBundleProfileItemModal = useEvent((id: string) => {
    return openEditBundleProfileItemModal(id);
  });

  const handleOpenConfirmRemoveBundleProfileItemModal = useEvent(
    (id: string) => {
      return openConfirmRemoveBundleProfileItemModal(id);
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
        <ParagraphLarge>Bundling Profiles</ParagraphLarge>
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
            content="Press the add button to create a new bundling profiles"
          />
        )}
      </ul>

      <EditBundleProfileItemModal onSubmit={profilesActions.execute} />
      <ConfirmRemoveBundleProfileModal
        onSubmit={handleRemoveProfile}
        onCancel={null}
      />
    </RecativeBlock>
  );
};
