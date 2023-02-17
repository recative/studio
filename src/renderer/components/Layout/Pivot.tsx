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
import { TokenIconOutline } from 'components/Icons/TokenIconOutline';
import { SeriesIconOutline } from 'components/Icons/SeriesIconOutline';
import { BundleIconOutline } from 'components/Icons/BundleIconOutline';
// import { CommitIconOutline } from 'components/Icons/CommitIconOutline';
import { GitHubIconOutline } from 'components/Icons/GitHubIconOutline';
import { PublishIconOutline } from 'components/Icons/PublishIconOutline';
import { EpisodeIconOutline } from 'components/Icons/EpisodeIconOutline';
import { StorageIconOutline } from 'components/Icons/StorageIconOutline';
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

import { useAboutModal } from 'pages/About/AboutModal';

import { server } from 'utils/rpc';
import { useEvent } from 'utils/hooks/useEvent';
import { useLoginCredential } from 'utils/hooks/loginCredential';
import { PIVOT_TAB_OVERRIDES } from 'utils/style/tab';

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
  disabled?: boolean;
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
  disabled,
}) => {
  const [, theme] = useStyletron();
  const navigate = useNavigate();

  const [activeKey, setActiveKey] = useAtom(ACTIVE_KEY);
  const activeKeyIndex =
    tabColors?.findIndex((item) => item.key === activeKey) ?? -1;
  const [, , openAboutModal] = useAboutModal();
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
    void server.splashScreenMode();
    navigate(`/splash-screen`, { replace: true });

    await server.closeDb();
    void server.welcomeMode();
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
          disabled={disabled}
        >
          Release
        </PivotButton>
        <PivotButton
          startEnhancer={<PublishIconOutline width={20} />}
          to="/publish"
          disabled={disabled}
        >
          Publish
        </PivotButton>
        <PivotButton
          startEnhancer={<BundleIconOutline width={20} />}
          to="/bundle"
          disabled={disabled}
        >
          Bundle
        </PivotButton>
        <Separator />
        <PivotButton
          startEnhancer={<SettingsIconOutline width={20} />}
          to="/setting"
          disabled={disabled}
        >
          Settings
        </PivotButton>
        <Separator />
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<CloseIconOutline width={20} />}
          onClick={handleClose}
          disabled={disabled}
        >
          Close
        </Button>
      </Tab>
      <Tab title={<TabTitle>View</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <PivotButton
          startEnhancer={<ResourceManagerIconOutline width={20} />}
          to="/resource"
          disabled={disabled}
        >
          Resource
        </PivotButton>
        <PivotButton
          startEnhancer={<CloudIconOutline width={20} />}
          to="/cloud"
          disabled={disabled}
        >
          Cloud
        </PivotButton>
        <Separator />
        <PivotButton
          startEnhancer={<SeriesIconOutline width={20} />}
          to="/series"
          disabled={disabled}
        >
          Series
        </PivotButton>
        <PivotButton
          startEnhancer={<EpisodeIconOutline width={20} />}
          to="/episode"
          disabled={disabled}
        >
          Episode
        </PivotButton>
        <PivotButton
          startEnhancer={<ActPointIconOutline width={20} />}
          to="/act-point"
          disabled={disabled}
        >
          Act Point
        </PivotButton>
      </Tab>
      <Tab title={<TabTitle>Server</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          disabled={
            resourceServerStatus === ResourceServerStatus.Pending || disabled
          }
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
          disabled={
            resourceServerStatus !== ResourceServerStatus.Running || disabled
          }
          startEnhancer={<PlayerPreviewIconOutline width={20} />}
          to="/preview"
        >
          Preview
        </PivotButton>
      </Tab>
      <Tab title={<TabTitle>Sync</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        {loginCredential?.tokenHash ? (
          <>
            <PivotButton
              startEnhancer={
                <Avatar
                  variant="beam"
                  size={20}
                  name={loginCredential?.sessionId || 'Untitled'}
                />
              }
              to="/user"
              disabled={disabled}
            >
              {loginCredential?.sessionId}
            </PivotButton>
            <PivotButton
              startEnhancer={<PermissionIconOutline width={20} />}
              to="/permission"
              disabled={disabled}
            >
              Permission
            </PivotButton>
            <PivotButton
              startEnhancer={<TokenIconOutline width={20} />}
              to="/token"
              disabled={disabled}
            >
              Token
            </PivotButton>
            <PivotButton
              startEnhancer={<StorageIconOutline width={20} />}
              to="/storage"
              disabled={disabled}
            >
              Storage
            </PivotButton>
          </>
        ) : (
          <PivotButton
            startEnhancer={<MergeDatabaseIconOutline width={20} />}
            to="/login"
            disabled={disabled}
          >
            Login
          </PivotButton>
        )}
      </Tab>
      <Tab title={<TabTitle>Help</TabTitle>} overrides={PIVOT_TAB_OVERRIDES}>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<HelpIconOutline width={20} />}
          disabled={disabled}
        >
          Help
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<GitHubIconOutline width={20} />}
          disabled={disabled}
        >
          Source
        </Button>
        <Button
          kind={BUTTON_KIND.tertiary}
          startEnhancer={<AboutIconOutline width={20} />}
          onClick={openAboutModal}
        >
          About
        </Button>
      </Tab>
      {additionalTabs}
    </Tabs>
  );
};

export const Pivot = React.memo(InternalPivot);
