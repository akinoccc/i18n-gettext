import type { TranslationEntry } from 'types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { useVscodeApi } from './useVscodeApi'

const translationEntry = ref<TranslationEntry>({
  id: 'this is a test',
  references: [],
  msgctxt: '',
  locales: {
    en: 'this is a test',
    zh: '',
  },
  hasUntranslated: false,
})

export function useTranslationEntry() {
  const vscodeApi = useVscodeApi()
  const sourceLanguage = ref('')

  // Save translation content
  function saveTranslation(locale: string, value: string) {
    if (!translationEntry.value)
      return

    // Update local state
    translationEntry.value.locales[locale] = value

    // Send update to VSCode extension
    vscodeApi.postMessage({
      type: WebViewMessageType.UPDATE_TRANSLATION,
      data: {
        entry: JSON.stringify(translationEntry.value),
        locale,
        value,
      },
    })
  }

  // Jump to reference location
  function goToReference(reference: string) {
    vscodeApi.postMessage({
      type: WebViewMessageType.GO_TO_REFERENCE,
      data: {
        reference,
      },
    })
  }

  function updateTranslationEntry(langCode: string, value: string) {
    if (!translationEntry.value)
      return

    translationEntry.value.locales[langCode] = value
  }

  // Set up message listeners
  function setupMessageListeners() {
    // Listen for translation entry selection
    vscodeApi.on(WebViewMessageType.SELECT_ENTRY, (entry: TranslationEntry & { sourceLanguage: string }) => {
      translationEntry.value = entry
      sourceLanguage.value = entry.sourceLanguage
    })
  }

  return {
    translationEntry,
    sourceLanguage,
    saveTranslation,
    goToReference,
    setupMessageListeners,
    updateTranslationEntry,
  }
}
