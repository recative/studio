import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForApPackPreview } from '../utils/injectActPointUrl';

export interface IStudioPreviewProfileConfig {
  resourceHostName: string;
  apHostName: string;
  apProtocol: string;
}

/**
 * This file is copy & pasted from `apPackPreview` but it will change later,
 * which will support preview code bundle.
 */
export class StudioPreviewProfile implements ClientProfile {
  constructor(
    private resourceHostName: string,
    private apHostName: string,
    private apProtocol: string
  ) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    const result = injectEntryPointUrlForApPackPreview(
      x,
      this.apHostName,
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
