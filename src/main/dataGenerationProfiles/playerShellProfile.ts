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

import { createVoidEntryPointResource } from './utils/createVoidEntryPointResource';

export interface IPlayerShellProfileConfig {
  codeReleaseId: number;
}

export class PlayerShellProfile implements ClientProfile {
  constructor(public codeReleaseId: number) {}

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
    return injectResourceUrlForPlayerShells(x);
  };
}
