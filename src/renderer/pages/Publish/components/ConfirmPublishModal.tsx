import * as React from 'react';
import { useEvent } from 'utils/hooks/useEvent';

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
import { LabelMedium, LabelSmall, LabelXSmall } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import type { ModalOverrides } from 'baseui/modal';
import type { ButtonOverrides } from 'baseui/button';

import { useTerminalModal } from 'components/Terminal/TerminalModal';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';

import { server } from 'utils/rpc';
import { ModalManager } from 'utils/hooks/useModalManager';

import type { IPublishTasks } from 'utils/IPublishTask';
import { useAsync } from '@react-hookz/web';
import { ProfileTable } from 'components/ProfileTable/ProfileTable';
import { InfoIconOutline } from 'components/Icons/InfoIconOutline';
import { Hint, HintParagraph } from 'pages/Setting/components/Hint';

const PUBLISH_TYPE_LIST_STYLE = {
  gap: '6px',
  gridAutoRows: 'min-content',
  gridTemplateColumns: '1fr 1fr',
  '@media (max-width: 800px)': {
    gap: '2px',
    gridTemplateColumns: '1fr',
  },
};

enum PublishTargetType {
  Media = 'media',
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
      width: '640px',
      height: '620px',
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
        <LabelSmall>
          {PUBLISH_TARGET_TYPE_DESCRIPTION[publishTargetType].title}
        </LabelSmall>
        <LabelXSmall marginTop="4px" marginBottom="0">
          {PUBLISH_TARGET_TYPE_DESCRIPTION[publishTargetType].subtitle}
        </LabelXSmall>
      </RecativeBlock>
    </Button>
  );
};

const usePublishBundleCallback = (tasks: IPublishTasks) => {
  const [, , openTerminal] = useTerminalModal();

  const [, selectedBundle, , onClose] = useConfirmPublishModal();

  const handlePublishBundle = useEvent(async () => {
    if (selectedBundle === null) return;

    void openTerminal('uploadBundle');
    onClose();
    await server.uploadBundle(selectedBundle, tasks);
  });

  return handlePublishBundle;
};

export const ConfirmPublishModal: React.FC = () => {
  const [isOpen, , , onClose] = useConfirmPublishModal();

  const [css] = useStyletron();
  const [selectedMediaType, toggleMediaType] = useToggle(false);
  const [selectedDatabaseType, toggleDatabaseType] = useToggle(false);
  const [selectedPostProcessType] = useToggle(false);

  const [uploadProfiles, uploadProfilesActions] = useAsync(async () => {
    return (await server.listUploadProfile()).map(
      ({ id, label, uploaderExtensionId }) => ({
        id,
        label,
        extensionId: uploaderExtensionId,
      })
    );
  });

  React.useEffect(() => {
    void uploadProfilesActions.execute();
  }, [uploadProfilesActions]);

  const publishRequest = React.useMemo<IPublishTasks>(
    () => ({
      mediaBundle: selectedMediaType,
      databaseBundle: selectedDatabaseType,
      postProcessTest: selectedPostProcessType,
    }),
    [selectedDatabaseType, selectedMediaType, selectedPostProcessType]
  );

  const handleSubmit = usePublishBundleCallback(publishRequest);
  const [uploaderProfiles, setUploaderProfiles] = React.useState<string[]>([]);

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
        <Hint Artwork={InfoIconOutline}>
          <HintParagraph>
            We will publish your bundle to the cloud service providers, please
            do not close this window while the publish action is in progress.
          </HintParagraph>
        </Hint>
        <LabelMedium>Bundle Type</LabelMedium>
        <RecativeBlock
          className={css(PUBLISH_TYPE_LIST_STYLE)}
          display="grid"
          overflow="auto"
        >
          <PublishTarget
            publishTargetType={PublishTargetType.Media}
            selected={selectedMediaType}
            onClick={toggleMediaType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Database}
            selected={selectedDatabaseType}
            onClick={toggleDatabaseType}
          />
        </RecativeBlock>

        <LabelMedium paddingTop="12px" paddingBottom="8px">
          Upload Profiles
        </LabelMedium>
        <ProfileTable
          profiles={uploadProfiles.result}
          height="210px"
          value={uploaderProfiles}
          onChange={setUploaderProfiles}
        />
      </ModalBody>
      <ModalFooter>
        <ModalButton onClick={onClose} kind={BUTTON_KIND.tertiary}>
          Cancel
        </ModalButton>
        <ModalButton
          disabled={
            !(
              selectedMediaType ||
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
