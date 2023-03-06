import * as React from 'react';

import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { DeployIconOutline } from 'components/Icons/DeployIconOutline';

import { useEvent } from 'utils/hooks/useEvent';

import { ReleaseList } from 'pages/Bundle/components/ReleaseList';
import {
  DeployBundleModal,
  useDeployBundleModal,
} from './components/DeployBundleModal';

interface IActionsProps {
  id: number;
}

const Actions: React.FC<IActionsProps> = ({ id }) => {
  const [, , openDeployBundleModal] = useDeployBundleModal();

  const handleDeployIconClick = useEvent(() => {
    void openDeployBundleModal(id);
  });

  return (
    <RecativeBlock>
      <SmallIconButton title="Deploy Bundle" onClick={handleDeployIconClick}>
        <DeployIconOutline width={16} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

export const Deploy: React.FC = () => {
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
          <HeadingXXLarge>Deploy</HeadingXXLarge>
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
        <DeployBundleModal />
      </ContentContainer>
    </PivotLayout>
  );
};
