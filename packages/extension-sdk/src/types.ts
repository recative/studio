/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-explicit-any

import type { IResourceFile, IResourceGroup } from '@recative/definitions';

export type Writable<T> = { -readonly [P in keyof T]: T[P] };

export interface IPostProcessOperation {
  extensionId: string;
  postProcessHash: string;
}

export interface IPostProcessRecord {
  mediaBundleId: number[];
  operations: IPostProcessOperation[];
  isNormalResource?: boolean;
}

export interface IPostProcessRelatedData {
  postProcessRecord: IPostProcessRecord;
}

export interface IPostProcessedResourceFileRelatedData {
  fileName: string;
}

export interface IPostProcessedResourceGroupForUpload
  extends IPostProcessRelatedData,
    IResourceFile {}

export interface IPostProcessedResourceFileForImport
  extends Omit<IResourceFile, 'thumbnailSrc'> {
  postProcessedFile: string | Buffer;
  postProcessedThumbnail: string | Buffer | null;
}

export type PostProcessedResourceItemForImport =
  | IPostProcessedResourceFileForImport
  | IResourceGroup;

export interface IPostProcessedResourceFileForUpload
  extends IPostProcessRelatedData,
    IResourceFile,
    IPostProcessedResourceFileRelatedData {}

export type PostProcessedResourceItemForUpload =
  | IPostProcessedResourceFileForUpload
  | IPostProcessedResourceGroupForUpload;

export type InsertPostProcessedFileDefinition = (
  resource:
    | PostProcessedResourceItemForUpload
    | PostProcessedResourceItemForImport,
  eraseMediaBuildId?: number | null
) => Promise<void>;

export type UpdatePostProcessedFileDefinition = (
  resource:
    | PostProcessedResourceItemForUpload
    | PostProcessedResourceItemForImport
) => Promise<void>;

export type WriteBufferToResource = (
  buffer: Buffer,
  fileName: string | Pick<IResourceFile, 'id'>
) => Promise<string>;
