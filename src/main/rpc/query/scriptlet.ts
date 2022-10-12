import { IExecuteResult } from '@recative/extension-sdk';

import {
  logToTerminal,
  newTerminalSession,
  wrapTaskFunction,
} from './terminal';
import { getScriptletInstances } from '../../utils/getExtensionInstances';

export const executeScriptlet = async (
  extensionId: string,
  scriptId: string,
  payload: unknown
) => {
  newTerminalSession('scriptlet', ['Execute Scriptlet']);

  return wrapTaskFunction('scriptlet', 'Execute Scriptlet', async () => {
    logToTerminal('scriptlet', 'Initializing the scriptlet extension');
    const scriptletInstances = await getScriptletInstances('scriptlet');

    const extension = scriptletInstances[extensionId];

    if (!extension) {
      return {
        ok: false,
        message: 'Extension not exists',
      };
    }

    const script = Reflect.get(extension, scriptId);

    logToTerminal('scriptlet', 'Executing the script');

    if (script && typeof script === 'function') {
      const result = (await script(payload)) as Promise<IExecuteResult>;

      logToTerminal('scriptlet', 'Done!');

      return result;
    }

    return {
      ok: false,
      message: 'Script not exists',
    };
  })();
};
