export interface LocaleIdentifier {
  name: string
  code: string
  flag: string
}

export interface TranslationEntry {
  id: string
  references: string[]
  msgctxt: string
  locales: Record<string, string>
  hasUntranslated: boolean
}

export interface AITranslateResultData {
  error?: string
  targetLanguage?: string
  result?: string
}

export interface AIBatchTranslateResultData {
  error?: string
  results?: Record<string, string>
}

export interface AIModelConfig {
  id: string
  label: string
}


