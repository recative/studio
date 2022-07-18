import { join } from 'path';
import { existsSync } from 'fs-extra';

import type { Archiver } from 'archiver';

import { TerminalMessageLevel as Level } from '@recative/definitions';

import { logToTerminal } from '../terminal';

import { getWorkspace } from '../../workspace';
import { archiverAppendPathList } from '../../../utils/archiver';

import type { IPathListItem } from '../../../utils/archiver';

export const bundleAdditionalModules = (
  archive: Archiver,
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
      `Bundle additional modules: ${containerComponentsPath} not found`,
      Level.Warning
    );
  }

  return archiverAppendPathList(archive, paths).promise;
};
