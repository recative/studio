import { join } from 'path';
import { Agent } from 'https';

import fetch from 'node-fetch';
import StreamZip from 'node-stream-zip';

import { getBuildPath } from '../rpc/query/setting';

const httpsAgent = new Agent({
  rejectUnauthorized: false,
});

export const getEntryPointsFromCodeRelease = async (codeReleaseId: number) => {
  const buildPath = await getBuildPath();

  const codeBundlePath = join(
    buildPath,
    `code-${codeReleaseId.toString().padStart(4, '0')}.zip`
  );

  const codeBundle = new StreamZip.async({ file: codeBundlePath });
  const rawManifest = (
    await codeBundle.entryData('dist/manifest.json')
  ).toString();

  return JSON.parse(rawManifest) as Record<string, string>;
};

export const getEntryPointsFromApPackPreview = async (
  apHost: string,
  apProtocol: string
) => {
  const response = await fetch(`${apProtocol}://${apHost}/manifest.json`, {
    method: 'GET',
    agent: httpsAgent,
  });

  const manifest = await response.json();

  return manifest as Record<string, string>;
};
