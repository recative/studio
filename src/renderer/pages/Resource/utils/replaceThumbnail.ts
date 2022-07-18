import { server } from 'utils/rpc';
import { loadImage } from 'utils/loadImage';

export const replaceThumbnail = async (fileId: string) => {
  const filePath = `jb-media:///${fileId}.resource`;
  const image = await loadImage(filePath);

  const reader = new FileReader();
  reader.readAsDataURL(image.imageBlob);

  await new Promise((resolve) => {
    reader.onloadend = resolve;
  });

  const thumbnailBase64 = reader.result as string;
  return server.replaceThumbnail(fileId, thumbnailBase64);
};
