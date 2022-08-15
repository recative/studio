import spawn from 'cross-spawn';
import type { SpawnOptions } from 'child_process';

import { TerminalMessageLevel as Level } from '@recative/extension-sdk';

import { logToTerminal } from '../rpc/query/terminal';

export class SpawnFailedError extends Error {
  name = 'SpawnFailed';

  constructor(command: string, parameter: string[], public code: number) {
    super(
      `Spawn failed with exit code ${code}: ${command} ${parameter.join(' ')}`
    );
  }
}

const isWin = process.platform === 'win32';

export const promisifySpawn = (
  executable: string,
  parameter: string[],
  options?: SpawnOptions,
  terminalId?: string,
  appendExe = isWin
) => {
  return new Promise((resolve, reject) => {
    const command = isWin ? `chcp 65001 | ${executable}` : executable;

    const trueExecutable = `${executable}${appendExe ? '.exe' : ''}`;
    const trueCommand = isWin ? 'powershell' : command;
    let trueParameter: string[] = [];

    if (isWin) {
      trueParameter = [trueExecutable, ...parameter];
    } else {
      trueParameter = parameter;
    }

    const childProcess = spawn(trueCommand, trueParameter, options);
    if (terminalId) {
      logToTerminal(
        terminalId,
        `$${command} ${parameter.join(' ')}`,
        Level.Info
      );
    }

    childProcess.on('close', (code) => {
      if (code === 0) {
        resolve(code);
      }

      reject(new SpawnFailedError(trueCommand, trueParameter, code));
    });

    if (terminalId) {
      childProcess.stdout?.on('data', (data) =>
        logToTerminal(terminalId, data.toString(), Level.Info)
      );
      childProcess.stderr?.on('data', (data) =>
        logToTerminal(terminalId, data.toString(), Level.Error)
      );
    }
  });
};
