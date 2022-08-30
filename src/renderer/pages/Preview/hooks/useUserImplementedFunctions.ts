import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { atom, useAtom } from 'jotai';

import type { IInitialAssetStatus } from '@recative/core-manager';
import type { UserImplementedFunctions } from '@recative/definitions';

import { server } from 'utils/rpc';

export const initialAssetStatusAtom = atom<IInitialAssetStatus | undefined>(
  undefined
);

export const useResetAssetStatusCallback = () => {
  const [, setInitialAssetStatus] = useAtom(initialAssetStatusAtom);

  return React.useCallback(() => {
    setInitialAssetStatus(undefined);
  }, [setInitialAssetStatus]);
};

export const useUserImplementedFunctions = (
  episodeId: string | null,
  setEpisodeId: (x: string) => void
) => {
  const [episodesRequest, episodesAction] = useAsync(server.listEpisodes, []);
  const episodes = React.useMemo(() => {
    return episodesRequest.result?.map((x) => x.episode) ?? [];
  }, [episodesRequest.result]);

  React.useEffect(() => {
    episodesAction.execute();
  }, [episodesAction]);
  const [, setInitialAssetStatus] = useAtom(initialAssetStatusAtom);
  const gotoEpisode: UserImplementedFunctions['gotoEpisode'] =
    React.useCallback(
      (seek, episodeOrder, forceReload, assetOrder, assetTime) => {
        const episode = episodes?.find(
          (x) => x.order.toString() === episodeOrder
        );
        if (!episode) return;

        if (episodeId === episode.id) {
          if (assetOrder !== undefined && assetTime !== undefined) {
            seek(assetOrder, assetTime);
          }

          return;
        }

        if (assetOrder !== undefined && assetTime !== undefined) {
          setInitialAssetStatus({
            time: assetTime,
            order: assetOrder,
          });
        } else {
          setInitialAssetStatus(undefined);
        }

        const nextUrl = episode.id;
        if (!forceReload) {
          setEpisodeId(nextUrl);
        } else {
          window.location.href = nextUrl;
        }
      },
      [episodeId, episodes, setEpisodeId, setInitialAssetStatus]
    );

  const userImplementedFunctions = React.useMemo(
    () => ({ gotoEpisode }),
    [gotoEpisode]
  );

  return userImplementedFunctions;
};
