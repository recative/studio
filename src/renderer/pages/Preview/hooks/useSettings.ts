import * as React from 'react';

import { useFormChangeCallbacks } from 'utils/hooks/useFormChangeCallbacks';

export const INITIAL_PREVIEW_CONFIG = {
  protocol: localStorage.getItem('preview:protocol') || 'https',
  apHost: localStorage.getItem('preview:apHost') || 'localhost:9999',
  resourceHost:
    localStorage.getItem('preview:resourceHost') || 'localhost:9999',
};

export const useSettings = () => {
  const [settings, valueChangeCallbacks] = useFormChangeCallbacks(
    INITIAL_PREVIEW_CONFIG
  );

  React.useEffect(() => {
    if (!settings?.apHost) return;
    if (!settings?.resourceHost) return;
    if (!settings?.protocol) return;

    localStorage.setItem('preview:apHost', settings.apHost);
    localStorage.setItem('preview:resourceHost', settings.resourceHost);
    localStorage.setItem('preview:protocol', settings.protocol);
  }, [settings?.apHost, settings?.resourceHost, settings?.protocol]);

  return { settings, valueChangeCallbacks };
};
