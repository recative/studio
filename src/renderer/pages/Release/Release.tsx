import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';
import { HeadingXXLarge } from 'baseui/typography';
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

import { CodeIconOutline } from 'components/Icons/CodeIconOutline';
import { SmallIconButton } from 'components/Button/SmallIconButton';
import { MediaIconOutline } from 'components/Icons/MediaIconOutline';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';
import { ReleaseDeprecateOutline } from 'components/Icons/ReleaseDeprecateOutline';

import { ReleaseList } from 'pages/Bundle/components/ReleaseList';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import {
  ConfirmDeprecateReleaseModal,
  useConfirmDeprecateReleaseModal,
} from './components/ConfirmDeprecateReleaseModal';
import { AddIconOutline } from 'components/Icons/AddIconOutline';
import {
  ManuallyReleaseModal,
  useManuallyReleaseModal,
} from './components/ManuallyReleaseModal';
import { BundleReleaseCreatedModal } from './components/BundleReleaseCreatedModal';

export const useReleaseData = () => {
  const [{ result: releaseData }, { execute: fetchReleaseData }] = useAsync(
    server.listBundles
  );

  return { releaseData, fetchReleaseData };
};

interface IActionsProps {
  id: number;
  type: 'media' | 'code' | 'bundle';
}

const Actions: React.FC<IActionsProps> = (detail) => {
  const [, , open] = useConfirmDeprecateReleaseModal();

  const handleOpen = useEvent(() => {
    open(detail);
  });

  return (
    <RecativeBlock>
      <SmallIconButton title="Deprecate Release">
        <ReleaseDeprecateOutline width={16} onClick={handleOpen} />
      </SmallIconButton>
    </RecativeBlock>
  );
};

const RELEASE_TYPE = ['media', 'code', 'bundle'] as const;

export const Release: React.FC = React.memo(() => {
  const [randomId, setRandomId] = React.useState(0);
  const [releaseIndex, setReleaseIndex] = React.useState(2);
  const [, , openReleaseWizardModal] = useReleaseWizardModal();
  const [, , openManuallyReleaseModal] = useManuallyReleaseModal();
  const [, selectedRelease] = useConfirmDeprecateReleaseModal();
  const [isTerminalOpen, , openTerminal] = useTerminalModal();
  const databaseLocked = useDatabaseLocked();

  const handleOpenReleaseWizardModal = useEvent(() => {
    openReleaseWizardModal();
  });

  const handleButtonIconClick = useEvent((_event: unknown, index: number) => {
    setReleaseIndex(index);
  });

  React.useLayoutEffect(() => {
    setRandomId(Math.random());
  }, [isTerminalOpen]);

  const handleRefreshData = useEvent(() => {
    setRandomId(Math.random());
  });

  const handleConfirmDeprecateRelease = useEvent(() => {
    if (!selectedRelease) return;

    openTerminal('deprecateRelease');
    server.deprecateRelease(selectedRelease.id, selectedRelease.type);
  });

  return (
    <PivotLayout
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<AddIconOutline width={20} />}
            onClick={openManuallyReleaseModal}
            disabled={databaseLocked}
          >
            Manually Release
          </Button>
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
              <ReleaseList
                key={randomId}
                type={RELEASE_TYPE[releaseIndex] ?? 'bundle'}
                Actions={Actions}
              />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <ReleaseWizardModal />
      <ConfirmDeprecateReleaseModal
        onCancel={null}
        onSubmit={handleConfirmDeprecateRelease}
      />
      <ManuallyReleaseModal onDataRefreshRequest={handleRefreshData} />
      <BundleReleaseCreatedModal onCancel={null} onSubmit={null} />
    </PivotLayout>
  );
});
