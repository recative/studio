import * as React from 'react';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { HeadingXXLarge } from 'baseui/typography';
import { ButtonGroup, MODE } from 'baseui/button-group';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { StorageIconCodeOutline } from 'components/Icons/StorageIconCodeOutline';
import { UploadBackupIconOutline } from 'components/Icons/UploadBackupIconOutline';
import { BackupRecoverIconOutline } from 'components/Icons/BackupRecoverIconOutline';
import { StorageIconUnknownOutline } from 'components/Icons/StorageIconUnknownOutline';
import { StorageIconMetadataOutline } from 'components/Icons/StorageIconMetadataOutline';

import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import {
  SelectSyncModeModal,
  useSelectSyncModeModal,
} from './components/SelectSyncModeModal';
import { IStorageListActionProps, StorageList } from './components/StorageList';
import {
  ConfirmCreateBackupModal,
  useConfirmCreateBackupModal,
} from './components/ConfirmCreateBackupModal';

const Actions: React.FC<IStorageListActionProps> = ({ id }) => {
  const [, , openSelectSyncModeModal] = useSelectSyncModeModal();

  const handleRecoverBackupClick = useEvent(() => {
    openSelectSyncModeModal(id);
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
  const [storageIndex, setStorageIndex] = React.useState(0);

  const [, , handleOpenConfirmCreateBackupModal] =
    useConfirmCreateBackupModal();

  const handleButtonIconClick = useEvent((_event: unknown, index: number) => {
    setStorageIndex(index);
  });

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
          <RecativeBlock
            display="flex"
            justifyContent="space-between"
            alignItems="center"
          >
            <HeadingXXLarge>Storage</HeadingXXLarge>
            <ButtonGroup
              mode={MODE.radio}
              size={BUTTON_SIZE.mini}
              selected={storageIndex}
              onClick={handleButtonIconClick}
            >
              <Button title="Database Backup">
                <DatabaseIconOutline width={12} />
              </Button>
              <Button title="Code">
                <StorageIconCodeOutline width={12} />
              </Button>
              <Button title="Metadata">
                <StorageIconMetadataOutline width={12} />
              </Button>
              <Button title="Unknown">
                <StorageIconUnknownOutline width={12} />
              </Button>
            </ButtonGroup>
          </RecativeBlock>

          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <StorageList groupIndex={storageIndex} Actions={Actions} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <SelectSyncModeModal />
      <ConfirmCreateBackupModal />
    </PivotLayout>
  );
};

export const Storage = React.memo(InternalStorage);
