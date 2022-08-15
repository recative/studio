import { basename } from 'path';

import { Bundler } from '@recative/extension-sdk';
import type {
  Zip,
  IBundleProfile,
  IConfigUiField,
} from '@recative/extension-sdk';

import { AndroidTools } from './AndroidTools';

const MANIFEST_PATH = 'AndroidManifest.xml';
const OUTPUT_MANIFEST_PATH = MANIFEST_PATH;

export class AndroidApkBundler extends Bundler<''> {
  static id = '@recative/extension-android/AndroidApkBundler';

  static label = 'APK Bundler';

  static iconId = 'android';

  static appTemplateFromPath = null;

  static appTemplatePublicPath = 'assets/public';

  static outputPublicPath = 'assets/public';

  static outputPrefix = 'android';

  static outputExtensionName = 'apk';

  static profileConfigUiFields: IConfigUiField[] = [
    {
      id: 'pk8',
      type: 'string',
      label: 'PK8 Filename (with .pk8 extension)',
      required: true,
    },
    {
      id: 'pem',
      type: 'string',
      label: 'PEM Filename (with .pem extension)',
      required: true,
    },
  ];

  static excludeTemplateFilePaths = [MANIFEST_PATH];

  static excludeWebRootFilePaths = [];

  androidTools = new AndroidTools(this.dependency);

  private signApk = async (
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => {
    const unsignedPath = await this.dependency.getOutputFilePath(
      null,
      bundleReleaseId,
      profile
    );
    const alignedPath = await this.dependency.prepareOutputFile(
      'aligned',
      bundleReleaseId,
      profile
    );
    const signedPath = await this.dependency.prepareOutputFile(
      'signed',
      bundleReleaseId,
      profile
    );

    await this.dependency.executeExternalTool(
      'zipalign',
      ['-p', '-f', '-v', '4', basename(unsignedPath), basename(alignedPath)],
      true
    );

    await this.dependency.executeExternalTool(
      'apksigner',
      [
        'sign',
        '--v4-signing-enabled',
        'false',
        '--key',
        this.dependency.getLocalConfigFilePath(
          `android/${
            profile.extensionConfigurations[`${AndroidApkBundler.id}~~pk8`]
          }`
        ),
        '--cert',
        this.dependency.getLocalConfigFilePath(
          `android/${
            profile.extensionConfigurations[`${AndroidApkBundler.id}~~pem`]
          }`
        ),
        '-in',
        basename(alignedPath),
        '-out',
        basename(signedPath),
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
        apkMode: true,
      },
      profile
    );
  };

  afterBundleCreated = async (
    zip: Zip,
    profile: IBundleProfile,
    bundleReleaseId: number
  ) => {
    await this.signApk(profile, bundleReleaseId);
  };
}
