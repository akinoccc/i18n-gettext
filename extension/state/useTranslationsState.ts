import type { TranslationEntry, TranslationStatisticsObject, TranslationTree } from '../../types'
import { computed, createSingletonComposable, ref } from 'reactive-vscode'
import { localesConfig } from '../composables'

export const useTranslationsState = createSingletonComposable(() => {
  const selectedEntry = ref<TranslationEntry>()
  const translationTree = ref<TranslationTree>()
  const localeStatistics = ref<Record<string, TranslationStatisticsObject>>()
  const statistics = computed(() => {
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

  const getEntryById = (id: string) => {
    return translationTree.value?.entries.find(e => e.id === id)
  }

  return {
    statistics,
    selectedEntry,
    translationTree,
    setSelectedEntry,
    setTranslationTree,
    setLocaleStatistics,
    updateTranslation,
    getEntryById,
  }
})
