import * as React from 'react';

import type { Updater } from 'use-immer';

import { useAsync } from '@react-hookz/web';

import type { IBundleProfile } from '@recative/extension-sdk';

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

import { IOSIconOutline } from 'components/Icons/IOSIconOutline';
import { AabIconOutline } from 'components/Icons/AabIconOutline';
import { InfoIconOutline } from 'components/Icons/InfoIconOutline';
import { BareIconOutline } from 'components/Icons/BareIconOutline';
import { CodeIconOutline } from 'components/Icons/CodeIconOutline';
import { RawBundleOutline } from 'components/Icons/RawBundleOutline';
import { AndroidIconOutline } from 'components/Icons/AndroidIconOutline';
import { FullBundleIconOutline } from 'components/Icons/FullBundleIconOutline';
import { JsonFormatIconOutline } from 'components/Icons/JsonFormatIconOutline';
import { BsonFormatIconOutline } from 'components/Icons/BsonFormatIconOutline';
import { UsonFormatIconOutline } from 'components/Icons/UsonFormatIconOutline';
import { ExtensionConfiguration } from 'components/ExtensionConfiguration/ExtensionConfiguration';
import { PartialBundleIconOutline } from 'components/Icons/PartialBundleIconOutline';

import { ModalManager } from 'utils/hooks/useModalManager';

import { server } from 'utils/rpc';

import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
  useValueOptionForBaseUiSelectWithSingleValue,
  useOnChangeEventWrapperForBaseUiSelectWithSingleValue,
} from 'utils/hooks/useFormChangeCallbacks';
import { DetailedSelect } from './DetailedSelect';
import { AssetFileSelect } from './AssetFilesSelect';
import { Hint, HintParagraph } from './Hint';

export const useEditBundleProfileItemModal = ModalManager<string, null>(null);

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

