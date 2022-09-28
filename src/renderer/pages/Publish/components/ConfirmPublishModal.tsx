import * as React from 'react';

import { useToggle } from 'react-use';

import { useStyletron } from 'styletron-react';
import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import type { ModalOverrides } from 'baseui/modal';
import type { ButtonOverrides } from 'baseui/button';

import { useTerminalModal } from 'components/Terminal/TerminalModal';
import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';

import { server } from 'utils/rpc';
import { ModalManager } from 'utils/hooks/useModalManager';

import type { IPublishTasks } from 'utils/IPublishTask';

const PUBLISH_TYPE_LIST_STYLE = {
  gap: '6px',
  gridAutoRows: 'min-content',
  gridTemplateColumns: '1fr 1fr 1fr',
  '@media (max-width: 1200px)': {
    gridTemplateColumns: '1fr 1fr',
  },
  '@media (max-width: 800px)': {
    gap: '2px',
    gridTemplateColumns: '1fr',
  },
};

enum PublishTargetType {
  Media = 'media',
  Code = 'code',
  Database = 'database',
}

interface IPublishTargetProps {
  publishTargetType: PublishTargetType;
  selected: boolean;
  onClick: () => void;
}

interface IPublishTargetDescription {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}

const modalOverrides: ModalOverrides = {
  Dialog: {
    style: {
      width: '80vw',
      height: '80vh',
    },
  },
};

const GroupTypeButtonOverrides: ButtonOverrides = {
  BaseButton: {
    style: () => ({
      width: '100%',
      textAlign: 'left',
      justifyContent: 'flex-start',
    }),
  },
};

const iconStyle = { marginRight: '8px' };

const PUBLISH_TARGET_TYPE_DESCRIPTION: Record<
  PublishTargetType,
  IPublishTargetDescription
> = {
  [PublishTargetType.Media]: {
    icon: <ResourceManagerIconOutline width={40} style={iconStyle} />,
    title: 'Media Bundle',
    subtitle: 'All resource files available for this release.',
  },
  [PublishTargetType.Code]: {
    icon: <ActPointIconOutline width={40} style={iconStyle} />,
    title: 'Code Bundle',
    subtitle: 'All build artifacts of the act point program.',
  },
  [PublishTargetType.Database]: {
    icon: <DatabaseIconOutline width={40} style={iconStyle} />,
    title: 'Database Bundle',
    subtitle: 'Publish the metadata of this release to act server.',
  },
};

export const useConfirmPublishModal = ModalManager<number, null>(null);

export const PublishTarget: React.FC<IPublishTargetProps> = ({
  publishTargetType,
  selected,
  onClick,
}) => {
  return (
    <Button
      startEnhancer={PUBLISH_TARGET_TYPE_DESCRIPTION[publishTargetType].icon}
      kind={selected ? BUTTON_KIND.secondary : BUTTON_KIND.tertiary}
      overrides={GroupTypeButtonOverrides}
      onClick={onClick}
    >
      <RecativeBlock paddingTop="4px">
        <LabelMedium>
          {PUBLISH_TARGET_TYPE_DESCRIPTION[publishTargetType].title}
        </LabelMedium>
        <ParagraphSmall marginTop="4px" marginBottom="0">
          {PUBLISH_TARGET_TYPE_DESCRIPTION[publishTargetType].subtitle}
        </ParagraphSmall>
      </RecativeBlock>
    </Button>
  );
};

const usePublishBundleCallback = (tasks: IPublishTasks) => {
  const [, , openTerminal] = useTerminalModal();

  const [, selectedBundle, , onClose] = useConfirmPublishModal();

  const handlePublishBundle = React.useCallback(async () => {
    if (selectedBundle === null) return;

    openTerminal('uploadBundle');
    onClose();
    await server.uploadBundle(selectedBundle, tasks);
  }, [onClose, openTerminal, selectedBundle, tasks]);

  return handlePublishBundle;
};

export const ConfirmPublishModal: React.FC = () => {
  const [isOpen, , , onClose] = useConfirmPublishModal();

  const [css] = useStyletron();
  const [selectedMediaType, toggleMediaType] = useToggle(false);
  const [selectedCodeType, toggleCodeType] = useToggle(false);
  const [selectedDatabaseType, toggleDatabaseType] = useToggle(false);
  const [selectedPostProcessType, togglePostProcessType] = useToggle(false);

  const publishRequest = React.useMemo<IPublishTasks>(
    () => ({
      mediaBundle: selectedMediaType,
      codeBundle: selectedCodeType,
      databaseBundle: selectedDatabaseType,
      postProcessTest: selectedPostProcessType,
    }),
    [
      selectedCodeType,
      selectedDatabaseType,
      selectedMediaType,
      selectedPostProcessType,
    ]
  );

  const handleSubmit = usePublishBundleCallback(publishRequest);

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable={false}
      size={SIZE.default}
      role={ROLE.dialog}
      overrides={modalOverrides}
    >
      <ModalHeader>Publish Bundle</ModalHeader>
      <ModalBody>
        <RecativeBlock>
          <p>
            We will publish your bundle to the cloud service providers, please
            do not close this window while the publish action is in progress.
          </p>
          <p>Please select bundles you want to publish:</p>
        </RecativeBlock>
        <RecativeBlock
          className={css(PUBLISH_TYPE_LIST_STYLE)}
          height="calc(80vh - 268px)"
          display="grid"
          overflow="auto"
        >
          <PublishTarget
            publishTargetType={PublishTargetType.Media}
            selected={selectedMediaType}
            onClick={toggleMediaType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Code}
            selected={selectedCodeType}
            onClick={toggleCodeType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Database}
            selected={selectedDatabaseType}
            onClick={toggleDatabaseType}
          />
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton
          disabled={
            !(
              selectedMediaType ||
              selectedCodeType ||
              selectedDatabaseType ||
              selectedPostProcessType
            )
          }
          onClick={handleSubmit}
        >
          Publish
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
