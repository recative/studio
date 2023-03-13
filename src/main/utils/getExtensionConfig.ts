import { getDb } from '../rpc/db';

export const getExtensionConfig = async (
  extensionConfigs: Record<string, string> | null = null
) => {
  const settings = extensionConfigs
    ? Object.entries(extensionConfigs).map(([key, value]) => ({ key, value }))
    : await (async () => {
        const db = await getDb();
        return db.setting.setting.find();
      })();

  const result: Record<string, Record<string, string>> = {};

  settings.forEach((setting) => {
    const [uploaderId, settingKey] = setting.key.split('~~');

    if (!uploaderId || settingKey === undefined) return;

    if (!result[uploaderId]) result[uploaderId] = {};
    result[uploaderId][settingKey] = setting.value;
  });

  return result;
};
