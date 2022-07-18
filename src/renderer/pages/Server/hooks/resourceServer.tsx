import * as React from 'react';
import { atom, useAtom } from 'jotai';

import { server } from 'utils/rpc';

import { useInitializeError } from '../components/InitializeErrorModal';

export enum ResourceServerStatus {
  Pending,
  Running,
  Idle,
}

const SERVER_STATUS = atom(ResourceServerStatus.Idle);

export const useResourceServer = () => {
  const [resourceServerStatus, setResourceServerStatus] =
    useAtom(SERVER_STATUS);
  const [openErrorModal] = useInitializeError();

  const startResourceServer = React.useCallback(async () => {
    try {
      setResourceServerStatus(ResourceServerStatus.Pending);
      await server.startResourceServer();
      setResourceServerStatus(ResourceServerStatus.Running);
    } catch (error) {
      if (error instanceof Error) {
        openErrorModal(error.message);
      } else {
        openErrorModal('Unexpected error happened :(');
      }
    }
  }, [openErrorModal, setResourceServerStatus]);

  const stopResourceServer = React.useCallback(async () => {
    try {
      setResourceServerStatus(ResourceServerStatus.Pending);
      await server.stopResourceServer();
      setResourceServerStatus(ResourceServerStatus.Idle);
    } catch (error) {
      if (error instanceof Error) {
        openErrorModal(error.message);
      } else {
        openErrorModal('Unexpected error happened :(');
      }
    }
  }, [openErrorModal, setResourceServerStatus]);

  const toggleResourceServerStatus = React.useCallback(() => {
    if (resourceServerStatus === ResourceServerStatus.Pending) {
      return false;
    }

    if (resourceServerStatus === ResourceServerStatus.Running) {
      stopResourceServer();
      return false;
    }

    if (resourceServerStatus === ResourceServerStatus.Idle) {
      startResourceServer();
      return false;
    }

    return false;
  }, [resourceServerStatus, startResourceServer, stopResourceServer]);

  return { toggleResourceServerStatus, resourceServerStatus };
};
