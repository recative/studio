import * as React from 'react';
import { atom, useAtom } from 'jotai';

import { useNavigate } from 'react-router-dom';
import { styled, useStyletron } from 'baseui';

import { Tabs, Tab } from 'baseui/tabs-motion';
import type { TabsOverrides } from 'baseui/tabs-motion';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import {
  useResourceServer,
  ResourceServerStatus,
} from 'pages/Server/hooks/resourceServer';
// import { useCodeServer, CodeServerStatus } from 'pages/Server/hooks/codeServer';

import { HelpIconOutline } from 'components/Icons/HelpIconOutline';
// import { SaveIconOutline } from 'components/Icons/SaveIconOutline';
import { CloseIconOutline } from 'components/Icons/CloseIconOutline';
import { AboutIconOutline } from 'components/Icons/AboutIconOutline';
import { CloudIconOutline } from 'components/Icons/CloudIconOutline';
import { SeriesIconOutline } from 'components/Icons/SeriesIconOutline';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';
// import { CommitIconOutline } from 'components/Icons/CommitIconOutline';
import { GitHubIconOutline } from 'components/Icons/GitHubIconOutline';
import { PublishIconOutline } from 'components/Icons/PublishIconOutline';
import { EpisodeIconOutline } from 'components/Icons/EpisodeIconOutline';
import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';
import { SettingsIconOutline } from 'components/Icons/SettingsIconOutline';
import { MergeDatabaseIconOutline } from 'components/Icons/MergeDatabaseIconOutline';
import { PlayerPreviewIconOutline } from 'components/Icons/PlayerPreviewIconOutline';
import { ResourceServerStopOutline } from 'components/Icons/ResourceServerStopOutline';
import { ReleaseManagerIconOutline } from 'components/Icons/ReleaseManagerIconOutline';
import { ResourceServerStartOutline } from 'components/Icons/ResourceServerStartOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';
import { ResourceServerPendingOutline } from 'components/Icons/ResourceServerPendingOutline';

import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';

import { server } from 'utils/rpc';

export const TabTitle = styled('div', {
  marginTop: '-8px',
  marginBottom: '-8px',
});

export const Separator = styled('span', {
  width: '2px',
  height: '32px',
  marginLeft: '8px',
  marginRight: '8px',
  background: '#ccc',
  transform: 'translateY(6px) scaleX(0.75)',
  display: 'inline-block',
});

const useTabsOverrides = (highlightBackground: string): TabsOverrides => {
  return React.useMemo(
    () => ({
      Root: {
        style: {
          boxShadow: `0 0 8px rgba(0, 0, 0, 0.2)`,
          position: 'relative',
        },
      },
      TabHighlight: {
        style: {
          height: '4px',
          marginTop: '-4px',
          background: highlightBackground,
        },
      },
      TabBorder: {
        style: {
          backgroundColor: 'transparent',
        },
      },
    }),
    [highlightBackground]
  );
};

const ACTIVE_KEY = atom('0');

export interface ColorDefinition {
  key: string;
  color: string;
}

interface IPivotProps {
  additionalTabs?: React.ReactNode;
  tabColors?: ColorDefinition[];
}

