import * as React from 'react';

import { h32 } from 'xxhashjs';

import { useLocalStorageValue } from '@react-hookz/web';

export interface IRecentProject {
  id: string;
  label: string;
  workspacePath: string;
  repositoryPath?: string;
}

interface AddRecentProject {
  (project: IRecentProject): void;
  (workspacePath: string, repositoryPath?: string): void;
}

export const useRecentProjects = () => {
  const [recentProjects, setRecentProjects] = useLocalStorageValue<
    Record<string, IRecentProject>
  >('recentProjects', {});

  const createRecentProject = React.useCallback(
    (workspacePath: string, repositoryPath?: string) => {
      const id = h32(workspacePath + repositoryPath, 0x1bf52).toString(16);

      return {
        id,
        label: id,
        workspacePath,
        repositoryPath,
      };
    },
    []
  );

  const addRecentProject: AddRecentProject = React.useCallback(
    (arg0: string | IRecentProject, arg1?: string) => {
      if (typeof arg0 === 'string') {
        const project = createRecentProject(arg0, arg1);

        setRecentProjects({
          ...recentProjects,
          [project.id]: project,
        });
      } else if (typeof arg0 !== 'string') {
        setRecentProjects({
          ...recentProjects,
          [arg0.id]: arg0,
        });
      }
    },
    [createRecentProject, recentProjects, setRecentProjects]
  );

  const removeRecentProject = React.useCallback(
    (projectId: string) => {
      const newRecentProjects = { ...recentProjects };
      delete newRecentProjects[projectId];
      setRecentProjects(newRecentProjects);
    },
    [recentProjects, setRecentProjects]
  );

  return {
    recentProjects,
    addRecentProject,
    removeRecentProject,
    createRecentProject,
  };
};
