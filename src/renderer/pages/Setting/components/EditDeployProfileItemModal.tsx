import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { Category } from '@recative/definitions';
import type { IDeployProfile } from '@recative/extension-sdk';

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
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';
import { DeployIconOutline } from 'components/Icons/DeployIconOutline';
import { ExtensionIconOutline } from 'components/Icons/ExtensionIconOutline';

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

export const useEditDeployProfileItemModal = ModalManager<string, null>(null);

export interface IEditDeployProfileItemModalProps {
  onSubmit: () => void;
}

const useBundleProfileList = () => {
  const [bundleProfiles, listBundleProfileActions] = useAsync(() =>
    server.listBundleProfile()
  );

  React.useEffect(() => {
    void listBundleProfileActions.execute();
  }, [listBundleProfileActions]);

  const availableBundleProfiles = React.useMemo(() => {
    return (
      bundleProfiles.result?.map((extension) => ({
        id: extension.id,
        label: extension.label,
        description: extension.bundleExtensionId,
        Icon: BundleIconOutline,
      })) ?? []
    );
  }, [bundleProfiles.result]);

  return availableBundleProfiles;
};

const useUploaderList = () => {
  const [uploaderList, uploaderListActions] = useAsync(() =>
    server.getExtensionMetadata()
  );

  React.useEffect(() => {
    void uploaderListActions.execute();
  }, [uploaderListActions]);

  const availableProfileExtensions = React.useMemo(() => {
    return (
      uploaderList.result?.uploader
        .filter((x) => x.acceptedFileCategory?.includes(Category.ApBundle))
        .map((extension) => ({
          id: extension.id,
          label: extension.label,
          description: extension.id,
          Icon: ExtensionIconOutline,
        })) ?? []
    );
  }, [uploaderList.result?.uploader]);

  return availableProfileExtensions;
};

const useDeployerList = () => {
  const [deployerList, deployerListActions] = useAsync(
    server.getExtensionMetadata
  );

  React.useEffect(() => {
    void deployerListActions.execute();
  }, [deployerListActions]);

  const availableProfileExtensions = React.useMemo(() => {
    return (
      deployerList.result?.deployer.map((extension) => ({
        id: extension.id,
        label: extension.label,
        description: extension.id,
        Icon: DeployIconOutline,
      })) ?? []
    );
  }, [deployerList.result?.deployer]);

  return availableProfileExtensions;
};

const useProfileDetail = (profileId: string | null) => {
  const [profileDetail, profileDetailActions] = useAsync<IDeployProfile | null>(
    async () =>
      profileId
        ? {
            id: profileId,
            label: '',
            sourceBuildProfileId: '',
            targetUploaderId: '',
            deployerId: '',
            ...(await server.getDeployProfile(profileId)),
          }
        : null
  );

  React.useEffect(() => {
    void profileDetailActions.execute();
  }, [profileId, profileDetailActions]);

  return profileDetail.result;
};

export const EditDeployProfileItemModal: React.FC<
  IEditDeployProfileItemModalProps
> = ({ onSubmit }) => {
  const [loading, setLoading] = React.useState(false);
  const [isOpen, profileId, , onClose] = useEditDeployProfileItemModal();
  const extensionListOptions = useUploaderList();
  const bundleProfileList = useBundleProfileList();
  const deployerList = useDeployerList();

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
      valueChangeCallbacks.targetUploaderId
    );
  const bundleExtensionOptionValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      clonedProfile?.targetUploaderId,
      extensionListOptions
    );
  const handleBundleProfileIdChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.sourceBuildProfileId
    );
  const bundleProfileOptionValue = useValueOptionForBaseUiSelectWithSingleValue(
    clonedProfile?.sourceBuildProfileId,
    bundleProfileList
  );
  const handleDeployerIdChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.deployerId
    );
  const deployerOptionValue = useValueOptionForBaseUiSelectWithSingleValue(
    clonedProfile?.deployerId,
    deployerList
  );

  const formValid = React.useMemo(() => {
    return Object.entries(clonedProfile || {}).every(([, value]) => {
      return !!value;
    });
  }, [clonedProfile]);

  const handleSubmit = React.useCallback(async () => {
    if (!clonedProfile) return;
    setLoading(true);
    await server.updateOrInsertDeployProfile(clonedProfile);
    setLoading(false);
    onSubmit();
    onClose();
  }, [clonedProfile, onClose, onSubmit]);

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
      <ModalHeader>Edit Deploy Profile</ModalHeader>
      {profileId !== null ? (
        <ModalBody>
          <Hint Artwork={InfoIconOutline}>
            <HintParagraph>
              Deploy profile is used to describe how Recative Studio deploy the
              compiled content to different storage service providers.
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
            label="Bundling Profile"
            caption="The extension that will be used to deploy the bundle."
          >
            <DetailedSelect
              value={bundleProfileOptionValue}
              onChange={handleBundleProfileIdChange}
              options={bundleProfileList}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Deployer"
            caption="The deployer which will analysis the program bundle."
          >
            <DetailedSelect
              value={deployerOptionValue}
              onChange={handleDeployerIdChange}
              options={deployerList}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Uploader Extension"
            caption="The extension that will be used to deploy the bundle."
          >
            <DetailedSelect
              value={bundleExtensionOptionValue}
              onChange={handleUploaderExtensionIdChange}
              options={extensionListOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
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
