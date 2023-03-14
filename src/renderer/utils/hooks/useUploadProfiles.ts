import * as React from 'react';

import { useAsync } from '@react-hookz/web';

import { server } from 'utils/rpc';

export const useUploadProfiles = (key = 'upload-profiles') => {
  const [selectedProfiles, setSelectedProfiles] = React.useState(() =>
    (localStorage.getItem(`@recative/studio/${key}`) ?? '')
      .split(',,,')
      .filter(Boolean)
  );

  const [uploadProfiles, uploadProfilesActions] = useAsync(async () => {
    return (await server.listUploadProfile()).map(
      ({ id, label, uploaderExtensionId }) => ({
        id,
        label,
        extensionId: uploaderExtensionId,
      })
    );
  });

  React.useEffect(() => {
    void uploadProfilesActions.execute();
  }, [uploadProfilesActions]);

  React.useEffect(() => {
    if (uploadProfiles.result) {
      const profileIds = new Set(uploadProfiles.result.map((x) => x.id));

      setSelectedProfiles((x) => x.filter((a) => profileIds.has(a)));
    }
  }, [uploadProfiles.result]);

  return [uploadProfiles, selectedProfiles, setSelectedProfiles] as const;
};
