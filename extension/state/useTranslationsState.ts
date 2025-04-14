import { computed, createSingletonComposable, ref } from 'reactive-vscode'
import { localesConfig } from '../composables'
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

export const useTranslationsState = createSingletonComposable(() => {
  const setSelectedEntry = (newSelectedEntry: TranslationEntry) => {
    selectedEntry.value = newSelectedEntry
  }

  const setTranslationTree = (newTranslationTree: TranslationTree) => {
    translationTree.value = newTranslationTree
  }

  const setLocaleStatistics = (newLocaleStatistics: Record<string, TranslationStatisticsObject>) => {
    localeStatistics.value = newLocaleStatistics
  }

  const updateTranslation = (newEntry: TranslationEntry) => {
    newEntry.hasUntranslated = Object.keys(newEntry.locales).some((key) => {
      return !newEntry.locales[key] && key !== localesConfig.value.sourceLanguage
    })
    const index = translationTree.value?.entries.findIndex(e => e.id === newEntry.id)
    if (index !== undefined) {
      translationTree.value!.entries[index] = newEntry
    }
  }

  return {
    statistics,
    selectedEntry,
    translationTree,
    setSelectedEntry,
    setTranslationTree,
    setLocaleStatistics,
    updateTranslation,
  }
})
