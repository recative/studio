export const cleanupLoki = <T extends object>(x: T): T => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { $loki, meta, ...result } = x as any;
  return result as T;
};
