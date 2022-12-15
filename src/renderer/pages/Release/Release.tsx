import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { HeadingXXLarge } from 'baseui/typography';
import { StatefulTooltip } from 'baseui/tooltip';
import { ButtonGroup, MODE } from 'baseui/button-group';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useTerminalModal } from 'components/Terminal/TerminalModal';
import {
  ReleaseWizardModal,
  useReleaseWizardModal,
} from './components/ReleaseWizardModal';
import { ReleaseWizardOutline } from 'components/Icons/ReleaseWizardOutline';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { server } from 'utils/rpc';

import { useEvent } from 'utils/hooks/useEvent';
import { ReleaseList } from 'pages/Bundle/components/ReleaseList';
import { MediaIconOutline } from 'components/Icons/MediaIconOutline';
import { CodeIconOutline } from 'components/Icons/CodeIconOutline';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';

export const useReleaseData = () => {
  const [{ result: releaseData }, { execute: fetchReleaseData }] = useAsync(
    server.listBundles
  );

  return { releaseData, fetchReleaseData };
};

const RELEASE_TYPE = ['media', 'code', 'bundle'] as const;

export const Release: React.FC = () => {
  const [releaseIndex, setReleaseIndex] = React.useState(2);
  const [, , openReleaseWizardModal] = useReleaseWizardModal();

  const handleOpenReleaseWizardModal = useEvent(() => {
    openReleaseWizardModal();
  });

  const handleButtonIconClick = useEvent((_event: unknown, index: number) => {
    setReleaseIndex(index);
  });

  const databaseLocked = useDatabaseLocked();

  const [isTerminalOpen] = useTerminalModal();

  React.useEffect(() => {}, [isTerminalOpen]);

  return (
    <PivotLayout
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<ReleaseWizardOutline width={20} />}
            onClick={handleOpenReleaseWizardModal}
            disabled={databaseLocked}
          >
            Release Wizard
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
            <HeadingXXLarge>Release</HeadingXXLarge>
            <ButtonGroup
              mode={MODE.radio}
              size={BUTTON_SIZE.mini}
              selected={releaseIndex}
              onClick={handleButtonIconClick}
            >
              <Button title="Media Releases">
                <MediaIconOutline width={12} />
              </Button>
              <Button title="Code Releases">
                <CodeIconOutline width={12} />
              </Button>
              <Button title="Bundle Releases">
                <BundleIconOutline width={12} />
              </Button>
            </ButtonGroup>
          </RecativeBlock>

          <RecativeBlock
            gridArea="content"
            height="-webkit-fill-available"
            position="relative"
          >
            <RecativeBlock width="100%" height="100%" position="absolute">
              <ReleaseList type={RELEASE_TYPE[releaseIndex] ?? 'bundle'} />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <ReleaseWizardModal />
    </PivotLayout>
  );
};
