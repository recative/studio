import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForApPackLivePreview } from '../utils/injectActPointUrl';

export interface IApPackDistPreviewProfileConfig {
  resourceHostName: string;
  apHostName: string;
  apProtocol: string;
}

/**
 * This file is copy & pasted from `apPackPreview` but it will change later,
 * which will support preview code bundle.
 */
export class ApPackDistPreviewProfile implements ClientProfile {
  constructor(private resourceHostName: string, private apProtocol: string) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    const result = injectEntryPointUrlForApPackLivePreview(
      x,
      this.resourceHostName,
      this.apProtocol
    );
    return result;
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    return injectResourceUrlForResourceManager(
      x,
      this.resourceHostName,
      this.apProtocol
    );
  };
}
