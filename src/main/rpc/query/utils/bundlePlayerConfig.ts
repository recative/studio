import { join } from 'path';
import type { Archiver } from 'archiver';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { archiverAppendDir } from '../../../utils/archiver';
import { getBuildPath } from '../setting';

/**
 * Add `player-xxx` dir to the archiver bundle with `archiverAppendDir`
 * This dir includes metadata of all episodes
 *
 * @param archive The archiver instance.
 * @param bundleReleaseId The release id of the bundle release.
 * @param playerConfigPath The path of player configuration.
 * @param terminalId Output information to which terminal.
 */
export const bundlePlayerConfig = async (
  archive: Archiver,
  bundleReleaseId: number,
  playerConfigPath: string,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const bundleConfigPath = join(
    buildPath,
    `player-${bundleReleaseId.toString().padStart(4, '0')}`
  );

  logToTerminal(terminalId, `Bundle player config`, Level.Info);

  return archiverAppendDir(archive, bundleConfigPath, playerConfigPath);
};
