import { Buffer } from 'buffer';

import { encode } from '@msgpack/msgpack';
import type { FastifyRequest } from 'fastify';

import {
  getEpisodeDetail,
  getEpisodeDetailList,
  getResourceListOfEpisode,
} from '../../rpc/query/episode';
import { getDbFromRequest } from '../utils/getDbFromRequest';

interface AssetListParameters {
  id: string;
}

export const getAssetList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  const episodeId = (request.params as AssetListParameters).id;
  return getEpisodeDetail(
    episodeId,
    {
      type: 'apPackPreview',
      resourceHostName: request.hostname,
      apHostName:
        (request.query as { apHost?: string }).apHost || request.hostname,
      apProtocol: request.protocol,
    },
    db
  );
};

export const getResourceList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  const episodeId = (request.params as AssetListParameters).id;
  return getResourceListOfEpisode(
    episodeId,
    {
      type: 'apPackPreview',
      resourceHostName: request.hostname,
      apHostName:
        (request.query as { apHost?: string }).apHost || request.hostname,
      apProtocol: request.protocol,
    },
    db
  );
};

export const getEpisodeList = async (request: FastifyRequest) => {
  const db = getDbFromRequest(request);

  return (
    await getEpisodeDetailList(
      null,
      {
        type: 'apPackPreview',
        resourceHostName: request.hostname,
        apHostName:
          (request.query as { apHost?: string }).apHost || request.hostname,
        apProtocol: request.protocol,
      },
      db
    )
  ).sort((a, b) => a.episode.order - b.episode.order);
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
