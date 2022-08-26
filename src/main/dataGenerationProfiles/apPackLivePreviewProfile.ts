import type {
  ClientProfile,
  InjectResourceUrlsFunction,
  InjectApEntryPointsFunction,
} from './types';

import { PerformanceLog } from '../utils/performanceLog';
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
    const logPerformance = PerformanceLog('inject-ru');
    const step0 = injectResourceUrlForResourceManager(
      x,
      this.resourceHostName,
      this.apProtocol
    );
    logPerformance('0');

    const step1 = injectByResourceProcessor(step0);
    logPerformance('1');

    return step1;
  };
}
