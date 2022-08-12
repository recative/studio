import { join } from 'path';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';

/**
 * Copy the apk template to assets directory in the workspace.
 *
 * @param zip The archiver instance.
 * @param templatePackageFileName The file name of template package, like
 *        `template.apk`.
 * @param publicPath The path for web root bundle and media bundle.
 * @param terminalId Output information to which terminal.
 */
export const duplicateBasePackage = async (
  zip: Zip,
  templatePackageFileName: string,
  templateFromPath: string | null,
  publicPath: string,
  excludeFilePaths: string[],
  terminalId: string
) => {
  logToTerminal(terminalId, `Copy base package`, Level.Info);

  const workspace = getWorkspace();

  const basePackagePath = join(workspace.assetsPath, templatePackageFileName);

  return zip.transfer(basePackagePath, templateFromPath, null, [
    publicPath,
    ...excludeFilePaths,
  ]);
};
