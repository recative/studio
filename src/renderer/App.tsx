import * as React from 'react';

import { useStyletron } from 'baseui';

import { RecativeBlock } from 'components/Block/RecativeBlock';
// @ts-ignore: We just don't have a type definition for this yet
import { TitleBar } from 'react-desktop/windows';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';

import { server } from 'utils/rpc';
import { useDatabaseLockChecker } from 'utils/hooks/useDatabaseLockChecker';

import { User } from './pages/User/User';
import { Token } from './pages/User/Token';
import { Login } from './pages/User/Login';
import { Cloud } from './pages/Cloud/Cloud';
import { Series } from './pages/Series/Series';
import { Bundle } from './pages/Bundle/Bundle';
import { Deploy } from './pages/Deploy/Deploy';
import { Storage } from './pages/User/Storage';
import { Welcome } from './pages/Welcome/Welcome';
import { Publish } from './pages/Publish/Publish';
import { Episode } from './pages/Episode/Episode';
import { Release } from './pages/Release/Release';
import { Setting } from './pages/Setting/Setting';
import { Preview } from './pages/Preview/Preview';
import { Recover } from './pages/Recover/Recover';
import { Resource } from './pages/Resource/Resource';
import { ActPoint } from './pages/ActPoint/ActPoint';
import { AutoEditor } from './pages/Auto/AutoEditor';
import { Recovering } from './pages/User/Recovering';
import { Permission } from './pages/User/Permission';
import { AboutModal } from './pages/About/AboutModal';
import { NewResource } from './pages/Welcome/NewResource';
import { SplashScreen } from './pages/SplashScreen/SplashScreen';
import { PreviewPlayer } from './pages/Preview/PreviewPlayer';
import { ImportResource } from './pages/Welcome/ImportResource';
import { InitializeErrorModal } from './pages/Server/components/InitializeErrorModal';

import { TerminalModal } from './components/Terminal/TerminalModal';
import { ResourceSearchModal } from './components/ResourceSearchModal/ResourceSearchModal';

import { useEvent } from './utils/hooks/useEvent';

import './App.global.css';
import './resources/fonts/raleway/raleway.css';
import './resources/fonts/redHatMono/redHatMono.css';
import './resources/fonts/notoColorEmoji/notoColorEmoji.css';

const dragAreaStyles = {
  top: 0,
  left: 0,
  width: 'calc(100vw - 240px)',
  height: '32px',
  position: 'fixed',
  WebkitAppRegion: 'drag',
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const titleBarStyles = {
  zIndex: 1,
};

const ScrollbarStyles: React.FC = () => {
  const [, theme] = useStyletron();
  return (
    <style>{`
    /* Works on Chrome, Edge, and Safari */
    *::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    *::-webkit-scrollbar-track {
      background: ${theme.colors.backgroundPrimary};
    }

    *::-webkit-scrollbar-thumb {
      border: solid ${theme.colors.backgroundPrimary};
      border-width: 0 2px 0 2px;
      background-color: ${theme.colors.contentTertiary};
      transition: background-color ${theme.animation.timing300};
    }

    *::-webkit-scrollbar-thumb:hover {
      background-color: ${theme.colors.contentPrimary};
    }
    `}</style>
  );
};

export const InternalStudioTitleBar = React.memo(() => {
  const navigate = useNavigate();
  const [css] = useStyletron();
  const [windowIsMaximized, setWindowIsMaximized] = React.useState(false);

  const handleMaximizeClick = useEvent(async () => {
    await server.maximizeMainWindow();
    setWindowIsMaximized(true);
  });

  const handleUnMaximizeClick = useEvent(async () => {
    await server.unmaximizeMainWindow();
    setWindowIsMaximized(false);
  });

  const handleCloseWindow = useEvent(async () => {
    void server.splashScreenMode();
    navigate(`/splash-screen`, { replace: true });
    await server.cleanupDb();
    await server.closeMainWindow();
  });

  const handleMinimize = useEvent(() => {
    return server.minimizeMainWindow();
  });

  return (
    <RecativeBlock
      className={css(titleBarStyles)}
      top="0"
      left="0"
      width="100vw"
      position="fixed"
      zIndex={3}
    >
      <TitleBar
        className="app-title-bar"
        controls
        title="Recative Studio"
        isMaximized={windowIsMaximized}
        onCloseClick={handleCloseWindow}
        onMaximizeClick={handleMaximizeClick}
        onMinimizeClick={handleMinimize}
        onRestoreDownClick={handleUnMaximizeClick}
      />
    </RecativeBlock>
  );
});

export const StudioTitleBar = React.memo(InternalStudioTitleBar);

export const App = () => {
  const location = useLocation();
  const [css] = useStyletron();
  useDatabaseLockChecker();

  return (
    <RecativeBlock>
      <RecativeBlock id="titleBar">
        <RecativeBlock width="100vw" height="30px" />
        {location.hash !== '#/preview-player' && <StudioTitleBar />}
        <div className={css(dragAreaStyles)} />
      </RecativeBlock>
      <Routes>
        <Route path="/" element={<Welcome />} />
        <Route path="user" element={<User />} />
        <Route path="cloud" element={<Cloud />} />
        <Route path="login" element={<Login />} />
        <Route path="token" element={<Token />} />
        <Route path="bundle" element={<Bundle />} />
        <Route path="series" element={<Series />} />
        <Route path="new" element={<NewResource />} />
        <Route path="deploy" element={<Deploy />} />
        <Route path="welcome" element={<Welcome />} />
        <Route path="publish" element={<Publish />} />
        <Route path="setting" element={<Setting />} />
        <Route path="episode" element={<Episode />} />
        <Route path="release" element={<Release />} />
        <Route path="preview" element={<Preview />} />
        <Route path="storage" element={<Storage />} />
        <Route path="recover" element={<Recover />} />
        <Route path="resource" element={<Resource />} />
        <Route path="act-point" element={<ActPoint />} />
        <Route path="import" element={<ImportResource />} />
        <Route path="permission" element={<Permission />} />
        <Route path="auto-editor" element={<AutoEditor />} />
        <Route path="splash-screen" element={<SplashScreen />} />
        <Route path="preview-player" element={<PreviewPlayer />} />
        <Route path="downloading-backup" element={<Recovering />} />
      </Routes>
      <AboutModal />
      <TerminalModal />
      <ScrollbarStyles />
      <ResourceSearchModal />
      <InitializeErrorModal />
    </RecativeBlock>
  );
};
