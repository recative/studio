import * as React from 'react';
import { styled } from 'baseui';

import { useAtom } from 'jotai';
import { useAsync } from '@react-hookz/web';
import { useStyletron } from 'styletron-react';

import { Card } from 'baseui/card';
import { Block } from 'baseui/block';
import { LabelLarge } from 'baseui/typography';

import type { StyleObject } from 'styletron-react';
import type { CardOverrides } from 'baseui/card';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { TerminalModal } from 'components/Terminal/TerminalModal';
import { ContentContainer } from 'components/Layout/ContentContainer';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import { formatReleaseNumber } from 'utils/formatReleaseNumber';
import { server } from 'utils/rpc';

import { CommitForm } from './components/CommitForm';
import { ReleaseItem } from './components/ReleaseItem';
import { BundleReleaseSuccessModal } from './components/BundleReleaseSuccessModal';

import type { ICommitFormInputs } from './components/CommitForm';

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

const useBuildCodeProps = (fetchReleaseData: () => void) => {
  const [showBuildCodeModal, setShowBuildModal] = React.useState(false);

  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleBuildCode = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (!workspaceConfiguration) return;

      setShowBuildModal(true);
      server.createCodeRelease(inputs.message);
    },
    []
  );

  const handleModalClose = React.useCallback(() => {
    fetchReleaseData();
    setShowBuildModal(false);
  }, []);

  return {
    showBuildCodeModal,
    handleBuildCode,
    handleModalClose,
  };
};

const useBundleMediaProps = (fetchReleaseData: () => void) => {
  const [showBuildMediaModal, setShowBuildMediaModal] = React.useState(false);
  const [workspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleBuildMedia = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (!workspaceConfiguration) return;

      setShowBuildMediaModal(true);
      server.createMediaRelease(inputs.message);
    },
    []
  );

  const handleBuildMediaModalClose = React.useCallback(() => {
    fetchReleaseData();
    setShowBuildMediaModal(false);
  }, []);

  return {
    showBuildMediaModal,
    handleBuildMediaModalClose,
    handleBuildMedia,
  };
};

const useCreateBundleReleaseProps = (fetchReleaseData: () => void) => {
  const [showBundleReleaseSuccessModal, setShowBundleReleaseSuccessModal] =
    React.useState(false);

  const handleCreateBundleRelease = React.useCallback(
    async (inputs: ICommitFormInputs) => {
      if (inputs.codeBuildId === undefined) return;
      if (inputs.mediaBuildId === undefined) return;

      await server.createBundleRelease(
        inputs.mediaBuildId,
        inputs.codeBuildId,
        inputs.message
      );

      setShowBundleReleaseSuccessModal(true);
    },
    []
  );

  const handleModalClose = React.useCallback(() => {
    fetchReleaseData();
    setShowBundleReleaseSuccessModal(false);
  }, []);

  return {
    showBundleReleaseSuccessModal,
    handleCreateBundleRelease,
    handleModalClose,
  };
};

export const Release: React.FC = () => {
  const [css] = useStyletron();
  const { releaseData, fetchReleaseData } = useReleaseData();
  const {
    showBuildCodeModal,
    handleBuildCode,
    handleModalClose: handleBuildCodeModalClose,
  } = useBuildCodeProps(fetchReleaseData);
  const { showBuildMediaModal, handleBuildMediaModalClose, handleBuildMedia } =
    useBundleMediaProps(fetchReleaseData);
  const {
    showBundleReleaseSuccessModal,
    handleCreateBundleRelease,
    handleModalClose: handleBundleSuccessModalClose,
  } = useCreateBundleReleaseProps(fetchReleaseData);

  const databaseLocked = useDatabaseLocked();

  React.useEffect(() => {
    fetchReleaseData();
  }, []);

  return (
    <PivotLayout>
      <ContentContainer className={css(mainContainerStyles)} width={1400}>
        <Block gridArea="media">
          <Card overrides={cardOverrides}>
            <Block className={css(cardContentContainerStyles)}>
              <Block className={css(cardHeaderStyles)}>
                <LabelLarge>Media</LabelLarge>
              </Block>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.media.map((item) => (
                  <ReleaseItem key={item.id} {...item} />
                ))}
              </ReleaseList>
              <Block className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  label="New Media Release"
                  onSubmit={handleBuildMedia}
                />
              </Block>
            </Block>
          </Card>
        </Block>
        <Block gridArea="code">
          <Card overrides={cardOverrides}>
            <Block className={css(cardContentContainerStyles)}>
              <Block className={css(cardHeaderStyles)}>
                <LabelLarge>Code</LabelLarge>
              </Block>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.code?.map((item) => (
                  <ReleaseItem key={item.id} {...item} />
                ))}
              </ReleaseList>
              <Block className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  label="New Code Release"
                  onSubmit={handleBuildCode}
                />
              </Block>
            </Block>
          </Card>
        </Block>
        <Block gridArea="bundle">
          <Card overrides={cardOverrides}>
            <Block className={css(cardContentContainerStyles)}>
              <Block className={css(cardHeaderStyles)}>
                <LabelLarge>Bundle</LabelLarge>
              </Block>
              <ReleaseList className={css(cardBodyStyles)}>
                {releaseData?.bundle.map((item) => (
                  <ReleaseItem
                    key={item.id}
                    {...item}
                    id={formatReleaseNumber(item)}
                  />
                ))}
              </ReleaseList>
              <Block className={css(cardFooterStyles)}>
                <CommitForm
                  disabled={databaseLocked}
                  selectBundles
                  label="New Bundle Release"
                  onSubmit={handleCreateBundleRelease}
                />
              </Block>
            </Block>
          </Card>
        </Block>
      </ContentContainer>
      <TerminalModal
        id="createCodeRelease"
        isOpen={showBuildCodeModal}
        onClose={handleBuildCodeModalClose}
      />
      <TerminalModal
        id="createMediaRelease"
        isOpen={showBuildMediaModal}
        onClose={handleBuildMediaModalClose}
      />
      <BundleReleaseSuccessModal
        isOpen={showBundleReleaseSuccessModal}
        onClose={handleBundleSuccessModalClose}
      />
    </PivotLayout>
  );
};
