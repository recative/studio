import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
} from '@recative/extension-sdk';

export interface IAudioBackendScriptletConfig {
  minimumAudioDuration: string;
}

export class AudioBackendScriptlet extends Scriptlet<
  keyof IAudioBackendScriptletConfig
> {
  static id = '@recative/extension-i18n-utils/AudioBackendScriptlet';

  static label = 'Audio backends';

  static extensionConfigUiFields = [
    {
      id: 'minimumAudioDuration',
      type: 'string',
      label: 'Minimum Audio Duration',
    },
  ] as const;

  static readonly scripts = [
    {
      id: 'labelFilteredAudio',
      label: 'Mark filtered audio',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Background,
      confirmBeforeExecute: true,
    },
  ];

  labelFilteredAudio = async () => {
    const parsedMinimumAudioDuration = Number(this.config.minimumAudioDuration);
    const minimumAudioDuration = Number.isNaN(parsedMinimumAudioDuration)
      ? 3000
      : parsedMinimumAudioDuration;

    this.dependency.db.resource.resources.findAndUpdate(
      {
        type: 'file',
        tags: {
          $contains: 'category:audio',
        },
        duration: {
          $gt: minimumAudioDuration,
        },
        removed: false,
      },
      (document) => {
        if (document.type === 'group') {
          return document;
        }

        document.extensionConfigurations[
          '@recative/extension-audio-backends/PhonographAudioBackend~~backend'
        ] = 'yes';

        return document;
      }
    );

    return {
      ok: true,
      message: 'Resource marked',
    };
  };
}
