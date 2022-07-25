import { PlayerShellProfile } from './playerShellProfile';
import { ApPackLivePreviewProfile } from './apPackLivePreviewProfile';
import { ApPackDistPreviewProfile } from './apPackDistPreviewProfile';

import type { IPlayerShellProfileConfig } from './playerShellProfile';
import type { IApPackLivePreviewProfileConfig } from './apPackLivePreviewProfile';
import type { IApPackDistPreviewProfileConfig } from './apPackDistPreviewProfile';

export type PlayerShellProfileConfig = IPlayerShellProfileConfig & {
  type: 'playerShell';
};
export type ApPackPreviewProfileConfig = IApPackLivePreviewProfileConfig & {
  type: 'apPackLivePreview';
};
export type StudioPreviewProfileConfig = IApPackDistPreviewProfileConfig & {
  type: 'apPackDistPreview';
};

export type ProfileConfig =
  | PlayerShellProfileConfig
  | ApPackPreviewProfileConfig
  | StudioPreviewProfileConfig;

export const getProfile = ({ type, ...config }: ProfileConfig) => {
  if (type === 'playerShell') {
    return new PlayerShellProfile(
      (config as IPlayerShellProfileConfig).codeReleaseId
    );
  }
  if (type === 'apPackLivePreview') {
    const thisConfig = config as IApPackLivePreviewProfileConfig;
    return new ApPackLivePreviewProfile(
      thisConfig.resourceHostName,
      thisConfig.apHostName,
      thisConfig.apProtocol
    );
  }
  if (type === 'apPackDistPreview') {
    const thisConfig = config as IApPackDistPreviewProfileConfig;
    return new ApPackDistPreviewProfile(
      thisConfig.resourceHostName,
      thisConfig.apProtocol
    );
  }
  throw new Error(`Unknown profile type: ${type}`);
};
