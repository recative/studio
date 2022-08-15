import type { IBundleProfile } from '@recative/extension-sdk';

import { BundlerProfile } from './bundlerProfile';
import { PlayerShellProfile } from './playerShellProfile';
import { ApPackLivePreviewProfile } from './apPackLivePreviewProfile';
import { ApPackDistPreviewProfile } from './apPackDistPreviewProfile';

import type { IBundlerProfileConfig } from './bundlerProfile';
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
export type BundleProfileConfig = IBundlerProfileConfig & {
  type: 'bundleProfile';
  mediaReleaseId: number;
  codeReleaseId: number;
  bundleProfile: IBundleProfile;
};

export type ProfileConfig =
  | PlayerShellProfileConfig
  | ApPackPreviewProfileConfig
  | StudioPreviewProfileConfig
  | BundleProfileConfig;

// TODO: Let's refactor this part later to make sure it can fit the plugin system.
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
  if (type === 'bundleProfile') {
    const thisConfig = config as BundleProfileConfig;
    return new BundlerProfile(
      thisConfig.codeReleaseId,
      thisConfig.mediaReleaseId,
      thisConfig.bundleProfile
    );
  }
  throw new Error(`Unknown profile type: ${type}`);
};
