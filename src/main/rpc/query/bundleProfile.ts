/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import { join } from 'path';

import { Zip } from '@recative/extension-sdk';
import type { IBundleProfile } from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/definitions';

import { dumpPlayerConfigs } from './publishPlayerBundle';
import {
  logToTerminal,
  wrapTaskFunction,
  newTerminalSession,
} from './terminal';

import { bundlePlayerConfig } from './utils/bundlePlayerConfig';
import { duplicateBasePackage } from './utils/duplicateBasePackage';
import { duplicateWebRootPackage } from './utils/duplicateWebRootPackage';
import { bundleAdditionalModules } from './utils/bundleAdditionalModules';
import { transferActPointArtifacts } from './utils/transferActPointArtifacts';
import { bundleMediaResourcesWithoutEpisodeOrWithCacheProperty } from './utils/bundleMediaResourcesWithoutEpisodeOrWithCacheProperty';

import { getBuildPath } from './setting';

import { getBundlerInstances } from '../../utils/getExtensionInstances';

import { getDb } from '../db';

export const listBundleProfile = async () => {
  const db = await getDb();

  return db.setting.bundleProfiles.find();
};

export const getBundleProfile = async (id: string) => {
  const db = await getDb();

  return db.setting.bundleProfiles.findOne({ id });
};

export const addBundleProfile = async (profile: IBundleProfile) => {
  const db = await getDb();

  db.setting.bundleProfiles.insert(profile);
};

export const updateOrInsertBundleProfile = async (profile: IBundleProfile) => {
  const db = await getDb();

  const q = db.setting.bundleProfiles.findOne({ id: profile.id });
  if (q) {
    db.setting.bundleProfiles.update({ ...q, ...profile });
  } else {
    db.setting.bundleProfiles.insert(profile);
  }
};

export const removeBundleProfile = async (profile: IBundleProfile | string) => {
  const db = await getDb();

  if (typeof profile === 'string') {
    db.setting.bundleProfiles.removeWhere({ id: profile });
  } else {
    db.setting.bundleProfiles.removeWhere({ id: profile.id });
  }
};

export const createBundles = async (
  profiles: string[],
  bundleReleaseId: number,
  terminalId = 'createBundles'
) => {
  const db = await getDb();

  const bundleProfiles = db.setting.bundleProfiles.find({
    id: { $in: profiles },
  });

  const release = db.release.bundleReleases.findOne({ id: bundleReleaseId });

  if (!release) {
    throw new TypeError(`Bundle release ${bundleReleaseId} not found`);
  }

  const profileIdToTaskNameMap = new Map<string, string>();
  const tasks = profiles.map((profileId) => {
    const profile = bundleProfiles.find((x) => x.id === profileId);
    if (!profile) {
      throw new TypeError(`Profile ${profileId} not found`);
    }

    const taskName = `Bundling ${Reflect.get(profile, 'label')}`;
    profileIdToTaskNameMap.set(profileId, taskName);

    return taskName;
  });

  newTerminalSession(terminalId, ['Dump player configurations', ...tasks]);

  await wrapTaskFunction(terminalId, 'Dump player configurations', async () => {
    dumpPlayerConfigs(release.codeBuildId, bundleReleaseId, terminalId);
  })();

  const instances = await getBundlerInstances(terminalId);

  for (let i = 0; i < profiles.length; i += 1) {
    const profileId = profiles[i];

    const taskName = profileIdToTaskNameMap.get(profileId);
    if (!taskName) {
      throw new TypeError(`Task name of profile ${profileId} not found`);
    }

    const profile = bundleProfiles.find((x) => x.id === profileId);
    if (!profile) {
      throw new TypeError(`Profile ${profileId} not found`);
    }

    const bundler = instances[profile.bundleExtensionId];

    const outputPublicPath = Reflect.get(bundler, 'outputPublicPath');

    const buildPath = await getBuildPath();

    const outputFileName = `${Reflect.get(bundler, 'outputPrefix')}-${
      profile.prefix
    }-${bundleReleaseId.toString().padStart(4, '0')}.${Reflect.get(
      bundler,
      'outputExtensionName'
    )}`;

    const outputPath = join(buildPath, outputFileName);

    const zip = new Zip(outputPath, {
      zlib: { level: 0 },
    });

    await wrapTaskFunction(terminalId, taskName, async () => {
      if (profile.shellTemplateFileName) {
        await duplicateBasePackage(
          zip,
          profile.shellTemplateFileName,
          Reflect.get(bundler, 'appTemplateFromPath'),
          Reflect.get(bundler, 'appTemplatePublicPath'),
          Reflect.get(bundler, 'excludeTemplateFilePaths'),
          terminalId
        );
      }

      if (profile.webRootTemplateFileName) {
        duplicateWebRootPackage(
          zip,
          profile.webRootTemplateFileName,
          Reflect.get(bundler, 'outputPublicPath'),
          terminalId
        );
      }
      await transferActPointArtifacts(
        zip,
        release.codeBuildId,
        `${outputPublicPath}/bundle/ap`,
        terminalId
      );
      await bundlePlayerConfig(
        zip,
        bundleReleaseId,
        `${outputPublicPath}/bundle`,
        profile.metadataFormat as any,
        terminalId
      );
      await bundleAdditionalModules(zip, outputPublicPath, terminalId);
      await bundleMediaResourcesWithoutEpisodeOrWithCacheProperty(
        zip,
        bundleReleaseId,
        release.mediaBuildId,
        `${outputPublicPath}/bundle/resource`,
        terminalId
      );

      await bundler.afterBundleCreated?.(zip, profile, bundleReleaseId);
    })();
  }
};
