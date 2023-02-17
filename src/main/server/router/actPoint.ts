import { join } from 'path';
import { parse } from 'url';

import mime from 'mime-types';
import StreamZip from 'node-stream-zip';

import { readFile, pathExists, lstatSync } from 'fs-extra';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { getWorkspace } from '../../rpc/workspace';

export const getResourceFile = async (
  request: FastifyRequest,
  reply: FastifyReply
) => {
  const workspace = getWorkspace();
  const { codeRepositoryPath } = workspace;

  const previewWebRootBundle = join(
    workspace.assetsPath,
    'preview-web-root.zip'
  );
  if (await pathExists(previewWebRootBundle)) {
    const previewBundle = new StreamZip.async({ file: previewWebRootBundle });
    const entries = await previewBundle.entries();

    if (request.url === '/' && entries['index.html']) {
      const file = await previewBundle.entryData('index.html');
      await reply.type('text/html');
      await reply.send(file);
      return;
    }

    const entryKey = request.url.substring(1);
    if (entries[entryKey]) {
      const file = await previewBundle.entryData(entryKey);
      await reply.type(mime.lookup(entryKey) || 'application/octet-stream');
      await reply.send(file);
      return;
    }
  }

  if (!codeRepositoryPath) {
    throw new Error('Code repository path is not defined');
  }

  const { pathname } = parse(request.url);

  if (!pathname) {
    await reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const filePath = join(codeRepositoryPath, 'dist', pathname);

  if (!pathExists(pathname)) {
    await reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const isDir = lstatSync(filePath).isDirectory();

  if (isDir) {
    await reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  const file = await readFile(filePath);

  if (!file) {
    await reply.code(404).send({
      message: 'File not found',
    });
    return;
  }

  await reply.type(mime.lookup(filePath) || 'application/octet-stream');
  if (request.method === 'HEAD') {
    await reply.code(204).send('');
  } else {
    await reply.code(200).send(file);
  }
};
