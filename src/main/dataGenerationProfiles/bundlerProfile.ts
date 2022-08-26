import { produce } from 'immer';
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
