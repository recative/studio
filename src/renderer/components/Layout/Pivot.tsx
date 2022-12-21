import * as React from 'react';
import { atom, useAtom } from 'jotai';

import { useNavigate } from 'react-router-dom';
import { styled, useStyletron } from 'baseui';

import Avatar from 'boring-avatars';
import { Tabs, Tab } from 'baseui/tabs-motion';
import { Button, KIND as BUTTON_KIND } from 'baseui/button';

import type { TabsOverrides } from 'baseui/tabs-motion';

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
import { PermissionIconOutline } from 'components/Icons/PermissionIconOutline';
import { MergeDatabaseIconOutline } from 'components/Icons/MergeDatabaseIconOutline';
import { PlayerPreviewIconOutline } from 'components/Icons/PlayerPreviewIconOutline';
import { ResourceServerStopOutline } from 'components/Icons/ResourceServerStopOutline';
import { ReleaseManagerIconOutline } from 'components/Icons/ReleaseManagerIconOutline';
import { ResourceServerStartOutline } from 'components/Icons/ResourceServerStartOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';
import { ResourceServerPendingOutline } from 'components/Icons/ResourceServerPendingOutline';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';
import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';
import { TokenIconOutline } from 'components/Icons/TokenIconOutline';
import { StorageIconOutline } from 'components/Icons/StorageIconOutline';

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

interface IPivotButtonProps {
  startEnhancer: React.ReactNode;
  to: string;
  replace?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}

const PivotButton: React.FC<IPivotButtonProps> = ({
  startEnhancer,
  to,
  replace = true,
  disabled,
  children,
}) => {
  const navigate = useNavigate();

  const goTo = useEvent(() => {
    navigate(to, { replace });
  });

  return (
    <Button
      kind={BUTTON_KIND.tertiary}
      startEnhancer={startEnhancer}
      onClick={goTo}
      disabled={disabled}
    >
      {children}
    </Button>
  );
};

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

  const [loginCredential] = useLoginCredential();
  const handleClose = useEvent(async () => {
    await server.closeDb();
    navigate('/', { replace: true });
  });

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
        <PivotButton
          startEnhancer={<ReleaseManagerIconOutline width={20} />}
          to="/release"
        >
          Release
        </PivotButton>
        <PivotButton
          startEnhancer={<PublishIconOutline width={20} />}
          to="/publish"
        >
          Publish
        </PivotButton>
        <PivotButton
          startEnhancer={<BundleIconOutline width={20} />}
          to="/bundle"
        >
          Bundle
        </PivotButton>
        <Separator />
        <PivotButton
          startEnhancer={<SettingsIconOutline width={20} />}
          to="/setting"
        >
          Settings
        </PivotButton>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<CloseIconOutline width={20} />}
          onClick={handleClose}
        >
          Close
        </Button>
      </Tab>
      <Tab title={<TabTitle>View</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <PivotButton
          startEnhancer={<ResourceManagerIconOutline width={20} />}
          to="/resource"
        >
          Resource
        </PivotButton>
        <PivotButton
          startEnhancer={<CloudIconOutline width={20} />}
          to="/cloud"
        >
          Cloud
        </PivotButton>
        <Separator />
        <PivotButton
          startEnhancer={<SeriesIconOutline width={20} />}
          to="/series"
        >
          Series
        </PivotButton>
        <PivotButton
          startEnhancer={<EpisodeIconOutline width={20} />}
          to="/episode"
        >
          Episode
        </PivotButton>
        <PivotButton
          startEnhancer={<ActPointIconOutline width={20} />}
          to="/act-point"
        >
          Act Point
        </PivotButton>
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
        <PivotButton
          disabled={resourceServerStatus !== ResourceServerStatus.Running}
          startEnhancer={<PlayerPreviewIconOutline width={20} />}
          to="/preview"
        >
          Preview
        </PivotButton>
      </Tab>
      <Tab title={<TabTitle>Sync</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        {loginCredential?.tokenHash ? (
          <PivotButton
            startEnhancer={
              <Avatar
                variant="beam"
                size={20}
                name={loginCredential?.sessionId || 'Untitled'}
              />
            }
            to="/user"
          >
            {loginCredential?.sessionId}
          </PivotButton>
        ) : (
          <PivotButton
            startEnhancer={<MergeDatabaseIconOutline width={20} />}
            to="/login"
          >
            Login
          </PivotButton>
        )}
        <PivotButton
          startEnhancer={<PermissionIconOutline width={20} />}
          to="/permission"
        >
          Permission
        </PivotButton>
        <PivotButton
          startEnhancer={<TokenIconOutline width={20} />}
          to="/token"
        >
          Token
        </PivotButton>
        <PivotButton
          startEnhancer={<StorageIconOutline width={20} />}
          to="/storage"
        >
          Storage
        </PivotButton>
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
