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
import { RecativeBlock } from 'components/Block/Block';
import { LabelMedium, ParagraphSmall } from 'baseui/typography';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';
import type { ModalOverrides } from 'baseui/modal';
import type { ButtonOverrides } from 'baseui/button';

import { AabIconOutline } from 'components/Icons/AabIconOutline';
import { IOSIconOutline } from 'components/Icons/IOSIconOutline';
import { RawBundleOutline } from 'components/Icons/RawBundleOutline';
import { MacOSIconOutline } from 'components/Icons/MacOsIconOutline';
import { PlayerIconOutline } from 'components/Icons/PlayerIconOutline';
import { WindowsIconOutline } from 'components/Icons/WindowsIconOutline';
import { AndroidIconOutline } from 'components/Icons/AndroidIconOutline';
import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';
import { DatabaseIconOutline } from 'components/Icons/DatabaseIconOutline';
import { PostProcessIconOutline } from 'components/Icons/PostProcessIconOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';

import { IPublishTasks } from 'utils/IPublishTask';

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
  Player = 'player',
  Android = 'android',
  RawBundle = 'raw-bundle',
  Aab = 'aab',
  IOS = 'ios',
  MacOS = 'mac',
  Windows = 'windows',
  PostProcess = 'post-process',
}

export interface IConfirmPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (tasks: IPublishTasks) => void;
}

interface IPublishTargetProps {
  publishTargetType: PublishTargetType;
  selected: boolean;
  onClick: () => void;
}

interface IPublishTargetDescription {
  icon: React.ReactChild;
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
  [PublishTargetType.Player]: {
    icon: <PlayerIconOutline width={40} style={iconStyle} />,
    title: 'Player Bundle',
    subtitle: 'Publish resource bundle for player shells.',
  },
  [PublishTargetType.Android]: {
    icon: <AndroidIconOutline width={40} style={iconStyle} />,
    title: 'Android APK Package',
    subtitle: 'Create and sign an Android APK installer.',
  },
  [PublishTargetType.Aab]: {
    icon: <AabIconOutline width={40} style={iconStyle} />,
    title: 'Android AAB Package',
    subtitle: 'Create and sign an Android App Bundle.',
  },
  [PublishTargetType.RawBundle]: {
    icon: <RawBundleOutline width={40} style={iconStyle} />,
    title: 'Raw Bundle Package',
    subtitle: 'Create an resource bundle for debug purpose.',
  },
  [PublishTargetType.IOS]: {
    icon: <IOSIconOutline width={40} style={iconStyle} />,
    title: 'iOS Package',
    subtitle: 'Create an unsigned iOS package.',
  },
  [PublishTargetType.MacOS]: {
    icon: <MacOSIconOutline width={40} style={iconStyle} />,
    title: 'macOS Package',
    subtitle: 'Create an unsigned macOS package.',
  },
  [PublishTargetType.Windows]: {
    icon: <WindowsIconOutline width={40} style={iconStyle} />,
    title: 'Windows Package',
    subtitle: "An Windows PROGRAM that don't need to be signed.",
  },
  [PublishTargetType.PostProcess]: {
    icon: <PostProcessIconOutline width={40} style={iconStyle} />,
    title: 'Post Process Test',
    subtitle: 'Run all post process plugins to test if it works.',
  },
};

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

export const ConfirmPublishModal: React.FC<IConfirmPublishModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [css] = useStyletron();
  const [selectedMediaType, toggleMediaType] = useToggle(false);
  const [selectedCodeType, toggleCodeType] = useToggle(false);
  const [selectedDatabaseType, toggleDatabaseType] = useToggle(false);
  const [selectedPlayerType, togglePlayerType] = useToggle(false);
  const [selectedRawBundleType, toggleRawBundleType] = useToggle(false);
  const [selectedAndroidType, toggleAndroidType] = useToggle(false);
  const [selectedAabType, toggleAabType] = useToggle(false);
  const [selectedIOSType, toggleIOSType] = useToggle(false);
  const [selectedMacOSType, toggleMacOSType] = useToggle(false);
  const [selectedWindowsType, toggleWindowsType] = useToggle(false);
  const [selectedPostProcessType, togglePostProcessType] = useToggle(false);

  const handleSubmit = React.useCallback(() => {
    onSubmit({
      mediaBundle: selectedMediaType,
      codeBundle: selectedCodeType,
      databaseBundle: selectedDatabaseType,
      playerBundle: selectedPlayerType,
      rawBundle: selectedRawBundleType,
      androidPackage: selectedAndroidType,
      aabPackage: selectedAabType,
      iOSPackage: selectedIOSType,
      postProcessTest: selectedPostProcessType,
    });
  }, [
    onSubmit,
    selectedMediaType,
    selectedCodeType,
    selectedDatabaseType,
    selectedPlayerType,
    selectedRawBundleType,
    selectedAndroidType,
    selectedAabType,
    selectedIOSType,
    selectedPostProcessType,
  ]);

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
          <PublishTarget
            publishTargetType={PublishTargetType.Player}
            selected={selectedPlayerType}
            onClick={togglePlayerType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.RawBundle}
            selected={selectedRawBundleType}
            onClick={toggleRawBundleType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Android}
            selected={selectedAndroidType}
            onClick={toggleAndroidType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Aab}
            selected={selectedAabType}
            onClick={toggleAabType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.IOS}
            selected={selectedIOSType}
            onClick={toggleIOSType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.MacOS}
            selected={selectedMacOSType}
            onClick={toggleMacOSType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.Windows}
            selected={selectedWindowsType}
            onClick={toggleWindowsType}
          />
          <PublishTarget
            publishTargetType={PublishTargetType.PostProcess}
            selected={selectedPostProcessType}
            onClick={togglePostProcessType}
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
              selectedPlayerType ||
              selectedIOSType ||
              selectedAndroidType ||
              selectedAabType ||
              selectedMacOSType ||
              selectedWindowsType ||
              selectedRawBundleType ||
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
