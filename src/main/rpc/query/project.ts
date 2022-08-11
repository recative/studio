import { unlockDb } from './lock';
import { resetDb } from '../db';

export const closeDb = async () => {
  await resetDb();
  await unlockDb();
};
