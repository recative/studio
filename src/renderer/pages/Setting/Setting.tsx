import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { FormControl } from 'baseui/form-control';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import {
  HeadingSmall,
  ParagraphSmall,
  HeadingXXLarge,
} from 'baseui/typography';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { ContentContainer } from 'components/Layout/ContentContainer';
import { ExtensionConfiguration } from 'components/ExtensionConfiguration/ExtensionConfiguration';

import { useDatabaseLocked } from 'utils/hooks/useDatabaseLockChecker';
import {
  useFormChangeCallbacks,
  useOnChangeEventWrapperForStringType,
} from 'utils/hooks/useFormChangeCallbacks';
import { server } from 'utils/rpc';

import { BundleProfiles } from './components/BundleProfiles';

const useSettings = () => {
  const [extensionMetadata, extensionMetadataActions] = useAsync(async () => {
    const settings = await server.getSettings();

    return settings;
  });

  React.useEffect(() => {
    extensionMetadataActions.execute();
  }, [extensionMetadataActions, extensionMetadataActions.execute]);

  return extensionMetadata.result;
};

const InternalSetting: React.FC = () => {
  const settings = useSettings();
  const databaseLocked = useDatabaseLocked();

  const handleSubmitConfigToServer = React.useCallback(
    (key: string, value: string) => {
      server.setSettings({ [key]: value });
    },
    []
  );

  const onFieldChange = React.useCallback(
    (field: string, draft: Record<string, string> | null) => {
      if (!draft) {
        return;
      }

      handleSubmitConfigToServer(field, draft[field] ?? '');
    },
    [handleSubmitConfigToServer]
  );

  const [configValue, onChangeCallbacks, , setClonedValue] =
    useFormChangeCallbacks(settings || null, onFieldChange);

  React.useEffect(() => {
    if (settings) {
      setClonedValue({
        resourceHost: '',
        apHost: '',
        contentProtocol: '',
        playerUiModulePathOverride: '',
        buildPathOverride: '',
        ...settings,
      });
    }
  }, [settings, setClonedValue]);

  const onResourceHostChange = useOnChangeEventWrapperForStringType(
    onChangeCallbacks.resourceHost
  );
  const onApHostChange = useOnChangeEventWrapperForStringType(
    onChangeCallbacks.apHost
  );
  const onServiceProtocolChange = useOnChangeEventWrapperForStringType(
    onChangeCallbacks.contentProtocol
  );
  const onBuildPathChange = useOnChangeEventWrapperForStringType(
    onChangeCallbacks.buildPathOverride
  );

  const onSettingsGetValue = React.useCallback(
    (extensionId: string, key: string) => {
      return settings?.[`${extensionId}~~${key}`] ?? '';
    },
    [settings]
  );

  const onSettingsSetValue = React.useCallback(
    (extensionId: string, key: string, value: string) => {
      server.setSettings({ [`${extensionId}~~${key}`]: value });
    },
    []
  );

  return (
    <PivotLayout>
      <ContentContainer width={1000}>
        <RecativeBlock paddingLeft="20px" paddingRight="20px">
          <HeadingXXLarge>Settings</HeadingXXLarge>
          <HeadingSmall>Publish</HeadingSmall>
          <FormControl
            label="Build Artifacts Path Override"
            caption="This will affect the output path of the compiled product and the compiled output of clients such as Windows, macOS, Android, iOS, etc."
          >
            <Input
              size={INPUT_SIZE.mini}
              disabled={databaseLocked}
              value={configValue?.buildPathOverride || ''}
              onChange={onBuildPathChange}
            />
          </FormControl>
          <HeadingSmall>Server</HeadingSmall>
          <ParagraphSmall>
            You have to restart the resource server to make these configurations
            take effect.
          </ParagraphSmall>
          <FormControl
            label="Resource Host"
            caption="Act Studio will start a resource server for local debug purpose."
          >
            <Input
              size={INPUT_SIZE.mini}
              value={configValue?.resourceHost || ''}
              onChange={onResourceHostChange}
            />
          </FormControl>
          <FormControl
            label="Act Point Host"
            caption="The URL of the AP Pack server, we use this URL to generate episode metadata."
          >
            <Input
              size={INPUT_SIZE.mini}
              value={configValue?.apHost || ''}
              onChange={onApHostChange}
            />
          </FormControl>
          <FormControl
            label="Content Protocol"
            caption="To prevent potential request error, resource host and act point host must share the same service protocol."
          >
            <Input
              size={INPUT_SIZE.mini}
              value={configValue?.contentProtocol || ''}
              onChange={onServiceProtocolChange}
            />
          </FormControl>
          <FormControl
            label="Player UI Module Path Override"
            caption="Override the Player UI module provided by resource server, this is useful for UI module developers."
          >
            <Input
              size={INPUT_SIZE.mini}
              value={configValue?.contentProtocol || ''}
              onChange={onServiceProtocolChange}
            />
          </FormControl>
          <HeadingSmall>Bundling</HeadingSmall>
          <BundleProfiles />
          <HeadingSmall>Uploader</HeadingSmall>
          <ExtensionConfiguration
            domain="uploader"
            type="plugin"
            disabled={databaseLocked}
            getValue={onSettingsGetValue}
            setValue={onSettingsSetValue}
          />
        </RecativeBlock>
      </ContentContainer>
    </PivotLayout>
  );
};

export const Setting = React.memo(InternalSetting);
