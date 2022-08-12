import { join } from 'path';

import { Zip } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/definitions';

import { getBuildPath } from '../setting';
import { logToTerminal } from '../terminal';

/**
 * Extract content of code build zip bundle and transfer them
 * into the `assets/public/bundle/ap` directory of the apk (a zip) file.
 *
 * @param zip The archiver instance.
 * @param codeReleaseId release ID of code release.
 * @param actPointArtifactsPath The act point build artifact should be placed to.
 * @param terminalId Output information to which terminal.
 */
export const transferActPointArtifacts = async (
  zip: Zip,
  codeReleaseId: number,
  actPointArtifactsPath: string,
  terminalId: string
) => {
  const buildPath = await getBuildPath();

  const codeBundlePath = join(
    buildPath,
    `code-${codeReleaseId.toString().padStart(4, '0')}.zip`
  );

  logToTerminal(terminalId, `Transfer act point artifacts`, Level.Info);

  // Traverse `codeBundleFileList` and copy all files in `codeBundleFileList` to
  // the `assets/public/bundle/ap` dir of apk file with streaming API.
  return zip.transfer(codeBundlePath, undefined, actPointArtifactsPath);
};
