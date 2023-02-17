import * as React from 'react';

import { server } from 'utils/rpc';

import { useInitializeError } from '../components/InitializeErrorModal';

export enum CodeServerStatus {
  Pending,
  Running,
  Idle,
}

export const useCodeServer = () => {
  const [codeServerStatus, setCodeServerStatus] = React.useState(
    CodeServerStatus.Idle
  );
  const [openErrorModal] = useInitializeError();

  const startCodeServer = React.useCallback(async () => {
    try {
      setCodeServerStatus(CodeServerStatus.Pending);
      await server.startCodeServer();
      setCodeServerStatus(CodeServerStatus.Running);
    } catch (error) {
      if (error instanceof Error) {
        openErrorModal(error.message);
      } else {
        openErrorModal('Unexpected error happened :(');
      }
    }
  }, [openErrorModal]);

  const stopCodeServer = React.useCallback(async () => {
    try {
      setCodeServerStatus(CodeServerStatus.Pending);
      await server.stopCodeServer();
      setCodeServerStatus(CodeServerStatus.Idle);
    } catch (error) {
      if (error instanceof Error) {
        openErrorModal(error.message);
      } else {
        openErrorModal('Unexpected error happened :(');
      }
    }
  }, [openErrorModal]);

  const toggleCodeServerStatus = React.useCallback(async () => {
    if (codeServerStatus === CodeServerStatus.Pending) {
      return false;
    }

    if (codeServerStatus === CodeServerStatus.Running) {
      await stopCodeServer();
      return false;
    }

    if (codeServerStatus === CodeServerStatus.Idle) {
      await startCodeServer();
      return false;
    }

    return false;
  }, [codeServerStatus, startCodeServer, stopCodeServer]);

  return {
    toggleCodeServerStatus,
    codeServerStatus,
  };
};
