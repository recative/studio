import CrowdinApi from '@crowdin/crowdin-api-client';

import type StreamZip from 'node-stream-zip';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  TerminalMessageLevel,
} from '@recative/extension-sdk';

export interface ICrowdinSyncScriptletConfig {
  personalAccessToken: string;
  projectName: string;
  targetLanguageIds: string;
}

export interface IMetadata {
  id: string;
  key: string;
  entry: StreamZip.ZipEntry;
  hash: string;
}

const languageIdMap: Record<string, string> = {
  'zh-Hans': 'zh-CN',
};

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
    {
      id: 'targetLanguageIds',
      type: 'string',
      label: 'Languages (splited with ";")',
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
    const d = this.dependency;

    const { projectsGroupsApi, sourceFilesApi, translationsApi } =
      new CrowdinApi({
        token: this.config.personalAccessToken,
      });

    try {
      const projects = await projectsGroupsApi.withFetchAll().listProjects();

      const project = projects.data.find(
        (x) => x.data.identifier === this.config.projectName
      );

      if (!project) {
        d.logToTerminal(':: Project Not found', TerminalMessageLevel.Error);

        return {
          ok: false,
          message: 'Project not found',
        };
      }

      const projectId = project.data.id;

      d.logToTerminal(`:: Project ID: ${projectId}`);

      const projectFileMetadata = await sourceFilesApi
        .withFetchAll()
        .listProjectFiles(projectId);

      d.logToTerminal(`:: Project Files:`);

      projectFileMetadata.data.forEach((x) => {
        d.logToTerminal(`:: :: ${x.data.name} (${x.data.id})`);
      });

      d.logToTerminal(`:: Downloading:`);

      await Promise.all(
        this.config.targetLanguageIds
          .split(';')
          .map((x) => x.trim())
          .flatMap((language) => {
            return projectFileMetadata.data.map(async (file) => {
              const fileId = file.data.id;
              const fileName = file.data.name;

              const translationUrl =
                await translationsApi.exportProjectTranslation(projectId, {
                  fileIds: [fileId],
                  targetLanguageId: languageIdMap[language] ?? language,
                });

              d.logToTerminal(
                `:: :: [${language}]: ${translationUrl.data.url}`
              );

              const filePath = await d.downloadFile(translationUrl.data.url);
              const fileHash = await d.getXxHashOfFile(filePath);

              const crowdinId = `@@CROWDIN/${this.config.projectName}/${fileId}`;

              const resource = d.db.resource.resources.findOne({
                [`extensionConfigurations.${CrowdinSyncScriptlet.id}~~crowdinId`]:
                  crowdinId,
              });

              if (resource) {
                if (resource.type === 'group') {
                  throw new Error(`Record not existed, this is a bug`);
                }

                if (resource.originalHash === fileHash) return;
              }

              const nextResource = await d.importFile(
                filePath,
                resource ? resource.id : undefined
              );

              nextResource.forEach((x) => {
                const tagSet = new Set(x.tags);
                tagSet.add(`lang:${language}`);
                x.tags = [...tagSet];
                x.label = `@Crowdin/${fileName}/${language}`;
              });

              d.db.resource.resources.update(nextResource);
            });
          })
      );
    } catch (error) {
      console.error(error);
    }

    return {
      ok: true,
      message: 'Imported',
    };
  };
}
