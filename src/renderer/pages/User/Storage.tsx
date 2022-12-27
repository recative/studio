import * as React from 'react';

import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { BackupRecoverIconOutline } from 'components/Icons/BackupRecoverIconOutline';

import { IStorageListActionProps, StorageList } from './components/StorageList';

const Actions: React.FC<IStorageListActionProps> = ({ id }) => {
  return (
    <RecativeBlock>
      <SmallIconButton title="Recover Backup">
        <BackupRecoverIconOutline width={16} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const InternalStorage: React.FC = () => {
  return (
    <PivotLayout>
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
    </PivotLayout>
  );
};

export const Storage = React.memo(InternalStorage);
