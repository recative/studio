import { Uploader } from './uploaderExtension';
import { ResourceProcessor } from './resourceExtension';
import { Bundler } from './bundlerExtension';
import { Scriptlet } from './scriptletExtension';

export interface ExtensionManifest {
  uploader?: typeof Uploader[];
  resourceProcessor?: typeof ResourceProcessor[];
  bundler?: typeof Bundler[];
  scriptlet?: typeof Scriptlet[];
}
