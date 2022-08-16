import { join } from 'path';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';

/**
 * Duplicate the web root path to the bundle.
 *
 * @param zip The archiver instance.
 * @param templatePackageFileName The file name of template package, like
 *        `template.apk`.
 * @param publicPath The path for web root bundle and media bundle.
 * @param terminalId Output information to which terminal.
 */
export const duplicateWebRootPackage = async (
  zip: Zip,
  templatePackageFileName: string,
  publicPath: string,
  excludeFilePaths: string[],
  terminalId: string
) => {
  logToTerminal(terminalId, `Copy web root package`, Level.Info);

  const workspace = getWorkspace();

  const basePackagePath = join(workspace.assetsPath, templatePackageFileName);

  return zip.transfer(basePackagePath, null, publicPath, excludeFilePaths);
};
