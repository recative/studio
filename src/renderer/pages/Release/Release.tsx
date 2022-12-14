import * as React from 'react';
import { styled } from 'baseui';

import { useAtom } from 'jotai';
import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { Card } from 'baseui/card';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import { LabelLarge } from 'baseui/typography';

import type { StyleObject } from 'styletron-react';
import type { CardOverrides } from 'baseui/card';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useTerminalModal } from 'components/Terminal/TerminalModal';
import {
  ReleaseWizardModal,
  useReleaseWizardModal,
} from './components/ReleaseWizardModal';
import { ReleaseWizardOutline } from 'components/Icons/ReleaseWizardOutline';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { formatReleaseNumber } from 'utils/formatReleaseNumber';
import { server } from 'utils/rpc';

import { CommitForm } from './components/CommitForm';
import { ReleaseItem } from './components/ReleaseItem';
import {
  BundleReleaseSuccessModal,
  useBundleReleaseSuccessModal,
} from './components/BundleReleaseSuccessModal';

import type { ICommitFormInputs } from './components/CommitForm';
import { useEvent } from 'utils/hooks/useEvent';

const mainContainerStyles: StyleObject = {
  width: '100%',
  height: '100%',
  maxHeight: 'calc(100vh - 128px)',
  overflowY: 'clip',
  paddingLeft: '12px',
  paddingRight: '12px',
  display: 'grid',
  gridTemplate: `"media code bundle"
                  / 1fr 1fr 1fr`,
  gridGap: '12px',
  boxSizing: 'border-box',
};

const cardOverrides: CardOverrides = {
  Root: {
    style: { height: '100%', boxSizing: 'border-box' },
  },
  Contents: {
    style: { height: 'calc(100vh - 172px)' },
  },
  Body: {
    style: { height: '100%' },
  },
};

const cardContentContainerStyles: StyleObject = {
  display: 'grid',
  height: 'calc(100vh - 128px)',
  maxHeight: '-webkit-fill-available',
  gridTemplate: `"header" min-content
                  "body" auto
                  "footer" 48px`,
};

const cardHeaderStyles: StyleObject = {
  gridArea: 'header',
};

const cardBodyStyles: StyleObject = {
  gridArea: 'body',
  overflowY: 'auto',
};

const cardFooterStyles: StyleObject = {
  marginBottom: '-20px',
  marginRight: '-8px',
  gridArea: 'footer',
  display: 'flex',
  justifyContent: 'flex-end',
};

const ReleaseList = styled('ul', {
  listStyle: 'none',
  paddingLeft: 0,
});

export const useReleaseData = () => {
  const [{ result: releaseData }, { execute: fetchReleaseData }] = useAsync(
    server.listBundles
  );

  return { releaseData, fetchReleaseData };
};

const useBuildCodeProps = () => {
  const [, , openTerminal] = useTerminalModal();

  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleBuildCode = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (!workspaceConfiguration) return;

      openTerminal('createCodeRelease');
      server.createCodeRelease(inputs.message);
    },
    []
  );

  return {
    handleBuildCode,
  };
};

const useBundleMediaProps = () => {
  const [, , openTerminal] = useTerminalModal();
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleBuildMedia = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (!workspaceConfiguration) return;

      openTerminal('createMediaRelease');
      server.createMediaRelease(inputs.message);
    },
    []
  );

  return {
    handleBuildMedia,
  };
};

const useCreateBundleReleaseProps = () => {
  const [, , openReleaseSuccessModal] = useBundleReleaseSuccessModal();

  const handleCreateBundleRelease = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (inputs.codeBuildId === undefined) return;
      if (inputs.mediaBuildId === undefined) return;

      await server.createBundleRelease(
        inputs.mediaBuildId,
        inputs.codeBuildId,
        inputs.message
      );

      openReleaseSuccessModal(true);
    },
    []
  );

  return {
    handleCreateBundleRelease,
  };
};

export const Release: React.FC = () => {
  const [css] = useStyletron();
  const { releaseData, fetchReleaseData } = useReleaseData();
  const { handleBuildCode } = useBuildCodeProps();
  const { handleBuildMedia } = useBundleMediaProps();
  const { handleCreateBundleRelease } = useCreateBundleReleaseProps();
  const [, , openReleaseWizardModal] = useReleaseWizardModal();

  const handleOpenReleaseWizardModal = useEvent(() => {
    openReleaseWizardModal();
  });

  const databaseLocked = useDatabaseLocked();

  const [isTerminalOpen] = useTerminalModal();

  React.useEffect(() => {
    fetchReleaseData();
  }, [isTerminalOpen]);

  return (
    <PivotLayout
      footer={
        <>
          <Button
            kind={BUTTON_KIND.tertiary}
            startEnhancer={<ReleaseWizardOutline width={20} />}
            onClick={handleOpenReleaseWizardModal}
          >
            Release Wizard
          </Button>
        </>
      }
    >
      <ContentContainer className={css(mainContainerStyles)} width={1400}>
        <RecativeBlock gridArea="media">
          <Card overrides={cardOverrides}>
            <RecativeBlock className={css(cardContentContainerStyles)}>
              <RecativeBlock className={css(cardHeaderStyles)}>
                <LabelLarge>Media</LabelLarge>
              </RecativeBlock>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.media.map((item) => (
                  <ReleaseItem key={item.id} {...item} />
                ))}
              </ReleaseList>
              <RecativeBlock className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  label="New Media Release"
                  onSubmit={handleBuildMedia}
                />
              </RecativeBlock>
            </RecativeBlock>
          </Card>
        </RecativeBlock>
        <RecativeBlock gridArea="code">
          <Card overrides={cardOverrides}>
            <RecativeBlock className={css(cardContentContainerStyles)}>
              <RecativeBlock className={css(cardHeaderStyles)}>
                <LabelLarge>Code</LabelLarge>
              </RecativeBlock>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.code?.map((item) => (
                  <ReleaseItem key={item.id} {...item} />
                ))}
              </ReleaseList>
              <RecativeBlock className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  label="New Code Release"
                  onSubmit={handleBuildCode}
                />
              </RecativeBlock>
            </RecativeBlock>
          </Card>
        </RecativeBlock>
        <RecativeBlock gridArea="bundle">
          <Card overrides={cardOverrides}>
            <RecativeBlock className={css(cardContentContainerStyles)}>
              <RecativeBlock className={css(cardHeaderStyles)}>
                <LabelLarge>Bundle</LabelLarge>
              </RecativeBlock>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.bundle.filter(Boolean).map((item) => (
                  <ReleaseItem
                    key={item.id}
                    {...item}
                    id={formatReleaseNumber(item)}
                  />
                ))}
              </ReleaseList>
              <RecativeBlock className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  selectBundles
                  label="New Bundle Release"
                  onSubmit={handleCreateBundleRelease}
                />
              </RecativeBlock>
            </RecativeBlock>
          </Card>
        </RecativeBlock>
      </ContentContainer>
      <BundleReleaseSuccessModal onCancel={null} onSubmit={fetchReleaseData} />
      <ReleaseWizardModal />
    </PivotLayout>
  );
};
