import { createTestEnvironment } from './utils/createTestEnvironment';

test('initialize the collection', async () => {
  const { db, path } = await createTestEnvironment();

  expect(db.filename).toBe(path);

  db.close();
});
