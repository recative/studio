/* eslint-disable no-await-in-loop */
import md5 from 'md5';
import sha1 from 'sha1';
import base64 from 'base64-js';
import fetch from 'node-fetch';

import { PlvNodeVideoUpload } from '@recative/polyv';

import { Category, Uploader } from '@recative/definitions';
import type { IResourceFile, IRemoteFile } from '@recative/definitions';

import type { VideoInfo } from './apiResponse';

export interface PolyVUploaderPluginConfig {
  userId: string;
  secretKey: string;
  writeToken: string;
}

export class PolyVUploader extends Uploader<keyof PolyVUploaderPluginConfig> {
  static id = '@recative/uploader-polyv-vod/PolyVUploader';

  static label = 'PolyV VOD Uploader';

  static configUiFields = [
    {
      id: 'userId',
      type: 'string',
      label: 'User #',
    },
    {
      id: 'secretKey',
      type: 'string',
      label: 'Secret Key',
    },
    {
      id: 'writeToken',
      type: 'string',
      label: 'Write Token',
    },
  ] as const;

  static acceptedFileCategory = [Category.Video, Category.Audio];

  protected configValidator(
    x: Record<string, string>
  ): x is Record<keyof PolyVUploaderPluginConfig, string> {
    return Object.keys(PolyVUploader.configUiFields)
      .map((key) => typeof x[key] === 'string')
      .reduce((a, b) => a && b);
  }

  upload = async (buffer: Buffer, config: IResourceFile | string) => {
    if (typeof config === 'string') {
      throw new TypeError('Unable to upload a string');
    }

    const now = Date.now();
    const sign = md5(`${this.config.secretKey}${now}`);
    const userData = {
      userid: this.config.userId,
      ptime: now,
      sign,
      hash: md5(`${now}${this.config.writeToken}`),
    };

    const polyV = new PlvNodeVideoUpload();
    await polyV.updateUserData(userData);

    const file = await polyV.upload(buffer, config.label, config.mimeType);

    const promiseExecutor = (resolve: () => void) => {
      console.info('Transcode info not ready');
      globalThis.setTimeout(resolve, 300);
    };

    while (true) {
      const requestTime = Date.now();

      const fetchSign = sha1(
        `ptime=${requestTime}&vid=${file.vid}${this.config.secretKey}`
      ).toUpperCase();

      const url = new URL(
        `http://api.polyv.net/v2/video/${this.config.userId}/get-video-info`
      );

      url.searchParams.append('ptime', requestTime.toString());
      url.searchParams.append('sign', fetchSign);
      url.searchParams.append('vid', file.vid);

      const response = await fetch(url);
      const body = (await response.json()) as VideoInfo;

      if ('code' in body && body.message !== 'success') {
        throw new Error(body.message);
      }

      const { transcodeInfos } = body.data[0];

      if (!transcodeInfos.length) {
        await new Promise<void>(promiseExecutor);
        continue;
      }

      const result = transcodeInfos.map((transcodeInfo) => {
        return {
          url: transcodeInfo.playUrl,
          width: transcodeInfo.width,
          height: transcodeInfo.height,
        };
      });

      return `jb-multipart://${base64.fromByteArray(
        Uint8Array.from(JSON.stringify(result), (x) => x.charCodeAt(0))
      )}`;
    }
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
    throw new Error('Not Implemented!');
  };
}
