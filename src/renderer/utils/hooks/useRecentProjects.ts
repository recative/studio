import * as React from 'react';

import { h32 } from 'xxhashjs';
import { useLocalStorageValue } from '@react-hookz/web';

import { useEvent } from './useEvent';

const COLORS = [
  '#B71C1C',
  '#880E4F',
  '#4A148C',
  '#311B92',
  '#1A237E',
  '#0D47A1',
  '#01579B',
  '#006064',
  '#004D40',
  '#1B5E20',
  '#33691E',
  '#827717',
  '#F57F17',
  '#FF6F00',
  '#E65100',
  '#E65100',
  '#3E2723',
  '#212121',
  '#263238',
];

export interface IRecentProject {
  id: string;
  label: string;
  workspacePath: string;
  repositoryPath?: string;
  lastOpenedTime?: number;
}

interface AddRecentProject {
  (project: IRecentProject): void;
  (workspacePath: string, repositoryPath?: string): void;
}

export const useRecentProjects = () => {
  const [rawRecentProjects, setRawRecentProjects] = useLocalStorageValue<
    Record<string, IRecentProject>
  >('recentProjects', {});

  const createRecentProject = useEvent(
    (workspacePath: string, repositoryPath?: string) => {
      const id = h32(workspacePath + repositoryPath, 0x1bf52).toString(16);

      return {
        id,
        label: id,
        workspacePath,
        repositoryPath,
      };
    }
  );

  const addRecentProject: AddRecentProject = useEvent(
    (arg0: string | IRecentProject, arg1?: string) => {
      if (typeof arg0 === 'string') {
        const project = createRecentProject(arg0, arg1);

        setRawRecentProjects({
          ...rawRecentProjects,
          [project.id]: project,
        });
      } else if (typeof arg0 !== 'string') {
        setRawRecentProjects({
          ...rawRecentProjects,
          [arg0.id]: arg0,
        });
      }
    }
  );

  const removeRecentProject = useEvent((projectId: string) => {
    const newRecentProjects = { ...rawRecentProjects };
    delete newRecentProjects[projectId];
    setRawRecentProjects(newRecentProjects);
  });

  const recentProjectsClicked = useEvent(
    (workspacePath: string, repositoryPath?: string) => {
      const id = h32(workspacePath + repositoryPath, 0x1bf52).toString(16);

      if (!rawRecentProjects[id]) return;

      setRawRecentProjects((x) => {
        x[id].lastOpenedTime = Date.now();

        return x;
      });
    }
  );

  const recentProjects = React.useMemo(() => {
    return Object.values(rawRecentProjects)
      .sort((a, b) => {
        return (b.lastOpenedTime ?? 0) - (a.lastOpenedTime ?? 0);
      })
      .map((x) => {
        const id = Number.parseInt(x.id, 16);
        return {
          ...x,
          color: COLORS[id % COLORS.length],
        };
      });
  }, [rawRecentProjects]);

  return {
    recentProjects,
    addRecentProject,
    removeRecentProject,
    createRecentProject,
    recentProjectsClicked,
  };
};
