import type { FastifyRequest, FastifyReply } from 'fastify';

import { getEnvVariable } from '../../rpc/query/preview';

export const getEnvVariableHandler = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const query = request.query as { apHost?: string; episodeId?: string };

  return reply.status(200).send(await getEnvVariable(query.episodeId));
};
