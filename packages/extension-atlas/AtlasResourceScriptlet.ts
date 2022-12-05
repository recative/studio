import { Image } from '@napi-rs/canvas';

import { Category } from '@recative/definitions';
import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
} from '@recative/extension-sdk';
import { TextureAnalysisProcessor } from './TextureAnalysisProcessor';

export class AtlasResourceScriptlet extends Scriptlet<string> {
  static id = '@recative/extension-atlas/AtlasResourceScriptlet';

  static label = 'Atlas';

  static extensionConfigUiFields = [] as const;

  static readonly scripts = [
    {
      id: 'recoverTextureDimension',
      label: 'Recover Texture Dimension',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
  ];

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

      const image = new Image();
      image.src = await this.dependency.getResourceFileBinary(resource);

      TextureAnalysisProcessor.calculateImageEnvelope(resource, image);

      if (resource.managedBy) {
        delete resource.extensionConfigurations[
          `${TextureAnalysisProcessor.id}~~frames`
        ];
      }

      console.log(resource);

      d.resource.resources.update(resource);
    }

    return {
      ok: true,
      message: 'Resource recovered',
    };
  };
}
