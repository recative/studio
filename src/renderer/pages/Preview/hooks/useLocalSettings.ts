import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';

export const useLocalSettings = () => {
  const [localSettings, localSettingsActions] = useAsync(
    server.getLocalSettings
  );

  React.useEffect(() => {
    void localSettingsActions.execute();
  }, [localSettingsActions, localSettingsActions.execute]);

  return localSettings.result;
};
