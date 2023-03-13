import * as React from 'react';

import { nanoid } from 'nanoid';

import { useAsync } from '@react-hookz/web';

import type { IUploadProfile } from '@recative/extension-sdk';

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
import { SIZE as SELECT_SIZE } from 'baseui/select';
import { KIND as BUTTON_KIND } from 'baseui/button';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';

import { InfoIconOutline } from 'components/Icons/InfoIconOutline';
import { PublishIconOutline } from 'components/Icons/PublishIconOutline';
import { ExtensionConfiguration } from 'components/ExtensionConfiguration/ExtensionConfiguration';

import { server } from 'utils/rpc';
import { ModalManager } from 'utils/hooks/useModalManager';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
  useValueOptionForBaseUiSelectWithSingleValue,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
} from 'utils/hooks/useFormChangeCallbacks';

import { DetailedSelect } from './DetailedSelect';
import { Hint, HintParagraph } from './Hint';

import { useExtensionSettings } from '../hooks/useExtensionSettings';

export const useEditUploadProfileItemModal = ModalManager<string, null>(null);

export interface IEditUploadProfileItemModalProps {
  onSubmit: () => void;
}

const useExtensionList = () => {
  const [extensionList, extensionListActions] = useAsync(
    server.getExtensionMetadata
  );

  React.useEffect(() => {
    void extensionListActions.execute();
  }, [extensionListActions]);

  const availableProfileExtensions = React.useMemo(() => {
    return (
      extensionList.result?.uploader.map((extension) => ({
        id: extension.id,
        label: extension.label,
        description: extension.id,
        Icon: PublishIconOutline,
      })) ?? []
    );
  }, [extensionList.result?.uploader]);

  return availableProfileExtensions;
};

const useProfileDetail = (profileId: string | null) => {
  const [profileDetail, profileDetailActions] = useAsync<IUploadProfile | null>(
    async () =>
      profileId
        ? {
            id: nanoid(),
            label: '',
            uploaderExtensionId: '',
            extensionConfigurations: {},
            ...(await server.getUploadProfile(profileId)),
          }
        : null
  );

  React.useEffect(() => {
    void profileDetailActions.execute();
  }, [profileId, profileDetailActions]);

  return profileDetail.result;
};

export const EditUploadProfileItemModal: React.FC<
  IEditUploadProfileItemModalProps
> = ({ onSubmit }) => {
  const [loading, setLoading] = React.useState(false);
  const [isOpen, profileId, , onClose] = useEditUploadProfileItemModal();
  const extensionListOptions = useExtensionList();

  const profileDetail = useProfileDetail(profileId);

  const [clonedProfile, valueChangeCallbacks, , setClonedProfile] =
    useFormChangeCallbacks(profileDetail ?? null);

  React.useLayoutEffect(() => {
    setClonedProfile(profileDetail ?? null);
  }, [profileDetail, setClonedProfile]);

  const handleLabelChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.label
  );

  const handleUploaderExtensionIdChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.uploaderExtensionId
    );
  const uploadExtensionOptionValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      clonedProfile?.uploaderExtensionId,
      extensionListOptions
    );

  const formValid = React.useMemo(() => {
    return Object.entries(clonedProfile || {}).every(([, value]) => {
      return !!value;
    });
  }, [clonedProfile]);

  const handleSubmit = React.useCallback(async () => {
    if (!clonedProfile) return;
    setLoading(true);
    await server.updateOrInsertUploadProfile(clonedProfile);
    setLoading(false);
    onSubmit();
    onClose();
  }, [clonedProfile, onClose, onSubmit]);

  const [getExtensionSettings, setExtensionSettings] =
    useExtensionSettings<IUploadProfile>(clonedProfile, setClonedProfile);

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
      <ModalHeader>Edit Upload Profile</ModalHeader>
      {profileId !== null ? (
        <ModalBody>
          <Hint Artwork={InfoIconOutline}>
            <HintParagraph>
              Bundling profile is used to describe how Recative Studio should
              upload your media files to storage service providers.
            </HintParagraph>
          </Hint>

          <FormControl
            label="Label"
            caption="Human readable label to distinguish different profiles."
          >
            <Input
              value={clonedProfile?.label || ''}
              onChange={handleLabelChange}
              size={INPUT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Uploader Extension"
            caption="The extension that will be used to upload your files."
          >
            <DetailedSelect
              value={uploadExtensionOptionValue}
              onChange={handleUploaderExtensionIdChange}
              options={extensionListOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          {clonedProfile?.uploaderExtensionId && (
            <ExtensionConfiguration
              domain="uploader"
              type="extension"
              extensionId={clonedProfile?.uploaderExtensionId}
              getValue={getExtensionSettings}
              setValue={setExtensionSettings}
            />
          )}
        </ModalBody>
      ) : null}
      <ModalFooter>
        <ModalButton kind={BUTTON_KIND.tertiary} onClick={onClose}>
          Cancel
        </ModalButton>
        <ModalButton
          kind={BUTTON_KIND.primary}
          onClick={handleSubmit}
          disabled={!formValid && !loading && clonedProfile}
        >
          OK
        </ModalButton>
      </ModalFooter>
    </Modal>
  );
};
