import { TerminalStepStatus as Status } from '@recative/studio-definitions';

import {
  newTerminalSession,
  wrapTaskFunction,
  updateTerminalStepStatus,
  logToTerminal,
} from './terminal';
import { uploadDatabase } from './publishActServer';
import { uploadMediaBundle } from './publishUploadBundleMedia';

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
  { mediaBundle, databaseBundle, postProcessTest }: IPublishTasks,
  terminalId = 'uploadBundle'
) => {
  if (terminalId === 'uploadBundle') {
    newTerminalSession(
      'uploadBundle',
      [
        mediaBundle && 'Uploading Media Files',
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
      logToTerminal(
        terminalId,
        `Preparing the uploading task for m.${targetRelease.mediaBuildId}`
      );

      const mediaReleaseId = targetRelease.mediaBuildId;
      const mediaTaskQueue = await uploadMediaBundle(
        mediaReleaseId,
        targetRelease.id,
        terminalId
      );

      logToTerminal(terminalId, `Media task queue length ${mediaTaskQueue}`);
    }
  })();

  await wrapTaskFunction(terminalId, 'Uploading Database Files', async () => {
    if (databaseBundle) {
      await uploadDatabase(id || 0, terminalId);
    }
  })();

  logToTerminal(terminalId, 'Syncing the database');
  await saveAllDatabase(await getDb());

  setUploadLock(false);
};
