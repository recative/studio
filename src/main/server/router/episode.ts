import { Buffer } from 'buffer';

import type { FastifyRequest } from 'fastify';

import {
  getEpisodeDetail,
  getEpisodeDetailList,
  getResourceListOfEpisode,
} from '../../rpc/query/episode';
import { stringify } from '../../utils/serializer';
import { getSettings } from '../../rpc/query/setting';
import { getDbFromRequest } from '../utils/getDbFromRequest';

interface AssetListParameters {
  id: string;
}

interface AssetListQuery {
  profileId?: string;
  apHost?: string;
}

const getProfile = async (request: FastifyRequest) => {
  const { profileId: profile, apHost } = request.query as AssetListQuery;
  const settings = await getSettings();

  return {
    type:
      profile === 'apPackDistPreview'
        ? 'apPackDistPreview'
        : 'apPackLivePreview',
    resourceHostName: settings.resourceHost ?? request.hostname,
    apHostName: apHost ?? settings.apHost ?? request.hostname,
    apProtocol: settings.contentProtocol ?? request.protocol,
  } as const;
};

export const getAssetList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  const { id: episodeId } = request.params as AssetListParameters;
  return getEpisodeDetail(episodeId, await getProfile(request), db);
};

export const getResourceList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  const { id: episodeId } = request.params as AssetListParameters;
  return getResourceListOfEpisode(episodeId, await getProfile(request), db);
};

export const getEpisodeList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  return (
    await getEpisodeDetailList(null, await getProfile(request), db, true)
  ).sort((a, b) => a.episode.order - b.episode.order);
};

interface IParameterWithSerializer {
  serializer: string;
}

// ${episodeId}.bson
export const getAssetListForSdk = async (request: FastifyRequest) => {
  const result = await getAssetList(request);
  const { serializer } = request.params as IParameterWithSerializer;

  return Buffer.from(stringify(result, serializer));
};

// episodes.bson
export const getEpisodeListForSdk = async (request: FastifyRequest) => {
  const result = await getEpisodeList(request);
  const { serializer } = request.params as IParameterWithSerializer;

  return Buffer.from(stringify(result, serializer));
};

// resources.bson
export const getResourceListForSdk = async (request: FastifyRequest) => {
  const { serializer } = request.params as IParameterWithSerializer;

  return Buffer.from(stringify(await getResourceList(request), serializer));
};
