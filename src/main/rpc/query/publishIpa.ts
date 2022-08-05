/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import { publishApp } from './utils/publishApp';

/**
 * Execute all functions in this file one by one.
 *
 * @param codeReleaseId release ID of code release.
 * @param mediaReleaseId release ID of media release.
 * @param bundleReleaseId release ID of bundle release.
 * @param terminalId Output information to which terminal.
 */
export const publishIosIpa = async (
  codeReleaseId: number,
  mediaReleaseId: number,
  bundleReleaseId: number,
  terminalId: string
) => {
  const ipaFileName = `ios-${bundleReleaseId.toString().padStart(4, '0')}.ipa`;

  await publishApp({
    codeReleaseId,
    mediaReleaseId,
    bundleReleaseId,
    configFormat: 'json',
    appTemplateFileName: 'template.ipa',
    appTemplateFromPath: null,
    webRootTemplateFileName: 'mobile-web-root.zip',
    outputPublicPath: 'Payload/App.app/public',
    outputFileName: ipaFileName,
    terminalId,
  });
};
