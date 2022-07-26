import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectByResourceProcessor } from './utils/postProcessPreviewResource';
import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForApPackLivePreview } from '../utils/injectActPointUrl';

export interface IApPackLivePreviewProfileConfig {
  resourceHostName: string;
  apHostName: string;
  apProtocol: string;
}

export class ApPackLivePreviewProfile implements ClientProfile {
  constructor(
    private resourceHostName: string,
    private apHostName: string,
    private apProtocol: string
  ) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    return injectEntryPointUrlForApPackLivePreview(
      x,
      this.apHostName,
      this.apProtocol
    );
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    return injectByResourceProcessor(
      injectResourceUrlForResourceManager(
        x,
        this.resourceHostName,
        this.apProtocol
      )
    );
  };
}
