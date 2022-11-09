import { IDbInstance } from '@recative/studio-definitions';
import { IResourceFile, IResourceItem } from '@recative/definitions';
import ZipReader from 'node-stream-zip';

import { getFilePath } from './getFilePath';
import { TerminalMessageLevel } from './terminal';

import type { IConfigUiField } from './settings';
import type {
  WriteBufferToResource,
  InsertPostProcessedFileDefinition,
  UpdatePostProcessedFileDefinition,
  WritePathToResource,
} from './types';

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
  id: string;
  label: string;
  type: ScriptType.Resource;
  executeMode: ScriptExecutionMode;
  confirmBeforeExecute: boolean;
}

export interface IScriptletDependency {
  db: IDbInstance<unknown>;
  getFilePath: typeof getFilePath;
  getResourceFilePath: (resource: Pick<IResourceFile, 'id'>) => Promise<string>;
  getResourceFileBinary: (
    resource: Pick<IResourceFile, 'id'>
  ) => Promise<Buffer>;
  getXxHashOfResourceFile: (
    fileId: Pick<IResourceFile, 'id'>
  ) => Promise<string>;
  getXxHashOfFile: (path: string) => Promise<string>;
  getXxHashOfBuffer: (buffer: Buffer) => Promise<string>;
  writePathToResource: WritePathToResource;
  writeBufferToResource: WriteBufferToResource;
  insertPostProcessedFileDefinition: InsertPostProcessedFileDefinition;
  updatePostProcessedFileDefinition: UpdatePostProcessedFileDefinition;
  importFile: (
    filePath: string,
    replaceFileId?: string
  ) => Promise<IResourceItem[]>;
  downloadFile: (url: string, directory?: string) => Promise<string>;
  readZip: (path: string) => ZipReader;
  logToTerminal: (message: string, level?: TerminalMessageLevel) => void;
}

export type IScript = IResourceScript;

export abstract class Scriptlet<ConfigKey extends string> {
  static id: string;

  static label: string;

  static description: string;

  static extensionConfigUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  protected config: Record<ConfigKey, string>;

  static readonly scripts: IScript[];

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
