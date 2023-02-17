import log from 'electron-log';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import _fastify from 'fastify';
// @ts-ignore
import selfSigned from 'selfsigned';

import type { FastifyInstance } from 'fastify';

import {
  getAssetListForSdk,
  getEpisodeListForSdk,
  getResourceListForSdk,
} from './router/episode';
import { getResourceFile } from './router/actPoint';
import { getResourceBinary } from './router/resource';
import { getEnvVariableHandler } from './router/preview';
import { getContainerComponents, getPreviewConstants } from './router/player';

import { HOME_DIR } from '../constant/configPath';

const cors = require('@fastify/cors');

const CERT_PATH = join(HOME_DIR, 'cert');
const KEY_PATH = join(HOME_DIR, 'privkey');

const certValid = existsSync(CERT_PATH) && existsSync(KEY_PATH);

if (certValid) {
  log.info(':: 🎉 Found a SSL Cert, resource server will use it!');
}

let fastifyServer: FastifyInstance | null = null;

interface ICert {
  private: string;
  public: string;
  cert: string;
}

export const startResourceServer = async () => {
  if (fastifyServer) {
    await fastifyServer.close();
  }

  const cert = certValid
    ? {
        cert: readFileSync(CERT_PATH, { encoding: 'utf8', flag: 'r' }),
        private: readFileSync(KEY_PATH, { encoding: 'utf8', flag: 'r' }),
      }
    : await new Promise<ICert>((resolve, reject) => {
        selfSigned.generate([], { days: 1 }, (err: Error, pems: ICert) => {
          if (err) {
            reject(err);
          } else {
            resolve(pems);
          }
        });
      });

  const fastify = _fastify({
    logger: {
      level: 'error',
    },

    https: {
      cert: cert.cert,
      key: cert.private,
    },
  });

  await fastify.register(cors, {
    origin: true,
  });

  fastify.get('/resource/:id/binary', getResourceBinary);
  fastify.get('/envVariable', getEnvVariableHandler);
  fastify.get('/preview/containerComponents.js', getContainerComponents);
  fastify.get('/preview/containerComponents.js.map', getContainerComponents);
  fastify.get('/preview/episodes.:serializer', getEpisodeListForSdk);
  fastify.get('/preview/constants.json', getPreviewConstants);
  fastify.get('/preview/resources.:serializer', getResourceListForSdk);
  fastify.get('/preview/:id(.+?).:serializer', getAssetListForSdk);
  fastify.get('*', getResourceFile);

  await fastify.listen({
    port: 9999,
    host: '0.0.0.0',
  });

  fastifyServer = fastify;
};

export const stopResourceServer = async () => {
  await fastifyServer?.close();
  fastifyServer = null;
};
