import * as React from 'react';
import { styled } from 'baseui';

import type { StyleObject } from 'styletron-react';

import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { useStyletron } from 'styletron-react';
import { useLocalStorage } from 'react-use';

import { LabelLarge } from 'baseui/typography';
import { ButtonGroup } from 'baseui/button-group';
import { StatefulTooltip } from 'baseui/tooltip';
import {
  Button,
  KIND as BUTTON_KIND,
  SIZE as BUTTON_SIZE,
} from 'baseui/button';

import { TitleGroup } from 'components/Layout/TitleGroup';
import { RecativeBlock } from 'components/Block/RecativeBlock';

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
import { useEvent } from 'utils/hooks/useEvent';

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
  overflow: 'clip',
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
  '@media (max-width: 800px)': {
    height: 'initial',
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
  marginLeft: '-14px',

  '@media (max-width: 800px)': {
    maxHeight: 'initial !important',
    marginLeft: '0',
    marginRight: '0',
    overflow: 'clip',
  },
};

const SELECTED_READONLY: number[] = [0];
const NOT_SELECTED_READONLY: number[] = [];

interface IRecentProjectButtonAdditionalProps {
  onClick: (project: IRecentProject) => void;
}

const RecentProjectButton: React.FC<
  IRecentProject & IRecentProjectButtonAdditionalProps & { color: string }
> = ({ onClick, id, label, workspacePath, repositoryPath, color }) => {
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
            paddingLeft: '12px',
            paddingRight: '12px',
            justifyContent: 'flex-start',
          }),
        },
      }}
    >
      <RecativeBlock maxWidth="-webkit-fill-available">
        <RecativeBlock display="flex" alignItems="center" color={color}>
          <SeriesIconOutline width={20} />
          <RecativeBlock marginLeft="8px">{label}</RecativeBlock>
        </RecativeBlock>
        <RecativeBlock className={css(recentProjectDetailStyle)}>
          <RecativeBlock marginBottom="4px">
            <RecativeBlock className={css(detailContentStyle)}>
              <RecativeBlock className={css(detailContentIconStyle)}>
                <ResourceManagerIconOutline width={14} />
              </RecativeBlock>
              <RecativeBlock>{workspacePath}</RecativeBlock>
            </RecativeBlock>
          </RecativeBlock>
          <RecativeBlock>
            <RecativeBlock className={css(detailContentStyle)}>
              <RecativeBlock className={css(detailContentIconStyle)}>
                <ActPointIconOutline width={14} />
              </RecativeBlock>
              <RecativeBlock>{repositoryPath}</RecativeBlock>
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
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
      <RecativeBlock>
        <ButtonTitle>{title}</ButtonTitle>
        <ButtonSubtitle>{subtitle}</ButtonSubtitle>
      </RecativeBlock>
    </Button>
  );
};

const useRecentProjectClickCallback = (
  recentProjects: IRecentProject[],
  readonly: boolean
) => {
  const { recentProjectsClicked } = useRecentProjects();
  const navigate = useNavigate();
  const [, setWorkspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);

  const handleSubmitProject = useEvent(async (project: IRecentProject) => {
    recentProjectsClicked(project.workspacePath, project.repositoryPath);

    const result = await server.setupStudio(
      project.workspacePath,
      project.repositoryPath,
      readonly
    );

    if (!(await server.ifDbLocked())) {
      await server.lockDb();
      await server.migration();
    }

    setWorkspaceConfiguration(result);
    navigate(`/resource`, { replace: true });
  });

  const handleSubmitProjects = React.useMemo(() => {
    const result: Record<string, typeof handleSubmitProject> = {};

    recentProjects.forEach((project) => {
      result[project.id] = () => handleSubmitProject(project);
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
    <RecativeBlock
      width="100vw"
      height="calc(100vh - 30px)"
      display="flex"
      justifyContent="center"
      alignItems="center"
      className={css(mainContainerStyle)}
    >
      <RecativeBlock width="80vw" maxWidth="800px">
        <RecativeBlock marginBottom="24px">
          <TitleGroup title="Recative Studio" />
        </RecativeBlock>
        <RecativeBlock className={css(contentContainerStyle)} display="flex">
          <RecativeBlock className={css(fullWidthStyle)} width="40%">
            <RecativeBlock marginBottom="8px">
              <RecativeBlock
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                marginRight="8px"
              >
                <LabelLarge>Open Recent Contents</LabelLarge>
                <StatefulTooltip content="Readonly mode">
                  {/* @ts-ignore: Incorrect type definition */}
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
                            <RecativeBlock
                              marginRight="-12px"
                              marginBottom="-4px"
                            >
                              {readonly ? (
                                <LockIconOutline width={16} />
                              ) : (
                                <UnlockIconOutline width={16} />
                              )}
                            </RecativeBlock>
                          );
                        }) as unknown as React.ReactNode
                      }
                    />
                  </ButtonGroup>
                </StatefulTooltip>
              </RecativeBlock>
            </RecativeBlock>
            <RecativeBlock
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
            </RecativeBlock>
          </RecativeBlock>
          <RecativeBlock className={css(fullWidthStyle)} width="60%">
            <LabelLarge>Getting Started</LabelLarge>
            <RecativeBlock>
              <NavigationButton
                title="Download Resource Source"
                subtitle="Download an existing resource source from a remote server and continue your work"
                Icon={DownloadIcon}
                onClick={() => navigate('/recover', { replace: true })}
              />
            </RecativeBlock>
            <RecativeBlock>
              <NavigationButton
                title="Import Resource Source"
                subtitle="Continue the previous content creation work by importing a resource source that already exists"
                Icon={ImportIcon}
                onClick={() => navigate('/import', { replace: true })}
              />
            </RecativeBlock>
            <RecativeBlock>
              <NavigationButton
                title="New Resource Source"
                subtitle="We will usually need to create a new resource source when creating a new show series"
                Icon={NewIcon}
                onClick={() => navigate('/new', { replace: true })}
              />
            </RecativeBlock>
          </RecativeBlock>
        </RecativeBlock>
      </RecativeBlock>
    </RecativeBlock>
  );
};
