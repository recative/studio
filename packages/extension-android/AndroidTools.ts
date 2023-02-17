import type { PromiseValue } from 'type-fest';

import { Zip } from '@recative/extension-sdk';
import type {
  IBundlerExtensionDependency,
  IBundleProfile,
} from '@recative/extension-sdk';

interface ManifestAttribute {
  name: string;
  [key: string]: unknown;
}

interface PackageAttribute extends ManifestAttribute {
  name: 'package';
  value: string;
}

interface VersionNameAttribute extends ManifestAttribute {
  namespaceUri: 'versionName';
  name: string;
  value: string;
  resourceId: number;
}

interface VersionCodeAttribute extends ManifestAttribute {
  namespaceUri: 'versionCode';
  name: string;
  value: string;
  source: { lineNumber: number };
  resourceId: number;
  compiledItem: {
    prim: {
      intDecimalValue: number;
    };
  };
}

interface AndroidManifestParseResult {
  element: {
    attribute: ManifestAttribute[];
  };
}

interface IReplaceManifestOptions {
  zip: Zip;
  templateManifestPath: string;
  outputManifestPath: string;
  packageId?: string | null;
  versionName: string;
  versionCode: number;
  apkMode?: boolean;
  apkTemplatePath?: string;
}

export class AndroidTools {
  constructor(private dependency: IBundlerExtensionDependency) {}

  private parseAndroidManifest = async (buffer: Buffer) => {
    const root = await this.dependency.getBuildInProtoDefinition(
      'Resources.proto'
    );
    const type = root.lookupType('aapt.pb.XmlNode');

    const manifest = type.decode(
      buffer
    ) as unknown as AndroidManifestParseResult;

    const packageId = manifest.element.attribute.find(
      (attr) => attr.name === 'package'
    );

    const versionName = manifest.element.attribute.find(
      (attr) => attr.name === 'versionName'
    );

    const versionCode = manifest.element.attribute.find(
      (attr) => attr.name === 'versionCode'
    );

    if (!packageId) {
      throw new TypeError(
        'Package attribute is not found in AndroidManifest.xml'
      );
    }

    if (!versionName) {
      throw new TypeError(
        'VersionName attribute is not found in AndroidManifest.xml'
      );
    }

    if (!versionCode) {
      throw new TypeError(
        'VersionCode attribute is not found in AndroidManifest.xml'
      );
    }

    return {
      type,
      buffer,
      manifest,
      packageId: packageId as PackageAttribute,
      versionName: versionName as VersionNameAttribute,
      versionCode: versionCode as VersionCodeAttribute,
    };
  };

  updateAndroidManifest = async (
    manifest:
      | Buffer
      | ReturnType<typeof this.parseAndroidManifest>
      | PromiseValue<ReturnType<typeof this.parseAndroidManifest>>,
    packageId: string | null = null,
    versionName: string | null = null,
    versionCode: number | null = null
  ) => {
    const parsedManifest =
      manifest instanceof Buffer
        ? await this.parseAndroidManifest(manifest)
        : await manifest;

    if (packageId) {
      parsedManifest.packageId.value = packageId;
    }

    if (versionName) {
      parsedManifest.versionName.value = versionName;
    }

    if (versionCode) {
      parsedManifest.versionCode.value = versionCode.toString();
      parsedManifest.versionCode.compiledItem.prim.intDecimalValue =
        Math.floor(versionCode);
    }

    return parsedManifest;
  };

  dumpAndroidManifest = async (
    manifest:
      | ReturnType<typeof this.parseAndroidManifest>
      | PromiseValue<ReturnType<typeof this.parseAndroidManifest>>
  ) => {
    const parsedManifest = await manifest;
    return Buffer.from(
      parsedManifest.type.encode(parsedManifest.manifest).finish()
    );
  };

  replaceManifest = async (
    {
      zip,
      templateManifestPath,
      outputManifestPath = templateManifestPath,
      versionName,
      versionCode,
      apkMode = false,
    }: IReplaceManifestOptions,
    profile: IBundleProfile
  ) => {
    const shellTemplate = await this.dependency.readBundleTemplate(profile);

    let rawManifest = await shellTemplate.entryData(templateManifestPath);
    await shellTemplate.close();

    let originalAar: string | undefined;
    let modifiedAar: string;
    let modifiedApk: string;
    if (apkMode) {
      this.dependency.logToTerminal('APK mode activated');
      originalAar = this.dependency.getTemporaryFile();

      this.dependency.logToTerminal('Converting template to proto');
      this.dependency.logToTerminal(`:: AAR path: ${originalAar}`);

      await this.dependency.executeExternalTool(
        'aapt2',
        [
          'convert',
          '-o',
          originalAar,
          '--output-format',
          'proto',
          this.dependency.getAssetFilePath(profile.shellTemplateFileName),
        ],
        false
      );

      const aarBundle = this.dependency.readZipFile(originalAar);

      rawManifest = await aarBundle.entryData(templateManifestPath);
      await aarBundle.close();
    }

    this.dependency.logToTerminal('Updating AndroidManifest.xml');
    const manifest = await this.updateAndroidManifest(
      rawManifest,
      profile.packageId,
      versionName,
      versionCode
    );

    let modifiedManifest = await this.dumpAndroidManifest(manifest);

    if (apkMode) {
      this.dependency.logToTerminal('Converting template bundle');
      if (!originalAar) {
        throw new Error('This should never happen');
      }
      modifiedAar = this.dependency.getTemporaryFile();
      modifiedApk = this.dependency.getTemporaryFile();

      const modifiedAarBundle = new Zip(modifiedAar, {
        zlib: { level: 0 },
      });

      this.dependency.logToTerminal('Recreating template bundle');
      this.dependency.logToTerminal(`:: From: ${originalAar}`);
      this.dependency.logToTerminal(`:: To: ${modifiedAar}`);
      this.dependency.logToTerminal(':: Transferring files');
      await modifiedAarBundle.transfer(originalAar, null, null, [
        'AndroidManifest.xml',
      ]);
      this.dependency.logToTerminal(':: Appending Manifest');
      await modifiedAarBundle.appendFile(
        modifiedManifest,
        'AndroidManifest.xml'
      );
      this.dependency.logToTerminal(':: Finalizing template bundle');
      await modifiedAarBundle.done();

      this.dependency.logToTerminal('Converting bundle');
      this.dependency.logToTerminal(`:: APK path: ${modifiedApk}`);
      await this.dependency.executeExternalTool(
        'aapt2',
        [
          'convert',
          '-o',
          modifiedApk,
          '--output-format',
          'binary',
          modifiedAar,
        ],
        false
      );

      const optimizedBundle = this.dependency.readZipFile(modifiedApk);

      modifiedManifest = await optimizedBundle.entryData('AndroidManifest.xml');
      this.dependency.logToTerminal(
        `:: Modified Manifest Size: ${modifiedManifest.byteLength} bytes`
      );
      await optimizedBundle.close();
    }

    this.dependency.logToTerminal('Appending AndroidManifest.xml');
    await zip.appendFile(modifiedManifest, outputManifestPath);
  };
}
