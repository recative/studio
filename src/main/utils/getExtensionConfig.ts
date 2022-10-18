import { getDb } from '../rpc/db';

export const getExtensionConfig = async () => {
  const db = await getDb();

  const settings = db.setting.setting.find();

  const result: Record<string, Record<string, string>> = {};

  settings.forEach((setting) => {
    const [uploaderId, settingKey] = setting.key.split('~~');

    if (!uploaderId || settingKey === undefined) return;

    if (!result[uploaderId]) result[uploaderId] = {};
    result[uploaderId][settingKey] = setting.value;
  });

  return result;
};
