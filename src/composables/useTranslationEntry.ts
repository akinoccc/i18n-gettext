import type { TranslationEntry } from '../../typings'
import { useTranslationStore } from '@/store/translation'
import { storeToRefs } from 'pinia'
import { WebViewMessageType } from '../../constants'
import { vscodeApi } from '../utils'

export function useTranslationEntry() {
  const { selectedEntries } = storeToRefs(useTranslationStore())

  // Save translation content
  function saveTranslation(entry: TranslationEntry, locale: string, value: string) {
    if (!entry)
      return

    // Check if the value has actually changed
    const currentValue = entry.locales[locale] || ''
    if (currentValue === value) {
      // Value hasn't changed, no need to save
      return
    }

    // Update local state
    entry.locales[locale] = value

    selectedEntries.value.forEach((e, i) => {
      if (e.id === entry.id && e.msgctxt === entry.msgctxt) {
        selectedEntries.value[i].locales[locale] = value
      }
    })

    vscodeApi.setState(JSON.stringify(selectedEntries.value))

    // Send update to VSCode extension
    vscodeApi.postMessage({
      type: WebViewMessageType.UPDATE_TRANSLATION,
      data: {
        entry: JSON.stringify(entry),
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

  return {
    saveTranslation,
    goToReference,
  }
}
