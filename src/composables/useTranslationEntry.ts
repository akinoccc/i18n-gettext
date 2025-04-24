import type { TranslationEntry } from '../../types'
import { ref } from 'vue'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'

const sourceLanguage = ref('')
const translationEntry = ref<TranslationEntry>()

// 创建事件总线用于跨组合函数通信
interface TranslationEventHandlers {
  onEntryChange: (() => void)[]
}

const eventHandlers: TranslationEventHandlers = {
  onEntryChange: [],
}

export function registerTranslationEventHandler(event: keyof TranslationEventHandlers, handler: () => void) {
  eventHandlers[event].push(handler)
}

export function useTranslationEntry() {
  // Save translation content
  function saveTranslation(locale: string, value: string) {
    if (!translationEntry.value)
      return

    // Check if the value has actually changed
    const currentValue = translationEntry.value.locales[locale] || ''
    if (currentValue === value) {
      // Value hasn't changed, no need to save
      return
    }

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
    vscodeApi.setState(JSON.stringify(translationEntry.value))
  }

  // Set up message listeners
  function setupMessageListeners() {
    // Listen for translation entry selection
    vscodeApi.on(WebViewMessageType.SELECT_ENTRY, (entry: TranslationEntry & { sourceLanguage: string }) => {
      translationEntry.value = entry
      sourceLanguage.value = entry.sourceLanguage
      vscodeApi.setState(JSON.stringify(entry))

      // 触发条目变更事件
      eventHandlers.onEntryChange.forEach(handler => handler())
    })
  }

  return {
    translationEntry,
    sourceLanguage,
    saveTranslation,
    goToReference,
    setupMessageListeners,
    updateTranslationEntry,
    registerOnEntryChange: (handler: () => void) => registerTranslationEventHandler('onEntryChange', handler),
  }
}
