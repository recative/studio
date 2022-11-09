import proto from 'protobufjs';
import StreamZip from 'node-stream-zip';

import { join } from 'path';
import { remove } from 'fs-extra';
import { fileSync } from 'tmp';

import {
  ffmpeg,
  ffprobe,
  waveform,
  screenshot,
  imageThumbnail,
} from '@recative/extension-sdk';
import type {
  TOOLS,
  Bundler,
  IBundleProfile,
  IBundlerExtensionDependency,
} from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import { extensions } from '../extensions';
import { getBuildPath } from '../rpc/query/setting';
import { getWorkspace } from '../rpc/workspace';
import { logToTerminal } from '../rpc/query/terminal';
import { getVersionName } from '../rpc/query/utils/getVersionName';
import { STUDIO_BINARY_PATH } from '../constant/appPath';
import { HOME_DIR, ANDROID_BUILD_TOOLS_PATH } from '../constant/configPath';

import { promisifySpawn, SpawnFailedError } from './promiseifySpawn';

const bundlerDependencies: IBundlerExtensionDependency = {
  /** We replace these later */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  executeExternalTool: null as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  prepareOutputFile: null as any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getOutputFilePath: null as any,
  getBuildInProtoDefinition: (fileName: string) => {
    const protoPath = join(STUDIO_BINARY_PATH, fileName);

    return proto.load(protoPath);
  },
  /** We replace it later */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logToTerminal: null as any,
  readBundleTemplate: async (profile: IBundleProfile) => {
    const workspace = getWorkspace();

    return new StreamZip.async({
      file: join(workspace.assetsPath, profile.shellTemplateFileName),
    });
  },
  readZipFile: (path: string) => {
    return new StreamZip.async({
      file: path,
    });
  },
  getTemporaryFile: () => {
    return fileSync().name;
  },
  getVersionName: (bundleReleaseId: number, profile: IBundleProfile) => {
    return getVersionName(
      bundleReleaseId,
      profile.webRootTemplateFileName,
      profile.shellTemplateFileName
    );
  },
  getAssetFilePath: (path: string) => {
    const workspace = getWorkspace();

    return join(workspace.assetsPath, path);
  },
  getLocalConfigFilePath: (path: string) => {
    return join(HOME_DIR, path);
  },
  ffmpeg,
  ffprobe,
  waveform,
  screenshot,
  imageThumbnail,
};

export const getBundlerInstances = async (terminalId: string) => {
  const bundlers: Record<string, Bundler<string>> = {};

  extensions.forEach((extension) => {
    const extensionBundler = extension.bundler;

    extensionBundler?.forEach((BundlerClass) => {
      const bundler: Bundler<string> =
        // @ts-ignore
        new BundlerClass({}, { ...bundlerDependencies });

      bundler.dependency.executeExternalTool = async (
        toolId: typeof TOOLS[number],
        parameters: string[],
        executeInBuildPath: boolean
      ) => {
        const buildPath = await getBuildPath();
        const isJavaTool = ['bundletool', 'apksigner'].includes(toolId);
        const isBuildInTool = ['apktool', 'bundletool', 'jarsigner'].includes(
          toolId
        );
        const isMultiPlatformBinary = ['jarsigner'].includes(toolId);
        const isAndroidExternalTool = ['zipalign', 'aapt2'].includes(toolId);
        const isAndroidExternalLibTool = ['apksigner'].includes(toolId);

        if (
          (isAndroidExternalTool || isAndroidExternalLibTool) &&
          !ANDROID_BUILD_TOOLS_PATH
        ) {
          throw new SpawnFailedError(
            `Android build tools path is not set. Please set ANDROID_BUILD_TOOLS_PATH environment variable.`,
            parameters,
            -1
          );
        }

        let path = STUDIO_BINARY_PATH;

        if (isAndroidExternalTool) {
          path = ANDROID_BUILD_TOOLS_PATH ?? '';
        }

        if (isBuildInTool) {
          path = STUDIO_BINARY_PATH;
        }

        if (isAndroidExternalLibTool) {
          path = join(ANDROID_BUILD_TOOLS_PATH ?? '', 'lib');
        }

        const internalParameters: string[] = [];
        const commandSuffix = isMultiPlatformBinary
          ? `-${process.platform}-${process.arch}`
          : '';
        const executable = isJavaTool
          ? 'java'
          : join(path, `${toolId}${commandSuffix}`);

        if (isJavaTool) {
          internalParameters.push('-jar');
          internalParameters.push(join(path, `${toolId}.jar`));
        }

        await promisifySpawn(
          executable,
          [...internalParameters, ...parameters],
          executeInBuildPath ? { cwd: buildPath } : undefined,
          terminalId
        );

        return executable;
      };

      bundler.dependency.logToTerminal = (
        message: string | [string, string],
        logLevel?: TerminalMessageLevel
      ) => {
        logToTerminal(terminalId, message, logLevel);
      };

      bundler.dependency.getOutputFilePath = async (
        suffix,
        bundleReleaseId,
        profile
      ) => {
        const buildPath = await getBuildPath();

        const outputFileName = `${Reflect.get(
          bundler.constructor,
          'outputPrefix'
        )}-${profile.prefix}-${bundleReleaseId.toString().padStart(4, '0')}${
          suffix ? `-${suffix}` : ''
        }.${Reflect.get(bundler.constructor, 'outputExtensionName')}`;

        const outputPath = join(buildPath, outputFileName);

        return outputPath;
      };
      bundler.dependency.prepareOutputFile = async (
        suffix,
        bundleReleaseId,
        profile
      ) => {
        const buildPath = await getBuildPath();

        const outputFileName = await bundlers[
          BundlerClass.id
        ].dependency.getOutputFilePath(suffix, bundleReleaseId, profile);

        await remove(join(buildPath, outputFileName));

        return join(buildPath, outputFileName);
      };

      bundlers[BundlerClass.id] = bundler;
    });
  });

  return bundlers;
};
