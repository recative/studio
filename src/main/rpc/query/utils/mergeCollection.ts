import { cleanupLoki } from './cleanupLoki';

export enum JoinMode {
  KeepOld = 'keepOld',
  KeepNew = 'keepNew',
}

export const mergeCollection = async <
  T extends Record<string, unknown>,
  K extends keyof T
>(
  to: Collection<T>,
  from: Collection<T>,
  joinKey: K,
  joinMode: JoinMode
) => {
  const addedDocumentSet = new Set<T>();
  const commonDocumentSet = new Set<T>();

  const toIdSet = new Set<T[K]>();

  for (let i = 0; i < to.data.length; i += 1) {
    toIdSet.add(to.data[i][joinKey]);
  }

  for (let i = 0; i < from.data.length; i += 1) {
    const fromId = from.data[i][joinKey];

    if (toIdSet.has(fromId)) {
      commonDocumentSet.add(from.data[i]);
    } else {
      addedDocumentSet.add(from.data[i]);
    }
  }

  const addedDocuments: T[] = [...addedDocumentSet].map((x) =>
    JSON.parse(JSON.stringify(cleanupLoki(x)))
  );

  from.insert(addedDocuments);

  if (joinMode === JoinMode.KeepNew) {
    addedDocumentSet.forEach((d) => {
      from.findAndUpdate(
        // @ts-ignore: This is intended
        { [joinKey]: d[joinKey] },
        (x) => {
          const nextData = JSON.parse(JSON.stringify(cleanupLoki(d)));
          return Object.assign(x, nextData);
        }
      );
    });
  }

  return to;
};
