// Translation entry type
export interface TranslationEntry {
  id: string // Unique identifier
  references: string[] // Reference locations
  msgctxt: string // Context
  locales: Record<string, string> // Translation list (indexed by language code)
  hasUntranslated: boolean // Whether there are untranslated entries
}

// Translation tree type
export interface TranslationTree {
  entries: TranslationEntry[]
  locales: string[] // Available language list
}

// PO data type definition
export interface PoTranslation {
  comments: {
    reference: string
  }
  msgid: string
  msgstr: string[]
  msgctxt: string
  //   [key: string]: any;
}

export interface PoContext {
  [msgid: string]: PoTranslation
}

export interface PoData {
  charset: string
  headers: Record<string, string>
  translations: {
    [context: string]: PoContext
  }
}

export interface TranslationStatisticsObject {
  translated: number
  untranslated: number
  total: number
}

export interface TranslationStatistics {
  totalEntries: number
  translatedEntries: number
  untranslatedEntries: number
  locales: Record<string, TranslationStatisticsObject>
}
