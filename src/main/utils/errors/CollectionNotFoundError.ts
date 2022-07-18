export class CollectionNotFoundError extends Error {
  name = 'CollectionNotFoundError';

  constructor(name: string) {
    super(`The collection "${name}" you are looking for is not found`);
  }
}
