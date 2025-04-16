import type { ExtensionContext } from 'vscode'

import type { TranslationEntry } from '../../types'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../providers'
import { useTranslationsState } from '../state'
import { useMessageHandler } from './useMessageHandler'
import { useModelConfig } from './useModelConfig'

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

  /**
   * Handle select entry command
   * @param entry Translation entry
   */
  async function handleSelectEntry(context: ExtensionContext, entry: TranslationEntry) {
    useTranslationsState().setSelectedEntry(entry)

    // Render editor
    TranslationEditorProvider.render(context)

    const modelConfig = await useModelConfig()
    const webview = TranslationEditorProvider.currentPanel?._panel.webview

    if (!webview) {
      return
    }

    // Send model configuration to WebView
    modelConfig.sendModelConfigToWebview(webview)

    // Send select entry message
    if (TranslationEditorProvider.currentPanel) {
      useMessageHandler().sendSelectEntryMessage(
        TranslationEditorProvider.currentPanel._panel.webview,
        entry,
      )
    }
  }

  return {
    searchEntries,
    clearSearch,
    handleSelectEntry,
  }
})
