import * as React from 'react';

import { useAtom } from 'jotai';
import { useStyletron } from 'baseui';
import { useLocalStorageValue } from '@react-hookz/web';

import { Loading } from '@recative/act-player';
import {
  useSdkConfig,
  PlayerSdkProvider,
  ContentModuleFactory,
} from '@recative/client-sdk';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { useStudioSettings } from 'pages/Setting/hooks/useStudioSettings';

import { useEnvVariable } from './hooks/useEnvVariable';
import {
  initialAssetStatusAtom,
  useUserImplementedFunctions,
} from './hooks/useUserImplementedFunctions';

import { SELECTED_ASSET_ID } from './constants/storageKeys';

const PREFERRED_UPLOADERS = [
  '@recative/uploader-extension-studio/ResourceManager',
];

const TRUSTED_UPLOADERS = [
  '@recative/uploader-extension-studio/ResourceManager',
];

const DEPENDENCIES = {};

const PlayerContainerStyles = {
  flexGrow: 1,
} as const;

const USER_DATA = {
  token: '',
  avatar: '',
  userName: '',
};

const onEpisodeUpdate = async () => {};

const InternalPreviewPlayer: React.FC = React.memo(() => {
  const [css] = useStyletron();

  const [previewAssetId, setPreviewAssetId] = useLocalStorageValue<
    string | undefined
  >(SELECTED_ASSET_ID, undefined);
  const [initialAsset] = useAtom(initialAssetStatusAtom);

  const playerContainerStyles = css(PlayerContainerStyles);

  const config = useSdkConfig();

  const Content = React.useMemo(
    () => ContentModuleFactory(config.pathPattern, config.dataType),
    [config.pathPattern, config.dataType]
  );

  const { envVariable } = useEnvVariable(previewAssetId ?? null);

  const userImplementedFunctions = useUserImplementedFunctions(
    previewAssetId ?? null,
    setPreviewAssetId
  );

  return (
    <RecativeBlock
      className={playerContainerStyles}
      position="fixed"
      top="0"
      left="0"
      width="100vw"
      height="100vh"
    >
      {previewAssetId ? (
        <React.Suspense fallback={<Loading />}>
          <Content
            episodeId={previewAssetId}
            userImplementedFunctions={userImplementedFunctions}
            envVariable={envVariable}
            trustedUploaders={TRUSTED_UPLOADERS}
            preferredUploaders={PREFERRED_UPLOADERS}
            LoadingComponent={Loading}
            playerPropsHookDependencies={DEPENDENCIES}
            userData={USER_DATA}
            onEpisodeIdUpdate={onEpisodeUpdate}
          />
        </React.Suspense>
      ) : (
        <Loading />
      )}
    </RecativeBlock>
  );
});

export const PreviewPlayer = () => {
  const studioSettings = useStudioSettings();

  if (!studioSettings) {
    return <Loading />;
  }

  return (
    <PlayerSdkProvider
      pathPattern={`${studioSettings.contentProtocol}://${studioSettings.resourceHost}/preview/$fileName`}
      dataType="json"
    >
      <InternalPreviewPlayer />
    </PlayerSdkProvider>
  );
};
