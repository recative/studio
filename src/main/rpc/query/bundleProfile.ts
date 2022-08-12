import { IBundleProfile } from '@recative/extension-sdk';

import { getDb } from '../db';

export const listBundleProfile = async () => {
  const db = await getDb();

  return db.setting.bundleProfiles.find();
};

export const getBundleProfile = async (id: string) => {
  const db = await getDb();

  return db.setting.bundleProfiles.findOne({ id });
};

export const addBundleProfile = async (profile: IBundleProfile) => {
  const db = await getDb();

  db.setting.bundleProfiles.insert(profile);
};

export const updateOrInsertBundleProfile = async (profile: IBundleProfile) => {
  const db = await getDb();

  const q = db.setting.bundleProfiles.findOne({ id: profile.id });
  if (q) {
    db.setting.bundleProfiles.update({ ...q, ...profile });
  } else {
    db.setting.bundleProfiles.insert(profile);
  }
};

export const removeBundleProfile = async (profile: IBundleProfile | string) => {
  const db = await getDb();

  if (typeof profile === 'string') {
    db.setting.bundleProfiles.removeWhere({ id: profile });
  } else {
    db.setting.bundleProfiles.removeWhere({ id: profile.id });
  }
};
