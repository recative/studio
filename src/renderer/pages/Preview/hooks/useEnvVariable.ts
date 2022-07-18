import * as React from 'react';
import debug from 'debug';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';

import { INITIAL_PREVIEW_CONFIG } from './useSettings';

const NOTHING = {};

const log = debug('renderer:use-env');

export const useEnvVariable = (
  settings: typeof INITIAL_PREVIEW_CONFIG | null,
  episodeId: string | null
) => {
  const [envVariableModalOpen, setEnvVariableModalOpen] = React.useState(false);

  const fetchEnvVariable = React.useCallback(
    async () =>
      settings
        ? server.getEnvVariable(settings.apHost, settings.protocol, episodeId)
        : {},
    [settings, episodeId]
  );

  const [{ result: envVariable }, envVariableController] =
    useAsync(fetchEnvVariable);

  React.useEffect(() => {
    envVariableController.execute();
  }, [envVariableController, episodeId]);

  const handleEnvVariableModalOpen = React.useCallback(() => {
    setEnvVariableModalOpen(true);
  }, []);

  const handleEnvVariableModalClose = React.useCallback(() => {
    setEnvVariableModalOpen(false);
  }, []);

  const handleEnvVariableSubmit = React.useCallback(async (x: string) => {
    setEnvVariableModalOpen(false);
    try {
      const parsed = JSON.parse(x);
      await server.setEnvVariable(parsed);
    } catch (e) {
      log('Wrong env variable!');
    }
  }, []);

  return {
    envVariable: envVariable || NOTHING,
    envVariableModalOpen,
    handleEnvVariableModalOpen,
    handleEnvVariableModalClose,
    handleEnvVariableSubmit,
  };
};
