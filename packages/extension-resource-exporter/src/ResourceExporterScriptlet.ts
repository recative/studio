import { join } from 'path';

import { extension } from 'mime-types';
import { ensureDir, copy } from 'fs-extra';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
} from '@recative/extension-sdk';

export interface IResourceExportScriptletConfig {
  exportDestinationPath: string;
}

export class ResourceExporterScriptlet extends Scriptlet<
  keyof IResourceExportScriptletConfig
> {
  static id = '@recative/extension-resource-export/ResourceExportScriptlet';

  static label = 'Resource Exporter';

  static extensionConfigUiFields = [
    {
      id: 'exportDestinationPath',
      type: 'string',
      label: 'Export Destination Path',
    },
  ] as const;

  static readonly scripts = [
    {
      id: 'scriptExportSelectedResources',
      label: 'Export Selected Resources',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: false,
    },
  ];

  scriptExportSelectedResources = async (selectedResources: string[]) => {
    const outputPath = join(
      this.config.exportDestinationPath,
      Date.now().toString()
    );

    await ensureDir(outputPath);

    const resources = this.dependency.db.resource.resources
      .find({
        $or: [
          {
            id: {
              $in: selectedResources,
            },
          },
          {
            resourceGroupId: {
              $in: selectedResources,
            },
          },
        ],
        removed: false,
      })
      .filter((x) => x.type === 'file' && !x.resourceGroupId);

    if (!resources.length) {
      return {
        ok: false,
        message: 'No convertible resource found',
      };
    }

    await Promise.all(
      resources.map(async (resource) => {
        if (resource.type !== 'file') {
          return;
        }

        const outputFileName = `${resource.label}-${resource.id}.${extension(
          resource.mimeType
        )}`;

        await copy(
          await this.dependency.getResourceFilePath(resource),
          join(outputPath, outputFileName)
        );
      })
    );

    return {
      ok: true,
      message: `${resources.length} resources exported`,
    };
  };
}
