import type { LocaleIdentifier } from '../../types'

const localesMap: Record<string, LocaleIdentifier> = {
  en: {
    name: 'English',
    code: 'en',
    flag: '🇺🇸',
  },
  zh: {
    name: '中文',
    code: 'zh',
    flag: '🇨🇳',
  },
  es: {
    name: 'Español',
    code: 'es',
    flag: '🇪🇸',
  },
  fr: {
    name: 'Français',
    code: 'fr',
    flag: '🇫🇷',
  },
  de: {
    name: 'Deutsch',
    code: 'de',
    flag: '🇩🇪',
  },
  ja: {
    name: '日本語',
    code: 'ja',
    flag: '🇯🇵',
  },
  ko: {
    name: '한국어',
    code: 'ko',
    flag: '🇰🇷',
  },
  ru: {
    name: 'Русский',
    code: 'ru',
    flag: '🇷🇺',
  },
}

export function useLocale(code: string): { locale: LocaleIdentifier | undefined } {
  // Get localized information for a specific language code
  const locale = localesMap[code]

  return {
    locale,
  }
}
