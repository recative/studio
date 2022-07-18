export class UploadingTaskLockedError extends Error {
  name = 'UploadingTaskLockedError';

  constructor() {
    super('Uploading task is in progress, unable to start a new one');
  }
}
