import { localStorage } from '../../utils/localStorage';

import { getEpisode } from './episode';
import { getLocalSettings } from './setting';
import { getClientSideAssetList } from './asset';

export const setEnvVariable = (x: Record<string, unknown>) => {
  localStorage.setItem('act-server-env-variable', JSON.stringify(x));
};

export const getEnvVariable = async (
  episodeId: string | null = null
): Promise<Record<string, unknown>> => {
  const localSettings = await getLocalSettings();
  const assets = episodeId ? await getClientSideAssetList(episodeId) : [];
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
