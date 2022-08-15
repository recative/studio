import { IBundleProfile } from '@recative/extension-sdk';
import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { ifResourceIncludedInBundle } from './utils/ifResourceIncludedInBundle';

import { injectResourceUrlForPlayerShells } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForPlayerShells } from '../utils/injectActPointUrl';

export interface IBundlerProfileConfig {
  codeReleaseId: number;
}

export class BundlerProfile implements ClientProfile {
  constructor(
    private codeReleaseId: number,
    private mediaReleaseId: number,
    private profile: IBundleProfile
  ) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    return injectEntryPointUrlForPlayerShells(x, this.codeReleaseId);
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    const result = x.map((resource) => {
      if (
        ifResourceIncludedInBundle(resource, this.mediaReleaseId, this.profile)
      ) {
        return injectResourceUrlForPlayerShells([resource])[0];
      }

      return resource;
    });

    return result;
  };
}
