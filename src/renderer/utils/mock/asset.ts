import { nanoid } from 'nanoid';
import { sample } from 'lodash';

import { LabelType, tagsByType } from '@recative/definitions';
import type { IResourceTag } from '@recative/definitions';

import { randomString } from './randomString';

export interface IResourceItem {
  id: string;
  assetId: string;
  thumbnailSrc: string;
  label: string;
  tags: Set<IResourceTag>;
}

export const generateMockResourceTag = () => {
  const result = new Set<IResourceTag>();

  Object.values(LabelType).forEach((labelType) => {
    if (Math.random() < 0.4) return;
    const tagsOfType = tagsByType[labelType];
    const randomItem = sample(tagsOfType);

    if (randomItem) result.add(randomItem);
  });

  return result;
};

export const generateMockAsset = (count: number) => {
  return new Array(count).fill(0).map((): IResourceItem => {
    const id = nanoid();
    const assetId = `video:${id}`;

    return {
      id,
      assetId,
      label: `${randomString()}.png`,
      thumbnailSrc: `https://picsum.photos/200/300?key=${Math.random()}`,
      tags: generateMockResourceTag(),
    };
  });
};
