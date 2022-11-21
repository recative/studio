import ZipReader from 'node-stream-zip';
import { readFile } from 'fs/promises';

import {
  xxHash,
  Scriptlet,
  getFilePath,
  getFileBuffer,
  IScriptletDependency,
} from '@recative/extension-sdk';
import type { TerminalMessageLevel } from '@recative/studio-definitions';

import { getDb } from '../rpc/db';
import { extensions } from '../extensions';
import { addFileToGroup, importFile } from '../rpc/query/resource';
import { logToTerminal } from '../rpc/query/terminal';

import { downloadFile } from './downloadFile';
import { getExtensionConfig } from './getExtensionConfig';
import { writePathToResource } from './writePathToResource';
import { writeBufferToResource } from './writeBufferToResource';
import { insertPostProcessedFileDefinition } from './insertPostProcessedFileDefinition';
import { updatePostProcessedFileDefinition } from './updatePostProcessedFileDefinition';
import { getResourceFilePath, getResourceFileBinary } from './getResourceFile';

const scriptletDependency: IScriptletDependency = {
  getFilePath,
  getFileBuffer,
  getResourceFilePath,
  getResourceFileBinary,
  getXxHashOfResourceFile: async (resource) => {
    const resourceFilePath = await getResourceFilePath(resource);
    return xxHash(await readFile(resourceFilePath));
  },
  getXxHashOfFile: async (path) => {
    return xxHash(await readFile(path));
  },
  getXxHashOfBuffer: (buffer) => {
    return xxHash(buffer);
  },
  importFile,
  addFileToGroup,
  downloadFile,
  readZip: (x: string) => new ZipReader({ file: x }),
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: null as any,
  // This will be replaced later
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  logToTerminal: logToTerminal as any,
  writePathToResource,
  writeBufferToResource,
  insertPostProcessedFileDefinition,
  updatePostProcessedFileDefinition,
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
