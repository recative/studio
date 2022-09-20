import { Buffer } from 'buffer';
import { createReadStream, statSync } from 'fs';
import { pathExists } from 'fs-extra';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { cleanUpResourceListForClient } from '@recative/definitions';
import type { IResourceFile } from '@recative/definitions';

import { cleanupLoki } from '../../rpc/query';
import { getDbFromRequest } from '../utils/getDbFromRequest';
import { getResourceFilePath } from '../../utils/getResourceFile';

const ErrorDbNotReady = {
  code: 'EDBNOTREADY',
  message: 'Database is not initialized.',
};

const ErrorResourceNotFound = {
  code: 'ERESOURCENOTFOUND',
  message: 'Resource not found.',
};

const ErrorResourceFileNotExists = {
  code: 'ERESOURCEFILENOTEXIST',
  message: 'Resource file not exist.',
};

const ErrorMismatchResourceType = {
  code: 'EMISMATCHRESOURCETYPE',
  message: 'Resource group do not have a related binary file.',
};

interface ResourceBinaryParameters {
  id: string;
}

export const getResourceMetadata = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const db = await getDbFromRequest(request);

  if (!db) {
    reply.statusCode = 503;
    return ErrorDbNotReady;
  }

  const itemId = (request.params as ResourceBinaryParameters).id;

  const dbQuery: Record<string, unknown> = {
    id: itemId,
    removed: false,
  };

  const resource =
    db.resource.resources.findOne(dbQuery) ??
    db.resource.postProcessed.findOne(dbQuery);

  if (!resource) {
    reply.statusCode = 404;
    return ErrorResourceNotFound;
  }

  reply.header('Metadata', JSON.stringify(cleanupLoki(resource)));

  return cleanUpResourceListForClient([resource], false)[0];
};

const parseRangeHeader = (range: string, size: number) => {
  const [sStart, sEnd] = range.replace(/bytes=/, '').split('-');
  let nStart = parseInt(sStart, 10);
  let nEnd = sEnd ? parseInt(sEnd, 10) : size - 1;

  if (!Number.isNaN(nStart) && Number.isNaN(nEnd)) {
    nEnd = size - 1;
  }
  if (Number.isNaN(nStart) && !Number.isNaN(nEnd)) {
    nStart = size - nEnd;
    nEnd = size - 1;
  }

  const inRange = !(nStart >= size || nEnd >= size);

  return {
    start: nStart,
    end: nEnd,
    inRange,
  };
};

export const getResourceBinary = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const resource = await getResourceMetadata(request, reply);

  if ('code' in resource) {
    return resource;
  }

  reply.header(
    'Metadata',
    Buffer.from(JSON.stringify(resource)).toString('base64')
  );

  if (resource.type === 'group') {
    reply.statusCode = 406;
    return ErrorMismatchResourceType;
  }

  const { mimeType } = resource as IResourceFile;

  const filePath = getResourceFilePath(resource);

  if (!(await pathExists(filePath))) {
    reply.statusCode = 404;
    return ErrorResourceFileNotExists;
  }

  const { range } = request.headers;
  if (!range) {
    return reply
      .status(200)
      .headers({
        'Accept-Ranges': 'bytes',
        'Content-Type': mimeType,
      })
      .send(createReadStream(filePath));
  }

  const stats = statSync(filePath);

  if (request.method === 'HEAD') {
    return reply.code((await pathExists(filePath)) ? 204 : 404).send('');
  }

  const { start, end, inRange } = parseRangeHeader(range, stats.size);

  if (!inRange) {
    return reply
      .status(406)
      .headers({
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes */${stats.size}`,
        'Content-Type': mimeType,
      })
      .send();
  }

  const stream = createReadStream(filePath, {
    start,
    end,
  });

  return reply
    .status(206)
    .headers({
      'Content-Type': mimeType,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Range': `bytes ${start}-${end}/${stats.size}`,
    })
    .send(stream);
};
