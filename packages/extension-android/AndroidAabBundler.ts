import { basename } from 'path';

import { Bundler } from '@recative/extension-sdk';
import type {
  Zip,
  IBundleProfile,
  IConfigUiField,
} from '@recative/extension-sdk';

import { AndroidTools } from './AndroidTools';

const MANIFEST_PATH = 'base/manifest/AndroidManifest.xml';
const OUTPUT_MANIFEST_PATH = 'manifest/AndroidManifest.xml';

export class AndroidAabBundler extends Bundler<''> {
  static id = '@recative/extension-android/AndroidAabBundler';

  static label = 'AAB Bundler';

  static iconId = 'google';

  static appTemplateFromPath = null;

  static outputPublicPath = 'assets/public';

  static appTemplatePublicPath = 'base/assets/public';

  static excludeTemplateFilePaths = [MANIFEST_PATH];

  static excludeWebRootFilePaths = [];

  static outputPrefix = 'google';

  static outputExtensionName = 'aab';

  static profileConfigUiFields: IConfigUiField[] = [
    {
      id: 'jks',
      type: 'string',
      label: 'JKS Filename (with .jks extension)',
      required: true,
    },
  ];

  androidTools = new AndroidTools(this.dependency);

  private signAab = async (
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => {
    const intermediateAabFileName = await this.dependency.prepareOutputFile(
      'intermediate',
      bundleReleaseId,
      profile
    );
    const signedAabFileName = await this.dependency.prepareOutputFile(
      'signed',
      bundleReleaseId,
      profile
    );

    await this.dependency.executeExternalTool(
      'bundletool',
      [
        'build-bundle',
        `--modules=${basename(intermediateAabFileName)}`,
        `--output=${basename(signedAabFileName)}`,
      ],
      true
    );

    if (process.arch !== 'x64' && process.arch !== 'arm64') {
      throw new Error(
        'Unsupported architecture, only x64 and arm64 are supported'
      );
    }

    if (
      process.platform !== 'darwin' &&
      process.platform !== 'linux' &&
      process.platform !== 'win32'
    ) {
      throw new Error(
        'Unsupported platform, only darwin, linux and win32 are supported'
      );
    }

    if (process.arch === 'arm64' && process.platform === 'win32') {
      throw new Error(
        'Unsupported architecture, Windows does not support arm64'
      );
    }

    await this.dependency.executeExternalTool(
      'jarsigner',
      [
        '-digestalg',
        'SHA1',
        '-sigalg',
        'SHA1withRSA',
        '-keystore',
        this.dependency.getLocalConfigFilePath(
          `android/${
            profile.extensionConfigurations[`${AndroidAabBundler.id}~~jks`]
          }`
        ),
        '-storepass',
        '111111',
        '-keypass',
        '111111',
        signedAabFileName,
        'recative',
      ],
      true
    );
  };

  beforeBundleFinalized = async (
    zip: Zip,
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => {
    await this.androidTools.replaceManifest(
      {
        zip,
        templateManifestPath: MANIFEST_PATH,
        outputManifestPath: OUTPUT_MANIFEST_PATH,
        versionName: await this.dependency.getVersionName(
          bundleReleaseId,
          profile
        ),
        versionCode: bundleReleaseId,
        apkMode: false,
      },
      profile
    );
  };

  afterBundleCreated = async (
    _: Zip,
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => {
    await this.signAab(profile, bundleReleaseId);
  };
}
