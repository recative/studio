import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForApPackPreview } from '../utils/injectActPointUrl';

export interface IApPackPreviewProfileConfig {
  resourceHostName: string;
  apHostName: string;
  apProtocol: string;
}

export class ApPackPreviewProfile implements ClientProfile {
  constructor(
    private resourceHostName: string,
    private apHostName: string,
    private apProtocol: string
  ) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    return injectEntryPointUrlForApPackPreview(
      x,
      this.apHostName,
      this.apProtocol
    );
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    return injectResourceUrlForResourceManager(
      x,
      this.resourceHostName,
      this.apProtocol
    );
  };
}
