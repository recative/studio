import * as React from 'react';

import { useStyletron } from 'baseui';
import { useLocalStorageValue } from '@react-hookz/web';

import { Loading } from '@recative/act-player';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { ErrorBoundary } from 'react-error-boundary';

import { PivotLayout } from 'components/Layout/PivotLayout';
import { RecativeBlock } from 'components/Block/RecativeBlock';
import { LogIconOutline } from 'components/Icons/LogIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { EpisodeIconOutline } from 'components/Icons/EpisodeIconOutline';
import { ResourceServerConfigOutline } from 'components/Icons/ResourceServerConfigOutline';

import { TABS_OVERRIDES, ICON_TAB_OVERRIDES } from 'utils/style/tab';

import { AssetListTree } from './components/AssetListTree';
import { EnvVariableEditorModal } from './components/EnvVariableEditorModal';

import { useEnvVariable } from './hooks/useEnvVariable';

import { SELECTED_ASSET_ID } from './constants/storageKeys';

const LayoutContainerStyles = {
  width: '100%',
  height: '100%',
};

const PlayerContainerStyles = {
  flexGrow: 1,
} as const;

const ENV_VARIABLE_EDITOR_BUTTON_OVERRIDES = {
  BaseButton: {
    style: {
      width: '100%',
      paddingTop: '8px',
      paddingBottom: '8px',
    },
  },
};

const ErrorFallback = () => <>Oops</>;

const InternalPlayerContainer: React.FC = () => {
  const [previewAssetId] = useLocalStorageValue<string | undefined>(
    SELECTED_ASSET_ID,
    undefined
  );

  const iframeRef = React.useRef<HTMLIFrameElement>(
    document.createElement('iframe')
  );

  React.useEffect(() => {
    const $iframe = iframeRef.current;

    try {
      if (!previewAssetId) {
        $iframe.src = 'about:blank';
      } else {
        $iframe.width = '100%';
        $iframe.height = '100%';
        $iframe.style.border = 'none';

        const $container = document.querySelector('#iframeContainer');
        const url = new URL(window.location.href);
        url.hash = `#/preview-player`;

        if (!$container) {
          throw new Error('Container not found');
        }

        $iframe.src = url.toString();
        $container.appendChild($iframe);
      }
    } catch (e) {
      console.error(e);
    }
  }, [previewAssetId]);

  React.useLayoutEffect(() => {
    return () => {
      // This is safe.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      const $iframe = iframeRef.current;
      $iframe.src = 'about:blank';

      try {
        $iframe.remove();
      } catch (e) {
        console.error(e);
      }
    };
  }, []);

  return <RecativeBlock id="iframeContainer" width="100%" height="100%" />;
};

export const PlayerContainer: React.FC = React.memo(() => {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <InternalPlayerContainer />
    </ErrorBoundary>
  );
});

const InternalPreview: React.FC = () => {
  const [css] = useStyletron();

  const [previewAssetId] = useLocalStorageValue<string | undefined>(
    SELECTED_ASSET_ID,
    undefined
  );

  const [activeKey, setActiveKey] = React.useState<React.Key>(1);
  const layoutContainerStyles = css(LayoutContainerStyles);
  const playerContainerStyles = css(PlayerContainerStyles);

  const {
    envVariableModalOpen,
    handleEnvVariableModalOpen,
    handleEnvVariableModalClose,
    handleEnvVariableSubmit,
  } = useEnvVariable(previewAssetId ?? null);

  return (
    <PivotLayout>
      <RecativeBlock
        className={layoutContainerStyles}
        display="flex"
        top="0"
        left="0"
        position="absolute"
        width="100%"
        height="100%"
        overflow="clip"
      >
        <RecativeBlock className={playerContainerStyles}>
          <PlayerContainer />
          {!previewAssetId && <Loading />}
        </RecativeBlock>
        <RecativeBlock
          maxWidth="400px"
          minWidth="250px"
          width="25%"
          paddingLeft="8px"
          overflow="auto"
        >
          <Tabs
            overrides={TABS_OVERRIDES}
            activeKey={activeKey}
            onChange={({ activeKey: x }) => setActiveKey(x)}
          >
            <Tab
              title="Log"
              artwork={() => <LogIconOutline width={16} />}
              overrides={ICON_TAB_OVERRIDES}
            >
              I must not fear.
            </Tab>
            <Tab
              title="Items"
              artwork={() => <EpisodeIconOutline width={16} />}
              overrides={ICON_TAB_OVERRIDES}
            >
              <AssetListTree />
            </Tab>
            <Tab
              title="Environment"
              artwork={() => <ResourceServerConfigOutline width={16} />}
              overrides={ICON_TAB_OVERRIDES}
            >
              <Button
                startEnhancer={<EditIconOutline width={14} color="white" />}
                kind={BUTTON_KIND.secondary}
                size={BUTTON_SIZE.mini}
                overrides={ENV_VARIABLE_EDITOR_BUTTON_OVERRIDES}
                onClick={handleEnvVariableModalOpen}
              >
                Open Editor
              </Button>
            </Tab>
          </Tabs>
        </RecativeBlock>
      </RecativeBlock>
      <EnvVariableEditorModal
        isOpen={envVariableModalOpen}
        onClose={handleEnvVariableModalClose}
        onSubmit={handleEnvVariableSubmit}
      />
    </PivotLayout>
  );
};

export const Preview: React.FC = React.memo(InternalPreview);
