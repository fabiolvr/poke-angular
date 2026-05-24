/**
 * Pagination math for the listing route. Pure functions — no Angular, no
 * RxJS — so they can be exercised in isolation. The router supplies
 * `?page=` as a string; `parsePageParam` is the one boundary that does
 * the dirty parsing and clamping.
 */

export const POKEMON_LIST_PAGE_SIZE = 20;

/**
 * Coerces an arbitrary `?page=` value into a 1-indexed integer ≥ 1.
 * Rejects NaN, Infinity, decimals, negative numbers, and non-numeric
 * strings — anything that wouldn't make sense as a page index.
 */
export const parsePageParam = (raw: string | undefined | null): number => {
  if (raw === undefined || raw === null || raw === '') return 1;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 1;
  if (!Number.isInteger(n)) return 1;
  if (n < 1) return 1;
  return n;
};

export const pageToOffset = (page: number, pageSize: number = POKEMON_LIST_PAGE_SIZE): number =>
  (page - 1) * pageSize;

/**
 * Total number of pages for a given total item count. Returns at least 1
 * so the UI can render "Page 1 of 1" even when total is 0.
 */
export const totalPages = (total: number, pageSize: number = POKEMON_LIST_PAGE_SIZE): number => {
  if (total <= 0) return 1;
  return Math.ceil(total / pageSize);
};

/** Clamps a requested page to the valid `[1, totalPages]` range. */
export const clampPage = (
  page: number,
  total: number,
  pageSize: number = POKEMON_LIST_PAGE_SIZE,
): number => {
  const max = totalPages(total, pageSize);
  if (page < 1) return 1;
  if (page > max) return max;
  return page;
};

/**
 * Builds the array of items for a paginator UI: a mix of page numbers and
 * `'ellipsis'` sentinels. Always includes page 1 and `totalPages`; shows a
 * window of ±`pageWindow` pages around `currentPage`. A gap of exactly one
 * hidden page is filled with that page number rather than an ellipsis — gaps
 * of two or more become `'ellipsis'`.
 */
export const buildPageItems = (
  currentPage: number,
  totalPages: number,
  pageWindow = 2,
): (number | 'ellipsis')[] => {
  if (totalPages <= 0) return [];
  if (totalPages === 1) return [1];

  const included = new Set<number>();
  included.add(1);
  included.add(totalPages);
  for (
    let p = Math.max(1, currentPage - pageWindow);
    p <= Math.min(totalPages, currentPage + pageWindow);
    p++
  ) {
    included.add(p);
  }

  const sorted = Array.from(included).sort((a, b) => a - b);
  const result: (number | 'ellipsis')[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    if (current === undefined) continue;
    if (i > 0) {
      const prev = sorted[i - 1];
      if (prev !== undefined) {
        const gap = current - prev;
        if (gap === 2) {
          result.push(prev + 1);
        } else if (gap > 2) {
          result.push('ellipsis');
        }
      }
    }
    result.push(current);
  }

  return result;
};

/** Calculates the 1-based item range for a given page (e.g. "items 21–40 of 1302"). */
export const pageItemRange = (
  currentPage: number,
  pageSize: number,
  totalItems: number,
): { from: number; to: number } => {
  if (totalItems <= 0) return { from: 0, to: 0 };
  return {
    from: (currentPage - 1) * pageSize + 1,
    to: Math.min(currentPage * pageSize, totalItems),
  };
};
