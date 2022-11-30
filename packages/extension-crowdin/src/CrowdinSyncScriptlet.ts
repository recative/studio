import CrowdinApi from '@crowdin/crowdin-api-client';

import type StreamZip from 'node-stream-zip';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  TerminalMessageLevel,
} from '@recative/extension-sdk';
import { IResourceGroup } from '@recative/definitions';

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

      const crowdinFiles = projectFileMetadata.data;

      for (let h = 0; h < crowdinFiles.length; h += 1) {
        const file = crowdinFiles[h];

        const fileId = file.data.id;
        const fileName = file.data.name;
        const groupId = `@Crowdin/${project.data.name}/${file.data.name}`;

        const existedResourceGroup = d.db.resource.resources.findOne({
          id: groupId,
        });

        if (!existedResourceGroup) {
          const newGroup: IResourceGroup = {
            type: 'group',
            id: groupId,
            label: groupId,
            thumbnailSrc: '',
            tags: [],
            importTime: Date.now(),
            files: [],
            removed: false,
            removedTime: -1,
          };

          d.db.resource.resources.insert(newGroup);
          d.logToTerminal(`:: Group "${groupId}" created`);
        } else {
          if (existedResourceGroup.type !== 'group') {
            throw new TypeError(`Resource is not a group, this is a bug!`);
          }
          d.logToTerminal(`:: Group "${groupId}" existed`);
        }

        const languages = this.config.targetLanguageIds
          .split(';')
          .map((x) => x.trim());

        for (let i = 0; i < languages.length; i += 1) {
          const language = languages[i];

          const translationUrl = await translationsApi.exportProjectTranslation(
            projectId,
            {
              fileIds: [fileId],
              targetLanguageId: languageIdMap[language] ?? language,
            }
          );

          d.logToTerminal(`:: :: [${language}]: ${translationUrl.data.url}`);

          const filePath = await d.downloadFile(translationUrl.data.url);
          const fileHash = await d.getXxHashOfFile(filePath);

          const crowdinId = `@@CROWDIN/${this.config.projectName}/${fileId}/${language}`;

          const resource = d.db.resource.resources.findOne({
            removed: false,
            [`extensionConfigurations.${CrowdinSyncScriptlet.id}~~crowdinId`]:
              crowdinId,
          });

          const nextResourceIds: string[] = [];

          if (resource) {
            if (resource.type === 'group') {
              throw new Error(`Record is a group, this is a bug`);
            }

            d.logToTerminal(
              `:: :: :: Found existed record ${resource.label} (${resource.id})`
            );

            if (resource.originalHash === fileHash) {
              d.logToTerminal(`:: :: :: File not modified, skip`);

              nextResourceIds.push(resource.id);
            } else {
              const nextResource = await d.importFile(
                filePath,
                resource ? resource.id : undefined
              );

              d.logToTerminal(
                `:: :: :: File replaced ${nextResource
                  .map((x) => x.id)
                  .join(', ')}`
              );

              nextResourceIds.push(...nextResource.map((x) => x.id));
            }
          } else {
            const nextResource = await d.importFile(filePath);

            d.logToTerminal(
              `:: :: :: File imported ${nextResource
                .map((x) => x.id)
                .join(', ')}`
            );

            nextResourceIds.push(...nextResource.map((x) => x.id));
          }

          d.logToTerminal(
            `:: :: :: Updating file ids: ${nextResourceIds.join(', ')}`
          );

          d.db.resource.resources.findAndUpdate({ id: groupId }, (x) => {
            if (x.type !== 'group') {
              throw new TypeError(`Resource is not a group, this is a bug`);
            }

            d.logToTerminal(`:: :: :: ID Changes:`);
            d.logToTerminal(`:: :: :: :: From: ${x.files.join(', ')}`);
            const nextFiles = [...new Set([...x.files, ...nextResourceIds])];

            x.files = nextFiles;
            d.logToTerminal(`:: :: :: :: To: ${nextFiles.join(', ')}`);

            return x;
          });

          d.db.resource.resources.findAndUpdate(
            {
              id: { $in: nextResourceIds },
            },
            (x) => {
              const tagSet = new Set(x.tags);
              tagSet.add(`lang:${language}`);

              x.tags = [...tagSet];
              x.label = `@Crowdin/${fileName}/${language}`;
              if (x.type === 'file') {
                x.extensionConfigurations[
                  `${CrowdinSyncScriptlet.id}~~crowdinId`
                ] = crowdinId;

                x.resourceGroupId = groupId;
              }

              return x;
            }
          );
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorCode = error instanceof Error ? error.name : String(error);

      // eslint-disable-next-line no-console
      console.error(error);

      d.logToTerminal(
        `:: Error(${errorCode}): ${errorMessage}`,
        TerminalMessageLevel.Error
      );
      return {
        ok: false,
        message: errorMessage,
      };
    }

    return {
      ok: true,
      message: 'Imported',
    };
  };
}
