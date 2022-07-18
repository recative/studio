import md5 from 'md5';
import { join, normalize } from 'path';

import OSS, { ClusterClient } from 'ali-oss';

import { Category, Uploader } from '@recative/definitions';

import type { IResourceFile, IRemoteFile } from '@recative/definitions';

export interface AliOSSUploaderPluginConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
  dirBase: string;
}

export class AliOSSUploader extends Uploader<keyof AliOSSUploaderPluginConfig> {
  static id = '@recative/uploader-extension-ali-oss/AliOSSUploader';

  static label = 'Ali OSS Uploader';

  static configUiFields = [
    {
      id: 'region',
      type: 'string',
      label: 'Region',
    },
    {
      id: 'accessKeyId',
      type: 'string',
      label: 'Access Key #',
    },
    {
      id: 'accessKeySecret',
      type: 'string',
      label: 'Access Key Secret',
    },
    {
      id: 'bucket',
      type: 'string',
      label: 'Bucket',
    },
    {
      id: 'dirBase',
      type: 'string',
      label: 'Path Base',
    },
  ] as const;

  static acceptedFileCategory = [
    Category.Image,
    Category.Video,
    Category.Audio,
    Category.Subtitle,
    Category.Triggers,
    Category.Others,
    Category.ApBundle,
  ];

  oss: ClusterClient;

  constructor(config: Record<string, string>) {
    super(config);
    this.oss = new OSS(this.config) as unknown as ClusterClient;
  }

  protected configValidator(
    x: Record<string, string>
  ): x is Record<keyof AliOSSUploaderPluginConfig, string> {
    return Object.keys(AliOSSUploader.configUiFields)
      .map((key) => {
        if (key === 'dirBase') return true;

        if (typeof x[key] !== 'string') {
          console.warn(`[Ali OSS Uploader] ${key} is not a string`);
        }

        return typeof x[key] === 'string';
      })
      .reduce((a, b) => a && b);
  }

  upload = async (
    buffer: Buffer,
    config: IResourceFile | string,
    pathPrefix?: string
  ) => {
    let fileHash = '';

    if (typeof config === 'string') {
      fileHash = md5(buffer);
    } else if (!config?.convertedHash?.md5) {
      fileHash = md5(buffer);
    } else if (config?.convertedHash?.md5 === '*') {
      fileHash = md5(buffer);
    } else {
      fileHash = config.convertedHash.md5;
    }

    const result = await this.oss.put(
      join(
        ...([
          this.config.dirBase || undefined,
          pathPrefix || undefined,
          typeof config === 'string' ? config : `${config.id}.resource`,
        ].filter((x) => !!x) as string[])
      ).replaceAll('\\', '/'),
      buffer,
      {
        mime: typeof config === 'string' ? undefined : config.mimeType,
        headers: {
          'Content-MD5': fileHash,
        },
      }
    );

    return result.url;
  };

  remove = (config: IResourceFile | string) => {
    console.log(config);
    throw new Error('Not Implemented!');
  };

  get = (config: IResourceFile | string) => {
    console.log(config);
    throw new Error('Not Implemented!');
  };

  list = async (): Promise<IRemoteFile[]> => {
    const result: OSS.ObjectMeta[] = [];

    let continuationToken: string | undefined;
    let triggeredList = false;

    const prefix =
      this.config.dirBase &&
      normalize(this.config.dirBase).replaceAll('\\', '/');

    while (continuationToken || !triggeredList) {
      // eslint-disable-next-line no-await-in-loop
      const fetchResult = await this.oss.listV2(
        {
          prefix,
          delimiter: '/',
          'max-keys': 1000 as unknown as string,
          'continuation-token': continuationToken,
        },
        {}
      );

      result.push(
        ...((fetchResult as unknown as OSS.ListObjectResult).objects || [])
      );

      continuationToken = (
        fetchResult as unknown as { nextContinuationToken: string }
      ).nextContinuationToken;
      triggeredList = true;
    }

    return result.map((item) => ({
      label: item.name,
      url: item.url,
    }));
  };
}
