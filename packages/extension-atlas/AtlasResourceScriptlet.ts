import { Image } from '@napi-rs/canvas';

import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
  TerminalMessageLevel,
} from '@recative/extension-sdk';
import { Category, IResourceItem } from '@recative/definitions';
import { TextureAnalysisProcessor } from './TextureAnalysisProcessor';

export class AtlasResourceScriptlet extends Scriptlet<string> {
  static id = '@recative/extension-atlas/AtlasResourceScriptlet';

  static label = 'Atlas';

  static extensionConfigUiFields = [] as const;

  static readonly scripts = [
    {
      id: 'recoverTextureDimension',
      label: 'Recover Broken Dimension',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
    {
      id: 'recoverSelectedResourceDimension',
      label: 'Recover Selected Dimension',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: false,
    },
  ];

  private reGenerateDimensionOfFiles = async (resources: IResourceItem[]) => {
    const d = this.dependency.db;

    if (!resources.length) {
      return {
        ok: false,
        message: 'No recoverable resource found',
      };
    }

    for (let i = 0; i < resources.length; i += 1) {
      const resource = resources[i];

      if (resource.type !== 'file') {
        continue;
      }

      this.dependency.logToTerminal(
        `:: :: Recovering ${resource.label}(${resource.id})`
      );

      const oldEnvelope = TextureAnalysisProcessor.getImageEnvelope(resource);

      const image = new Image();
      image.src = await this.dependency.getResourceFileBinary(resource);

      const newEnvelope = TextureAnalysisProcessor.calculateImageEnvelope(
        resource,
        image
      );

      if (resource.managedBy) {
        delete resource.extensionConfigurations[
          `${TextureAnalysisProcessor.id}~~frames`
        ];
      }

      d.resource.resources.update(resource);

      if (
        oldEnvelope.x !== newEnvelope.x ||
        oldEnvelope.y !== newEnvelope.y ||
        oldEnvelope.w !== newEnvelope.w ||
        oldEnvelope.h !== newEnvelope.h
      ) {
        this.dependency.logToTerminal(
          `:: :: :: Dimension Updated`,
          TerminalMessageLevel.Warning
        );
      }
    }

    return {
      ok: true,
      message: 'Resource recovered',
    };
  };

  recoverTextureDimension = async () => {
    const d = this.dependency.db;
    const resources = d.resource.resources.find({
      type: 'file',
      removed: false,
      tags: {
        $contains: Category.Image,
      },
      [`extensionConfigurations.${TextureAnalysisProcessor.id}~~ew`]: {
        $or: [
          {
            $eq: '0',
          },
          {
            $eq: '1',
          },
          {
            $eq: undefined,
          },
          {
            $exists: false,
          },
        ],
      },
    });

    if (!resources.length) {
      return {
        ok: false,
        message: 'No resource found',
      };
    }

    return this.reGenerateDimensionOfFiles(resources);
  };

  recoverSelectedResourceDimension = async (selectedResources: string[]) => {
    const d = this.dependency.db;
    const resources = d.resource.resources
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
      .filter((x) => x.type === 'file');

    if (!resources.length) {
      return {
        ok: false,
        message: 'No resource found',
      };
    }

    return this.reGenerateDimensionOfFiles(resources);
  };
}
