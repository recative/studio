import * as React from 'react';
import { nanoid } from 'nanoid';

import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { ParagraphLarge } from 'baseui/typography';

import { Block } from 'components/block/Block';
import { EmptySpace } from 'components/EmptyState/EmptyState';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';

import { server } from 'utils/rpc';

import { ProfileListItem } from './ProfileListItem';
import {
  EditBundleProfileItemModal,
  useEditBundleProfileItemModal,
} from './EditBundleProfileItemModal';
import { ConfirmRemoveBundleProfileModal } from './ConfirmRemoveBundleProfileModal';

const profileListStyles = {
  paddingLeft: 0,
} as const;

export const BundleProfiles = () => {
  const [css] = useStyletron();
  const [profiles, profilesActions] = useAsync(server.listBundleProfile);
  const [, , openEditBundleProfileItemModal] = useEditBundleProfileItemModal();

  React.useEffect(() => {
    profilesActions.execute();
  }, [profilesActions, profilesActions.execute]);

  const handleAddProfile = React.useCallback(() => {
    openEditBundleProfileItemModal(nanoid());
  }, [openEditBundleProfileItemModal]);

  const handleRemoveProfile = React.useCallback(
    async (x: string | null) => {
      if (!x) return;
      await server.removeBundleProfile(x);
      await profilesActions.execute();
    },
    [profilesActions]
  );

  if (profiles.status === 'not-executed') {
    return null;
  }

  return (
    <Block>
      <Block display="flex" justifyContent="space-between" alignItems="center">
        <ParagraphLarge>Bundling Profiles</ParagraphLarge>
        <Block>
          <SmallIconButton title="Add Profile" onClick={handleAddProfile}>
            <AddIconOutline width={16} />
          </SmallIconButton>
        </Block>
      </Block>
      <ul className={css(profileListStyles)}>
        {profiles.result?.length ? (
          profiles.result.map((profile) => (
            <ProfileListItem
              key={profile.id}
              id={profile.id}
              label={profile.label}
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
    </Block>
  );
};
