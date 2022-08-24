import crypto from 'crypto';
import { h32 } from 'xxhashjs';
import { nanoid } from 'nanoid';
import { readFile } from 'fs-extra';

import { PreloadLevel } from '@recative/definitions';

import type { IResourceFile, IResourceGroup } from '@recative/definitions';

import { getMimeType } from './getMimeType';
import { getFilePath } from './getFilePath';

import type { Writable } from './types';
import type { IPostProcessedResourceFileForImport } from './resourceExtension';

export const getFileHash = async (x: string | Buffer) => {
  const binary = typeof x === 'string' ? await readFile(x) : x;

  const md5Hash = crypto.createHash('md5');

  const md5 = md5Hash.update(binary).digest('hex');

  return {
    md5,
    xxHash: h32(binary, 0x1bf52).toString(16),
  };
};

export class ResourceGroup {
  public definition: Writable<IResourceGroup> = {
    type: 'group',
    id: nanoid(),
    label: '',
    thumbnailSrc: '',
    importTime: Date.now(),
    removed: false,
    removedTime: -1,
    tags: [],
    files: [],
  };

  addFile = (
    file: ResourceFileForImport | IPostProcessedResourceFileForImport
  ) => {
    const definition = 'definition' in file ? file.definition : file;

    if (definition.resourceGroupId) {
      throw new TypeError('File already belongs to a group');
    }

    if (!this.definition.thumbnailSrc) {
      definition.resourceGroupId = this.definition.id;
      this.definition.files.push(definition.id);
    }
  };

  removeFile = (file: ResourceFileForImport) => {
    if (file.definition.resourceGroupId !== this.definition.id) {
      throw new TypeError('File does not belong to this group');
    }

    file.definition.resourceGroupId = '';
    this.definition.files = this.definition.files.filter(
      (x) => x !== file.definition.id
    );
  };

  finalize = () => {
    if (this.definition.label === '') {
      throw new TypeError('Group label is empty');
    }

    if (this.definition.files.length === 0) {
      throw new TypeError('Group has no files');
    }

    return this.definition as IResourceGroup;
  };
}

export class ResourceFileForImport {
  public definition: Writable<IPostProcessedResourceFileForImport> = {
    type: 'file',
    id: nanoid(),
    label: '',
    episodeIds: [],
    mimeType: '',
    url: {},
    managedBy: null,
    originalHash: '',
    convertedHash: {
      xxHash: '',
      md5: '',
    },
    cacheToHardDisk: false,
    preloadLevel: PreloadLevel.None,
    preloadTriggers: [],
    duration: null,
    removed: false,
    removedTime: -1,
    resourceGroupId: '',
    tags: [],
    importTime: Date.now(),
    extensionConfigurations: {},
    postProcessedThumbnail: null,
    postProcessedFile: '',
  };

  constructor(x?: IPostProcessedResourceFileForImport | IResourceFile) {
    if (x) {
      this.definition = {
        ...this.definition,
        ...JSON.parse(JSON.stringify(x)),
      };
    }
  }

  addFile = async (x: string | Buffer) => {
    this.definition.postProcessedFile = x;

    const hash = await getFileHash(x);

    this.definition.convertedHash = hash;

    if (this.definition.originalHash === '') {
      this.definition.originalHash = hash.xxHash;
    }

    if (this.definition.mimeType === '') {
      await this.updateMimeType();
    }
  };

  addToGroup = (group: ResourceGroup) => {
    group.addFile(this);
  };

  removeFromGroup = (group: ResourceGroup) => {
    group.removeFile(this);
  };

  inspectMimeType = async () => {
    if (this.definition.postProcessedFile === '') {
      throw new TypeError('PostProcessedFile is empty');
    }

    return getMimeType(this.definition.postProcessedFile);
  };

  updateMimeType = async () => {
    this.definition.mimeType = await this.inspectMimeType();
  };

  getFileBuffer = () => {
    if (this.definition.postProcessedFile === '') {
      throw new TypeError('PostProcessedFile is empty');
    }

    if (Buffer.isBuffer(this.definition.postProcessedFile)) {
      return Promise.resolve(this.definition.postProcessedFile);
    }

    return readFile(this.definition.postProcessedFile);
  };

  getFilePath = () => {
    if (this.definition.postProcessedFile === '') {
      throw new TypeError('PostProcessedFile is empty');
    }

    if (typeof this.definition.postProcessedFile === 'string') {
      return Promise.resolve(this.definition.postProcessedFile);
    }

    return getFilePath(this.definition.postProcessedFile);
  };

  cloneFrom = async (
    x:
      | ResourceFileForImport
      | IPostProcessedResourceFileForImport
      | IResourceFile
  ) => {
    const {
      id,
      url,
      mimeType,
      duration,
      importTime,
      originalHash,
      convertedHash,
      postProcessedFile,
      postProcessedThumbnail,
      ...definition
    } =
      x instanceof ResourceFileForImport
        ? x.definition
        : (x as IPostProcessedResourceFileForImport);

    // TODO: Implement a better strategy to merge tags and other configs.

    this.definition = {
      ...this.definition,
      ...JSON.parse(JSON.stringify(definition)),
    };
  };

  finalize = async () => {
    if (this.definition.label === '') {
      throw new TypeError('Label is empty');
    }

    if (this.definition.convertedHash.xxHash === '') {
      throw new TypeError('ConvertedHash.xxHash is empty');
    }

    if (this.definition.convertedHash.md5 === '') {
      throw new TypeError('ConvertedHash.md5 is empty');
    }

    if (this.definition.originalHash === '') {
      this.definition.originalHash = this.definition.convertedHash.xxHash;
    }

    if (this.definition.postProcessedFile === '') {
      throw new TypeError('PostProcessedFile is empty');
    }

    if (this.definition.mimeType === '') {
      await this.updateMimeType();
    }

    return this.definition as IPostProcessedResourceFileForImport;
  };
}
