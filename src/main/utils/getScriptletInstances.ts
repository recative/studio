import { readFile } from 'fs/promises';

import {
  xxHash,
  Scriptlet,
  getFilePath,
  IScriptletDependency,
} from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import { getDb } from '../rpc/db';
import { importFile } from '../rpc/query/resource';
import { extensions } from '../extensions';
import { logToTerminal } from '../rpc/query/terminal';

import { getExtensionConfig } from './getExtensionConfig';
import { getResourceFilePath, getResourceFileBinary } from './getResourceFile';

const scriptletDependency: IScriptletDependency = {
  getFilePath,
  getResourceFilePath,
  getResourceFileBinary,
  getXxHashOfResourceFile: async (resource) => {
    const resourceFilePath = await getResourceFilePath(resource);
    return xxHash(await readFile(resourceFilePath));
  },
  getXxHashOfFile: async (path) => {
    return xxHash(await readFile(path));
  },
  importFile,
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: null as any,
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logToTerminal: logToTerminal as any,
};

export const getScriptletInstances = async (terminalId: string) => {
  const db = await getDb();
  const extensionConfig = await getExtensionConfig();

  const scriptlets: Record<string, Scriptlet<string>> = {};

  extensions.forEach((extension) => {
    const extensionScriptlet = extension.scriptlet;

    extensionScriptlet?.forEach((ScriptletClass) => {
      const scriptlet: Scriptlet<string> =
        // @ts-ignore
        new ScriptletClass(extensionConfig[ScriptletClass.id], {
          ...scriptletDependency,
        });

      scriptlet.dependency.logToTerminal = (
        message: string | [string, string],
        logLevel?: TerminalMessageLevel
      ) => {
        logToTerminal(terminalId, message, logLevel);
      };
      scriptlet.dependency.db = db;

      scriptlets[ScriptletClass.id] = scriptlet;
    });
  });

  return scriptlets;
};
