import { join } from 'path';
import { existsSync } from 'fs-extra';

import {
  Zip,
  IPathListItem,
  TerminalMessageLevel as Level,
} from '@recative/extension-sdk';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';

export const bundleAdditionalModules = (
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

  if (existsSync(containerComponentsPath)) {
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
