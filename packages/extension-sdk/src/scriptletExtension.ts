import { IDbInstance } from '@recative/studio-definitions';

import type { IConfigUiField } from './settings';

export enum ScriptExecutionMode {
  Terminal = 'terminal',
  Background = 'background',
}

export enum ScriptType {
  Resource = 'resource',
}

export interface IExecuteResult {
  ok: boolean;
  message: string;
}

export interface IResourceScript {
  type: ScriptType.Resource;
  executeMode: ScriptExecutionMode;
  function: (selectedResources: string[]) => IExecuteResult;
}

export interface IScriptletDependency {
  db: IDbInstance<never>;
}

export type IScript = IResourceScript;

export abstract class Scriptlet<ConfigKey extends string> {
  static id: string;

  static label: string;

  static description: string;

  static configUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  protected config: Record<ConfigKey, string>;

  protected abstract readonly scripts: IScript[];

  constructor(
    config: Record<string, string>,
    public dependency: IScriptletDependency
  ) {
    if (this.configValidator(config)) {
      this.config = config;
    } else {
      throw new Error('Invalid configuration');
    }
  }

  protected configValidator(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _x: Record<string, string>
  ): _x is Record<ConfigKey, string> {
    return true;
  }
}
