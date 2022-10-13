import { IActPoint } from '@recative/definitions';

import {
  DESKTOP_SHELL_KEY,
  RESOURCE_MANAGER_KEY,
  MOBILE_SHELL_BUILD_IN_KEY,
  MOBILE_SHELL_CACHED_KEY,
} from './buildInResourceUploaderKeys';

import {
  getEntryPointsFromApPackPreview,
  getEntryPointsFromCodeRelease,
} from './getEntryPoints';

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
  manifest: Record<string, string> | null,
  pattern = constructResourceManagerUrlPattern(),
  key = RESOURCE_MANAGER_KEY
): IActPoint[] => {
  return actPoints.map((actPoint) => {
    const entryPointHTMLFile = !manifest
      ? 'index.html'
      : Object.entries(manifest).find(([manifestKey]) => {
          const sKey = manifestKey.toLowerCase();
          return (
            sKey.startsWith(actPoint.fullPath.toLowerCase()) &&
            sKey.endsWith('.html')
          );
        })?.[1];

    const splitedEntryPoint = (entryPointHTMLFile || '404')
      .split(/[/\\]+/)
      .filter(Boolean);

    const htmlPath = splitedEntryPoint.slice(-3).join('/');

    const url = pattern.replaceAll('$htmlPath', htmlPath);

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
  const manifest = await getEntryPointsFromApPackPreview(apHost, apProtocol);
  const step0 = injectActPointEntryPointsUrl(
    actPoints,
    manifest,
    constructResourceManagerUrlPattern(apHost, apProtocol)
  );

  const step1 = injectActPointEntryPointsUrl(
    step0,
    manifest,
    'http://localhost:12453/notExists',
    '@recative/uploader-extension-error/not-exists'
  );

  return step1;
};

export const injectEntryPointUrlForPlayerShells = async (
  actPoints: IActPoint[],
  codeReleaseId: number
) => {
  const manifest = await getEntryPointsFromCodeRelease(codeReleaseId);

  const step0 = injectActPointEntryPointsUrl(
    actPoints,
    manifest,
    DESKTOP_SHELL_URL_PATTERN,
    DESKTOP_SHELL_KEY
  );
  const step1 = injectActPointEntryPointsUrl(
    step0,
    manifest,
    MOBILE_SHELL_BUILD_IN_URL_PATTERN,
    MOBILE_SHELL_BUILD_IN_KEY
  );
  const step2 = injectActPointEntryPointsUrl(
    step1,
    manifest,
    MOBILE_SHELL_CACHED_URL_PATTERN,
    MOBILE_SHELL_CACHED_KEY
  );

  return step2;
};
