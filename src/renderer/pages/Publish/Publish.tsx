import * as React from 'react';

import { useStyletron } from 'baseui';

import { HeadingXXLarge } from 'baseui/typography';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Button } from 'baseui/button';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { useTerminalModal } from 'components/Terminal/TerminalModal';

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
  const [, , openTerminal] = useTerminalModal();

  const handlePublishBundle = React.useCallback(
    async (tasks: IPublishTasks) => {
      if (selectedBundle === null) return;

      openTerminal('uploadBundle');
      await server.uploadBundle(selectedBundle, tasks);
    },
    [openTerminal, selectedBundle]
  );

  return {
    handlePublishBundle,
  } as const;
};

const useFastPublish = () => {
  const [, , openTerminal] = useTerminalModal();
  const [fastPublishFormModalOpen, setFastPublishFormModalOpen] =
    React.useState(false);

  const handleFastPublishButtonClick = React.useCallback(() => {
    openTerminal('fastPublish');
  }, [openTerminal]);

  const handleFastPublishModalClose = React.useCallback(() => {
    setFastPublishFormModalOpen(false);
  }, []);

  const handleFastPublishFormModalSubmit = React.useCallback(
    async (config: IPublishFormValue) => {
      setFastPublishFormModalOpen(false);
      openTerminal('fastPublish');
      await server.fastPublish(
        config.ifBuildDbRelease,
        config.ifCreateCodeBundle,
        config.notes
      );
    },
    [openTerminal]
  );

  return {
    fastPublishFormModalOpen,
    handleFastPublishButtonClick,
    handleFastPublishModalClose,
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
  const { handlePublishBundle } = usePublishStatus(selectedBundle);

  const {
    fastPublishFormModalOpen,
    handleFastPublishButtonClick,
    handleFastPublishModalClose,
    handleFastPublishFormModalSubmit,
  } = useFastPublish();

  React.useEffect(() => {
    fetchReleaseData();
  }, [fetchReleaseData]);

  const databaseLocked = useDatabaseLocked();

  return (
    <PivotLayout>
      <ContentContainer width={1000}>
        <RecativeBlock paddingLeft="20px" paddingRight="20px">
          <HeadingXXLarge>Publish</HeadingXXLarge>
          <RecativeBlock
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
          </RecativeBlock>
        </RecativeBlock>
      </ContentContainer>
      <ConfirmPublishModal
        isOpen={publishTypeModalOpen}
        onClose={handleClosePublishTypeModal}
        onSubmit={(...selection) => {
          handlePublishBundle(...selection);
          handleClosePublishTypeModal();
        }}
      />
      <FastPublishFormModal
        isOpen={fastPublishFormModalOpen}
        onClose={handleFastPublishModalClose}
        onSubmit={handleFastPublishFormModalSubmit}
      />
    </PivotLayout>
  );
};
