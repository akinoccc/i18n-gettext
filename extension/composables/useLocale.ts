import { localesMap } from '../../constants'

export function useLocale(code: string) {
  const codeMap = new Map<string, string>()

  localesMap.forEach((locale) => {
    codeMap.set(locale.code, locale.code)
    locale.alias.forEach(alias => codeMap.set(alias, locale.code))
  })

  const realCode = codeMap.get(code)
  if (!realCode) {
    return {
      locale: null,
    }
  }

  const locale = localesMap.find(locale => locale.code === realCode)

  return {
    locale,
  }
}
