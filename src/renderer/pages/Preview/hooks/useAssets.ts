import * as React from 'react';

import { useAsync } from '@react-hookz/web';
import { useAsyncEffect } from 'use-async-effect';

import { server } from 'utils/rpc';

import { ACT_POINT_CONTENT_EXTENSION_ID } from '@recative/definitions';
import type {
  AssetForClient,
  IDetailedResourceItemForClient,
} from '@recative/definitions';

import { INITIAL_PREVIEW_CONFIG } from './useSettings';

import { useActPoints } from '../../ActPoint/ActPoint';
import { RESOURCE_MANAGER_KEY } from '../../../../main/utils/buildInResourceUploaderKeys';

export const useAssets = (settings: typeof INITIAL_PREVIEW_CONFIG) => {
  const { actPoints } = useActPoints();
  const [selectedItemType, setSelectedItemType] = React.useState<
    'ap' | 'episode' | null
  >(null);
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(
    null
  );
  const [playerKey, setPlayerKey] = React.useState<string | null>(null);
  const [assets, setAssets] = React.useState<AssetForClient[] | null>(null);
  const [resources, setResources] = React.useState<
    IDetailedResourceItemForClient[] | null
  >(null);

  const [episodes, episodesAction] = useAsync(server.listEpisodes, []);

  useAsyncEffect(
    async (mounted) => {
      if (!mounted) return;
      if (selectedItemType === 'ap') {
        if (!selectedItemId) return;
        if (!actPoints.result) return;

        const aps = Object.values(actPoints.result).reduce((a, b) => [
          ...a,
          ...b,
        ]);
        const ap = aps.find((x) => x.id === selectedItemId);
        if (!ap) return;

        const manifest = await server.getEntryPointsFromApPackPreview(
          settings.apHost,
          settings.protocol
        );

        const entryPoint = Object.entries(manifest).find(([key]) =>
          key.toLowerCase().includes(ap.fullPath.toLowerCase())
        );

        if (!entryPoint) return;

        const nextAsset: AssetForClient[] = [
          {
            id: selectedItemId,
            duration: Infinity,
            spec: {
              contentExtensionId: ACT_POINT_CONTENT_EXTENSION_ID,
              entryPoints: {
                [RESOURCE_MANAGER_KEY]: `${settings?.protocol}://${settings?.apHost}${entryPoint[1]}`,
              },
              resolutionMode: ap.resolutionMode,
            },
            preloadDisabled: false,
            earlyDestroyOnSwitch: false,
          },
        ];

        const nextResources = await server.listAllDetailedResourcesForClient(
          true,
          settings?.resourceHost,
          settings?.protocol
        );
        if (!mounted) return;
        setAssets(nextAsset);
        setResources(nextResources);
        setPlayerKey(Math.random().toString(36).slice(2));
      } else if (selectedItemType === 'episode') {
        if (!selectedItemId) return;

        const requestConfig = {
          type: 'apPackDistPreview' as const,
          resourceHostName: settings.resourceHost,
          apHostName: settings.apHost,
          apProtocol: settings.protocol,
        };

        const { assets: episodeAssets, resources: episodeResources } =
          await server.getEpisodeDetail(selectedItemId, requestConfig);

        episodeAssets.forEach((asset) => {
          if (asset.duration === null) {
            asset.duration = Infinity;
          }
        });

        setAssets(episodeAssets);
        setResources(episodeResources);
        setPlayerKey(Math.random().toString(36).slice(2));
      }
    },
    [selectedItemId, selectedItemType]
  );

  const handleActPointClick = React.useCallback((actPointId: string) => {
    setSelectedItemType('ap');
    setSelectedItemId(actPointId);
  }, []);

  const handleEpisodeClick = React.useCallback((episodeId: string) => {
    setSelectedItemType('episode');
    setSelectedItemId(episodeId);
  }, []);

  React.useEffect(() => {
    episodesAction.execute();
  }, [episodesAction]);

  return {
    episodes: episodes.result,
    selectedItemId,
    selectedItemType,
    handleActPointClick,
    handleEpisodeClick,
    assets,
    resources,
    playerKey,
  };
};
