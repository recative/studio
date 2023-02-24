export interface PrimitiveTypeAnnotation {
  id: string;
  label: string;
  parse: (a: string) => any;
  stringify: (a: any) => string;
  validate: (a: any) => boolean;
}

export const primitiveTypeAnnotations: PrimitiveTypeAnnotation[] = [
  {
    id: 'string',
    label: 'String',
    parse: (x) => x,
    stringify: (x) => String(x),
    validate: () => true,
  },
  {
    id: 'number',
    label: 'Number',
    parse: (x) => Number.parseFloat(x),
    stringify: (x) => String(x),
    validate: (x) => !Number.isNaN(Number.parseFloat(x)),
  },
  {
    id: 'boolean',
    label: 'Boolean',
    parse: (x) => x === 'T' || x === 'True' || x === 'true',
    stringify: (x) => String(x),
    validate: (x) =>
      x === 'T' ||
      x === 'True' ||
      x === 'true' ||
      x === 'F' ||
      x === 'False' ||
      x === 'false',
  },
  {
    id: 'nan',
    label: 'NaN',
    parse: () => Number.NaN,
    stringify: () => `NaN`,
    validate: () => true,
  },
  {
    id: 'undefined',
    label: 'Undefined',
    parse: () => undefined,
    stringify: () => `undefined`,
    validate: () => true,
  },
  {
    id: 'null',
    label: 'Null',
    parse: () => null,
    stringify: () => `null`,
    validate: () => true,
  },
];
