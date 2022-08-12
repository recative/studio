import * as React from 'react';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { HeadingXXLarge } from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';

import { useTerminalModal } from 'components/Terminal/TerminalModal';

import { server } from 'utils/rpc';

import { ReleaseList } from './components/ReleaseList';
import {
  CreateBundleModal,
  useCreateBundleModal,
} from './components/CreateBundleModal';

interface IActionsProps {
  id: number;
}

const Actions: React.FC<IActionsProps> = ({ id }) => {
  const [, , open] = useCreateBundleModal();

  const handleOpen = React.useCallback(() => {
    open(id);
  }, [id, open]);

  return (
    <RecativeBlock>
      <SmallIconButton title="Create Bundle">
        <BundleIconOutline width={16} onClick={handleOpen} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const InternalBundle: React.FC = () => {
  const [, , openTerminal] = useTerminalModal();

  const handleSubmit = React.useCallback(
    (profileIds: string[], bundleReleaseId: number) => {
      server.createBundles(profileIds, bundleReleaseId);
      openTerminal('createBundles');
    },
    [openTerminal]
  );

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
          // @ts-ignore: This is a possible, and a pull request is on the way.
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
      <CreateBundleModal onSubmit={handleSubmit} />
    </PivotLayout>
  );
};

export const Bundle = React.memo(InternalBundle);
