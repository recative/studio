import * as React from 'react';

import { HeadingXXLarge } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { EpisodeIconOutline } from 'components/Icons/EpisodeIconOutline';
import { ReleaseDeprecateOutline } from 'components/Icons/ReleaseDeprecateOutline';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import {
  ConfirmSyncPermissionModal,
  useConfirmSyncPermissionModal,
} from './components/ConfirmSyncPermissionModal';

import {
  PermissionList,
  IPermissionListActionsProps,
} from './components/PermissionList';
import {
  AddPermissionModal,
  useAddPermissionModal,
} from './components/AddPermissionModal';

const Actions: React.FC<IPermissionListActionsProps> = ({ id }) => {
  return (
    <RecativeBlock>
      <SmallIconButton title="Deprecate Release">
        <ReleaseDeprecateOutline width={16} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const InternalPermission: React.FC = () => {
  const [, , openConfirmSyncModal] = useConfirmSyncPermissionModal();
  const [permissionKey, setPermissionKey] = React.useState(0);
  const databaseLocked = useDatabaseLocked();
  const [, , openAddPermissionModal] = useAddPermissionModal();

  const handleSyncConfirm = useEvent(async () => {
    await server.syncPermissions();
    setPermissionKey(Math.random());
  });

  return (
    <PivotLayout
      footer={
        <>
          <Button
            startEnhancer={<AddIconOutline width={20} />}
            kind={BUTTON_KIND.tertiary}
            disabled={databaseLocked}
            onClick={openAddPermissionModal}
          >
            Add Manually
          </Button>
          <Button
            startEnhancer={<EpisodeIconOutline width={20} />}
            kind={BUTTON_KIND.tertiary}
            disabled={databaseLocked}
            onClick={openConfirmSyncModal}
          >
            Sync Episodes
          </Button>
        </>
      }
    >
      <ContentContainer width={1000} limitedHeight>
        <RecativeBlock
          paddingLeft="20px"
          paddingRight="20px"
          display="grid"
          gridTemplate={`
            "title" min-content
            "content" auto
          `}
          maxHeight="calc(100% - 24px)"
          height="-webkit-fill-available"
          paddingBottom="24px"
          overflow="clip"
        >
          <HeadingXXLarge>Permission</HeadingXXLarge>

          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <PermissionList key={permissionKey} Actions={Actions} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <AddPermissionModal />
      <ConfirmSyncPermissionModal
        onCancel={null}
        onSubmit={handleSyncConfirm}
      />
    </PivotLayout>
  );
};

export const Permission = React.memo(InternalPermission);
