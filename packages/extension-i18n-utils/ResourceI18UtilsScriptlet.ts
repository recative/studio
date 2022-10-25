import { join } from 'path';
import { readdir } from 'fs/promises';

import { extension } from 'mime-types';
import { ensureDir, copy, writeJSON, readJSON, pathExistsSync } from 'fs-extra';

import { IResourceFile, IResourceGroup } from '@recative/definitions';
import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  TerminalMessageLevel,
  ResourceGroupForImport,
} from '@recative/extension-sdk';

const REFERENCE_FILE_NAME = 'reference.json';

export interface IResourceI18UtilsScriptletConfig {
  baseLanguage: string;
  workingLanguage: string;
  i18nMediaWorkspacePath: string;
}

export interface IResourceFileReference {
  id: string;
  fileName: string;
  groupId: string;
  signature: string;
  originalHash: string;
  resource: IResourceFile | undefined;
}

export class ResourceI18UtilsScriptlet extends Scriptlet<
  keyof IResourceI18UtilsScriptletConfig
> {
  static id = '@recative/extension-i18n-utils/ResourceI18UtilsScriptlet';

  static label = 'I18N Utils';

  static extensionConfigUiFields = [
    {
      id: 'baseLanguage',
      type: 'string',
      label: 'Base Language',
    },
    {
      id: 'workingLanguage',
      type: 'string',
      label: 'Working Language',
    },
    {
      id: 'i18nMediaWorkspacePath',
      type: 'string',
      label: 'I18n Workspace Path',
    },
  ] as const;

  static readonly scripts = [
    {
      id: 'scriptWrapResourceToGroup',
      label: 'Wrap Resource to Group',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Background,
      confirmBeforeExecute: false,
    },
    {
      id: 'scriptCreateI18NWorkspace',
      label: 'Create i18n workspace',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
    {
      id: 'scriptSyncI18NWorkspace',
      label: 'Sync i18n workspace',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
  ];

  scriptWrapResourceToGroup = async (selectedResources: string[]) => {
    const resources = this.dependency.db.resource.resources
      .find({
        id: {
          $in: selectedResources,
        },
        removed: false,
      })
      .filter((x) => x.type === 'file' && !x.resourceGroupId);

    if (!resources.length) {
      return {
        ok: false,
        message: 'No convertible resource found',
      };
    }

    for (let i = 0; i < resources.length; i += 1) {
      const resource = resources[i];

      const newGroup = new ResourceGroupForImport();

      newGroup.definition.files.push(resource.id);
      newGroup.definition.label = resource.label;
      newGroup.definition.thumbnailSrc = resource.thumbnailSrc;

      resource.label = `${resource.label}.${this.config.baseLanguage}`;
      resource.tags = [
        ...new Set(
          [...resource.tags, `lang:${this.config.baseLanguage}`].filter(Boolean)
        ),
      ];
      resource.resourceGroupId = newGroup.definition.id;

      this.dependency.db.resource.resources.update(resource);
      this.dependency.db.resource.resources.insert(newGroup.finalize());
    }

    return {
      ok: true,
      message: 'Resource converted',
    };
  };

  scriptCreateI18NWorkspace = async () => {
    const groups = this.dependency.db.resource.resources.find({
      type: 'group',
    }) as IResourceGroup[];

    const resultMap = new Map<string, IResourceFile>();

    for (let i = 0; i < groups.length; i += 1) {
      const group = groups[i];

      const files = this.dependency.db.resource.resources.find({
        type: 'file',
        id: { $in: group.files },
      }) as IResourceFile[];

      const matchedBaseLanguageFiles = files.filter((x) =>
        x.tags.includes(`lang:${this.config.baseLanguage}`)
      );

      for (let j = 0; j < matchedBaseLanguageFiles.length; j += 1) {
        const baseLanguageFile = matchedBaseLanguageFiles[j];

        const tagSignature = `${group.id}::${[
          ...new Set(
            baseLanguageFile.tags.filter((t) => !t.startsWith('lang:')).sort()
          ),
        ].join(',')}`;

        resultMap.set(tagSignature, baseLanguageFile);
      }

      const matchedWorkingLanguageFiles = files.filter((x) =>
        x.tags.includes(`lang:${this.config.workingLanguage}`)
      );

      for (let j = 0; j < matchedWorkingLanguageFiles.length; j += 1) {
        const workingLanguageFile = matchedWorkingLanguageFiles[j];

        const tagSignature = `${group.id}::${[
          ...new Set(
            workingLanguageFile.tags
              .filter((t) => !t.startsWith('lang:'))
              .sort()
          ),
        ].join(',')}`;

        if (resultMap.has(tagSignature)) {
          resultMap.set(tagSignature, workingLanguageFile);
        }
      }
    }

    const resultMapEntries = resultMap.entries();
    const resourceFileReferences: IResourceFileReference[] = [];

    for (const [resourceSignature, resource] of resultMapEntries) {
      const resourceHash = await this.dependency.getXxHashOfResourceFile(
        resource
      );
      resourceFileReferences.push({
        id: resource.id,
        fileName: `${`${resource.label}-${resourceHash}-${resourceSignature}`
          .replace(/[^a-z0-9]/gi, '_')
          .toLowerCase()}.${extension(resource.mimeType)}`,
        groupId: resource.resourceGroupId,
        signature: resourceSignature,
        originalHash: resourceHash,
        resource,
      });
    }

    const outputPath = join(
      this.config.i18nMediaWorkspacePath,
      Date.now().toString()
    );

    await ensureDir(outputPath);

    for (let i = 0; i < resourceFileReferences.length; i += 1) {
      const resourceReference = resourceFileReferences[i];

      if (!resourceReference.resource) {
        throw new Error(`Resource Definition not found, this is a bug!`);
      }

      await copy(
        await this.dependency.getResourceFilePath(resourceReference.resource),
        join(outputPath, resourceReference.fileName)
      );
    }

    await writeJSON(
      join(outputPath, REFERENCE_FILE_NAME),
      resourceFileReferences.map(({ resource, ...ref }) => ({
        ...ref,
        resource: undefined,
      }))
    );

    return {
      ok: true,
      message: `New workspace ${outputPath} created successfully`,
    };
  };

  scriptSyncI18NWorkspace = async () => {
    const workspaces = (
      await readdir(this.config.i18nMediaWorkspacePath, { withFileTypes: true })
    )
      .filter((dirent) => dirent.isDirectory())
      .map((dirent) => dirent.name)
      .filter((x) => !Number.isNaN(Number(x)))
      .map((x) => ({
        path: join(this.config.i18nMediaWorkspacePath, x),
        id: x,
      }))
      .filter((x) => pathExistsSync(join(x.path, REFERENCE_FILE_NAME)))
      .map((x) => Number(x.id));

    if (!workspaces.length) {
      return {
        ok: false,
        message: `No valid workspace found`,
      };
    }

    const latestWorkspaceId = Math.max(...workspaces).toString();
    const latestWorkspace = join(
      this.config.i18nMediaWorkspacePath,
      latestWorkspaceId
    );

    const resourceFileReferences: IResourceFileReference[] = await readJSON(
      join(latestWorkspace, REFERENCE_FILE_NAME)
    );

    this.dependency.logToTerminal(
      `:: ${resourceFileReferences.length} records found`
    );

    for (let i = 0; i < resourceFileReferences.length; i += 1) {
      const resourceFileReference = resourceFileReferences[i];
      const resourceFilePath = join(
        latestWorkspace,
        resourceFileReference.fileName
      );

      const fileHash = await this.dependency.getXxHashOfFile(resourceFilePath);
      const referenceHash = resourceFileReference.originalHash;

      if (fileHash === referenceHash) {
        // This file is not modified, skip.

        this.dependency.logToTerminal(
          `:: ${resourceFileReference.fileName} not modified`
        );

        continue;
      }

      const existedFile = this.dependency.db.resource.resources.findOne({
        originalHash: fileHash,
      });

      if (existedFile) {
        // This file is already imported, skip.
        this.dependency.logToTerminal(
          `:: ${resourceFileReference.fileName} already imported`
        );

        continue;
      }

      const originalFile = this.dependency.db.resource.resources.findOne({
        id: resourceFileReference.id,
      }) as IResourceFile;

      if (!originalFile) {
        this.dependency.logToTerminal(
          `:: The file ${resourceFileReference.id} is not available in the database, maybe you are using a wrong workspace for the task`,
          TerminalMessageLevel.Warning
        );

        continue;
      }

      if (!originalFile.resourceGroupId) {
        return {
          ok: false,
          message: `The file ${originalFile.label}(${resourceFileReference.id}) do not have a resource group definition, this is not allowed`,
        };
      }

      const originalGroup = this.dependency.db.resource.resources.findOne({
        type: 'group',
        id: originalFile.resourceGroupId,
      }) as IResourceGroup;

      if (!originalGroup) {
        this.dependency.logToTerminal(
          `:: The group ${originalFile.resourceGroupId} is not available in the database, maybe you are using a wrong workspace for the task`,
          TerminalMessageLevel.Warning
        );

        continue;
      }

      this.dependency.logToTerminal(
        `:: Importing ${resourceFileReference.fileName}`
      );

      const importedFiles = await this.dependency.importFile(resourceFilePath);

      for (let j = 0; j < importedFiles.length; j += 1) {
        const importedFile = importedFiles[j];

        this.dependency.db.resource.resources.findAndUpdate(
          {
            id: importedFile.id,
          },
          (file) => {
            file.label = `${originalFile.label.replace(
              `.${this.config.baseLanguage}`,
              ''
            )}.${this.config.workingLanguage}`;

            if (file.type === 'file') {
              file.resourceGroupId = originalGroup.id;
            }

            originalGroup.files.push(file.id);

            file.tags = [
              ...new Set(
                [...file.tags, `lang:${this.config.workingLanguage}`].filter(
                  Boolean
                )
              ),
            ];

            return file;
          }
        );
      }

      originalGroup.files = [...new Set(originalGroup.files)];

      this.dependency.db.resource.resources.update(originalGroup);
    }

    return {
      ok: true,
      message: `Workspace ${latestWorkspace} synced successfully`,
    };
  };
}
