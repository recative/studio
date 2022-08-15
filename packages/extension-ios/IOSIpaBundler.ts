import { Bundler } from '@recative/extension-sdk';

export class IOSIpaBundler extends Bundler<''> {
  static id = '@recative/extension-ios/IOSIpaBundler';

  static label = 'IPA Bundler';

  static iconId = 'apple';

  static appTemplateFromPath = null;

  static appTemplatePublicPath = 'Payload/App.app/public';

  static outputPublicPath = 'Payload/App.app/public';

  static outputPrefix = 'ios';

  static outputExtensionName = 'ipk';

  static excludeTemplateFilePaths = [];

  static excludeWebRootFilePaths = [];

  beforeBundleFinalized = () => {};

  afterBundleCreated = () => {};
}
