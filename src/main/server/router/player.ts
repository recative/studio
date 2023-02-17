import { join } from 'path';
import { readFile } from 'fs/promises';
import { pathExists } from 'fs-extra';
import type { FastifyRequest, FastifyReply } from 'fastify';

import { getWorkspace } from '../../rpc/workspace';

export const GetComponentFile =
  (fileName: string) => async (_: FastifyRequest, reply: FastifyReply) => {
    const workspace = getWorkspace();
    const componentFilePath = process.env.COMPONENT_FILE_PATH
      ? join(process.env.COMPONENT_FILE_PATH, `${fileName}`)
      : join(workspace.assetsPath, 'components', `${fileName}`);

    if (!(await pathExists(componentFilePath))) {
      await reply.status(404).send({ code: 'NOT_FOUND' });
      return;
    }
    const file = await readFile(componentFilePath);

    return reply.status(200).send(file);
  };

export const GetAssetFile =
  (...fileName: string[]) =>
  async (_: FastifyRequest, reply: FastifyReply) => {
    const workspace = getWorkspace();
    const componentFilePath = join(workspace.assetsPath, ...fileName);

    if (!(await pathExists(componentFilePath))) {
      await reply.status(404).send({ code: 'NOT_FOUND' });
      return;
    }
    const file = await readFile(componentFilePath);

    return reply.status(200).send(file);
  };

export const getContainerComponents = GetComponentFile(
  'containerComponents.js'
);
export const getContainerComponentsMap = GetComponentFile(
  'containerComponents.js.map'
);
export const getPreviewConstants = GetAssetFile('constant-preview.json');
