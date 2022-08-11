import * as React from 'react';

import { Block } from 'baseui/block';
import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';

import { server } from 'utils/rpc';

import { ReleaseList } from './components/ReleaseList';
import {
  CreateBundleModal,
  useCreateBundleModal,
} from './components/CreateBundleModal';

const Actions: React.FC = () => {
  const [, open] = useCreateBundleModal();

  return (
    <Block>
      <SmallIconButton title="Create Bundle">
        <BundleIconOutline width={16} onClick={open} />
      </SmallIconButton>
    </Block>
  );
};

const InternalBundle: React.FC = () => {
  return (
    <PivotLayout>
      <ContentContainer width={1000} limitedHeight>
        <Block
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
          // @ts-ignore: This is a possible, and a pull request is on the way.
          overflow="clip"
        >
          <HeadingXXLarge gridArea="title">Bundle</HeadingXXLarge>
          <Block
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <Block width="100%" height="100%" position="absolute">
              <ReleaseList Actions={Actions} />
            </Block>
          </Block>
        </Block>
      </ContentContainer>
      <CreateBundleModal onSubmit={() => {}} />
    </PivotLayout>
  );
};

export const Bundle = React.memo(InternalBundle);
