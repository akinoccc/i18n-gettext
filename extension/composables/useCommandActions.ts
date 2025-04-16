import type { TranslationEntry } from '../../types'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../providers'
import { useTranslationsState } from '../state'

/**
 * Command operation composable function
 */
export const useCommandActions = createSingletonComposable(() => {
  const entryListTreeView = useEntryListTreeView()

  /**
   * Search translation entries
   */
  async function searchEntries(): Promise<void> {
    const searchQuery = await vscode.window.showInputBox({
      placeHolder: vscode.l10n.t('Enter keywords to search translation entries'),
      prompt: vscode.l10n.t('Search in translation entries'),
    })

    if (searchQuery) {
      entryListTreeView.setSearchText(searchQuery)
    }
  }

  /**
   * Clear search
   */
  function clearSearch(): void {
    entryListTreeView.setSearchText('')
  }

  function selectEntry(context: vscode.ExtensionContext, entry: TranslationEntry) {
    TranslationEditorProvider.render(context)
    useTranslationsState().setSelectedEntry(entry)
  }

  return {
    searchEntries,
    clearSearch,
    selectEntry,
  }
})
