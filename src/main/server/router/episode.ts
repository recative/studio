import { Buffer } from 'buffer';

import { encode } from '@msgpack/msgpack';
import type { FastifyRequest } from 'fastify';

import {
  getEpisodeDetail,
  getEpisodeDetailList,
  getResourceListOfEpisode,
} from '../../rpc/query/episode';
import { getSettings } from '../../rpc/query/setting';
import { getDbFromRequest } from '../utils/getDbFromRequest';

interface AssetListParameters {
  id: string;
  profileId?: string;
  apHost?: string;
}
const getProfile = async (request: FastifyRequest) => {
  const { profileId: profile, apHost } = request.params as AssetListParameters;
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

  return (await getEpisodeDetailList(null, await getProfile(request), db)).sort(
    (a, b) => a.episode.order - b.episode.order
  );
};

// ${episodeId}.bson
export const getAssetListForSdk = async (request: FastifyRequest) => {
  const result = await getAssetList(request);
  return Buffer.from(encode(result));
};

// episodes.bson
export const getEpisodeListForSdk = async (request: FastifyRequest) => {
  const result = await getEpisodeList(request);
  return Buffer.from(encode(result));
};

// resources.bson
export const getResourceListForSdk = async (request: FastifyRequest) => {
  return Buffer.from(encode(await getResourceList(request)));
};
