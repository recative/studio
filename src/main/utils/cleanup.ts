// Modified version of node-cleanup, which is licensed under MIT license.

type Handler = (
  exitCode: number | null,
  signal: string | null
) => boolean | undefined | void;

/// / CONFIGURATION ////////////////////////////////////////////////////////////

let cleanupHandlers: Handler[] | null = null; // array of cleanup handlers to call

let sigintHandler: Handler; // POSIX signal handlers
let sighupHandler: Handler;
let sigquitHandler: Handler;
let sigtermHandler: Handler;

/// / HANDLERS /////////////////////////////////////////////////////////////////

const signalHandler: Handler = (exitCode, signal) => {
  let exit = true;

  if (!cleanupHandlers) return;

  cleanupHandlers.forEach((cleanup) => {
    if (cleanup(null, signal) === false) {
      exit = false;
    }
  });

  if (exit) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    uninstall(); // don't cleanup again
    // necessary to communicate the signal to the parent process
    process.kill(process.pid, exitCode ?? 0);
  }
};

const exceptionHandler: NodeJS.UncaughtExceptionListener = (error) => {
  if (error) {
    process.stderr.write(`${error.message}(${error.name})\n`);
    process.stderr.write(`${error.stack}\n`);

    process.exit(1); // will call exitHandler() for cleanup
  }
};

const exitHandler: Handler = (exitCode, signal) => {
  cleanupHandlers?.forEach((cleanup) => {
    cleanup(exitCode, signal);
  });
};

function noCleanup() {
  return true; // signals will always terminate process
}

export const install = (cleanupHandler: Handler) => {
  if (cleanupHandlers === null) {
    cleanupHandlers = []; // establish before installing handlers

    sigintHandler = (code: number | null) => signalHandler(code, 'SIGINT');
    sighupHandler = (code: number | null) => signalHandler(code, 'SIGHUP');
    sigquitHandler = (code: number | null) => signalHandler(code, 'SIGQUIT');
    sigtermHandler = (code: number | null) => signalHandler(code, 'SIGTERM');

    process.on('SIGINT', sigintHandler);
    process.on('SIGHUP', sighupHandler);
    process.on('SIGQUIT', sigquitHandler);
    process.on('SIGTERM', sigtermHandler);
    process.on('uncaughtException', exceptionHandler);
    process.on('exit', exitHandler);

    cleanupHandlers.push(cleanupHandler || noCleanup);
  } else if (cleanupHandler) cleanupHandlers.push(cleanupHandler);
};

export function uninstall() {
  if (cleanupHandlers !== null) {
    process.off('SIGINT', sigintHandler);
    process.off('SIGHUP', sighupHandler);
    process.off('SIGQUIT', sigquitHandler);
    process.off('SIGTERM', sigtermHandler);
    process.off('uncaughtException', exceptionHandler);
    process.off('exit', exitHandler);

    cleanupHandlers = null; // null only after uninstalling
  }
}
