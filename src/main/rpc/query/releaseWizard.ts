import { createBundles } from './bundle';
import { uploadCodeBundle } from './publishUploadBundleCode';
import { uploadMediaBundle } from './publishUploadBundleMedia';
import { newTerminalSession, wrapTaskFunction } from './terminal';
import {
  createCodeRelease,
  createMediaRelease,
  createBundleRelease,
} from './release';

export interface IReleaseWizardConfig {
  notes: string;
  codeReleaseId?: number;
  mediaReleaseId?: number;
  profileIds: string[];
  publishMediaRelease: boolean;
  publishCodeRelease: boolean;
}

export const releaseWizard = async (
  {
    notes,
    codeReleaseId,
    mediaReleaseId,
    profileIds,
    publishMediaRelease,
    publishCodeRelease,
  }: IReleaseWizardConfig,
  terminalId = 'releaseWizard'
) => {
  if (terminalId === 'releaseWizard') {
    newTerminalSession(terminalId, ['Building', 'Publishing', 'Bundling']);
  }

  const releaseDetail = await wrapTaskFunction(
    terminalId,
    'Building',
    async () => {
      const finalMediaReleaseId =
        typeof mediaReleaseId === 'undefined'
          ? await createMediaRelease(notes, terminalId)
          : mediaReleaseId;

      const finalCodeReleaseId =
        typeof codeReleaseId === 'undefined'
          ? await createCodeRelease(notes, terminalId)
          : codeReleaseId;

      if (finalCodeReleaseId === null) {
        throw new TypeError(`Invalid code release ID`);
      }

      const finalBundleReleaseId = await createBundleRelease(
        finalMediaReleaseId,
        finalCodeReleaseId,
        notes
      );

      return {
        mediaReleaseId: finalMediaReleaseId,
        codeReleaseId: finalCodeReleaseId,
        bundleReleaseId: finalBundleReleaseId,
      };
    }
  )();

  await wrapTaskFunction(terminalId, 'Publishing', async () => {
    if (!releaseDetail) {
      throw new TypeError(`Release detail not generated correctly.`);
    }

    if (publishMediaRelease) {
      await uploadMediaBundle(
        releaseDetail.mediaReleaseId,
        releaseDetail.bundleReleaseId,
        terminalId
      );
    }

    if (publishCodeRelease) {
      await uploadCodeBundle(releaseDetail.codeReleaseId, terminalId);
    }
  })();

  await wrapTaskFunction(terminalId, 'Bundling', async () => {
    if (!releaseDetail) {
      throw new TypeError(`Release detail not generated correctly.`);
    }

    return createBundles(
      profileIds,
      releaseDetail.bundleReleaseId,
      false,
      terminalId
    );
  })();
};
