import * as React from 'react';

import { useAtom } from 'jotai';
import { useNavigate } from 'react-router-dom';
import { useLocalStorage } from 'react-use';

import { FormControl } from 'baseui/form-control';
import { Button } from 'baseui/button';

import { FileInput } from 'components/Input/FileInput';
import { CardHeader } from 'components/Layout/CardHeader';
import { RequiredMark } from 'components/Input/RequiredMark';
import { GuideFormLayout } from 'components/Layout/GuideFormLayout';

import { ImportIcon } from 'components/Icons/ImportIcon';

import { useRecentProjects } from 'utils/hooks/useRecentProjects';
import { server } from 'utils/rpc';

import { WORKSPACE_CONFIGURATION } from 'stores/ProjectDetail';

export const ImportResource: React.FC = () => {
  const navigate = useNavigate();
  const [, setWorkspaceConfiguration] = useAtom(WORKSPACE_CONFIGURATION);
  const { addRecentProject } = useRecentProjects();

  const [mediaWorkspacePath, setMediaWorkspacePath] = useLocalStorage<string[]>(
    'import:last-media-workspace-path',
    []
  );
  const [codeRepositoryPath, setCodeRepositoryPath] = useLocalStorage<string[]>(
    'import:last-code-repository-path',
    []
  );

  const handleSubmit = React.useCallback(async () => {
    if (!mediaWorkspacePath?.[0]) return;

    const result = await server.setupWorkspace(
      mediaWorkspacePath[0],
      codeRepositoryPath?.[0]
    );

    await server.setupDb(result.dbPath);

    addRecentProject(mediaWorkspacePath[0], codeRepositoryPath?.[0]);

    if (!(await server.ifDbLocked())) {
      await server.lockDb();
    }

    setWorkspaceConfiguration(result);
    navigate(`/resource`, { replace: true });
  }, [
    navigate,
    addRecentProject,
    mediaWorkspacePath,
    codeRepositoryPath,
    setWorkspaceConfiguration,
  ]);

  return (
    <GuideFormLayout
      title={<CardHeader>Import Resource Source</CardHeader>}
      footer={
        <>
          <Button
            startEnhancer={<ImportIcon width={20} />}
            onClick={handleSubmit}
          >
            Import
          </Button>
        </>
      }
    >
      <FormControl
        label={
          <>
            Media Workspace Path
            <RequiredMark />
          </>
        }
        caption="All binaries and configuration files will be stored in this directory."
      >
        <FileInput
          directory
          onChange={setMediaWorkspacePath}
          initialValue={mediaWorkspacePath?.[0]}
        />
      </FormControl>

      <FormControl
        label="Code Repository Path"
        caption="The source code of the interaction program will be stored in this directory."
      >
        <FileInput
          directory
          onChange={setCodeRepositoryPath}
          initialValue={codeRepositoryPath?.[0]}
        />
      </FormControl>
    </GuideFormLayout>
  );
};
