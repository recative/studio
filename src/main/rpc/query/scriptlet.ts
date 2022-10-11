import { getScriptletInstances } from 'utils/getExtensionInstances';

export const executeScriptlet = async (
  extensionId: string,
  scriptId: string,
  payload: unknown
) => {
  const scriptletInstances = await getScriptletInstances('scriptlet');

  const extension = scriptletInstances[extensionId];

  if (!extension) {
    throw new TypeError('Extension not found');
  }

  const script = Reflect.get(extension, scriptId);

  if (script && typeof script === 'function') {
    script(payload);
  }
};
