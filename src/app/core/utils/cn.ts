type ClassValue =
  | string
  | number
  | false
  | null
  | undefined
  | Record<string, boolean | null | undefined>
  | ClassValue[];

/**
 * Tiny class-name composer in the spirit of `clsx`. Accepts strings, arrays,
 * and object maps of `{ className: condition }`. Falsy values (false, null,
 * undefined, '') are dropped. Whitespace is normalized.
 *
 * Kept in-tree (~15 LoC) instead of pulling clsx — every dependency is debt.
 */
export const cn = (...values: ClassValue[]): string => {
  const parts: string[] = [];
  for (const value of values) {
    if (!value) continue;
    if (typeof value === 'string') {
      parts.push(value);
    } else if (typeof value === 'number') {
      parts.push(String(value));
    } else if (Array.isArray(value)) {
      const nested = cn(...value);
      if (nested) parts.push(nested);
    } else {
      for (const key of Object.keys(value)) {
        if (value[key]) parts.push(key);
      }
    }
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
};
