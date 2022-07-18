export class ImageConvertFailed extends Error {
  name = 'ImageConvertFailed';

  constructor() {
    super('Unable to convert input image to PNG file');
  }
}

export const loadImage = async (url: string) => {
  const image = new Image();
  image.src = url;

  await new Promise<void>((resolve) => {
    image.onload = () => {
      resolve();
    };
  });

  const cw = 320;
  const ch = 240;
  const iw = image.width;
  const ih = image.height;

  const canvas = document.createElement('CANVAS') as HTMLCanvasElement;
  canvas.width = cw;
  canvas.height = ch;

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

  ctx.drawImage(image, x, y, pw, ph);

  const imageBlob = await new Promise<Blob>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) throw new ImageConvertFailed();

      resolve(blob);
    }, 'image/png');
  });

  return { imageBlob, width: cw, height: ch };
};
