import { computed, ref } from 'reactive-vscode'
import { logger } from '../utils/logger'

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
  timestamp: number
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

const selectedEntry = ref<TranslationEntry>()
const translationTree = ref<TranslationTree>()
const localeStatistics = ref<Record<string, TranslationStatisticsObject>>()
const statistics = computed(() => {
  logger.info('test', JSON.stringify(localeStatistics.value))
  if (!translationTree.value)
    return

  return {
    totalEntries: translationTree.value.entries.length,
    translatedEntries: Object.values(localeStatistics.value || {}).reduce(
      (acc, locale) => acc + (locale.translated || 0),
      0,
    ),
    untranslatedEntries: Object.values(localeStatistics.value || {}).reduce(
      (acc, locale) => acc + (locale.untranslated || 0),
      0,
    ),
    locales: localeStatistics.value,
  }
})
export function useTranslationsState() {
  const setSelectedEntry = (newSelectedEntry: TranslationEntry) => {
    selectedEntry.value = newSelectedEntry
  }

  const setTranslationTree = (newTranslationTree: TranslationTree) => {
    translationTree.value = newTranslationTree
  }

  const setLocaleStatistics = (newLocaleStatistics: Record<string, TranslationStatisticsObject>) => {
    localeStatistics.value = newLocaleStatistics
  }

  return {
    statistics,
    selectedEntry,
    translationTree,
    setSelectedEntry,
    setTranslationTree,
    setLocaleStatistics,
  }
}
