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

  const url = new URL(window.location.href);
  url.hash = `#/preview-player`;

  return (
    <PivotLayout>
      <RecativeBlock
        className={layoutContainerStyles}
        display="flex"
        width="100%"
        height="-webkit-fill-available"
      >
        <RecativeBlock
          className={playerContainerStyles}
          height="calc(100vh - 115px)"
        >
          {previewAssetId ? (
            <iframe
              title="Recative Player"
              width="100%"
              height="100%"
              src={url.toString()}
            />
          ) : (
            <Loading />
          )}
        </RecativeBlock>
        <RecativeBlock
          maxWidth="400px"
          minWidth="250px"
          width="25%"
          paddingLeft="8px"
          height="calc(100vh - 115px)"
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

export const Preview = React.memo(InternalPreview);
