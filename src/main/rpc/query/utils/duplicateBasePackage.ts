import { join } from 'path';
import type { Archiver } from 'archiver';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';
import { transformFromZip } from '../../../utils/archiverTransformFromZip';

/**
 * Copy the apk template to assets directory in the workspace.
 *
 * @param archive The archiver instance.
 * @param templatePackageFileName The file name of template package, like
 *        `template.apk`.
 * @param publicPath The path for web root bundle and media bundle.
 * @param terminalId Output information to which terminal.
 */
export const duplicateBasePackage = async (
  archive: Archiver,
  templatePackageFileName: string,
  templateFromPath: string | null,
  publicPath: string,
  excludeFilePaths: string[],
  terminalId: string
) => {
  logToTerminal(terminalId, `Copy base package`, Level.Info);

  const workspace = getWorkspace();

  const basePackagePath = join(workspace.assetsPath, templatePackageFileName);

  return transformFromZip(archive, basePackagePath, templateFromPath, null, [
    publicPath,
    ...excludeFilePaths,
  ]);
};
