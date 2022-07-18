export function noUndefined<T>(items: (T | undefined)[]) {
  return items.filter((x): x is T => x !== undefined);
}
