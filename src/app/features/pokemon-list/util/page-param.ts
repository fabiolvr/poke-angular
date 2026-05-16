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
