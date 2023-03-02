import {
  AcceptedBuildType,
  Bundler,
  IBundleProfile,
} from '@recative/extension-sdk';

export class RawBundler extends Bundler<''> {
  static id = '@recative/extension-raw/RawBundler';

  static label = 'Raw Bundler';

  static iconId = 'raw';

  static appTemplateFromPath = null;

  static appTemplatePublicPath = '';

  static outputPublicPath = '';

  static outputPrefix = 'raw';

  static outputExtensionName = 'zip';

  static excludeTemplateFilePaths = [];

  static excludeWebRootFilePaths = [];

  beforeBundleFinalized = () => {};

  afterBundleCreated = () => {};

  getBundleMetadata = (profile: IBundleProfile, bundleReleaseId: number) => {
    return {
      fileName: this.dependency.getOutputFileName(
        null,
        bundleReleaseId,
        profile
      ),
      type: AcceptedBuildType.Zip,
    };
  };
}
