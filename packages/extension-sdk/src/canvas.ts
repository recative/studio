import { readFile } from 'fs/promises';
import { createCanvas, Image } from '@napi-rs/canvas';

export class ImageConvertFailed extends Error {
  name = 'ImageConvertFailed';

  constructor() {
    super('Unable to convert input image to PNG file');
  }
}

export const imageThumbnail = async (img: string | Buffer) => {
  const $img = new Image();
  $img.src = Buffer.isBuffer(img) ? img : await readFile(img);

  const cw = 320;
  const ch = 240;
  const iw = $img.width;
  const ih = $img.height;

  const canvas = createCanvas(cw, ch);
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error("This won't happen");
  }

  let x: number;
  let y: number;
  let pw: number;
  let ph: number;

  if (iw >= ih) {
    const scaleRatio = cw / iw;
    pw = cw;
    ph = Math.round(ih * scaleRatio);

    x = 0;
    y = (ch - ph) / 2;
  } else {
    const scaleRatio = ch / ih;
    pw = Math.round(iw * scaleRatio);
    ph = ch;

    x = (cw - pw) / 2;
    y = 0;
  }

  ctx.drawImage($img, x, y, pw, ph);

  return canvas.encode('png');
};
