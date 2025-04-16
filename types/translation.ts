// 翻译条目类型
export interface TranslationEntry {
  id: string // 唯一标识
  references: string[] // 引用位置
  msgctxt: string // 上下文
  locales: Record<string, string> // 翻译列表（按语言代码索引）
  hasUntranslated: boolean // 是否存在未翻译的条目
}

// 翻译树类型
export interface TranslationTree {
  entries: TranslationEntry[]
  locales: string[] // 可用的语言列表
}

// PO数据类型定义
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
