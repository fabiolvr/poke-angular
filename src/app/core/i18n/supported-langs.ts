export const SUPPORTED_LANGS = ['pt-BR', 'en'] as const;
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: SupportedLang = 'pt-BR';

export const isSupportedLang = (value: unknown): value is SupportedLang =>
  typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
