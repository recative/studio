export enum StorageType {
  Code = 'code',
  Metadata = 'metadata',
  Database = 'database',
  Unknown = 'unknown',
  Invalid = 'invalid',
}

interface ICodeDescription {
  type: StorageType.Code;
  seriesId: string;
  title: string;
}

interface IMetadataDescription {
  type: StorageType.Metadata;
  seriesId: string;
  releaseId: string;
  title: string;
}

interface IInvalidDescription {
  type: StorageType.Invalid;
}

interface IUnknownDescription {
  type: StorageType.Unknown;
  title: string;
}

interface IDatabaseDescription {
  type: StorageType.Database;
  seriesId: string;
  title: string;
}

export type IDescription =
  | ICodeDescription
  | IMetadataDescription
  | IInvalidDescription
  | IUnknownDescription
  | IDatabaseDescription;

export const parseStorageKey = (
  key: string | undefined,
  comment: string | undefined
): IDescription => {
  if (!key) return { type: StorageType.Invalid };

  const splitedKey = key.split('/');

  if (key.startsWith(`@`) && key.endsWith('/db')) {
    const dateKey = Number.parseFloat(splitedKey[1]);

    return {
      type: StorageType.Database,
      seriesId: splitedKey[0],
      title:
        dateKey > 10000
          ? new Date(dateKey).toLocaleString()
          : `Release ${splitedKey[1]}`,
    };
  }

  if (key.startsWith(`@`) && key.endsWith('/interfaceComponent')) {
    return {
      type: StorageType.Code,
      seriesId: splitedKey[0],
      title: 'Interface Component',
    };
  }

  if (
    key.startsWith(`@`) &&
    splitedKey.length === 3 &&
    comment &&
    (comment.startsWith('Client side metadata for ') ||
      comment.startsWith('Client side abstract for '))
  ) {
    const fileName = comment
      .replace('Client side metadata for ', '')
      .replace('Client side abstract for ', '');

    return {
      type: StorageType.Metadata,
      seriesId: splitedKey[0],
      releaseId: splitedKey[1],
      title: fileName === 'undefined' ? splitedKey[2] : fileName,
    };
  }

  return {
    type: StorageType.Unknown,
    title: key,
  };
};
