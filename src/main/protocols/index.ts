import { protocol } from 'electron';

import { jbMediaProtocolHandler } from './jbMedia';

export const initializeProtocols = () => {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: 'jb-media',
      privileges: {
        supportFetchAPI: true,
        secure: true,
        standard: true,
        corsEnabled: true,
      },
    },
  ]);
};

export const registerProtocols = () => {
  protocol.registerFileProtocol('jb-media', jbMediaProtocolHandler);
};
