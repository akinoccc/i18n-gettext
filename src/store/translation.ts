import type { TranslationEntry } from 'types'
import { defineStore } from 'pinia'
import { ref } from 'vue'

export enum TranslationState {
  None,
  Translating,
  Translated,
  Failed,
}

export interface TranslationEntryWithState extends TranslationEntry {
  localesState: Record<string, {
    ai: TranslationState
    machine: TranslationState
  }>
}

export const useTranslationStore = defineStore('translation', () => {
  const selectedEntries = ref<TranslationEntryWithState[]>([])

  const initEntriesState = () => {
    selectedEntries.value = selectedEntries.value.map((entry) => {
      entry.localesState = {}
      Object.keys(entry.locales).forEach((code) => {
        entry.localesState[code] = {
          ai: TranslationState.None,
          machine: TranslationState.None,
        }
      })
      return entry
    })
  }

  const setLocaleState = (option: {
    entry?: Pick<TranslationEntry, 'id' | 'msgctxt'>
    state: TranslationState
    locales?: string[]
    type: 'ai' | 'machine' | 'all'
  }) => {
    for (let i = 0; i < selectedEntries.value.length; i++) {
      if (
        option.entry
        && (selectedEntries.value[i].id !== option.entry.id
          || selectedEntries.value[i].msgctxt !== option.entry.msgctxt)
      ) {
        continue
      }
      if (option.locales) {
        option.locales.forEach((l) => {
          selectedEntries.value[i].localesState[l].ai = TranslationState.None
          selectedEntries.value[i].localesState[l].machine = TranslationState.None
          if (option.type === 'all') {
            selectedEntries.value[i].localesState[l].ai = option.state
            selectedEntries.value[i].localesState[l].machine = option.state
          }
          else {
            selectedEntries.value[i].localesState[l][option.type] = option.state
          }
        })
      }
      else {
        Object.keys(selectedEntries.value[i].localesState).forEach((l) => {
          selectedEntries.value[i].localesState[l].ai = TranslationState.None
          selectedEntries.value[i].localesState[l].machine = TranslationState.None
          if (option.type === 'all') {
            selectedEntries.value[i].localesState[l].ai = option.state
            selectedEntries.value[i].localesState[l].machine = option.state
          }
          else {
            selectedEntries.value[i].localesState[l][option.type] = option.state
          }
        })
      }
      break
    }
  }

  const setSelectedEntries = (entries: TranslationEntry[]) => {
    selectedEntries.value = entries as TranslationEntryWithState[]
    initEntriesState()
  }

  return {
    setLocaleState,
    selectedEntries,
    setSelectedEntries,
  }
})
