import { FastifyRequest } from 'fastify';

import { getReleasedDb } from '../../utils/getReleasedDb';

export const getDbFromRequest = async (request: FastifyRequest) => {
  const requestQuery = request.query as Record<string, string>;

  if ('bundleId' in requestQuery) {
    const NBundleId = Number.parseInt(requestQuery.bundleId, 10);
    if (Number.isNaN(NBundleId)) {
      return getReleasedDb();
    }

    return getReleasedDb(NBundleId);
  }

  return getReleasedDb();
};
