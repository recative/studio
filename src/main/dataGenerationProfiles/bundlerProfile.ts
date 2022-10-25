import { produce } from 'immer';
import { IBundleProfile } from '@recative/extension-sdk';
import type {
  ClientProfile,
  InjectResourceUrlsFunction,
  InjectApEntryPointsFunction,
} from './types';

import {
  NOT_EXISTS_KEY,
  DESKTOP_SHELL_KEY,
  MOBILE_SHELL_CACHED_KEY,
  MOBILE_SHELL_BUILD_IN_KEY,
} from '../utils/buildInResourceUploaderKeys';
import { injectResourceUrlForPlayerShells } from '../utils/injectResourceUrl';

import { ifResourceIncludedInBundle } from './utils/ifResourceIncludedInBundle';
import { createVoidEntryPointResource } from './utils/createVoidEntryPointResource';

export interface IBundlerProfileConfig {
  codeReleaseId: number;
}

export class BundlerProfile implements ClientProfile {
  constructor(
    public codeReleaseId: number,
    private mediaReleaseId: number,
    private profile: IBundleProfile
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

    entryPointResource.url[NOT_EXISTS_KEY] = 'http://localhost:12453/notExists';

    x.push(entryPointResource as any);

    return x;
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    return produce(x, (resources) => {
      const filteredResources = resources.filter((resource) => {
        return ifResourceIncludedInBundle(
          resource,
          this.mediaReleaseId,
          this.profile
        );
      });

      injectResourceUrlForPlayerShells(filteredResources);
    });
  };
}
