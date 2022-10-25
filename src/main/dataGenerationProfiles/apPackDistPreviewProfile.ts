import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectByResourceProcessor } from './utils/postProcessPreviewResource';
import { createVoidEntryPointResource } from './utils/createVoidEntryPointResource';

import {
  NOT_EXISTS_KEY,
  RESOURCE_MANAGER_KEY,
} from '../utils/buildInResourceUploaderKeys';
import { injectResourceUrlForResourceManager } from '../utils/injectResourceUrl';

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

  injectApEntryPoints: InjectApEntryPointsFunction = async (x) => {
    const entryPointResource = await createVoidEntryPointResource();

    entryPointResource.url[
      RESOURCE_MANAGER_KEY
    ] = `${this.apProtocol}://${this.resourceHostName}/index.html`;

    entryPointResource.url[NOT_EXISTS_KEY] = 'http://localhost:12453/notExists';

    x.push(entryPointResource as any);

    return x;
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
