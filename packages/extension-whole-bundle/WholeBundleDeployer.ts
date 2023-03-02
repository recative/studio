import { AcceptedBuildType, Deployer } from '@recative/extension-sdk';

export class WholeBundleDeployer extends Deployer<''> {
  static id = '@recative/extension-whole-bundle/WholeBundleDeployer';

  static label = 'Whole Bundle Deployer';

  static description = 'Deploy your file as a whole bundle';

  static acceptedBuildType = AcceptedBuildType.File;

  static extensionConfigUiFields = [];

  analysisBundle = (x: string) => {
    return Promise.resolve([
      {
        key: x,
        getBinary: this.dependency.GetFileBinary(x),
      },
    ]);
  };
}
