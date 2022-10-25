import { IActPoint } from '@recative/definitions';

import {
  DESKTOP_SHELL_KEY,
  RESOURCE_MANAGER_KEY,
  MOBILE_SHELL_CACHED_KEY,
  MOBILE_SHELL_BUILD_IN_KEY,
} from './buildInResourceUploaderKeys';

const DESKTOP_SHELL_URL_PATTERN = 'recative://ap/dist/$htmlPath';
const MOBILE_SHELL_BUILD_IN_URL_PATTERN = '/bundle/ap/dist/$htmlPath';
const MOBILE_SHELL_CACHED_URL_PATTERN = 'http://localhost:34652/$htmlPath';

const constructResourceManagerUrlPattern = (
  apHostName = 'localhost:9999',
  apProtocol = 'http'
) => {
  return `${apProtocol}://${apHostName}/$htmlPath`;
};

export const injectActPointEntryPointsUrl = (
  actPoints: IActPoint[],
  pattern = constructResourceManagerUrlPattern(),
  key = RESOURCE_MANAGER_KEY
): IActPoint[] => {
  return actPoints.map((actPoint) => {
    const url = pattern.replaceAll('$htmlPath', 'index.html');

    return {
      ...actPoint,
      entryPoints: {
        ...actPoint.entryPoints,
        [key]: url,
      },
    };
  }) as IActPoint[];
};

export const injectEntryPointUrlForApPackLivePreview = async (
  actPoints: IActPoint[],
  apHost: string,
  apProtocol: string
) => {
  const step0 = injectActPointEntryPointsUrl(
    actPoints,
    constructResourceManagerUrlPattern(apHost, apProtocol)
  );

  const step1 = injectActPointEntryPointsUrl(
    step0,
    'http://localhost:12453/notExists',
    '@recative/uploader-extension-error/not-exists'
  );

  return step1;
};

export const injectEntryPointUrlForPlayerShells = async (
  actPoints: IActPoint[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _codeReleaseId: number
) => {
  const step0 = injectActPointEntryPointsUrl(
    actPoints,
    DESKTOP_SHELL_URL_PATTERN,
    DESKTOP_SHELL_KEY
  );
  const step1 = injectActPointEntryPointsUrl(
    step0,
    MOBILE_SHELL_BUILD_IN_URL_PATTERN,
    MOBILE_SHELL_BUILD_IN_KEY
  );
  const step2 = injectActPointEntryPointsUrl(
    step1,
    MOBILE_SHELL_CACHED_URL_PATTERN,
    MOBILE_SHELL_CACHED_KEY
  );

  return step2;
};
