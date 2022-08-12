import * as React from 'react';

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
import { KIND as BUTTON_KIND, Button } from 'baseui/button';
import type { ButtonOverrides } from 'baseui/button';

import { TextureIconOutline } from 'components/Icons/TextureIconOutline';
import { AnimationIconOutline } from 'components/Icons/AnimationIconOutline';
import { GeneralResourceGroupIconOutline } from 'components/Icons/GeneralResourceGroupIconOutline';

import { GroupType } from '@recative/definitions';
import type { IGroupTypeResourceTag } from '@recative/definitions';

interface IGroupTypeDescription {
  icon: React.ReactChild;
  title: string;
  subtitle: string;
}

const iconStyle = { marginRight: '8px' };

const GROUP_TYPE_DESCRIPTION: Record<GroupType, IGroupTypeDescription> = {
  [GroupType.Video]: {
    icon: <TextureIconOutline width={40} style={iconStyle} />,
    title: 'Video Group',
    subtitle: 'Contains video, audio and subtitle.',
  },
  [GroupType.Texture]: {
    icon: <TextureIconOutline width={40} style={iconStyle} />,
    title: 'Smart Texture',
    subtitle:
      'Decide which picture from the group to display based on different conditions.',
  },
  [GroupType.FrameSequence]: {
    icon: <AnimationIconOutline width={40} style={iconStyle} />,
    title: 'Frame Sequence',
    subtitle:
      'A series of static images are played continuously to form a animated image.',
  },
  [GroupType.General]: {
    icon: <GeneralResourceGroupIconOutline width={40} style={iconStyle} />,
    title: 'General Group',
    subtitle: 'A general purpose group without any special features.',
  },
};

export interface IGroupTypeSelectionModal {
  isOpen: boolean;
  candidates: IGroupTypeResourceTag[];
  onClose: () => void;
  onSubmit: (x: IGroupTypeResourceTag) => void;
}

interface IGroupTypeSelectionItemProps {
  groupType: GroupType;
  selected: boolean;
  onClick: () => void;
}

const GroupTypeButtonOverrides: ButtonOverrides = {
  BaseButton: {
    style: () => ({
      width: '100%',
      textAlign: 'left',
      justifyContent: 'flex-start',
    }),
  },
};

export const GroupTypeSelectionItem: React.FC<IGroupTypeSelectionItemProps> = ({
  groupType,
  selected,
  onClick,
}) => {
  return (
    <Button
      startEnhancer={GROUP_TYPE_DESCRIPTION[groupType].icon}
      kind={selected ? BUTTON_KIND.secondary : BUTTON_KIND.tertiary}
      overrides={GroupTypeButtonOverrides}
      onClick={onClick}
    >
      <RecativeBlock>
        <LabelMedium>{GROUP_TYPE_DESCRIPTION[groupType].title}</LabelMedium>
        <ParagraphSmall marginTop="4px" marginBottom="0">
          {GROUP_TYPE_DESCRIPTION[groupType].subtitle}
        </ParagraphSmall>
      </RecativeBlock>
    </Button>
  );
};

export const GroupTypeSelectionModal: React.FC<IGroupTypeSelectionModal> = ({
  isOpen,
  candidates,
  onClose,
  onSubmit,
}) => {
  const [selectedGroupType, setSelectedGroupType] =
    React.useState<IGroupTypeResourceTag | null>();

  return (
    <Modal
      onClose={onClose}
      isOpen={isOpen}
      animate
      autoFocus
      closeable
      size={SIZE.default}
      role={ROLE.dialog}
    >
      <ModalHeader>Create Group</ModalHeader>
      <ModalBody>
        <RecativeBlock>Please select a type of resource group:</RecativeBlock>
        <RecativeBlock>
          {candidates?.map((candidate) => (
            <GroupTypeSelectionItem
              key={candidate.id}
              groupType={candidate.id}
              selected={candidate.id === selectedGroupType?.id}
              onClick={() => setSelectedGroupType(candidate)}
            />
          ))}
        </RecativeBlock>
      </ModalBody>
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          disabled={!selectedGroupType}
          onClick={() => selectedGroupType && onSubmit(selectedGroupType)}
        >
          Create Group
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
