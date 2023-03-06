import StreamZip from 'node-stream-zip';

import type { IDbInstance } from '@recative/studio-definitions';

import { TerminalMessageLevel } from './terminal';

import type { IConfigUiField } from './settings';

export interface IDeployDependency {
  db: IDbInstance<unknown>;
  readZipFile: (path: string) => StreamZip.StreamZipAsync;
  GetFileBinary: (path: string) => () => Promise<Buffer>;
  getXxHashOfFile: (path: string) => Promise<string>;
  getXxHashOfBuffer: (buffer: Buffer) => Promise<string>;
  logToTerminal: (message: string, level?: TerminalMessageLevel) => void;
}

export enum AcceptedBuildType {
  Directory = 'directory',
  Zip = 'zip',
  File = 'file',
}

export interface IDeployProfile {
  id: string;
  label: string;
  sourceBuildProfileId: string;
  targetUploaderId: string;
}

export interface IDeployAnalysisResultUnit {
  key: string;
  getBinary(): Promise<Buffer>;
}

export interface IBuiltFileDescription {
  key: string;
  getBinary(): Promise<Buffer>;
}

export abstract class Deployer<ConfigKey extends string> {
  static id: string;

  static label: string;

  static description: string;

  static acceptedBuildType: AcceptedBuildType;

  static extensionConfigUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  protected config: Record<ConfigKey, string>;

  constructor(
    config: Record<string, string>,
    public dependency: IDeployDependency
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

  abstract analysisBundle: (
    x: string,
    profile: IDeployProfile,
    bundleReleaseId: number
  ) => Promise<IDeployAnalysisResultUnit[]>;
}
