import log from 'electron-log';
import {
  TerminalStepStatus,
  TerminalMessageLevel,
} from '@recative/studio-definitions';
import type { ITerminal } from '@recative/studio-definitions';

export class AbortedError extends Error {
  code = 'Aborted';

  constructor() {
    super(`Previous task was aborted`);
  }
}

const sessions: Record<string, ITerminal> = {};

export const newTerminalSession = (id: string, steps: string[]) => {
  sessions[id] = {
    steps: Object.fromEntries(
      steps.map((step) => [step, TerminalStepStatus.Idle])
    ),
    messages: [],
  };
};

export const destroyTerminalSession = (id: string) => {
  delete sessions[id];
};

export const getTerminalSession = (id: string) => {
  return sessions[id];
};

export const updateTerminalStepStatus = (
  id: string,
  step: string,
  status: TerminalStepStatus
) => {
  const session = getTerminalSession(id);
  if (step in session.steps) {
    session.steps[step] = status;
  }
};

export const logToTerminal = (
  id: string | undefined,
  message: string | [string, string],
  level = TerminalMessageLevel.Info
) => {
  if (id === undefined) {
    return;
  }

  const session = sessions[id];
  if (session) {
    session.messages.push({
      level,
      message,
    });
  }
};

export const wrapTaskFunction = <
  T extends (...args: P) => R,
  P extends unknown[],
  R
>(
  id: string,
  step: string,
  fn: T,
  abortController?: AbortController
) => {
  const handleError = (error: unknown) => {
    updateTerminalStepStatus(id, step, TerminalStepStatus.Failed);

    log.error(`:: ${step}`, error);
    if (error instanceof Error) {
      logToTerminal(id, error.message, TerminalMessageLevel.Error);
    } else {
      logToTerminal(id, 'Unknown Error', TerminalMessageLevel.Error);
    }
  };

  const returnedResult: (...args: P) => Promise<ReturnType<T> | null> = async (
    ...args
  ) => {
    if (abortController && abortController.signal.aborted) {
      handleError(new AbortedError());
      return null;
    }

    try {
      updateTerminalStepStatus(id, step, TerminalStepStatus.Working);
      const result = await fn(...args);
      updateTerminalStepStatus(id, step, TerminalStepStatus.Success);
      return result as ReturnType<T>;
    } catch (error) {
      abortController?.abort(error);
      handleError(error);
      return null;
    }
  };

  return returnedResult;
};
