/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import { join } from 'path';
import { remove } from 'fs-extra';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';
import type { IBundleProfile } from '@recative/extension-sdk';

import { dumpPlayerConfigs } from './publishPlayerBundle';
import {
  wrapTaskFunction,
  newTerminalSession,
  logToTerminal,
} from './terminal';

import { bundleMediaResources } from './utils/bundleMediaResources';
import { duplicateBasePackage } from './utils/duplicateBasePackage';
import { duplicateWebRootPackage } from './utils/duplicateWebRootPackage';
import { bundleAdditionalModules } from './utils/bundleAdditionalModules';
import { transferActPointArtifacts } from './utils/transferActPointArtifacts';

import { getBuildPath } from './setting';

import { getBundlerInstances } from '../../utils/getExtensionInstances';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';

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

const RAW_EXTENSION_ID = '@recative/extension-raw/RawBundler';

export const createBundles = async (
  profiles: string[],
  bundleReleaseId: number,
  terminalId = 'createBundles'
) => {
  const workspace = getWorkspace();
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

    const taskName = `Bundling ${profile.label}`;
    profileIdToTaskNameMap.set(profileId, taskName);

    return taskName;
  });

  newTerminalSession(terminalId, tasks);

  const instances = await getBundlerInstances(terminalId);
  const buildPath = await getBuildPath();

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

    const title = `== ${profile.label} (${profile.bundleExtensionId}) ==`;
    logToTerminal(
      terminalId,
      Array(title.length).fill('=').join(''),
      Level.Info
    );
    logToTerminal(terminalId, title, Level.Info);
    logToTerminal(
      terminalId,
      Array(title.length).fill('=').join(''),
      Level.Info
    );

    const bundler = instances[profile.bundleExtensionId];

    const appTemplatePublicPath = Reflect.get(
      bundler.constructor,
      'appTemplatePublicPath'
    );

    const outputFileName = `${Reflect.get(
      bundler.constructor,
      'outputPrefix'
    )}-${profile.prefix}-${bundleReleaseId
      .toString()
      .padStart(4, '0')}.${Reflect.get(
      bundler.constructor,
      'outputExtensionName'
    )}`;

    const outputPath = join(buildPath, outputFileName);

    await remove(outputPath);

    const zip = new Zip(outputPath, {
      zlib: { level: 0 },
    });

    await wrapTaskFunction(terminalId, taskName, async () => {
      if (profile.bundleExtensionId !== RAW_EXTENSION_ID) {
        if (profile.shellTemplateFileName) {
          await duplicateBasePackage(
            zip,
            profile.shellTemplateFileName,
            Reflect.get(bundler.constructor, 'appTemplateFromPath'),
            Reflect.get(bundler.constructor, 'outputPublicPath'),
            Reflect.get(bundler.constructor, 'excludeTemplateFilePaths'),
            terminalId
          );
        }

        if (profile.webRootTemplateFileName) {
          await duplicateWebRootPackage(
            zip,
            profile.webRootTemplateFileName,
            Reflect.get(bundler.constructor, 'appTemplatePublicPath'),
            Reflect.get(bundler.constructor, 'excludeWebRootFilePaths'),
            terminalId
          );
        }
      }

      await transferActPointArtifacts(
        zip,
        release.codeBuildId,
        `${appTemplatePublicPath}/bundle/ap`,
        terminalId
      );

      await dumpPlayerConfigs(
        zip,
        release.mediaBuildId,
        release.codeBuildId,
        bundleReleaseId,
        appTemplatePublicPath,
        profile,
        terminalId
      );
      await zip.appendFile(
        join(workspace.assetsPath, profile.constantFileName),
        `${appTemplatePublicPath}/bundle/ap/dist/constants.json`
      );
      await zip.appendFile(
        join(workspace.assetsPath, profile.constantFileName),
        `${appTemplatePublicPath}/constants.json`
      );
      await bundleAdditionalModules(zip, appTemplatePublicPath, terminalId);

      await bundleMediaResources(
        zip,
        bundleReleaseId,
        release.mediaBuildId,
        `${appTemplatePublicPath}/bundle/resource`,
        profile,
        terminalId
      );

      await bundler.beforeBundleFinalized?.(zip, profile, bundleReleaseId);

      await zip.done();

      await bundler.afterBundleCreated?.(zip, profile, bundleReleaseId);
    })();
  }
};
