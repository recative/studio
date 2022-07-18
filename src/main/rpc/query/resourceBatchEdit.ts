import { debug } from 'debug';

import type { IResourceFile } from '@recative/definitions';

import {
  ARRAY_SEEK_FOR,
  OBJECT_SEEK_FOR,
  EDITABLE_FIELDS,
} from '../../../utils/batchEditConstants';
import { noUndefined } from '../../../utils/noUndefined';
import { isRecord } from '../../../utils/isRecord';
import type {
  IEditOperation,
  IEditRecordOperation,
  IEditArrayOperation,
} from '../../../utils/BatchEditTypes';
import { getDb } from '../db';
import { getResourceWithDetailedFileList } from './resource';

const log = debug('studio:batch');

const arrayElementHitBySelectingCondition = (
  x: boolean | number | string,
  seekFor: typeof ARRAY_SEEK_FOR[number]['seekFor'],
  where: string
) => {
  const strX = x.toString();

  if (seekFor === 'contains') {
    return strX.includes(where);
  }

  if (seekFor === 'eq') {
    return strX === where;
  }

  if (seekFor === 'startsWith') {
    return strX.startsWith(where);
  }

  if (seekFor === 'endsWith') {
    return strX.endsWith(where);
  }

  return false;
};

const recordElementHitBySelectingCondition = (
  key: string,
  value: boolean | number | string,
  seekFor: typeof OBJECT_SEEK_FOR[number]['seekFor'],
  where: string
) => {
  const strValue = value.toString();

  if (seekFor === 'keyEq') {
    return key === where;
  }

  if (seekFor === 'valEq') {
    return strValue === where;
  }

  if (seekFor === 'valStartsWith') {
    return strValue.startsWith(where);
  }

  if (seekFor === 'valEndsWith') {
    return strValue.endsWith(where);
  }

  if (seekFor === 'valContains') {
    return strValue.includes(where);
  }

  return false;
};

const updateArrayField = (
  file: IResourceFile,
  field: typeof EDITABLE_FIELDS[number],
  operation: IEditArrayOperation,
  dryRun = true
) => {
  const fieldKey = field.field;
  const fieldValue = file[fieldKey];

  if (!(fieldValue instanceof Array)) return null;

  if (operation.operation === 'add') {
    if (dryRun) {
      log(`[dryRun] [${file.id}] add ${operation.value} to ${fieldKey}`);
      return null;
    }

    (file[fieldKey] as string[]) = [...fieldValue, operation.value];
  }

  if (operation.operation === 'remove') {
    if (dryRun) {
      log(`[dryRun] [${file.id}] remove ${fieldKey}`);
      return null;
    }

    (file[fieldKey] as string[]) = fieldValue.filter(
      (x) =>
        !arrayElementHitBySelectingCondition(
          x,
          operation.seekFor,
          operation.where
        )
    );
  }

  if (operation.operation === 'edit') {
    if (dryRun) {
      log(`[dryRun] [${file.id}] update ${operation.value} from ${fieldKey}`);
      return null;
    }

    (file[fieldKey] as string[]) = fieldValue.map((x) => {
      if (
        arrayElementHitBySelectingCondition(
          x,
          operation.seekFor,
          operation.where
        )
      ) {
        return operation.value;
      }

      return x;
    });
  }

  return file;
};

const updateObjectField = (
  file: IResourceFile,
  field: typeof EDITABLE_FIELDS[number],
  operation: IEditRecordOperation,
  dryRun = true
) => {
  const fieldKey = field.field;
  const fieldValue = file[fieldKey];

  if (!isRecord(fieldValue)) return null;

  const recordKey = Object.entries(fieldValue).find(([key, value]) => {
    const matchedRecordKey = recordElementHitBySelectingCondition(
      key,
      value,
      operation.seekFor,
      operation.where
    );

    return matchedRecordKey;
  })?.[0];

  if (!recordKey) return null;

  if (operation.operation === 'add' || operation.operation === 'edit') {
    if (dryRun) {
      log(`[dryRun] [${file.id}] update ${operation.value} from ${fieldKey}`);
      return null;
    }

    (file[fieldKey] as Record<string, unknown>) = {
      ...file,
      [operation.key]: {
        ...fieldValue,
        [recordKey]: operation.value,
      },
    };
  }

  if (operation.operation === 'remove') {
    if (dryRun) {
      log(`[dryRun] [${file.id}] remove ${recordKey} of ${fieldKey}`);
      return null;
    }

    delete (file[fieldKey] as Record<string, unknown>)[recordKey];
  }

  return file;
};

export const batchUpdateResource = async (
  resourceIds: string[],
  operations: IEditOperation[],
  dryRun = false
) => {
  const db = await getDb();

  const resources = await Promise.all(
    resourceIds.map(getResourceWithDetailedFileList)
  );

  const files = noUndefined(resources.flatMap((x) => x?.files));

  // Update resources based on the operations
  files.forEach((file) => {
    // Check if the target field is object or array.
    operations.forEach((operation) => {
      const field = EDITABLE_FIELDS.find((x) => x.field === operation.field);
      if (!field) return;

      if (field.type === 'array') {
        const result = updateArrayField(
          file,
          field,
          operation as IEditArrayOperation,
          dryRun
        );

        if (result && !dryRun) {
          db.resource.resources.update(file);
        }
      } else if (field.type === 'object') {
        const result = updateObjectField(
          file,
          field,
          operation as IEditRecordOperation,
          dryRun
        );

        if (result && !dryRun) {
          db.resource.resources.update(file);
        }
      } else if (field.type === 'string') {
        if (dryRun) {
          log(
            `[dryRun] [${file.id}] update ${operation.value} from ${field.field}`
          );
          return;
        }

        (file[field.field] as string) = operation.value.toString();
        db.resource.resources.update(file);
      } else if (field.type === 'boolean') {
        if (dryRun) {
          log(
            `[dryRun] [${file.id}] update ${operation.value} from ${field.field}`
          );
          return;
        }

        (file[field.field] as boolean) = !!operation.value.toString();
        db.resource.resources.update(file);
      }
    });
  });
};
