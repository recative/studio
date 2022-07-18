import spawn from 'cross-spawn';

import { CodeRepositoryPathNotSetError } from '@recative/definitions';

import { getWorkspace } from '../workspace';

type ChildProcess = ReturnType<typeof spawn>;

let childProcess: null | ChildProcess = null;

export const startCodeServer = async () => {
  const workspace = getWorkspace();

  if (!workspace.codeRepositoryPath) {
    throw new CodeRepositoryPathNotSetError();
  }

  console.log('startingCodeServer');
  childProcess = spawn('yarn', ['start'], {
    cwd: workspace.codeRepositoryPath,
  });

  childProcess.on('close', () => {
    childProcess = null;
  });

  childProcess.on('exit', (code) => {
    console.log('Child Process Exited', code);
  });

  console.log(childProcess);

  childProcess.stdout?.on('data', (data) => console.log(data.toString()));
  childProcess.stderr?.on('data', (data) => console.log(data.toString()));
};

export const stopCodeServer = async () => {
  childProcess?.kill();
  childProcess = null;
};

export const getCodeServerStarted = () => !!childProcess;
