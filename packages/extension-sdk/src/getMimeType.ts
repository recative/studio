import FileType from 'file-type';
import mime from 'mime-types';

import { getFilePath } from './getFilePath';

export const getMimeType = async (x: string | Buffer) => {
  const filePath = await getFilePath(x);
  const fileTypeFromBinary = await FileType.fromFile(filePath);

  if (
    ['application/xml', 'plain/text', ''].indexOf(
      fileTypeFromBinary?.mime || ''
    ) >= 0
  ) {
    const fileTypeFromMime = mime.lookup(filePath);

    return fileTypeFromMime || 'application/octet-stream';
  }

  return fileTypeFromBinary?.mime || 'application/octet-stream';
};
