import { Uploader } from './uploaderExtension';
import { ResourceProcessor } from './resourceExtension';
import { Bundler } from './bundlerExtension';

export interface ExtensionManifest {
  uploader?: typeof Uploader[];
  resourceProcessor?: typeof ResourceProcessor[];
  bundler?: typeof Bundler[];
}
