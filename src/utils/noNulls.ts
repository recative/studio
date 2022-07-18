export function noNulls<T>(items: (T | null)[]) {
  return items.filter((x): x is T => x !== null);
}
