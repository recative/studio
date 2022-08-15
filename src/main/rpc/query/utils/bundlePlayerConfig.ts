import { join } from 'path';
import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getBuildPath } from '../setting';

/**
 * Add `player-xxx` dir to the archiver bundle with `archiverAppendDir`
 * This dir includes metadata of all episodes
 *
 * @param zip The archiver instance.
 * @param bundleReleaseId The release id of the bundle release.
 * @param playerConfigPath The path of player configuration.
 * @param terminalId Output information to which terminal.
 */
export const bundlePlayerConfig = async (
  zip: Zip,
  bundleReleaseId: number,
  playerConfigPath: string,
  configFormat: 'json' | 'bson' | 'uson',
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const bundleConfigPath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`,
    'data',
    configFormat
  );

  logToTerminal(terminalId, `Bundle player config`, Level.Info);

  return zip.appendDir(bundleConfigPath, join(playerConfigPath, 'data'));
};
