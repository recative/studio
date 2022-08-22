import {
  videoCategoryTag,
  audioCategoryTag,
  subtitleCategoryTag,
  imageCategoryTag,
  videoGroupResourceTag,
  generalGroupResourceTag,
  textureGroupResourceTag,
  frameSequenceGroupResourceTag,
} from '@recative/definitions';
import type {
  IGroupTypeResourceTag,
  IResourceFile,
} from '@recative/definitions';

interface IValidGroupTypeResult {
  types: IGroupTypeResourceTag[];
  error: null;
}

interface IInvalidGroupTypeResult {
  types: null;
  error: string;
}

export const getGroupType = (
  files: IResourceFile[]
): IValidGroupTypeResult | IInvalidGroupTypeResult => {
  let videoCount = 0;
  let audioCount = 0;
  let subtitleCount = 0;
  let imageCount = 0;
  let invalidCount = 0;

  for (let i = 0; i < files.length; i += 1) {
    const file = files[i];

    let valid = false;
    for (let j = 0; j < file.tags.length; j += 1) {
      const tag = file.tags[j].endsWith('!')
        ? file.tags[j].slice(0, -1)
        : file.tags[j];

      if (tag === videoCategoryTag.id) {
        videoCount += 1;
        valid = true;
      } else if (tag === audioCategoryTag.id) {
        audioCount += 1;
        valid = true;
      } else if (tag === subtitleCategoryTag.id) {
        subtitleCount += 1;
        valid = true;
      } else if (tag === imageCategoryTag.id) {
        imageCount += 1;
        valid = true;
      }
    }

    if (!valid) {
      invalidCount += 1;
    }
  }

  const isVideoGroup = videoCount + audioCount + subtitleCount > 1;
  const isTextureGroup = imageCount > 1;

  let error: string | null = null;

  if (isVideoGroup && isTextureGroup) {
    error = 'There is a conflict in the resource type of the selected file.';
  }
  // else if (!isVideoGroup && !isTextureGroup) {
  //  error = 'There are no resources that can be grouped.';
  // }
  // else if (invalidCount) {
  //   error = 'The resource group contains file types that are not supported.';
  // }

  if (error) {
    return {
      types: null,
      error,
    } as IInvalidGroupTypeResult;
  }

  let types: IGroupTypeResourceTag[];

  if (isVideoGroup) {
    types = [videoGroupResourceTag, generalGroupResourceTag];
  } else if (isTextureGroup) {
    types = [
      textureGroupResourceTag,
      frameSequenceGroupResourceTag,
      generalGroupResourceTag,
    ];
  } else {
    types = [generalGroupResourceTag];
    // throw new Error('Unprocessed edge condition.');
  }

  return {
    types,
    error: null,
  } as IValidGroupTypeResult;
};
