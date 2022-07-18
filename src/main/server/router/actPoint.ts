import { join } from 'path';
import { parse } from 'url';

import mime from 'mime-types';
import { readFile, pathExists, lstatSync } from 'fs-extra';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { getWorkspace } from '../../rpc/workspace';

export const getResourceFile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const workspace = getWorkspace();
  const { codeRepositoryPath } = workspace;

  if (!codeRepositoryPath) {
    throw new Error('Code repository path is not defined');
  }

  const { pathname } = parse(request.url);

  if (!pathname) {
    reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const filePath = join(codeRepositoryPath, 'dist', pathname);

  if (!pathExists(pathname)) {
    reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const isDir = lstatSync(filePath).isDirectory();

  if (isDir) {
    reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const file = await readFile(filePath);

  if (!file) {
    reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  reply.type(mime.lookup(filePath) || 'application/octet-stream');
  if (request.method === 'HEAD') {
    reply.code(204).send('');
  } else {
    reply.code(200).send(file);
  }
};
