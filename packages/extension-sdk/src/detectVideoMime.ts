/* eslint-disable no-underscore-dangle */
// This file is based on:
// https://gitlab.com/dominicp/get-video-mime/-/blob/master/lib/detect-mime.js
// With modification, under MIT License

import { Transform, pipeline } from 'stream';
import type { TransformCallback } from 'stream';
// @ts-ignore
import MP4Box from 'mp4box';

import { promisify } from 'util';
import { createReadStream } from 'fs';

type SetMimeFn = (x: string) => void;

class DetectMIME extends Transform {
  mime = '';

  chuckStart = 0;

  mp4boxFile = MP4Box.createFile();

  constructor(setMime: SetMimeFn) {
    super();

    // If MP4Box emits an error pass it down the stream
    this.mp4boxFile.onError = (error: Error) => {
      this.emit('error', error);
    };

    // When MP4Box has enough to parse the file, grab the MIME
    this.mp4boxFile.onReady = (info: { mime: string }) => {
      if (!info || !info.mime) {
        this.emit('error', new Error('Non MIME returned from MP4Box.js'));
        return;
      }

      this.mime = info.mime;

      // MP4Box.js reports opus audio as Opus in the codec string and Firefox doesn't like that
      // and it says the mime type is not supported. We'll special case this and lower case opus.
      this.mime = this.mime.replace('Opus', 'opus');

      setMime(this.mime);
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _transform(chunk: any, _: BufferEncoding, next: TransformCallback) {
    // No need to process if we already have the MIME
    if (this.mime) {
      next();
      return;
    }

    // Convert the Buffer into an ArrayBuffer
    // https://stackoverflow.com/a/31394257/931860
    const arrayBuffer = chunk.buffer.slice(
      chunk.byteOffset,
      chunk.byteOffset + chunk.byteLength
    );

    // This is required for MP4Box.js
    arrayBuffer.fileStart = this.chuckStart;

    // Add this chunk to MP4Box.js
    this.mp4boxFile.appendBuffer(arrayBuffer);

    // Increment the chunkStart
    this.chuckStart += chunk.byteLength;

    next();
  }

  _flush(next: TransformCallback) {
    // When we're done, output the detected MIME
    this.push(this.mime);

    // Signal that we are done processing
    next();
  }
}

const pipelinePromise = promisify(pipeline);

export const detectVideoMime = async (file: string) => {
  let mime = '';

  const setMime = (newMime: string) => {
    mime = newMime;
  };

  await pipelinePromise(createReadStream(file), new DetectMIME(setMime));

  if (!mime) {
    throw new TypeError(`Failed to detect MIME for ${file}`);
  }

  return mime;
};
