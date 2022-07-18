import { randomString } from './randomString';

export const generateRandomActPoint = (count: number) =>
  Array(count)
    .fill(0)
    .map((_, index) => ({
      id: randomString(),
      title: `P${index}`,
      path: `${randomString()}/P${index}`,
    }));
