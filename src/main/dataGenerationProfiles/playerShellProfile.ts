import type {
  ClientProfile,
  InjectApEntryPointsFunction,
  InjectResourceUrlsFunction,
} from './types';

import { injectResourceUrlForPlayerShells } from '../utils/injectResourceUrl';
import { injectEntryPointUrlForPlayerShells } from '../utils/injectActPointUrl';

export interface IPlayerShellProfileConfig {
  codeReleaseId: number;
}

export class PlayerShellProfile implements ClientProfile {
  constructor(private codeReleaseId: number) {}

  injectApEntryPoints: InjectApEntryPointsFunction = (x) => {
    return injectEntryPointUrlForPlayerShells(x, this.codeReleaseId);
  };

  injectResourceUrls: InjectResourceUrlsFunction = (x) => {
    return injectResourceUrlForPlayerShells(x);
  };
}
