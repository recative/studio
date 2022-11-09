import CrowdinApi from '@crowdin/crowdin-api-client';

import type StreamZip from 'node-stream-zip';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  ResourceFileForImport,
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
        this.dependency.logToTerminal(
          ':: Project Not found',
          TerminalMessageLevel.Error
        );

        return {
          ok: false,
          message: 'Project not found',
        };
      }

      const projectId = project.data.id;

      this.dependency.logToTerminal(`:: Project ID: ${projectId}`);

      const projectFileMetadata = await sourceFilesApi
        .withFetchAll()
        .listProjectFiles(projectId);

      const fileIds = projectFileMetadata.data.map((x) => x.data.id);

      this.dependency.logToTerminal(`:: Project Files:`);

      projectFileMetadata.data.forEach((x) => {
        this.dependency.logToTerminal(`:: :: ${x.data.name} (${x.data.id})`);
      });

      this.dependency.logToTerminal(`:: Downloading:`);

      await Promise.all(
        this.config.targetLanguageIds
          .split(';')
          .map((x) => x.trim())
          .map(async (language) => {
            const translationUrl =
              await translationsApi.exportProjectTranslation(projectId, {
                fileIds,
                targetLanguageId: languageIdMap[language] ?? language,
              });

            this.dependency.logToTerminal(
              `:: :: [${language}]: ${translationUrl.data.url}`
            );

            console.log(translationUrl.data.url);

            const translationPath = await this.dependency.downloadFile(
              translationUrl.data.url
            );

            const translationZip = this.dependency.readZip(translationPath);
            const entries = translationZip.entries();

            const metadata = (
              await Promise.allSettled(
                Object.entries(entries)
                  .filter(([, entry]) => entry.isFile)
                  .map(async ([key, entry]) => {
                    const hash = await this.dependency.getXxHashOfBuffer(
                      translationZip.entryDataSync(key)
                    );

                    const resourceId = `@@CROWDIN${key}`;

                    return { id: resourceId, key, entry, hash };
                  })
              )
            )
              .map(
                (x) => (x.status === 'fulfilled' ? x.value : null) as IMetadata
              )
              .filter(Boolean);

            const existedRecords = this.dependency.db.resource.resources.find({
              id: {
                $in: metadata.map((x) => x.id),
              },
            });

            const existedRecordIds = new Set(existedRecords.map((x) => x.id));
            const existedFiles = metadata.filter((x) =>
              existedRecordIds.has(x.id)
            );

            const notExistedFiles = metadata.filter(
              (x) => !existedRecordIds.has(x.id)
            );

            for (let i = 0; i < notExistedFiles.length; i += 1) {
              const { id, key } = notExistedFiles[i];

              const definition = new ResourceFileForImport();

              definition.dangerouslyUpdateFileId(id);
              definition.definition.label = id;

              const buffer = translationZip.entryDataSync(key);
              definition.addFile(buffer);

              const finalResource = await definition.finalize();

              await this.dependency.updatePostProcessedFileDefinition(
                finalResource
              );
              await this.dependency.writeBufferToResource(
                buffer,
                finalResource
              );
            }

            for (let i = 0; i < existedFiles.length; i += 1) {
              const { id, key, hash } = existedFiles[i];
              const resource = existedRecords.find((x) => x.id === id);

              if (!resource) {
                throw new Error(`Record not existed, this is a bug`);
              }

              if (resource.type === 'group') {
                throw new Error(`Record not existed, this is a bug`);
              }

              if (resource.originalHash === hash) {
                continue;
              }

              const buffer = translationZip.entryDataSync(key);
              this.dependency.writeBufferToResource(buffer, resource);
            }
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
