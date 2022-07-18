import type { IDataSlot } from '@recative/definitions';

import { getDb } from '../db';

export const listDataSlots = async (itemIds: string[] | null = null) => {
  const db = await getDb();

  const dataSlots = db.cloud.dataSlots.find(
    itemIds ? { id: { $in: itemIds } } : {}
  ) as IDataSlot[];

  return dataSlots;
};

export const updateOrInsertDataSlots = async (items: IDataSlot[]) => {
  const db = await getDb();

  items.forEach((item) => {
    const itemInDb = db.cloud.dataSlots.findOne({ id: item.id });

    if (itemInDb) {
      // Update
      Object.assign(itemInDb, item);
      db.cloud.dataSlots.update(itemInDb);
    } else {
      // Insert
      db.cloud.dataSlots.insert(item);
    }
  });
};
