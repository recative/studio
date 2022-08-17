import { encode } from '@msgpack/msgpack';
import { stringify as uglyJSONstringify } from '@recative/ugly-json';

export const stringify = (data: unknown, serializerId: string) => {
  let serializer: (x: unknown) => string | Uint8Array;

  switch (serializerId) {
    case 'json':
      serializer = JSON.stringify;
      break;
    case 'uson':
      serializer = uglyJSONstringify;
      break;
    case 'bson':
      serializer = encode;
      break;
    default:
      throw new Error('Unknown metadata format');
  }

  return serializer(data);
};
