import { TerminalStepStatus as Status } from '@recative/studio-definitions';

import {
  newTerminalSession,
  wrapTaskFunction,
  updateTerminalStepStatus,
  logToTerminal,
} from './terminal';
import { uploadDatabase } from './publishActServer';
import { uploadCodeBundle } from './publishUploadBundleCode';
import { uploadMediaBundle } from './publishUploadBundleMedia';
import { postProcessResource } from './publishPostProcessResource';

import { getDb, saveAllDatabase } from '../db';

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
  { mediaBundle, codeBundle, databaseBundle, postProcessTest }: IPublishTasks,
  terminalId = 'uploadBundle'
) => {
  if (terminalId === 'uploadBundle') {
    newTerminalSession(
      'uploadBundle',
      [
        mediaBundle && 'Uploading Media Files',
        codeBundle && 'Uploading Code Files',
        databaseBundle && 'Uploading Database Files',
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
        targetRelease.id,
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

  await wrapTaskFunction(terminalId, 'Post Processing Test', async () => {
    if (postProcessTest) {
      await postProcessResource(
        targetRelease.mediaBuildId,
        targetRelease.id,
        terminalId
      );
    }
  })();

  logToTerminal(terminalId, 'Syncing the database');
  saveAllDatabase(await getDb());

  setUploadLock(false);
};
