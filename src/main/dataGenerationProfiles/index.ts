import { PlayerShellProfile } from './playerShellProfile';
import { ApPackPreviewProfile } from './apPackPreviewProfile';
import { StudioPreviewProfile } from './studioPreviewProfile';

import type { IPlayerShellProfileConfig } from './playerShellProfile';
import type { IApPackPreviewProfileConfig } from './apPackPreviewProfile';
import type { IStudioPreviewProfileConfig } from './studioPreviewProfile';

export type PlayerShellProfileConfig = IPlayerShellProfileConfig & {
  type: 'playerShell';
};
export type ApPackPreviewProfileConfig = IApPackPreviewProfileConfig & {
  type: 'apPackPreview';
};
export type StudioPreviewProfileConfig = IStudioPreviewProfileConfig & {
  type: 'studioPreview';
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
  if (type === 'apPackPreview') {
    const thisConfig = config as IApPackPreviewProfileConfig;
    return new ApPackPreviewProfile(
      thisConfig.resourceHostName,
      thisConfig.apHostName,
      thisConfig.apProtocol
    );
  }
  if (type === 'studioPreview') {
    const thisConfig = config as IStudioPreviewProfileConfig;
    return new StudioPreviewProfile(
      thisConfig.resourceHostName,
      thisConfig.apHostName,
      thisConfig.apProtocol
    );
  }
  throw new Error(`Unknown profile type: ${type}`);
};
