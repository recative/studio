import { createTestEnvironment } from './utils/createTestEnvironment';

describe('data io', () => {
  const environment = createTestEnvironment();

  test('data could be added', async () => {
    const { collection, randomData, fillData } = await environment;

    fillData();

    const output = collection.find({});

    expect(output.length).toBe(randomData.length);
    expect(randomData.join(',')).toBe(output.map((x) => x.data).join(','));
  });

  test('data could be correctly saved', async () => {
    const { save } = await environment;
    const saveResult = save();

    saveResult.catch((e) => {
      console.error('saveResultErr', e);
    });

    await expect(saveResult).resolves.not.toThrow();
  });

  test('data is completely written', async () => {
    const { randomData, validateRaw } = await environment;

    const totalRecords = validateRaw();

    expect(totalRecords.length).toBe(randomData.length);
  });

  test('data could be read again from another collection correctly', async () => {
    const { collectionName, path, randomData } = await environment;
    const { collection: shadowCollection } = await createTestEnvironment(
      path,
      collectionName
    );

    const output = shadowCollection.find({});

    expect(output.length).toBe(randomData.length);
    expect(randomData.join(',')).toBe(output.map((x) => x.data).join(','));
  });

  test('Async insert test', async () => {
    const { collectionName, path, randomData, fillData, save, validateRaw } =
      await environment;

    for (let i = 0; i < 3; i += 1) {
      save();
      fillData();
    }

    await save();

    const totalRecords = validateRaw();

    expect(totalRecords.length).toBe(randomData.length);

    const { collection: shadowCollection } = await createTestEnvironment(
      path,
      collectionName
    );

    const output = shadowCollection.find({});

    expect(output.length).toBe(randomData.length);
    expect(randomData.join(',')).toBe(output.map((x) => x.data).join(','));
  });
});
