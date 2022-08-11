import * as React from 'react';

import { useStyletron } from 'styletron-react';

import { Block } from 'baseui/block';
import { ParagraphLarge } from 'baseui/typography';

import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';

import { ProfileListItem } from './ProfileListItem';
import { useEditBundleProfileItemModal } from './EditBundleProfileItemModal';

const profileListStyles = {
  paddingLeft: 0,
} as const;

export const BundleProfiles = () => {
  const [css] = useStyletron();
  const [, openEditBundleProfileItemModal] = useEditBundleProfileItemModal();

  return (
    <Block>
      <Block display="flex" justifyContent="space-between" alignItems="center">
        <ParagraphLarge>Bundling Profiles</ParagraphLarge>
        <Block>
          <SmallIconButton
            title="Add Profile"
            onClick={openEditBundleProfileItemModal}
          >
            <AddIconOutline width={16} />
          </SmallIconButton>
        </Block>
      </Block>
      <ul className={css(profileListStyles)}>
        <ProfileListItem label="Web Profile" />
        <ProfileListItem label="iOS Profile" />
        <ProfileListItem label="Android Profile" />
        <ProfileListItem label="Windows Profile" />
        <ProfileListItem label="macOS Profile" />
      </ul>
    </Block>
  );
};
