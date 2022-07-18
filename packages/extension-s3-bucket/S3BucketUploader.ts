import md5 from 'md5';
import { homedir } from 'os';
import { join, normalize } from 'path';

import ini from 'ini';
import {
  S3Client,
  PutObjectCommand,
  ListObjectsCommand,
} from '@aws-sdk/client-s3';
import { readFileSync, writeFileSync } from 'fs-extra';

import type { _Object } from '@aws-sdk/client-s3';

import { Category, Uploader } from '@recative/definitions';
import type { IResourceFile, IRemoteFile } from '@recative/definitions';

export interface S3BucketPluginConfig {
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
  dirBase: string;
  urlSchema: string;
}

interface IAwsConfigUnit {
  aws_access_key_id: string;
  aws_secret_access_key: string;
}

type AwsConfigSet = Record<string, IAwsConfigUnit>;

export class S3Uploader extends Uploader<keyof S3BucketPluginConfig> {
  static id = '@recative/uploader-extension-s3-oss/S3Uploader';

  static label = 'Amazon S3 Uploader';

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
      label: 'Secret Access Key',
    },
    {
      id: 'bucket',
      type: 'string',
      label: 'Bucket',
    },
    {
      id: 'urlSchema',
      type: 'string',
      label: 'URL Schema',
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
  ];

  private configFilePath = join(homedir(), '.aws', 'credentials');

  private get awsConfigSet() {
    return ini.parse(
      readFileSync(this.configFilePath, { encoding: 'utf8' })
    ) as AwsConfigSet;
  }

  private set awsConfigSet(x) {
    writeFileSync(this.configFilePath, ini.stringify(x));
  }

  private get awsConfig() {
    const configItem = this.awsConfigSet['resource-manager'];

    if (!configItem) return null;

    return {
      accessKeyId: configItem.aws_access_key_id,
      secretAccessKey: configItem.aws_secret_access_key,
    };
  }

  private set awsConfig(x) {
    const awsConfig = this.awsConfigSet;
    if (!x) throw new SyntaxError('Unable to set config as null');

    awsConfig['resource-manager'] = {
      aws_access_key_id: x.accessKeyId,
      aws_secret_access_key: x.secretAccessKey,
    };

    this.awsConfigSet = awsConfig;
  }

  s3: S3Client;

  constructor(config: Record<string, string>) {
    super(config);

    if (!this.configValidator(config)) throw new Error('?');

    const { awsConfig } = this;
    let needUpdateConfigFile = false;

    if (awsConfig) {
      if (awsConfig.accessKeyId !== config.accessKeyId) {
        needUpdateConfigFile = true;
      }
      if (awsConfig.secretAccessKey !== config.secretAccessKey) {
        needUpdateConfigFile = true;
      }
    } else {
      needUpdateConfigFile = true;
    }

    if (needUpdateConfigFile) {
      this.awsConfig = config;
    }

    this.s3 = new S3Client({
      region: config.region,
    });
  }

  protected configValidator(
    x: Record<string, string>
  ): x is Record<keyof S3BucketPluginConfig, string> {
    return Object.keys(S3Uploader.configUiFields)
      .map((key) => typeof x[key] === 'string')
      .reduce((a, b) => a && b);
  }

  upload = async (
    binary: Blob | Uint8Array | File | Buffer,
    config: IResourceFile | string,
    pathPrefix?: string
  ) => {
    const buffer = Buffer.from(binary);

    const fileHash =
      typeof config === 'string' ? md5(buffer) : config.convertedHash.md5;

    const filePath = join(
      ...([
        this.config.dirBase || undefined,
        pathPrefix || undefined,
        'resources',
        typeof config === 'string' ? config : config.id,
      ].filter((x) => !!x) as string[])
    );

    const uploadParams = {
      Bucket: this.config.bucket,
      Key: filePath,
      Body: buffer,
      Headers: {
        'Content-MD5': fileHash,
      },
    };

    await this.s3.send(new PutObjectCommand(uploadParams));

    return this.config.urlSchema.replace(':key', filePath);
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
    const result: _Object[] = [];

    let truncated = true;
    let pageMarker: string | undefined;

    const prefix =
      this.config.dirBase &&
      normalize(this.config.dirBase).replaceAll('\\', '/');

    while (truncated) {
      // eslint-disable-next-line no-await-in-loop
      const response = await this.s3.send(
        new ListObjectsCommand({
          Bucket: this.config.bucket,
          Marker: pageMarker,
          Prefix: prefix,
        })
      );

      if (!response.Contents) break;

      truncated = !!response.IsTruncated;

      if (truncated) {
        pageMarker = response.Contents.slice(-1)[0].Key;
      }
    }

    return result
      .map((item) => {
        if (!item.Key) return null;
        return {
          label: item.Key,
          url: this.config.urlSchema.replace(':key', item.Key),
        };
      })
      .filter((x) => x !== null) as IRemoteFile[];
  };
}
