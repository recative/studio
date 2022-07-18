import proto from 'protobufjs';
import StreamZip from 'node-stream-zip';

import { join } from 'path';
import { fileSync } from 'tmp';

import type { Archiver } from 'archiver';
import type { FileResult } from 'tmp';
import type { PromiseValue } from 'type-fest';

import { createEmptyZip } from '../../../utils/archiver';
import { promisifySpawn } from '../../../utils/promiseifySpawn';
import { transformFromZip } from '../../../utils/archiverTransformFromZip';
import { STUDIO_BINARY_PATH } from '../../../constant/appPath';
import { ANDROID_BUILD_TOOLS_PATH } from '../../../constant/configPath';
import { logToTerminal } from '../terminal';

const RESOURCE_PROTO_PATH = join(STUDIO_BINARY_PATH, 'Resources.proto');

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

export const parseAndroidManifest = async (buffer: Buffer) => {
  const root = await proto.load(RESOURCE_PROTO_PATH);
  const type = root.lookupType('aapt.pb.XmlNode');

  const manifest = type.decode(buffer) as unknown as AndroidManifestParseResult;

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

export const updateAndroidManifest = async (
  manifest:
    | Buffer
    | ReturnType<typeof parseAndroidManifest>
    | PromiseValue<ReturnType<typeof parseAndroidManifest>>,
  packageId: string | null = null,
  versionName: string | null = null,
  versionCode: number | null = null
) => {
  const parsedManifest =
    manifest instanceof Buffer
      ? await parseAndroidManifest(manifest)
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

export const dumpAndroidManifest = async (
  manifest:
    | ReturnType<typeof parseAndroidManifest>
    | PromiseValue<ReturnType<typeof parseAndroidManifest>>
) => {
  const parsedManifest = await manifest;
  return Buffer.from(
    parsedManifest.type.encode(parsedManifest.manifest).finish()
  );
};

interface IReplaceManifestOptions {
  archive: Archiver;
  shellTemplatePath: string;
  templateManifestPath: string;
  outputManifestPath: string;
  packageId?: string | null;
  versionName: string;
  versionCode: number;
  apkMode?: boolean;
  apkTemplatePath?: string;
  terminalId: string;
}

export const replaceManifest = async ({
  archive: buildArtifactArchive,
  shellTemplatePath,
  templateManifestPath,
  outputManifestPath = templateManifestPath,
  packageId = null,
  versionName,
  versionCode,
  apkMode = false,
  terminalId,
}: IReplaceManifestOptions) => {
  if (!ANDROID_BUILD_TOOLS_PATH) {
    throw new Error('Build tool not available, can not operate the package');
  }

  const shellTemplate = new StreamZip.async({ file: shellTemplatePath });

  let rawManifest = await shellTemplate.entryData(templateManifestPath);
  shellTemplate.close();

  let originalAar: FileResult | undefined;
  let modifiedAar: FileResult;
  let modifiedApk: FileResult;
  if (apkMode) {
    logToTerminal(terminalId, 'APK mode activated');
    originalAar = fileSync({
      postfix: '.original.aar',
    });

    logToTerminal(terminalId, 'Converting template to proto');
    logToTerminal(terminalId, `:: AAR path: ${originalAar.name}`);
    originalAar.removeCallback();
    await promisifySpawn(
      join(ANDROID_BUILD_TOOLS_PATH, 'aapt2'),
      [
        'convert',
        '-o',
        originalAar.name,
        '--output-format',
        'proto',
        shellTemplatePath,
      ],
      {},
      terminalId
    );

    const aarBundle = new StreamZip.async({
      file: originalAar.name,
    });

    rawManifest = await aarBundle.entryData(templateManifestPath);
    aarBundle.close();
  }

  logToTerminal(terminalId, 'Updating AndroidManifest.xml');
  const manifest = await updateAndroidManifest(
    rawManifest,
    packageId,
    versionName,
    versionCode
  );

  let modifiedManifest = await dumpAndroidManifest(manifest);

  if (apkMode) {
    logToTerminal(terminalId, 'Converting template bundle');
    if (!originalAar) {
      throw new Error('This should never happen');
    }
    modifiedAar = fileSync({
      postfix: '.modified.aar',
    });
    modifiedApk = fileSync({
      postfix: '.modified.apk',
    });

    const { archive: modifiedAarBundle, finished } = createEmptyZip(
      modifiedAar.name,
      {
        zlib: { level: 0 },
      }
    );

    logToTerminal(terminalId, 'Recreating template bundle');
    logToTerminal(terminalId, `:: From: ${originalAar.name}`);
    logToTerminal(terminalId, `:: To: ${modifiedAar.name}`);
    await transformFromZip(modifiedAarBundle, originalAar.name, null, null, [
      'AndroidManifest.xml',
    ]);
    modifiedAarBundle.append(modifiedManifest, { name: 'AndroidManifest.xml' });
    modifiedAarBundle.finalize();
    await finished;

    logToTerminal(terminalId, 'Converting bundle');
    logToTerminal(terminalId, `:: APK path: ${modifiedApk.name}`);
    modifiedApk.removeCallback();
    await promisifySpawn(
      join(ANDROID_BUILD_TOOLS_PATH, 'aapt2'),
      [
        'convert',
        '-o',
        modifiedApk.name,
        '--output-format',
        'binary',
        modifiedAar.name,
      ],
      {},
      terminalId
    );

    const optimizedBundle = new StreamZip.async({
      file: modifiedApk.name,
    });

    modifiedManifest = await optimizedBundle.entryData('AndroidManifest.xml');
    optimizedBundle.close();

    originalAar.removeCallback();
    modifiedAar.removeCallback();
    modifiedApk.removeCallback();
  }

  logToTerminal(terminalId, 'Appending AndroidManifest.xml');
  buildArtifactArchive.append(modifiedManifest, { name: outputManifestPath });
};
