import CrowdinApi from '@crowdin/crowdin-api-client';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  TerminalMessageLevel,
} from '@recative/extension-sdk';

export interface ICrowdinSyncScriptletConfig {
  personalAccessToken: string;
  projectName: string;
}

export class CrowdinSyncScriptlet extends Scriptlet<
  keyof ICrowdinSyncScriptletConfig
> {
  static id = '@recative/extension-crowdin/CrowdinSyncScriptlet';

  static label = 'Crowdin';

  static extensionConfigUiFields = [
    {
      id: 'personalAccessToken',
      type: 'string',
      label: 'API Key',
    },
    {
      id: 'projectName',
      type: 'string',
      label: 'Project Name',
    },
  ] as const;

  static readonly scripts = [
    {
      id: 'syncCrowdinConfig',
      label: 'Sync Crowdin Files',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
  ];

  syncCrowdinConfig = async () => {
    console.log(this.config);
    const { projectsGroupsApi, sourceFilesApi, translationsApi } =
      new CrowdinApi({
        token: this.config.personalAccessToken,
      });

    const projects = await projectsGroupsApi.withFetchAll().listProjects();

    const project = projects.data.find(
      (x) => x.data.identifier === this.config.projectName
    );

    this.dependency.logToTerminal(
      ':: Project Not found',
      TerminalMessageLevel.Error
    );

    if (!project) {
      return {
        ok: false,
        message: 'Project not found',
      };
    }

    const projectFiles = sourceFilesApi
      .withFetchAll()
      .listProjectFiles(project.data.id);

    console.log(projectFiles);

    return {
      ok: true,
      message: 'Resource marked',
    };
  };
}
