import { server } from 'utils/rpc';
import { loadImage } from 'utils/loadImage';

export const uploadSingleFile = async (file: File, replaceFileId?: string) => {
  const filePath = file.path;
  const isImage = file.type.split('/')[0] === 'image';

  let thumbnailBase64: string | null = null;

  if (isImage) {
    const image = await loadImage(filePath);
    const reader = new FileReader();
    reader.readAsDataURL(image.imageBlob);

    await new Promise((resolve) => {
      reader.onloadend = resolve;
    });

    thumbnailBase64 = reader.result as string;
  }

  const result = await server.importFile(
    filePath,
    thumbnailBase64,
    replaceFileId
  );

  return result;
};
