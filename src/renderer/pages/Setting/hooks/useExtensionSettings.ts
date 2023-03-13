import * as React from 'react';

import type { Updater } from 'use-immer';

export const useExtensionSettings = <
  T extends { extensionConfigurations: Record<string, string> }
>(
  profile: T | null,
  setProfile?: Updater<T | null>
) => {
  const getValue = React.useCallback(
    (extensionId: string, fieldId: string) => {
      const fieldQueryKey = `${extensionId}~~${fieldId}`;
      return profile?.extensionConfigurations[fieldQueryKey] || '';
    },
    [profile]
  );

  const setValue = React.useCallback(
    (extensionId: string, key: string, value: string) => {
      const fieldQueryKey = `${extensionId}~~${key}`;
      setProfile?.((draft) => {
        if (draft) {
          draft.extensionConfigurations[fieldQueryKey] = value;
        }
        return draft;
      });
    },
    [setProfile]
  );

  return [getValue, setValue] as const;
};
