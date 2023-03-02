import StreamZip from 'node-stream-zip';

import { readFile } from 'fs/promises';

import { xxHash, IDeployDependency, Deployer } from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import { getDb } from '../rpc/db';
import { extensions } from '../extensions';
import { logToTerminal } from '../rpc/query/terminal';

const deployerDependencies: IDeployDependency = {
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logToTerminal: null as any,
  readZipFile: (path: string) => {
    return new StreamZip.async({
      file: path,
    });
  },
  GetFileBinary: (x: string) => () => readFile(x),
  getXxHashOfFile: async (path) => {
    return xxHash(await readFile(path));
  },
  getXxHashOfBuffer: (buffer) => {
    return xxHash(buffer);
  },
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: null as any,
};

export const getDeployerInstances = async (terminalId: string) => {
  const db = await getDb();
  const deployerMap: Record<string, Deployer<string>> = {};

  extensions.forEach((extension) => {
    const extensionDeployer = extension.deployer;

    extensionDeployer?.forEach((DeployerClass) => {
      const deployer: Deployer<string> =
        // @ts-ignore
        new DeployerClass({}, { ...deployerDependencies });

      deployer.dependency.logToTerminal = (
        message: string | [string, string],
        logLevel?: TerminalMessageLevel
      ) => {
        logToTerminal(terminalId, message, logLevel);
      };

      deployer.dependency.db = db;
      deployerMap[DeployerClass.id] = deployer;
    });
  });

  return deployerMap;
};
