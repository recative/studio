import { Bundler } from './bundlerExtension';
import { Deployer } from './deployExtension';
import { Uploader } from './uploaderExtension';
import { Scriptlet } from './scriptletExtension';
import { ResourceProcessor } from './resourceExtension';

export interface ExtensionManifest {
  uploader?: typeof Uploader[];
  deployer?: typeof Deployer[];
  resourceProcessor?: typeof ResourceProcessor[];
  bundler?: typeof Bundler[];
  scriptlet?: typeof Scriptlet[];
}
