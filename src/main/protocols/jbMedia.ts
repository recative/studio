import path from 'path';
import { pathExists } from 'fs-extra';

import { getWorkspace } from '../rpc/workspace';

export const jbMediaProtocolHandler = async (
  request: Electron.ProtocolRequest,
  callback: (response: Electron.ProtocolResponse) => void
) => {
  const filename = request.url.substr(11).slice(0, -1);

  const workspace = getWorkspace();

  const { mediaPath } = workspace;

  const fullUrl = path.join(mediaPath, filename);

  const fileExists = await pathExists(fullUrl);

  if (fileExists) {
    return callback({
      path: fullUrl,
    });
  }

  return callback({
    statusCode: 404,
  });
};
