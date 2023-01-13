import * as React from 'react';

import { useNavigate } from 'react-router';

import { HeadingXXLarge } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { UploadBackupIconOutline } from 'components/Icons/UploadBackupIconOutline';
import { BackupRecoverIconOutline } from 'components/Icons/BackupRecoverIconOutline';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import { IStorageListActionProps, StorageList } from './components/StorageList';
import {
  ConfirmCreateBackupModal,
  useConfirmCreateBackupModal,
} from './components/ConfirmCreateBackupModal';

const Actions: React.FC<IStorageListActionProps> = ({ id }) => {
  const navigate = useNavigate();

  const handleRecoverBackupClick = useEvent(() => {
    server.recoverBackup(id);
    navigate('/downloading-backup');
  });

  return (
    <RecativeBlock>
      {id.endsWith('/db') && (
        <SmallIconButton
          title="Recover Backup"
          onClick={handleRecoverBackupClick}
        >
          <BackupRecoverIconOutline width={16} />
        </SmallIconButton>
      )}
    </RecativeBlock>
  );
};

const InternalStorage: React.FC = () => {
  const databaseLocked = useDatabaseLocked();
  const [, , handleOpenConfirmCreateBackupModal] =
    useConfirmCreateBackupModal();

  return (
    <PivotLayout
      footer={
        <>
          <Button
            startEnhancer={<UploadBackupIconOutline width={20} />}
            kind={BUTTON_KIND.tertiary}
            disabled={databaseLocked}
            onClick={handleOpenConfirmCreateBackupModal}
          >
            Backup Database
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
          <HeadingXXLarge>Storage</HeadingXXLarge>

          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <StorageList Actions={Actions} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <ConfirmCreateBackupModal />
    </PivotLayout>
  );
};

export const Storage = React.memo(InternalStorage);
