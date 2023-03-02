import ZipReader from 'node-stream-zip';

import { AcceptedBuildType, Deployer } from '@recative/extension-sdk';

export class ZipBundleDeployer extends Deployer<''> {
  static id = '@recative/extension-whole-bundle/ZipBundleDeployer';

  static label = 'Zip Bundle Deployer';

  static description = 'Extract all building artifacts and deploy them';

  static acceptedBuildType = AcceptedBuildType.Zip;

  static extensionConfigUiFields = [];

  analysisBundle = async (x: string) => {
    const baseZip = new ZipReader.async({ file: x });

    const result = Object.entries(await baseZip.entries())
      .filter(([, entry]) => entry.isFile)
      .map(async ([key]) => ({
        key,
        getBinary: () => baseZip.entryData(key),
      }));

    return Promise.all(result);
  };
}
