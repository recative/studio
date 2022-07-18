import * as React from 'react';
import { styled } from 'baseui';

import type { StyleObject } from 'styletron-react';

import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { useToggle, useLocalStorage } from 'react-use';

import { Block } from 'baseui/block';
import { LabelLarge } from 'baseui/typography';
import { ButtonGroup } from 'baseui/button-group';
import { StatefulTooltip } from 'baseui/tooltip';
import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';

import { TitleGroup } from 'components/Layout/TitleGroup';

import { NewIcon } from 'components/Icons/NewIcon';
import { ImportIcon } from 'components/Icons/ImportIcon';
import { DownloadIcon } from 'components/Icons/DownloadIcon';
import { LockIconOutline } from 'components/Icons/LockIconOutline';
import { SeriesIconOutline } from 'components/Icons/SeriesIconOutline';
import { UnlockIconOutline } from 'components/Icons/UnlockIconOutline';
import { ActPointIconOutline } from 'components/Icons/ActPointIconOutline';
import { ResourceManagerIconOutline } from 'components/Icons/ResourceManagerIconOutline';

import { server } from 'utils/rpc';
import { useRecentProjects } from 'utils/hooks/useRecentProjects';
import type { IRecentProject } from 'utils/hooks/useRecentProjects';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

const navigationButtonIconStyle: StyleObject = {
  marginRight: '8px',
};

const ButtonTitle = styled('div', {
  marginBottom: '8px',
  fontSize: '18px',
  textAlign: 'left',
});

const ButtonSubtitle = styled('div', {
  fontSize: '14px',
  textAlign: 'left',
});

interface INavigationButton {
  title: string;
  subtitle: string;
  disabled?: boolean;
  Icon: React.FC<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
}

const recentProjectDetailStyle: StyleObject = {
  marginTop: '8px',
  fontSize: '0.8em',
  lineHeight: '1.5em',
};

const detailContentIconStyle: StyleObject = {
  top: '2px',
  marginLeft: '6px',
  marginRight: '8px',
  position: 'relative',
};

const detailContentStyle: StyleObject = {
  fontFamily: 'Red Hat Mono',
  fontWeight: 400,
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  display: 'flex',
  alignItems: 'center',
};

const contentContainerStyle: StyleObject = {
  flexDirection: 'row',

  '@media (max-width: 800px)': {
    flexDirection: 'column-reverse',
  },
};

const mainContainerStyle: StyleObject = {
  alignItems: 'center',

  '@media (max-width: 800px)': {
    paddingTop: '120px',
    alignItems: 'flex-start',
  },
};

const fullWidthStyle: StyleObject = {
  '@media (max-width: 800px)': {
    width: '100% !important',
    marginBottom: '32px',
  },
};

const recentProjectStyle: StyleObject = {
  '@media (max-width: 800px)': {
    overflow: 'hidden',
    maxHeight: 'initial !important',
    marginRight: '0',
  },
};

const SELECTED_READONLY: number[] = [0];
const NOT_SELECTED_READONLY: number[] = [];

interface IRecentProjectButtonAdditionalProps {
  onClick: (project: IRecentProject) => void;
}

const RecentProjectButton: React.VFC<
  IRecentProject & IRecentProjectButtonAdditionalProps
> = ({ onClick, id, label, workspacePath, repositoryPath }) => {
  const [css] = useStyletron();

  const project = React.useMemo(
    () => ({
      id,
      label,
      workspacePath,
      repositoryPath,
    }),
    [id, label, workspacePath, repositoryPath]
  );

  const handleButtonClick = React.useCallback(() => {
    onClick(project);
  }, [onClick, project]);

  return (
    <Button
      kind={BUTTON_KIND.tertiary}
      onClick={handleButtonClick}
      overrides={{
        BaseButton: {
          style: () => ({
            width: '-webkit-fill-available',
            textAlign: 'left',
            marginRight: '2px',
            marginBottom: '8px',
            marginLeft: '-14px',
            justifyContent: 'flex-start',
          }),
        },
      }}
    >
      <Block maxWidth="-webkit-fill-available">
        <Block display="flex" alignItems="center">
          <SeriesIconOutline width={20} />
          <Block marginLeft="8px">{label}</Block>
        </Block>
        <Block className={css(recentProjectDetailStyle)}>
          <Block marginBottom="4px">
            <Block className={css(detailContentStyle)}>
              <Block className={css(detailContentIconStyle)}>
                <ResourceManagerIconOutline width={14} />
              </Block>
              <Block>{workspacePath}</Block>
            </Block>
          </Block>
          <Block>
            <Block className={css(detailContentStyle)}>
              <Block className={css(detailContentIconStyle)}>
                <ActPointIconOutline width={14} />
              </Block>
              <Block>{repositoryPath}</Block>
            </Block>
          </Block>
        </Block>
      </Block>
    </Button>
  );
};

const NAVIGATION_BUTTON_OVERRIDES = {
  BaseButton: {
    style: () => ({
      marginTop: '8px',
      marginBottom: '8px',
    }),
  },
};

