import console from 'electron-log';

import type { IResourceFile, Category } from '@recative/definitions';

import type { IConfigUiField } from './settings';

export interface IRemoteFile {
  label: string;
  url: string;
}

export abstract class Uploader<ConfigKey extends string> {
  static id: string;

  static label: string;

  static configUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  static acceptedFileCategory: Category[];

  protected config: Record<ConfigKey, string>;

  constructor(config: Record<string, string>) {
    if (this.configValidator(config)) {
      this.config = config;
    } else {
      throw new Error('Invalid configuration');
    }
  }

  protected configValidator(
    x: Record<string, string>
  ): x is Record<ConfigKey, string> {
    const uiFields = Reflect.get(
      this.constructor,
      'configUiFields'
    ) as IConfigUiField[];
    const pluginId = Reflect.get(this.constructor, 'id');

    return uiFields
      .map((field) => {
        const valid =
          typeof x[field.id] === 'string' ||
          (!field.required && typeof x[field.id] === 'undefined');

        if (!valid) {
          console.warn(`:: [${pluginId}] ${field.id} is not a string`);
        }

        return valid;
      })
      .reduce((a, b) => a && b);
  }

  abstract upload: (
    binary: Buffer,
    config: IResourceFile | string,
    pathPrefix?: string
  ) => Promise<string>;

  abstract remove: (config: IResourceFile | string) => void;

  abstract get: (config: IResourceFile | string) => string;

  abstract list: () => Promise<IRemoteFile[]>;
}
