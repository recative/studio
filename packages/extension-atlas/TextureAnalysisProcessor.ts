/* eslint-disable no-restricted-syntax */
/* eslint-disable no-labels */
/* eslint-disable no-await-in-loop */
import { Image, createCanvas } from '@napi-rs/canvas';

import { ResourceProcessor } from '@recative/extension-sdk';

import type { IResourceFile, IResourceItem } from '@recative/definitions';
import type {
  PostProcessedResourceItemForUpload,
  IPostProcessedResourceFileForUpload,
  IPostProcessedResourceFileForImport,
} from '@recative/extension-sdk';

export interface OfflineBundleConfig {
  enable: string;
}

export class TextureAnalysisProcessor extends ResourceProcessor<
  keyof OfflineBundleConfig
> {
  static id = '@recative/extension-rs-atlas/TextureAnalysisProcessor';

  static label = 'Texture Analysis';

  static resourceConfigUiFields = [] as const;

  static nonMergeableResourceExtensionConfiguration = [
    `${TextureAnalysisProcessor.id}~~tw`,
    `${TextureAnalysisProcessor.id}~~th`,
    `${TextureAnalysisProcessor.id}~~ex`,
    `${TextureAnalysisProcessor.id}~~ey`,
    `${TextureAnalysisProcessor.id}~~ew`,
    `${TextureAnalysisProcessor.id}~~eh`,
  ];

  async beforePublishMediaBundle(
    resources: IPostProcessedResourceFileForUpload[]
  ) {
    return resources;
  }

  afterGroupCreated() {
    return null;
  }

  beforePublishApplicationBundle(
    resources: (PostProcessedResourceItemForUpload | IResourceItem)[]
  ) {
    return resources;
  }

  static getImageData = (x: Image) => {
    const canvas = createCanvas(x.width, x.height);
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      throw new Error('Failed to get canvas context');
    }

    ctx.drawImage(x, 0, 0);
    return ctx.getImageData(0, 0, x.width, x.height);
  };

  static getImageEnvelope = (
    resource:
      | IResourceFile
      | IPostProcessedResourceFileForImport
      | IPostProcessedResourceFileForUpload
  ) => {
    return {
      x: Number.parseInt(
        resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ex`],
        10
      ),
      y: Number.parseInt(
        resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ey`],
        10
      ),
      w: Number.parseInt(
        resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ew`],
        10
      ),
      h: Number.parseInt(
        resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~eh`],
        10
      ),
    };
  };

  static calculateImageEnvelope = (
    resource:
      | IResourceFile
      | IPostProcessedResourceFileForImport
      | IPostProcessedResourceFileForUpload,
    image: Image
  ) => {
    const { width, height } = image;

    const imageData = this.getImageData(image);
    const { data } = imageData;
    const paddings = { top: 0, left: 0, right: width - 1, bottom: height - 1 };
    let hasPixel = false;

    leftSide: for (let i = 0; i < width; i += 1) {
      for (let j = 0; j < height; j += 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.left = i;
          hasPixel = true;
          break leftSide;
        }
      }
    }

    rightSide: for (let i = width - 1; i >= 0; i -= 1) {
      for (let j = height - 1; j >= 0; j -= 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.right = i;
          hasPixel = true;
          break rightSide;
        }
      }
    }

    topSide: for (let j = 0; j < height; j += 1) {
      for (let i = 0; i < width; i += 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.top = j;
          hasPixel = true;
          break topSide;
        }
      }
    }

    bottomSide: for (let j = height - 1; j >= 0; j -= 1) {
      for (let i = width - 1; i >= 0; i -= 1) {
        const alpha = data[(j * width + i) * 4 + 3];
        if (alpha > 0) {
          paddings.bottom = j;
          hasPixel = true;
          break bottomSide;
        }
      }
    }

    if (!hasPixel) {
      paddings.right = 1;
      paddings.bottom = 1;
    }

    const numberArray: Array<number> = [];

    for (let j = paddings.top; j <= paddings.bottom; j += 1) {
      for (let i = paddings.left; i <= paddings.right; i += 1) {
        const index = j * width + i;
        numberArray.push(data[index * 4]);
        numberArray.push(data[index * 4 + 1]);
        numberArray.push(data[index * 4 + 2]);
        numberArray.push(data[index * 4 + 3]);
      }
    }

    const result = {
      x: paddings.left,
      y: paddings.top,
      w: paddings.right - paddings.left,
      h: paddings.bottom - paddings.top,
    };

    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~tw`] =
      width.toString();
    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~th`] =
      height.toString();
    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ex`] =
      result.x.toString();
    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ey`] =
      result.y.toString();
    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~ew`] =
      result.w.toString();
    resource.extensionConfigurations[`${TextureAnalysisProcessor.id}~~eh`] =
      result.h.toString();

    return result;
  };

  beforeFileImported = async (
    resources: IPostProcessedResourceFileForImport[]
  ) => {
    for (let i = 0; i < resources.length; i += 1) {
      const resource = resources[i];

      if (resource.type !== 'file') {
        continue;
      }

      const isImage = resource.mimeType.startsWith('image');

      if (!isImage) {
        continue;
      }

      const image = new Image();
      image.src = await this.dependency.getFileBuffer(
        resource.postProcessedFile
      );

      resource.postProcessedThumbnail = await this.dependency.imageThumbnail(
        resource.postProcessedFile
      );

      TextureAnalysisProcessor.calculateImageEnvelope(resource, image);
    }
    return resources;
  };

  beforePreviewResourceBinaryDelivered = () => null;

  beforePreviewResourceMetadataDelivered = () => null;

  generateThumbnail = () => null;
}
