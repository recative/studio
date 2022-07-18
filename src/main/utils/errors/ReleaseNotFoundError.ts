export class ReleaseNotFoundError extends Error {
  name = 'ReleaseNotFound';

  constructor() {
    super('The release you are looking for is not found');
  }
}
