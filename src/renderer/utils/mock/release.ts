import { name, date, lorem } from 'faker';

export interface ISimpleRelease {
  id: number | string;
  committer: string;
  commitTime: number;
  notes: string;
}

export interface IBundleRelease {
  id: number;
  codeBuildId: number;
  mediaBuildId: number;
  committer: string;
  commitTime: number;
  notes: string;
}

export const generateRandomSimpleRelease = (count: number) => {
  return new Array(count).fill(0).map(
    (_, i) =>
      ({
        id: i + 100,
        committer: name.findName(),
        commitTime: date.past().getTime(),
        notes: lorem.sentence(),
      } as ISimpleRelease)
  );
};

export const generateRandomBundleRelease = (count: number) => {
  return new Array(count).fill(0).map(
    (_, i) =>
      ({
        id: i + 100,
        codeBuildId: Math.round(Math.random() * 100),
        mediaBuildId: Math.round(Math.random() * 100),
        committer: name.findName(),
        commitTime: date.past().getTime(),
        notes: lorem.sentence(),
      } as IBundleRelease)
  );
};
