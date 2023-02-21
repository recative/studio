/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import { join } from 'path';
import { stat } from 'fs/promises';
import { remove } from 'fs-extra';

import { Zip } from '@recative/extension-sdk';
import {
  TerminalMessageLevel as Level,
  TerminalMessageLevel,
} from '@recative/studio-definitions';
import type { IBundleProfile } from '@recative/extension-sdk';

import { dumpPlayerConfigs } from './publishPlayerBundle';
import {
  logToTerminal,
  wrapTaskFunction,
  newTerminalSession,
} from './terminal';

import { bundleMediaResources } from './utils/bundleMediaResources';
import { duplicateBasePackage } from './utils/duplicateBasePackage';
import { duplicateWebRootPackage } from './utils/duplicateWebRootPackage';
import { bundleAdditionalModules } from './utils/bundleAdditionalModules';
import { transferActPointArtifacts } from './utils/transferActPointArtifacts';

import { getBuildPath } from './setting';

import { getBundlerInstances } from '../../utils/getBundlerInstance';
import {
  ifIsPostProcessed,
  getResourceFilePath,
} from '../../utils/getResourceFile';

import { getDb } from '../db';
import { getWorkspace } from '../workspace';
import { getVersionName } from './utils/getVersionName';

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

export type ResourceSource = 'postProcessed' | 'raw' | 'unknown';
export interface IAnalysisReportUnit {
  size: number;
  count: number;
}

export const createBundles = async <Dry extends boolean>(
  profiles: string[],
  bundleReleaseId: number,
  dryRun = false as Dry,
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

  if (terminalId === 'createBundles') {
    const tasks = profiles.map((profileId) => {
      const profile = bundleProfiles.find((x) => x.id === profileId);
      if (!profile) {
        logToTerminal(
          terminalId,
          `Profile ${profileId} not found, will skip it`,
          TerminalMessageLevel.Warning
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

  const analysisResult: [
    string,
    Map<string, Map<string, Map<ResourceSource, IAnalysisReportUnit>>>
  ][] = [];

  for (let i = 0; i < profiles.length; i += 1) {
    const profileId = profiles[i];

    const taskName = profileIdToTaskNameMap.get(profileId);
    if (!taskName) {
      logToTerminal(
        terminalId,
        `Task name of profile ${profileId} not found`,
        TerminalMessageLevel.Warning
      );

      continue;
    }

    const profile = bundleProfiles.find((x) => x.id === profileId);
    if (!profile) {
      logToTerminal(
        terminalId,
        `Profile ${profileId} not found`,
        Level.Warning
      );

      continue;
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

    let version = 'UNKNOWN';

    try {
      version = await getVersionName(
        bundleReleaseId,
        profile.webRootTemplateFileName,
        profile.shellTemplateFileName
      );
    } catch (e) {
      logToTerminal(terminalId, `Failed to get the version name`, Level.Error);
    }

    const instances = await getBundlerInstances(terminalId);
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

    if (!dryRun) {
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
        await zip.appendText(
          version,
          `${appTemplatePublicPath}/bundle/ap/dist/version.txt`
        );
        await zip.appendText(version, `${appTemplatePublicPath}/version.txt`);
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
    } else {
      const resources = await bundleMediaResources(
        null,
        bundleReleaseId,
        release.mediaBuildId,
        `${appTemplatePublicPath}/bundle/resource`,
        profile,
        terminalId
      );

      // Episode ID / MIME / Post processed or original
      const episodeIdMap = new Map<
        string,
        Map<string, Map<ResourceSource, IAnalysisReportUnit>>
      >();

      for (let j = 0; j < resources.length; j += 1) {
        const resource = resources[j];

        if (resource.type !== 'file') {
          continue;
        }

        const episodeIdSign = [...new Set(resource.episodeIds)]
          .sort()
          .join(', ');
        const mimeSign = resource.mimeType.split(';')[0];
        const postProcessedSign =
          (await ifIsPostProcessed(resource)) ?? 'unknown';

        const mimeMap =
          episodeIdMap.get(episodeIdSign) ??
          new Map<string, Map<ResourceSource, IAnalysisReportUnit>>();
        episodeIdMap.set(episodeIdSign, mimeMap);

        const postProcessedMap =
          mimeMap.get(mimeSign) ??
          new Map<ResourceSource, IAnalysisReportUnit>();
        mimeMap.set(mimeSign, postProcessedMap);

        const filePath = await getResourceFilePath(resource);
        const fileStat = await stat(filePath);

        const reportElement = postProcessedMap.get(postProcessedSign) ?? {
          size: 0,
          count: 0,
        };

        reportElement.size += fileStat.size;
        reportElement.count += 1;

        postProcessedMap.set(postProcessedSign, reportElement);
      }

      analysisResult.push([profile.id, episodeIdMap]);
    }
  }

  return analysisResult;
};
