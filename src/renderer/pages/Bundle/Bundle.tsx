import * as React from 'react';

import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';

import { useEvent } from 'utils/hooks/useEvent';
import { StatIconOutline } from 'components/Icons/StatIconOutline';
import { ReleaseList } from './components/ReleaseList';
import {
  CreateBundleModal,
  useCreateBundleModal,
} from './components/CreateBundleModal';
import { AnalysisModal, useAnalysisModal } from './components/AnalysisModal';

interface IActionsProps {
  id: number;
}

const Actions: React.FC<IActionsProps> = ({ id }) => {
  const [, , openCreateBundleModal] = useCreateBundleModal();
  const [, , openAnalysisModal] = useAnalysisModal();

  const handleOpenCreateBundleModal = useEvent(() => {
    return openCreateBundleModal(id);
  });

  const handleOpenAnalysisModal = useEvent(() => {
    return openAnalysisModal(id);
  });

  return (
    <RecativeBlock>
      <SmallIconButton title="Analysis Bundle">
        <StatIconOutline width={16} onClick={handleOpenAnalysisModal} />
      </SmallIconButton>
      <SmallIconButton title="Create Bundle">
        <BundleIconOutline width={16} onClick={handleOpenCreateBundleModal} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const InternalBundle: React.FC = () => {
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
          <HeadingXXLarge gridArea="title">Bundle</HeadingXXLarge>
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
      <CreateBundleModal />
      <AnalysisModal />
    </PivotLayout>
  );
};

export const Bundle = React.memo(InternalBundle);
