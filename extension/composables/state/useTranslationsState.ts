import type { TranslationEntry, TranslationStatisticsObject, TranslationTree } from '../../../typings'
import { computed, createSingletonComposable, ref } from 'reactive-vscode'
import { WebViewMessageType } from '../../../constants'
import { useTranslationEditorProvider } from '../../providers'
import { useVscodeConfig } from '../config'
import { useWebview } from './useWebview'

export const useTranslationsState = createSingletonComposable(() => {
  const translatorMode = ref<'single' | 'batch'>('single')
  const setTranslatorMode = (mode: 'single' | 'batch') => {
    translatorMode.value = mode
  }

  const selectedEntries = ref<TranslationEntry[]>()
  const translationTree = ref<TranslationTree>()
  const localeStatistics = ref<Record<string, TranslationStatisticsObject>>()
  const { localesConfig, translatorConfig } = useVscodeConfig()
  const { render: renderWebview } = useTranslationEditorProvider()

  const untranslatedEntries = computed(() => {
    const entries = translationTree.value?.entries?.filter(e => e.hasUntranslated) || []
    return entries.slice(0, 2)
  })

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

  const sendUpdateSelectedEntriesMessage = () => {
    renderWebview()
    const { webview } = useWebview()
    webview.value?.postMessage({
      type: WebViewMessageType.UPDATE_SELECTED_ENTRY,
      data: {
        selectedEntries: JSON.stringify(selectedEntries.value),
        mode: translatorMode.value,
      },
    })
  }

  const setSingleSelectedEntry = (newSelectedEntry: TranslationEntry) => {
    setTranslatorMode('single')
    selectedEntries.value = [newSelectedEntry]
    sendUpdateSelectedEntriesMessage()
  }

  const setBatchSelectedEntries = () => {
    setTranslatorMode('batch')
    selectedEntries.value = untranslatedEntries.value
    sendUpdateSelectedEntriesMessage()
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
    const index = translationTree.value?.entries.findIndex(e =>
      e.id === newEntry.id
      && e.msgctxt === newEntry.msgctxt,
    )
    if (index !== undefined) {
      translationTree.value!.entries[index] = newEntry
    }
  }

  const getEntryById = (id: string) => {
    return translationTree.value?.entries.find(e => e.id === id)
  }

  return {
    translatorMode,
    setTranslatorMode,
    statistics,
    selectedEntries,
    untranslatedEntries,
    translationTree,
    setSingleSelectedEntry,
    setBatchSelectedEntries,
    setTranslationTree,
    setLocaleStatistics,
    updateTranslation,
    getEntryById,
  }
})
