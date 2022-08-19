/* eslint-disable @typescript-eslint/no-unused-vars */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Writable<T> = { -readonly [P in keyof T]: T[P] };