const NavigationButton: React.FC<INavigationButton> = ({
  title,
  subtitle,
  disabled,
  Icon,
  onClick,
}) => {
  const [css] = useStyletron();

  return (
    <Button
      kind={BUTTON_KIND.secondary}
      startEnhancer={
        <Icon className={css(navigationButtonIconStyle)} width={32} />
      }
      disabled={disabled}
      onClick={onClick}
      overrides={NAVIGATION_BUTTON_OVERRIDES}
    >
      <Block>
        <ButtonTitle>{title}</ButtonTitle>
        <ButtonSubtitle>{subtitle}</ButtonSubtitle>
      </Block>
    </Button>
  );
};

const useRecentProjectClickCallback = (
  recentProjects: Record<string, IRecentProject>,
  readonly: boolean
) => {
  const navigate = useNavigate();
  const [, setWorkspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleSubmitProject = React.useCallback(
    async (project: IRecentProject) => {
      const result = await server.setupWorkspace(
        project.workspacePath,
        project.repositoryPath,
        readonly
      );

      await server.setupDb(result.dbPath);
      if (!(await server.ifDbLocked())) {
        await server.lockDb();
      }

      setWorkspaceConfiguration(result);
      navigate(`/resource`, { replace: true });
    },
    [navigate, setWorkspaceConfiguration, readonly]
  );

  const handleSubmitProjects = React.useMemo(() => {
    const result: Record<string, typeof handleSubmitProject> = {};

    Object.entries(recentProjects).forEach(([id, project]) => {
      result[id] = () => handleSubmitProject(project);
    });

    return result;
  }, [handleSubmitProject, recentProjects]);

  return handleSubmitProjects;
};

export const Welcome: React.FC = () => {
  const [css] = useStyletron();
  const navigate = useNavigate();
  const [readonly, setReadonly] = useLocalStorage(
    '@recative/ap-studio/ro',
    false
  );

  const toggleReadonly = React.useCallback(() => {
    setReadonly(!readonly);
  }, [setReadonly, readonly]);

  const { recentProjects } = useRecentProjects();
  const handleRecentProjectClick = useRecentProjectClickCallback(
    recentProjects,
    !!readonly
  );

  return (
    <Block
      width="100vw"
      height="calc(100vh - 30px)"
      display="flex"
      justifyContent="center"
      className={css(mainContainerStyle)}
    >
      <Block width="80vw" maxWidth="800px">
        <Block marginBottom="24px">
          <TitleGroup title="Resource Manager" />
        </Block>
        <Block className={css(contentContainerStyle)} display="flex">
          <Block className={css(fullWidthStyle)} width="40%">
            <Block marginBottom="8px">
              <Block
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginRight="8px"
              >
                <LabelLarge>Open Recent Contents</LabelLarge>
                <StatefulTooltip content="Readonly mode">
                  <ButtonGroup
                    mode="checkbox"
                    selected={
                      readonly ? SELECTED_READONLY : NOT_SELECTED_READONLY
                    }
                    onClick={toggleReadonly}
                    kind={BUTTON_KIND.tertiary}
                    size={BUTTON_SIZE.mini}
                  >
                    <Button
                      startEnhancer={
                        (() => {
                          return (
                            <Block marginRight="-12px" marginBottom="-4px">
                              {readonly ? (
                                <LockIconOutline width={16} />
                              ) : (
                                <UnlockIconOutline width={16} />
                              )}
                            </Block>
                          );
                        }) as unknown as React.ReactNode
                      }
                    />
                  </ButtonGroup>
                </StatefulTooltip>
              </Block>
            </Block>
            <Block
              maxHeight="320px"
              overflow="auto"
              marginRight="14px"
              className={css(recentProjectStyle)}
            >
              {Object.values(recentProjects).map((project) => (
                <RecentProjectButton
                  key={project.id}
                  {...project}
                  onClick={handleRecentProjectClick[project.id]}
                />
              ))}
            </Block>
          </Block>
          <Block className={css(fullWidthStyle)} width="60%">
            <LabelLarge>Getting Started</LabelLarge>
            <Block>
              <NavigationButton
                disabled
                title="Download Resource Source"
                subtitle="Download an existing resource source from a remote server and continue your work"
                Icon={DownloadIcon}
                onClick={() => navigate('/', { replace: true })}
              />
            </Block>
            <Block>
              <NavigationButton
                title="Import Resource Source"
                subtitle="Continue the previous content creation work by importing a resource source that already exists"
                Icon={ImportIcon}
                onClick={() => navigate('/import', { replace: true })}
              />
            </Block>
            <Block>
              <NavigationButton
                title="New Resource Source"
                subtitle="We will usually need to create a new resource source when creating a new show series"
                Icon={NewIcon}
                onClick={() => navigate('/new', { replace: true })}
              />
            </Block>
          </Block>
        </Block>
      </Block>
    </Block>
  );
};
