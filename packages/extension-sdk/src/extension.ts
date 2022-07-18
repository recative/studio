import { Uploader } from './uploaderExtension';
import { ResourceProcessor } from './resourceExtension';

export interface ExtensionManifest {
  uploader?: typeof Uploader[];
  resourceProcessor?: typeof ResourceProcessor[];
}
