/**
 * Locale-aware formatters for the units PokéAPI ships in:
 *   - height: decimetres (1 dm = 0.1 m)
 *   - weight: hectograms (1 hg = 0.1 kg)
 *
 * Intl.NumberFormat with `style: 'unit'` handles localisation of the unit
 * label ("0,7 m" vs "0.7 m") and pluralisation rules for free.
 */

const heightCache = new Map<string, Intl.NumberFormat>();
const weightCache = new Map<string, Intl.NumberFormat>();

const heightFormatter = (locale: string): Intl.NumberFormat => {
  const cached = heightCache.get(locale);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'meter',
    unitDisplay: 'short',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  heightCache.set(locale, fmt);
  return fmt;
};

const weightFormatter = (locale: string): Intl.NumberFormat => {
  const cached = weightCache.get(locale);
  if (cached) return cached;
  const fmt = new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilogram',
    unitDisplay: 'short',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });
  weightCache.set(locale, fmt);
  return fmt;
};

export const formatHeight = (decimetres: number, locale: string): string =>
  heightFormatter(locale).format(decimetres / 10);

export const formatWeight = (hectograms: number, locale: string): string =>
  weightFormatter(locale).format(hectograms / 10);
