import { ResourceProcessor } from '@recative/extension-sdk';
import { CrowdinSyncScriptlet } from './CrowdinSyncScriptlet';

export class CrowdinResourceProcessor extends ResourceProcessor<string> {
  static id = '@recative/extension-crowdin/CrowdinResourceProcessor';

  static label = 'Crowdin';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [
    `${CrowdinSyncScriptlet.id}~~crowdinId`,
  ];

  beforeFileImported = () => null;

  afterGroupCreated = () => null;

  beforePreviewResourceBinaryDelivered = () => null;

  beforePreviewResourceMetadataDelivered = () => null;

  beforePublishApplicationBundle = () => null;

  beforePublishMediaBundle = () => null;
}
