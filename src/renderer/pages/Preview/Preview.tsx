import * as React from 'react';

import { useStyletron } from 'baseui';

import { ActPlayer, Loading } from '@recative/act-player';

import { RecativeBlock } from 'components/Block/RecativeBlock';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { FormControl } from 'baseui/form-control';
import { Accordion, Panel } from 'baseui/accordion';
import { Input, SIZE as INPUT_SIZE } from 'baseui/input';
import {
  Button,
  SIZE as BUTTON_SIZE,
  KIND as BUTTON_KIND,
} from 'baseui/button';

import { LogIconOutline } from 'components/Icons/LogIconOutline';
import { EditIconOutline } from 'components/Icons/EditIconOutline';
import { PivotLayout } from 'components/Layout/PivotLayout';
import { EpisodeIconOutline } from 'components/Icons/EpisodeIconOutline';
import { ResourceServerConfigOutline } from 'components/Icons/ResourceServerConfigOutline';

import { TABS_OVERRIDES, ICON_TAB_OVERRIDES } from 'utils/style/tab';

import { EpisodeList } from './components/EpisodeList';
import { ActPointList } from './components/ActPointList';
import { EnvVariableEditorModal } from './components/EnvVariableEditorModal';

import { useAssets } from './hooks/useAssets';
import { useSettings } from './hooks/useSettings';
import { useEnvVariable } from './hooks/useEnvVariable';
import { useInterfaceComponents } from './hooks/useInterfaceComponents';
import {
  useResetAssetStatusCallback,
  useUserImplementedFunctions,
} from './hooks/useUserImplementedFunctions';

const PREFERRED_UPLOADERS = [
  '@recative/uploader-extension-studio/ResourceManager',
];

const LAYOUT_CONTAINER_STYLES = {
  width: '100%',
  height: '100%',
};

const PLAYER_CONTAINER_STYLES = {
  flexGrow: 1,
} as const;

const ACCORDION_OVERRIDES = {
  Content: {
    style: {
      paddingTop: '0',
      paddingBottom: '12px',
      backgroundColor: 'transparent',
    },
  },
};

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

  const [activeKey, setActiveKey] = React.useState<React.Key>(1);
  const layoutContainerStyles = css(LAYOUT_CONTAINER_STYLES);
  const playerContainerStyles = css(PLAYER_CONTAINER_STYLES);

  const { settings, valueChangeCallbacks } = useSettings();
  const {
    handleEpisodeClick,
    handleActPointClick,
    assets,
    resources,
    playerKey,
    selectedItemId,
    selectedItemType,
  } = useAssets(settings);

  const {
    envVariable,
    envVariableModalOpen,
    handleEnvVariableModalOpen,
    handleEnvVariableModalClose,
    handleEnvVariableSubmit,
  } = useEnvVariable(
    settings,
    selectedItemType === 'episode' ? selectedItemId : null
  );

  const resetAssetStatus = useResetAssetStatusCallback();
  const userImplementedFunctions = useUserImplementedFunctions(
    selectedItemId,
    handleEpisodeClick
  );

  const { interfaceComponents, fetchInterfaceComponents } =
    useInterfaceComponents(
      settings ? `${settings.protocol}://${settings.resourceHost}` : null
    );

  React.useEffect(() => {
    fetchInterfaceComponents();
  }, [fetchInterfaceComponents, settings]);

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
          {!playerKey && <Loading />}
          {assets && resources && playerKey && interfaceComponents && (
            <ActPlayer
              episodeId={playerKey}
              assets={assets}
              resources={resources}
              userData={undefined}
              initialUserImplementedFunctions={userImplementedFunctions}
              envVariable={envVariable}
              interfaceComponents={interfaceComponents}
              preferredUploaders={PREFERRED_UPLOADERS}
              onInitialized={resetAssetStatus}
            />
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
              <Accordion accordion overrides={ACCORDION_OVERRIDES}>
                <Panel title="Episodes">
                  <EpisodeList onItemSelected={handleEpisodeClick} />
                </Panel>
                <Panel title="Act Points">
                  <ActPointList onItemSelected={handleActPointClick} />
                </Panel>
              </Accordion>
            </Tab>
            <Tab
              title="Environment"
              artwork={() => <ResourceServerConfigOutline width={16} />}
              overrides={ICON_TAB_OVERRIDES}
            >
              <FormControl label={<>Resource Host</>}>
                <Input
                  value={settings?.resourceHost}
                  size={INPUT_SIZE.mini}
                  onChange={(event) =>
                    valueChangeCallbacks?.resourceHost(
                      event.currentTarget.value
                    )
                  }
                />
              </FormControl>
              <FormControl label={<>Act Point Host</>}>
                <Input
                  value={settings?.apHost}
                  size={INPUT_SIZE.mini}
                  onChange={(event) =>
                    valueChangeCallbacks?.apHost(event.currentTarget.value)
                  }
                />
              </FormControl>
              <FormControl label={<>Content Protocol</>}>
                <Input
                  value={settings?.protocol}
                  size={INPUT_SIZE.mini}
                  onChange={(event) =>
                    valueChangeCallbacks?.protocol(event.currentTarget.value)
                  }
                />
              </FormControl>
              <FormControl label={<>Environment Variable</>}>
                <Button
                  startEnhancer={<EditIconOutline width={14} color="white" />}
                  kind={BUTTON_KIND.secondary}
                  size={BUTTON_SIZE.mini}
                  overrides={ENV_VARIABLE_EDITOR_BUTTON_OVERRIDES}
                  onClick={handleEnvVariableModalOpen}
                >
                  Open Editor
                </Button>
              </FormControl>
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
