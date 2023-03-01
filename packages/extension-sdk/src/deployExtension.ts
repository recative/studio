import ZipReader from 'node-stream-zip';

import type { IDbInstance } from '@recative/studio-definitions';

import { TerminalMessageLevel } from './terminal';

import type { IConfigUiField } from './settings';

export interface IDeployDependency {
  db: IDbInstance<unknown>;
  getXxHashOfFile: (path: string) => Promise<string>;
  getXxHashOfBuffer: (buffer: Buffer) => Promise<string>;
  logToTerminal: (message: string, level?: TerminalMessageLevel) => void;
}

export enum AcceptedBuildType {
  Directory = 'directory',
  Zip = 'zip',
  Unknown = 'unknown',
}

export interface IDeployProfile {
  id: string;
  label: string;
  sourceBuildProfileId: string;
  targetUploaderId: string;
  baseUrl: string;
}

export interface IDeployAnalysisResultUnit {
  key: string;
  getBinary(): Promise<Buffer>;
}

export interface IBuiltFileDescription {
  key: string;
  getBinary(): Promise<Buffer>;
}

export abstract class Deploy<ConfigKey extends string> {
  static id: string;

  static label: string;

  static description: string;

  static acceptedBuildType: AcceptedBuildType[];

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
    x: IBuiltFileDescription[] | ZipReader | Buffer,
    profile: IDeployProfile,
    bundleReleaseId: number
  ) => Promise<IDeployAnalysisResultUnit[]>;
}
