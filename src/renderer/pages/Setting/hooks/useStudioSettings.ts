import * as React from 'react';
import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';

export const useStudioSettings = () => {
  const [extensionMetadata, extensionMetadataActions] = useAsync(async () => {
    const settings = await server.getSettings();

    return settings;
  });

  React.useEffect(() => {
    extensionMetadataActions.execute();
  }, [extensionMetadataActions, extensionMetadataActions.execute]);

  return extensionMetadata.result;
};
