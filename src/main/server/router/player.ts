import { join } from 'path';
import { createReadStream } from 'fs';
import { existsSync } from 'fs-extra';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { getWorkspace } from '../../rpc/workspace';

export const GetFile =
  (fileName: string) => async (_: FastifyRequest, reply: FastifyReply) => {
    const workspace = getWorkspace();
    const componentFilePath = process.env.COMPONENT_FILE_PATH
      ? join(process.env.COMPONENT_FILE_PATH, `${fileName}`)
      : join(workspace.assetsPath, 'components', `${fileName}`);

    if (!existsSync(componentFilePath)) {
      reply.status(404).send({ code: 'NOT_FOUND' });
      return;
    }
    const stream = createReadStream(componentFilePath);

    reply.status(200).send(stream);
  };

export const getContainerComponents = GetFile('containerComponents.js');
export const getContainerComponentsMap = GetFile('containerComponents.js.map');
