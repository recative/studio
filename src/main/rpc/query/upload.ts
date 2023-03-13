/* eslint-disable no-await-in-loop */
/* eslint-disable @typescript-eslint/no-loop-func */
import { IUploadProfile } from '@recative/extension-sdk';

import { getDb } from '../db';

export const listUploadProfile = async () => {
  const db = await getDb();

  return db.setting.uploadProfile.find();
};

export const getUploadProfile = async (id: string) => {
  const db = await getDb();

  return db.setting.uploadProfile.findOne({ id });
};

export const addUploadProfile = async (profile: IUploadProfile) => {
  const db = await getDb();

  db.setting.uploadProfile.insert(profile);
};

export const updateOrInsertUploadProfile = async (profile: IUploadProfile) => {
  const db = await getDb();

  const q = db.setting.uploadProfile.findOne({ id: profile.id });
  if (q) {
    db.setting.uploadProfile.update({ ...q, ...profile });
  } else {
    db.setting.uploadProfile.insert(profile);
  }
};

export const removeUploadProfile = async (profile: IUploadProfile | string) => {
  const db = await getDb();

  if (typeof profile === 'string') {
    db.setting.uploadProfiles.removeWhere({ id: profile });
  } else {
    db.setting.uploadProfiles.removeWhere({ id: profile.id });
  }
};
