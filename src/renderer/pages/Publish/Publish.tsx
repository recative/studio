import * as React from 'react';

import { useStyletron } from 'baseui';

import { HeadingXXLarge } from 'baseui/typography';
import { Block } from 'baseui/block';
import { Button } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { TerminalModal } from 'components/Terminal/TerminalModal';

import { useReleaseData } from 'pages/Release/Release';

import type { IBundleRelease } from '@recative/definitions';

import { server } from 'utils/rpc';
import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';

import type { IPublishTasks } from 'utils/IPublishTask';

import { ConfirmPublishModal } from './components/ConfirmPublishModal';
import { FastPublishFormModal } from './components/FastPublishFormModal';
import {
  ReleaseBundleButton,
  buttonOverrides,
} from './components/ReleaseBundleButton';

import type { IPublishFormValue } from './components/FastPublishFormModal';

const usePublishModalCallback = () => {
  const [selectedBundle, setSelectedBundle] = React.useState<number | null>(
    null
  );
  const [publishModalOpen, setPublishModalOpen] = React.useState(false);

  const handleOpenPublishModal = React.useCallback(() => {
    setPublishModalOpen(true);
  }, []);

  const handleClosePublishModal = React.useCallback(() => {
    setPublishModalOpen(false);
  }, []);

  const handleSelectedBundle = React.useCallback((item: IBundleRelease) => {
    setSelectedBundle(item.id);
  }, []);

  return {
    selectedBundle,
    publishModalOpen,
    handleSelectedBundle,
    handleOpenPublishModal,
    handleClosePublishModal,
  };
};

const usePublishStatus = (selectedBundle: number | null) => {
  const [publishProgressModalOpen, setPublishProgressModalOpen] =
    React.useState<boolean>();

  const handlePublishBundle = React.useCallback(
    async (tasks: IPublishTasks) => {
      if (selectedBundle === null) return;

      setPublishProgressModalOpen(true);
      await server.uploadBundle(selectedBundle, tasks);
    },
    [selectedBundle]
  );

  const handlePublishProgressModalClose = React.useCallback(() => {
    setPublishProgressModalOpen(false);
  }, []);

  return {
    publishProgressModalOpen,
    handlePublishBundle,
    handlePublishProgressModalClose,
  } as const;
};

const useFastPublish = () => {
  const [fastPublishFormModalOpen, setFastPublishFormModalOpen] =
    React.useState(false);
  const [fastPublishStatusModalOpen, setFastPublishStatusModalOpen] =
    React.useState(false);

  const handleFastPublishButtonClick = React.useCallback(() => {
    setFastPublishFormModalOpen(true);
  }, []);

  const handleFastPublishModalClose = React.useCallback(() => {
    setFastPublishFormModalOpen(false);
  }, []);

  const handleFastPublishFormModalSubmit = React.useCallback(
    async (config: IPublishFormValue) => {
      setFastPublishFormModalOpen(false);
      setFastPublishStatusModalOpen(true);
      await server.fastPublish(
        config.ifBuildDbRelease,
        config.ifCreateCodeBundle,
        config.notes
      );
    },
    []
  );

  const handleFastPublishFormModalClose = React.useCallback(() => {
    setFastPublishStatusModalOpen(false);
    server.destroyTerminalSession('fastPublish');
  }, []);

  return {
    fastPublishFormModalOpen,
    fastPublishStatusModalOpen,
    handleFastPublishButtonClick,
    handleFastPublishModalClose,
    handleFastPublishFormModalClose,
    handleFastPublishFormModalSubmit,
  };
};

export const Publish: React.FC = () => {
  const [css] = useStyletron();
  const { releaseData, fetchReleaseData } = useReleaseData();
  const {
    selectedBundle,
    publishModalOpen: publishTypeModalOpen,
    handleSelectedBundle,
    handleOpenPublishModal,
    handleClosePublishModal: handleClosePublishTypeModal,
  } = usePublishModalCallback();
  const {
    publishProgressModalOpen,
    handlePublishBundle,
    handlePublishProgressModalClose,
  } = usePublishStatus(selectedBundle);

  const {
    fastPublishFormModalOpen,
    fastPublishStatusModalOpen,
    handleFastPublishButtonClick,
    handleFastPublishModalClose,
    handleFastPublishFormModalClose,
    handleFastPublishFormModalSubmit,
  } = useFastPublish();

  React.useEffect(() => {
    fetchReleaseData();
  }, [fetchReleaseData]);

  const databaseLocked = useDatabaseLocked();

  return (
    <PivotLayout>
      <ContentContainer width={1000}>
        <Block paddingLeft="20px" paddingRight="20px">
          <HeadingXXLarge>Publish</HeadingXXLarge>
          <Block
            className={css({
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gridGap: '16px',
              justifyItems: 'stretch',
            })}
          >
            <Button
              overrides={buttonOverrides}
              onClick={handleFastPublishButtonClick}
              disabled={databaseLocked}
            >
              Fast Publish
            </Button>
            {releaseData?.bundle.map((item) => (
              <ReleaseBundleButton
                key={item.id}
                {...item}
                onClick={() => {
                  handleOpenPublishModal();
                  handleSelectedBundle(item);
                }}
              />
            ))}
          </Block>
        </Block>
      </ContentContainer>
      <ConfirmPublishModal
        isOpen={publishTypeModalOpen}
        onClose={handleClosePublishTypeModal}
        onSubmit={(...selection) => {
          handlePublishBundle(...selection);
          handleClosePublishTypeModal();
        }}
      />
      <TerminalModal
        id="uploadBundle"
        isOpen={!!publishProgressModalOpen}
        onClose={handlePublishProgressModalClose}
      />
      <FastPublishFormModal
        isOpen={fastPublishFormModalOpen}
        onClose={handleFastPublishModalClose}
        onSubmit={handleFastPublishFormModalSubmit}
      />
      <TerminalModal
        id="fastPublish"
        isOpen={!!fastPublishStatusModalOpen}
        onClose={handleFastPublishFormModalClose}
      />
    </PivotLayout>
  );
};
