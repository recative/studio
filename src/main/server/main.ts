import log from 'electron-log';
import { join } from 'path';
import { existsSync, readFileSync } from 'fs-extra';
import _fastify from 'fastify';
// @ts-ignore
import selfSigned from 'selfsigned';

import type { FastifyInstance } from 'fastify';

import {
  getAssetList,
  getEpisodeList,
  getResourceList,
  getAssetListForSdk,
  getEpisodeListForSdk,
  getResourceListForSdk,
} from './router/episode';
import {
  getResourceBinary,
  getResourceMetadata,
  getResourceListOfSeries,
} from './router/resource';
import { getResourceFile } from './router/actPoint';
import { getEnvVariableHandler } from './router/preview';
import { getContainerComponents } from './router/player';

import { HOME_DIR } from '../constant/configPath';

const cors = require('fastify-cors');

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
    fastifyServer.close();
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

  fastify.register(cors, {
    origin: true,
  });

  fastify.get('/resource', getResourceListOfSeries);
  fastify.get('/resource/:id/binary', getResourceBinary);
  fastify.head('/resource/:id/binary', getResourceBinary);
  fastify.get('/resource/:id/metadata', getResourceMetadata);
  fastify.get('/episode', getEpisodeList);
  fastify.get('/episode/:id/asset', getAssetList);
  fastify.get('/episode/:id/resource', getResourceList);
  fastify.get('/envVariable', getEnvVariableHandler);
  fastify.get('/containerComponents', getContainerComponents);
  fastify.get('/containerComponents.js', getContainerComponents);
  fastify.get('/containerComponents.js.map', getContainerComponents);
  fastify.get('/bson/containerComponents.js', getContainerComponents);
  fastify.get('/bson/containerComponents.js.map', getContainerComponents);
  fastify.get('/bson/:id', getAssetListForSdk);
  fastify.get('/bson/episodes', getEpisodeListForSdk);
  fastify.get('/bson/resources', getResourceListForSdk);
  fastify.get('*', getResourceFile);
  fastify.head('*', getResourceFile);

  fastify.listen(9999, '0.0.0.0');

  fastifyServer = fastify;
};

export const stopResourceServer = async () => {
  await fastifyServer?.close();
  fastifyServer = null;
};
