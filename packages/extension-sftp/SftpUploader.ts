import { join } from 'path';

import Client from 'ssh2-sftp-client';

import { Category } from '@recative/definitions';
import { Uploader } from '@recative/extension-sdk';

import type { IRemoteFile } from '@recative/extension-sdk';
import type { IResourceFile } from '@recative/definitions';

export interface SftpUploaderPluginConfig {
  host: string;
  port: string;
  username: string;
  password: string;
  dirBase: string;
  urlSchema: string;
}

export class SftpUploader extends Uploader<keyof SftpUploaderPluginConfig> {
  static id = '@recative/uploader-extension-sftp/SftpUploader';

  static label = 'SFTP Uploader';

  static configUiFields = [
    {
      id: 'host',
      type: 'string',
      label: 'Host',
      required: true,
    },
    {
      id: 'port',
      type: 'string',
      label: 'Port',
      required: true,
    },
    {
      id: 'username',
      type: 'string',
      label: 'User Name',
      required: true,
    },
    {
      id: 'password',
      type: 'string',
      label: 'Password',
      required: true,
    },
    {
      id: 'dirBase',
      type: 'string',
      label: 'Path Base',
    },
    {
      id: 'urlSchema',
      type: 'string',
      label: 'URL Schema',
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

  client = new Client();

  ensureConnected = async () => {
    try {
      await this.client.cwd();
    } catch (e) {
      const port = Number.parseInt(this.config.port, 10);

      if (Number.isNaN(port)) {
        throw new TypeError(`Invalid port number: ${port}`);
      }

      await this.client.connect({
        host: this.config.host,
        port,
        username: this.config.username,
        password: this.config.password,
      });
    }
  };

  upload = async (
    buffer: Buffer,
    config: IResourceFile | string,
    pathPrefix?: string
  ) => {
    const filePath = join(
      ...([
        this.config.dirBase || undefined,
        pathPrefix || undefined,
        typeof config === 'string' ? config : `${config.id}.resource`,
      ].filter((x) => !!x) as string[])
    ).replaceAll('\\', '/');

    await this.client.put(buffer, filePath);

    return this.config.urlSchema.replace(':key', filePath);
  };

  remove = (config: IResourceFile | string) => {
    // eslint-disable-next-line no-console
    console.log(config);
    throw new Error('Not Implemented!');
  };

  get = (config: IResourceFile | string) => {
    // eslint-disable-next-line no-console
    console.log(config);
    throw new Error('Not Implemented!');
  };

  list = async (): Promise<IRemoteFile[]> => {
    return (await this.client.list(this.config.dirBase))
      .filter((x) => x.type === '-')
      .map((item) => {
        const filePath = item.name;

        return {
          label: item.name,
          url: this.config.urlSchema.replace(':key', filePath),
        };
      });
  };
}
