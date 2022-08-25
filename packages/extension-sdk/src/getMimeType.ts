import FileType from 'file-type';
import mime from 'mime-types';

import { detectVideoMime } from './detectVideoMime';

import { getFilePath } from './getFilePath';

export const getMimeType = async (x: string | Buffer) => {
  const filePath = await getFilePath(x);
  const fileTypeFromBinary = await FileType.fromFile(filePath);

  const roughMime = fileTypeFromBinary?.mime || 'application/octet-stream';

  if (
    ['application/xml', 'plain/text', ''].includes(
      fileTypeFromBinary?.mime || ''
    )
  ) {
    const fileTypeFromMime = mime.lookup(filePath);

    return fileTypeFromMime || 'application/octet-stream';
  }

  if (roughMime.startsWith('video') || roughMime.startsWith('audio')) {
    try {
      const detailedMime = await detectVideoMime(filePath);

      return detailedMime;
    } catch (e) {
      return roughMime;
    }
  }
  return roughMime;
};
