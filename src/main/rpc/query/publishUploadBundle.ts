import { TerminalStepStatus as Status } from '@recative/definitions';

import {
  newTerminalSession,
  wrapTaskFunction,
  updateTerminalStepStatus,
} from './terminal';
import { uploadDatabase } from './publishActServer';
import { uploadCodeBundle } from './publishUploadBundleCode';
import { uploadMediaBundle } from './publishUploadBundleMedia';
import { publishIosIpa } from './publishIpa';
import { publishRawBundle } from './publishRawBundle';
import { publishAndroidApk } from './publishApk';
import { publishAndroidAab } from './publishAab';
import { publishPlayerBundle } from './publishPlayerBundle';
import { postProcessResource } from './publishPostProcessResource';

import { getDb } from '../db';

import { ReleaseNotFoundError } from '../../utils/errors/ReleaseNotFoundError';
import { UploadingTaskLockedError } from '../../utils/errors/UploadingTaskLockedError';
import { getUploadLock, setUploadLock } from '../../utils/uploadTaskQueue';

import { IPublishTasks } from '../../../utils/IPublishTask';

/**
 *  Upload the release to remote server.
 *
 *  Available steps are:
 *  - `Environment Checkup`
 *  - `Uploading Media Files`
 *  - `Uploading Code Files`
 *  - `Uploading Database Files`
 *  - `Creating Player Data Bundle`
 *  - `Creating Android APK`
 *
 * @param id release ID of code release.
 * @param tasks Tasks to be done.
 * @param terminalId Output information to which terminal.
 */
export const uploadBundle = async (
  id: number | null,
  {
    mediaBundle,
    codeBundle,
    databaseBundle,
    playerBundle,
    rawBundle,
    androidPackage,
    aabPackage,
    iOSPackage,
    postProcessTest,
  }: IPublishTasks,
  terminalId = 'uploadBundle'
) => {
  if (terminalId === 'uploadBundle') {
    newTerminalSession(
      'uploadBundle',
      [
        mediaBundle && 'Uploading Media Files',
        codeBundle && 'Uploading Code Files',
        databaseBundle && 'Uploading Database Files',
        playerBundle && 'Creating Player Data Bundle',
        rawBundle && 'Creating Raw App Bundle',
        androidPackage && 'Creating Android APK',
        aabPackage && 'Creating Android AAB',
        iOSPackage && 'Creating iOS IPA',
        postProcessTest && 'Post Processing Test',
      ].filter(Boolean) as string[]
    );
  }

  const targetRelease = await wrapTaskFunction(
    terminalId,
    'Environment Checkup',
    async () => {
      if (id === null) throw new ReleaseNotFoundError();
      if (getUploadLock()) throw new UploadingTaskLockedError();

      setUploadLock(true);
      const db = await getDb();

      const result = db.release.bundleReleases.findOne({
        id: id || 0,
      });
      if (!result) throw new ReleaseNotFoundError();

      return result;
    }
  )();

  if (!targetRelease) {
    updateTerminalStepStatus(terminalId, 'Environment Checkup', Status.Failed);
    updateTerminalStepStatus(
      terminalId,
      'Uploading Media Files',
      Status.Failed
    );
    updateTerminalStepStatus(terminalId, 'Uploading Code Files', Status.Failed);
    updateTerminalStepStatus(
      terminalId,
      'Uploading Database Files',
      Status.Failed
    );
    setUploadLock(false);
    return;
  }

  await wrapTaskFunction(terminalId, 'Uploading Media Files', async () => {
    if (mediaBundle) {
      const mediaReleaseId = targetRelease.mediaBuildId;
      const mediaTaskQueue = await uploadMediaBundle(
        mediaReleaseId,
        terminalId
      );
      if (mediaTaskQueue.size === 0) {
        return;
      }

      await mediaTaskQueue.run();
    }
  })();

  await wrapTaskFunction(terminalId, 'Uploading Code Files', async () => {
    if (codeBundle) {
      const codeReleaseId = targetRelease.codeBuildId.toString();
      const codeTaskQueue = await uploadCodeBundle(codeReleaseId, terminalId);
      if (codeTaskQueue.size === 0) {
        return;
      }
      await codeTaskQueue.run();
    }
  })();

  await wrapTaskFunction(terminalId, 'Uploading Database Files', async () => {
    if (databaseBundle) {
      await uploadDatabase(id || 0, terminalId);
    }
  })();

  await wrapTaskFunction(
    terminalId,
    'Creating Player Data Bundle',
    async () => {
      if (playerBundle) {
        await publishPlayerBundle(
          targetRelease.codeBuildId,
          targetRelease.mediaBuildId,
          targetRelease.id,
          terminalId
        );
      }
    }
  )();

  await wrapTaskFunction(terminalId, 'Creating Raw App Bundle', async () => {
    if (rawBundle) {
      await publishRawBundle(
        targetRelease.codeBuildId,
        targetRelease.mediaBuildId,
        targetRelease.id,
        terminalId
      );
    }
  })();

  await wrapTaskFunction(terminalId, 'Creating Android APK', async () => {
    if (androidPackage) {
      await publishAndroidApk(
        targetRelease.codeBuildId,
        targetRelease.mediaBuildId,
        targetRelease.id,
        terminalId
      );
    }
  })();

  await wrapTaskFunction(terminalId, 'Creating Android AAB', async () => {
    if (aabPackage) {
      await publishAndroidAab(
        targetRelease.codeBuildId,
        targetRelease.mediaBuildId,
        targetRelease.id,
        terminalId
      );
    }
  })();

  await wrapTaskFunction(terminalId, 'Creating iOS IPA', async () => {
    if (iOSPackage) {
      await publishIosIpa(
        targetRelease.codeBuildId,
        targetRelease.mediaBuildId,
        targetRelease.id,
        terminalId
      );
    }
  })();

  await wrapTaskFunction(terminalId, 'Post Processing Test', async () => {
    if (postProcessTest) {
      await postProcessResource(targetRelease.mediaBuildId, terminalId);
    }
  })();

  setUploadLock(false);
};
