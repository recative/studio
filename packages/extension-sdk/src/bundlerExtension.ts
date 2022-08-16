import proto from 'protobufjs';
import type StreamZip from 'node-stream-zip';

import type { Zip } from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import type { IBundleProfile } from './bundler';
import type { IConfigUiField } from './settings';

export const TOOLS = [
  'apktool',
  'bundletool',
  'jarsigner',
  'aapt2',
  'zipalign',
  'apksigner',
] as const;

export interface IBundlerExtensionDependency {
  executeExternalTool: (
    toolId: typeof TOOLS[number],
    parameters: string[],
    executeInBuildPath: boolean
  ) => Promise<string>;
  getOutputFilePath: (
    suffix: string | null,
    bundleReleaseId: number,
    profile: IBundleProfile
  ) => Promise<string>;
  prepareOutputFile: (
    suffix: string,
    bundleReleaseId: number,
    profile: IBundleProfile
  ) => Promise<string>;
  getBuildInProtoDefinition: (fileName: string) => Promise<proto.Root>;
  logToTerminal: (
    message: string | [string, string],
    level?: TerminalMessageLevel
  ) => void;
  readBundleTemplate: (
    profile: IBundleProfile
  ) => Promise<StreamZip.StreamZipAsync>;
  readZipFile: (path: string) => StreamZip.StreamZipAsync;
  getTemporaryFile: () => string;
  getVersionName: (
    bundleReleaseId: number,
    profile: IBundleProfile
  ) => Promise<string>;
  getAssetFilePath: (path: string) => string;
  getLocalConfigFilePath: (path: string) => string;
}

export abstract class Bundler<ConfigKey extends string> {
  static id: string;

  static label: string;

  static description: string;

  static iconId: string;

  static appTemplateFromPath: string | null;

  static appTemplatePublicPath: string | null;

  static outputPublicPath: string | null;

  static excludeTemplateFilePaths: string[] = [];

  static excludeWebRootFilePaths: string[] = [];

  static outputPrefix: string;

  static outputExtensionName: string;

  static configUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  static profileConfigUiFields:
    | IConfigUiField[]
    | Readonly<Readonly<IConfigUiField>[]>;

  protected config: Record<ConfigKey, string>;

  constructor(
    config: Record<string, string>,
    public dependency: IBundlerExtensionDependency
  ) {
    if (this.configValidator(config)) {
      this.config = config;
    } else {
      throw new Error('Invalid configuration');
    }
  }

  protected configValidator(
    x: Record<string, string>
  ): x is Record<ConfigKey, string> {
    return true;
  }

  abstract beforeBundleFinalized: (
    zip: Zip,
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => void | Promise<void>;

  abstract afterBundleCreated: (
    zip: Zip,
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => void | Promise<void>;
}
