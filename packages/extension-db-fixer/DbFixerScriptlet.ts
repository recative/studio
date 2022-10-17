import {
  Scriptlet,
  ScriptType,
  ScriptExecutionMode,
} from '@recative/extension-sdk';
import type { IResourceItem } from '@recative/definitions';

export class DbFixerScriptlet extends Scriptlet<''> {
  static id = '@recative/extension-db-fixer/DbFixer';

  static label = 'Database Fixer';

  static extensionConfigUiFields = [] as const;

  static readonly scripts = [
    {
      id: 'fixingDb',
      label: 'Fixing Database',
      type: ScriptType.Resource,
      executeMode: ScriptExecutionMode.Terminal,
      confirmBeforeExecute: true,
    },
  ];

  fixingDb = async () => {
    const collection = this.dependency.db.resource.resources;

    const lokiIndex = new Set();
    const idIndex = new Set();

    const rawData = collection.data as (IResourceItem & {
      $loki: number;
      meta: {
        created: number;
        updated: number;
      };
    })[];

    const data = rawData
      .sort((a, b) => a.meta.created - b.meta.created)
      .filter((x) => {
        const duplicated = lokiIndex.has(x.$loki) || idIndex.has(x.id);
        lokiIndex.add(x.$loki);
        idIndex.add(x.id);

        if (duplicated) {
          this.dependency.logToTerminal(
            `:: collection=${collection.name}&$loki=${x.$loki} duplicated, will remove it`
          );
        }
        return !duplicated;
      })
      .sort((a, b) => a.$loki - b.$loki);

    const index = new Array(data.length);
    for (let i = 0; i < data.length; i += 1) {
      index[i] = data[i].$loki;
    }

    collection.data = data;
    collection.idIndex = index;
    collection.maxId = data?.length ? Math.max(...data.map((x) => x.$loki)) : 0;
    collection.dirty = true;
    collection.checkAllIndexes({
      randomSampling: true,
      repair: true,
    });
    collection.dirty = true;

    return {
      ok: true,
      message: 'Resource converted',
    };
  };
}
