/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import { join } from 'path';

import { Category } from '@recative/definitions';
import {
  AcceptedBuildType,
  IBundleMetadata,
  IDeployProfile,
} from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import {
  logToTerminal,
  wrapTaskFunction,
  newTerminalSession,
} from './terminal';

import { getBuildPath } from './setting';

import { PromiseQueue } from '../../utils/PromiseQueue';
import { getBundlerInstances } from '../../utils/getBundlerInstance';
import { getDeployerInstances } from '../../utils/getDeployerInstances';
import { getUploaderInstances } from '../../utils/getResourceProcessorInstances';

import { getDb } from '../db';

export const listDeployProfile = async () => {
  const db = await getDb();

  return db.setting.uploadProfiles.find();
};

export const getDeployProfile = async (id: string) => {
  const db = await getDb();

  return db.setting.uploadProfiles.findOne({ id });
};

export const addDeployProfile = async (profile: IDeployProfile) => {
  const db = await getDb();

  db.setting.uploadProfiles.insert(profile);
};

export const updateOrInsertDeployProfile = async (profile: IDeployProfile) => {
  const db = await getDb();

  const q = db.setting.uploadProfiles.findOne({ id: profile.id });
  if (q) {
    db.setting.uploadProfiles.update({ ...q, ...profile });
  } else {
    db.setting.uploadProfiles.insert(profile);
  }
};

export const removeDeployProfile = async (profile: IDeployProfile | string) => {
  const db = await getDb();

  if (typeof profile === 'string') {
    db.setting.uploadProfiles.removeWhere({ id: profile });
  } else {
    db.setting.uploadProfiles.removeWhere({ id: profile.id });
  }
};

export const deployBundles = async (
  profiles: string[],
  bundleReleaseId: number,
  terminalId = 'deployBundles'
) => {
  const db = await getDb();

  const seriesId = db.series.metadata.findOne({})?.id;
  if (!seriesId) throw new Error('Series id not found!');

  const deployProfiles = db.setting.uploadProfiles.find({
    id: { $in: profiles },
  });

  const release = db.release.bundleReleases.findOne({ id: bundleReleaseId });

  if (!release) {
    throw new TypeError(`Bundle release ${bundleReleaseId} not found`);
  }

  const profileIdToTaskNameMap = new Map<string, string>();

  if (terminalId === 'deployBundles') {
    const tasks = profiles.map((profileId) => {
      const profile = deployProfiles.find((x) => x.id === profileId);
      if (!profile) {
        logToTerminal(
          terminalId,
          `Profile ${profileId} not found, will skip it`,
          Level.Warning
        );
        return '';
      }

      const taskName = `Bundling ${profile.label}`;
      profileIdToTaskNameMap.set(profileId, taskName);

      return taskName;
    });

    newTerminalSession(terminalId, tasks.filter(Boolean));
  }

  const buildPath = await getBuildPath();
  const uploaderInstances = await getUploaderInstances([Category.ApBundle], []);
  const bundlerInstances = await getBundlerInstances(terminalId);
  const deployerInstances = await getDeployerInstances(terminalId);

  for (let i = 0; i < profiles.length; i += 1) {
    const profileId = profiles[i];

    const taskName = profileIdToTaskNameMap.get(profileId);
    if (!taskName) {
      logToTerminal(
        terminalId,
        `Task name of profile ${profileId} not found`,
        Level.Warning
      );

      continue;
    }

    const deployProfile = deployProfiles.find((x) => x.id === profileId);
    if (!deployProfile) {
      logToTerminal(
        terminalId,
        `Bundler profile ${profileId} not found`,
        Level.Warning
      );

      continue;
    }

    const bundleProfile = db.setting.bundleProfiles.findOne({
      id: deployProfile.sourceBuildProfileId,
    });
    if (!bundleProfile) {
      logToTerminal(
        terminalId,
        `Bundler profile ${profileId} not found`,
        Level.Warning
      );

      continue;
    }

    const outputMetadata =
      deployProfile.sourceBuildProfileId ===
      '@recative/build-in-profile/code-bundle'
        ? ((): IBundleMetadata => {
            const bundleRelease = db.release.bundleReleases.findOne({
              id: bundleReleaseId,
            });

            if (!bundleRelease) throw new TypeError(`Bundle release not found`);

            return {
              fileName: `code-${bundleRelease.codeBuildId
                .toString()
                .padStart(4, '0')}.zip`,
              type: AcceptedBuildType.Zip,
            };
          })()
        : (() => {
            const bundler = bundlerInstances[bundleProfile.bundleExtensionId];
            if (!bundler) {
              logToTerminal(
                terminalId,
                `Bundler profile ${profileId} not found`,
                Level.Warning
              );

              return null;
            }

            return bundler.getBundleMetadata(bundleProfile, bundleReleaseId);
          })();

    if (!outputMetadata) {
      continue;
    }

    const uploader = uploaderInstances[deployProfile.targetUploaderId];
    if (!uploader) {
      logToTerminal(
        terminalId,
        `Uploader profile ${profileId} not found`,
        Level.Warning
      );

      continue;
    }

    await uploader.uploader.initializeUpload?.();

    const title = `== ${deployProfile.label} (${deployProfile.targetUploaderId}) ==`;
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

    const deployer = deployerInstances[deployProfile.deployerId];

    const outputPath = join(buildPath, outputMetadata.fileName);

    await wrapTaskFunction(terminalId, taskName, async () => {
      logToTerminal(
        terminalId,
        `:: Analysing bundle: ${deployProfile.deployerId}`
      );
      const analysisResult = await deployer.analysisBundle(
        outputPath,
        deployProfile,
        bundleReleaseId
      );

      logToTerminal(terminalId, `:: File acquired: ${analysisResult.length}`);

      const taskQueue = new PromiseQueue(5);

      const bundleReleaseIdStr = bundleReleaseId.toString().padStart(4, '0');

      const path = deployProfile.pathOverride
        ? deployProfile.pathOverride
            .replace(':seriesId', seriesId)
            .replace(':bundleReleaseId', bundleReleaseIdStr)
        : join(seriesId, 'bundle', bundleReleaseIdStr).replaceAll('\\', '/');

      analysisResult.forEach((file) => {
        taskQueue.enqueue(async () =>
          uploader.uploader.upload(await file.getBinary(), file.key, path)
        );
      });

      await taskQueue.run();

      logToTerminal(terminalId, `:: All file processed`);

      await uploader.uploader.finalizeUpload?.();

      logToTerminal(terminalId, `:: Finalized`);
    })();
  }
};
