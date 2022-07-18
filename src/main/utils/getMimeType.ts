import FileType from 'file-type';
import mime from 'mime-types';

export const getMimeType = async (filePath: string) => {
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
