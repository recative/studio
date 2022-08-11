import * as React from 'react';
import { atom } from 'jotai';

import {
  Modal,
  ModalBody,
  ModalButton,
  ModalFooter,
  ModalHeader,
  ROLE,
  SIZE,
} from 'baseui/modal';
import { FormControl } from 'baseui/form-control';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { InfoIconOutline } from 'components/Icons/InfoIconOutline';
import { BareIconOutline } from 'components/Icons/BareIconOutline';
import { FullBundleIconOutline } from 'components/Icons/FullBundleIconOutline';
import { JsonFormatIconOutline } from 'components/Icons/JsonFormatIconOutline';
import { BsonFormatIconOutline } from 'components/Icons/BsonFormatIconOutline';
import { UsonFormatIconOutline } from 'components/Icons/UsonFormatIconOutline';
import { PartialBundleIconOutline } from 'components/Icons/PartialBundleIconOutline';

import { useToggleAtom } from 'utils/hooks/useToggleAtom';

import { DetailedSelect } from './DetailedSelect';
import { AssetFileSelect } from './AssetFilesSelect';
import { Hint, HintParagraph } from './Hint';

const showEditBundleProfileItemModalOpen = atom(false);

export const useEditBundleProfileItemModal = () => {
  return useToggleAtom(showEditBundleProfileItemModalOpen);
};

export interface IEditBundleProfileItemModalProps {
  onSubmit: () => void;
}

const metadataFormatOptions = [
  {
    id: 'json',
    label: 'JSON',
    description:
      'Traditional JSON format relative large file size, with very fast reading speed.',
    Icon: JsonFormatIconOutline,
  },
  {
    id: 'bson',
    label: 'MessagePack',
    description:
      'Binary format file, with smaller size and very slow reading speed for browser.',
    Icon: BsonFormatIconOutline,
  },
  {
    id: 'uson',
    label: 'Ugly JSON',
    description:
      'Non-standard JSON format, with tiny size and fair performance for machines.',
    Icon: UsonFormatIconOutline,
  },
];

const bundleTypeOptions = [
  {
    id: 'bare',
    label: 'Bare',
    description:
      'Bare bundle would not include any resource file and most metadata, suitable for online deployment purpose.',
    Icon: BareIconOutline,
  },
  {
    id: 'partial',
    label: 'Partial',
    description:
      'Partial bundle will include all metadata and selected resource file, suitable for mobile application.',
    Icon: PartialBundleIconOutline,
  },
  {
    id: 'full',
    label: 'Full',
    description:
      'Offline bundle will include all metadata and all resource file, suitable for offline deployment purpose.',
    Icon: FullBundleIconOutline,
  },
];

export const EditBundleProfileItemModal: React.FC<IEditBundleProfileItemModalProps> =
  () => {
    const [isOpen, , onClose] = useEditBundleProfileItemModal();
    return (
      <Modal
        onClose={onClose}
        isOpen={isOpen}
        animate
        autoFocus
        closeable={false}
        size={SIZE.default}
        role={ROLE.dialog}
      >
        <ModalHeader>Edit Profile</ModalHeader>
        <ModalBody>
          <Hint Artwork={InfoIconOutline}>
            <HintParagraph>
              Bundling profile is used to describe how Recative Studio should
              create application bundle for different platforms.
            </HintParagraph>
            <HintParagraph>
              Please notice that you have to build a specific bundle template
              and web root template to implement the option you selected.
            </HintParagraph>
          </Hint>
          <FormControl
            label="Package Identity"
            caption="The unique package identity of your bundle."
          >
            <Input size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl
            label="Output File Prefix"
            caption="Add a prefix to the output file to distinguish it from other bundles."
          >
            <Input size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl
            label="Bundle Profile Extension"
            caption="The extension that will be used to generate the bundle."
          >
            <Input size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl
            label="Metadata Format"
            caption="The metadata that describes the series and each episode."
          >
            <DetailedSelect
              options={metadataFormatOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Bundle Type"
            caption="Offline availability of the bundle."
          >
            <DetailedSelect
              options={bundleTypeOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Build Constant File"
            caption="Build constant for different packages, useful for AB test or package for different region."
          >
            <AssetFileSelect glob="constant-*.json" size={INPUT_SIZE.mini} />
          </FormControl>
          <FormControl
            label="Template File"
            caption="Recative Studio will fill metadata and resources into this template and make new bundle."
          >
            <AssetFileSelect glob="template*.*" size={INPUT_SIZE.mini} />
          </FormControl>
        </ModalBody>
        <ModalFooter>
          <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
            Cancel
          </ModalButton>
          <ModalButton kind={BUTTON_KIND.primary} onClick={onClose}>
            OK
          </ModalButton>
        </ModalFooter>
      </Modal>
    );
  };