export const InternalPivot: React.FC<IPivotProps> = ({
  additionalTabs,
  tabColors,
}) => {
  const [, theme] = useStyletron();
  const navigate = useNavigate();

  const [activeKey, setActiveKey] = useAtom(ACTIVE_KEY);
  const activeKeyIndex =
    tabColors?.findIndex((item) => item.key === activeKey) ?? -1;
  const tabsOverrides = useTabsOverrides(
    activeKeyIndex > -1 && tabColors
      ? tabColors[activeKeyIndex].color
      : theme.colors.primaryA
  );

  const { toggleResourceServerStatus, resourceServerStatus } =
    useResourceServer();

  // const { toggleCodeServerStatus, codeServerStatus } = useCodeServer();

  return (
    <Tabs
      activeKey={activeKey}
      onChange={({ activeKey: nextActiveKey }) => {
        setActiveKey(nextActiveKey as string);
      }}
      overrides={tabsOverrides}
      activateOnFocus
    >
      <Tab title={<TabTitle>Project</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<ReleaseManagerIconOutline width={20} />}
          onClick={() => navigate('/release', { replace: true })}
        >
          Release
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          onClick={() => navigate('/publish', { replace: true })}
          startEnhancer={<PublishIconOutline width={20} />}
        >
          Publish
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          onClick={() => navigate('/bundle', { replace: true })}
          startEnhancer={<BundleIconOutline width={20} />}
        >
          Bundle
        </Button>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          onClick={() => navigate('/setting', { replace: true })}
          startEnhancer={<SettingsIconOutline width={20} />}
        >
          Settings
        </Button>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<CloseIconOutline width={20} />}
          onClick={async () => {
            await server.closeDb();
            navigate('/', { replace: true });
          }}
        >
          Close
        </Button>
      </Tab>
      <Tab title={<TabTitle>View</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<ResourceManagerIconOutline width={20} />}
          onClick={() => navigate('/resource', { replace: true })}
        >
          Resource
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<CloudIconOutline width={20} />}
          onClick={() => navigate('/cloud', { replace: true })}
        >
          Cloud
        </Button>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<SeriesIconOutline width={20} />}
          onClick={() => navigate('/series', { replace: true })}
        >
          Series
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<EpisodeIconOutline width={20} />}
          onClick={() => navigate('/episode', { replace: true })}
        >
          Episode
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<ActPointIconOutline width={20} />}
          onClick={() => navigate('/act-point', { replace: true })}
        >
          Act Point
        </Button>
      </Tab>
      <Tab title={<TabTitle>Server</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          disabled={resourceServerStatus === ResourceServerStatus.Pending}
          startEnhancer={
            <>
              {resourceServerStatus === ResourceServerStatus.Idle && (
                <ResourceServerStartOutline width={20} />
              )}
              {resourceServerStatus === ResourceServerStatus.Pending && (
                <ResourceServerPendingOutline width={20} />
              )}
              {resourceServerStatus === ResourceServerStatus.Running && (
                <ResourceServerStopOutline width={20} />
              )}
            </>
          }
          onClick={toggleResourceServerStatus}
        >
          Resource
        </Button>
        {/* <Button
          kind={BUTTON_KIND.tertiary}
          disabled={resourceServerStatus === ResourceServerStatus.Pending}
          startEnhancer={
            <>
              {codeServerStatus === CodeServerStatus.Idle && (
                <ResourceServerStartOutline width={20} />
              )}
              {codeServerStatus === CodeServerStatus.Pending && (
                <ResourceServerPendingOutline width={20} />
              )}
              {codeServerStatus === CodeServerStatus.Running && (
                <ResourceServerStopOutline width={20} />
              )}
            </>
          }
          onClick={toggleCodeServerStatus}
        >
          Code
        </Button> */}
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          disabled={resourceServerStatus !== ResourceServerStatus.Running}
          startEnhancer={<PlayerPreviewIconOutline width={20} />}
          onClick={() => navigate('/preview', { replace: true })}
        >
          Preview
        </Button>
      </Tab>
      <Tab title={<TabTitle>Utils</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<MergeDatabaseIconOutline width={20} />}
          onClick={() => navigate('/merge-resource-db', { replace: true })}
        >
          Merge Resource DB
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<MergeDatabaseIconOutline width={20} />}
          onClick={() => server.purgePostProcessRecords()}
        >
          Purge Post Processing
        </Button>
      </Tab>
      <Tab title={<TabTitle>Help</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<HelpIconOutline width={20} />}
        >
          Help
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<GitHubIconOutline width={20} />}
        >
          Source
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<AboutIconOutline width={20} />}
        >
          About
        </Button>
      </Tab>
      {additionalTabs}
    </Tabs>
  );
};

export const Pivot = React.memo(InternalPivot);
