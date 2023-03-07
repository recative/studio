import { dirSync } from 'tmp';
import { SimpleGit, simpleGit } from 'simple-git';

import { join, dirname } from 'path';

import { Category } from '@recative/definitions';
import { Uploader } from '@recative/extension-sdk';

import type { IRemoteFile } from '@recative/extension-sdk';
import type { IResourceFile } from '@recative/definitions';
import { ensureDir, writeFile } from 'fs-extra';

export interface GitUploaderPluginConfig {
  repo: string;
  urlSchema: string;
}

export class GitUploader extends Uploader<keyof GitUploaderPluginConfig> {
  static id = '@recative/uploader-extension-git/GitUploader';

  static label = 'Git Uploader';

  static configUiFields = [
    {
      id: 'repo',
      type: 'string',
      label: 'Repository URL',
      required: true,
    },
    {
      id: 'urlSchema',
      type: 'string',
      label: 'URL Schema',
    },
  ] as const;

  static acceptedFileCategory = [Category.ApBundle];

  client: SimpleGit | null = null;

  baseDir: string | null = null;

  initializeUpload = async () => {
    const dir = dirSync();

    this.baseDir = dir.name;

    const client = simpleGit({
      baseDir: dir.name,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    });

    this.client = client;

    await client.init();
    await client.addRemote('origin', this.config.repo);
  };

  finalizeUpload = async () => {
    if (!this.client) {
      throw new TypeError(`Client not initialized`);
    }

    await this.client.raw(['add', '*']);
    await this.client.commit(`deploy: ${new Date().toLocaleString()}`);
    await this.client.raw(['push', '--set-upstream', 'origin', 'master', '-f']);
  };

  upload = async (
    buffer: Buffer,
    config: IResourceFile | string,
    pathPrefix?: string
  ) => {
    if (!this.client) {
      throw new TypeError(`Client not initialized`);
    }

    const filePath = join(
      ...([
        this.baseDir ?? '',
        pathPrefix || undefined,
        typeof config === 'string' ? config : `${config.id}.resource`,
      ].filter((x) => !!x) as string[])
    ).replaceAll('\\', '/');

    await ensureDir(dirname(filePath));
    await writeFile(filePath, buffer);

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
    const dir = dirSync();

    const client = simpleGit({
      baseDir: dir.name,
      binary: 'git',
      maxConcurrentProcesses: 6,
      trimmed: false,
    });

    await client.clone(this.config.repo, dir.name, [
      ' --no-checkout',
      '--depth 1',
    ]);

    return (
      await client.raw(['ls-tree', '--full-name', '--name-only', '-r HEAD'])
    )
      .split(/\s/)
      .map((x) => ({
        label: x,
        url: this.config.urlSchema.replace(':key', x),
      }));
  };
}
