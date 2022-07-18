import { localStorage } from '../../utils/localStorage';

import { getEpisode } from './episode';
import { getClientSideAssetList } from './asset';

export const setEnvVariable = (x: Record<string, unknown>) => {
  localStorage.setItem('act-server-env-variable', JSON.stringify(x));
};

export const getEnvVariable = async (
  apHostName: string,
  apProtocol: string,
  episodeId: string | null = null
): Promise<Record<string, unknown>> => {
  const assets = episodeId
    ? await getClientSideAssetList(episodeId, {
        type: 'studioPreview',
        resourceHostName: apHostName,
        apHostName,
        apProtocol,
      })
    : [];
  const episode = episodeId ? await getEpisode(episodeId) : null;
  const base = episodeId
    ? {
        assets,
        episode,
      }
    : {};

  const envVariableStr = localStorage.getItem('act-server-env-variable');
  if (!envVariableStr) return {};
  return { ...base, ...JSON.parse(envVariableStr), episodeId };
};
