import { join, dirname } from 'path';
import { homedir } from 'os';
import glob from 'glob';

export const HOME_DIR = join(homedir(), '.ap-studio');
export const ANDROID_CONFIG_PATH = join(HOME_DIR, 'android');
const buildToolsPath = glob.sync(
  join(ANDROID_CONFIG_PATH, 'build-tools', '**', 'core-lambda-stubs.jar')
);

export const ANDROID_BUILD_TOOLS_PATH = buildToolsPath[0]
  ? dirname(buildToolsPath[0])
  : null;
