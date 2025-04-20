import type { TranslationEntry } from '../../../types'
import { createSingletonComposable } from 'reactive-vscode'
import * as vscode from 'vscode'
import { TranslationEditorProvider, useEntryListTreeView } from '../../providers'
import { logger } from '../../utils'
import { useTranslationsState } from '../state'
import { useTranslationEntries } from '../state/useTranslationEntries'

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
   * Filter all entries
   */
  function filterAllEntries(): void {
    entryListTreeView.setFilterType('all')
  }

  /**
   * Filter translated entries
   */
  function filterTranslatedEntries(): void {
    entryListTreeView.setFilterType('translated')
  }

  /**
   * Filter untranslated entries
   */
  function filterUntranslatedEntries(): void {
    entryListTreeView.setFilterType('untranslated')
  }

  /**
   * Select a translation entry and open it in the editor
   * @param context Extension context
   * @param entry Translation entry to select
   */
  function selectEntry(context: vscode.ExtensionContext, entry: TranslationEntry) {
    // Set the selected entry in the state
    useTranslationsState().setSelectedEntry(entry)
    // Render the editor panel and ensure it's focused
    const panel = TranslationEditorProvider.render(context)

    // Ensure the WebView panel gets focus
    if (panel) {
      panel._panel.reveal(vscode.ViewColumn.Beside, true) // Second parameter true ensures focus
    }
  }

  /**
   * Open the translation editor
   * @param context Extension context
   */
  function openTranslationEditor(context: vscode.ExtensionContext): void {
    const panel = TranslationEditorProvider.render(context)

    // Ensure the WebView panel gets focus
    if (panel) {
      panel._panel.reveal(vscode.ViewColumn.Beside, true)
    }
  }

  /**
   * Navigate to the next untranslated entry
   */
  function nextUntranslatedEntry(context: vscode.ExtensionContext): void {
    const { selectedEntry, translationTree } = useTranslationsState()
    const translationEntries = useTranslationEntries()

    // If there's no translation tree or no entries, show a message and return
    if (!translationTree.value || !translationTree.value.entries.length) {
      logger.info(vscode.l10n.t('No translation entries available'))
      vscode.window.showInformationMessage(vscode.l10n.t('No translation entries available'))
      return
    }

    // Get all untranslated entries
    const untranslatedEntries = translationEntries.filteredEntries.value.filter(entry => entry.hasUntranslated)

    // If there are no untranslated entries, show a message and return
    if (!untranslatedEntries.length) {
      logger.info(vscode.l10n.t('No untranslated entries found'))
      vscode.window.showInformationMessage(vscode.l10n.t('No untranslated entries found'))
      return
    }

    // If there's no selected entry, select the first untranslated entry
    if (!selectedEntry.value) {
      logger.info(vscode.l10n.t('Selecting first untranslated entry'))
      selectEntry(context, untranslatedEntries[0])
      return
    }

    // Find the index of the current selected entry in the untranslated entries
    const currentIndex = untranslatedEntries.findIndex(entry => entry.id === selectedEntry.value?.id)

    // If the current entry is not found or it's the last one, select the first untranslated entry
    if (currentIndex === -1 || currentIndex === untranslatedEntries.length - 1) {
      logger.info(vscode.l10n.t('Selecting first untranslated entry'))
      selectEntry(context, untranslatedEntries[0])
    }
    else {
      // Select the next untranslated entry
      logger.info(vscode.l10n.t('Selecting next untranslated entry'))
      selectEntry(context, untranslatedEntries[currentIndex + 1])
    }
  }

  return {
    searchEntries,
    clearSearch,
    filterAllEntries,
    filterTranslatedEntries,
    filterUntranslatedEntries,
    selectEntry,
    openTranslationEditor,
    nextUntranslatedEntry,
  }
})
