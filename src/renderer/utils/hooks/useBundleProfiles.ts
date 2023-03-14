import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';

export const useBundleProfiles = (key = 'bundle-profiles') => {
  const [selectedProfiles, setSelectedProfiles] = React.useState(() =>
    (localStorage.getItem(`@recative/studio/${key}`) ?? '')
      .split(',,,')
      .filter(Boolean)
  );

  const [bundleProfiles, uploadProfilesActions] = useAsync(async () => {
    return (await server.listBundleProfile()).map(
      ({ id, label, bundleExtensionId }) => ({
        id,
        label,
        extensionId: bundleExtensionId,
      })
    );
  });

  React.useEffect(() => {
    void uploadProfilesActions.execute();
  }, [uploadProfilesActions]);

  React.useEffect(() => {
    if (bundleProfiles.result) {
      const profileIds = new Set(bundleProfiles.result.map((x) => x.id));

      setSelectedProfiles((x) => x.filter((a) => profileIds.has(a)));
    }
  }, [bundleProfiles.result]);

  return [bundleProfiles, selectedProfiles, setSelectedProfiles] as const;
};
