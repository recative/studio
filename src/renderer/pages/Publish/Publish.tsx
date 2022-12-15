import * as React from 'react';

import { HeadingXXLarge } from 'baseui/typography';
import { RecativeBlock } from 'components/Block/RecativeBlock';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { PublishIconOutline } from 'components/Icons/PublishIconOutline';

import { useEvent } from 'utils/hooks/useEvent';

import { ReleaseList } from 'pages/Bundle/components/ReleaseList';

import {
  useConfirmPublishModal,
  ConfirmPublishModal,
} from './components/ConfirmPublishModal';

interface IActionsProps {
  id: number;
}

const Actions: React.FC<IActionsProps> = ({ id }) => {
  const [, , open] = useConfirmPublishModal();

  const handleOpen = useEvent(() => {
    open(id);
  });

  return (
    <RecativeBlock>
      <SmallIconButton title="Create Bundle">
        <PublishIconOutline width={16} onClick={handleOpen} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

export const Publish: React.FC = () => {
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
          <HeadingXXLarge>Publish</HeadingXXLarge>
          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <ReleaseList Actions={Actions} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <ConfirmPublishModal />
    </PivotLayout>
  );
};
