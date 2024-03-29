import { join } from 'path';
import { pathExists } from 'fs-extra';

import { Zip, IPathListItem } from '@recative/extension-sdk';
import { TerminalMessageLevel as Level } from '@recative/studio-definitions';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';

export const bundleAdditionalModules = async (
  zip: Zip,
  rootDir: string,
  terminalId: string
) => {
  const workspace = getWorkspace();

  const { assetsPath } = workspace;

  const paths: IPathListItem[] = [];

  const containerComponentsPath = join(
    assetsPath,
    'components',
    'containerComponents.js'
  );

  logToTerminal(terminalId, `Bundle additional modules`, Level.Info);

  if (await pathExists(containerComponentsPath)) {
    paths.push({
      from: containerComponentsPath,
      to: `${rootDir}/bundle/data/containerComponents.js`,
    });
  } else {
    logToTerminal(
      terminalId,
      `:: ${containerComponentsPath} not found`,
      Level.Warning
    );
  }

  return zip.appendFileList(paths);
};
