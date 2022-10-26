import type {
  ClientProfile,
  InjectResourceUrlsFunction,
  InjectApEntryPointsFunction,
} from './types';

import {
  NOT_EXISTS_KEY,
  DESKTOP_SHELL_KEY,
  RESOURCE_MANAGER_KEY,
  MOBILE_SHELL_CACHED_KEY,
  MOBILE_SHELL_BUILD_IN_KEY,
} from '../utils/buildInResourceUploaderKeys';
import { PerformanceLog } from '../utils/performanceLog';
import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';

import { injectByResourceProcessor } from './utils/postProcessPreviewResource';
import { createVoidEntryPointResource } from './utils/createVoidEntryPointResource';

export interface IApPackLivePreviewProfileConfig {
  resourceHostName: string;
  apHostName: string;
  apProtocol: string;
}

export class ApPackLivePreviewProfile implements ClientProfile {
  constructor(
    private resourceHostName: string,
    public apHostName: string,
    private apProtocol: string
  ) {}

  injectApEntryPoints: InjectApEntryPointsFunction = async (x) => {
    const entryPointResource = await createVoidEntryPointResource();

    entryPointResource.url[DESKTOP_SHELL_KEY] = `recative://ap/dist/index.html`;

    entryPointResource.url[
      MOBILE_SHELL_BUILD_IN_KEY
    ] = `/bundle/ap/dist/index.html`;

    entryPointResource.url[
      MOBILE_SHELL_CACHED_KEY
    ] = `http://localhost:34652/ap/dist/index.html`;

    entryPointResource.url[
      RESOURCE_MANAGER_KEY
    ] = `${this.apProtocol}://${this.resourceHostName}/index.html`;

    entryPointResource.url[NOT_EXISTS_KEY] = 'http://localhost:12453/notExists';

    x.push(entryPointResource as any);

    return x;
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