const offlineAvailabilityOptions = [
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

const icons: Record<string, React.FC<React.SVGProps<SVGSVGElement>>> = {
  android: AndroidIconOutline,
  apple: IOSIconOutline,
  google: AabIconOutline,
  raw: RawBundleOutline,
  web: CodeIconOutline,
};

const RAW_EXTENSION_ID = '@recative/extension-raw/RawBundler';

const useExtensionList = () => {
  const [extensionList, extensionListActions] = useAsync(
    server.getExtensionMetadata
  );

  React.useEffect(() => {
    extensionListActions.execute();
  }, [extensionListActions]);

  const availableProfileExtensions = React.useMemo(() => {
    return (
      extensionList.result?.bundler.map((extension) => ({
        id: extension.id,
        label: extension.label,
        description: extension.id,
        Icon: icons[extension.iconId ?? ''],
      })) ?? []
    );
  }, [extensionList.result?.bundler]);

  return availableProfileExtensions;
};

const useProfileDetail = (profileId: string | null) => {
  const [profileDetail, profileDetailActions] = useAsync<IBundleProfile | null>(
    async () =>
      profileId
        ? (await server.getBundleProfile(profileId)) ?? {
            id: profileId,
            packageId: '',
            label: '',
            prefix: '',
            bundleExtensionId: '',
            metadataFormat: '',
            constantFileName: '',
            offlineAvailability: '',
            shellTemplateFileName: '',
            webRootTemplateFileName: '',
            extensionConfigurations: {},
          }
        : null
  );

  React.useEffect(() => {
    profileDetailActions.execute();
  }, [profileId, profileDetailActions]);

  return profileDetail.result;
};

const useExtensionSettings = (
  profile: IBundleProfile | null,
  setProfile?: Updater<IBundleProfile | null>
) => {
  const getValue = React.useCallback(
    (extensionId: string, fieldId: string) => {
      const fieldQueryKey = `${extensionId}~~${fieldId}`;
      return profile?.extensionConfigurations[fieldQueryKey] || '';
    },
    [profile]
  );

  const setValue = React.useCallback(
    (extensionId: string, key: string, value: string) => {
      const fieldQueryKey = `${extensionId}~~${key}`;
      setProfile?.((draft) => {
        if (draft) {
          draft.extensionConfigurations[fieldQueryKey] = value;
        }
        return draft;
      });
    },
    [setProfile]
  );

  return [getValue, setValue] as const;
};

export const EditBundleProfileItemModal: React.FC<
  IEditBundleProfileItemModalProps
> = ({ onSubmit }) => {
  const [loading, setLoading] = React.useState(false);
  const [isOpen, profileId, , onClose] = useEditBundleProfileItemModal();
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
  const handlePrefixChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.prefix
  );
  const handlePackageIdChange = useOnChangeEventWrapperForStringType(
    valueChangeCallbacks.packageId
  );
  const handleBundleExtensionIdChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.bundleExtensionId
    );
  const bundleExtensionOptionValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      clonedProfile?.bundleExtensionId,
      extensionListOptions
    );
  const handleMetadataFormatChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.metadataFormat
    );
  const metadataFormatOptionValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      clonedProfile?.metadataFormat,
      metadataFormatOptions
    );
  const handleOfflineAvailabilityChange =
    useOnChangeEventWrapperForBaseUiSelectWithSingleValue(
      valueChangeCallbacks.offlineAvailability
    );
  const offlineAvailabilityOptionValue =
    useValueOptionForBaseUiSelectWithSingleValue(
      clonedProfile?.offlineAvailability,
      offlineAvailabilityOptions
    );

  const formValid = React.useMemo(() => {
    return Object.entries(clonedProfile || {}).every(([key, value]) => {
      if (clonedProfile?.bundleExtensionId === RAW_EXTENSION_ID) {
        if (
          key === 'shellTemplateFileName' ||
          key === 'webRootTemplateFileName' ||
          key === 'packageId'
        ) {
          return true;
        }
      }

      return !!value;
    });
  }, [clonedProfile]);

  const handleSubmit = React.useCallback(async () => {
    if (!clonedProfile) return;
    setLoading(true);
    await server.updateOrInsertBundleProfile(clonedProfile);
    setLoading(false);
    onSubmit();
    onClose();
  }, [clonedProfile, onClose, onSubmit]);

  const [getExtensionSettings, setExtensionSettings] = useExtensionSettings(
    clonedProfile,
    setClonedProfile
  );

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
      <ModalHeader>Edit Bundle Profile</ModalHeader>
      {profileId !== null ? (
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
            label="Bundle Profile Extension"
            caption="The extension that will be used to generate the bundle."
          >
            <DetailedSelect
              value={bundleExtensionOptionValue}
              onChange={handleBundleExtensionIdChange}
              options={extensionListOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          {clonedProfile?.bundleExtensionId !== RAW_EXTENSION_ID && (
            <FormControl
              label="Package Identity"
              caption="The unique package identity of your bundle."
            >
              <Input
                value={clonedProfile?.packageId || ''}
                onChange={handlePackageIdChange}
                size={INPUT_SIZE.mini}
              />
            </FormControl>
          )}
          <FormControl
            label="Output File Prefix"
            caption="Add a prefix to the output file to distinguish it from other bundles."
          >
            <Input
              value={clonedProfile?.prefix || ''}
              onChange={handlePrefixChange}
              size={INPUT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Metadata Format"
            caption="The metadata that describes the series and each episode."
          >
            <DetailedSelect
              value={metadataFormatOptionValue}
              onChange={handleMetadataFormatChange}
              options={metadataFormatOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Bundle Type"
            caption="Offline availability of the bundle."
          >
            <DetailedSelect
              value={offlineAvailabilityOptionValue}
              onChange={handleOfflineAvailabilityChange}
              options={offlineAvailabilityOptions}
              size={SELECT_SIZE.mini}
            />
          </FormControl>
          <FormControl
            label="Build Constant File"
            caption="Build constant for different packages, useful for AB test or package for different region."
          >
            <AssetFileSelect
              value={clonedProfile?.constantFileName}
              onChange={valueChangeCallbacks.constantFileName}
              glob="constant-*.json"
              size={INPUT_SIZE.mini}
            />
          </FormControl>
          {clonedProfile?.bundleExtensionId !== RAW_EXTENSION_ID && (
            <>
              <FormControl
                label="Template File"
                caption="Recative Studio will fill metadata and resources into this template and make new bundle."
              >
                <AssetFileSelect
                  value={clonedProfile?.shellTemplateFileName}
                  onChange={valueChangeCallbacks.shellTemplateFileName}
                  glob="template*.*"
                  size={INPUT_SIZE.mini}
                />
              </FormControl>
              <FormControl
                label="Web Root File"
                caption="The web root file provided by bundle profile developers."
              >
                <AssetFileSelect
                  value={clonedProfile?.webRootTemplateFileName}
                  onChange={valueChangeCallbacks.webRootTemplateFileName}
                  glob="*web-root.zip"
                  size={INPUT_SIZE.mini}
                />
              </FormControl>
            </>
          )}
          {clonedProfile?.bundleExtensionId && (
            <ExtensionConfiguration
              domain="bundler"
              type="bundler"
              extensionId={clonedProfile?.bundleExtensionId}
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
